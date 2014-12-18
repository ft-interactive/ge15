// TODO this is just returning dummy data for the purpose of testing graphics...

var constituencies = require('./constituencies');

module.exports = {
	constituency:function(id){ //detailed per constituency results
		return {
			name:"Test Place",
			id:id,
			results:[
				{year:2005, winner:'Labour Party'},
				{year:2010, winner:'Conservative Party'}
			],
			parties:[
				{name:'Labour', pct2005:'46', pct2010:'37'},
				{name:'Conservative', pct2005:'43', pct2010:'51'},
				{name:'Liberal Democrat', pct2005:'7', pct2010:'8'},
				{name:'UK Independence Party', pct2005:'0', pct2010:'4'}
			]
		}
	},
	constituencies:function(){ //a list of constituencies top level data (i.e. the winning party, the turn out and the margin of victory)
		var lookup = {};
		constituencies.forEach(function(d){
			d.winner = randomParty();
			d.turout = 100 * (0.5 + Math.random()/3);
			d.margin = 100 * (Math.random()/8);
			lookup[d.id] = d;
		})
		return lookup;
	},

	national:function(){ //national overview (scorecard)

	}
}

function randomParty(){
	var r = Math.random();
	if(r<.4) return 'Conservative';
	if(r<0.8) return 'Labour';
	if(r<0.95) return 'Liberal Democrat';
	if(r<0.97) return 'UK Independence Party';
	return 'Green';
}
