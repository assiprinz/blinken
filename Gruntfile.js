module.exports = function(grunt) {

    /*
     ██████  ██████  ███    ██ ███████ ██  ██████
    ██      ██    ██ ████   ██ ██      ██ ██
    ██      ██    ██ ██ ██  ██ █████   ██ ██   ███
    ██      ██    ██ ██  ██ ██ ██      ██ ██    ██
     ██████  ██████  ██   ████ ██      ██  ██████
    */

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            Global: {
                options: {
                    sourceMap: true
                },
                src: [
                    "src/js/blinken.js",
                    "!src/js/lib/*"
                ],
                dest: "dist/js/blinken.min.js"
            }
        },
        sass: {
            options: {
                sourceMap: true,
                outputStyle: "expanded"
            },
            Global: {
                files: {
                    "dist/css/style.min.css": "src/scss/main.scss"
                }
            }
        },
        postcss: {
            options: {
                map: {
                    inline: false, // save all sourcemaps as separate files...
                    annotation: 'dist/css/' // ...to the specified directory
                },
                processors: [
                    require('autoprefixer')({
                        browsers: [
                            "Android 2.3",
                            "Android >= 4",
                            "Chrome >= 20",
                            "Firefox >= 24",
                            "Explorer >= 8",
                            "iOS >= 6",
                            "Opera >= 12",
                            "Safari >= 6"
                        ]
                    }), // add vendor prefixes
                    require('cssnano')()
                ]
            },
            dist: {
                src: 'dist/css/*.css'
            }
        },
        notify: {
            options: {
                title: "Grunt"
            },
            watch: {
                options: {
                    message: "File Watcher Started."
                }
            },
            build: {
                options: {
                    message: "Build Succeeded."
                }
            },
            deployment: {
                options: {
                    message: "Deployment Complete"
                }
            },
            livereload: {
                options: {
                    message: "File changed."
                }
            }
        },
        watch: {
            options: {
                livereload: true
            },
            scss: {
                files: ["src/scss/**/*"],
                tasks: ["notify:livereload", "clean:tmp", "clean:css", "sass", "postcss"],
                options: {
                    livereload: false
                }
            },
            livereload: {
                options: {
                    livereload: true,
                    nospawn: true
                },
                files: ["dist/css/**/*.css", "dist/js/**/*.js"]
            },
            js: {
                options: {
                    livereload: false
                },
                files: ["src/js/**/*.js"],
                tasks: ["notify:livereload", "clean:js", "concat", "copy:lib"]
            }
        },
        copy: {
            lib: {
                files: [{
                    cwd: 'src/js/lib',
                    expand: true,
                    src: ['**/*'],
                    dest: 'dist/js/lib'
                }]
            },
        },
        clean: {
            js: ["dist/js/*"],
            css: ["dist/css/*"],
            tmp: "tmp/*"
        },
        'sftp-deploy': {
            build: {
                auth: {
                    host: '',
                    port: 22,
                    authKey: ''
                },
                cache: 'sftpCache.json',
                src: 'dist',
                dest: '',
                exclusions: ['dist/**/.DS_Store', 'dist/**/Thumbs.db', 'dist/tmp'],
                serverSep: '/',
                localSep: '/',
                concurrency: 4,
                progress: true
            }
        }
    });

    /*
    ████████  █████  ███████ ██   ██ ███████
       ██    ██   ██ ██      ██  ██  ██
       ██    ███████ ███████ █████   ███████
       ██    ██   ██      ██ ██  ██       ██
       ██    ██   ██ ███████ ██   ██ ███████
    */

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-handlebars");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-sass");
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-sftp-deploy');

    grunt.registerTask('default', ["clean", "concat", "copy:lib", "sass", "postcss", "notify:build"]);
    grunt.registerTask('run', ["default", "notify:watch", "watch"]);
    // grunt.registerTask('deploy', ["default", "sftp-deploy", "notify:deployment"]);

}
