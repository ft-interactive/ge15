'use strict';

const debug = require('debug')('db-update:PA-seats');
const db = require('../loki');
const FTPClient = require('ftp');
const xml2js = require('xml2js').parseString;
const accum = require('accum');
const _ = require('lodash');
const parties = require('uk-political-parties');

const dir = process.env.PA_RESULTS_DIR || '/results/';
const connectionOptions = {
  host: process.env.PA_HOSTNAME,
  port: 21,
  user: process.env.PA_USERNAME,
  password: process.env.PA_PASSWORD,
  keepalive: 20000
};


var maxAge = 1000 * 60;
var fetching = false;
var expires = 0;
var previousDirectoryList = {};
var lastTimestamp = 0;

module.exports = update;

function update(cb) {

  cb = cb || function () {};

  debug('call');

  if (!isStale()) {
    debug('cache not stale yet');
    cb();
    return;
  }

  start();

  var ftp = new FTPClient();

  console.log(connectionOptions);

  function error(err) {
    console.error(err && err instanceof Error ? err.message : err || 'Unknown Error');
    console.log(err.code);
    console.log(err.stack);
    ftp.end();
    fail();
    cb();
  }

  function close() {
    console.log('Close');
    ftp.end();
    done();
    cb();
  }

  ftp.on('close', function() {
    console.log('FTP connection closed');
  });

  ftp.on('end', function() {
    console.log('FTP connection ended');
  });

  ftp.on('error', function() {
    console.log('FTP connection error');
    error();
  });

  ftp.on('ready', function() {

    debug('ready, get .timestamp');

    ftp.get(dir + '.timestamp', function(err, stream) {


      if (err) {
        console.log('Error getting timestamp file');
        console.error(err);
        error(err);
        return;
      }

      stream.on('error', function() {
        console.error('Get timestamp stream error');
      });

      stream.pipe(accum.string(function(str) {

        var newTimestamp = Number(str);

        if (!str || isNaN(newTimestamp)) {
          error(err);
          return;
        }

        var changed = newTimestamp > lastTimestamp;
        debug('timestamp ' + (changed ? 'changed' : 'not changed') + ': old=' + lastTimestamp + ', new=' + newTimestamp);
        lastTimestamp = newTimestamp;

        if (!changed) {
          close();
          return;
        }

        ftp.list(dir, function(err, list) {

          if (err) {
            console.log('List error');
            console.error(err);
            error(err);
            return;
          }

          if (!list || !list.length) {
            debug('No files in the list');
            close();
          }

          if (typeof list[0] === 'string') {
            debug('using OSX directory listing format hack');
            list = list.map(function(str) {
              var parts = str.split(/\s+/g);
              var dateString = [parts[6], parts[7], '2015', parts[8] + ':00', 'GMT+0100 (BST)'].join(' ');
              return {
                name : parts[parts.length - 1],
                date: dateString
              };
            });
          }

          var latestDirectoryList = list.filter(generalElectionResult)
                                          .map(createFileDescriptor);

          debug('Size of list of Result/Rush/Recount xml files is ' + latestDirectoryList.length);

          var newOrModified = latestDirectoryList.filter(function(f) {
            return f.isNew;
          });

          debug('There are ' + newOrModified.length + ' new or modified files');

          var gotAllXMLFiles = _.after(newOrModified.length, close);

          newOrModified.forEach(function(file) {

            var filename = dir + file.name;

            debug('Get ' + filename);

            ftp.get(filename, function(err, seatStream) {

              if (err) {
                debug('Error getting ' + filename);
                console.error(err);
                error(err);
                return;
              }

              if (!seatStream) {
                console.error('No stream for file');
                return;
              }

              console.log('DONE:'+filename);
            return;
              debug('Streaming from ' + filename);

              seatStream.on('error', function(){
                console.error('Get file stream error');
              });

              seatStream.pipe(accum.string(function(str){

                xml2js(str, function(parseErr, result){
                  if (parseErr) {
                    debug('Error parsing ' + filename);
                    console.error(parseErr);
                    console.error(str);
                    error(parseErr);
                    return;
                  }


                  var dbSeat;
                  var constituency;
                  var pa_id;
                  var do_update = false;

                  if (file.isRecount) {
                    //dbSeat.elections.ge15.recount = true;
                    console.log('=== Recount ====');
                    console.log(str);
                  } else if (file.isRush) {


                      constituency = result.FirstPastThePostRush.Election[0].Constituency[0];
                      pa_id = constituency.$.number;

                      debug('Process rush file=' + file.name + ' pa_id=' + pa_id);

                      dbSeat = db.getCollection('seats').findOne({pa_id: constituency.$.number});

                      // if (!dbSeat) {
                      //   throw new Error('Cannot do lookup from PA ID to the DB');
                      // }

                      if (dbSeat.elections.ge15.source &&
                                typeof dbSeat.elections.ge15.source.type === 'number' &&
                                dbSeat.elections.ge15.source.type === 2) {
                        debug('Dont update rush, already have result. id=' + dbSeat.id + ' name="' + dbSeat.name + '" pa_id=' + pa_id + ' file=' + JSON.stringify(file) + ' source=' + JSON.stringify(dbSeat.elections.ge15.source));
                        gotAllXMLFiles();
                        return;
                      }

                      if (dbSeat.elections.ge15.source &&
                                typeof dbSeat.elections.ge15.source.type === 'number' &&
                                dbSeat.elections.ge15.source.type === 1 &&
                                typeof dbSeat.elections.ge15.source.revision === 'number' &&
                                dbSeat.elections.ge15.source.revision >= file.revision) {
                        debug('Dont update rush, later revision already received. id=' + dbSeat.id + ' name="' + dbSeat.name + '" pa_id=' + pa_id + ' file=' + JSON.stringify(file) + ' source=' + JSON.stringify(dbSeat.elections.ge15.source));
                        gotAllXMLFiles();
                        return;
                      }

                      debug('Adding rush data. id=' + dbSeat.id + ' name="' + dbSeat.name + '" pa_id=' + pa_id + ' file=' + file.name);

                      do_update = true;

                      dbSeat.elections.ge15 = {
                        articles: dbSeat.elections.ge15.articles || [],
                        recount: !!dbSeat.elections.ge15.recount,
                        turnout: null,
                        turnout_pc: null,
                        turnout_pc_change: null,
                        electorate: Number(constituency.$.electorate) || null,
                        change: constituency.$.gainOrHold !== 'hold',
                        source: {
                          // 0=not called yet
                          // 1=rush message only
                          // 2=result
                          type: 1,
                          message: constituency.$.paStyleMessageText,
                          filename: file.name,
                          revision: file.revision,
                          declarationTime: null // a rush message is not declared yet
                        },
                        winner: {
                          party: constituency.$.winningPartyAbbreviation
                        },
                        outgoing: {
                          party: constituency.$.sittingPartyAbbreviation,
                          person: dbSeat.elections.last.winner.person
                        },
                        others: {votes: 0, votes_pc: 0},
                        results: []
                      };

                  } else if (file.isResult) {

                    constituency = result.FirstPastThePostResult.Election[0].Constituency[0];
                    pa_id = constituency.$.number;

                    debug('Process result file=' + file.name + ' pa_id=' + pa_id);

                    dbSeat = db.getCollection('seats').findOne({pa_id: constituency.$.number});

                    // if (!dbSeat) {
                    //   throw new Error('Cannot do lookup from PA ID to the DB');
                    // }

                    if (dbSeat.elections.ge15.source &&
                              typeof dbSeat.elections.ge15.source.type === 'number' &&
                              dbSeat.elections.ge15.source.type === 2 &&
                              typeof dbSeat.elections.ge15.source.revision === 'number' &&
                              dbSeat.elections.ge15.source.revision >= file.revision) {
                      debug('No update needed. id=' + dbSeat.id + ' name="' + dbSeat.name + '" pa_id=' + pa_id + ' file=' + JSON.stringify(file) + ' source=' + JSON.stringify(dbSeat.elections.ge15.source));
                      gotAllXMLFiles();
                      return;
                    }

                    debug('Adding result data. id=' + dbSeat.id + ' name="' + dbSeat.name + '" pa_id=' + pa_id + ' file=' + file.name);

                    do_update = true;

                    dbSeat.elections.ge15 = {
                      articles: dbSeat.elections.ge15.articles || [],
                      recount: !!dbSeat.elections.ge15.recount,
                      turnout: Number(constituency.$.turnout),
                      turnout_pc: Number(constituency.$.percentageTurnout),
                      turnout_pc_change: Number(constituency.$.percentageChangeTurnout),
                      electorate: Number(constituency.$.electorate),
                      change: constituency.$.gainOrHold !== 'hold',
                      source: {
                        // 0=not called yet
                        // 1=rush message only
                        // 2=result
                        type: 2,
                        message: dbSeat.elections.ge15.source ? dbSeat.elections.ge15.source.message : '',
                        filename: file.name,
                        revision: file.revision,
                        declarationTime: new Date(result.FirstPastThePostResult.$.declarationTime)
                      },
                      winner: {
                        majority: Number(constituency.$.majority),
                        majority_pc: Number(constituency.$.percentageMajority),
                        person: null,
                      },
                      outgoing: {
                        person: null
                      },
                      others: {votes: 0, votes_pc: 0},
                      results: []
                    };

                    var knowPartiesTotals = {
                      votes: 0,
                      votes_pc: 0
                    };

                    dbSeat.elections.ge15.results = constituency.Candidate.map(function(candidate) {

                      var partyCode = parties.paToCode(candidate.Party[0].$.abbreviation);
                      var isOther = !parties.isKnownParty(partyCode);

                      var o = {
                        party: isOther ? 'other' : partyCode,
                        person: candidate.$.firstName + ' ' + candidate.$.surname,
                        winner: candidate.$.elected === '*',
                        loser: candidate.$.previousSittingMember === '*',
                        votes: Number(candidate.Party[0].$.votes),
                        votes_pc: Number(candidate.Party[0].$.percentageShare)
                      };

                      if (o.loser) {
                        dbSeat.elections.ge15.outgoing.party = o.party;
                        dbSeat.elections.ge15.outgoing.person = o.candidate_name;
                        dbSeat.elections.ge15.outgoing.votes = o.votes;
                        dbSeat.elections.ge15.outgoing.votes_pc = o.votes_pc;
                      } else if (o.elected) {
                        dbSeat.elections.ge15.winner.party = o.party;
                        dbSeat.elections.ge15.winner.person = o.candidate_name;
                        dbSeat.elections.ge15.winner.votes = o.votes;
                        dbSeat.elections.ge15.winner.votes_pc = o.votes_pc;
                      }

                      if (isOther) {
                        o.otherPartyName = candidate.Party[0].$.name;
                      } else {
                        knowPartiesTotals.votes += o.votes;
                        knowPartiesTotals.votes_pc += o.votes_pc;
                      }

                      return o;

                    });

                    dbSeat.elections.ge15.others = {
                      votes: dbSeat.elections.ge15.turnout - knowPartiesTotals.votes,
                      votes_pc: roundDp(100 - knowPartiesTotals.votes_pc, 2)
                    };

                  }

                  if (dbSeat && do_update) {
                    debug('Update seat id=' + dbSeat.id + ' name="' + dbSeat.name + '" pa_id=' + pa_id + ' filename=' + file.name);
                  //  console.dir(dbSeat.elections.ge15);
                    db.getCollection('seats').update(dbSeat);
                  }

                  gotAllXMLFiles();

                });

              }));

            });

          });

          previousDirectoryList = _.indexBy(latestDirectoryList, 'name');
        });

      }));

    });
  });

  ftp.connect(connectionOptions);

}

function createFileDescriptor(file) {
  var f = { name: file.name, date: new Date(file.date).getTime() };
  console.dir(f);
  var last = previousDirectoryList[f.name];
  var v = f.name.match(/_(\d+)\.xml/);
  f.isNew = !last || last.date < f.date;
  f.isRecount = /_recount_/.test(f.name);
  f.isRush = /_rush_/.test(f.name);
  f.isResult = /_result_/.test(f.name);
  f.revision = v && v.length === 2 ? Number(v[1]) : null;

  return f;
}

function generalElectionResult(file) {
  return file.name.charAt(0) !== '.' &&
         file.name.endsWith('.xml') &&
         /General_Election_(result|rush|recount)_/.test(file.name);
}

function done() {
  debug('done');
  fetching = false;
  expires = Date.now() + maxAge;
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

function roundDp(num, dp) {
  var ex = Math.pow(10, dp);
  return Math.round(num * ex) / ex;
}
