'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    clean: {
      dist: {
        src: 'dist/'
      }
    },
    concat: {
      dist: {
        src: [
          // License & version info, start the containing closure
          'src/intro.js',
          
          // Simple inheritance
          'src/class.js',
          // IE9 polyfills
          'src/ie9.js',
          // Utils like extend, each, and trigger
          'src/utilities.js',
          
          // The main JSONEditor class
          'src/core.js',

          // JSON Schema validator
          'src/validator.js',
          
          // All the editors
          'src/editor.js',
          'src/editors/null.js',
          'src/editors/string.js',
          'src/editors/number.js',
          'src/editors/integer.js',
          'src/editors/object.js',
          'src/editors/array.js',
          'src/editors/table.js',
          'src/editors/multiple.js',
          'src/editors/enum.js',
          'src/editors/select.js',
          'src/editors/multiselect.js',
          'src/editors/base64.js',
          'src/editors/upload.js',
          'src/editors/checkbox.js',

          // All the themes and iconlibs
          'src/theme.js',
          'src/themes/*.js',
          'src/iconlib.js',
          'src/iconlibs/*.js',

          // The JS templating engines
          'src/templates/*.js',

          // The english language file
          'src/languages/en.js',

          // Set the defaults
          'src/defaults.js',
          
          // Wrapper for $.fn style initialization
          'src/jquery.js',
          
          // End the closure
          'src/outro.js'
        ],
        dest: 'dist/jsoneditor.js'
      }
    },
    copy: {
      dist: {
        expand: true,
        cwd: 'src/languages/',
        src: ['*.js', '!en.js'],
        dest: 'dist/languages/'
      },
      prepareMin: {
        expand: true,
        cwd: 'dist/',
        src: '**/*.js',
        dest: 'dist/',
        rename: function (dest, src) {
          return dest + src.replace(".js", ".min.js");
        }
      }
    },
    uglify: {
      dist: {
        expand: true,
        cwd: '<%= copy.prepareMin.dest %>',
        src: '**/*.min.js',
        dest: '<%= copy.prepareMin.dest %>'
      },
      options: {
        preserveComments: 'some'
      }
    },
    watch: {
      scripts: {
        files: ["src/**/*.js"],
        tasks: ["concat"]
      }
    },
    jshint: {
      options: {
        browser: true,
        indent: 2,
        nonbsp: true,
        nonew: true,
        immed: true,
        latedef: true
      },
      beforeconcat: [
        'src/class.js',
        'src/ie9.js',
        
        // Utils like extend, each, and trigger
        'src/utilities.js',
        
        // The main JSONEditor class
        'src/core.js',

        // JSON Schema validator
        'src/validator.js',
        
        // All the editors
        'src/editor.js',
        'src/editors/*.js',
        
        // All the themes and iconlibs
        'src/theme.js',
        'src/themes/*.js',
        'src/iconlib.js',
        'src/iconlibs/*.js',

        // The JS templating engines
        'src/templates/*.js',

        // All the language files
        'src/languages/*.js',

        // Set the defaults
        'src/defaults.js',
        
        // Wrapper for $.fn style initialization
        'src/jquery.js'
      ],
      afterconcat: {
        options: {
          undef: true
        },
        files: {
          src: ['dist/jsoneditor.js']
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('default', ['jshint:beforeconcat','clean','concat','copy','jshint:afterconcat','uglify']);

};
