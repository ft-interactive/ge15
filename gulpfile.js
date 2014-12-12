var fs = require('fs');

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
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

var browserify = require('browserify');
var watchify = require('watchify');
var debowerify = require('debowerify');
var envify = require('envify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var rimraf = require('rimraf');
var dev = false;

process.stdin.setMaxListeners(0);
process.stdout.setMaxListeners(0);

gulp.task('default', ['lint', 'rev']);

// TODO:
// svg minification
// Revving
//  - html, css, js need to refer to revved files.
// CI Build
//   - codeship or travis
// CDNify urls in js and css
// Haikro
//   - move deps to devdeps
//   - build packs

gulp.task('sass', function() {
  var style = dev ? 'expanded' : 'compressed';
  return sass('client/scss/', {
          sourcemap: false,
          loadPath: 'bower_components',
          precision: 5,
          quiet: dev,
          debugInfo: dev,
          style: style
        }).on('error', function (err) { console.log(err.message); })
        .pipe(autoprefixer({
          browsers: ['> 5%', 'iOS >= 4', 'IE >= 7', 'FF ESR', 'last 2 versions'],
          cascade: dev,
          remove: true
        }))
        .pipe(gulp.dest('./public/css'));
});

function createBrowserify(watch) {
  var b = browserify({entries: ['./client/js/main.js'], debug: dev}, watch ? watchify.args : undefined);

  if (watch) {
    b = watchify(b);
  }

  b.transform('debowerify')
  b.transform('envify', {
    _: 'purge',
    NODE_ENV: process.env.NODE_ENV || 'development'
  });

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
            'var err = ' + JSON.stringify(evt) + ';console.error("Browserify Error: ' + evt.message + '", stack, err)';
            fs.writeFileSync('./public/js/common.js', errFile);
          })
          .pipe(source('common.js'))
          .pipe(gulp.dest('./public/js'));
  }

  b.end = function() {
    return rebundle();
  }

  return b;
}

gulp.task('js', function() {
  var b = createBrowserify(false);
  b.transform('stripify');
// Transforms we might need here
// exposify - if we want to use scripts included via script tags (perhaps via transfigurify)
  return b.end();
});

gulp.task('rev', ['clean', 'compress'], function () {
  return gulp.src(['public/css/*.css', 'public/js/*.js'], {base: 'assets'})
        .pipe(gulp.dest('public'))  // copy original assets to build dir
        .pipe(rev())
        .pipe(revReplace({replaceInExtensions: ['.css']}))
        .pipe(revNapkin())
        .pipe(gulp.dest('public')) // write rev'd assets to build dir
        .pipe(rev.manifest())
        .pipe(gulp.dest('public')); // write manifest to build dir
});

gulp.task('compress', ['clean', 'sass', 'js'], function() {
  var css = filter('css/*.css');
  var js = filter('js/*.js');
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
  rimraf('public', cb);
});

gulp.task('jshint', function() {
  return gulp.src('client/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('scsslint', function() {
  return gulp.src('client/scss/**/*.scss')
        .pipe(scsslint());
        // Fail the build if errors or warnings
        // TODO: write a custom reporter that only fails on errors
        // .pipe(scsslint.failReporter());
});

gulp.task('lint', ['jshint', 'scsslint'], function(cb) {
  cb();
});

gulp.task('dev', function(cb){dev = true;cb();});

gulp.task('watch', ['dev', 'sass'], function() {
  gulp.watch('./public/**/*.*').on('change', livereload.changed);
  gulp.watch('./client/scss/**/*.scss', ['sass']);
  createBrowserify(true).once('file', function(){
    livereload.listen();
    nodemon({
      script: 'app.js',
      nodeArgs: ['--harmony'],
      quiet: true,
      delay: 0.5,
      watch: 'server',
      ext: 'js,json,html,csv'
    })
    .on('start', function(a) {
      setTimeout(function(){
        livereload.changed(a);
      }, 1010);
    })
  }).end();
});
