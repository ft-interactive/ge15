var Router = require('koa-router');
var Postcode = require('postcode');

var postcodes = {
  'E8': {outward: 'E8', constituencies: [
  {slug: 'hackney-south-and-shoreditch', ft_name: 'Hackney South and Shoreditch'}
  ]},
  'SE13': {outward: 'SE13', constituencies: [
  {slug: 'lewisham-east', ft_name: 'Lewisham East'}
  ]}
};

module.exports = function() {

  var router = new Router();

  router.param('postcode', function*(postcode, next) {
    this.params.postcode = new Postcode(postcode.toUpperCase());
    yield next;
  });

  router.get('postcode', '/:postcode', function*(next) {
    var postcode = postcodes[this.params.postcode.outcode()];
    this.assert(postcode, 404, 'Postcode not found');
    yield this.render('postcode-outward-code', {
      postcode: postcode,
      constituencies: postcode.constituencies
    });
    yield next;
  });

  return router;
}
