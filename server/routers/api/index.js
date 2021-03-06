'use strict';

const filter = require('koa-json-filter');
const _ = require('lodash');
const app = require('../../util/app');
const groupby = require('../../middleware/groupby');
const db = require('../../../db');
const service = require('../../service');
const csv = require('dsv')(',');

const params = {
  collection: function*(name, next) {
    this.collection = db.getCollection(name);
    this.assert(this.collection, 404, 'Collection ' + name + ' not found');
    yield next;
  },
  field: function*(field, next) {
    this.f = {};
    this.f[field] = this.params.value;
    yield next;
  },
  where : function*(where, next) {
    where = where.split(';').reduce(function(r, s){
      var pair = s.split(':');
      var k = pair[0];
      var v = pair[1];

      if (v) {
        if (v === 'null') {
          v = null;
        } else if (v === 'true') {
          v = true;
        } else if (v === 'false') {
          v = false;
        } else if (_.isFinite(Number(v))) {
          v = Number(v);
        } else if (v.charAt(0) === '[' && v.charAt(v.length-1) === ']') {
          v = v.substring(1,v.length-1).split(/ *, */);
        }
      }

      r[k] = v;
      return r;

    }, {});
    this.data = _.where(this.entity.list, where);
    yield next;
  },
  at: function*(at, next) {
    var index = parseInt(at);

    this.assert(_.isFinite(index), 400, 'Index must be a integer');

    if (index < 0) {
      index = this.data.length + index;
    }

    this.data = this.data[index];
    this.assert(this.data, 404, 'Not found');
    yield next;
  },
  id: function*(id, next) {
    this.data = this.collection.findOne({id: id});
    this.assert(this.data, 404);
    yield next;
  },
  ids: function*(ids, next) {
    ids = ids.split(/ *, */).sort();
    this.data = this.collection.find({id: {'$in': ids}});
    yield next;
  }
};

const middleware = {
  index: function*(next) {
    this.body = this.collection.find();
    yield next;
  },
  op: function*(next) {
    var data;
    switch (this.params.op) {
      case 'by':
        data = this.collection.findOne(this.f);
        break;
      case 'find':
        data = this.collection.find(this.f);
        break;
      default:
        this.throw(404);
      break;
    }
    this.assert(data, 404);
    this.body = data;
    yield next;
  },
  by: function*(next) {
    var query = {};
    query[this.params.field] = this.params.value;
    var data = this.collection.findOne(query);
    this.assert(data, 404);
    this.body = data;
    yield next;
  },
  all: function*(next) {
    var query = {};
    query[this.params.field] = this.params.value;
    var data = this.collection.find(query);
    this.assert(data, 404);
    this.body = data;
    yield next;
  },
  postcode: function*(next) {
    this.req.headers.accept = 'application/json';
    var data = yield service.postcode(this.params.postcode);
    this.body = data;
  },
  point: function*(next) {
    this.req.headers.accept = 'application/json';
    var data = yield service.point(this.params.lon, this.params.lat);
    this.body = data;
  },
  place: function*(next) {
    this.req.headers.accept = 'application/json';
    var data = yield service.place(this.params.search);
    this.body = data;
  },
  neighbours: function*(next) {
    this.req.headers.accept = 'application/json';
    var data = yield service.neighbours(this.params.seat_id);
    this.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=60, stale-if-error=3600');
    this.set('Surrogate-Control', 'max-age=60');
    this.body = data;
  },
  seats_digest: function*(next) {
    var data = service.seats_digest({show_main_parties: !!this.query['show-main-parties']});
    this.set('X-GE15-Seat-Result-Count', data.result_count);
    this.set('X-GE15-Seat-Rush-Count', data.rush_count);
    this.set('X-GE15-Seat-Recount-Count', data.recount_count);
    this.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=60, stale-if-error=3600');
    this.set('Surrogate-Control', 'max-age=30');
    this.body = data.seats;
    yield next;
  },
  parties_digest: function*(next) {
    var filter_parties = this.query['filter-parties'] ? this.query['filter-parties'].toLowerCase().split(',') : null;
    var rollup_others = !!this.query['rollup-others'];
    var data = service.parties_digest({filter_parties: filter_parties, rollup_others: rollup_others});
    this.set('X-GE15-Seats-Count', data.counts.seats);
    this.set('X-GE15-Votes-Count', data.counts.votes);
    this.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=60, stale-if-error=3600');
    this.set('Surrogate-Control', 'max-age=30'); // jshint ignore:line
    this.body = data.parties;
    yield next;
  }
};

function* secret(next) {
  this.assert(this.query.secret === process.env.API_SECRET, 401);
  yield next;
}

function main() {
  return app({views:false})
          .use(function*(next) {

            var isCSV = this.query.type === 'csv';
            yield *next;

            if (isCSV) {
              this.type = 'text/csv';
            }

            var body = this.body;

            if (Array.isArray(body) && isCSV) {
              this.body = csv.format(body);
            }

          })
          .use(function*(next){
            yield *next;

            var body = this.body;

            // non-json
            if (!body || 'object' !== typeof body) return;

            // check for pluck
            var pluck = this.query.pluck || this.pluck;
            if (!pluck) return;

            if (Array.isArray(body)) {
              this.body = _.pluck(body, pluck);
              return;
            }

            var p = body[pluck];
            this.body = p == null ? '' : p;
          })
          .use(groupby())
          .use(filter())
          .use(function*(next) {
            yield *next;
            if (!this.query.indexby) return;
            if (!Array.isArray(this.body)) return;

            this.body = _.indexBy(this.body, this.query.indexby);
          })
          .router()
          .param('collection', params.collection)
          .param('field', params.field)
          .get('/lookup/postcode/:postcode', middleware.postcode)
          .get('/lookup/point/:lon,:lat', middleware.point)
          .get('/lookup/place/:search', middleware.place)
          .get('/lookup/neighbours/:seat_id', middleware.neighbours)
          .get('/digest/seats', middleware.seats_digest)
          .get('/digest/parties', middleware.parties_digest)
          .get('/collection/:collection', middleware.index)
          .get('/collection/:collection/:op/:field\::value', middleware.op)
          .get('/db/reload', secret, function* (next) {
            db.reload_sync();
            this.body = 'ok';
            yield next;
          })
          ;

}

module.exports = main;
