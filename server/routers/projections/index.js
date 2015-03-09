'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var battlegroundData = require('../data/').battlegroundData;

function* home(next) {
  yield this.render('projections-index', {
    page: {
      title: 'What if the election were tomorrow?'
    },
    dataString:this.dataObject,
    data:this.dataObject
  });
  yield next;
}

function main() {
  return app()

        .use(siteNav())

        .use(viewLocals())

        .router()

        // forecast home page
        .get('home', '/', battlegroundData, home);
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
