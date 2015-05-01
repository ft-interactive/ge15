'use strict';

const S = require('string');
S.extendPrototype();
const n = require('numeral')();
const _ = require('lodash');
const parties = require('uk-political-parties');
const debug = require('debug')('filters');
const d3 = require('d3');

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
  return n.set(val).format(format);
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

exports.sortBy = function(array, property) {
  debug(array, property);
  return _.sortBy(array, property);
};

exports.json = function(obj) {
  return JSON.stringify(obj, null, 0);
};

exports.partyAbbreviation = function(str) {
  return parties.shortName(str);
};

exports.partyClassName = function(str) {
  return parties.className(str);
};

exports.partyFullName = function(str) {
  return parties.fullName(str);
};

exports.partyShortName = function(str) {
  return parties.shortName(str);
};

exports.partyColor = function(str) {
  return parties.colour(str);
};

exports.round = function(number, dp) {
  var expo = Math.pow(10, dp || 0);
  return Math.round(number * expo) / expo;
};

exports.ftdate = function(date) {
  date = new Date(date);
  var format = d3.time.format("%B %e, %Y %I:%M %p");
  return format(date).replace(/(AM|PM)$/, function($1){
    return $1 ? $1.toLowerCase() : '';
  });
};

exports.percentageOf = function(part, whole) {
  return parseFloat(part)/whole * 100;
};

exports.change = function(value){
  if(value>0) return '+'+value;
  return value;
};

exports.diamondPath = function(size) {
  return (
    'M 0 0 L ' + (size/2) + ' ' + (size/2) +
    ' L 0 ' + size + ' L ' + (0-size/2) + ' ' + (size/2) +
    ' L 0 0 L ' + (size/2) + ' ' + (size/2)
  );
};
