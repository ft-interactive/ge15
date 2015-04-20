'use strict';

// Ensure we are running the correct version of Node
var pkg = require('./package.json');
if (process.version.substr(1) !== pkg.engines.node) {
  console.error('\nYou are using the wrong Node version: ' + process.version);
  console.error('\nTry this:\n  $ n ' + pkg.engines.node + '\n');
  process.exit(1);
}

var fs = require('fs');
var _ = require('lodash');

var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var csso = require('gulp-csso');
var filter = require('gulp-filter');
var jshint = require('gulp-jshint');
var livereload = require('gulp-livereload');
var nodemon = require('gulp-nodemon');

var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var revNapkin = require('gulp-rev-napkin');

var sass = require('gulp-ruby-sass');
var scsslint = require('gulp-scss-lint');
var es = require('event-stream');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var imagemin = require('gulp-imagemin');

var browserify = require('browserify');
var watchify = require('watchify');
var dotenv = require('dotenv');
var source = require('vinyl-source-stream');
var rimraf = require('rimraf');
var glob = require('glob');
var dev = false;

process.stdin.setMaxListeners(0);
process.stdout.setMaxListeners(0);

dotenv.load();
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

gulp.task('default', ['lint', 'clean', 'rev', 'images']);

var vendorBundle = [
  {file:'./bower_components/headroom.js/dist/headroom.js', expose:'headroom.js'},
  {file:'./bower_components/dom-delegate/lib/delegate.js', expose:'dom-delegate'},
  {file:'./bower_components/o-hoverable/main.js', expose:'o-hoverable'},
  {file:'./bower_components/o-date/main.js', expose:'o-date'},
  {file:'./bower_components/topojson/topojson.js', expose:'topojson'},
  'd3'
];


// TODO:
// CDNify urls in js and css

gulp.task('sass', function() {
  var style = dev ? 'expanded' : 'compressed';
  return sass('client/scss/', {
          sourcemap: false,
          loadPath: ['bower_components', '.'],
          precision: 5,
          quiet: dev,
          debugInfo: dev,
          style: style
        }).on('error', function (err) { console.log(err.message); if (!dev) throw err; })
        .pipe(autoprefixer({
          browsers: ['> 5%', 'iOS >= 6', 'IE >= 7', 'FF ESR', 'last 2 versions'],
          cascade: dev,
          remove: true
        }))
        .pipe(gulp.dest('./public/css'));
});

function createBrowserify(entry, bundle, watch) {

  var o = {
    entries: './client/js/' + entry,
    debug: dev
  };

  var b = browserify(o, watch ? watchify.args : undefined);

  if (watch) {
    b = watchify(b);
  }

  var e = _.assign({}, process.env, {_: 'purge'});

  b.transform('debowerify');

  b.external(vendorBundle.map(function (v) {
    if (typeof v === 'string') return v;
    return v.expose;
  }));

  b.transform('envify', e);

// Transforms we might need here
// Browserify-shim for JS libs without commonsJS.
// swigify
// node-csvify
  if (watch) {
    b.on('update', rebundle);
  }

  function rebundle() {
    return b.bundle()
          .on('error', function(evt){
            gutil.log('Browserify Error', evt);
            var errFile = 'var stack = ' + JSON.stringify(evt.stack) + ';' +
            'var err = ' + JSON.stringify(evt) + ';console.error("Browserify Error in ' + entry + ': ' + evt.message + '", stack, err)';
            fs.writeFileSync('./public/js/' + bundle, errFile);
          })
          .pipe(source(bundle))
          .pipe(gulp.dest('./public/js'));
  }

  b.end = function() {
    return rebundle();
  };

  return b;
}

gulp.task('vendor', function(cb) {

  browserify({
    debug: dev
  })
  .transform('debowerify')
  .require(vendorBundle)
  .bundle()
  .on('error', cb)
  .on('end', cb)
  .pipe(source('vendor.js'))
  .pipe(gulp.dest('./public/js'));

});

