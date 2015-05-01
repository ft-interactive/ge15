'use strict';

const debug = require('debug')('db-create-tool');
const async = require('async');
const create = require('../db/create');
const argv = require('yargs')
              .boolean('projections')
              .boolean('results')
              .boolean('all')
              .argv;

if (argv.all) {
  argv.projections = argv.results = argv.all;
}

var basic_data_only = !argv.projections && !argv.results;
var message = '\n\tDatabase created with...\n\n\t * Base data (including last vote results)';

if (argv.projections) {
  message += '\n\t * electionforecast projections';
}

if (argv.results) {
  message += '\n\t * PA results';
}

message += '\n\n\tYou can query it using the CLI\n\n\t$ npm run db\n';

function complete() {
  debug('Complete');
}

if (basic_data_only) {
  debug('Create basic ony basic data');
  create.create_database(complete);
} else {
  debug('First create the basic data');
  create.create_database(function() {

    const db = require('../db');
    var tasks = [];
    db.reload_sync();

    if (argv.projections) {
      debug('Add projections');
      tasks.push(db.data_sources.update.projections);
    }

    if (argv.results) {
      debug('Add results');
      tasks.push(db.data_sources.update.results);
    }

    if (tasks.length) {
      debug('Start update tasks');
      async.series(tasks, function() {
        debug('Save DB');
        db.saveDatabase(complete);
      });
    }

  });
}
