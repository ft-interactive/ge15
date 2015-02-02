var app = require('../../util/app');

function* gtg(next) {
  this.set('Cache-Control', 'no-cache');
  this.body = 'OK';
}

function* home(next) {
  this.redirect('/uk/2015/forecast/');
  this.status = 302;
}

function main() {
  return app().router()
  .get('/', home)
  .get('/__gtg', gtg);
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
