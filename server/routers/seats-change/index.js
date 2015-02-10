'use strict';

var app = require('../../util/app');
var models = require('../../models');

function* home(next) {
  yield this.render('sankey-index', {});
  yield next;
}

function main() {
  return app()
  .router()

  // forecast home page
  .get('home', '/', home);
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
