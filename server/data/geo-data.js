'use strict';

var fs = require('fs');
var topojson = require('topojson');
var constituencyData = require('./constituencies');
var constituencyLookup = {};

var topology = {}

//TODO dynamic simplification?
topology.high = JSON.parse( fs.readFileSync(__dirname + '/geodata/constituencies-high.topojson','utf-8') );
topology.medium = JSON.parse( fs.readFileSync(__dirname + '/geodata/constituencies-medium.topojson','utf-8') );
topology.low = JSON.parse( fs.readFileSync(__dirname + '/geodata/constituencies-low.topojson','utf-8') );

var neighborhoods = topojson.neighbors( topology.high.objects.constituencies.geometries );
var constituencyFeatures = {
	high: topojson.feature( topology.high, topology.high.objects.constituencies ).features,
	medium: topojson.feature( topology.medium, topology.medium.objects.constituencies ).features,
	low: topojson.feature( topology.low, topology.low.objects.constituencies ).features
}
//var constituencies = topojson.feature( topology.high, topology.high.objects.constituencies ).features;
var indexLookup = {};



constituencyFeatures.high.forEach(function(d,i){
	indexLookup[d.id] = i;
});

constituencyData.forEach(function(d,i){
	constituencyLookup[d.ons_id] = d;
});

//TODO should I be using meshArcs and turning it to geojson later?
var regionalBoundaries = topojson.mesh(topology.high, topology.high.objects.constituencies, function(a,b){
	return (constituencyLookup[ a.id ].region_code !== constituencyLookup[ b.id ].region_code);
});

if(!regionalBoundaries.properties) regionalBoundaries.properties = {};
regionalBoundaries.properties.type = 'regionalBoundary';


function constituency(id, detail){
	if(['high','low','medium'].indexOf(detail) < 0) detail = 'high';
	//the constituency,
	var constituencyIndex = indexLookup[id];
	var constituency = constituencyFeatures[detail][constituencyIndex];

	console.log(constituencyIndex, constituency);

	var neighbors = neighborhoods[constituencyIndex];

	if(!constituency.properties) constituency.properties = {};
	constituency.properties.type = 'primary';
	constituency.properties.focus = true;
	
	//its neighbouring constituencies, marked neighbour
	var neighbourhood = constituencyFeatures[detail]
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
	var constituencies = constituencyFeatures[detail];
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