function getBundles() {
  return glob.sync('**/*.main.js', {cwd: 'client/js', nodir: true}).map(function(filename){
    return {file: filename, bundle: filename.replace('.main.js', '.js')};
  });
}

gulp.task('bundles', function(cb) {

  var waiting = 0;

  function r() {
    waiting--;
    if (!waiting) cb();
  }

  getBundles()
    .map(function(d) {
      waiting++;
      return createBrowserify(d.file, d.bundle, false)
              .transform('stripify');
    })
    .forEach(function(b) {
      b.end()
        .on('error', cb)
        .on('end', r);
    });
});

gulp.task('js', ['bundles', 'vendor']);

gulp.task('rev', ['compress'], function () {
  return gulp.src(['public/css/**/*.css', 'public/js/**/*.js'], {base: 'assets'})
        .pipe(gulp.dest('public'))  // copy original assets to build dir
        .pipe(rev())
        .pipe(revReplace({replaceInExtensions: ['.css']}))
        .pipe(revNapkin({verbose:false}))
        .pipe(gulp.dest('public')) // write rev'd assets to build dir
        .pipe(rev.manifest())
        .pipe(gulp.dest('public')); // write manifest to build dir
});

gulp.task('compress', ['sass', 'js'], function() {
  var css = filter('css/*.css');
  var js = filter('js/**/*.js');
  return gulp.src('public/**')
        .pipe(css)
        .pipe(csso())
        .pipe(css.restore())
        .pipe(js)
        .pipe(uglify({preserveComments: 'some'}))
        .pipe(js.restore())
        .pipe(gulp.dest('public'));
});

gulp.task('clean', function(cb) {
  rimraf.sync('public');
  cb();
});

gulp.task('jshint', function(cb) {
  gulp.src('client/js/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .on('error', cb)
    .on('finish', cb);
});

function customFailReporter() {
  return es.map(function(file, cb) {
    var error;

    if (file.scsslint.errors) {
      error = new gutil.PluginError('gulp-scss-lint', {
        message: 'ScssLint failed for: ' + file.relative,
        showStack: false
      });
    }

    cb(error, file);
  });
}

gulp.task('scsslint', function(cb) {
  gulp.src('client/scss/**/*.scss')
    .pipe(scsslint())
    .pipe(customFailReporter())
    .on('error', cb)
    .on('end', cb);
});

gulp.task('lint', ['jshint', 'scsslint']);

gulp.task('images', function(cb){
  return gulp.src('client/images/**/*')
        .pipe(imagemin({
            progressive: true,
            multipass: false,
            svgoPlugins: [{removeViewBox: false},{removeUselessDefs: false}]
        }))
        .pipe(gulp.dest('public/images'));
});

gulp.task('dev', function(cb) {
  dev = true;
  cb();
});

gulp.task('watch', ['dev', 'sass', 'vendor', 'images'], function() {

  var bundles = getBundles().map(function (d) {
    return createBrowserify(d.file, d.bundle, true);
  });

  livereload.listen();

  function startServer() {
    nodemon({
      script: 'app.js',
      nodeArgs: ['--harmony'],
      quiet: true,
      delay: 0.1,
      watch: ['server', 'app.js'],
      ext: 'js,json'
    })
    .on('start', function(a) {
      setTimeout(function() {
        livereload.changed(a);
        gutil.log('Serving at ' +
          gutil.colors.underline('http://localhost:' + (process.env.PORT || 3000) + '/')
        );
      }, 1100);
    });
  }

  var waiting = bundles.length;

  function dec() {
    waiting--;
    if (!waiting) startServer();
  }

  bundles.forEach(function(b){
    b.end().on('end', dec);
  });

  gulp.watch('./{public,templates}/**/*.*').on('change', livereload.changed);
  gulp.watch('./client/scss/**/*.scss', ['sass']);
  gulp.watch('./client/images/**/*.{svg,png,jpg}', ['images']);

});
