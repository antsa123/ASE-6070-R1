/**
 * This is a complex demo of how to set up a Highcharts chart, coupled to a
 * dynamic source and extended by drawing image sprites, wind arrow paths
 * and a second grid on top of the chart. The purpose of the demo is to inpire
 * developers to go beyond the basic chart types and show how the library can
 * be extended programmatically. This is what the demo does:
 *
 * - Loads weather forecast from www.yr.no in form of an XML service. The XML
 *   is translated on the Higcharts website into JSONP for the sake of the demo
 *   being shown on both our website and JSFiddle.
 * - When the data arrives async, a Meteogram instance is created. We have
 *   created the Meteogram prototype to provide an organized structure of the different
 *   methods and subroutines associated with the demo.
 * - The parseYrData method parses the data from www.yr.no into several parallel arrays. These
 *   arrays are used directly as the data option for temperature, precipitation
 *   and air pressure. As the temperature data gives only full degrees, we apply
 *   some smoothing on the graph, but keep the original data in the tooltip.
 * - After this, the options structure is build, and the chart generated with the
 *   parsed data.
 * - In the callback (on chart load), we weather icons on top of the temperature series.
 *   The icons are sprites from a single PNG image, placed inside a clipped 30x30
 *   SVG <g> element. VML interprets this as HTML images inside a clipped div.
 * - Lastly, the wind arrows are built and added below the plot area, and a grid is
 *   drawn around them. The wind arrows are basically drawn north-south, then rotated
 *   as per the wind direction.
 */

function Meteogram() {
    // Parallel arrays for the chart data, these are populated as the XML/JSON file
    // is loaded
    this.symbols = [];
    this.symbolNames = [];
    this.timeSymbols = {};
    this.precipitations = [];
    this.winds = [];
    this.temperatures = [];
    this.pressures = [];
    this.aurorasHistory = [];
    this.aurorasPrediction = [];

    this.sunSetTime;
    this.sunRiseTime;
    this.magneticFieldRateLimit = 30; //Kuinka iso magneettikentan muutosnopeus vaaditaan
    this.clearSkyList = ["Clear sky", "Partly cloudy", "Fair"]; // Lista pilvisyyksista jolloin revontulia mahdollisuus nahda
    this.hoursBetweenSunAndDark = 2;//Kuinka monta tuntia taytyy kulua ennen / jalkeen aurinkonlaskun  
    this.nextOpportunity = null;

    this.lightLevel = [];

    // Initialize
    this.xml = [];
    this.container = '';

    // Run
    //this.parseYrData();

    //Katsotaan onko parametreina annettu threshold
    var query = location.search.substring(1);
    var qs = parse_query_string(query);
    if (qs.threshold) {
        this.magneticFieldRateLimit = qs.threshold
    }

    function parse_query_string(query) {
        var vars = query.split("&");
        var query_string = {};
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = decodeURIComponent(pair[1]);
                // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
                query_string[pair[0]] = arr;
                // If third or later entry with this name
            } else {
                query_string[pair[0]].push(decodeURIComponent(pair[1]));
            }
        }
        return query_string;
    }

}
/**
 * Return weather symbol sprites as laid out at http://om.yr.no/forklaring/symbol/
 */
