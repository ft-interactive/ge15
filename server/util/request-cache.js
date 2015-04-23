 'use strict';

const r = require('request-promise');
const errors = require('request-promise/errors');
const wreck = require('wreck');
const _ = require('lodash');
const stringify = require('json-stringify-safe');
const debug = require('debug')('request-cache');
const lru = require('lru-cache');

var cache = lru({
  max: 1e7,
  length: function(n) {
    // content-length isn't strictly the size of what's actually stored in memory
    // but its the quickest things to calculate.
    // For our purposes fuzzy is better than accurate.
    // If content-length not available then fall back to more accurate calculation.
    var len;
    if (n.headers && n.headers['content-length']) {
      len = Number(n.headers['content-length']);
    } else if (typeof n === 'string') {
      len = Buffer.byteLength(n);
    } else if (Buffer.isBuffer(n)) {
      len = n.length;
    } else if ('lock' in n) {
      len = 2; // could the lock objects at 2 bytes
    } else {
      len = Buffer.byteLength(stringify(n));
    }

    return isNaN(len) || len < 0 ? Infinity : len;

  }
});

module.exports = cachedRequest;

function cachedRequest(options) {

  if (typeof options === 'string') {
    options = { uri: options };
  }

  options = _.assign({failStale: true, timeout: 10000}, options);
  options.uri = options.uri || options.url;
  options.method = options.method ? options.method.toUpperCase() : 'GET';
  options.headers = options.headers || {};

  if (options.method !== 'GET' || options.fresh) {
    debug('Not a GET request', options.uri);
    return r(options);
  }

  // TODO: What about the Vary header?
  //       Do we therefore need a nested cache?
  //       How would Vary appear in the key?
  // FIXME: include qs in key.
  // FIXME: include transform in key
  var key = [options.uri, options.json].filter(function(s) {
     return !!s;
  }).join(':');

  var cachedResponse = cache.get(key);
  var hasExpired = false;

  if (cachedResponse && !cachedResponse.lock) {

    hasExpired = !cachedResponse.waiting && Date.now() > cachedResponse.expires;

    if (hasExpired) {
      debug('In the cache but stale', key);
      if (cachedResponse.headers.etag) {
        debug('Has etag', key);
        options.headers['if-none-match'] = cachedResponse.headers.etag;
      } else if(cachedResponse.headers['last-modified']) {
        debug('Has last-modified', key);
        options.headers['if-modified-since'] = cachedResponse.headers['last-modified'];
      }
    } else if (cachedResponse.reason) {
      debug('Using cached ERROR response', key);
      // Remake the error object using the details from the cached request.
      // Unfortunately we loose some of the original request and response info
      // because it's too big to cache.
      if (cachedResponse.reason.statusCode) {
        return Promise.reject(new errors.StatusCodeError(cachedResponse.reason.statusCode, cachedResponse.reason.message));
      }
      return Promise.reject(new errors.RequestError(cachedResponse.reason.message));

    } else {
      debug('Using cached 200 response', key);

      // TODO: should we make a deep clone of the body?
      //       in case the object gets modified by the application?
      return Promise.resolve(cachedResponse.body);
    }

    cachedResponse.waiting = true;
  } else if (!cachedResponse) {
    cache.set(key, {waiting: true, lock: true});
  }

  options.resolveWithFullResponse = true;

  var transform = function(b) {
    return b;
  };

  if (_.isFunction(options.transform)) {
    transform = options.transform;
    options.transform = undefined;
  }

  debug('Requesting from origin', key);

  var timer = Date.now();

  return r(options).then(function(response) {

    console.log('remote=' + options.uri, 'time=' + (Date.now() - timer), 'status=' + response.statusCode);

    response.body = transform(response.body, response);

    var cacheControlExpire = expireFromHeaders(response.headers);

    var expires = !isNaN(options.maxAge) ? Math.min(cacheControlExpire, future(options.maxAge)) : cacheControlExpire;

    if (!expires) {
      debug('Dont store in cache', key);
      cache.del(key);
      return response.body;
    }

    var headers = _.pick(response.headers, [
      'etag',
      'last-modified',
      'cache-control',
      'expires',
      'content-length',
      'content-type'
    ]);

    var store = {
      headers: headers,
      body: response.body,
      statusCode: response.statusCode,
      expires: expires
    };

    cachedResponse = null;
    debug('Store in cache', key);
    store.waiting = false;
    delete store.lock;
    cache.set(key, store);
    return store.body;

  }, function(response) {

    var complete = Date.now() - timer;
    var cacheControlExpire;
    var resolve = false;
    var del = false;
    var store;

    if (hasExpired && response.statusCode === 304) {
      cacheControlExpire = expireFromHeaders(cachedResponse.headers);
      store = cachedResponse;
      store.statusCode = response.statusCode;
      store.expires = !isNaN(options.maxAge) ? Math.min(cacheControlExpire, future(options.maxAge)) : cacheControlExpire,
      resolve = true;
      console.log('remote=' + options.uri, 'time=' + complete, 'status=' + response.statusCode, 'reason=notModified');
    } else if (hasExpired && options.failStale) {
      store = cachedResponse;
      resolve = true;
      console.log('remote=' + options.uri, 'time=' + complete, 'status=' + response.statusCode, 'reason=failStale');
      debug('Fail stale', key, response.statusCode, response.message);
    } else {
      store = {
        statusCode: response.statusCode,
        expires: 0,
        headers: {},
        body: null,
        reason: _.pick(response, [
          'statusCode',
          'name',
          'message',
          'cause'
        ])
      };
      console.error('remote=' + options.uri, 'time=' + complete, 'status=' + response.statusCode, 'reason=error', 'detail=' + JSON.stringify(store.reason));
    }

    if (!store.expires) {
      del = true;
    }

    cachedResponse = null;
    var msg = ' ' + (resolve ? '304' : 'ERROR') + ' in cache';

    if (del) {
      debug('Del' + msg, key);
      cache.del(key);
    } else {
      debug('Store' + msg, key);
      store.waiting = false;
      delete store.lock;
      cache.set(key, store);
    }

    if (resolve) {
      return Promise.resolve(store.body);
    } else {
      return Promise.reject(response);
    }

  });

}

function future(v) {
  return Date.now() + v;
}

function expireFromHeaders(headers) {
  // default 1 month
  var maxage = 2629740000;

  if (!headers) {
    return 0;
  }

  // cache-control takes presence over the older types
  // of caching header (expires and prama).
  if (headers['cache-control']) {

    var cc = wreck.parseCacheControl(headers['cache-control']);
    var smaxage = 's-maxage' in cc ? parseInt(cc['s-maxage']) : NaN;
    if (cc['private'] || cc['no-cache'] || cc['no-store']) {
      return 0;
    } else if (cc['must-revalidate'] || cc['proxy-revalidate']) {
      // immediately stale
      return Date.now();
    } else if (!isNaN(smaxage) && typeof smaxage === 'number') {
      maxage = smaxage * 1000;
    } else if (typeof cc['max-age'] === 'number') {
      maxage = cc['max-age'] * 1000;
    }

  } else if (headers['pragma'] === 'no-cache') {
    return 0;
  } else if (headers['expires']) {
    var d = new Date(headers['expires']).getTime();

    // If expires header is an invalid date then
    // be cautious and prevent caching.
    if (isNaN(d)) {
      return 0;
    }

    return d;
  }

  return future(maxage);
}
