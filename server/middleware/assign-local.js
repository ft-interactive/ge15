'use strict';

const _ = require('lodash');

module.exports = function (property, data) {
  // TODO: let data be a generator/yieldable
  var f = _.isFunction(data) ? f : _.constant(data);
  return function* assignLocal(next) {
    this.locals[property] = f.call(this);
    yield next;
  };
};
