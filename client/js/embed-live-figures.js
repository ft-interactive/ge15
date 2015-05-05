'use strict';

var hostname = require('./hostname');

module.exports = function (fragmentPath, container, config) {
  console.log('Embedding live figures,', new Date(), 'from ' + fragmentPath);

  fetch('http://' + hostname + fragmentPath).then(function (response) {
    return response.text();
  })
  .then(function (html) {
    // make an HTML version of the loaded figures so we can select them
    var loadedFigures = document.createElement('div');
    loadedFigures.innerHTML = html;

    // insert/replace them all one-by-one
    Object.keys(config).forEach(function (figureId) {
      var wrapper = container.querySelector('.figure-wrapper--' + figureId + '--js');

      if (!wrapper) {
        console.warn('Missing wrapper for figure:', figureId);
        return;
      }

      var loadedFigure = loadedFigures.querySelector('.' + figureId);
      if (loadedFigure) {
        wrapper.innerHTML = loadedFigure.outerHTML;

        // enhance it
        if (config[figureId]) {
          config[figureId](wrapper.firstElementChild);
        }
      }
      else {
        // the server decided not to output this figure (e.g. because
        // not enough data) - don't show this figure. In fact, empty it (in
        // case it was already shown and the app has elected to stop showing it).
        wrapper.innerHTML = '';

        console.log('Not showing figure (because no data):', figureId);
      }
    });
  })
  .catch(function (err) {
    console.error(err);
  });
};
