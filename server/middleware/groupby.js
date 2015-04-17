'use strict';

const _ = require('lodash');

module.exports = function(opts){
  opts = opts || {};
  var name = opts.name || 'groupby';

  return function *filter(next){
    yield *next;

    var body = this.body;

    // non-json
    if (!body || 'object' !== typeof body) return;

    // check for filter
    var group = this.query[name] || this.group;
    if (!group) return;

    // split
    if ('string' === typeof group) group = group.split(/ *, */);

    if (!group.length) return;
    // filter array
    if (Array.isArray(body)) {
      this.body = _.groupBy(body, group[0]);
      // TODO: group by more than one field
      return;
    }
  };
};
