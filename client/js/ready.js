'use strict';

module.exports = new Promise(function(resolve) {

  var domContentLoaded = 'DOMContentLoaded';
  var doc = document;
  var isLoaded = doc.readyState === 'interactive' ||
                 doc.readyState === 'complete';

  if (isLoaded)
    done();
  else
    doc.addEventListener(domContentLoaded, done);

  function done() {
    doc.removeEventListener(domContentLoaded, done);
    doc.dispatchEvent(new CustomEvent('o.' + domContentLoaded));
    resolve();
  }

});
