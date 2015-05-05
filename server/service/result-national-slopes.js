'use strict';

module.exports = function(){

  // var err = new Error('result national overview - reject')
  // err.status = 500;
  // return Promise.reject( err );

  return Promise.resolve([
        {party:"c", label:'Con 280 (-26)', end:280, start:280+26},
        {party:"lab", label:'Lab 279 (+10)', end:279, start:268-10},
        {party:"snp", label:'SNP 49 (+43)', end:49, start:49-43},
        {party:"ld", label:'Lib Dem 27 (-30)', end:27, start:27+30},
        {party:"dup", end:8, start:8},
        {party:"pc",  end:4, start:4-1},
        {party:"sdlp",  end:3, start:3},
        {party:"ukip",  end:2, start:2-2},
        {party:"green",  end:1, start:1},
        {party:"other",  end:8, start:8}
      ]);
};
