var mount = require('koa-mount');

var pathRouters = {
  graphics: require('./graphics'),
  results: require('./results'),
  parties: require('./parties')
};

var infoRouter = require('./info');
var prefix = '/uk/2015';

module.exports = function(app) {
  var router;
  var u;
  var route;

  for (var path in pathRouters) {
    router = pathRouters[path]();
    route = prefix + '/' + path;
    app.use(mount(route, router));
  }

  app.use(mount('/', infoRouter()));
};
