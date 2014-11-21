var Router = require('koa-router');
var koa = require('koa');
var graphics = require('../../graphics/svg');

module.exports = function() {
  var router = koa();
  router.use(Router(router));

  router.get('slope', '/slope/:constituency', function* (next){
  	this.type = 'image/svg+xml';
  	this.body = yield graphics('simple', [this.params.constituency]);
  	yield next;
  });

  return router;
}