'use strict';

const debug = require('debug')('ftp');
const FTPClient = require('ftp');
const accum = require('accum');
const xml2js = require('xml2js').parseString;

const options = {
  host: process.env.PA_HOSTNAME,
  port: 21,
  user: process.env.PA_USERNAME,
  password: process.env.PA_PASSWORD,
  keepalive: 5000
};

var client;

exports.connect = connect;
exports.get = get_file;
exports.get_xml = get_xml_file;
exports.list = get_directory_list;
exports.end = end_connection;

function get_file(file, callback) {

  connect(function(client) {
    var already_called_back = false;

    function c(err, result) {

      if (!already_called_back) {
        already_called_back = true;
        client.removeListener('error', c);
        callback(err, result || '');
      }
    }

    client.once('error', c);

    client.get(file, function(err, stream) {

      if (err || !stream) {
        c(err || new Error('No stream'));
        return;
      }

      stream.once('error', c);

      stream.pipe(accum.string(function(str) {
        stream.removeListener('error', c);
        c(null, str);
      }));

    });

  });
}

function get_xml_file(file, callback) {
  get_file(file, function(err, str) {
    if (err) {
      callback(err, null);
      return;
    }
    xml2js(str, function(parseErr, result) {
      if (parseErr) {
        callback(parseErr, null);
        return;
      }
      callback(null, result);
    });
  });
}

function get_directory_list(directory, callback) {

  connect(function(client) {

    var already_called_back = false;

    client.once('error', c);

    function c(err, result) {
      if (!already_called_back) {
        already_called_back = true;
        client.removeListener('error', c);
        callback(err || null, result || []);
      }
    }

    client.list(directory, function(err, list) {

      if (err) {
        c(err);
        return;
      }

      if (!list || !list.length) {
        debug('No files in the list, exiting');
        c();
        return;
      }

      if (typeof list[0] === 'string') {
        debug('using OSX directory listing format hack');
        list = list.map(parse_directory_list_item);
      }

      c(null, list);
    });

  });

}

function end_connection() {
  if (!client || !client.connected) return;
  return client.end();
}

function parse_directory_list_item(str) {
  var parts = str.split(/\s+/g);
  var dateString = [parts[6], parts[7], '2015', parts[8] + ':00', 'GMT+0100 (BST)'].join(' ');
  return {
    name : parts[parts.length - 1],
    date: dateString
  };
}

function connect(callback) {

  if (!client) {
    client = new FTPClient();
    client.setMaxListeners(0);
    client.on('close', function(hadErr) {
      debug('Connection closed' + (hadErr ? ' with Error' : ''));
    });

    client.on('error', function(err) {
      debug('Connection error: %s', err.message);
    });
  }

  if (!client.connected) {
    client.once('ready', function(){
      callback(client);
    });
    client.connect(options);
  } else {
    callback(client);
  }

  return client;
}
