var app = require('../../util/app');
var _ = require('lodash');
var constituencies = require('../../data/constituencies');
var wards = require('../../data/wards');
var index = _.indexBy(constituencies, 'slug');
var regions = require('../../data/regions');
var co = require('co');
var thunkify = require('thunkify');
var models = require('../../models');

function* render(next) {
  if (this.view) {
    yield this.render(this.view.name, this.view.data);
  }
  yield next;
}

function isGenerator(fn) {
  if (!fn) return false;
  return fn.constructor.name === 'GeneratorFunction';
}

function view(name, data) {
  return function* (next) {
    this.view = {
      name: name,
      data: data
    };
    yield next;
  };
}

function assignLocal(property, data) {
  // TODO: let data be a generator/yieldable
  var f = _.isFunction(data) ? f : _.constant(data);
  return function*(next) {
    this.locals[property] = f.call(this);
    yield next;
  }
}

var params = {
  ward: function* ward(ward, next) {
    this.locals.ward = _.where(wards, {slug: ward, constituency: {id: this.locals.constituency.id}})[0];
    this.assert(this.locals.ward, 404, 'Ward not found');
    yield next;
  },
  constituency: function* constituency(slug, next) {
    var region_id = this.locals.region.id;
    var constituency = yield models.Constituency.find({where:{slug: slug, region_id: region_id}});
    this.assert(constituency, 404, 'Constituency not found');
    this.locals.constituency = constituency.values;
    yield next;
  },
  region: function* region(slug, next) {
    var region = yield models.Region.find({where:{slug: slug}});
    this.assert(region, 404, 'Region not found');
    this.locals.region = region.values;
    yield next;
  }
}

var navigation = [
  {label: 'one', href: '/one'},
  {label: 'two', href: '/two'}
];

function main() {

  return app()

    .use(assignLocal('navigation', navigation))

    .use(function*(next){
      var iframed = !!this.query.iframed
      this.locals.view = {
        layout: {
          fullWidth: false,
          blankPage: iframed,
          iframed: iframed
        }
      };
      yield next;
    })

    .router()

    .param('ward', params.ward)
    .param('constituency', params.constituency)
    .param('region', params.region)

    // results home page
    .get('home', '/', view('results-index'), render)

    // index pages
    .get('regionIndex', '/regions', view('region-index', {regions: regions}), render)
    .get('constituencyIndex', '/constituencies', view('constituency-index', {constituencies: constituencies}), render)

    // result pages
    .get('region', '/:region', view('region'), function* (next) {
      this.locals.constituencies = _.where(constituencies, {region_id: this.locals.region.id});
      yield next;
    }, render)
    .get('constituency', '/:region/:constituency', view('constituency'), function* (next) {
      // TODO: how do we find wards? because the colummn is a string array.
      // this.locals.wards = _.where(wards, {constituency: {id: this.locals.constituency.id}});
      var wards = models.Ward.findAll({where: '\'' + this.locals.constituency.id + '\' = ANY(constituencies)'})
      this.locals.wards = wards
      yield next;
    }, render)
    .get('ward', '/:region/:constituency/:ward', view('ward'), render);
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
