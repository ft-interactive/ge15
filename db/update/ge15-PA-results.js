'use strict';

const debug = require('debug')('db-update:PA-seats');
const _ = require('lodash');
const PA = require('../model/pa');
const Types = require('../model/types');
const ProcessState = require('./process-state');
const FTP = require('./ftp');

const dir = process.env.PA_RESULTS_DIR || '/results/';
const timestamp_path = dir + '.timestamp';

var last_timestamp = 0;
var previous_latest_SOP_file;
var previous_seat_files = new Map();
var unprocessed_seat_files = [];

exports.update = update;
exports.create_file_descriptor = create_file_descriptor;

//setInterval(process_latest_SOP_file, 1000);
// setInterval(process_latest_seat_files, 2000);

function clean_complete_seat_results() {
  // clean up the array in case there are any complete tasks
  var removed = _.remove(unprocessed_seat_files, function(file) {
    return file.process_state === ProcessState.DONE;
  });

  debug('Cleaned ' + removed.length + ' done tasks');

  // FIXME: do we remove error ones or leave them for later.
}

var currently_processing_seat_files = false;

function process_latest_seat_files(callback) {

  callback = callback || function(){};

  debug('process seat file');

  clean_complete_seat_results();

  // exit early if there is nothing to process
  if (currently_processing_seat_files || !unprocessed_seat_files || !unprocessed_seat_files.length) {
    debug('dont do anything. currentlyprocessing=' + currently_processing_seat_files);
    callback();
    return;
  }

  currently_processing_seat_files = true;

  var shallow_copy = unprocessed_seat_files.slice(0);

  setTimeout(function(){
    currently_processing_seat_files = false;
  }, shallow_copy.length * 5000);

  var files_done = [];
  var files_errored = [];

  function on_complete() {
    currently_processing_seat_files = false;
    debug('Done process %d seat files.', files_done.length);
    debug(_.pluck(files_done, 'path'));
    if (files_errored.length) {
      console.log('Errored ' + files_errored.length);
      console.dir(files_errored);
    }
    FTP.end();
    callback();
  }

  var c = _.after(shallow_copy.length, on_complete);

  function on_file_error(file, e) {
    file.process_state = ProcessState.ERROR;
    files_errored.push(file);
    console.error(file.path);
    console.error(e.message);
    console.error(e.stack);
    c();
  }

  function on_file_done(file) {
    file.process_state = ProcessState.DONE;
    files_done.push(file);
    c();
  }

  shallow_copy.forEach(function(file) {
    try {
      FTP.get(file.path, function(err, str) {
        if (err) {
          on_file_error(file, err);
          return;
        }

        try {
          PA.update_seat_result(file, str, function(ue) {
            if (ue) {
              on_file_error(file, ue);
              return;
            }
            on_file_done(file);
          });
        } catch (pa_err) {
          on_file_error(file, pa_err);
        }
      });
    } catch (ftperr) {
      on_file_error(file, ftperr);
    }
  });
}

function process_latest_SOP_file() {
  if (!previous_latest_SOP_file || previous_latest_SOP_file.process_state > ProcessState.NOT_STARTED) {
    return;
  }

  var processing_SOP_file = previous_latest_SOP_file;
  var msg_suffix = 'Revision=' + processing_SOP_file.revision + ' file=' + processing_SOP_file.name;

  processing_SOP_file.process_state = ProcessState.PROCESSING;

  function has_been_superseded() {
    return previous_latest_SOP_file && previous_latest_SOP_file.revision > processing_SOP_file.revision;
  }

  function complete() {
    debug('SOP update complete. %s', msg_suffix);
    FTP.end();
    processing_SOP_file.process_state = ProcessState.DONE;
  }

  function error() {
    debug('Error updating SOP. %s', msg_suffix);
    FTP.end();
    if (processing_SOP_file.process_state !== ProcessState.DONE) {
      processing_SOP_file.process_state = ProcessState.ERROR;
    }
  }

  FTP.get(processing_SOP_file.path, function(err, str) {

    if (err) {
      debug('Error downloading SOP. %s', msg_suffix);
      error(err);
      return;
    }

    debug('Got SPO file. %s', msg_suffix);

    // Do we still need to process the file, has it been superceeded by another?
    if ( has_been_superseded() ) {
      debug('Superseded. Dont do anything. %s', msg_suffix);
      complete();
      return;
    }

    debug('Transforming XML string into Model objects. %s', msg_suffix);

    PA.update_party_results(processing_SOP_file, str, function(data) {
      // TODO: do something with the data?
      //       what about the national stuff?
      complete();
    });

  });

}

