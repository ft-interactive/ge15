var app = require('../../util/app');

function* gtg(next) {
  this.set('Cache-Control', 'no-cache');
  this.body = 'OK';
}

function main() {
  return app().router()
  .get('/__gtg', gtg);
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
