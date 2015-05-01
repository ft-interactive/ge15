'use strict';

const app = require('../../util/app');
const _ = require('lodash');
const service = require('../../service');
const viewLocals = require('../../middleware/view-locals');
const siteNav = require('../../middleware/site-navigation');

const pages = {
  home: {
    title: 'Election results',
    summary: 'The Conservative/Lib-Dem coalition is likely to hold office.\nExpect new party alliances to boost the majority.'
  }
};

function* home(next) {
  const data = _.zipObject(['overview', 'coalitions'], yield Promise.all([
    yield service.resultNationalOverview(),
    yield service.resultNationalCoalitions()
  ]));

  data.page = pages.home;

  yield this.render('results-index', data);
  yield next;
}

function* nationalOverview(next) {
  var data = {
      overview:yield service.resultNationalOverview()
  };
  yield this.render('result-national-overview', data);
  yield next;
}

function* nationalCoalitions(next) {
  var data = {
    coalitions:yield service.resultNationalCoalitions()
  };
  yield this.render('result-national-coalitions', data);
  yield next;
}

function main() {

  return app()

    .use(siteNav())

    .use(viewLocals())

    .router()

    .get('/', home)
    .get('/national-overview', nationalOverview)
    .get('/national-coalitions', nationalCoalitions);
}

module.exports = main;
