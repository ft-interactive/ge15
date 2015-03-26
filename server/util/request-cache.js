 'use strict';

var r = require('request-promise');
var errors = require('request-promise/errors');
var wreck = require('wreck');
var _ = require('lodash');
var stringify = require('json-stringify-safe');
var debug = require('debug')('request-cache');
var lru = require('lru-cache');

var cache = lru({
  max: 1e8,
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

  if (cachedResponse) {

    hasExpired = cachedResponse.expires < Date.now();

    if (hasExpired) {
      debug('In the cache but stale', key);
      if (cachedResponse.headers.etag) {
        options.headers['if-none-match'] = cachedResponse.headers.etag;
      } else if(cachedResponse.headers['last-modified']) {
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

  return r(options).then(function(response, a, b) {

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
      body: hasExpired && response.statusCode === 304 ? cachedResponse.body : response.body,
      statusCode: response.statusCode,
      expires: expires
    };

    cachedResponse = null;
    debug('Store in cache', key);
    cache.set(key, store);
    return store.body;

  }, function(response) {
    var reason = _.pick(response, [
      'statusCode',
      'name',
      'message',
      'cause'
    ]);

    // TODO: expiry logic for errors needs more thought.
    //       this might suffice for now
    var expires;
    var cacheControlExpire;

    if (response.headers) {
      cacheControlExpire = expireFromHeaders(response.headers);
      expires = !isNaN(options.maxAge) ? Math.min(cacheControlExpire, future(options.maxAge)) : cacheControlExpire;
    } else {
      expires = !isNaN(options.maxAge) ? future(options.maxAge) : future(10000);
    }

    var store = {
      statusCode: response.statusCode,
      expires: expires,
      headers: {},
      reason: reason
    };

    debug('Store ERROR in cache', key);
    cache.set(key, store);
    return Promise.reject(response);
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
