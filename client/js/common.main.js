'use strict';

require('fetch');

var header = require('./header.js');

require('./ready.js').then(main);

function main() {
  var isBlankPage = document.documentElement.classList.contains('layout--blankpage');

  if (!isBlankPage) {
    header.init();
  }
}

document.graphics = {};
document.graphics.slope = require('./slope-chart/index.js');