Meteogram.prototype.getSymbolSprites = function (symbolSize) {
    return {
        '01d': {
            x: 0,
            y: 0
        },
        '01n': {
            x: symbolSize,
            y: 0
        },
        '16': {
            x: 2 * symbolSize,
            y: 0
        },
        '02d': {
            x: 0,
            y: symbolSize
        },
        '02n': {
            x: symbolSize,
            y: symbolSize
        },
        '03d': {
            x: 0,
            y: 2 * symbolSize
        },
        '03n': {
            x: symbolSize,
            y: 2 * symbolSize
        },
        '17': {
            x: 2 * symbolSize,
            y: 2 * symbolSize
        },
        '04': {
            x: 0,
            y: 3 * symbolSize
        },
        '05d': {
            x: 0,
            y: 4 * symbolSize
        },
        '05n': {
            x: symbolSize,
            y: 4 * symbolSize
        },
        '18': {
            x: 2 * symbolSize,
            y: 4 * symbolSize
        },
        '06d': {
            x: 0,
            y: 5 * symbolSize
        },
        '06n': {
            x: symbolSize,
            y: 5 * symbolSize
        },
        '07d': {
            x: 0,
            y: 6 * symbolSize
        },
        '07n': {
            x: symbolSize,
            y: 6 * symbolSize
        },
        '08d': {
            x: 0,
            y: 7 * symbolSize
        },
        '08n': {
            x: symbolSize,
            y: 7 * symbolSize
        },
        '19': {
            x: 2 * symbolSize,
            y: 7 * symbolSize
        },
        '09': {
            x: 0,
            y: 8 * symbolSize
        },
        '10': {
            x: 0,
            y: 9 * symbolSize
        },
        '11': {
            x: 0,
            y: 10 * symbolSize
        },
        '12': {
            x: 0,
            y: 11 * symbolSize
        },
        '13': {
            x: 0,
            y: 12 * symbolSize
        },
        '14': {
            x: 0,
            y: 13 * symbolSize
        },
        '15': {
            x: 0,
            y: 14 * symbolSize
        },
        '20d': {
            x: 0,
            y: 15 * symbolSize
        },
        '20n': {
            x: symbolSize,
            y: 15 * symbolSize
        },
        '20m': {
            x: 2 * symbolSize,
            y: 15 * symbolSize
        },
        '21d': {
            x: 0,
            y: 16 * symbolSize
        },
        '21n': {
            x: symbolSize,
            y: 16 * symbolSize
        },
        '21m': {
            x: 2 * symbolSize,
            y: 16 * symbolSize
        },
        '22': {
            x: 0,
            y: 17 * symbolSize
        },
        '23': {
            x: 0,
            y: 18 * symbolSize
        }
    };
};


/**
 * Function to smooth the temperature line. The original data provides only whole degrees,
 * which makes the line graph look jagged. So we apply a running mean on it, but preserve
 * the unaltered value in the tooltip.
 */
Meteogram.prototype.smoothLine = function (data) {
    var i = data.length,
        sum,
        value;

    while (i--) {
        data[i].value = value = data[i].y; // preserve value for tooltip

        // Set the smoothed value to the average of the closest points, but don't allow
        // it to differ more than 0.5 degrees from the given value
        sum = (data[i - 1] || data[i]).y + value + (data[i + 1] || data[i]).y;
        data[i].y = Math.max(value - 0.5, Math.min(sum / 3, value + 0.5));
    }
};

/**
 * Callback function that is called from Highcharts on hovering each point and returns
 * HTML for the tooltip.
 */
Meteogram.prototype.tooltipFormatter = function (tooltip) {

    //console.log(tooltip);

    var tekstinVari = '#3522d4';
    var revontuletTeksti = 'Opportunity to see northern lights!';
    var saaTeksti = 'Weather';

    // Create the header with reference to the time interval
    var index = tooltip.points[0].point.index,
        ret = '<small>' + Highcharts.dateFormat('%A, %b %e, %H:%M', tooltip.x) + '-' +
            Highcharts.dateFormat('%H:%M', tooltip.points[0].point.to) + '</small><br>';
    /*
    // Symbol text ( jos asetettu)
    if ( tooltip.points[0].point.symbolName ) {
        ret += '<b>' + tooltip.points[0].point.symbolName + '</b>';
    }
    */

    //Otsikoksi revontulien nakyvyys
    if (tooltip.points[0].point.aurorasVisible && tooltip.points[0].point.aurorasVisible == true) {
        ret += '<b>' + '<tr><td style="color:' + tekstinVari + '">' + revontuletTeksti + '</td></tr>' + '</b>';
    }


    ret += '<table>';

    // Add all series
    Highcharts.each(tooltip.points, function (point) {
        var series = point.series;
        ret += '<tr><td><span style="color:' + series.color + '">\u25CF</span> ' + series.name +
            ': </td><td style="white-space:nowrap">' + Highcharts.pick(point.point.value, point.y) +
            series.options.tooltip.valueSuffix + '</td></tr>';
    });

    // Lisataan saatiedot jos olemassa
    if (tooltip.points[0].point.symbolName) {
        //ret += '<tr><td><span>\u25CF</span> ' + tooltip.points[0].point.symbolName + '</td></tr>';
        ret += '<tr><td><span>\u25CF</span> ' + saaTeksti +
            ': </td><td style="white-space:nowrap">' + tooltip.points[0].point.symbolName + '</td></tr>';
    }

    // Close
    ret += '</table>';


    return ret;
};

