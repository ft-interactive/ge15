'use strict';

const fs = require('fs');
const path = require('path');
const PA = require('../model/pa');
const create_file_descriptor = require('./ge15-PA-results').create_file_descriptor;

var already_loaded = false;

module.exports = function(cb) {

  if (already_loaded) {
    cb();
    return;
  }

  already_loaded = true;
  var filename = 'Test_General_Election_SOP_650.xml';
  var xml = fs.readFileSync(path.resolve(__dirname, '../source/' + filename)).toString();
  var descriptor = create_file_descriptor({name: filename, data: 'Thu May 07 2015 22:00:00 GMT+0100 (BST)'});

  PA.update_party_results(descriptor, xml, function(){
    cb();
  });

};
