'use strict';

const debug = require('debug')('ge15:raven');
const raven = require('raven');
const prod = process.env.ENV === 'production';
const preventSendingToSentry = !process.env.SENTRY_DSN_SERVER || !prod;
const client = new raven.Client(preventSendingToSentry ? false : process.env.SENTRY_DSN_SERVER);

if (!preventSendingToSentry) {
  debug('Logging errors to Sentry account: ' + process.env.SENTRY_DSN_SERVER);
  client.patchGlobal(function(logged, err) {
      console.error('Crash App: Raven client received an uncaught exception');
      process.exit(1);
  });
} else {
  debug('Raven client ON but not sending to Sentry');
}

module.exports = client;