/**
 * Draw the weather symbols on top of the temperature series. The symbols are sprites of a single
 * file, defined in the getSymbolSprites function above.
 */
Meteogram.prototype.drawWeatherSymbols = function (chart) {
    var meteogram = this,
        symbolSprites = this.getSymbolSprites(30);

    $.each(chart.series[0].data, function (i, point) {
        var sprite,
            group;

        //Piirretaan symbolit kolmen tunnin valein
        if (meteogram.resolution > 36e5 || i % 3 === 0) {

            //sprite = symbolSprites[meteogram.symbols[i]];
            sprite = symbolSprites[point.symbolValue];
            if (sprite) {

                // Create a group element that is positioned and clipped at 30 pixels width and height
                group = chart.renderer.g()
                    .attr({
                        translateX: point.plotX + chart.plotLeft - 15,
                        translateY: point.plotY + chart.plotTop - 30,
                        zIndex: 5
                    })
                    .clip(chart.renderer.clipRect(0, 0, 30, 30))
                    .add();

                // Position the image inside it at the sprite position
                chart.renderer.image(
                    'https://www.highcharts.com/samples/graphics/meteogram-symbols-30px.png',
                    -sprite.x,
                    -sprite.y,
                    90,
                    570
                )
                    .add(group);
            }
        }
    });
};



/**
 * Get the title based on the XML data
 */
Meteogram.prototype.getTitle = function () {
    return 'Northern lights in ' + this.xml.location.name['#text'] + ', ' + this.xml.location.country['#text'];
};

/**
 * Build and return the Highcharts options structure
 */
Meteogram.prototype.getChartOptions = function () {
    var meteogram = this;

    return {
        chart: {
            renderTo: this.container,
            marginBottom: 70,
            marginRight: 40,
            marginTop: 50,
            plotBorderWidth: 1,
            width: 800,
            height: 310
        },

        title: {
            text: this.getTitle(),
            align: 'left'
        },

        credits: {
            text: '',
            href: this.xml.credit.link['@attributes'].url,
            position: {
                x: -40
            }
        },

        tooltip: {
            shared: true,
            useHTML: true,
            formatter: function () {
                return meteogram.tooltipFormatter(this);
            }
        },

        xAxis: [
        
        { // Bottom X axis
            type: 'datetime',
            tickInterval: 2 * 36e5, // two hours
            minorTickInterval: 36e5, // one hour
            tickLength: 0,
            minorGridLineColor: 'rgba(139,139,139,0.2)', // (Highcharts.theme && Highcharts.theme.background2) || '#F0F0F0',
            minorGridLineWidth: 1,
            startOnTick: false,
            endOnTick: false,
            minPadding: 0,
            maxPadding: 0,
            offset: 30,
            showLastLabel: true,
            labels: {
                format: '{value:%H:00}',
            }
        }, { // Top X axis
            linkedTo: 0,
            type: 'datetime',
            tickInterval: 24 * 3600 * 1000,
            labels: {
                format: '{value:<span style="font-size: 12px; font-weight: bold">%a</span> %b %e}',
                align: 'left',
                x: 3,
                y: -5
            },
            opposite: true,
            tickLength: 20,
            gridLineWidth: 2
        }],

        yAxis: [{ // y axis
            title: {
                text: 'nT/s'
            },
            labels: {
                format: '{value}',
                style: {
                    fontSize: '10px'
                },
                x: -3
            },
            plotLines: [{ // aurora plane
                value: this.magneticFieldRateLimit,
                color: '#BBBBBB',
                width: 1,
                zIndex: 2
            }],
            // Custom positioner to provide even temperature ticks from top down
            tickPositioner: function () {
                var max = Math.ceil(this.max) + 1,
                    pos = max - 12, // start
                    ret;

                if (pos < this.min) {
                    ret = [];
                    while (pos <= max) {
                        ret.push(pos += 1);
                    }
                } // else return undefined and go auto

                return ret;

            },
            maxPadding: 0.3,
            tickInterval: 1,
            gridLineColor: 'rgba(139,139,139,0.2)'// (Highcharts.theme && Highcharts.theme.background2) || '#F0F0F0'

        }],

        legend: {
            enabled: false
        },

        plotOptions: {
            series: {
                pointPlacement: 'between'
            }
        },


        series: [
            {
                name: 'Rate of Magnetic Field Change: history: Prediction',
                data: this.aurorasPrediction,
                type: 'spline',
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                },
                tooltip: {
                    valueSuffix: 'nT/s'
                },
                zIndex: 3,
                threshold: this.magneticFieldRateLimit, //Taman alapuolella negativeColor
                color: '#3ed715',
                negativeColor: '#006eff'
            },
            {
                name: 'Rate of Magnetic Field Change: History',
                data: this.aurorasHistory,
                type: 'spline',
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                },
                tooltip: {
                    valueSuffix: 'nT/s'
                },
                zIndex: 1,
                threshold: this.magneticFieldRateLimit,
                color: '#006401',
                negativeColor: '#88a7e0'
            }]
    };
};

