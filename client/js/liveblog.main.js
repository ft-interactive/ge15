'use strict';

var embedLiveFigures = require('./embed-live-figures');

var cutsTheMustard = (
  'querySelectorAll' in document
);

var fragmentPath = '/uk/2015/live-figures/liveblog-fragment';

if (cutsTheMustard) {
  // find the container we're going to put figures in
  var container = document.querySelector('.ge15-liveblog-figures');
  if (!container) {
    throw new Error('Could not find element with class "ge15-liveblog-figures"');
  }

  var config = {
    'state-of-play': {},
    'votes-vs-seats': {},
    'local-result': {
      enhance: require('./local-result'),
      retain: true, // prevents it being rewritten after the first time (would be bad for this widget)
    },
  };

  embedLiveFigures(fragmentPath, container, config);

  // and repeat every 2 minutes
  setInterval(function () {
    embedLiveFigures(fragmentPath, container, config);
  }, 1000 * 60);
}
