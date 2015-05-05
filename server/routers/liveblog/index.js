/**
 * Routes:
 *   /uk/2015/liveblog/widgets
 *     outputs a simple HTML fragment containing all
 *     the widgets, no CSS/JS.
 *
 *   /uk/2015/liveblog/mockup
 *     outputs a webpage that roughly simulates the liveblog environment,
 *     containing (something close to) the embed code that will be put in the
 *     real liveblog. (This embed code is just a container DIV and the assets
 *     listed below.)
 *
 * Relevant assets:
 *   /css/pages/liveblog.css
 *     styles for all the widgets.
 *
 *   /js/liveblog.js
 *     this fetches the /liveblog/widgets fragment and injects its contents into
 *     div.ge15-liveblog-widgets in the current document, whether it's the real
 *     liveblog or the mockup.
 */

'use strict';

var app = require('../../util/app');
var service = require('../../service');
var _ = require('lodash');
var debug = require('debug')('liveblog');


/**
 * Outputs all the widgets as a fragment.
 */
function* widgets(next) {
  var data = _.zipObject(['stateOfPlay', 'votesVsSeats', 'localResult'], yield Promise.all([
    service.stateOfPlay(),
    service.votesVsSeats(),
    service.localResult(),
  ]));

  debug(JSON.stringify(data.votesVsSeats, null, 2));

  // render all the widgets in one template
  yield this.render('liveblog-widgets', data); // jshint ignore:line

  yield next;
}


/**
 * Outputs a mockup page that downloads and displays the fragments via
 * JavaScript, simulating the liveblog.
 */
function* mockup(next) {
  yield this.render('liveblog-mockup'); // jshint ignore:line
  yield next;
}


module.exports = function main() {
  return app()
        .router()
        .get('mockup', '/mockup', mockup) // mockup page for testing functionatliy
        .get('widgets', '/widgets', widgets); // a fragment of all the widget fragments
};
