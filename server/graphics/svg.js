'use strict'

var d3 = require('d3');
var jsdom = require('jsdom').jsdom;
var decorators = require('./decorators.js');
var thunkify = require('thunkify');

var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

function svgGraphic(decoratorName, data, callback){
	var decorator = decorators[decoratorName];
	var htmlbody = d3.select('body');
	htmlbody.call( decorator, data );
	var markup = htmlbody.html();
	callback ( null, doctype + markup );
}

module.exports = thunkify( svgGraphic );