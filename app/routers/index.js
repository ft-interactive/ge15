var mount = require('koa-mount');

var routers = {
  '': require('./areas')
};

var prefix = '/uk/2015';

module.exports = function(app) {
  var router;
  var u;
  var route;

  app.use(function*(next){
    this.locals.context = this;
    yield next;
  });

  for (var path in routers) {
    router = routers[path]();
    route = prefix + path;
    app.use(mount(route, router));
  }
};
