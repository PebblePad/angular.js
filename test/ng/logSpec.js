/* global $LogProvider: false */
'use strict';

describe('$log', function() {
  var $window;
  var logger;
  var log;
  var warn;
  var info;
  var error;
  var debug;

  beforeEach(angular.mock.module(function($provide) {
    $window = {
      navigator: {userAgent: window.navigator.userAgent},
      document: {}
    };
    logger = '';
    log = function() { logger += 'log;'; };
    warn = function() { logger += 'warn;'; };
    info = function() { logger += 'info;'; };
    error = function() { logger += 'error;'; };
    debug = function() { logger += 'debug;'; };

    $provide.provider('$log', ngInternals.$LogProvider);
    $provide.value('$exceptionHandler', angular.mock.rethrow);
    $provide.value('$window', $window);
  }));

  it('should use console if present', angular.mock.inject(
    function() {
      $window.console = {log: log,
                         warn: warn,
                         info: info,
                         error: error,
                         debug: debug};
    },
    function($log) {
      $log.log();
      $log.warn();
      $log.info();
      $log.error();
      $log.debug();
      expect(logger).toEqual('log;warn;info;error;debug;');
    }
  ));


  it('should use console.log() if other not present', angular.mock.inject(
    function() {
      $window.console = {log: log};
    },
    function($log) {
      $log.log();
      $log.warn();
      $log.info();
      $log.error();
      $log.debug();
      expect(logger).toEqual('log;log;log;log;log;');
    }
  ));


  it('should use noop if no console', angular.mock.inject(
    function($log) {
      $log.log();
      $log.warn();
      $log.info();
      $log.error();
      $log.debug();
    }
  ));

  runTests();

  function runTests() {
    function attachMockConsoleTo$window() {
      $window.console = {
        log: log,
        warn: warn,
        info: info,
        error: error,
        debug: debug
      };
    }

    describe('Modern browsers\' logging behavior', function() {
      beforeEach(angular.mock.module(attachMockConsoleTo$window));

      it('should work if $window.navigator not defined', angular.mock.inject(
        function() {
          delete $window.navigator;
        },
        function($log) {}
      ));

      it('should have a working apply method', angular.mock.inject(function($log) {
        $log.log.apply($log);
        $log.warn.apply($log);
        $log.info.apply($log);
        $log.error.apply($log);
        $log.debug.apply($log);
        expect(logger).toEqual('log;warn;info;error;debug;');
      }));

      // Support: Safari 9.1 only, iOS 9.3 only
      // For some reason Safari thinks there is always 1 parameter passed here.
      if (!/\b9\.\d(\.\d+)* safari/i.test(window.navigator.userAgent) &&
        !/\biphone os 9_/i.test(window.navigator.userAgent)) {
        it('should not attempt to log the second argument in IE if it is not specified', angular.mock.inject(
          function() {
            log = function(arg1, arg2) { logger += 'log,' + arguments.length + ';'; };
            warn = function(arg1, arg2) { logger += 'warn,' + arguments.length + ';'; };
            info = function(arg1, arg2) { logger += 'info,' + arguments.length + ';'; };
            error = function(arg1, arg2) { logger += 'error,' + arguments.length + ';'; };
            debug = function(arg1, arg2) { logger += 'debug,' + arguments.length + ';'; };
          },
          attachMockConsoleTo$window,
          function($log) {
            $log.log();
            $log.warn();
            $log.info();
            $log.error();
            $log.debug();
            expect(logger).toEqual('log,0;warn,0;info,0;error,0;debug,0;');
          })
        );
      }

      describe('$log.debug', function() {

        beforeEach(initService(false));

        it('should skip debugging output if disabled', angular.mock.inject(
          function() {
            $window.console = {log: log,
                               warn: warn,
                               info: info,
                               error: error,
                               debug: debug};
          },
          function($log) {
            $log.log();
            $log.warn();
            $log.info();
            $log.error();
            $log.debug();
            expect(logger).toEqual('log;warn;info;error;');
          }
        ));

      });

      describe('$log.error', function() {
        var e;
        var $log;

        function TestError() {
          Error.prototype.constructor.apply(this, arguments);
          this.message = undefined;
          this.sourceURL = undefined;
          this.line = undefined;
          this.stack = undefined;
        }
        TestError.prototype = Object.create(Error.prototype);
        TestError.prototype.constructor = TestError;

        beforeEach(angular.mock.inject(
          function() {
            e = new TestError('');
            $window.console = {
              error: jest.fn()
            };
          },

          function(_$log_) {
            $log = _$log_;
          }
        ));

        it('should pass error if does not have trace', function() {
          $log.error('abc', e);
          expect($window.console.error).toHaveBeenCalledWith('abc', e);
        });

        if (/\bEdge\//.test(window.navigator.userAgent)) {
          it('should print stack', function() {
            e.stack = 'stack';
            $log.error('abc', e);
            expect($window.console.error).toHaveBeenCalledWith('abc', 'stack');
          });
        } else {
          it('should print a raw error', function() {
            e.stack = 'stack';
            $log.error('abc', e);
            expect($window.console.error).toHaveBeenCalledWith('abc', e);
          });
        }

        it('should print line', function() {
          e.message = 'message';
          e.sourceURL = 'sourceURL';
          e.line = '123';
          $log.error('abc', e);
          expect($window.console.error).toHaveBeenCalledWith('abc', 'message\nsourceURL:123');
        });
      });
    });
  }


  function initService(debugEnabled) {
    return angular.mock.module(function($logProvider) {
      $logProvider.debugEnabled(debugEnabled);
    });
  }
});
