'use strict';

const mount = require('koa-mount');

var pathRouters = {
  // Fixme: is there a memory leak in these routers?
  // graphics: require('./graphics'),
  results: require('./results'),
  parties: require('./parties'),
  projections: require('./projections'),
  liveblog: require('./liveblog'),
  seatmoves: require('./sankey'),
  'coalition-calculator': require('./coalitioncalculator'),
  data: require('./data').routes,
  'coalition-forecast': require('./coalitionforecast'),
  api: require('./api')
};

const infoRouter = require('./info');
const prefix = '/uk/2015';

module.exports = function(app) {
  var router;
  var route;

  for (var path in pathRouters) {
    if (pathRouters.hasOwnProperty(path)) {
      router = pathRouters[path]();
      route = prefix + '/' + path;
      app.use(mount(route, router));
    }
  }

  app.use(mount('/', infoRouter()));
};
