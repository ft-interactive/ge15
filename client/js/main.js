'use strict';

require('o-hoverable');
require('./header.js');

document.addEventListener('DOMContentLoaded', function() {
  document.dispatchEvent(new CustomEvent('o.DOMContentLoaded'));
});

var isProd = process.env.NODE_ENV === 'production';
var stuff = process.env.STUFF;
