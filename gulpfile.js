var gulp = require('gulp'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify'),
	csso = require('gulp-csso');


var dir = './jquery.semanticwp-modal';


gulp.task('js', function() {
	gulp.src(dir + '/jquery.semanticwp-modal.js')
		.pipe(uglify({
			compress: false,
			mangle: false,
			preserveComments: 'some'
		}))
		.pipe(rename('jquery.semanticwp-modal.min.js'))
		.pipe(gulp.dest(dir));
});


gulp.task('css', function() {
	gulp.src(dir + '/jquery.semanticwp-modal.css')
		.pipe(csso())
		.pipe(rename('jquery.semanticwp-modal.min.css'))
		.pipe(gulp.dest(dir));
});


gulp.task('watch', function() {
	gulp.watch(dir + '/jquery.semanticwp-modal.js', ['js']);
	gulp.watch(dir + '/jquery.semanticwp-modal.css', ['css']);
});


gulp.task('build', ['js', 'css']);


gulp.task('default', ['build', 'watch']);