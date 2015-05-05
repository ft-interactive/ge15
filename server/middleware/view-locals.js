'use strict';

const debug = require('debug')('view-locals');
const electionCalled = process.env.ELECTION_CALLED === 'on';
const prod = process.env.NODE_ENV === 'production';

const flags = {
  tracking: prod,
  electionCalled: electionCalled
};

debug('Application flags', flags);

module.exports = function() {
  return function* viewLocals(next) {
    var iframed = !!this.query.iframed;
    var fragment = !!this.query.fragment;
    this.locals= {
      flags: flags,
      view: {
        layout: {
          fullWidth: false,
          blankPage: iframed,
          iframed: iframed,
          fragment: fragment,
          body: {}
        }
      }
    };
    yield next;
  };
};
