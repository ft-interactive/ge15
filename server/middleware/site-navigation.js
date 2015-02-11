'use strict';

var navigation = [
  {label: 'one', href: '/one'},
  {label: 'two', href: '/two'}
];

module.exports = function () {
  return function* siteNavigation(next) {
    this.locals = this.locals || {};
    this.locals.site = this.locals.site || {};
    this.locals.site.navigation = navigation;
    yield next;
  };
};
