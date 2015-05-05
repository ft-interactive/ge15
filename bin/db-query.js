'use strict';

var repl = require('repl');
var _ = require('lodash');
var context = repl.start('ge15 > ').context;

// Configure what’s available in the REPL
var db = require('../db');

db.start();

context.db = db;
context._ = _;

db.listCollections().forEach(function(d){
  context[d.name] = db.getCollection(d.name);
});
