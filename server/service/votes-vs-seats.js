'use strict';

var _ = require('lodash');
var ukParties = require('uk-political-parties');

module.exports = function () {
  // dummy data, based roughly on electionforecast.co.uk
  var data = [
    {
      party: 'lab',
      percentVoteWon: 32.6,
      percentSeatsWon: 283 / 6.5
    },
    {
      party: 'c',
      percentVoteWon: 34.4,
      percentSeatsWon: 271 / 6.5
    },
    {
      party: 'ld',
      percentVoteWon: 12.5,
      percentSeatsWon: 24 / 6.5
    },
    {
      party: 'green',
      percentVoteWon: 3.7,
      percentSeatsWon: 1 / 6.5
    },
    {
      party: 'ukip',
      percentVoteWon: 10.7,
      percentSeatsWon: 1 / 6.5
    },
    {
      party: 'snp',
      percentVoteWon: 3.6,
      percentSeatsWon: 47 / 6.5
    },
    {
      party: 'dup',
      percentVoteWon: 0.1,
      percentSeatsWon: 8 / 6.5
    },
    {
      party: 'sf',
      percentVoteWon: 0.1,
      percentSeatsWon: 0 / 6.5
    },
    {
      party: 'pc',
      percentVoteWon: 0.6,
      percentSeatsWon: 4 / 6.5
    },
    {
      party: 'alliance',
      percentVoteWon: 0.1,
      percentSeatsWon: 0 / 6.5
    },
    {
      party: 'other',
      percentVoteWon: 1.8,
      percentSeatsWon: 8 / 6.5
    },
    {
      party: 'sdlp',
      percentVoteWon: 0.1,
      percentSeatsWon: 3 / 6.5
    },
    {
      party: 'uup',
      percentVoteWon: 0.1,
      percentSeatsWon: 0 / 6.5
    }
  ];

  data.forEach(function (d) {
    d.name = d.party === 'ld' ?
      'Lib Dem' :
      ukParties.fullName(d.party);

    d.colour = ukParties.colour(d.party);
  });


  return Promise.resolve({
    headline: 'Popular vote vs. seats won',
    parties: _.take(_.sortBy(data, 'percentVoteWon').reverse(), 6),

    // Key dimensions are given as template locals, so we can easily make a
    // bigger version for use elsewhere.
    // These dimensions are good for the liveblog:
    totalWidth: 352,
    labelsWidth: 100,
    trackLength: 352 - (100 + 20), // rail width, minus labels width and a little extra margin
    rowHeight: 26,
    seatsIconSize: 12,
    trackThickness: 16,
    barThickness: 10,
  });
};
