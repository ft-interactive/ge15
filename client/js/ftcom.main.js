'use strict';

var embedLiveFigures = require('./embed-live-figures');

var cutsTheMustard = (
  'querySelectorAll' in document
);

var fragmentPath = '/uk/2015/live-figures/ftcom-fragment';

if (cutsTheMustard) {
  // find the container we're going to put figures in
  var container = document.querySelector('.ge15-ftcom-figures');
  if (!container) {
    throw new Error('Could not find element with class "ge15-ftcom-figures"');
  }

  // define which figures we'll use on this page
  var config = {
    'state-of-play': null
  };

  embedLiveFigures(fragmentPath, container, config);

  // and repeat every 2 minutes
  setInterval(function () {
    embedLiveFigures(fragmentPath, container, config);
  }, 1000 * 60);
}
