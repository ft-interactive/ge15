'use strict';

const app = require('../../util/app');
const _ = require('lodash');
const service = require('../../service');
const viewLocals = require('../../middleware/view-locals');
const siteNav = require('../../middleware/site-navigation');
const kill_results = process.env.KILL_RESULTS === 'on';

const pages = {
  homeAfterCalled: {
    title: 'UK general election: the full results',
    summary: 'David Cameron will return to Downing Street following a dramatic Conservative election victory.'
  },
  homeBeforeCalled: {
    title: 'UK general election: the results so far',
    summary: 'David Cameron is on course to return to Downing Street with results pointing to a dramatic Conservative election victory.'
  }
};

function* home(next) {

  this.assert(!kill_results, 404, 'Results will be here later');

  const data = _.zipObject(['overview', 'coalitions', 'votesVsSeats','sankey'], yield Promise.all([
    service.resultNationalOverview(),
    service.resultNationalCoalitions(),
    service.votesVsSeats(),
    service.resultSankeyData()
  ]));


  data.page = this.locals.flags.electionCalled ? pages.homeAfterCalled : pages.homeBeforeCalled;

  yield this.render('results-index', data);
  yield next;
}

function* nationalOverview(next) {
  var data = yield service.resultNationalOverview();
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

function* sankeyData(next) {
  var data = {
    sankey:yield service.resultSankeyData()
  };
  yield this.render('result-sankey', data);
  yield next;
}

function main() {

  return app()

    .use(siteNav())

    .use(viewLocals())

    .router()

    .get('/', home)
    .get('/national-overview', nationalOverview)
    .get('/national-coalitions', nationalCoalitions)
    .get('/national-change', nationalOverview)
    .get('/sankey', sankeyData);
}

module.exports = main;
