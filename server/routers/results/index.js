'use strict';

const app = require('../../util/app');
const _ = require('lodash');
const service = require('../../service');
const viewLocals = require('../../middleware/view-locals');
const siteNav = require('../../middleware/site-navigation');

const pages = {
  homeAfterCalled: {
    title: 'Election results',
    summary: 'The Conservative/Lib-Dem coalition is likely to hold office.\nExpect new party alliances to boost the majority.'
  },
  homeBeforeCalled: {
    title: 'UK Election, the results so far',
    summary: 'As ballot papers continue to be counted a picture is emerging.'
  }
};

function* home(next) {
  const data = _.zipObject(['overview', 'coalitions', 'votesVsSeats'], yield Promise.all([
    service.resultNationalOverview(),
    service.resultNationalCoalitions(),
    service.votesVsSeats()
  ]));


  data.page = this.locals.flags.electionCalled ? pages.homeAfterCalled : pages.homeBeforeCalled;

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
