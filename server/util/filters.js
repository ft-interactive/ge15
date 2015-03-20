'use strict';

var S = require('string');
S.extendPrototype();
var n = require('numeral')();
var _ = require('lodash');
var d3 = require('d3');

exports.times = function(val, num) {
  return S(val).times(num).s;
};

exports.add = function(val, num) {
  var u = Number(num);
  if (!_.isNumber(u)) return num.toString();
  return n.value(val).add(u);
};

exports.subtract = function(val, num) {
  var u = Number(num);
  if (!_.isNumber(u)) return num.toString();
  return n.value(val).subtract(u);
};

exports.multiply = function(val, num) {
  var u = Number(num);
  if (!_.isNumber(u)) return num.toString();
  return n.value(val).multiply(u);
};

exports.divide = function(val, num) {
  var u = Number(num);
  if (!_.isNumber(u)) return num.toString();
  return n.value(val).divide(u);
};

exports.format = function(val, format) {
  return n.value(val).format(format);
};

exports.unformat = function(val, format) {
  return n.value(val).unformat(format);
};

exports.zeroFormat = function(val) {
  return n.value(val).zeroFormat();
};

exports.isEmpty = function(value) {
  return _.isEmpty(value);
};

exports.objectValues = function(obj) {
  return _.values(obj);
};

exports.mapValues = function(dict, property) {
  return _.mapValues(dict, property);
};

exports.sample = function(collection, x) {
  return _.sample(collection, x);
};

exports.shuffle = function(collection) {
  return _.shuffle(collection);
};

exports.size = function(collection) {
  return _.size(collection);
};

exports.pluck = function(obj, property) {
  return _.pluck(obj, property);
};

exports.json = function(obj) {
  return JSON.stringify(obj, null, 0);
};

exports.partyAbbreviation = function(str){
  var lookup = {'c':'Con', 'lab':'Lab', 'ld':'LD', 'snp':'SNP', 'pc':'PC', 'green':'Grn', 'ukip':'Ukip', 'other':'Oth', 'Conservatives':'c', 'Labour':'lab', 'Liberal Democrats':'LD', 'Plaid Cymru':'PC', 'Greens':'Grn', 'Other':'Oth'};
  if(lookup[str]) return lookup[str];
  return str;
};

exports.ftdate = function(date){
  //var format = d3.time.format("%B %e, %Y %I:%M %p");
  return 'date'//format(date);
};
