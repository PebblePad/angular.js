'use strict';

var files = require('./angularFiles').files;
var util = require('./lib/grunt/utils.js');
var packageJson = require('./package.json');

module.exports = function(grunt) {

  // this loads all the node_modules that start with `grunt-` as plugins
  require('load-grunt-tasks')(grunt);

  // load additional grunt tasks
  grunt.loadTasks('lib/grunt');
  grunt.loadNpmTasks('angular-benchpress');

  // compute version related info for this build
  const [major, minor, patch] = packageJson.version.split('.');
  var NG_VERSION = {
    cdn: '',
    codeName: '',
    full: packageJson.version,
    major: major,
    minor: minor,
    patch: patch
  };
  var dist = 'angular-' + NG_VERSION.full;

  //config
  grunt.initConfig({
    NG_VERSION: NG_VERSION,
    bp_build: {
      options: {
        buildPath: 'build/benchmarks',
        benchmarksPath: 'benchmarks'
      }
    },
    clean: {
      build: ['build'],
      tmp: ['tmp'],
      deploy: [
        'deploy/code',
      ]
    },

    eslint: {
      all: {
        src: [
          '*.js',
          'benchmarks/**/*.js',
          'docs/**/*.js',
          'lib/**/*.js',
          'scripts/**/*.js',
          '!scripts/*/*/node_modules/**',
          'src/**/*.js',
          'test/**/*.js',
          'i18n/**/*.js',
          '!docs/app/assets/js/angular-bootstrap/**',
          '!docs/bower_components/**',
          '!docs/config/templates/**',
          '!src/angular.bind.js',
          '!i18n/closure/**',
          '!src/ngParseExt/ucd.js'
        ]
      }
    },

    build: {
      scenario: {
        dest: 'build/angular-scenario.js',
        src: [
          'bower_components/jquery/dist/jquery.js',
          util.wrap([files['angularSrc'], files['angularScenario']], 'ngScenario/angular')
        ],
        styles: {
          css: ['css/angular.css', 'css/angular-scenario.css']
        }
      },
      angular: {
        dest: 'build/angular.js',
        src: util.wrap([files['angularSrc']], 'angular'),
        styles: {
          css: ['css/angular.css'],
          generateCspCssFile: true,
          minify: true
        }
      },
      loader: {
        dest: 'build/angular-loader.js',
        src: util.wrap(files['angularLoader'], 'loader')
      },
      touch: {
        dest: 'build/angular-touch.js',
        src: util.wrap(files['angularModules']['ngTouch'], 'module')
      },
      mocks: {
        dest: 'build/angular-mocks.js',
        src: util.wrap(files['angularModules']['ngMock'], 'module'),
        strict: false
      },
      sanitize: {
        dest: 'build/angular-sanitize.js',
        src: util.wrap(files['angularModules']['ngSanitize'], 'module')
      },
      resource: {
        dest: 'build/angular-resource.js',
        src: util.wrap(files['angularModules']['ngResource'], 'module')
      },
      messageformat: {
        dest: 'build/angular-message-format.js',
        src: util.wrap(files['angularModules']['ngMessageFormat'], 'module')
      },
      messages: {
        dest: 'build/angular-messages.js',
        src: util.wrap(files['angularModules']['ngMessages'], 'module')
      },
      animate: {
        dest: 'build/angular-animate.js',
        src: util.wrap(files['angularModules']['ngAnimate'], 'module')
      },
      route: {
        dest: 'build/angular-route.js',
        src: util.wrap(files['angularModules']['ngRoute'], 'module')
      },
      cookies: {
        dest: 'build/angular-cookies.js',
        src: util.wrap(files['angularModules']['ngCookies'], 'module')
      },
      aria: {
        dest: 'build/angular-aria.js',
        src: util.wrap(files['angularModules']['ngAria'], 'module')
      },
      parseext: {
        dest: 'build/angular-parse-ext.js',
        src: util.wrap(files['angularModules']['ngParseExt'], 'module')
      },
      'promises-aplus-adapter': {
        dest:'tmp/promises-aplus-adapter++.js',
        src:['src/ng/q.js', 'lib/promises-aplus/promises-aplus-test-adapter.js']
      }
    },


    min: {
      angular: 'build/angular.js',
      animate: 'build/angular-animate.js',
      cookies: 'build/angular-cookies.js',
      loader: 'build/angular-loader.js',
      messageformat: 'build/angular-message-format.js',
      messages: 'build/angular-messages.js',
      touch: 'build/angular-touch.js',
      resource: 'build/angular-resource.js',
      route: 'build/angular-route.js',
      sanitize: 'build/angular-sanitize.js',
      aria: 'build/angular-aria.js',
      parseext: 'build/angular-parse-ext.js'
    },


    'ddescribe-iit': {
      files: [
        'src/**/*.js',
        'test/**/*.js',
        '!test/ngScenario/DescribeSpec.js',
        '!src/ng/directive/attrs.js', // legitimate xit here
        '!src/ngScenario/**/*.js',
        '!test/helpers/privateMocks*.js'
      ],
      options: {
        disallowed: [
          'fit',
          'iit',
          'xit',
          'fthey',
          'tthey',
          'xthey',
          'fdescribe',
          'ddescribe',
          'xdescribe',
          'it.only',
          'describe.only'
        ]
      }
    },

    'merge-conflict': {
      files: [
        'src/**/*',
        'test/**/*',
        'docs/**/*',
        'css/**/*'
      ]
    },

    copy: {
      i18n: {
        files: [
          {
            src: 'src/ngLocale/**',
            dest: 'build/i18n/',
            expand: true,
            flatten: true
          }
        ]
      }
    },


    compress: {
      build: {
        options: {archive: 'build/' + dist + '.zip', mode: 'zip'},
        src: ['**'],
        cwd: 'build',
        expand: true,
        dot: true,
        dest: dist + '/'
      }
    },

    write: {
      versionTXT: {file: 'build/version.txt', val: NG_VERSION.full},
      versionJSON: {file: 'build/version.json', val: JSON.stringify(NG_VERSION)}
    },

    bump: {
      options: {
        files: ['package.json'],
        commit: false,
        createTag: false,
        push: false
      }
    }
  });

  //alias tasks
  grunt.registerTask('webserver', ['connect:devserver']);
  grunt.registerTask('package', [
    'validate-angular-files',
    'clean',
    'buildall',
    'minall',
    'collect-errors',
    'write',
    'copy:i18n',
    'compress:build'
  ]);
  grunt.registerTask('ci-checks', [
    'ddescribe-iit',
    'merge-conflict',
    'eslint'
  ]);
  grunt.registerTask('prepareDeploy', [
    'package',
  ]);
  grunt.registerTask('default', ['package']);
};
