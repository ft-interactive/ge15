'use strict';

//  * Use the MapIt's "touches" endpoint to get a seat's neighbouring seats
//       i.e the ones it borders
//  * outputs CSV format to standard out.
//  * the neighbours column of the spreadsheet is a space delimited array
//  * sometimes the MapIt service throws errors for some seats,
//       these seats still appear in the output but
//       they have no neighbouring seats
//       and these errror are printed at the end.

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const dsv = require('dsv');
const csv = dsv(',');
const request = require('request-promise');
const async = require('async');

var xref = csv.parse(fs.readFileSync(path.resolve(__dirname, '../source/ONS-MySociety-xref.csv')).toString());

/*
.map(function(row){

});*/

var index = _.indexBy(xref, 'id');

var urls = seats.map(function(seat) {
  return { id: seat.ons_id, url: 'http://mapit.mysociety.org/area/'+ seat.mysociety_id +'/touches?type=WMC'};
});
