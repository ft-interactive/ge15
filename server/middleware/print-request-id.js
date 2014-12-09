function *fn(next) {
  this.set('X-Request-Id', this.id);
  yield next;
};

module.exports = function() {
  return fn;
}
