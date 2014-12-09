'use strict';
// use npm module
var _ = require('lodash');
var header = require('next-header');

//use origami bower component
var oDate = require('o-date');

var isProd = process.env.NODE_ENV === 'production';
var stuff = process.env.STUFF;
console.log(_.compact([0, 1, false, 2, '', 3]));

console.log(oDate);
console.log(isProd);
console.log(stuff);

document.addEventListener('DOMContentLoaded', function() {
    document.dispatchEvent(new CustomEvent('o.DOMContentLoaded'));
});
