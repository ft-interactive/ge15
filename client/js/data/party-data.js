'use strict';

var invert = require('lodash-node/modern/objects/invert');

var partyShortName = {
  'lab':'Lab',
  'c':'Con',
  'ld':'LD',
  'green':'Grn',
  'ukip':'UKIP',
  'snp':'SNP',
  'dup':'DUP',
  'sf':'SF',
  'pc':'PC',
  'alliance':'A',
  'other':'Oth'
};

var partyFullName = {
  'lab':'Labour',
  'c':'Conservatives',
  'ld':'Liberal Democrats',
  'green':'Greens',
  'ukip':'UKIP',
  'snp':'SNP',
  'dup':'DUP',
  'sf':'SF',
  'pc':'Plaid Cymru',
  'alliance':'Alliance',
  'other':'Other'
};

var partyColours = {
  'c':'#6da8e1',
  'lab':'#e25050',
  'ld':'#ffc660',
  'ukip':'#ca6dbf',
  'green':'#65a68c',
  'snp':'#f2e24d',
  'other':'#cccccc',
  'pc':'#827996'
};

module.exports = {
  shortNames:partyShortName,
  fullName:partyFullName,
  colours:partyColours,
  shortNameToCode:invert(partyShortName),
  fullNameToCode:invert(partyFullName)
};
