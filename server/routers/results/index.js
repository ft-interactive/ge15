'use strict';

var app = require('../../util/app');
var _ = require('lodash');
const viewLocals = require('../../middleware/view-locals');
const siteNav = require('../../middleware/site-navigation');


function* home(next) {
  var data = {};
  yield this.render('results-index', data);
  yield next;
}

function main() {

  return app()

    .use(siteNav())

    .use(viewLocals())

    .router()

    .get('/', home);
}

module.exports = main;
