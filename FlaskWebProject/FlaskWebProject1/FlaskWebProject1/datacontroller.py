from flask import Flask, jsonify
from FlaskWebProject1 import app

from FlaskWebProject1 import dataservice

import urllib.request
import urllib

@app.route('/api/weather')
def get_weather_info():
    try:
        return dataservice.GetWeather()
    except Exception as e:
        return e

@app.route('/api/auroras')
def get_auroras():
    try:
        return dataservice.GetAuroras()
    except Exception as e:
        return e

@app.route('/api/aurorasprediction')
def get_auroras_prediction():
    try:
        return dataservice.GetAurorasPrediction()
    except Exception as e:
        return e