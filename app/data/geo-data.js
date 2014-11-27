'use strict';
var fs = require('fs');
var topojson = require('topojson');
var constituencyLookup = require('./constituencies');

var topology = topojson.presimplify( JSON.parse( fs.readFileSync(__dirname + '/constituencies-high.topojson','utf-8') ) );
var neighborhoods = topojson.neighbors( topology.objects.constituencies.geometries );
var constituencies = topojson.feature( topology, topology.objects.constituencies ).features;
var indexLookup = {};

constituencies.forEach(function(d,i){
	indexLookup[d.id] = i;
});

function constituency(id, detail){
	//the constituency,
	var constituencyIndex = indexLookup[id];
	var constituency = topojson.feature( topology, topology.objects.constituencies ).features[constituencyIndex];
	var neighbors = neighborhoods[constituencyIndex];

	constituency.properties.type = 'primary';
	constituency.properties.focus = true;
	
	//its neighbouring constituencies, marked neighbour
	var neighbourhood = topojson.feature( topology, topology.objects.constituencies ).features
		.filter(function(d,i){
			return (neighbors.indexOf(i) > -1);
		});

	var features = neighbourhood.concat( constituency );
	//regional borders,
	//land
	return composeGeoJSON( features );
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