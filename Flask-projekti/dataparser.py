import numpy as np

def parse2np(fileobject, horizon):
    """Parsii viimeisimmasta tiedostosta luetut rivit numpy taulukoksi, jota kaytetaan ennustuksessa
       Jos filussa ei ole riittavasti paivia, nostaa ValueErrorin
    Input: fileobject on pythonissa avattuna fmi:n sivuilta oleva latest.txt
           horizon on kokonaisluku, joka kertoo kuinka monen paivan tiedot kerataan"""
    strings = []
    for line in fileobject:
        line = line.strip().split("\t")
        strings.append(line[-1].split())
    if len(strings) <  4 + horizon:
        raise ValueError("Ei tarpeeksi tietoja filussa")
    numeric = []
    for ll in strings[-horizon:]:
        numeric.append([int(x) for x in ll])
    return np.asarray(numeric).reshape((horizon * 24,))




## Suppeat toiminnallisuuden pikatestit, kommentoidaan pois julkaisusta.
# filu = open("Esimerkki.txt")
# array = parse2np(filu, 2)
# print(array)
# print(array.shape)
# print(array.dtype)