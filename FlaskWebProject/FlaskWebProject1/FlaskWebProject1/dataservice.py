import urllib.request
from sklearn import joblib

## MISTA POLUSTA MALLI LUETAAN MODUULIN SISAISESTI GLOBAALIKSI?
classifier = joblib.load('lr_model.pkl')

def GetAuroraData():
    r = urllib.request.urlopen("http://aurorasnow.fmi.fi/public_service/textfiles/NUR/latest.txt")
    ## Tallenna tieto filusta ja dekoodaa se stringiksi.
    info = r.read().decode("utf-8")
    content = parse2np(info)
    return content

# Palauttaa saatiedot .xml-tiedostossa
def GetWeather():
    return urllib.request.urlopen("https://www.yr.no/place/Finland/S%C3%B6dra_Finland/Nurmij%C3%A4rvi/forecast_hour_by_hour.xml").read()


#Täällä haetaan fmi:ltä data ja parsitaan se unix aikaan ja jsoni muotoon
def GetAuroras():
    return "{{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},}"

#Täällä Antti katsoo kristallipalloon ennustaa tulevaisuuden
def GetAurorasPrediction():
    data = GetAuroraData()
    result = predict_sequence(classifier, data)

    return "{{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},}"


def parse2np(stringinfo, horizon):
    """Parsii viimeisimmasta tiedostosta luetut rivit numpy taulukoksi, jota kaytetaan ennustuksessa
       Jos filussa ei ole riittavasti paivia, nostaa ValueErrorin
    Input: stringinfo on pythonissa avattuna fmi:n sivuilta oleva latest.txt, joka on dekoodattu merkkijonoksi
           horizon on kokonaisluku, joka kertoo kuinka monen paivan tiedot kerataan"""
    strings = stringinfo.strip()
    strings = strings.split("\n")
    data = []
    for line in strings:
        line = line.strip().split("\t")
        data.append(line[-1].split())
    if len(data) <  4 + horizon:
        raise ValueError("Ei tarpeeksi tietoja filussa")
    numeric = []
    for ll in data[-horizon:]:
        numeric.append([int(x) for x in ll])
    return np.asarray(numeric).reshape((horizon * 24,))

def predict_sequence(model, window_data, horizon = 48, prediction_len = 1):
    """Ennustetaan window_datasta horizonin verran eteenpain.
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

def wrap_results_to_utc(results):
    """Tekee tuloksista dictin, jossa timestamp:tulos"""
    stamps = {}
    return stamps