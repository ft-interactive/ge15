var regions = require('./region-lookup');
var _ = require('lodash');
var slugify = require('speakingurl');

var data = _.map(regions, function (name, id) {
  return {
    id: id,
    name: name,
    slug: slugify(name)
  };
});

module.exports = data;
