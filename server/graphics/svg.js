'use strict'

var nodeD3 = require('d3');
var jsdom = require('jsdom');
var decorators = require('./decorators.js');

function svgGraphic(decoratorName, data, p){
	var decorator = decorators[decoratorName];


	var doc = jsdom.env({
		html:'<html><body></body></html>',
		features:{QuerySelector:true},
		done:function(errors, window){
			window.d3 = nodeD3;
			var htmlbody = window.d3.select('body')
			htmlbody.call( decorator, data );
			p.body = 'hiya';
		}
	});
}

module.exports = svgGraphic;