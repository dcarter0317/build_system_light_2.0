'use strict';

var gulp          =  require('gulp'),
    concat        =  require('gulp-concat'),
    uglify        =  require('gulp-uglify'),
    rename        =  require('gulp-rename'),
    sass          =  require('gulp-sass'),
    autoprefixer  =  require('gulp-autoprefixer'),
    maps          =  require('gulp-sourcemaps'),
    del           =  require('del'),
    notify        =  require('gulp-notify'),
    plumber       =  require('gulp-plumber'),
    imagemin      =  require('gulp-imagemin'),
    spritesmith   =  require('gulp.spritesmith'),
    styleguide    =  require('sc5-styleguide'),
    kss           =  require('kss'),
    path          =  require('path'),
    csso          =  require('gulp-csso'),
    buffer        =  require('vinyl-buffer'),
    merge         =  require('merge-stream'),
    sync          =  require('browser-sync').create(),
    reload        =  sync.reload,
    outputPath    =  'styleguide';



gulp.task("concatScripts", function(){
 return gulp.src('js/main.js')
  	  .pipe(maps.init())
	    .pipe(concat('app.js'))
      .pipe(uglify())
	    .pipe(maps.write('./'))
      .pipe(sync.reload({stream:true}))
	    .pipe(gulp.dest('js'));
});

gulp.task("minifyScripts", ['concatScripts'], function(){
 return	gulp.src("js/app.js")
  	    .pipe(uglify())
  	    .pipe(rename('app-min.js'))
  	    .pipe(gulp.dest('dist/js'));
});

gulp.task("compressImgs", function(){
 return gulp.src('img/*')
         .pipe(imagemin())
         .pipe(gulp.dest('dist/img'));
});

gulp.task("sprite", function(){
  // Generate our spritesheet. add images to imgsprite folder the task will build the spritesheet
  var spriteData = gulp.src('imgspritesrc/*.png')  //TODO: FIX OUTPUT LOCATION
                   .pipe(spritesmith({
                      imgName: 'sprite.png',
                      cssName: 'sprite.css'
                  }));
 //Pipe image stream through image optimizer and onto disk
  var imgStream = spriteData.img
    //DEV: We must buffer our stream into a buffer for 'imagemin'
    .pipe(buffer())
    .pipe(imagemin())
    .pipe(gulp.dest('dist/img'));

//Pipe CSS Stream through CSS optimizer and onto disk
  var cssStream = spriteData.css
    .pipe(csso())
    .pipe(gulp.dest('dist/css'));


 //Return a merged stream to handle both 'end' events
  return merge(imgStream, cssStream);
});

gulp.task("compileSass", function(){
 return gulp.src("scss/style.scss")
        .pipe(plumber())
        .pipe(maps.init())
        .pipe(sass({
                "outputStyle": "compressed",
                "includePaths": ["scss"],
                "onError": sync.notify
              }))
        .pipe(autoprefixer({
           grid: true,
           browsers: ['last 3 versions'],
           cascade: false
          }))
        .pipe(maps.write('./'))
        .pipe(sync.reload({stream:true}))
        .pipe(gulp.dest('css'));
 });

// Generate styleguide
gulp.task('styleguide:generate', function() {
  return gulp.src('scss/**/*.scss')
    .pipe(styleguide.generate({
        title: 'Styleguide',
        server: true,
        rootPath: outputPath,
        appRoot: './',
        overviewPath: 'styleguide-overview.md',
        disableEncapsulation: true,
        extraHead: [ // added scripts to the head of document
          '<script src="/js/jquery-3.1.1.min.js">'
        ],
      }))
    .on('error', notify.onError())
    .pipe(gulp.dest(outputPath));
});

gulp.task('styleguide:applystyles', function() {
  return gulp.src('style.scss')
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(styleguide.applyStyles())
    .pipe(gulp.dest(outputPath));
});

gulp.task('watch', ['styleguide'], function() {
  // Start watching changes and update styleguide whenever changes are detected
  // Styleguide automatically detects existing server instance
  gulp.watch(['scss/**/*.scss'], ['styleguide']);
});

gulp.task('styleguide', ['styleguide:generate', 'styleguide:applystyles']);


gulp.task("browserSync", function(){
    sync.init({
       server: {
         baseDir: './'
       }
    });
});

gulp.task("clean", function(){
    del(['dist', 'css/style.css*', 'js/app*.js*', 'styleguide']);
});

gulp.task("watchFiles", function(){
   gulp.watch('scss/**/*.scss', ['compileSass']);
   gulp.watch('js/*.js', ['concatScripts']);
   gulp.watch('img/*', ['compressImgs']);
   gulp.watch('./*.html', sync.reload);
});

gulp.task("build", ['concatScripts', 'minifyScripts', 'compileSass', 'watchFiles', 'browserSync'], function(){
	return gulp.src(['css/style.css','js/app.min.js', '*.html', 'img/**', 'fonts/**'], {base: './'})
	            .pipe(gulp.dest('dist'));
});

gulp.task("default", ['clean'], function() {
    gulp.start("build");
});
