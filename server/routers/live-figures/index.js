'use strict';

var app = require('../../util/app');
var service = require('../../service');
var _ = require('lodash');
var debug = require('debug')('liveblog');


/**
 * A fragment containing all the figures used on the liveblog.
 */
function* liveblogFragment(next) {
  var data = _.zipObject(['stateOfPlay', 'votesVsSeats', 'seatResult'], yield Promise.all([
    service.stateOfPlay(5),
    service.votesVsSeats(),
    service.seatResult(),
  ]));

  console.log('data', data.seatResult);

  debug(JSON.stringify(data.votesVsSeats, null, 2));

  this.set('Cache-Control', // jshint ignore:line
    'public, max-age=10, stale-while-revalidate=3600, stale-if-error=3600');

  this.set('Surrogate-Control', 'max-age=60'); // jshint ignore:line

  yield this.render('liveblog-fragment', data); // jshint ignore:line

  yield next;
}


/**
 * A fragment containing only the figure used on the FT.com homepage (i.e. a modified 'state of play').
 */
function* ftcomFragment(next) {
  var data = {
    stateOfPlay: yield service.stateOfPlay(6)
  };

  // alter the template data to suit the homepage
  data.stateOfPlay.headline = 'UK GENERAL ELECTION';
  data.stateOfPlay.showRosette = true;
  var longerNames = {
    'Lab': 'Labour',
    'LD': 'Lib Dems',
    'Con': 'Conservatives'
  };
  data.stateOfPlay.parties.forEach(function (party) {
    party.label = longerNames[party.label] || party.label;
  });

  data.stateOfPlay.linkText = process.env.FTCOM_HOMEPAGE_LINK_TEXT;
  data.stateOfPlay.linkURL = process.env.FTCOM_HOMEPAGE_LINK_URL;

  debug(JSON.stringify(data.votesVsSeats, null, 2));

  this.set('Cache-Control', // jshint ignore:line
    'public, max-age=10, stale-while-revalidate=3600, stale-if-error=3600');

  this.set('Surrogate-Control', 'max-age=60'); // jshint ignore:line

  yield this.render('ftcom-fragment', data); // jshint ignore:line

  yield next;
}


/**
 * A mockup page that imitates the real liveblog, for testing components in situ.
 */
function* liveblogMockup(next) {
  yield this.render('liveblog-mockup'); // jshint ignore:line
  yield next;
}


/**
 * A mockup page that imitates the real FT.com homepage, for testing components in situ.
 */
function* ftcomMockup(next) {
  yield this.render('ftcom-mockup'); // jshint ignore:line
  yield next;
}


/**
 * A fragment for a single constituency result
 */
function* seatResultFragment(next) {
  this.set('Cache-Control', // jshint ignore:line
    'public, max-age=10, stale-while-revalidate=3600, stale-if-error=3600');

  this.set('Surrogate-Control', 'max-age=60'); // jshint ignore:line

  var seat = service.db.seats().findOne({id: this.params.seat});
  this.assert(seat, 404, 'Seat not found'); // jshint ignore:line

  yield this.render('seat-result-fragment', seat); // jshint ignore:line

  yield next;
}


/**
 * The embed code for FT.com (plain text)
 */
function* ftcomEmbedCode(next) {
  this.set('Cache-Control', // jshint ignore:line
    'public, max-age=10, stale-while-revalidate=3600, stale-if-error=3600');

  this.set('Surrogate-Control', 'max-age=60'); // jshint ignore:line

  yield this.render('ftcom-embed-code', {hostname: 'elections.ft.com'}); // jshint ignore:line

  this.set('Content-Type', 'text/plain'); // jshint ignore:line

  yield next;
}


/**
 * The embed code for the liveblog (plain text)
 */
function* liveblogEmbedCode(next) {
  this.set('Cache-Control', // jshint ignore:line
    'public, max-age=10, stale-while-revalidate=3600, stale-if-error=3600');

  this.set('Surrogate-Control', 'max-age=60'); // jshint ignore:line

  yield this.render('liveblog-embed-code', {hostname: 'elections.ft.com'}); // jshint ignore:line

  this.set('Content-Type', 'text/plain'); // jshint ignore:line

  yield next;
}


module.exports = function main() {
  return app()
        .router()
        .get('liveblog-mockup', '/liveblog-mockup', liveblogMockup) // mockup page for testing functionality
        .get('liveblog-fragment', '/liveblog-fragment', liveblogFragment) // a fragment of all the widget fragments

        .get('ftcom-mockup', '/ftcom-mockup', ftcomMockup) // mockup page for testing functionality
        .get('ftcom-fragment', '/ftcom-fragment', ftcomFragment) // a fragment of all the widget fragments

        .get('seat-result-fragment', '/seat-result-fragment/:seat', seatResultFragment)

        .get('ftcom-embed-code', '/liveblog-embed-code', liveblogEmbedCode)
        .get('ftcom-embed-code', '/ftcom-embed-code', ftcomEmbedCode);
};
