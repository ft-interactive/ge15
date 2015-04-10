'use strict';

var app = require('../../util/app');
var _ = require('lodash');
var constituencies = require('../../data/constituencies');
var wards = require('../../data/wards');
var regions = require('../../data/regions');
var models = require('../../models');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');

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
      data: data
    };
    yield next;
  };
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



function main() {

  return app()

    .use(siteNav())

    .use(viewLocals())

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