/**
 * Post-process the chart from the callback function, the second argument to Highcharts.Chart.
 */
Meteogram.prototype.onChartLoad = function (chart) {

    this.drawWeatherSymbols(chart);

    var lightArr = this.lightLevel;
    //console.log(lightArr); //Taustavarit
    var arrayLength = lightArr.length;

    //Lis�t��n taustavarit kuvaajaan
    for (var i = 0; i < arrayLength; i++) {

        //console.log(lightArr[i].from, lightArr[i].to, lightArr[i].color)

        chart.xAxis[0].addPlotBand({
            from: lightArr[i].from,
            to: lightArr[i].to,
            color: lightArr[i].color
            /*
            color: {
                linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                stops: [
                    [0, '#55BF3B'], //green
                    [1, '#DDDF0D'] //yellow
                ]
            }
            */
        });

    }
    var thisTime = new Date();
    thisTime = thisTime.valueOf() - thisTime.getTimezoneOffset() * 60000 ;

    //Historia harmaaksi
    chart.xAxis[0].addPlotBand({
        from: 0,
        to: thisTime,
        color: 'rgba(185,185,185,0.7)',
        id: 'history'
    }); 

};

/**
 * Create the chart. This function is called async when the data file is loaded and parsed.
 */
Meteogram.prototype.createChart = function () {
    var meteogram = this;
    this.chart = new Highcharts.Chart(this.getChartOptions(), function (chart) {
        meteogram.onChartLoad(chart);
    });
};

Meteogram.prototype.error = function () {
    $('#loading').html('<i class="fa fa-frown-o"></i> Failed loading data, please try again later');
};

