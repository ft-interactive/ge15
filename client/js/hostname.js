/**
 * Tells you the whatever host is serving the JS bundle - for example:
 *
 *   elections.ft.com
 *   localhost:3000
 *   uk-election-2015-results.herokuapp.com
 *
 * For when you need to construct a URL back to the GE15 app from another domain
 * (e.g. the liveblog or ft.com homepage).
 */

'use strict';

module.exports = (function () {
  var scripts = document.getElementsByTagName('script');
  var src = scripts[scripts.length - 1].src;

  if (src.indexOf('://') > -1) {
    return src.split('/')[2];
  }
  else return 'localhost';
})();
