'use strict';

var update = require('../../db/update/ge15-PA-seat-results');
var db = require('../../db/');
db.start();
update();
setInterval(update, 10000);
