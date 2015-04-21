'use strict';

module.exports = function() {
  return function* viewLocals(next) {
    var iframed = !!this.query.iframed;
    var fragment = !!this.query.fragment;
    this.locals.view = {
      layout: {
        fullWidth: false,
        blankPage: iframed,
        iframed: iframed,
        fragment: fragment,
        body: {}
      }
    };
    yield next;
  };
};
