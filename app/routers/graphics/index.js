var app = require('../../util/app');

function* slope(next) {
  this.body = 'I am a slope chart for the "' + this.params.constituency + '" constituency';
  yield next;
}

function* map(next) {
  this.body = 'I am a map chart for the "' + this.params.constituency + '" constituency';
  yield next;
}

function main() {
  return app().router()
  .get('/slopes/constituency/:constituency.svg', slope)
  .get('/maps/constituency/:constituency.svg', map);
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
