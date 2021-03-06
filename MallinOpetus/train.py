import numpy as np
import matplotlib.pyplot as plt

from sklearn.linear_model import LinearRegression
from sklearn.svm import SVR
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.externals import joblib

import datetime

from dataparser import train2np, get_data


def train_and_evalueate(names, models, x_train, y_train, x_test, y_test):
    """Kouluta ja arvioi alustetut mallit
    Input: Mallien nimet listassa
           Mallit objekteina listassa
           Jaettu opetus- ja testidata numpy taulukkoina"""
    scores = {}
    y_pred = {}
    for name, model in zip(names, models):
        print("Training {}".format(name))
        model.fit(x_train,y_train)
        print("Evaluating {}".format(name))
        y_pred[name] = model.predict(x_test)
        scores[name] = mean_absolute_error(y_test, y_pred[name])
    return models, scores

def predict_sequence(model, window_data, horizon = 48, prediction_len = 1):
    """Testaamiseen kaytetty funktio, jolla ennustetaan window_datasta horizonin verran eteenpain.
       Voidaan kayttaa myos webservicessa palauttamaan haluttu ennuste.
    Input: model sklearn tai vastaavan rajapinnan omaava objekti ennustamiseen
           window_data numpy taulukko, jossa ennustamiseen kaytetty data.
           horizon kokonaisluku, joka kertoo montako tuntia eteenpain ennustetaan
           prediction_len kokonaisluku, joka kertoo montako tuntia eteenpain ennustetaan kerralla."""
    results = np.zeros((horizon * prediction_len,))
    current = np.copy(window_data)
    for i in range(0,horizon,prediction_len):
        results[i] = model.predict(current.reshape(1, -1))
        current = current[prediction_len:]
        current = np.insert(current, len(window_data) - 1, results[i])
    return results

def predict_full_data(model, train_data, horizon = 48, prediction_len = 1):
    """Ennustaa jokaisen opetusdataesimerkin jalkeen horizonin verran eteenpain"""
    predictions = [np.zeros(train_data[0].shape)]
    for i in range(len(train_data)):
        pred = predict_sequence(model, train_data[i], horizon, prediction_len)
        predictions.append(pred)
    return np.asarray(predictions).ravel()


def plot_results(names, models, train_data, window_size = 48, horizon = 48):
    """Plotataan ennustetta halutun verran eteenpain valituista pisteista. Testataan mallin toimintaa
    Input: names, mallien nimet merkkijonoina listassa.
           models, sklearn tai vastaavat mallit
           train_data aikasarja data, jolla testataan ja johon verrataan
           window_size kokonaisluku, joka kertoo montako tuntia kaytetaan ennustuksessa
           horizon """
    predicted_sequences = {}
    for name, model in zip(names, models):
        fig = plt.figure()
        fig.suptitle(name)
        ax = fig.add_subplot(111)
        print("Plotting full data")
        ax.plot(train_data.ravel(), label="True data")
        fig.hold(True)
        print("Predicting and plotting predictions")
        ax.plot(predict_full_data(model, train_data), label="Predicted data")
        handles, labels = ax.get_legend_handles_labels()
        ax.legend(handles, labels)
    plt.show()

def wrap_results_to_utc(results, zone):
    """Tekee tuloksista dictin, jossa timestamp:tulos"""

    today = datetime.datetime.now()
    today = datetime.datetime(year=today.year, month=today.month, day=today.day, hour=0, minute=0)
    print(today.strftime("%d.%m.%y---%H:%M"))
    tomorrow = (today + datetime.timedelta(hours=1))
    print(tomorrow.strftime("%d.%m.%y---%H:%M"))
    if zone == "history":
        dates = [(today + datetime.timedelta(hours=x)) for x in range(-47,1)]
    elif zone == "prediction":
        dates = [(today + datetime.timedelta(hours=x)) for x in range(1,49)]
    else:
        dates = []
    stamps = {}
    i = 0
    for date in dates:
        stamps[date.strftime("%Y-%m-%dT%H:%M:%S")] = results[i]
        i += 1
    return stamps


if __name__ == "__main__":
    # ## Alustetaan mallit listaan. Mallien tulee tayttaa sklearnin kaltainen .fit(data) ja .predict(data) rajapinta.
    # models = [LinearRegression()]#, RandomForestRegressor(n_estimators=10, verbose=10, n_jobs=1)]
    # names = ["LR"]#, "RF"]
    # print("Reading data")
    # ## Haetaan opetusdata tiedostosta
    # X, y = train2np("./../data/tunninminmax.csv")
    # print("Data read. Training...")
    # ## Jaa data opetus ja testaus dataan
    # x_train, x_test, y_train, y_test = train_test_split(X,y, test_size=0.25)
    # ## Kouluta mallit ja arvioi niiden tarkkuutta
    # models, scores = train_and_evalueate(names, models, x_train, y_train, x_test, y_test)
    # print(scores)
    # ## Tarkastele graafisesti ennustusten toimivuutta
    # plot_results(names, models, X[int(0.99*len(X)):])
    #
    # joblib.dump(models[0], "lr_model.pkl")
    model =joblib.load('lr_model.pkl')

    data = get_data()
    results = predict_sequence(model, data)
    dictionary = {"history":{}, "prediction":{}}
    dictionary["history"] = wrap_results_to_utc(data, "history")
    dictionary["prediction"] = wrap_results_to_utc(results, "prediction")
    print(dictionary)




