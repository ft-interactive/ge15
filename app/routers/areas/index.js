var Router = require('koa-router');
var koa = require('koa');
var _ = require('lodash');
var constituencies = require('../../data/constituencies');
var wards = require('../../data/wards');
var index = _.indexBy(constituencies, 'slug');
var regions = require('../../data/regions');
var co = require('co');
var thunkify = require('thunkify');

function* render(next) {
  if (this.view) {
    yield this.render(this.view.name, this.view.data);
  }
  yield next;
}

function view(name, data) {
  return function* (next) {
    this.view = {
      name: name,
      data: data || null
    };
    yield next;
  };
}

module.exports = function() {

  var router = koa();
  router.use(Router(router));

  router.param('ward', function* (ward, next) {
    this.locals.ward = _.where(wards, {slug: ward, constituency: {id: this.locals.constituency.id}})[0];
    this.assert(this.locals.ward, 404, 'Ward not found');
    yield next;
  });

  router.param('constituency', function* (constituency, next) {
    this.locals.constituency = index[constituency];
    this.assert(this.locals.constituency, 404, 'Constituency not found');
    yield next;
  });

  router.param('region', function*(region, next) {
    this.locals.region = _.where(regions, {slug: region})[0];
    this.assert(this.locals.region, 404, 'Region not found');
    yield next;
  });

  router.get('home', '/', view('area-index'), render);

  router.get('regionIndex', '/regions', view('region-index', {regions: regions}), render);

  router.get('constituencyIndex', '/constituencies', view('constituency-index', {constituencies: constituencies}), render);

  router.get('region', '/:region', view('region'), function* (next) {
    this.locals.constituencies = _.where(constituencies, {region_id: this.locals.region.id});
    yield next;
  }, render);

  router.get('constituency', '/:region/:constituency', view('constituency'), function* (next) {
    this.locals.wards = _.where(wards, {constituency: {id: this.locals.constituency.id}});
    yield next;
  }, render);

  router.get('ward', '/:region/:constituency/:ward', view('ward'), render);

  return router;
}
