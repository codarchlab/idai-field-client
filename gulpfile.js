var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var rename = require('gulp-rename');

// compile sass and concatenate to single css file in build dir
gulp.task('convert-sass', () => {

    return gulp.src([
        'src/app/components/app.scss',
        'node_modules/leaflet/dist/leaflet.css',
        'node_modules/Leaflet.vector-markers/dist/leaflet-vector-markers.css',
        'node_modules/leaflet.pm/dist/leaflet.pm.css'
    ])
        .pipe(sass({
            includePaths: [
                'node_modules/roboto-fontface/css/roboto/sass',
                'node_modules/bootstrap/scss',
                'node_modules/@mdi/font/scss/'
            ], precision: 8
        }))
        .pipe(concat('app.css'))
        .pipe(gulp.dest('src/'));
});

gulp.task('copy-fonts-convert-sass', gulp.series('convert-sass', () => {

    return gulp.src([
        'node_modules/roboto-fontface/fonts/**/*',
        'node_modules/@mdi/font/fonts/**/*'
    ])
    .pipe(gulp.dest('src/fonts'));
}));

gulp.task('copy-shapefile-tool', () => {

    return gulp.src('java/target/shapefile-tool-*-jar-with-dependencies.jar')
        .pipe(rename('shapefile-tool.jar'))
        .pipe(gulp.dest('tools'));
});