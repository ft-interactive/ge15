'use strict';

const db = require('./db');

var major = ['c','lab','snp','ld','dup','pc','sdlp','ukip','green'];
var expires;
var last;
var age = 1000 * 60;


module.exports = function(){

  if (last && expires && Date.now() < expires) {
    return last;
  }

  var allParties = db.parties().find().map(simplify);
  var parties = allParties
    .filter(majorParties)
    .sort(bySeats);

  var other = allParties.reduce(otherParties,{
    party:'other' , seats:0 , seats_last:0, seats_change:0
  });

  parties.push(other);

  last = Promise.resolve({
    parties:parties,
    //updated:"2015-04-30T23:03:04.448Z",
    source:"PA"
  });

  return last;
};

function simplify(d){
  var o = {
    party:d.id,
    seats_last:d.elections.last.seats,
    seats:d.elections.ge15.seats,
    seats_change:d.elections.ge15.seats_change
  };
  return o;
}

function bySeats(a,b){
  return b.seats - a.seats;
}

function majorParties(d){
  return major.indexOf(d.party) > -1;
}

function otherParties(previous, current, index, array){
  if(major.indexOf(current.party) > -1){ //don't include in the sum
    return previous;
  }

  return {
    party:previous.party,
    seats:previous.seats + current.seats,
    seats_last:previous.seats_last + current.seats_last,
    seats_change:previous.seats_change + current.seats_change
  };
}
