'use strict';

var update = require('../../db/update/national-projections');

update();
setInterval(update, 10000);