/**
* Parsitaan revontulidata
*
*/
Meteogram.prototype.parseFmiData = function (aurorasJson) {
    var meteogram = this;
    var minuuttiMs = 1000 * 60;
    var tuntiMs = minuuttiMs * 60;
    var vuorokausiMs = tuntiMs * 24;

    //Nykyinen aika, josta haetaan kellon siirto
    var thisTime = new Date();
    var timeZoneOffsetMs = thisTime.getTimezoneOffset() * 60000;


    // Haetaan ehdot revontulien nakymiselle 
    var hoursToSun = this.hoursBetweenSunAndDark;
    var aurVisibleList = this.clearSkyList; 
    var magneticFieldChangeLimit = this.magneticFieldRateLimit;


    //Lisataan historiadata kuvaajaan
    var jsonObject = aurorasJson.history;
    for (var key in jsonObject) {
        var keyTime = this.parseTime2UTC(key);
        var correctFrom = keyTime - timeZoneOffsetMs;
        var correctTo = keyTime - timeZoneOffsetMs + tuntiMs;
        var mfrValue = parseInt(jsonObject[key], 10);

        meteogram.aurorasHistory.push({
            x: correctFrom,
            y: mfrValue,
            to: correctTo
        });
    }

    //Lisataan ennustusdata kuvaajaan tunti kerrallaan
    var jsonObject = aurorasJson.prediction;
    for (var key in jsonObject) {
        var symbolName = null;
        var symbolValue = null;
        var keyTime = this.parseTime2UTC(key);
        var correctFrom = keyTime - timeZoneOffsetMs;
        var correctTo = keyTime - timeZoneOffsetMs + tuntiMs;
        var mfrValue = parseInt(jsonObject[key], 10);
        var aurorasVisible = false;
        var weatherClear = false;

        //Tarkistetaan loytyyko pilvisyystietoa listasta
        if (this.timeSymbols[correctFrom] != undefined ) {
            symbolName = this.timeSymbols[correctFrom].symbolName;
            symbolValue = this.timeSymbols[correctFrom].symbolValue;

            weatherClear = weatherClearEnough(symbolName);
        }

        //Revontulet nakymaan, jos kaikki tasmaa
        if (weatherClear && darkEnough(correctFrom) && magneticFieldRateEnough(mfrValue)) {
            aurorasVisible = true;

            //Asetetaan seuraavaksi mahdollisuudeksi nahda revontulet, jos mahdollisuutta ei ole ollut aikaisemmin
            var corFromDateTime = new Date(correctFrom + timeZoneOffsetMs);
            if (this.nextOpportunity == null && corFromDateTime > thisTime) {
                this.nextOpportunity = corFromDateTime;
                writeNextAuroras();
            }          
        }

        //aurorasVisible = darkEnough(correctFrom);

        meteogram.aurorasPrediction.push({
            x: correctFrom,
            y: mfrValue,
            to: correctTo,
            symbolName: symbolName,
            symbolValue: symbolValue,
            aurorasVisible: aurorasVisible
        });
    }
    /*
    console.log(this.symbolNames);
    console.log(this.symbols);
    console.log(this.temperatures);
    console.log(this.timeSymbols);
    console.log(this.aurorasPrediction);
    */

    if (this.nextOpportunity == null) {
        $('#aurorasBox').html("There isn't northern lights visible during next two days.");
    }

    function writeNextAuroras() {
        var seuraavaKerta = Highcharts.dateFormat('%A, %H:%M', correctFrom) + '-' + Highcharts.dateFormat('%H:%M', correctTo);
 
        var teksti = '<br>'+"The next opportunity to see norhern lights: " + seuraavaKerta + ".";
        $('#aurorasBox').html(teksti);
    }

    function darkEnough(fromTime) {
        var pimeaaAstiTunti = meteogram.sunRiseTime.getHours() - hoursToSun;
        var pimeaaJalkeenTunti = meteogram.sunSetTime.getHours() + hoursToSun;

        var dateTime = new Date(fromTime);
        var tunti = dateTime.getHours();

        if (tunti < pimeaaAstiTunti ) {
            return true;

        } else if (tunti > pimeaaJalkeenTunti ) {
            return true;
        }
        return false;
    }

    function weatherClearEnough(symbolN) {
        if (aurVisibleList.indexOf(symbolN) > -1) {
            return true;
        }
        return false;
    }

    function magneticFieldRateEnough(mfr) {
        if (mfr >= magneticFieldChangeLimit) {
            return true;
        }
        return false;
    }
}

Meteogram.prototype.parseTime2UTC = function (string) {
    var datetime = string + ' UTC';
    datetime = string.replace(/-/g, '/').replace('T', ' ');
    return Date.parse(datetime);
}



/**
 * Handle the data. This part of the code is not Highcharts specific, but deals with yr.no's
 * specific data format
 */
