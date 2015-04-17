'use strict';

var oErrors = require('o-errors');

oErrors.init({
    sentryEndpoint: process.env.SENTRY_DSN_FRONTEND,
});

var header = require('./header.js');

require('./ready.js').then(main);

function main() {
  var isBlankPage = document.documentElement
                              .classList.contains('layout--blankpage');

  if (!isBlankPage) header.init({sticky: true});
}
