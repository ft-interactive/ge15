'use strict';
var fs = require('fs');
var topoJSON = require('topojson');
var constituencyLookup = require('./constituencies');

var topology = topoJSON.presimplify( JSON.parse( fs.readFileSync(__dirname + '/constituencies-high.topojson','utf-8') ) );
var constituencies = topoJSON.feature(topology, topology.objects.constituencies).features;
//var regionBoundaries = topojson.mesh(topology, topology.objects.constituencies, function())
console.log( constituencies );

function constituency(id, detail){
	
}

function region(id, detail){

}

function nation(id, detail){

}

function all(id, detail){

}

module.exports = {
	constituency:constituency,
	region:region,
	nation:nation,
	map:all
}