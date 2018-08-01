#!/bin/bash

echo -e "Adding cars\n---------"
curl -X PUT http://localhost:3000/cars/ford-explorer
echo -e "Added a ford-explorer"
curl -X PUT http://localhost:3000/cars/toyota-im
echo -e "Added a toyota im"
curl -X PUT http://localhost:3000/cars/saab-93-aero
echo -e "Added a saab 93 aero"
curl -X PUT http://localhost:3000/cars/family-truckster
echo -e "Added a family truckster\nDone adding cars.\n"



echo -e "Adding car descriptions\n-----------------------"
curl -d '{ "colour" : "yellow", "style" : "SUV", "year": 2018 }' -H "Content-Type: application/json" -X POST  http://localhost:3000/cardescriptions/
echo -e " <-- Added SUV"
curl -d '{ "colour" : "green", "style" : "hatchback", "year": 2017 }' -H "Content-Type: application/json" -X POST  http://localhost:3000/cardescriptions/
echo -e " <-- Added Hatchback"
curl -d '{ "colour" : "blue", "style" : "sedan", "year": 2008 }' -H "Content-Type: application/json" -X POST  http://localhost:3000/cardescriptions/
echo -e " <-- Added Sedan"
curl -d '{ "colour" : "brown", "style" : "station-wagon", "year": 1983 }' -H "Content-Type: application/json" -X POST  http://localhost:3000/cardescriptions/
echo -e " <-- Added Station Wagon\nDone Adding car descriptions.\n"


echo -e "Adding features\n---------------"
curl -X POST http://localhost:3000/features/power-steering
echo -e "Added power-steering"
curl -X POST http://localhost:3000/features/climate-control
echo -e "Added climate-control"
curl -X POST http://localhost:3000/features/car-play
echo -e "Added car-play"
curl -X POST http://localhost:3000/features/disc-breaks
echo -e "Added disc-breaks\nDone adding features."

