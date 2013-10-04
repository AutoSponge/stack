module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['Gruntfile.js', 'features/step_definitions/*.js'],
            options: {
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        qunit: {
            all: ['src-test/*.html', 'example-test/*.html']
        },
        complexity: {
            generic: {
                src: 'src/stack.js',
                options: {
                    errorsOnly: false,
                    cyclomatic: 10,         //high threshold on purpose
                    halstead: 20,           //high threshold on purpose
                    maintainability: 130    //high standard
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-complexity');
    grunt.registerTask('complex', 'complexity');
    grunt.registerTask('default', ['jshint', 'qunit', 'uglify']);
};