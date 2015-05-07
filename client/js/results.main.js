'use strict';


//on dom ready
require('./ready.js').then(function(){
  require('./results/slopes.js')();
  require('./results/local-result-load.js')();
});
