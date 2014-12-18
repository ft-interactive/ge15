var app = require('../../util/app');
var models = require('../../models');
var Party = models.Party;

function values(d) {
  return d.dataValues;
}

var partiesOrderBy = [[{raw: "upper(replace(shortname, ' ', ''))"}, 'ASC']];

function* home(next) {
  this.locals.parties = yield Party.findAll({order: partiesOrderBy}).map(values);
  yield this.render('party-index', {});
  yield next;
}

function* party(next) {
  this.locals.party = yield Party.find({where: {slug: this.params.party}});
  this.assert(this.locals.party, 404, 'Party not found.');
  yield this.render('party', {});
  yield next;
}

function main() {
  return app()
        .router()

        // parties home page
        .get('home', '/', home)
        .get('party', '/:party', party);
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
