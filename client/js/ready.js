'use strict';

module.exports = new Promise(function(resolve) {

  function dispatchOrigamiEvent() {
    document.dispatchEvent(new CustomEvent('o.DOMContentLoaded'));
    resolve();
  }

  var alreadyDOMcontentloaded = document.readyState === 'interactive' || document.readyState === 'complete';

  if (alreadyDOMcontentloaded)
    dispatchOrigamiEvent();
  else
    document.addEventListener('DOMContentLoaded', dispatchOrigamiEvent);

});