function update(cb) {

  cb = cb || function () {};

  debug('call');

  if ( !isStale() ) {
    debug('cache not stale yet');
    cb();
    return;
  }

  start();

  function error(err) {
    console.error(err && err instanceof Error ? err.message : err || 'Unknown Error');
    if (err) {
      console.log(err.code);
      console.log(err.stack);
    }
    FTP.end();
    fail();
    cb();
  }

  function close() {
    done();
    cb();
  }

  debug('ready, get .timestamp');

  FTP.get(timestamp_path, function(err, str) {

    if (err) {
      debug('No timestamp file');
      error(err);
      return;
    }

    var new_timestamp = Number(str);

    if (!str || isNaN(new_timestamp)) {
      debug('Contents of .timestamp is not a number/epoch');
      error(err);
      return;
    }

    var changed = new_timestamp > last_timestamp;
    debug('timestamp %s: old=%s, new=%s', (changed ? 'changed' : 'not changed'), last_timestamp, new_timestamp);
    last_timestamp = new_timestamp;

    if (!changed) {
      close();
      return;
    }

    FTP.list(dir, function(err, list) {

      if (err) {
        console.log('FTP List error');
        console.error(err);
        error(err);
        return;
      }

      if (!list || !list.length) {
        debug('No files in the list, exiting');
        close();
        return;
      }

      if (typeof list[0] === 'string') {
        debug('using OSX directory listing format hack');
        list = list.map(parse_directory_list_item);
      }

      debug('Filter the file list, keep only file abou the General election');

      var general_election_files = list.filter(filter_general_election_XML).map(create_file_descriptor);

      if (!general_election_files.length) {
        debug('No General Election results XML files yet');
        close();
        return;
      }

      var SOP_files = _.filter(general_election_files, 'type', Types.SOP); // now reduce to highest revision num
      var latest_SOP_file = SOP_files.reduce(get_latest_SOP_file, null);
      var is_newer = latest_SOP_file && (!previous_latest_SOP_file || latest_SOP_file.revision > previous_latest_SOP_file.revision);

      if (is_newer) {
        debug('New lest SOP. Revision: Previous-%d. Revsion-%d', previous_latest_SOP_file ? previous_latest_SOP_file.revision : 0, latest_SOP_file.revision);
        previous_latest_SOP_file = latest_SOP_file;
      }

      var seat_files = _.filter(general_election_files, 'is_seat', true);
      var new_seat_files = filter_new_seat_files(seat_files);

      debug('There are %d new seat files', new_seat_files.length);

      unprocessed_seat_files = unprocessed_seat_files.concat(new_seat_files);

      debug('There are %d unprocessed seat files', unprocessed_seat_files.length);

      setTimeout(function(){
        process_latest_seat_files();
        process_latest_SOP_file();
      }, 5);

      close();

  })});
}

function filter_new_seat_files(files) {
  return _.reduce(files, function(result, file) {
    if (!this.has(file.name)) {
      this.set(file.name, file);
      result.push(file);
    }
    return result;
  }, [], previous_seat_files);
}

function create_file_descriptor(file) {
  var f = {
    name: file.name,
    date: new Date(file.date).getTime(),
    process_state: ProcessState.NOT_STARTED,
    path: dir + file.name
  };

  var revision = f.name.match(/_(\d+)\.xml$/);
  f.revision = revision && revision.length === 2 ? Number(revision[1]) : null;

  if ( /_result_/.test(f.name) ) {
    f.type = Types.RESULT;
  } else if ( /_SOP_/.test(f.name) ) {
    f.type = Types.SOP;
  } else if ( /_rush_/.test(f.name) ) {
    f.type = Types.RUSH;
  } else if ( /_recount_/.test(f.name) ) {
    f.type = Types.RECOUNT;
  } else {
    f.type = Types.UNKNOWN;
  }

  f.is_seat = f.type !== Types.SOP && f.type !== Types.UNKNOWN;

  return f;
}

function filter_general_election_XML(file) {
  return file.name.charAt(0) !== '.' &&
         file.name.endsWith('.xml') &&
         /General_Election_/.test(file.name);
}

function get_latest_SOP_file(result, file) {
  if (!result) return file;
  return result.revision > file.revision ? result : file;
}

function parse_directory_list_item(str) {
  var parts = str.split(/\s+/g);
  var dateString = [parts[6], parts[7], '2015', parts[8] + ':00', 'GMT+0100 (BST)'].join(' ');
  return {
    name : parts[parts.length - 1],
    date: dateString
  };
}

const maxage = 1000 * 3;
var fetching = false;
var expires = 0;

function done() {
  debug('done');
  fetching = false;
  expires = Date.now() + maxage;
}

function start() {
  debug('start');
  fetching = true;
}

function fail(err) {
  debug(err);
  fetching = false;
  expires = Date.now();
}

function isStale() {
  return !(Date.now() < expires || fetching);
}
