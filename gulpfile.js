var gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    csso = require('gulp-csso');

var src = './src';
var dist = './dist';

gulp.task('js', function() {
  gulp.src(src + '/modal2.js').
      pipe(gulp.dest(dist + '/js')).
      pipe(uglify({
        compress: false,
        mangle: false,
        preserveComments: 'some',
      })).
      pipe(rename('modal2.min.js')).
      pipe(gulp.dest(dist + '/js'));
});

gulp.task('css', function() {
  gulp.src(src + '/modal2.css').
      pipe(gulp.dest(dist + '/css')).
      pipe(csso()).
      pipe(rename('modal2.min.css')).
      pipe(gulp.dest(dist + '/css'));
  gulp.src(src + '/themes/default.css').
      pipe(gulp.dest(dist + '/css/themes/default.css')).
      pipe(csso()).
      pipe(rename('default.min.css')).
      pipe(gulp.dest(dist + '/css/themes'));
  gulp.src([src + '/modal2.css', src + '/themes/default.css']).
      pipe(concat('modal2-all.css')).
      pipe(gulp.dest(dist + '/css')).
      pipe(csso()).
      pipe(rename('modal2-all.min.css')).
      pipe(gulp.dest(dist + '/css'));
});

gulp.task('img', function() {
  gulp.src(src + '/preloader.gif').
      pipe(gulp.dest(dist + '/css'));
});

gulp.task('watch', function() {
  gulp.watch(src + '/modal2.js', ['js']);
  gulp.watch(src + '/modal2.css', ['css']);
  gulp.watch(src + '/themes/*.css', ['css']);
  gulp.watch(src + '/preloader.gif', ['img']);
});

gulp.task('build', ['js', 'css', 'img']);

gulp.task('default', ['build', 'watch']);