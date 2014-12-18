var co = require('co');
var data = require('../data/constituencies');
var db = require('../models');

co(function *(){
  var connection = yield db.sequelize.sync({force:true});
  var r = yield db.Constituency.bulkCreate(data);
  console.log(r);
  var a = yield db.Constituency.findAll().map(function(d){ return d.values; });
  // var a = yield db.client.query('SELECT * FROM constituency');
  console.log(a);
})();
