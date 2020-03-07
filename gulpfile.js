var gulp            = require('gulp'),
    watch           = require('gulp-watch'),
    prefixer        = require('gulp-autoprefixer'),
    uglify          = require('gulp-uglify'),
    sass            = require('gulp-sass'),
    sourcemaps      = require('gulp-sourcemaps'),
    rigger          = require('gulp-rigger'),
    cssmin          = require('gulp-minify-css'),
    imagemin        = require('gulp-imagemin'),
    pngquant        = require('imagemin-pngquant'),
    rimraf          = require('rimraf'),
    browserSync     = require("browser-sync"),
    notify          = require("gulp-notify"), // Водит ошибки при сборке Gulp в виде системных сообщений
    ftp             = require('vinyl-ftp'), // Диплой на хостинг через FTP
    rsync           = require('gulp-rsync'), // Диплой на хостинг через SSH
    reload          = browserSync.reload;



var path = {
    build: {
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/',
        img: 'build/img/',
        fonts: 'build/fonts/'
    },
    src: {
        html: 'src/*.html',
        js: 'src/js/main.js',
        style: 'src/style/*.scss',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        style: 'src/style/**/*.*',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    clean: './build'
};

var config = {
    server: {
        baseDir: "./build"
    },
    notify: false,
    logPrefix: "MetallTP"
};

gulp.task('webserver', function (done) {
    browserSync(config);
    done();
});

gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
    done();
});

gulp.task('html:build', function (done) {
    gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({stream: true}));
    done();
});

gulp.task('js:build', function (done) {
    gulp.src(path.src.js)
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream: true}));
    done();
});

gulp.task('style:build', function (done) {
    gulp.src(path.src.style)
        .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: ['src/style/'],
            outputStyle: 'expanded',
            sourceMap: true,
            errLogToConsole: true
        })).on("error", notify.onError())
        .pipe(prefixer())
//        .pipe(cssmin())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({stream: true}));
    done();
});

gulp.task('image:build', function (done) {
    gulp.src(path.src.img)
//        .pipe(imagemin({
//            progressive: true,
//            svgoPlugins: [{removeViewBox: false}],
//            use: [pngquant()],
//            interlaced: true
//        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
    done();
});

gulp.task('fonts:build', function (done) {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
    done();
});

gulp.task('deploy', () => {
        var conn = ftp.create({
                host:      'yousite.com',
                user:      'ftp-user',
                password:  'password',
                parallel:  10,
                log: gutil.log
        });
        var globs = [
        'dist/**',
        'dist/.htaccess',
        ];
        return gulp.src(globs, {buffer: false})
        .pipe(conn.dest('/www/yousite.com/'));
 //Документация: https://pinchukov.net/blog/vinyl-ftp.html
});


gulp.task('rsync', () => {
        return gulp.src('dist/**')
        .pipe(rsync({
                root: 'dist/',
                hostname: 'joker@psiline.ru',
                destination: 'www/psiline.ru/',
                // include: ['*.htaccess'], // Скрытые файлы, которые необходимо включить в деплой
                recursive: true,
                archive: true,
                silent: false,
                compress: true
        }));
        //Документация: https://pinchukov.net/blog/gulp-rsync.html
});

gulp.task('build', gulp.series(
    'html:build',
    'js:build',
    'style:build',
    'fonts:build',
    'image:build'
));

gulp.task('watch', function (done){
    gulp.watch([path.watch.html], gulp.parallel('html:build'));
    gulp.watch(path.watch.style, gulp.parallel('style:build'));
    gulp.watch(path.watch.js, gulp.parallel('js:build'));
    gulp.watch(path.watch.img, gulp.parallel('image:build'));
    gulp.watch(path.watch.fonts, gulp.parallel('fonts:build'));
    done();
});

gulp.task('default', gulp.series('build', 'webserver', 'watch'));
