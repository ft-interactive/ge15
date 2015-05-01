'use strict'

const loki = require('lokijs');
const instance = new loki('db/data.json');

module.exports = instance;
