'use strict';

module.exports = function(){

  // var err = new Error('result national overview - reject')
  // err.status = 500;
  // return Promise.reject( err );

  return Promise.resolve(
      {
        groups:[
          { parties:["lab","snp","ld"], seats:350, majority:25 },
          { parties:["c","ld"], seats:327, majority:2 }
        ]
      }
    );
};
