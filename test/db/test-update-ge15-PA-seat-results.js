'use strict';

var update = require('../../db/update/ge15-PA-seat-results');

update();
setInterval(update, 10000);
