import numpy as np
import urllib.request

from time import sleep

def nan_helper(y):
    """Apufunktio, jolla haetaan NaNien indeksit.

    Input:
        - y, 1d numpy taulukko, jossa NaNeja
    Output:
        - nans, NaN indexit
        - index, funktio, jolla muutetaan indexit niita vastaaviksi indekseiksi.
    Esim:
        >>> # NaN lineaarinen interpolaatio
        >>> nans, x= nan_helper(y)
        >>> y[nans]= np.interp(x(nans), x(~nans), y[~nans])
    """

    return np.isnan(y), lambda z: z.nonzero()[0]


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

def train2np(filepath, window = 48, horizon = 1, NaN_handling="linear_interp"):
    """Lukee tiedoston polusta ja parsii tiedot numpy taulukoihin, jotka voi syattaa sklearn mallille.
    Input: filepath on tiedoston polku merkkijonona. Kayta suhteellista polkua.
           window kertoo montako edellista tuntia kaytetaan ennustukseen. Kokonaisluku.
           horizon kertoo montako seuraavaa tuntia ennustetaan kerralla. Kokonaisluku."""
    arr = np.loadtxt(filepath, delimiter=',', skiprows=1, usecols=1)
    if NaN_handling == "linear_interp":
        nans, xx = nan_helper(arr)
        arr[nans] = np.interp(xx(nans), xx(~nans), arr[~nans])
    elif NaN_handling == "to_zero":
        arr = np.nan_to_num(arr)
    elif NaN_handling == None:
        pass
    X = []
    y = []
    for i in range(arr.size - (window + horizon)):
        X.append(arr[i:i+window])
        y.append(arr[(i + window):(i + window + horizon)])
    return np.asarray(X), np.asarray(y).ravel()


def get_data():
    r = urllib.request.urlopen("http://aurorasnow.fmi.fi/public_service/textfiles/NUR/latest.txt")
    stringinfo = r.read().decode("utf-8")
    array = parse2np(stringinfo, 2)
    return array


## Suppeat toiminnallisuuden pikatestit, tehdaan, jos ajetaan mainina:
if __name__ == "__main__":
    r = urllib.request.urlopen("http://aurorasnow.fmi.fi/public_service/textfiles/NUR/latest.txt")
    # sleep(1)
    stringinfo = r.read().decode("utf-8")
    # filu = open("Esimerkki.txt")
    array = parse2np(stringinfo, 2)
    # print(array)
    # print(array.shape)
    # print(array.dtype)
    #
    # X, y = train2np("./../data/tunninkeskiarvoistaderivaatta.csv")
    # print(X.shape)
    # print(y.shape)