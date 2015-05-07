'use strict';

var embedLiveFigures = require('./embed-live-figures');

var cutsTheMustard = ('getComputedStyle' in window);

var fragmentPath = '/uk/2015/live-figures/next-fragment';

if (cutsTheMustard) {
  var container = document.querySelector('.ge15-ftcom-figures');
  if (!container) {
    throw new Error('Could not find element with class "ge15-ftcom-figures"');
  }

  var config = {
    'state-of-play': {}
  };

  embedLiveFigures(fragmentPath, container, config);

  // and repeat every minute
  setInterval(function () {
    embedLiveFigures(fragmentPath, container, config);
  }, 1000 * 60);
}
