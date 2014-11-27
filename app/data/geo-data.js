'use strict';
var fs = require('fs');
var topojson = require('topojson');
var constituencyLookup = require('./constituencies');

var topology = topojson.presimplify( JSON.parse( fs.readFileSync(__dirname + '/constituencies-high.topojson','utf-8') ) );
var neighborhoods = topojson.neighbors( topology.objects.constituencies.geometries );
var constituencies = topojson.feature( topology, topology.objects.constituencies ).features;
//var regionBoundaries = topojson.mesh(topology, topology.objects.constituencies, function())
//console.log( neighborhoods );

function constituency(id, detail){
	//the constituency,
	var constituency = topojson.feature( topology, topology.objects.constituencies ).features
		.filter(function(d){
			return  d.id == id;
		})[0];

	constituency.properties.type = 'primary';
	
	//its neighbouring constituencies, marked neighbour
	//regional borders,
	//land
	return composeGeoJSON( [constituency] );
}

function region(id, detail){
	//the constituencies within a region
	//regional borders,
	//land
}

function nation(id, detail){
	//the constituencies within a nation
	//regional borders, (if england)
	//land
}

function all(id, detail){
	//the whole thing
}

function composeGeoJSON(features){
	var geojson = {
		"type":"FeatureCollection",
		"features":features
	};

	return geojson;
}

module.exports = {
	constituency:constituency,
	region:region,
	nation:nation,
	map:all
}