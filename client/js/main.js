'use strict';

require('fetch');
require('./header.js');

document.graphics = {};
document.graphics.slope = require('./slope-chart/index.js');

document.addEventListener('DOMContentLoaded', function() {
  document.dispatchEvent(new CustomEvent('o.DOMContentLoaded'));
});
