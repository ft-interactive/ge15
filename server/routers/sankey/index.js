'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');

function* home(next) {
  yield this.render('sankey-index', {});
  yield next;
}

function main() {
  return app()
    .use(siteNav())
    .use(viewLocals())
    .router()
    // forecast home page
    .get('home', '/', home);

}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
