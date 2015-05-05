'use strict';

var hostname = require('./hostname');

// define the individual widget IDs, and their enhancer functions if available
var widgets = {
  'state-of-play--js': null,
  'votes-vs-seats--js': null,
  'local-result--js': require('./local-result'),
};

var cutsTheMustard = (
  'querySelectorAll' in document
);

if (cutsTheMustard) {
  // find the container we're going to put widgets in
  var widgetsContainer = document.querySelector('.ge15-liveblog-widgets');
  if (!widgetsContainer) {
    throw new Error('Could not find element with class "ge15-liveblog-widgets"');
  }


  // function to display/update the widgets
  var updateWidgets = function () {
    fetch('http://' + hostname +
      '/uk/2015/liveblog/widgets').then(function (response) {
      return response.text();
    })
    .then(function (html) {
      // make an HTML version of the loaded widgets so we can select them
      var loadedWidgets = document.createElement('div');
      loadedWidgets.innerHTML = html;

      // insert/replace them all one-by-one
      Object.keys(widgets).forEach(function (widgetId) {
        var wrapper = widgetsContainer.querySelector('.widget-wrapper--' + widgetId);

        if (!wrapper) {
          console.warn('Missing wrapper for widget:', widgetId);
          return;
        }

        var loadedWidget = loadedWidgets.querySelector('.' + widgetId);
        if (loadedWidget) {
          wrapper.innerHTML = loadedWidget.outerHTML;

          // enhance it
          if (widgets[widgetId]) {
            widgets[widgetId](wrapper.firstElementChild);
          }
        }
        else {
          // the server decided not to output this widget (e.g. because
          // not enough data) - don't show this widget. In fact, empty it (in
          // case it was already shown and the app has elected to stop showing it).
          wrapper.innerHTML = '';

          console.log('Not showing widget:', widgetId);
        }
      });
    })
    .catch(function (err) {
      console.error(err);
    });
  };

  updateWidgets();

  // setInterval(updateWidgets, 2000);
}
