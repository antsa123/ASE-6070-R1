# ASE-6070-R1

Harkkatyö opintojaksolle. Data-analyysia ja analyysin visualisointia.

## Data

Data kansiosta löytyy datayhdistimellä tehtyä dataa.

Zipistä löytyy joka minuutin data csv:nä, turhan iso käsiteltäväksi.

tunninkeskiavrot.csv sisältää keskiarvot magneettikentän arvoista yksikkönä nT. Arvo on NaN jos yksikin arvo tunnin sisällä on NaN (korjataan joskus jos jaksetaan).

tunninkeskiarvoistaderivaatta.csv on suoraan laskettu derivaatta tunninkeskiarvoista. Yksikkönä nT/h. Ilmatieteen "kuluttaja data" käyttää yksikkönä 0.01 nT/s, mutta jos meidän datan tuohon muuttaa, niin tulee meidän luvuista kovin pieniä (fmi ei taida näin reippaasti dataa keskiarvoistaa tjms.). Pikaisella vilkaisulla tuo meidän nT/h istuu suurusluokaltaan noin suurinpiirtein fmi:n 0.01 nT/s lukuihin, joten mallia varten kelvannee tämä. 

## DataYhdistin

Datayhdistin on tehty .NET:lla. Koodattu visual studio 2017 versiolla, mutta projekti aukenee myös 2015 versiolla jos sellainen sattuu jo olemaan.

Solutionista löytyy kaksi projekti, online ja offline. Online versiosta jäi raakile, koska se osoittautui aika hitaaksi ja käsin ladattua offline dataa lyötyy pidemmälle ajalle.

Datasta muodostuva csv:stä tule ~450 meganen jos tallentaa kaikki minutti arvot. Vaihtamalla kommentin paikkaa koodissa voi tallentaa dataa eri muodossa. Tunnin keskiarvostuksella csv sopiva 5-10 megaa

Ohjeet ajamiseen:
- Solution auki ja OfflineDataGetter projektin päältä hiiren väärää ja "Set as StartUp Project"
- Luettavat tiedostot haetaan käännöskansiosta, eli kannattaa buildata tässä kohtaa, Build->Build Solution
- Hae OneDrivestä data "kaikkisamassazipissa.zip". Pura sen sisältö tänne: ...\ASE-6070-R1\DataYhdistin\OfflineDataGetter\bin\Debug\data
- Oletuksena csv generoituu C:\temp sijaintiin ja jos sitä ei ole olemas pääsee poikkeus karkuun, eli tee semmoinen tai muuta polkua koodista
- Paina Start
