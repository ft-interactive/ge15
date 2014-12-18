'use strict';

var fs = require('fs');
var path = require('path');

if (!global.hasOwnProperty('db')) {
  var Sequelize = require('sequelize');
  var options = {
    // define: {
    //   freezeTableName: true
    // }
  };
  var client = new Sequelize(process.env.DATABASE_URL, options);
  var models = {};
  var modelDirectory = path.resolve(__dirname);

  // read all models and import them into the "db" object
  fs.readdirSync(modelDirectory)
    .filter(function (file) {
      return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(function (file) {
      var model = client.import(path.join(modelDirectory, file));
      models[model.name] = model;
    });

  Object.keys(models).forEach(function (modelName) {
    if (models[modelName].options.hasOwnProperty('associate')) {
      models[modelName].options.associate(models);
    }
  });

  global.db = models;
  global.db.sequelize = client;
  global.db.Sequelize = Sequelize;
}

module.exports = global.db;
