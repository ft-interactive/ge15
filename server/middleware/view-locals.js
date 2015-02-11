'use strict';

module.exports = function() {
  return function* viewLocals(next) {
    var iframed = !!this.query.iframed;
    this.locals.view = {
      layout: {
        fullWidth: false,
        blankPage: iframed,
        iframed: iframed,
        body: {}
      }
    };
    yield next;
  };
};
