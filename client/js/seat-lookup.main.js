'use strict';

var embedLiveFigures = require('./embed-live-figures');

var cutsTheMustard = ('getComputedStyle' in window);

var fragmentPath = '/uk/2015/live-figures/seat-lookup-fragment';

if (cutsTheMustard) {
  // find the container we're going to put figures in
  var container = document.querySelector('.ge15-seat-lookup');
  if (!container) {
    throw new Error('Could not find element with class "ge15-seat-lookup"');
  }

  var config = {
    'seat-result': {
      enhance: require('./seat-result-enhancer')
    },
  };

  embedLiveFigures(fragmentPath, container, config);
}
