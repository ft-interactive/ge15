var parties = require('../data/parties');
var resultData = require('../data/results');
var constituencySummary = resultData.constituencies();


function colourByParty(d){
	var winner = constituencySummary[d.id].winner;
	return parties[winner].color; 
}

module.exports = {
	one:{},
	constituency:{
		'small': {
			height: 100,
			width: 100,
			margin: {top:5, left:5, bottom:5, right:5},
			detail:'medium',
			colourScale:colourByParty
		},
		'medium': {
			height: 600,
			width: 600,
			margin: {top:20, left:20, bottom:20, right:20},
			detail:'medium',
			colourScale:colourByParty
		},
		'large': {
			height: 1000,
			width: 1000,
			margin: {top:50, left:50, bottom:50, right:50},
			detail:'high',
			colourScale:colourByParty
		}
	},
	uk:{
		'small': {
			height: 100,
			width: 100,
			margin: {top:5, left:5, bottom:5, right:5},
			detail:'low',
			colourScale:colourByParty
		},
		'medium': {
			height: 600,
			width: 600,
			margin: {top:20, left:20, bottom:20, right:20},
			detail:'low',
			colourScale:colourByParty
		},
		'large': {
			height: 1000,
			width: 1000,
			margin: {top:50, left:50, bottom:50, right:50},
			detail:'low',
			colourScale:colourByParty
		}
	}
};