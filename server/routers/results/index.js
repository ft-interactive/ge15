'use strict';

const app = require('../../util/app');
const _ = require('lodash');
const service = require('../../service');
const viewLocals = require('../../middleware/view-locals');
const siteNav = require('../../middleware/site-navigation');
const kill_results = process.env.KILL_RESULTS === 'on';

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

  this.assert(!kill_results, 404, 'Results will be here later');

  const data = _.zipObject(['overview', 'coalitions', 'votesVsSeats','nationalSlopes'], yield Promise.all([
    service.resultNationalOverview(),
    service.resultNationalCoalitions(),
    service.votesVsSeats(),
    service.resultNationalSlopes()
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

function main() {

  return app()

    .use(siteNav())

    .use(viewLocals())

    .router()

    .get('/', home)
    .get('/national-overview', nationalOverview)
    .get('/national-coalitions', nationalCoalitions)
    .get('/national-change', nationalOverview);
}

module.exports = main;
