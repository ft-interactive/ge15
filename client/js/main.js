'use strict';

require('./header.js');
require('fetch');

document.addEventListener('DOMContentLoaded', function() {
  document.dispatchEvent(new CustomEvent('o.DOMContentLoaded'));
});
