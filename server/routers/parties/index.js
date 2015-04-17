'use strict';

const app = require('../../util/app');
const viewLocals = require('../../middleware/view-locals');
const siteNav = require('../../middleware/site-navigation');
const data = require('../../data');

function* home(next) {
  var parties = yield data.parties();
  yield this.render('party-index', {parties: parties});
  yield next;
}

function main() {
  return app()
        .use(siteNav())

        .use(viewLocals())

        .router()

        // parties home page
        .get('home', '/', home);
}

module.exports = main;
