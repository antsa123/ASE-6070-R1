from flask import Flask, render_template, request
import json, urllib2

app = Flask(__name__, static_url_path='')


@app.route('/')
def index():
    # Start page
    return render_template('index.html')

@app.route('/weather')
def get_weather_info():
	# Palauttaa saatiedot .xml-tiedostossa
	return urllib2.urlopen("https://www.yr.no/place/Finland/S%C3%B6dra_Finland/Nurmij%C3%A4rvi/forecast_hour_by_hour.xml").read()


@app.route('/auroras')
def get_auroras():
    return "{{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},}"


@app.route('/aurorasPrediction')
def get_auroras_prediction():
    return "{{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},{time: 124235298, value: 0.54},}"

