'use strict';

var expires;
var last;
var age = 1000 * 60;

module.exports = function () {
  if (last && expires && Date.now() < expires) {
    return last;
  }

  expires = Date.now() + age;
  last = Promise.resolve(process.env.KILL_RESULTS !== 'on');
  return last;
};
