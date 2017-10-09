# -*- coding: utf-8 -*-
"""
Created on Mon Oct  2 15:08:55 2017

@author: antti
"""

from sklearn.preprocessing import normalize
from sklearn.model_selection import train_test_split


import numpy as np
import matplotlib.pyplot as plt

def read_data():
    arr = np.zeros((148704, 3))
    file = open("..\\data\\tunninkeksiarvot.csv")
    i = 150000
    for line in file:
        if i == 150000:
            i = 0
            continue
        line = line.split(',')
        for value in line:
            if value == "NaN":
                value = np.nan
        arr[i, :] = [float(line[1]), float(line[2]), float(line[3])]
        i+=1
    return arr
        

def plot_timeseries(series):
    xdata = np.arange(len(series))
    plt.plot(xdata, series[:,0])
    plt.figure()
    plt.plot(xdata, series[:,1])
    plt.figure()
    plt.plot(xdata, series[:,2])


if __name__ == '__main__':
    arr = read_data()
    plot_timeseries(arr)
    plt.show()
