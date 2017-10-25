import urllib.request

def GetAuroraData():
    r = urllib.request.get("http://aurorasnow.fmi.fi/public_service/textfiles/NUR/latest.txt")

    return content

# Palauttaa saatiedot .xml-tiedostossa
def GetWeather():
    return urllib.request.urlopen("https://www.yr.no/place/Finland/S%C3%B6dra_Finland/Nurmij%C3%A4rvi/forecast_hour_by_hour.xml").read()


#Täällä haetaan fmi:ltä data ja parsitaan se unix aikaan ja jsoni muotoon
def GetAuroras():
    return "{{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},}"

#Täällä Antti katsoo kristallipalloon ennustaa tulevaisuuden
def GetAurorasPrediction():
    return "{{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},}"
