'use strict';

var fs = require('fs');
var topojson = require('topojson');
var constituencyData = require('./constituencies');
var constituencyLookup = {};

var topology = {}
//TODO dynamic simplification
topology.high = JSON.parse( fs.readFileSync(__dirname + '/constituencies-high.topojson','utf-8') );
topology.medium = JSON.parse( fs.readFileSync(__dirname + '/constituencies-medium.topojson','utf-8') );
topology.low = JSON.parse( fs.readFileSync(__dirname + '/constituencies-low.topojson','utf-8') );

var neighborhoods = topojson.neighbors( topology.high.objects.constituencies.geometries );
var constituencies = topojson.feature( topology.high, topology.high.objects.constituencies ).features;
var indexLookup = {};



constituencies.forEach(function(d,i){
	indexLookup[d.id] = i;
});

constituencyData.forEach(function(d,i){
	constituencyLookup[d.ons_id] = d;
});

//TODO should I be using meshArcs and turning it to geojson later?
var regionalBoundaries = topojson.mesh(topology.high, topology.high.objects.constituencies, function(a,b){
	return (constituencyLookup[ a.id ].region_code !== constituencyLookup[ b.id ].region_code);
});

console.log(topojson.filter);

if(!regionalBoundaries.properties) regionalBoundaries.properties = {};
regionalBoundaries.properties.type = 'regionalBoundary';


function constituency(id, detail){
	if(['high','low','medium'].indexOf(detail) < 0) detail = 'high';
	//the constituency,
	var constituencyIndex = indexLookup[id];
	var constituency = topojson.feature( topology[detail], topology[detail].objects.constituencies ).features[constituencyIndex];
	var neighbors = neighborhoods[constituencyIndex];

	constituency.properties.type = 'primary';
	constituency.properties.focus = true;
	
	//its neighbouring constituencies, marked neighbour
	var neighbourhood = topojson.feature( topology[detail], topology[detail].objects.constituencies ).features
		.filter(function(d,i){
			return (neighbors.indexOf(i) > -1);
		});

	//regional borders,
	var features = neighbourhood.concat( constituency, regionalBoundaries );
	
	//TODO land

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

function all(detail){
	if(['high','low','medium'].indexOf(detail) < 0) detail = 'low';
	//the whole thing
	var constituencies = topojson.feature( topology[detail], topology[detail].objects.constituencies ).features.map(function(d){
		d.constituency = true;
		return d
	});
	var coast = topojson.mesh(topology[detail], topology[detail].objects.constituencies, function(a,b){
		return a === b;
	});
	if(!coast.properties) coast.properties = {};
	coast.properties.type = 'coast';
	coast.properties.focus = true;

	var features = constituencies.concat(coast);
	return composeGeoJSON( constituencies.concat(coast) );
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
	uk:all
}