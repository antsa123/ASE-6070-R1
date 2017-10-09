from flask import Flask, render_template, request
import json

app = Flask(__name__)


@app.route('/')
def index():
    # Start page
    return render_template("TAHAN SUHTEELLINEN POLKU PAASIVUN HTML FILUUN")

@app.route('/weather')
def get_weather_info():
    pass


@app.route('/auroras')
def get_auroras_prediction():
    pass

