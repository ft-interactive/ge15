'use strict';

module.exports = function(){

  // var err = new Error('result national overview - reject')
  // err.status = 500;
  // return Promise.reject( err );

  return Promise.resolve(
  {
    parties:[
      {party:"c", seats_change:-26, seats:280, seats_last:280+26},
      {party:"lab", seats_change:10, seats:268, seats_last:268-10},
      {party:"snp", seats_change:43, seats:49, seats_last:49-43},
      {party:"ld", seats_change:-30, seats:27, seats_last:27+30},
      {party:"dup", seats_change:0, seats:8, seats_last:8},
      {party:"pc", seats_change:1, seats:4, seats_last:4-1},
      {party:"sdlp", seats_change:0, seats:3, seats_last:3},
      {party:"ukip", seats_change:2, seats:2, seats_last:2-2},
      {party:"green", seats_change:0, seats:1, seats_last:1},
      {party:"other", seats_change:0, seats:8, seats_last:8}
    ],
    updated:"2015-04-30T23:03:04.448Z",
    source:"PA"
  });
};
