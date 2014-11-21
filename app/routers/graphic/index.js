var Router = require('koa-router');
var koa = require('koa');
var graphics = require('../../graphics/svg');

module.exports = function() {
  var router = koa();
  router.use(Router(router));

  router.get('slope', '/slope/:constituency', function* (next){
  	console.log(' slope! ' + this.params.constituency);
  	var data = [this.params.constituency];
  	graphics('simple', data, this);
  	yield next;
  });

  return router;
}