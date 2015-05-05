'use strict';

var update = require('../../db/update/national-projections');
var db = require('../../db');
db.start();

update();
setInterval(update, 10000);
