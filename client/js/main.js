'use strict';

require('o-hoverable');
require('./header.js');

document.graphics = {};
document.graphics.slope = require('./slope-chart');

document.addEventListener('DOMContentLoaded', function() {
  document.dispatchEvent(new CustomEvent('o.DOMContentLoaded'));
  console.log('graphics',document.graphics.slope);
});