Meteogram.prototype.parseYrData = function () {
    var meteogram = this,
        xml = this.xml,
        pointStart;

    if (!xml || !xml.forecast) {
        return this.error();
    }

    //Nykyinen aika, josta haetaan kellon siirto
    var thisTime = new Date();
    var timeZoneOffsetMs = thisTime.getTimezoneOffset() * 60000;

    // Parsitaan auringonlasku ja -nousu
    var sunTimes = xml.sun['@attributes'];

    var sunRiseTime = sunTimes.rise + ' UTC';
    var sunSetTime = sunTimes.set + ' UTC';

    sunRiseTime = sunRiseTime.replace(/-/g, '/').replace('T', ' ');
    sunRiseTime = Date.parse(sunRiseTime) + timeZoneOffsetMs;
    sunSetTime = sunSetTime.replace(/-/g, '/').replace('T', ' ');
    sunSetTime = Date.parse(sunSetTime) + timeZoneOffsetMs;

    var sunRiseDateTime = new Date(sunRiseTime);
    var sunSetDateTime = new Date(sunSetTime);

    var sunRiseHour = sunRiseDateTime.getHours();
    var sunSetHour = sunSetDateTime.getHours();

    this.sunRiseTime = sunRiseDateTime;
    this.sunSetTime = sunSetDateTime;


    // Taustavarin asetus auringonnousun ja -laskun mukaan
    var taustavariTaaksePaivaa = 3; //Kuinka monelle paivalle taustavari asetaaan taaksepain
    var taustavariPaivaa = 4; //Kuinka monelle paivalle taustavari asetaaan eteenpain
    var hamartyvaAikaTuntia = 2.5; //aika jonka ilta hamartyy ennen kuin pimea (ja aamu valoistuu)
    var backgroundDayColor = '#d9ebf8'; //Paivan taustavari
    var backgroundNightColor = '#071e30'; //Yon taustavari


    //Lasketaan hamartyva ja valoistuva vari aamulle (aamulle ja illalle)
    var backgroundEveningColor = {linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
        stops: [
            [0, backgroundDayColor],
            [1, backgroundNightColor] 
        ]
    };
    var backgroundMorningColor = {
        linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
        stops: [
            [0, backgroundNightColor], 
            [1, backgroundDayColor] 
        ]
    };

    var minuuttiMs = 1000 * 60;
    var tuntiMs = minuuttiMs * 60;
    var vuorokausiMs = tuntiMs * 24;

    var hamartyvaAikaMs = hamartyvaAikaTuntia * tuntiMs;

    //Asetaan taustavari paiville
    for (var i = -taustavariTaaksePaivaa; i <= taustavariPaivaa; i++){

        var lastSS = sunSetTime + (i-1) * vuorokausiMs; //Edellinen Auringonlasku
        var sR = sunRiseTime + i * vuorokausiMs; //Auringonnousu
        var nextSS = sunSetTime + i * vuorokausiMs; //Seuraava Auringonlasku

        //Edellinen Ilta hamartymaan auringonlaskun jalkeen
        meteogram.lightLevel.push({
            from: lastSS,
            to: lastSS + hamartyvaAikaMs,
            color: backgroundEveningColor
        });
        //edellinen yo tummaksi
        meteogram.lightLevel.push({
            from: lastSS + hamartyvaAikaMs - 4 * minuuttiMs, //4 min paallekkain, jotta ei nay valkoinen viiva
            to: sR - hamartyvaAikaMs + 4 * minuuttiMs, //4 min paallekkain, jotta ei nay valkoinen viiva,
            color: backgroundNightColor
        });
        //aamu vaalenemaan
        meteogram.lightLevel.push({
            from: sR - hamartyvaAikaMs,
            to: sR,
            color: backgroundMorningColor
        });
        //Paiva vaaleaksi
        meteogram.lightLevel.push({
            from: sR,
            to: nextSS,
            color: backgroundDayColor
        });

    }

    //console.log(sunTimes);
    //console.log(sunRiseHour,sunSetHour);

    // The returned xml variable is a JavaScript representation of the provided XML,
    // generated on the server by running PHP simple_load_xml and converting it to
    // JavaScript by json_encode.
    $.each(xml.forecast.tabular.time, function (i, time) {
        // Get the times - only Safari can't parse ISO8601 so we need to do some replacements
        var from = time['@attributes'].from + ' UTC',
            to = time['@attributes'].to + ' UTC';

        from = from.replace(/-/g, '/').replace('T', ' ');
        from = Date.parse(from);
        to = to.replace(/-/g, '/').replace('T', ' ');
        to = Date.parse(to);

        if (to > pointStart + 4 * 24 * 36e5) {
            return;
        }

        var fromHour = new Date(from).getHours();
        var toHour = new Date(to).getHours();

        /*
        // Vanha tapa asettaa taustavari
        var backgroundLightColor = '#ffffff';
        //Laitetaan y�aika tummaksi
        if (fromHour < sunRiseHour || toHour > sunSetHour || toHour == 0) {
            backgroundLightColor = '#d8d2dd';

        }
        meteogram.lightLevel.push({
            from: from,
            to: to,
            color: backgroundLightColor
        });
        */


        // If it is more than an hour between points, show all symbols
        if (i === 0) {
            meteogram.resolution = to - from;
        }

        // Populate the parallel arrays
        // Pilvisyysikonit ja tekstit
        var symbolVar = time.symbol['@attributes']['var'].match(/[0-9]{2}[dnm]?/)[0];
        meteogram.symbols.push(symbolVar); // eslint-disable-line dot-notation
        meteogram.symbolNames.push(time.symbol['@attributes'].name);

        var newUser = "user" + i;
        var newValue = "value" + i;
        meteogram.timeSymbols[from] = {
            symbolValue: symbolVar,
            symbolName: time.symbol['@attributes'].name
        };

        meteogram.temperatures.push({
            x: from,
            y: parseInt(time.temperature['@attributes'].value, 10),
            // custom options used in the tooltip formatter
            to: to,
            index: i
        });

        //console.log(meteogram.temperatures);

        meteogram.precipitations.push({
            x: (from + to) / 2,
            y: 100//parseFloat(time.precipitation['@attributes'].value)
        });

        //Muokattu: ei lis�t� ylim��r�isi�
        /*
        meteogram.precipitations.push({
            x: (from + to) / 2,
            y: parseFloat(time.precipitation['@attributes'].value)
        });

        if (i % 2 === 0) {
            meteogram.winds.push({
                x: (from + to) / 2,
                value: parseFloat(time.windSpeed['@attributes'].mps),
                direction: parseFloat(time.windDirection['@attributes'].deg)
            });
        }

        meteogram.pressures.push({
            x: from,
            y: parseFloat(time.pressure['@attributes'].value)
        });

        if (i === 0) {
            pointStart = (from + to) / 2;
        }
        */
    });

    // Smooth the line
    this.smoothLine(this.temperatures);

    // Create the chart when the data is loaded
    //this.createChart();
};
// End of the Meteogram protype



