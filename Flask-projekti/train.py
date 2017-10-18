import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.svm import SVR
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from dataparser import train2np


def train_and_evalueate(names, models, x_train, y_train, x_test, y_test):
    scores = {}
    for name, model in zip(names, models):
        print("Training {}".format(name))
        model.fit(x_train,y_train)
        print("Evaluating {}".format(name))
        y_pred = model.predict(x_test)
        scores[name] = mean_absolute_error(y_test, y_pred)
    return models, scores

if __name__ == "__main__":
    models = [LinearRegression(), SVR(verbose=1)]
    names = ["LR", "SVM"]
    print("Reading data")
    X, y = train2np("./../data/tunninkeskiarvoistaderivaatta.csv")
    print("Data read. Training...")
    x_train, x_test, y_train, y_test = train_test_split(X,y, test_size=0.25, random_state=42)
    models, scores = train_and_evalueate(names, models, x_train, y_train, x_test, y_test)
    print(scores)
