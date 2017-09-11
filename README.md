# ASE-6070-R1

Harkkatyö opintojaksolle. Data-analyysia ja analyysin visualisointia.

## DataYhdistin

Datayhdistin on tehty .NET:lla. Koodattu visual studio 2017 versiolla, mutta projekti aukenee myös 2015 versiolla jos sellainen sattuu jo olemaan.

Solutionista löytyy kaksi projekti, online ja offline. Online versiosta jäi raakile, koska se osoittautui aika hitaaksi ja käsin ladattua offline dataa lyötyy pidemmälle ajalle.

Datasta muodostuva csv:stä tuli ~450 meganen.

Ohjeet ajamiseen:
- Solution auki ja OfflineDataGetter projektin päältä hiiren väärää ja "Set as StartUp Project"
- Luettavat tiedostot haetaan käännöskansiosta, eli kannattaa buildata tässä kohtaa, Build->Build Solution
- Hae OneDrivestä data "kaikkisamassazipissa.zip". Pura sen sisältö tänne: ...\ASE-6070-R1\DataYhdistin\OfflineDataGetter\bin\Debug\data
- Oletuksena csv generoituu C:\temp sijaintiin ja jos sitä ei ole olemas pääsee poikkeus karkuun, eli tee semmoinen tai muuta polkua koodista
- Paina Start