// On DOM ready...

/*
// Set the hash to the yr.no URL we want to parse
if (!location.hash) {
    //var place = 'United_Kingdom/England/London';
    //var place = 'Finland/V�stra_Finland/Tampere~634964';
    var place = 'Finland/S�dra_Finland/Nurmij�rvi';
    location.hash = 'https://www.yr.no/place/' + place + '/forecast_hour_by_hour.xml';

}
*/



// Then get the XML file through Highcharts' jsonp provider, see
// https://github.com/highcharts/highcharts/blob/master/samples/data/jsonp.php
// for source code.
var loaded = 0;
initialize();

function initialize(date) {
    window.meteogram = new Meteogram();
    window.meteogram['container'] = 'container';

    loaded = 0;

    if (date === undefined) {
        date = new Date().toISOString().split('T')[0];
    }

    $.ajax({
        dataType: 'xml',
        url: '/api/weather',// location.hash.substr(1) + '&callback=?',
        success: function (xml) {

            //console.log(xml);
            //var xml = document.getElementsByTagName("body")[0];
            //console.log(xml);
            var jsonWeatherData = xmlToJson(xml).weatherdata;

            //console.log(jsonData);
            // window.meteogram = new Meteogram(jsonWeatherData, 'container');
            window.meteogram['xml'] = jsonWeatherData;
            window.meteogram.parseYrData();
            startIfAllLoaded();
        },
        error: Meteogram.prototype.error
    });


    $.ajax({
        dataType: 'text',
        url: '/api/aurorasprediction/' + date,
        success: function (rawJson) {
            var json = replaceAll(rawJson, "'", '"');
            var jsonData = JSON.parse(json);
            //console.log(jsonData);

            window.meteogram.parseFmiData(jsonData);
            startIfAllLoaded();
        },
        error: Meteogram.prototype.error
    });
}

function startIfAllLoaded() {
    window.loaded += 1;
    if (window.loaded == 2) {
        window.meteogram.createChart();
    }
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

// Changes XML to JSON
function xmlToJson(xml) {

    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
};

$(function () {
    $("#datepicker").datepicker({
        dateFormat: 'yy-mm-dd',
        onSelect: function (dateText, inst) {
            var date = $(this).val();
            console.log(date);

            initialize(date);
        }
    })
});