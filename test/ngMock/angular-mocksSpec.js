'use strict';
 describe('ngMock', () => {

  var noop = angular.noop;
  var extend = angular.extend;

  describe('TzDate', () => {

    function minutes(min) {
      return min * 60 * 1000;
    }

    test('should look like a Date', () => {
      var date = new angular.mock.TzDate(0,0);
      expect(angular.isDate(date)).toBe(true);
    });

    test('should take millis as constructor argument', () => {
      expect(new angular.mock.TzDate(0, 0).getTime()).toBe(0);
      expect(new angular.mock.TzDate(0, 1283555108000).getTime()).toBe(1283555108000);
    });

    test('should take dateString as constructor argument', () => {
      expect(new angular.mock.TzDate(0, '1970-01-01T00:00:00.000Z').getTime()).toBe(0);
      expect(new angular.mock.TzDate(0, '2010-09-03T23:05:08.023Z').getTime()).toBe(1283555108023);
    });


    test('should fake getLocalDateString method', () => {
      var millennium = new Date('2000').getTime();

      // millennium in -3h
      var t0 = new angular.mock.TzDate(-3, millennium);
      expect(t0.toLocaleDateString()).toMatch('2000');

      // millennium in +0h
      var t1 = new angular.mock.TzDate(0, millennium);
      expect(t1.toLocaleDateString()).toMatch('2000');

      // millennium in +3h
      var t2 = new angular.mock.TzDate(3, millennium);
      expect(t2.toLocaleDateString()).toMatch('1999');
    });


    test('should fake toISOString method', () => {
      var date = new angular.mock.TzDate(-1, '2009-10-09T01:02:03.027Z');

      if (new Date().toISOString) {
        expect(date.toISOString()).toEqual('2009-10-09T01:02:03.027Z');
      } else {
        expect(date.toISOString).toBeUndefined();
      }
    });


    test('should fake getHours method', () => {
      // avoid going negative due to #5017, so use Jan 2, 1970 00:00 UTC
      var jan2 = 24 * 60 * 60 * 1000;

      //0:00 in -3h
      var t0 = new angular.mock.TzDate(-3, jan2);
      expect(t0.getHours()).toBe(3);

      //0:00 in +0h
      var t1 = new angular.mock.TzDate(0, jan2);
      expect(t1.getHours()).toBe(0);

      //0:00 in +3h
      var t2 = new angular.mock.TzDate(3, jan2);
      expect(t2.getHours()).toBe(21);
    });


    test('should fake getMinutes method', () => {
      //0:15 in -3h
      var t0 = new angular.mock.TzDate(-3, minutes(15));
      expect(t0.getMinutes()).toBe(15);

      //0:15 in -3.25h
      var t0a = new angular.mock.TzDate(-3.25, minutes(15));
      expect(t0a.getMinutes()).toBe(30);

      //0 in +0h
      var t1 = new angular.mock.TzDate(0, minutes(0));
      expect(t1.getMinutes()).toBe(0);

      //0:15 in +0h
      var t1a = new angular.mock.TzDate(0, minutes(15));
      expect(t1a.getMinutes()).toBe(15);

      //0:15 in +3h
      var t2 = new angular.mock.TzDate(3, minutes(15));
      expect(t2.getMinutes()).toBe(15);

      //0:15 in +3.25h
      var t2a = new angular.mock.TzDate(3.25, minutes(15));
      expect(t2a.getMinutes()).toBe(0);
    });


    test('should fake getSeconds method', () => {
      //0 in -3h
      var t0 = new angular.mock.TzDate(-3, 0);
      expect(t0.getSeconds()).toBe(0);

      //0 in +0h
      var t1 = new angular.mock.TzDate(0, 0);
      expect(t1.getSeconds()).toBe(0);

      //0 in +3h
      var t2 = new angular.mock.TzDate(3, 0);
      expect(t2.getSeconds()).toBe(0);
    });


    test('should fake getMilliseconds method', () => {
      expect(new angular.mock.TzDate(0, '2010-09-03T23:05:08.003Z').getMilliseconds()).toBe(3);
      expect(new angular.mock.TzDate(0, '2010-09-03T23:05:08.023Z').getMilliseconds()).toBe(23);
      expect(new angular.mock.TzDate(0, '2010-09-03T23:05:08.123Z').getMilliseconds()).toBe(123);
    });


    test('should create a date representing new year in Bratislava', () => {
      var newYearInBratislava = new angular.mock.TzDate(-1, '2009-12-31T23:00:00.000Z');
      expect(newYearInBratislava.getTimezoneOffset()).toBe(-60);
      expect(newYearInBratislava.getFullYear()).toBe(2010);
      expect(newYearInBratislava.getMonth()).toBe(0);
      expect(newYearInBratislava.getDate()).toBe(1);
      expect(newYearInBratislava.getHours()).toBe(0);
      expect(newYearInBratislava.getMinutes()).toBe(0);
      expect(newYearInBratislava.getSeconds()).toBe(0);
    });


    test('should delegate all the UTC methods to the original UTC Date object', () => {
      //from when created from string
      var date1 = new angular.mock.TzDate(-1, '2009-12-31T23:00:00.000Z');
      expect(date1.getUTCFullYear()).toBe(2009);
      expect(date1.getUTCMonth()).toBe(11);
      expect(date1.getUTCDate()).toBe(31);
      expect(date1.getUTCHours()).toBe(23);
      expect(date1.getUTCMinutes()).toBe(0);
      expect(date1.getUTCSeconds()).toBe(0);


      //from when created from millis
      var date2 = new angular.mock.TzDate(-1, date1.getTime());
      expect(date2.getUTCFullYear()).toBe(2009);
      expect(date2.getUTCMonth()).toBe(11);
      expect(date2.getUTCDate()).toBe(31);
      expect(date2.getUTCHours()).toBe(23);
      expect(date2.getUTCMinutes()).toBe(0);
      expect(date2.getUTCSeconds()).toBe(0);
    });


    test('should throw error when no third param but toString called', () => {
      expect(function() { new angular.mock.TzDate(0,0).toString(); }).
                           toThrow('Method \'toString\' is not implemented in the TzDate mock');
    });
  });


  describe('$log', () => {
    angular.forEach([true, false], function(debugEnabled) {
      describe('debug ' + debugEnabled, () => {
        beforeEach(angular.mock.module(function($logProvider) {
          $logProvider.debugEnabled(debugEnabled);
        }));

        afterEach(angular.mock.inject(function($log) {
          $log.reset();
        }));

        test('should skip debugging output if disabled (' + debugEnabled + ')', angular.mock.inject(function($log) {
            $log.log('fake log');
            $log.info('fake log');
            $log.warn('fake log');
            $log.error('fake log');
            $log.debug('fake log');
            expect($log.log.logs).toContainEqual(['fake log']);
            expect($log.info.logs).toContainEqual(['fake log']);
            expect($log.warn.logs).toContainEqual(['fake log']);
            expect($log.error.logs).toContainEqual(['fake log']);
            if (debugEnabled) {
              expect($log.debug.logs).toContainEqual(['fake log']);
            } else {
              expect($log.debug.logs).toEqual([]);
            }
          }));
      });
    });

    describe('debug enabled (default)', () => {
      var $log;
      beforeEach(angular.mock.inject(['$log', function(log) {
        $log = log;
      }]));

      afterEach(angular.mock.inject(function($log) {
        $log.reset();
      }));

      test('should provide the log method', () => {
        expect(function() { $log.log(''); }).not.toThrow();
      });

      test('should provide the info method', () => {
        expect(function() { $log.info(''); }).not.toThrow();
      });

      test('should provide the warn method', () => {
        expect(function() { $log.warn(''); }).not.toThrow();
      });

      test('should provide the error method', () => {
        expect(function() { $log.error(''); }).not.toThrow();
      });

      test('should provide the debug method', () => {
        expect(function() { $log.debug(''); }).not.toThrow();
      });

      test('should store log messages', () => {
        $log.log('fake log');
        expect($log.log.logs).toContainEqual(['fake log']);
      });

      test('should store info messages', () => {
        $log.info('fake log');
        expect($log.info.logs).toContainEqual(['fake log']);
      });

      test('should store warn messages', () => {
        $log.warn('fake log');
        expect($log.warn.logs).toContainEqual(['fake log']);
      });

      test('should store error messages', () => {
        $log.error('fake log');
        expect($log.error.logs).toContainEqual(['fake log']);
      });

      test('should store debug messages', () => {
        $log.debug('fake log');
        expect($log.debug.logs).toContainEqual(['fake log']);
      });

      test('should assertEmpty', () => {
        try {
          $log.error(new Error('MyError'));
          $log.warn(new Error('MyWarn'));
          $log.info(new Error('MyInfo'));
          $log.log(new Error('MyLog'));
          $log.debug(new Error('MyDebug'));
          $log.assertEmpty();
        } catch (error) {
          var err = error.message || error;
          expect(err).toMatch(/Error: MyError/m);
          expect(err).toMatch(/Error: MyWarn/m);
          expect(err).toMatch(/Error: MyInfo/m);
          expect(err).toMatch(/Error: MyLog/m);
          expect(err).toMatch(/Error: MyDebug/m);
        } finally {
          $log.reset();
        }
      });

      test('should reset state', () => {
        $log.error(new Error('MyError'));
        $log.warn(new Error('MyWarn'));
        $log.info(new Error('MyInfo'));
        $log.log(new Error('MyLog'));
        $log.reset();
        var passed = false;
        try {
          $log.assertEmpty(); // should not throw error!
          passed = true;
        } catch (e) {
          passed = e;
        }
        expect(passed).toBe(true);
      });
    });
  });


  describe('$interval', () => {
    test('should run tasks repeatedly', angular.mock.inject(function($interval) {
      var counter = 0;
      $interval(function() { counter++; }, 1000);

      expect(counter).toBe(0);

      $interval.flush(1000);
      expect(counter).toBe(1);

      $interval.flush(1000);
      expect(counter).toBe(2);

      $interval.flush(2000);
      expect(counter).toBe(4);
    }));


    test('should call $apply after each task is executed', angular.mock.inject(function($interval, $rootScope) {
      var applySpy = jest.spyOn($rootScope, '$apply');

      $interval(angular.noop, 1000);
      expect(applySpy).not.toHaveBeenCalled();

      $interval.flush(1000);
      expect(applySpy).toHaveBeenCalledTimes(1);

      applySpy.mockClear();

      $interval(angular.noop, 1000);
      $interval(angular.noop, 1000);
      $interval.flush(1000);
      expect(applySpy).toHaveBeenCalledTimes(3);
    }));


    test('should NOT call $apply if invokeApply is set to false',
        angular.mock.inject(function($interval, $rootScope) {
      var digestSpy = jest.spyOn($rootScope, '$digest');

      var counter = 0;
      $interval(function increment() { counter++; }, 1000, 0, false);

      expect(digestSpy).not.toHaveBeenCalled();
      expect(counter).toBe(0);

      $interval.flush(2000);
      expect(digestSpy).not.toHaveBeenCalled();
      expect(counter).toBe(2);
    }));


    test('should allow you to specify the delay time', angular.mock.inject(function($interval) {
      var counter = 0;
      $interval(function() { counter++; }, 123);

      expect(counter).toBe(0);

      $interval.flush(122);
      expect(counter).toBe(0);

      $interval.flush(1);
      expect(counter).toBe(1);
    }));


    test('should allow you to NOT specify the delay time', angular.mock.inject(function($interval) {
      var counterA = 0;
      var counterB = 0;

      $interval(function() { counterA++; });
      $interval(function() { counterB++; }, 0);

      $interval.flush(100);
      expect(counterA).toBe(100);
      expect(counterB).toBe(100);
      $interval.flush(100);
      expect(counterA).toBe(200);
      expect(counterB).toBe(200);
    }));


    test('should run tasks in correct relative order', angular.mock.inject(function($interval) {
      var counterA = 0;
      var counterB = 0;
      $interval(function() { counterA++; }, 0);
      $interval(function() { counterB++; }, 1000);

      $interval.flush(1000);
      expect(counterA).toBe(1000);
      expect(counterB).toBe(1);
      $interval.flush(999);
      expect(counterA).toBe(1999);
      expect(counterB).toBe(1);
      $interval.flush(1);
      expect(counterA).toBe(2000);
      expect(counterB).toBe(2);
    }));


    test('should NOT trigger zero-delay interval when flush has ran before', angular.mock.inject(function($interval) {
      var counterA = 0;
      var counterB = 0;

      $interval.flush(100);

      $interval(function() { counterA++; });
      $interval(function() { counterB++; }, 0);

      expect(counterA).toBe(0);
      expect(counterB).toBe(0);

      $interval.flush(100);

      expect(counterA).toBe(100);
      expect(counterB).toBe(100);
    }));


    test('should trigger zero-delay interval only once on flush zero', angular.mock.inject(function($interval) {
      var counterA = 0;
      var counterB = 0;

      $interval(function() { counterA++; });
      $interval(function() { counterB++; }, 0);

      $interval.flush(0);
      expect(counterA).toBe(1);
      expect(counterB).toBe(1);
      $interval.flush(0);
      expect(counterA).toBe(1);
      expect(counterB).toBe(1);
    }));


    test('should allow you to specify a number of iterations', angular.mock.inject(function($interval) {
      var counter = 0;
      $interval(function() {counter++;}, 1000, 2);

      $interval.flush(1000);
      expect(counter).toBe(1);
      $interval.flush(1000);
      expect(counter).toBe(2);
      $interval.flush(1000);
      expect(counter).toBe(2);
    }));


    describe('flush', () => {
      test('should move the clock forward by the specified time', angular.mock.inject(function($interval) {
        var counterA = 0;
        var counterB = 0;
        $interval(function() { counterA++; }, 100);
        $interval(function() { counterB++; }, 401);

        $interval.flush(200);
        expect(counterA).toEqual(2);

        $interval.flush(201);
        expect(counterA).toEqual(4);
        expect(counterB).toEqual(1);
      }));
    });


    test('should return a promise which will be updated with the count on each iteration',
        angular.mock.inject(function($interval) {
          var log = [];
          var promise = $interval(function() { log.push('tick'); }, 1000);

          promise.then(function(value) { log.push('promise success: ' + value); },
                       function(err) { log.push('promise error: ' + err); },
                       function(note) { log.push('promise update: ' + note); });
          expect(log).toEqual([]);

          $interval.flush(1000);
          expect(log).toEqual(['tick', 'promise update: 0']);

          $interval.flush(1000);
          expect(log).toEqual(['tick', 'promise update: 0', 'tick', 'promise update: 1']);
        }));


    test('should return a promise which will be resolved after the specified number of iterations',
        angular.mock.inject(function($interval) {
          var log = [];
          var promise = $interval(function() { log.push('tick'); }, 1000, 2);

          promise.then(function(value) { log.push('promise success: ' + value); },
                       function(err) { log.push('promise error: ' + err); },
                       function(note) { log.push('promise update: ' + note); });
          expect(log).toEqual([]);

          $interval.flush(1000);
          expect(log).toEqual(['tick', 'promise update: 0']);
          $interval.flush(1000);

          expect(log).toEqual([
            'tick', 'promise update: 0', 'tick', 'promise update: 1', 'promise success: 2'
          ]);
        }));


    describe('exception handling', () => {
      beforeEach(angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      }));


      test('should delegate exception to the $exceptionHandler service', angular.mock.inject(
          function($interval, $exceptionHandler) {
        $interval(function() { throw 'Test Error'; }, 1000);
        expect($exceptionHandler.errors).toEqual([]);

        $interval.flush(1000);
        expect($exceptionHandler.errors).toEqual(['Test Error']);

        $interval.flush(1000);
        expect($exceptionHandler.errors).toEqual(['Test Error', 'Test Error']);
      }));


      test('should call $apply even if an exception is thrown in callback', angular.mock.inject(
          function($interval, $rootScope) {
        var applySpy = jest.spyOn($rootScope, '$apply');

        $interval(function() { throw new Error('Test Error'); }, 1000);
        expect(applySpy).not.toHaveBeenCalled();

        $interval.flush(1000);
        expect(applySpy).toHaveBeenCalled();
      }));


      test('should still update the interval promise when an exception is thrown',
          angular.mock.inject(function($interval) {
            var log = [];
            var promise = $interval(function() { throw new Error('Some Error'); }, 1000);

            promise.then(function(value) { log.push('promise success: ' + value); },
                       function(err) { log.push('promise error: ' + err); },
                       function(note) { log.push('promise update: ' + note); });
            $interval.flush(1000);

            expect(log).toEqual(['promise update: 0']);
          }));
    });


    describe('cancel', () => {
      test('should cancel tasks', angular.mock.inject(function($interval) {
        var task1 = jest.fn().mockName('task1');
        var task2 = jest.fn().mockName('task2');
        var task3 = jest.fn().mockName('task3');
        var promise1;
        var promise3;

        promise1 = $interval(task1, 200);
        $interval(task2, 1000);
        promise3 = $interval(task3, 333);

        $interval.cancel(promise3);
        $interval.cancel(promise1);
        $interval.flush(1000);

        expect(task1).not.toHaveBeenCalled();
        expect(task2).toHaveBeenCalledTimes(1);
        expect(task3).not.toHaveBeenCalled();
      }));


      test('should cancel the promise', angular.mock.inject(function($interval, $rootScope) {
        var promise = $interval(angular.noop, 1000);
        var log = [];
        promise.then(function(value) { log.push('promise success: ' + value); },
                   function(err) { log.push('promise error: ' + err); },
                   function(note) { log.push('promise update: ' + note); });
        expect(log).toEqual([]);

        $interval.flush(1000);
        $interval.cancel(promise);
        $interval.flush(1000);
        $rootScope.$apply(); // For resolving the promise -
        // necessary since q uses $rootScope.evalAsync.

        expect(log).toEqual(['promise update: 0', 'promise error: canceled']);
      }));


      test('should return true if a task was successfully canceled', angular.mock.inject(function($interval) {
        var task1 = jest.fn().mockName('task1');
        var task2 = jest.fn().mockName('task2');
        var promise1;
        var promise2;

        promise1 = $interval(task1, 1000, 1);
        $interval.flush(1000);
        promise2 = $interval(task2, 1000, 1);

        expect($interval.cancel(promise1)).toBe(false);
        expect($interval.cancel(promise2)).toBe(true);
      }));


      test('should not throw a runtime exception when given an undefined promise',
          angular.mock.inject(function($interval) {
            var task1 = jest.fn().mockName('task1');
            var promise1;

            promise1 = $interval(task1, 1000, 1);

            expect($interval.cancel()).toBe(false);
          }));
    });
  });


  describe('$browser', () => {
    var browser;
    var log;
    beforeEach(angular.mock.inject(function($browser) {
      browser = $browser;
      log = '';
    }));

    function logFn(text) {
      return function() {
        log += text + ';';
      };
    }

    describe('defer.flush', () => {
      test('should flush', () => {
        browser.defer(logFn('A'));
        browser.defer(logFn('B'), null, 'taskType');
        expect(log).toEqual('');

        browser.defer.flush();
        expect(log).toEqual('A;B;');
      });

      test('should flush delayed', () => {
        browser.defer(logFn('A'));
        browser.defer(logFn('B'), 0, 'taskTypeB');
        browser.defer(logFn('C'), 10, 'taskTypeC');
        browser.defer(logFn('D'), 20);
        expect(log).toEqual('');
        expect(browser.defer.now).toEqual(0);

        browser.defer.flush(0);
        expect(log).toEqual('A;B;');

        browser.defer.flush();
        expect(log).toEqual('A;B;C;D;');
      });

      test('should defer and flush over time', () => {
        browser.defer(logFn('A'), 1);
        browser.defer(logFn('B'), 2, 'taskType');
        browser.defer(logFn('C'), 3);

        browser.defer.flush(0);
        expect(browser.defer.now).toEqual(0);
        expect(log).toEqual('');

        browser.defer.flush(1);
        expect(browser.defer.now).toEqual(1);
        expect(log).toEqual('A;');

        browser.defer.flush(2);
        expect(browser.defer.now).toEqual(3);
        expect(log).toEqual('A;B;C;');
      });

      test('should throw an exception if there is nothing to be flushed', () => {
        expect(function() {browser.defer.flush();}).toThrow('No deferred tasks to be flushed');
      });

      test('should not throw an exception when passing a specific delay', () => {
        expect(function() {browser.defer.flush(100);}).not.toThrow();
      });

      describe('tasks scheduled during flushing', () => {
        test('should be flushed if they do not exceed the target delay (when no delay specified)',
          function() {
            browser.defer(function() {
              logFn('1')();
              browser.defer(function() {
                logFn('3')();
                browser.defer(logFn('4'), 1);
              }, 2);
            }, 1);
            browser.defer(function() {
              logFn('2')();
              browser.defer(logFn('6'), 4);
            }, 2);
            browser.defer(logFn('5'), 5);

            browser.defer.flush(0);
            expect(browser.defer.now).toEqual(0);
            expect(log).toEqual('');

            browser.defer.flush();
            expect(browser.defer.now).toEqual(5);
            expect(log).toEqual('1;2;3;4;5;');
          }
        );

        test('should be flushed if they do not exceed the specified delay',
          function() {
            browser.defer(function() {
              logFn('1')();
              browser.defer(function() {
                logFn('3')();
                browser.defer(logFn('4'), 1);
              }, 2);
            }, 1);
            browser.defer(function() {
              logFn('2')();
              browser.defer(logFn('6'), 4);
            }, 2);
            browser.defer(logFn('5'), 5);

            browser.defer.flush(0);
            expect(browser.defer.now).toEqual(0);
            expect(log).toEqual('');

            browser.defer.flush(4);
            expect(browser.defer.now).toEqual(4);
            expect(log).toEqual('1;2;3;4;');

            browser.defer.flush(6);
            expect(browser.defer.now).toEqual(10);
            expect(log).toEqual('1;2;3;4;5;6;');
          }
        );
      });
    });

    describe('defer.cancel', () => {
      test('should cancel a pending task', () => {
        var taskId1 = browser.defer(logFn('A'), 100, 'fooType');
        var taskId2 = browser.defer(logFn('B'), 200);

        expect(log).toBe('');
        expect(function() {browser.defer.verifyNoPendingTasks('fooType');}).toThrow();
        expect(function() {browser.defer.verifyNoPendingTasks();}).toThrow();

        browser.defer.cancel(taskId1);
        expect(function() {browser.defer.verifyNoPendingTasks('fooType');}).not.toThrow();
        expect(function() {browser.defer.verifyNoPendingTasks();}).toThrow();

        browser.defer.cancel(taskId2);
        expect(function() {browser.defer.verifyNoPendingTasks('fooType');}).not.toThrow();
        expect(function() {browser.defer.verifyNoPendingTasks();}).not.toThrow();

        browser.defer.flush(1000);
        expect(log).toBe('');
      });
    });

    describe('defer.verifyNoPendingTasks', () => {
      test('should throw if there are pending tasks', () => {
        expect(browser.defer.verifyNoPendingTasks).not.toThrow();

        browser.defer(angular.noop);
        expect(browser.defer.verifyNoPendingTasks).toThrow();
      });

      test('should list the pending tasks (in order) in the error message', () => {
        browser.defer(angular.noop, 100);
        browser.defer(angular.noop, 300, 'fooType');
        browser.defer(angular.noop, 200, 'barType');

        var expectedError =
          'Deferred tasks to flush (3):\n' +
          '  {id: 0, type: $$default$$, time: 100}\n' +
          '  {id: 2, type: barType, time: 200}\n' +
          '  {id: 1, type: fooType, time: 300}';
        expect(browser.defer.verifyNoPendingTasks).toThrow(expectedError);
      });

      describe('with specific task type', () => {
        test('should throw if there are pending tasks', () => {
          browser.defer(angular.noop, 0, 'fooType');

          expect(function() {browser.defer.verifyNoPendingTasks('barType');}).not.toThrow();
          expect(function() {browser.defer.verifyNoPendingTasks('fooType');}).toThrow();
          expect(function() {browser.defer.verifyNoPendingTasks();}).toThrow();
        });

        test('should list the pending tasks (in order) in the error message', () => {
          browser.defer(angular.noop, 100);
          browser.defer(angular.noop, 300, 'fooType');
          browser.defer(angular.noop, 200, 'barType');
          browser.defer(angular.noop, 400, 'fooType');

          var expectedError =
            'Deferred tasks to flush (2):\n' +
            '  {id: 1, type: fooType, time: 300}\n' +
            '  {id: 3, type: fooType, time: 400}';
          expect(function() {browser.defer.verifyNoPendingTasks('fooType');}).
            toThrow(expectedError);
        });
      });
    });

    describe('notifyWhenNoOutstandingRequests', () => {
      var callback;
       beforeEach(() => {
        callback = jest.fn().mockName('callback');
      });

      test('should immediately run the callback if no pending tasks', () => {
        browser.notifyWhenNoOutstandingRequests(callback);
        expect(callback).toHaveBeenCalled();
      });

      test('should run the callback as soon as there are no pending tasks', () => {
        browser.defer(angular.noop, 100);
        browser.defer(angular.noop, 200);

        browser.notifyWhenNoOutstandingRequests(callback);
        expect(callback).not.toHaveBeenCalled();

        browser.defer.flush(100);
        expect(callback).not.toHaveBeenCalled();

        browser.defer.flush(100);
        expect(callback).toHaveBeenCalled();
      });

      test('should not run the callback more than once', () => {
        browser.defer(angular.noop, 100);
        browser.notifyWhenNoOutstandingRequests(callback);
        expect(callback).not.toHaveBeenCalled();

        browser.defer.flush(100);
        expect(callback).toHaveBeenCalledTimes(1);

        browser.defer(angular.noop, 200);
        browser.defer.flush(100);
        expect(callback).toHaveBeenCalledTimes(1);
      });

      describe('with specific task type', () => {
        test('should immediately run the callback if no pending tasks', () => {
          browser.notifyWhenNoOutstandingRequests(callback, 'fooType');
          expect(callback).toHaveBeenCalled();
        });

        test('should run the callback as soon as there are no pending tasks', () => {
          browser.defer(angular.noop, 100, 'fooType');
          browser.defer(angular.noop, 200, 'barType');

          browser.notifyWhenNoOutstandingRequests(callback, 'fooType');
          expect(callback).not.toHaveBeenCalled();

          browser.defer.flush(100);
          expect(callback).toHaveBeenCalled();
        });

        test('should not run the callback more than once', () => {
          browser.defer(angular.noop, 100, 'fooType');
          browser.defer(angular.noop, 200);

          browser.notifyWhenNoOutstandingRequests(callback, 'fooType');
          expect(callback).not.toHaveBeenCalled();

          browser.defer.flush(100);
          expect(callback).toHaveBeenCalledTimes(1);

          browser.defer.flush(100);
          expect(callback).toHaveBeenCalledTimes(1);

          browser.defer(angular.noop, 100, 'fooType');
          browser.defer(angular.noop, 200);
          browser.defer.flush();
          expect(callback).toHaveBeenCalledTimes(1);
        });
      });
    });
  });


  describe('$flushPendingTasks', () => {
    var $flushPendingTasks;
    var browserDeferFlushSpy;

    beforeEach(angular.mock.inject(function($browser, _$flushPendingTasks_) {
      $flushPendingTasks = _$flushPendingTasks_;
      browserDeferFlushSpy = jest.spyOn($browser.defer, 'flush').mockReturnValue('flushed');
    }));

    test('should delegate to `$browser.defer.flush()`', () => {
      var result = $flushPendingTasks(42);

      expect(browserDeferFlushSpy).toHaveBeenCalledOnceWith(42);
      expect(result).toBe('flushed');
    });
  });


  describe('$verifyNoPendingTasks', () => {
    var $verifyNoPendingTasks;
    var browserDeferVerifySpy;

    beforeEach(angular.mock.inject(function($browser, _$verifyNoPendingTasks_) {
      $verifyNoPendingTasks = _$verifyNoPendingTasks_;
      browserDeferVerifySpy = jest.spyOn($browser.defer, 'verifyNoPendingTasks').mockReturnValue('verified');
    }));

    test('should delegate to `$browser.defer.verifyNoPendingTasks()`', () => {
      var result = $verifyNoPendingTasks('fortyTwo');

      expect(browserDeferVerifySpy).toHaveBeenCalledOnceWith('fortyTwo');
      expect(result).toBe('verified');
    });
  });


  describe('$exceptionHandler', () => {
    test('should rethrow exceptions', angular.mock.inject(function($exceptionHandler) {
      expect(function() { $exceptionHandler('myException'); }).toThrow('myException');
    }));


    test('should log exceptions', () => {
      angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      });
      angular.mock.inject(function($exceptionHandler) {
        $exceptionHandler('MyError');
        expect($exceptionHandler.errors).toEqual(['MyError']);

        $exceptionHandler('MyError', 'comment');
        expect($exceptionHandler.errors[1]).toEqual(['MyError', 'comment']);
      });
    });

    test('should log and rethrow exceptions', () => {
      angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('rethrow');
      });
      angular.mock.inject(function($exceptionHandler) {
        expect(function() { $exceptionHandler('MyError'); }).toThrow('MyError');
        expect($exceptionHandler.errors).toEqual(['MyError']);

        expect(function() { $exceptionHandler('MyError', 'comment'); }).toThrow('MyError');
        expect($exceptionHandler.errors[1]).toEqual(['MyError', 'comment']);
      });
    });

    test('should throw on wrong argument', () => {
      angular.mock.module(function($exceptionHandlerProvider) {
        expect(function() {
          $exceptionHandlerProvider.mode('XXX');
        }).toThrow('Unknown mode \'XXX\', only \'log\'/\'rethrow\' modes are allowed!');
      });

      angular.mock.inject(); // Trigger the tests in `module`
    });
  });


  describe('$timeout', () => {
    test('should expose flush method that will flush the pending queue of tasks', angular.mock.inject(
        function($rootScope, $timeout) {
          var logger = [];
          var logFn = function(msg) { return function() { logger.push(msg); }; };

          $timeout(logFn('t1'));
          $timeout(logFn('t2'), 200);
          $rootScope.$evalAsync(logFn('rs'));  // Non-timeout tasks are flushed as well.
          $timeout(logFn('t3'));
          expect(logger).toEqual([]);

          $timeout.flush();
          expect(logger).toEqual(['t1', 'rs', 't3', 't2']);
        }));


    test('should throw an exception when not flushed', angular.mock.inject(function($rootScope, $timeout) {
      $timeout(angular.noop, 100);
      $rootScope.$evalAsync(angular.noop);

      var expectedError =
        'Deferred tasks to flush (2):\n' +
        '  {id: 1, type: $evalAsync, time: 0}\n' +
        '  {id: 0, type: $timeout, time: 100}';
      expect($timeout.verifyNoPendingTasks).toThrow(expectedError);
    }));


    test('should recommend `$verifyNoPendingTasks()` when all pending tasks are not timeouts',
      angular.mock.inject(function($rootScope, $timeout) {
        var extraMessage = 'None of the pending tasks are timeouts. If you only want to verify ' +
            'pending timeouts, use `$verifyNoPendingTasks(\'$timeout\')` instead.';
        var errorMessage;

        $timeout(angular.noop, 100);
        $rootScope.$evalAsync(angular.noop);
        try { $timeout.verifyNoPendingTasks(); } catch (err) { errorMessage = err.message; }

        expect(errorMessage).not.toContain(extraMessage);

        $timeout.flush(100);
        $rootScope.$evalAsync(angular.noop);
        try { $timeout.verifyNoPendingTasks(); } catch (err) { errorMessage = err.message; }

        expect(errorMessage).toContain(extraMessage);
      })
    );


    test('should do nothing when all tasks have been flushed', angular.mock.inject(function($rootScope, $timeout) {
      $timeout(angular.noop, 100);
      $rootScope.$evalAsync(angular.noop);

      $timeout.flush();
      expect($timeout.verifyNoPendingTasks).not.toThrow();
    }));


    test('should check against the delay if provided within timeout', angular.mock.inject(function($timeout) {
      $timeout(angular.noop, 100);
      $timeout.flush(100);
      expect($timeout.verifyNoPendingTasks).not.toThrow();

      $timeout(angular.noop, 1000);
      $timeout.flush(100);
      expect($timeout.verifyNoPendingTasks).toThrow();

      $timeout.flush(900);
      expect($timeout.verifyNoPendingTasks).not.toThrow();
    }));


    test('should assert against the delay value', angular.mock.inject(function($timeout) {
      var count = 0;
      var iterate = function() {
        count++;
      };

      $timeout(iterate, 100);
      $timeout(iterate, 123);
      $timeout.flush(100);
      expect(count).toBe(1);
      $timeout.flush(123);
      expect(count).toBe(2);
    }));


    test('should resolve timeout functions following the timeline', angular.mock.inject(function($timeout) {
      var count1 = 0;
      var count2 = 0;
      var iterate1 = function() {
        count1++;
        $timeout(iterate1, 100);
      };
      var iterate2 = function() {
        count2++;
        $timeout(iterate2, 150);
      };

      $timeout(iterate1, 100);
      $timeout(iterate2, 150);
      $timeout.flush(150);
      expect(count1).toBe(1);
      expect(count2).toBe(1);
      $timeout.flush(50);
      expect(count1).toBe(2);
      expect(count2).toBe(1);
      $timeout.flush(400);
      expect(count1).toBe(6);
      expect(count2).toBe(4);
    }));
  });


  describe('angular.mock.dump', () => {
    var d = angular.mock.dump;


    test('should serialize primitive types', () => {
      expect(d(undefined)).toEqual('undefined');
      expect(d(1)).toEqual('1');
      expect(d(null)).toEqual('null');
      expect(d('abc')).toEqual('abc');
    });


    test('should serialize element', () => {
      var e = angular.element('<div>abc</div><span>xyz</span>');
      expect(d(e).toLowerCase()).toEqual('<div>abc</div><span>xyz</span>');
      expect(d(e[0]).toLowerCase()).toEqual('<div>abc</div>');
    });

    test('should serialize scope', angular.mock.inject(function($rootScope) {
      $rootScope.obj = {abc:'123'};
      expect(d($rootScope)).toMatch(/Scope\(.*\): \{/);
      expect(d($rootScope)).toMatch(/{"abc":"123"}/);
    }));

    test('should serialize scope that has overridden "hasOwnProperty"', angular.mock.inject(function($rootScope, $sniffer) {
      $rootScope.hasOwnProperty = 'X';
      expect(d($rootScope)).toMatch(/Scope\(.*\): \{/);
      expect(d($rootScope)).toMatch(/hasOwnProperty: "X"/);
    }));
  });


  describe('module and inject', () => {
    var log;

     beforeEach(() => {
      log = '';
    });

    describe('module', () => {

      describe('object literal format', () => {
        var mock = { log: 'module' };

         beforeEach(() => {
          angular.module('stringRefModule', []).service('stringRef', function() {});

          angular.mock.module({
              'service': mock,
              'other': { some: 'replacement'}
            },
            'stringRefModule',
            function($provide) { $provide.value('example', 'win'); }
          );
        });

        test('should inject the mocked angular.mock.module', () => {
          angular.mock.inject(function(service) {
            expect(service).toEqual(mock);
          });
        });

        test('should support multiple key value pairs', () => {
          angular.mock.inject(function(service, other) {
            expect(other.some).toEqual('replacement');
            expect(service).toEqual(mock);
          });
        });

        test('should integrate with string and function', () => {
          angular.mock.inject(function(service, stringRef, example) {
            expect(service).toEqual(mock);
            expect(stringRef).toBeDefined();
            expect(example).toEqual('win');
          });
        });

        describe('$inject cleanup', () => {
          function testFn() {

          }

          test('should add $inject when invoking test function', angular.mock.inject(function($injector) {
            $injector.invoke(testFn);
            expect(testFn.$inject).toBeDefined();
          }));

          test('should cleanup $inject after previous test', () => {
            expect(testFn.$inject).toBeUndefined();
          });

          test('should add $inject when annotating test function', angular.mock.inject(function($injector) {
            $injector.annotate(testFn);
            expect(testFn.$inject).toBeDefined();
          }));

          test('should cleanup $inject after previous test', () => {
            expect(testFn.$inject).toBeUndefined();
          });

          test('should invoke an already annotated function', angular.mock.inject(function($injector) {
            testFn.$inject = [];
            $injector.invoke(testFn);
          }));

          test('should not cleanup $inject after previous test', () => {
            expect(testFn.$inject).toBeDefined();
          });
        });
      });

      describe('in DSL', () => {
        test('should load angular.mock.module', angular.mock.module(function() {
          log += 'module';
        }));

         afterEach(() => {
          angular.mock.inject();
          expect(log).toEqual('module');
        });
      });

      describe('nested calls', () => {
        test('should invoke nested angular.mock.module calls immediately', () => {
          angular.mock.module(function($provide) {
            $provide.constant('someConst', 'blah');
            angular.mock.module(function(someConst) {
              log = someConst;
            });
          });
          angular.mock.inject(function() {
            expect(log).toBe('blah');
          });
        });
      });

      describe('inline in test', () => {
        test('should load angular.mock.module', () => {
          angular.mock.module(function() {
            log += 'module';
          });
          angular.mock.inject();
        });

         afterEach(() => {
          expect(log).toEqual('module');
        });
      });
    });

    describe('inject', () => {
      describe('in DSL', () => {
        test('should load angular.mock.module', angular.mock.inject(function() {
          log += 'inject';
        }));

         afterEach(() => {
          expect(log).toEqual('inject');
        });
      });


      describe('inline in test', () => {
        test('should load angular.mock.module', () => {
          angular.mock.inject(function() {
            log += 'inject';
          });
        });

         afterEach(() => {
          expect(log).toEqual('inject');
        });
      });

      describe('module with inject', () => {
        beforeEach(angular.mock.module(function() {
          log += 'module;';
        }));

        test('should inject', angular.mock.inject(function() {
          log += 'inject;';
        }));

         afterEach(() => {
          expect(log).toEqual('module;inject;');
        });
      });

      test('should not change thrown Errors', angular.mock.inject(function($sniffer) {
        expect(function() {
          angular.mock.inject(function() {
            throw new Error('test message');
          });
        }).toThrow(expect.objectContaining({message: 'test message'}));
      }));

      test('should not change thrown strings', angular.mock.inject(function($sniffer) {
        expect(function() {
          angular.mock.inject(function() {
            throw 'test message';
          });
        }).toThrow('test message');
      }));

      describe('error stack trace when called outside of spec context', () => {
        // - Chrome, Firefox, Edge give us the stack trace as soon as an Error is created
        // - IE10+, PhantomJS give us the stack trace only once the error is thrown
        // - IE9 does not provide stack traces
        var stackTraceSupported = (function() {
          var error = new Error();
          if (!error.stack) {
            try {
              throw error;
            } catch (e) { /* empty */}
          }

          return !!error.stack;
        })();

        function testCaller() {
          return angular.mock.inject(function injectableError() {
            throw new Error();
          });
        }
        var throwErrorFromInjectCallback = testCaller();

        if (stackTraceSupported) {
          describe('on browsers supporting stack traces', () => {
            test('should update thrown Error stack trace with inject call location', () => {
              try {
                throwErrorFromInjectCallback();
              } catch (e) {
                expect(e.stack).toMatch('injectableError');
              }
            });
          });
        } else {
          describe('on browsers not supporting stack traces', () => {
            test('should not add stack trace information to thrown Error', () => {
              try {
                throwErrorFromInjectCallback();
              } catch (e) {
                expect(e.stack).toBeUndefined();
              }
            });
          });
        }
      });

      describe('ErrorAddingDeclarationLocationStack', () => {
        test('should be caught by Jest\'s `toThrow()`', () => {
          function throwErrorAddingDeclarationStack() {
            angular.mock.module(function($provide) {
              $provide.factory('badFactory', function() {
                throw new Error('BadFactoryError');
              });
            });

            angular.mock.inject(function(badFactory) {});
          }

          expect(throwErrorAddingDeclarationStack).toThrow(/BadFactoryError/);
        });
      });
    });
  });


  describe('$httpBackend', () => {
    var hb;
    var callback;

    beforeEach(angular.mock.inject(function($httpBackend) {
      callback = jest.fn().mockName('callback');
      hb = $httpBackend;
    }));


    test('should provide "expect" methods for each HTTP verb', () => {
      expect(typeof hb.expectGET).toBe('function');
      expect(typeof hb.expectPOST).toBe('function');
      expect(typeof hb.expectPUT).toBe('function');
      expect(typeof hb.expectPATCH).toBe('function');
      expect(typeof hb.expectDELETE).toBe('function');
      expect(typeof hb.expectHEAD).toBe('function');
    });


    test('should provide "when" methods for each HTTP verb', () => {
      expect(typeof hb.whenGET).toBe('function');
      expect(typeof hb.whenPOST).toBe('function');
      expect(typeof hb.whenPUT).toBe('function');
      expect(typeof hb.whenPATCH).toBe('function');
      expect(typeof hb.whenDELETE).toBe('function');
      expect(typeof hb.whenHEAD).toBe('function');
    });


    test('should provide "route" shortcuts for expect and when', () => {
      expect(typeof hb.whenRoute).toBe('function');
      expect(typeof hb.expectRoute).toBe('function');
    });


    test('should respond with first matched definition by default', () => {
      hb.when('GET', '/url1').respond(200, 'content', {});
      hb.when('GET', '/url1').respond(201, 'another', {});

      callback.mockImplementation(function(status, response) {
        expect(status).toBe(200);
        expect(response).toBe('content');
      });

      hb('GET', '/url1', null, callback);
      expect(callback).not.toHaveBeenCalled();
      hb.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });


    describe('matchLatestDefinitionEnabled()', () => {

      test('should be set to false by default', () => {
        expect(hb.matchLatestDefinitionEnabled()).toBe(false);
      });


      test('should allow to change the value', () => {
        hb.matchLatestDefinitionEnabled(true);
        expect(hb.matchLatestDefinitionEnabled()).toBe(true);
      });


      test('should return the httpBackend when used as a setter', () => {
        expect(hb.matchLatestDefinitionEnabled(true)).toBe(hb);
      });


      test('should respond with the first matched definition when false',
        function() {
          hb.matchLatestDefinitionEnabled(false);

          hb.when('GET', '/url1').respond(200, 'content', {});
          hb.when('GET', '/url1').respond(201, 'another', {});

          callback.mockImplementation(function(status, response) {
            expect(status).toBe(200);
            expect(response).toBe('content');
          });

          hb('GET', '/url1', null, callback);
          expect(callback).not.toHaveBeenCalled();
          hb.flush();
          expect(callback).toHaveBeenCalledTimes(1);
        }
      );


      test('should respond with latest matched definition when true',
        function() {
          hb.matchLatestDefinitionEnabled(true);

          hb.when('GET', '/url1').respond(200, 'match1', {});
          hb.when('GET', '/url1').respond(200, 'match2', {});
          hb.when('GET', '/url2').respond(204, 'nomatch', {});

          callback.mockImplementation(function(status, response) {
            expect(status).toBe(200);
            expect(response).toBe('match2');
          });

          hb('GET', '/url1', null, callback);

          // Check if a newly added match is used
          hb.when('GET', '/url1').respond(201, 'match3', {});

          var callback2 = jest.fn();

          callback2.mockImplementation(function(status, response) {
            expect(status).toBe(201);
            expect(response).toBe('match3');
          });

          hb('GET', '/url1', null, callback2);
          expect(callback).not.toHaveBeenCalled();
          hb.flush();
          expect(callback).toHaveBeenCalledTimes(1);
        }
      );
    });


    test('should respond with a copy of the mock data', () => {
      var mockObject = {a: 'b'};

      hb.when('GET', '/url1').respond(200, mockObject, {});

      callback.mockImplementation(function(status, response) {
        expect(status).toBe(200);
        expect(response).toEqual({a: 'b'});
        expect(response).not.toBe(mockObject);
        response.a = 'c';
      });

      hb('GET', '/url1', null, callback);
      hb.flush();
      expect(callback).toHaveBeenCalledTimes(1);

      // Fire it again and verify that the returned mock data has not been
      // modified.
      callback.mockClear();
      hb('GET', '/url1', null, callback);
      hb.flush();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(mockObject).toEqual({a: 'b'});
    });


    test('should be able to handle Blobs as mock data', () => {
      if (typeof Blob !== 'undefined') {
        // eslint-disable-next-line no-undef
        var mockBlob = new Blob(['{"foo":"bar"}'], {type: 'application/json'});

        hb.when('GET', '/url1').respond(200, mockBlob, {});

        callback.mockImplementation(function(status, response) {
          expect(response).not.toBe(mockBlob);
          expect(response.size).toBe(13);
          expect(response.type).toBe('application/json');
          expect(response.toString()).toBe('[object Blob]');
        });

        hb('GET', '/url1', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalledTimes(1);
      }
    });


    test('should throw error when unexpected request', () => {
      hb.when('GET', '/url1').respond(200, 'content');
      expect(function() {
        hb('GET', '/xxx');
      }).toThrow('Unexpected request: GET /xxx\nNo more request expected');
    });


    test('should throw error when expectation fails', () => {
      expect(function() {
        hb.expectPOST('/some', {foo: 1}).respond({});
        hb('POST', '/some', {foo: 2}, callback);
        hb.flush();
      }).toThrow(/^Expected POST \/some with different data/);
    });


    test('should throw error when expectation about headers fails', () => {
      expect(function() {
        hb.expectPOST('/some', {foo: 1}, {X: 'val1'}).respond({});
        hb('POST', '/some', {foo: 1}, callback, {X: 'val2'});
        hb.flush();
      }).toThrow(/^Expected POST \/some with different headers/);
    });


    test('should throw error about data when expectations about both data and headers fail', () => {
      expect(function() {
        hb.expectPOST('/some', {foo: 1}, {X: 'val1'}).respond({});
        hb('POST', '/some', {foo: 2}, callback, {X: 'val2'});
        hb.flush();
      }).toThrow(/^Expected POST \/some with different data/);
    });


    test('should throw error when response is not defined for a backend definition', () => {
      expect(function() {
        hb.whenGET('/some'); // no .respond(...) !
        hb('GET', '/some', null, callback);
        hb.flush();
      }).toThrow('No response defined !');
    });


    test('should match headers if specified', () => {
      hb.when('GET', '/url', null, {'X': 'val1'}).respond(201, 'content1');
      hb.when('GET', '/url', null, {'X': 'val2'}).respond(202, 'content2');
      hb.when('GET', '/url').respond(203, 'content3');

      hb('GET', '/url', null, function(status, response) {
        expect(status).toBe(203);
        expect(response).toBe('content3');
      });

      hb('GET', '/url', null, function(status, response) {
        expect(status).toBe(201);
        expect(response).toBe('content1');
      }, {'X': 'val1'});

      hb('GET', '/url', null, function(status, response) {
        expect(status).toBe(202);
        expect(response).toBe('content2');
      }, {'X': 'val2'});

      hb.flush();
    });


    test('should match data if specified', () => {
      hb.when('GET', '/a/b', '{a: true}').respond(201, 'content1');
      hb.when('GET', '/a/b').respond(202, 'content2');

      hb('GET', '/a/b', '{a: true}', function(status, response) {
        expect(status).toBe(201);
        expect(response).toBe('content1');
      });

      hb('GET', '/a/b', null, function(status, response) {
        expect(status).toBe(202);
        expect(response).toBe('content2');
      });

      hb.flush();
    });


    test('should match data object if specified', () => {
      hb.when('GET', '/a/b', {a: 1, b: 2}).respond(201, 'content1');
      hb.when('GET', '/a/b').respond(202, 'content2');

      hb('GET', '/a/b', '{"a":1,"b":2}', function(status, response) {
        expect(status).toBe(201);
        expect(response).toBe('content1');
      });

      hb('GET', '/a/b', '{"b":2,"a":1}', function(status, response) {
        expect(status).toBe(201);
        expect(response).toBe('content1');
      });

      hb('GET', '/a/b', null, function(status, response) {
        expect(status).toBe(202);
        expect(response).toBe('content2');
      });

      hb.flush();
    });


    test('should match only method', () => {
      hb.when('GET').respond(202, 'c');
      callback.mockImplementation(function(status, response) {
        expect(status).toBe(202);
        expect(response).toBe('c');
      });

      hb('GET', '/some', null, callback, {});
      hb('GET', '/another', null, callback, {'X-Fake': 'Header'});
      hb('GET', '/third', 'some-data', callback, {});
      hb.flush();

      expect(callback).toHaveBeenCalled();
    });


    test('should not error if the url is not provided', () => {
      expect(function() {
        hb.when('GET');

        hb.whenGET();
        hb.whenPOST();
        hb.whenPUT();
        hb.whenPATCH();
        hb.whenDELETE();
        hb.whenHEAD();

        hb.expect('GET');

        hb.expectGET();
        hb.expectPOST();
        hb.expectPUT();
        hb.expectPATCH();
        hb.expectDELETE();
        hb.expectHEAD();
      }).not.toThrow();
    });


    test('should error if the url is undefined', () => {
      expect(function() {
        hb.when('GET', undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.whenGET(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.whenDELETE(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.whenJSONP(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.whenHEAD(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.whenPATCH(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.whenPOST(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.whenPUT(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');


      expect(function() {
        hb.expect('GET', undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.expectGET(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.expectDELETE(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.expectJSONP(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.expectHEAD(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.expectPATCH(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.expectPOST(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');

      expect(function() {
        hb.expectPUT(undefined);
      }).toThrow('Undefined argument `url`; the argument is provided but not defined');
    });


    test('should preserve the order of requests', () => {
      hb.when('GET', '/url1').respond(200, 'first');
      hb.when('GET', '/url2').respond(201, 'second');

      hb('GET', '/url2', null, callback);
      hb('GET', '/url1', null, callback);

      hb.flush();

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[0]).toEqual([201, 'second', '', '', 'complete']);
      expect(callback.mock.calls[1]).toEqual([200, 'first', '', '', 'complete']);
    });


    describe('respond()', () => {
      test('should take values', () => {
        hb.expect('GET', '/url1').respond(200, 'first', {'header': 'val'}, 'OK');
        hb('GET', '/url1', undefined, callback);
        hb.flush();

        expect(callback).toHaveBeenCalledOnceWith(200, 'first', 'header: val', 'OK', 'complete');
      });

      test('should default status code to 200', () => {
        callback.mockImplementation(function(status, response) {
          expect(status).toBe(200);
          expect(response).toBe('some-data');
        });

        hb.expect('GET', '/url1').respond('some-data');
        hb.expect('GET', '/url2').respond('some-data', {'X-Header': 'true'});
        hb('GET', '/url1', null, callback);
        hb('GET', '/url2', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(2);
      });

      test('should default status code to 200 and provide status text', () => {
        hb.expect('GET', '/url1').respond('first', {'header': 'val'}, 'OK');
        hb('GET', '/url1', null, callback);
        hb.flush();

        expect(callback).toHaveBeenCalledOnceWith(200, 'first', 'header: val', 'OK', 'complete');
      });

      test('should default xhrStatus to complete', () => {
        callback.mockImplementation(function(status, response, headers, x, xhrStatus) {
          expect(xhrStatus).toBe('complete');
        });

        hb.expect('GET', '/url1').respond('some-data');
        hb('GET', '/url1', null, callback);

        hb.flush();
        expect(callback).toHaveBeenCalled();
      });

      test('should take function', () => {
        hb.expect('GET', '/some?q=s').respond(function(m, u, d, h, p) {
          return [301, m + u + ';' + d + ';a=' + h.a + ';q=' + p.q, {'Connection': 'keep-alive'}, 'Moved Permanently'];
        });

        hb('GET', '/some?q=s', 'data', callback, {a: 'b'});
        hb.flush();

        expect(callback).toHaveBeenCalledOnceWith(301, 'GET/some?q=s;data;a=b;q=s', 'Connection: keep-alive', 'Moved Permanently', undefined);
      });

      test('should decode query parameters in respond() function', () => {
        hb.expect('GET', '/url?query=l%E2%80%A2ng%20string%20w%2F%20spec%5Eal%20char%24&id=1234&orderBy=-name')
        .respond(function(m, u, d, h, p) {
          return [200, 'id=' + p.id + ';orderBy=' + p.orderBy + ';query=' + p.query];
        });

        hb('GET', '/url?query=l%E2%80%A2ng%20string%20w%2F%20spec%5Eal%20char%24&id=1234&orderBy=-name', null, callback);
        hb.flush();

        expect(callback).toHaveBeenCalledOnceWith(200, 'id=1234;orderBy=-name;query=l•ng string w/ spec^al char$', '', '', undefined);
      });

      test('should include regex captures in respond() params when keys provided', () => {
        hb.expect('GET', /\/(.+)\/article\/(.+)/, undefined, undefined, ['id', 'name'])
        .respond(function(m, u, d, h, p) {
          return [200, 'id=' + p.id + ';name=' + p.name];
        });

        hb('GET', '/1234/article/cool-angular-article', null, callback);
        hb.flush();

        expect(callback).toHaveBeenCalledOnceWith(200, 'id=1234;name=cool-angular-article', '', '', undefined);
      });

      test('should default response headers to ""', () => {
        hb.expect('GET', '/url1').respond(200, 'first');
        hb.expect('GET', '/url2').respond('second');

        hb('GET', '/url1', null, callback);
        hb('GET', '/url2', null, callback);

        hb.flush();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.mock.calls[0]).toEqual([200, 'first', '', '', 'complete']);
        expect(callback.mock.calls[1]).toEqual([200, 'second', '', '', 'complete']);
      });

      test('should be able to override response of expect definition', () => {
        var definition = hb.expect('GET', '/url1');
        definition.respond('first');
        definition.respond('second');

        hb('GET', '/url1', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalledOnceWith(200, 'second', '', '', 'complete');
      });

      test('should be able to override response of when definition', () => {
        var definition = hb.when('GET', '/url1');
        definition.respond('first');
        definition.respond('second');

        hb('GET', '/url1', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalledOnceWith(200, 'second', '', '', 'complete');
      });

      test('should be able to override response of expect definition with chaining', () => {
        var definition = hb.expect('GET', '/url1').respond('first');
        definition.respond('second');

        hb('GET', '/url1', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalledOnceWith(200, 'second', '', '', 'complete');
      });

      test('should be able to override response of when definition with chaining', () => {
        var definition = hb.when('GET', '/url1').respond('first');
        definition.respond('second');

        hb('GET', '/url1', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalledOnceWith(200, 'second', '', '', 'complete');
      });
    });


    describe('expect()', () => {
      test('should require specified order', () => {
        hb.expect('GET', '/url1').respond(200, '');
        hb.expect('GET', '/url2').respond(200, '');

        expect(function() {
          hb('GET', '/url2', null, angular.noop, {});
        }).toThrow('Unexpected request: GET /url2\nExpected GET /url1');
      });


      test('should have precedence over when()', () => {
        callback.mockImplementation(function(status, response) {
          expect(status).toBe(300);
          expect(response).toBe('expect');
        });

        hb.when('GET', '/url').respond(200, 'when');
        hb.expect('GET', '/url').respond(300, 'expect');

        hb('GET', '/url', null, callback, {});
        hb.flush();
        expect(callback).toHaveBeenCalledTimes(1);
      });


      test('should throw exception when only headers differs from expectation', () => {
        hb.when('GET').respond(200, '', {});
        hb.expect('GET', '/match', undefined, {'Content-Type': 'application/json'});

        expect(function() {
          hb('GET', '/match', null, angular.noop, {});
        }).toThrow('Expected GET /match with different headers\n' +
                        'EXPECTED: {"Content-Type":"application/json"}\nGOT:      {}');
      });


      test('should throw exception when only data differs from expectation', () => {
        hb.when('GET').respond(200, '', {});
        hb.expect('GET', '/match', 'some-data');

        expect(function() {
          hb('GET', '/match', 'different', angular.noop, {});
        }).toThrow('Expected GET /match with different data\n' +
                        'EXPECTED: some-data\nGOT:      different');
      });


      test('should not throw an exception when parsed body is equal to expected body object', () => {
        hb.when('GET').respond(200, '', {});

        hb.expect('GET', '/match', {a: 1, b: 2});
        expect(function() {
          hb('GET', '/match', '{"a":1,"b":2}', angular.noop, {});
        }).not.toThrow();

        hb.expect('GET', '/match', {a: 1, b: 2});
        expect(function() {
          hb('GET', '/match', '{"b":2,"a":1}', angular.noop, {});
        }).not.toThrow();
      });


      test('should throw exception when only parsed body differs from expected body object', () => {
        hb.when('GET').respond(200, '', {});
        hb.expect('GET', '/match', {a: 1, b: 2});

        expect(function() {
          hb('GET', '/match', '{"a":1,"b":3}', angular.noop, {});
        }).toThrow('Expected GET /match with different data\n' +
                        'EXPECTED: {"a":1,"b":2}\nGOT:      {"a":1,"b":3}');
      });


      test('should use when\'s respond() when no expect() respond is defined', () => {
        callback.mockImplementation(function(status, response) {
          expect(status).toBe(201);
          expect(response).toBe('data');
        });

        hb.when('GET', '/some').respond(201, 'data');
        hb.expect('GET', '/some');
        hb('GET', '/some', null, callback);
        hb.flush();

        expect(callback).toHaveBeenCalled();
        expect(function() { hb.verifyNoOutstandingExpectation(); }).not.toThrow();
      });
    });


    describe('flush()', () => {
      test('flush() should flush requests fired during callbacks', () => {
        hb.when('GET').respond(200, '');
        hb('GET', '/some', null, function() {
          hb('GET', '/other', null, callback);
        });

        hb.flush();
        expect(callback).toHaveBeenCalled();
      });


      test('should flush given number of pending requests', () => {
        hb.when('GET').respond(200, '');
        hb('GET', '/some', null, callback);
        hb('GET', '/some', null, callback);
        hb('GET', '/some', null, callback);

        hb.flush(2);
        expect(callback).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(2);
      });


      test('should flush given number of pending requests beginning at specified request', () => {
        var dontCallMe = jest.fn().mockName('dontCallMe');

        hb.when('GET').respond(200, '');
        hb('GET', '/some', null, dontCallMe);
        hb('GET', '/some', null, callback);
        hb('GET', '/some', null, callback);
        hb('GET', '/some', null, dontCallMe);

        hb.flush(2, 1);
        expect(dontCallMe).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(2);
      });


      test('should flush all pending requests beginning at specified request', () => {
        var dontCallMe = jest.fn().mockName('dontCallMe');

        hb.when('GET').respond(200, '');
        hb('GET', '/some', null, dontCallMe);
        hb('GET', '/some', null, dontCallMe);
        hb('GET', '/some', null, callback);
        hb('GET', '/some', null, callback);

        hb.flush(null, 2);
        expect(dontCallMe).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(2);
      });


      test('should throw exception when flushing more requests than pending', () => {
        hb.when('GET').respond(200, '');
        hb('GET', '/url', null, callback);

        expect(function() {hb.flush(2);}).toThrow('No more pending request to flush !');
        expect(callback).toHaveBeenCalledTimes(1);
      });


      test('should throw exception when no request to flush', () => {
        expect(function() {hb.flush();}).toThrow('No pending request to flush !');

        hb.when('GET').respond(200, '');
        hb('GET', '/some', null, callback);
        expect(function() {hb.flush(null, 1);}).toThrow('No pending request to flush !');

        hb.flush();
        expect(function() {hb.flush();}).toThrow('No pending request to flush !');
      });


      test('should throw exception if not all expectations satisfied', () => {
        hb.expect('GET', '/url1').respond();
        hb.expect('GET', '/url2').respond();

        hb('GET', '/url1', null, angular.noop);
        expect(function() {hb.flush();}).toThrow('Unsatisfied requests: GET /url2');
      });
    });


    test('should abort requests when timeout promise resolves', () => {
      hb.expect('GET', '/url1').respond(200);

      var canceler;

      var then = jest.fn().mockName('then').mockImplementation(function(fn) {
        canceler = fn;
      });

      hb('GET', '/url1', null, callback, null, {then: then});
      expect(typeof canceler).toBe('function');

      canceler();  // simulate promise resolution

      expect(callback).toHaveBeenCalledWith(-1, undefined, '', undefined, 'abort');
      hb.verifyNoOutstandingExpectation();
      hb.verifyNoOutstandingRequest();
    });


    test('should abort requests when timeout passed as a numeric value', angular.mock.inject(function($timeout) {
      hb.expect('GET', '/url1').respond(200);

      hb('GET', '/url1', null, callback, null, 200);
      $timeout.flush(300);

      expect(callback).toHaveBeenCalledWith(-1, undefined, '', undefined, 'timeout');
      hb.verifyNoOutstandingExpectation();
      hb.verifyNoOutstandingRequest();
    }));


    test('should throw an exception if no response defined', () => {
      hb.when('GET', '/test');
      expect(function() {
        hb('GET', '/test', null, callback);
      }).toThrow('No response defined !');
    });


    test('should throw an exception if no response for exception and no definition', () => {
      hb.expect('GET', '/url');
      expect(function() {
        hb('GET', '/url', null, callback);
      }).toThrow('No response defined !');
    });


    test('should respond undefined when JSONP method', () => {
      hb.when('JSONP', '/url1').respond(200);
      hb.expect('JSONP', '/url2').respond(200);

      expect(hb('JSONP', '/url1')).toBeUndefined();
      expect(hb('JSONP', '/url2')).toBeUndefined();
    });


    test('should not have passThrough method', () => {
      expect(hb.passThrough).toBeUndefined();
    });


    describe('verifyExpectations', () => {

      test('should throw exception if not all expectations were satisfied', () => {
        hb.expect('POST', '/u1', 'ddd').respond(201, '', {});
        hb.expect('GET', '/u2').respond(200, '', {});
        hb.expect('POST', '/u3').respond(201, '', {});

        hb('POST', '/u1', 'ddd', angular.noop, {});

        expect(function() {hb.verifyNoOutstandingExpectation();}).
          toThrow('Unsatisfied requests: GET /u2, POST /u3');
      });


      test('should do nothing when no expectation', () => {
        hb.when('DELETE', '/some').respond(200, '');

        expect(function() {hb.verifyNoOutstandingExpectation();}).not.toThrow();
      });


      test('should do nothing when all expectations satisfied', () => {
        hb.expect('GET', '/u2').respond(200, '', {});
        hb.expect('POST', '/u3').respond(201, '', {});
        hb.when('DELETE', '/some').respond(200, '');

        hb('GET', '/u2', angular.noop);
        hb('POST', '/u3', angular.noop);

        expect(function() {hb.verifyNoOutstandingExpectation();}).not.toThrow();
      });
    });


    describe('verifyRequests', () => {

      test('should throw exception if not all requests were flushed', () => {
        hb.when('GET').respond(200);
        hb('GET', '/some', null, angular.noop, {});

        expect(function() {
          hb.verifyNoOutstandingRequest();
        }).toThrow('Unflushed requests: 1\n' +
                        '  GET /some');
      });


      test('should verify requests fired asynchronously', angular.mock.inject(function($q) {
        hb.when('GET').respond(200);
        $q.resolve().then(function() {
          hb('GET', '/some', null, angular.noop, {});
        });

        expect(function() {
          hb.verifyNoOutstandingRequest();
        }).toThrow('Unflushed requests: 1\n' +
                        '  GET /some');
      }));


      test('should describe multiple unflushed requests', () => {
        hb.when('GET').respond(200);
        hb.when('PUT').respond(200);
        hb('GET', '/some', null, angular.noop, {});
        hb('PUT', '/elsewhere', null, angular.noop, {});

        expect(function() {
          hb.verifyNoOutstandingRequest();
        }).toThrow('Unflushed requests: 2\n' +
                        '  GET /some\n' +
                        '  PUT /elsewhere');
      });
    });


    describe('resetExpectations', () => {

      test('should remove all expectations', () => {
        hb.expect('GET', '/u2').respond(200, '', {});
        hb.expect('POST', '/u3').respond(201, '', {});
        hb.resetExpectations();

        expect(function() {hb.verifyNoOutstandingExpectation();}).not.toThrow();
      });


      test('should remove all pending responses', () => {
        var cancelledClb = jest.fn().mockName('cancelled');

        hb.expect('GET', '/url').respond(200, '');
        hb('GET', '/url', null, cancelledClb);
        hb.resetExpectations();

        hb.expect('GET', '/url').respond(300, '');
        hb('GET', '/url', null, callback, {});
        hb.flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(cancelledClb).not.toHaveBeenCalled();
      });


      test('should not remove definitions', () => {
        var cancelledClb = jest.fn().mockName('cancelled');

        hb.when('GET', '/url').respond(200, 'success');
        hb('GET', '/url', null, cancelledClb);
        hb.resetExpectations();

        hb('GET', '/url', null, callback, {});
        hb.flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(cancelledClb).not.toHaveBeenCalled();
      });
    });


    describe('expect/when shortcuts', () => {
      angular.forEach(['expect', 'when'], function(prefix) {
        angular.forEach(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'JSONP'], function(method) {
          var shortcut = prefix + method;
          test('should provide ' + shortcut + ' shortcut method', () => {
            hb[shortcut]('/foo').respond('bar');
            hb(method, '/foo', undefined, callback);
            hb.flush();
            expect(callback).toHaveBeenCalledOnceWith(200, 'bar', '', '', 'complete');
          });
        });
      });
    });


    describe('expectRoute/whenRoute shortcuts', () => {
      angular.forEach(['expectRoute', 'whenRoute'], function(routeShortcut) {
        var methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'JSONP'];
        test.each(methods.map((prop) => ({ prop })))(
            'should provide ' + routeShortcut + ' shortcut with $prop method', function() {
            hb[routeShortcut](this, '/route').respond('path');
            hb(this, '/route', undefined, callback);
            hb.flush();
            expect(callback).toHaveBeenCalledOnceWith(200, 'path', '', '', 'complete');
          });
        test.each(methods.map((prop) => ({ prop })))(
            'should match colon delimited parameters in ' + routeShortcut + ' $prop method', function() {
            hb[routeShortcut](this, '/route/:id/path/:s_id').respond('path');
            hb(this, '/route/123/path/456', undefined, callback);
            hb.flush();
            expect(callback).toHaveBeenCalledOnceWith(200, 'path', '', '', 'complete');
          });
        test.each(methods.map((prop) => ({ prop })))(
            'should ignore query params when matching in ' + routeShortcut + ' $prop method', function({ prop: method }) {
            angular.forEach([
              {route: '/route1/:id', url: '/route1/Alpha', expectedParams: {id: 'Alpha'}},
              {route: '/route2/:id', url: '/route2/Bravo/?', expectedParams: {id: 'Bravo'}},
              {route: '/route3/:id', url: '/route3/Charlie?q=str&foo=bar', expectedParams: {id: 'Charlie', q: 'str', foo: 'bar'}},
              {route: '/:x/route4', url: '/Delta/route4?q=str&foo=bar', expectedParams: {x: 'Delta', q: 'str', foo: 'bar'}},
              {route: '/route5/:id*', url: '/route5/Echo/456?q=str&foo=bar', expectedParams: {id: 'Echo/456', q: 'str', foo: 'bar'}},
              {route: '/route6/:id*', url: '/route6/Foxtrot/456/?q=str&foo=bar', expectedParams: {id: 'Foxtrot/456', q: 'str', foo: 'bar'}},
              {route: '/route7/:id*', url: '/route7/Golf/456//?q=str&foo=bar', expectedParams: {id: 'Golf/456', q: 'str', foo: 'bar'}},
              {route: '/:x*/route8', url: '/Hotel/123/456/route8/?q=str&foo=bar', expectedParams: {x: 'Hotel/123/456', q: 'str', foo: 'bar'}},
              {route: '/:x*/route9/:id', url: '/India/456/route9/0?q=str&foo=bar', expectedParams: {x: 'India/456', id: '0', q: 'str', foo: 'bar'}},
              {route: '/route10', url: '/route10?q=Juliet&foo=bar', expectedParams: {q: 'Juliet', foo: 'bar'}},
              {route: '/route11', url: '/route11///?q=Kilo', expectedParams: {q: 'Kilo'}},
              {route: '/route12', url: '/route12///', expectedParams: {}}
            ], function(testDataEntry) {
              callback.mockClear();
              var paramsSpy = jest.fn().mockName('params');
              hb[routeShortcut](method, testDataEntry.route).respond(
                function(method, url, data, headers, params) {
                  paramsSpy(params);
                  // status, response, headers, statusText, xhrStatus
                  return [200, 'path', { 'x-header': 'foo' }, 'OK', 'complete'];
                }
              );
              hb(method, testDataEntry.url, undefined, callback);
              hb.flush();
              expect(callback).toHaveBeenCalledOnceWith(200, 'path', 'x-header: foo', 'OK', 'complete');
              expect(paramsSpy).toHaveBeenCalledOnceWith(testDataEntry.expectedParams);
            });
          });
      });
    });


    describe('MockHttpExpectation', () => {
      /* global MockHttpExpectation */

      test('should accept url as regexp', () => {
        var exp = new angular.mock.MockHttpExpectation('GET', /^\/x/);

        expect(exp.match('GET', '/x')).toBe(true);
        expect(exp.match('GET', '/xxx/x')).toBe(true);
        expect(exp.match('GET', 'x')).toBe(false);
        expect(exp.match('GET', 'a/x')).toBe(false);
      });

      test('should match url with same query params, but different order', () => {
        var exp = new angular.mock.MockHttpExpectation('GET', 'www.example.com/x/y?a=b&c=d&e=f');

        expect(exp.matchUrl('www.example.com/x/y?e=f&c=d&a=b')).toBe(true);
      });

      test('should accept url as function', () => {
        var urlValidator = function(url) {
          return url !== '/not-accepted';
        };
        var exp = new angular.mock.MockHttpExpectation('POST', urlValidator);

        expect(exp.match('POST', '/url')).toBe(true);
        expect(exp.match('POST', '/not-accepted')).toBe(false);
      });


      test('should accept data as regexp', () => {
        var exp = new angular.mock.MockHttpExpectation('POST', '/url', /\{.*?\}/);

        expect(exp.match('POST', '/url', '{"a": "aa"}')).toBe(true);
        expect(exp.match('POST', '/url', '{"one": "two"}')).toBe(true);
        expect(exp.match('POST', '/url', '{"one"')).toBe(false);
      });


      test('should accept data as function', () => {
        var dataValidator = function(data) {
          var json = angular.fromJson(data);
          return !!json.id && json.status === 'N';
        };
        var exp = new angular.mock.MockHttpExpectation('POST', '/url', dataValidator);

        expect(exp.matchData({})).toBe(false);
        expect(exp.match('POST', '/url', '{"id": "xxx", "status": "N"}')).toBe(true);
        expect(exp.match('POST', '/url', {'id': 'xxx', 'status': 'N'})).toBe(true);
      });


      test('should ignore data only if undefined (not null or false)', () => {
        var exp = new angular.mock.MockHttpExpectation('POST', '/url', null);
        expect(exp.matchData(null)).toBe(true);
        expect(exp.matchData('some-data')).toBe(false);

        exp = new angular.mock.MockHttpExpectation('POST', '/url', undefined);
        expect(exp.matchData(null)).toBe(true);
        expect(exp.matchData('some-data')).toBe(true);
      });


      test('should accept headers as function', () => {
        var exp = new angular.mock.MockHttpExpectation('GET', '/url', undefined, function(h) {
          return h['Content-Type'] === 'application/json';
        });

        expect(exp.matchHeaders({})).toBe(false);
        expect(exp.matchHeaders({'Content-Type': 'application/json', 'X-Another': 'true'})).toBe(true);
      });
    });
  });


  describe('$rootElement', () => {
    test('should create mock application root', angular.mock.inject(function($rootElement) {
      expect($rootElement.text()).toEqual('');
    }));

    test('should attach the `$injector` to `$rootElement`', angular.mock.inject(function($injector, $rootElement) {
      expect($rootElement.injector()).toBe($injector);
    }));
  });


  describe('$rootScopeDecorator', () => {

    describe('$countChildScopes', () => {

      test('should return 0 when no child scopes', angular.mock.inject(function($rootScope) {
        expect($rootScope.$countChildScopes()).toBe(0);

        var childScope = $rootScope.$new();
        expect($rootScope.$countChildScopes()).toBe(1);
        expect(childScope.$countChildScopes()).toBe(0);

        var grandChildScope = childScope.$new();
        expect(childScope.$countChildScopes()).toBe(1);
        expect(grandChildScope.$countChildScopes()).toBe(0);
      }));


      test('should correctly navigate complex scope tree', angular.mock.inject(function($rootScope) {
        var child;

        $rootScope.$new();
        $rootScope.$new().$new().$new();
        child = $rootScope.$new().$new();
        child.$new();
        child.$new();
        child.$new().$new().$new();

        expect($rootScope.$countChildScopes()).toBe(11);
      }));


      test('should provide the current count even after child destructions', angular.mock.inject(function($rootScope) {
        expect($rootScope.$countChildScopes()).toBe(0);

        var childScope1 = $rootScope.$new();
        expect($rootScope.$countChildScopes()).toBe(1);

        var childScope2 = $rootScope.$new();
        expect($rootScope.$countChildScopes()).toBe(2);

        childScope1.$destroy();
        expect($rootScope.$countChildScopes()).toBe(1);

        childScope2.$destroy();
        expect($rootScope.$countChildScopes()).toBe(0);
      }));


      test('should work with isolate scopes', angular.mock.inject(function($rootScope) {
        /*
                  RS
                  |
                 CIS
                /   \
              GCS   GCIS
         */

        var childIsolateScope = $rootScope.$new(true);
        expect($rootScope.$countChildScopes()).toBe(1);

        var grandChildScope = childIsolateScope.$new();
        expect($rootScope.$countChildScopes()).toBe(2);
        expect(childIsolateScope.$countChildScopes()).toBe(1);

        var grandChildIsolateScope = childIsolateScope.$new(true);
        expect($rootScope.$countChildScopes()).toBe(3);
        expect(childIsolateScope.$countChildScopes()).toBe(2);

        childIsolateScope.$destroy();
        expect($rootScope.$countChildScopes()).toBe(0);
      }));
    });


    describe('$countWatchers', () => {

      test('should return the sum of watchers for the current scope and all of its children', angular.mock.inject(
        function($rootScope) {

          expect($rootScope.$countWatchers()).toBe(0);

          var childScope = $rootScope.$new();
          expect($rootScope.$countWatchers()).toBe(0);

          childScope.$watch('foo');
          expect($rootScope.$countWatchers()).toBe(1);
          expect(childScope.$countWatchers()).toBe(1);

          $rootScope.$watch('bar');
          childScope.$watch('baz');
          expect($rootScope.$countWatchers()).toBe(3);
          expect(childScope.$countWatchers()).toBe(2);
      }));


      test('should correctly navigate complex scope tree', angular.mock.inject(function($rootScope) {
        var child;

        $rootScope.$watch('foo1');

        $rootScope.$new();
        $rootScope.$new().$new().$new();

        child = $rootScope.$new().$new();
        child.$watch('foo2');
        child.$new();
        child.$new();
        child = child.$new().$new().$new();
        child.$watch('foo3');
        child.$watch('foo4');

        expect($rootScope.$countWatchers()).toBe(4);
      }));


      test('should provide the current count even after child destruction and watch deregistration',
          angular.mock.inject(function($rootScope) {

        var deregisterWatch1 = $rootScope.$watch('exp1');

        var childScope = $rootScope.$new();
        childScope.$watch('exp2');

        expect($rootScope.$countWatchers()).toBe(2);

        childScope.$destroy();
        expect($rootScope.$countWatchers()).toBe(1);

        deregisterWatch1();
        expect($rootScope.$countWatchers()).toBe(0);
      }));


      test('should work with isolate scopes', angular.mock.inject(function($rootScope) {
        /*
                 RS=1
                   |
                CIS=1
                /    \
            GCS=1  GCIS=1
         */

        $rootScope.$watch('exp1');
        expect($rootScope.$countWatchers()).toBe(1);

        var childIsolateScope = $rootScope.$new(true);
        childIsolateScope.$watch('exp2');
        expect($rootScope.$countWatchers()).toBe(2);
        expect(childIsolateScope.$countWatchers()).toBe(1);

        var grandChildScope = childIsolateScope.$new();
        grandChildScope.$watch('exp3');

        var grandChildIsolateScope = childIsolateScope.$new(true);
        grandChildIsolateScope.$watch('exp4');

        expect($rootScope.$countWatchers()).toBe(4);
        expect(childIsolateScope.$countWatchers()).toBe(3);
        expect(grandChildScope.$countWatchers()).toBe(1);
        expect(grandChildIsolateScope.$countWatchers()).toBe(1);

        childIsolateScope.$destroy();
        expect($rootScope.$countWatchers()).toBe(1);
      }));
    });
  });


  describe('$controllerDecorator', () => {

    test('should support creating controller with bindings', () => {
      var called = false;
      var data = [
        { name: 'derp1', id: 0 },
        { name: 'testname', id: 1 },
        { name: 'flurp', id: 2 }
      ];
      angular.mock.module(function($controllerProvider) {
        $controllerProvider.register('testCtrl', function() {
          expect(this.data).toBeUndefined();
          called = true;
        });
      });
      angular.mock.inject(function($controller, $rootScope) {
        var ctrl = $controller('testCtrl', { scope: $rootScope }, { data: data });
        expect(ctrl.data).toBe(data);
        expect(called).toBe(true);
      });
    });


    test('should support assigning bindings when a value is returned from the constructor',
      function() {
        var called = false;
        var data = [
          { name: 'derp1', id: 0 },
          { name: 'testname', id: 1 },
          { name: 'flurp', id: 2 }
        ];
        angular.mock.module(function($controllerProvider) {
          $controllerProvider.register('testCtrl', function() {
            expect(this.data).toBeUndefined();
            called = true;
            return {};
          });
        });
        angular.mock.inject(function($controller, $rootScope) {
          var ctrl = $controller('testCtrl', { scope: $rootScope }, { data: data });
          expect(ctrl.data).toBe(data);
          expect(called).toBe(true);
        });
      }
    );


    if (support.classes) {
      test('should support assigning bindings to class-based controller', () => {
        var called = false;
        var data = [
          { name: 'derp1', id: 0 },
          { name: 'testname', id: 1 },
          { name: 'flurp', id: 2 }
        ];
        angular.mock.module(function($controllerProvider) {
          // eslint-disable-next-line no-eval
          var TestCtrl = eval('(class { constructor() { called = true; } })');
          $controllerProvider.register('testCtrl', TestCtrl);
        });
        angular.mock.inject(function($controller, $rootScope) {
          var ctrl = $controller('testCtrl', { scope: $rootScope }, { data: data });
          expect(ctrl.data).toBe(data);
          expect(called).toBe(true);
        });
      });
    }
  });


  describe('$componentController', () => {
    test('should instantiate a simple controller defined inline in a component', () => {
      function TestController($scope, a, b) {
        this.$scope = $scope;
        this.a = a;
        this.b = b;
      }
      angular.mock.module(function($compileProvider) {
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      angular.mock.inject(function($componentController, $rootScope) {
        var $scope = {};
        var ctrl = $componentController('test', { $scope: $scope, a: 'A', b: 'B' }, { x: 'X', y: 'Y' });
        expect(ctrl).toEqual(angular.extend(new TestController($scope, 'A', 'B'), { x: 'X', y: 'Y' }));
        expect($scope.$ctrl).toBe(ctrl);
      });
    });

    test('should instantiate a controller with $$inject annotation defined inline in a component', () => {
      function TestController(x, y, z) {
        this.$scope = x;
        this.a = y;
        this.b = z;
      }
      TestController.$inject = ['$scope', 'a', 'b'];
      angular.mock.module(function($compileProvider) {
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      angular.mock.inject(function($componentController, $rootScope) {
        var $scope = {};
        var ctrl = $componentController('test', { $scope: $scope, a: 'A', b: 'B' }, { x: 'X', y: 'Y' });
        expect(ctrl).toEqual(angular.extend(new TestController($scope, 'A', 'B'), { x: 'X', y: 'Y' }));
        expect($scope.$ctrl).toBe(ctrl);
      });
    });

    test('should instantiate a named controller defined in a component', () => {
      function TestController($scope, a, b) {
        this.$scope = $scope;
        this.a = a;
        this.b = b;
      }
      angular.mock.module(function($controllerProvider, $compileProvider) {
        $controllerProvider.register('TestController', TestController);
        $compileProvider.component('test', {
          controller: 'TestController'
        });
      });
      angular.mock.inject(function($componentController, $rootScope) {
        var $scope = {};
        var ctrl = $componentController('test', { $scope: $scope, a: 'A', b: 'B' }, { x: 'X', y: 'Y' });
        expect(ctrl).toEqual(angular.extend(new TestController($scope, 'A', 'B'), { x: 'X', y: 'Y' }));
        expect($scope.$ctrl).toBe(ctrl);
      });
    });

    test('should instantiate a named controller with `controller as` syntax defined in a component', () => {
      function TestController($scope, a, b) {
        this.$scope = $scope;
        this.a = a;
        this.b = b;
      }
      angular.mock.module(function($controllerProvider, $compileProvider) {
        $controllerProvider.register('TestController', TestController);
        $compileProvider.component('test', {
          controller: 'TestController as testCtrl'
        });
      });
      angular.mock.inject(function($componentController, $rootScope) {
        var $scope = {};
        var ctrl = $componentController('test', { $scope: $scope, a: 'A', b: 'B' }, { x: 'X', y: 'Y' });
        expect(ctrl).toEqual(angular.extend(new TestController($scope, 'A', 'B'), {x: 'X', y: 'Y'}));
        expect($scope.testCtrl).toBe(ctrl);
      });
    });

    test('should instantiate the controller of the restrict:\'E\' component if there are more directives with the same name but not restricted to \'E\'', () => {
      function TestController() {
        this.r = 6779;
      }
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('test', function() {
          return { restrict: 'A' };
        });
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      angular.mock.inject(function($componentController, $rootScope) {
        var ctrl = $componentController('test', { $scope: {} });
        expect(ctrl).toEqual(new TestController());
      });
    });

    test('should instantiate the controller of the restrict:\'E\' component if there are more directives with the same name and restricted to \'E\' but no controller', () => {
      function TestController() {
        this.r = 22926;
      }
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('test', function() {
          return { restrict: 'E' };
        });
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      angular.mock.inject(function($componentController, $rootScope) {
        var ctrl = $componentController('test', { $scope: {} });
        expect(ctrl).toEqual(new TestController());
      });
    });

    test('should instantiate the controller of the directive with controller, controllerAs and restrict:\'E\' if there are more directives', () => {
      function TestController() {
        this.r = 18842;
      }
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('test', function() {
          return { };
        });
        $compileProvider.directive('test', function() {
          return {
            restrict: 'E',
            controller: TestController,
            controllerAs: '$ctrl'
          };
        });
      });
      angular.mock.inject(function($componentController, $rootScope) {
        var ctrl = $componentController('test', { $scope: {} });
        expect(ctrl).toEqual(new TestController());
      });
    });

    test('should fail if there is no directive with restrict:\'E\' and controller', () => {
      function TestController() {
        this.r = 31145;
      }
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('test', function() {
          return {
            restrict: 'AC',
            controller: TestController
          };
        });
        $compileProvider.directive('test', function() {
          return {
            restrict: 'E',
            controller: TestController
          };
        });
        $compileProvider.directive('test', function() {
          return {
            restrict: 'EA',
            controller: TestController,
            controllerAs: '$ctrl'
          };
        });
        $compileProvider.directive('test', function() {
          return { restrict: 'E' };
        });
      });
      angular.mock.inject(function($componentController, $rootScope) {
        expect(function() {
          $componentController('test', { $scope: {} });
        }).toThrow('No component found');
      });
    });

    test('should fail if there more than two components with same name', () => {
      function TestController($scope, a, b) {
        this.$scope = $scope;
        this.a = a;
        this.b = b;
      }
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('test', function() {
          return {
            restrict: 'E',
            controller: TestController,
            controllerAs: '$ctrl'
          };
        });
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      angular.mock.inject(function($componentController, $rootScope) {
        expect(function() {
          var $scope = {};
          $componentController('test', { $scope: $scope, a: 'A', b: 'B' }, { x: 'X', y: 'Y' });
        }).toThrow('Too many components found');
      });
    });

    test('should create an isolated child of $rootScope, if no `$scope` local is provided', () => {
      function TestController($scope) {
        this.$scope = $scope;
      }
      angular.mock.module(function($compileProvider) {
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      angular.mock.inject(function($componentController, $rootScope) {
        var $ctrl = $componentController('test');
        expect($ctrl.$scope).toBeDefined();
        expect($ctrl.$scope.$parent).toBe($rootScope);
        // check it is isolated
        $rootScope.a = 17;
        expect($ctrl.$scope.a).toBeUndefined();
        $ctrl.$scope.a = 42;
        expect($rootScope.a).toEqual(17);
      });
    });
  });
});

 describe('ngMockE2E', () => {

  var noop = angular.noop;
  var extend = angular.extend;

  describe('$httpBackend', () => {
    var hb;
    var realHttpBackend;
    var realHttpBackendBrowser;
    var $http;
    var callback;

     beforeEach(() => {
      callback = jest.fn().mockName('callback');
      angular.module('ng').config(function($provide) {
        realHttpBackend = jest.fn().mockName('real $httpBackend');
        $provide.factory('$httpBackend', ['$browser', function($browser) {
          return realHttpBackend.mockImplementation(function() { realHttpBackendBrowser = $browser; });
        }]);
      });
      angular.mock.module('ngMockE2E');
      angular.mock.inject(function($injector) {
        hb = $injector.get('$httpBackend');
        $http = $injector.get('$http');
      });
    });


    test('should throw error when unexpected request - without error callback', () => {
      expect(function() {
        $http.get('/some').then(angular.noop);

        hb.verifyNoOutstandingRequest();
      }).toThrow('Unexpected request: GET /some\nNo more request expected');
    });


    test('should throw error when unexpected request - with error callback', () => {
      expect(function() {
        $http.get('/some').then(angular.noop, angular.noop);

        hb.verifyNoOutstandingRequest();
      }).toThrow('Unexpected request: GET /some\nNo more request expected');
    });

    test('should throw error when expectation fails - without error callback', () => {
      expect(function() {
        hb.expectPOST('/some', { foo: 1 }).respond({});
        $http.post('/some', { foo: 2 }).then(angular.noop);

        hb.flush();
      }).toThrow(/^Expected POST \/some with different data/);
    });

    test('should throw error when unexpected request - with error callback', () => {
      expect(function() {
        hb.expectPOST('/some', { foo: 1 }).respond({});
        $http.post('/some', { foo: 2 }).then(angular.noop, angular.noop);

        hb.flush();
      }).toThrow(/^Expected POST \/some with different data/);
    });


    describe('passThrough()', () => {
      test('should delegate requests to the real backend when passThrough is invoked', () => {
        var eventHandlers = {progress: angular.noop};
        var uploadEventHandlers = {progress: angular.noop};

        hb.when('GET', /\/passThrough\/.*/).passThrough();
        hb('GET', '/passThrough/23', null, callback, {}, null, true, 'blob', eventHandlers, uploadEventHandlers);

        expect(realHttpBackend).toHaveBeenCalledOnceWith(
            'GET', '/passThrough/23', null, callback, {}, null, true, 'blob', eventHandlers, uploadEventHandlers);
      });

      test('should be able to override a respond definition with passThrough', () => {
        var definition = hb.when('GET', /\/passThrough\/.*/).respond('override me');
        definition.passThrough();
        hb('GET', '/passThrough/23', null, callback, {}, null, true);

        expect(realHttpBackend).toHaveBeenCalledOnceWith(
            'GET', '/passThrough/23', null, callback, {}, null, true, undefined, undefined, undefined);
      });

      test('should be able to override a respond definition with passThrough', angular.mock.inject(function($browser) {
        var definition = hb.when('GET', /\/passThrough\/.*/).passThrough();
        definition.respond('passThrough override');
        hb('GET', '/passThrough/23', null, callback, {}, null, true);
        $browser.defer.flush();

        expect(realHttpBackend).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledOnceWith(200, 'passThrough override', '', '', 'complete');
      }));

      test('should pass through to an httpBackend that uses the same $browser service', angular.mock.inject(function($browser) {
        hb.when('GET', /\/passThrough\/.*/).passThrough();
        hb('GET', '/passThrough/23');

        expect(realHttpBackend).toHaveBeenCalledTimes(1);
        expect(realHttpBackendBrowser).toBe($browser);
      }));
    });


    describe('autoflush', () => {
      test('should flush responses via $browser.defer', angular.mock.inject(function($browser) {
        hb.when('GET', '/foo').respond('bar');
        hb('GET', '/foo', null, callback);

        expect(callback).not.toHaveBeenCalled();
        $browser.defer.flush();
        expect(callback).toHaveBeenCalledTimes(1);
      }));
    });
  });

  describe('ngAnimateMock', () => {
    beforeEach(angular.mock.module('ngAnimate'));
    beforeEach(angular.mock.module('ngAnimateMock'));

    var ss;
    var element;
    var trackedAnimations;
    var animationLog;

     afterEach(() => {
      if (element) {
        element.remove();
      }
      if (ss) {
        ss.destroy();
      }
    });

    beforeEach(angular.mock.module(function($animateProvider) {
      trackedAnimations = [];
      animationLog = [];

      $animateProvider.register('.animate', function() {
        return {
          leave: logFn('leave'),
          addClass: logFn('addClass')
        };

        function logFn(method) {
          return function(element) {
            animationLog.push('start ' + method);
            trackedAnimations.push(getDoneCallback(arguments));

            return function closingFn(cancel) {
              var lab = cancel ? 'cancel' : 'end';
              animationLog.push(lab + ' ' + method);
            };
          };
        }

        function getDoneCallback(args) {
          for (var i = args.length; i > 0; i--) {
            if (angular.isFunction(args[i])) return args[i];
          }
        }
      });

      return function($animate, $rootElement, $document, $rootScope) {
        ss = createMockStyleSheet($document);

        element = angular.element('<div class="animate"></div>');
        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);
        $animate.enabled(true);
        $rootScope.$digest();
      };
    }));

    describe('$animate.queue', () => {
      test('should maintain a queue of the executed animations', angular.mock.inject(function($animate) {
        element.removeClass('animate'); // we don't care to test any actual animations
        var options = {};

        $animate.addClass(element, 'on', options);
        var first = $animate.queue[0];
        expect(first.element).toBe(element);
        expect(first.event).toBe('addClass');
        expect(first.options).toBe(options);

        $animate.removeClass(element, 'off', options);
        var second = $animate.queue[1];
        expect(second.element).toBe(element);
        expect(second.event).toBe('removeClass');
        expect(second.options).toBe(options);

        $animate.leave(element, options);
        var third = $animate.queue[2];
        expect(third.element).toBe(element);
        expect(third.event).toBe('leave');
        expect(third.options).toBe(options);
      }));
    });

    describe('$animate.flush()', () => {
      test('should throw an error if there is nothing to animate', angular.mock.inject(function($animate) {
        expect(function() {
          $animate.flush();
        }).toThrow('No pending animations ready to be closed or flushed');
      }));

      test('should trigger the animation to start',
        angular.mock.inject(function($animate) {

        expect(trackedAnimations.length).toBe(0);
        $animate.leave(element);
        $animate.flush();
        expect(trackedAnimations.length).toBe(1);
      }));

      test('should trigger the animation to end once run and called',
        angular.mock.inject(function($animate) {

        $animate.leave(element);
        $animate.flush();
        expect(element.parent().length).toBe(1);

        trackedAnimations[0]();
        $animate.flush();
        expect(element.parent().length).toBe(0);
      }));

      test('should trigger the animation promise callback to fire once run and closed',
        angular.mock.inject(function($animate) {

        var doneSpy = jest.fn();
        $animate.leave(element).then(doneSpy);
        $animate.flush();

        trackedAnimations[0]();
        expect(doneSpy).not.toHaveBeenCalled();
        $animate.flush();
        expect(doneSpy).toHaveBeenCalled();
      }));

      test('should trigger a series of CSS animations to trigger and start once run',
        angular.mock.inject(function($animate, $rootScope, $timeout) {
          ss.addRule('.leave-me.ng-leave', 'transition-duration:1s;');

          var i;
          var elm;
          var elms = [];
          for (i = 0; i < 5; i++) {
            elm = angular.element('<div class="leave-me"></div>');
            element.append(elm);
            elms.push(elm);

            $animate.leave(elm);
          }

          $rootScope.$apply();

          for (i = 0; i < 5; i++) {
            elm = elms[i];
            expect(elm.hasClass('ng-leave')).toBe(true);
            expect(elm.hasClass('ng-leave-active')).toBe(false);
          }

          $animate.flush();

          for (i = 0; i < 5; i++) {
            elm = elms[i];
            expect(elm.hasClass('ng-leave')).toBe(true);
            expect(elm.hasClass('ng-leave-active')).toBe(true);
          }
        }));

      test('should trigger parent and child animations to run within the same flush',
        angular.mock.inject(function($animate, $rootScope) {

        var child = angular.element('<div class="animate child"></div>');
        element.append(child);

        expect(trackedAnimations.length).toBe(0);

        $animate.addClass(element, 'go');
        $animate.addClass(child, 'start');
        $animate.flush();

        expect(trackedAnimations.length).toBe(2);
      }));

      test('should trigger animation callbacks when called',
        angular.mock.inject(function($animate, $rootScope) {

        var spy = jest.fn();
        $animate.on('addClass', element, spy);

        $animate.addClass(element, 'on');
        expect(spy).not.toHaveBeenCalled();

        $animate.flush();
        expect(spy).toHaveBeenCalledTimes(1);

        trackedAnimations[0]();
        $animate.flush();
        expect(spy).toHaveBeenCalledTimes(2);
      }));
    });

    describe('$animate.closeAndFlush()', () => {
      test('should close the currently running $animateCss animations',
        angular.mock.inject(function($animateCss, $animate) {
        var spy = jest.fn();
        var runner = $animateCss(element, {
          duration: 1,
          to: { color: 'red' }
        }).start();

        runner.then(spy);

        expect(spy).not.toHaveBeenCalled();
        $animate.closeAndFlush();
        expect(spy).toHaveBeenCalled();
      }));

      test('should close the currently running $$animateJs animations',
        angular.mock.inject(function($$animateJs, $animate) {

        var spy = jest.fn();
        var runner = $$animateJs(element, 'leave', 'animate', {}).start();
        runner.then(spy);

        expect(spy).not.toHaveBeenCalled();
        $animate.closeAndFlush();
        expect(spy).toHaveBeenCalled();
      }));

      test('should run the closing javascript animation function upon flush',
        angular.mock.inject(function($$animateJs, $animate) {

        $$animateJs(element, 'leave', 'animate', {}).start();

        expect(animationLog).toEqual(['start leave']);
        $animate.closeAndFlush();
        expect(animationLog).toEqual(['start leave', 'end leave']);
      }));

      test('should not throw when a regular animation has no javascript animation',
        angular.mock.inject(function($animate, $$animation, $rootElement) {

        var element = angular.element('<div></div>');
        $rootElement.append(element);

        // Make sure the animation has valid $animateCss options
        $$animation(element, null, {
          from: { background: 'red' },
          to: { background: 'blue' },
          duration: 1,
          transitionStyle: 'all 1s'
        });

        expect(function() {
          $animate.closeAndFlush();
        }).not.toThrow();

        dealoc(element);
      }));

      test('should throw an error if there are no animations to close and flush',
        angular.mock.inject(function($animate) {

        expect(function() {
          $animate.closeAndFlush();
        }).toThrow('No pending animations ready to be closed or flushed');

      }));
    });
  });
});

 describe('make sure that we can create an injector outside of tests', () => {
  //since some libraries create custom injectors outside of tests,
  //we want to make sure that this is not breaking the internals of
  //how we manage annotated function cleanup during tests. See #10967
  angular.injector([function($injector) {}]);
});

 describe('`afterEach` clean-up', () => {
  describe('`$rootElement`', () => {

    describe('undecorated', () => {
      var prevRootElement;
      var prevCleanDataSpy;


      test('should set up spies for the next test to verify that `$rootElement` was cleaned up',
          function() {
            angular.mock.module(function($provide) {
              $provide.decorator('$rootElement', function($delegate) {
                prevRootElement = $delegate;

                // Spy on `angular.element.cleanData()`, so the next test can verify
                // that it has been called as necessary
                prevCleanDataSpy = jest.spyOn(angular.element, 'cleanData');

                return $delegate;
              });
            });

            // Inject the `$rootElement` to ensure it has been created
            angular.mock.inject(function($rootElement) {
              expect($rootElement.injector()).toBeDefined();
            });
          }
      );


      test('should clean up `$rootElement` after each test', () => {
        // One call is made by `testabilityPatch`'s `dealoc()`
        // We want to verify the subsequent call, made by `angular-mocks`
        expect(prevCleanDataSpy).toHaveBeenCalledTimes(2);

        var cleanUpNodes = prevCleanDataSpy.mock.calls[0][0];
        expect(cleanUpNodes.length).toBe(1);
        expect(cleanUpNodes[0]).toBe(prevRootElement[0]);
      });
    });


    describe('decorated', () => {
      var prevOriginalRootElement;
      var prevRootElement;
      var prevCleanDataSpy;


      test('should set up spies for the next text to verify that `$rootElement` was cleaned up',
          function() {
            angular.mock.module(function($provide) {
              $provide.decorator('$rootElement', function($delegate) {
                prevOriginalRootElement = $delegate;

                // Mock `$rootElement` to be able to verify that the correct object is cleaned up
                prevRootElement = angular.element('<div></div>');

                // Spy on `angular.element.cleanData()`, so the next test can verify
                // that it has been called as necessary
                prevCleanDataSpy = jest.spyOn(angular.element, 'cleanData');

                return prevRootElement;
              });
            });

            // Inject the `$rootElement` to ensure it has been created
            angular.mock.inject(function($rootElement) {
              expect($rootElement).toBe(prevRootElement);
              expect(prevOriginalRootElement.injector()).toBeDefined();
              expect(prevRootElement.injector()).toBeUndefined();

              // If we don't clean up `prevOriginalRootElement`-related data now, `testabilityPatch` will
              // complain about a memory leak, because it doesn't clean up after the original
              // `$rootElement`
              // This is a false alarm, because `angular-mocks` would have cleaned up in a subsequent
              // `afterEach` block
              prevOriginalRootElement.removeData();
            });
          }
      );
    });


    describe('uninstantiated or falsy', () => {
      test('should not break if `$rootElement` was never instantiated', () => {
        // Just an empty test to verify that `angular-mocks` doesn't break,
        // when trying to clean up `$rootElement`, if `$rootElement` was never injected in the test
        // (and thus never instantiated/created)

        // Ensure the `$injector` is created - if there is no `$injector`, no clean-up takes places
        angular.mock.inject(function() {});
      });


      test('should not break if the decorated `$rootElement` is falsy (e.g. `null`)', () => {
        angular.mock.module({$rootElement: null});

        // Ensure the `$injector` is created - if there is no `$injector`, no clean-up takes places
        angular.mock.inject(function() {});
      });
    });
  });


  describe('`$rootScope`', () => {
    describe('undecorated', () => {
      var prevRootScope;
      var prevDestroySpy;


      test('should set up spies for the next test to verify that `$rootScope` was cleaned up',
        angular.mock.inject(function($rootScope) {
          prevRootScope = $rootScope;
          prevDestroySpy = jest.spyOn($rootScope, '$destroy');
        })
      );


      test('should clean up `$rootScope` after each test', angular.mock.inject(function($rootScope) {
        expect($rootScope).not.toBe(prevRootScope);
        expect(prevDestroySpy).toHaveBeenCalledTimes(1);
        expect(prevRootScope.$$destroyed).toBe(true);
      }));
    });


    describe('falsy or without `$destroy()` method', () => {
      test('should not break if `$rootScope` is falsy (e.g. `null`)', () => {
        // Just an empty test to verify that `angular-mocks` doesn't break,
        // when trying to clean up a mocked `$rootScope` set to `null`

        angular.mock.module({$rootScope: null});

        // Ensure the `$injector` is created - if there is no `$injector`, no clean-up takes places
        angular.mock.inject(function() {});
      });


      test('should not break if `$rootScope.$destroy` is not a function', () => {
        // Just an empty test to verify that `angular-mocks` doesn't break,
        // when trying to clean up a mocked `$rootScope` without a `$destroy()` method

        angular.mock.module({$rootScope: {}});

        // Ensure the `$injector` is created - if there is no `$injector`, no clean-up takes places
        angular.mock.inject(function() {});
      });
    });
  });
});

 describe('sharedInjector', () => {
  // this is of a bit tricky feature to test as we hit angular's own testing
  // mechanisms (e.g around jQuery cache checking), as ngMock augments the very
  // test runner we're using to test ngMock!
  //
  // with that in mind, we define a stubbed test framework
  // to simulate test cases being run with the ngMock hooks


  // we use the 'module' and 'inject' globals from ngMock

  test('allows me to mutate a single instance of a angular.mock.module (proving it has been shared)', ngMockTest(function() {
    sdescribe('test state is shared', function() {
      angular.module('sharedInjectorTestModuleA', [])
        .factory('testService', function() {
          return { state: 0 };
        });

      angular.mock.module.sharedInjector();

      sbeforeAll(angular.mock.module('sharedInjectorTestModuleA'));

      sit('access and mutate', angular.mock.inject(function(testService) {
        testService.state += 1;
      }));

      sit('expect mutation to have persisted', angular.mock.inject(function(testService) {
        expect(testService.state).toEqual(1);
      }));
    });
  }));


  test('works with standard beforeEach', ngMockTest(function() {
    sdescribe('test state is not shared', function() {
      angular.module('sharedInjectorTestModuleC', [])
        .factory('testService', function() {
          return { state: 0 };
        });

      sbeforeEach(angular.mock.module('sharedInjectorTestModuleC'));

      sit('access and mutate', angular.mock.inject(function(testService) {
        testService.state += 1;
      }));

      sit('expect mutation not to have persisted', angular.mock.inject(function(testService) {
        expect(testService.state).toEqual(0);
      }));
    });
  }));


  test('allows me to stub with shared injector', ngMockTest(function() {
    sdescribe('test state is shared', function() {
      angular.module('sharedInjectorTestModuleD', [])
        .value('testService', 43);

      angular.mock.module.sharedInjector();

      sbeforeAll(angular.mock.module('sharedInjectorTestModuleD', function($provide) {
        $provide.value('testService', 42);
      }));

      sit('expected access stubbed value', angular.mock.inject(function(testService) {
        expect(testService).toEqual(42);
      }));
    });
  }));

  test('doesn\'t interfere with other test describes', ngMockTest(function() {
    angular.module('sharedInjectorTestModuleE', [])
      .factory('testService', function() {
        return { state: 0 };
      });

    sdescribe('with stubbed injector', function() {

      angular.mock.module.sharedInjector();

      sbeforeAll(angular.mock.module('sharedInjectorTestModuleE'));

      sit('access and mutate', angular.mock.inject(function(testService) {
        expect(testService.state).toEqual(0);
        testService.state += 1;
      }));

      sit('expect mutation to have persisted', angular.mock.inject(function(testService) {
        expect(testService.state).toEqual(1);
      }));
    });

    sdescribe('without stubbed injector', function() {
      sbeforeEach(angular.mock.module('sharedInjectorTestModuleE'));

      sit('access and mutate', angular.mock.inject(function(testService) {
        expect(testService.state).toEqual(0);
        testService.state += 1;
      }));

      sit('expect original, unmutated value', angular.mock.inject(function(testService) {
        expect(testService.state).toEqual(0);
      }));
    });
  }));

  test('prevents nested use of sharedInjector()', () => {
    var test = ngMockTest(function() {
      sdescribe('outer', function() {

        angular.mock.module.sharedInjector();

        sdescribe('inner', function() {

          angular.mock.module.sharedInjector();

          sit('should not get here', function() {
            throw Error('should have thrown before here!');
          });
        });

      });

    });

    assertThrowsErrorMatching(test.bind(this), /already called sharedInjector()/);
  });

  test('warns that shared injector cannot be used unless test frameworks define before/after all hooks', () => {
    assertThrowsErrorMatching(function() {
      angular.mock.module.sharedInjector();
    }, /sharedInjector()/);
  });

  function assertThrowsErrorMatching(fn, re) {
    try {
      fn();
    } catch (e) {
      if (re.test(e.message)) {
        return;
      }
      throw Error('thrown error \'' + e.message + '\' did not match:' + re);
    }
    throw Error('should have thrown error');
  }

  // run a set of test cases in the sdescribe stub test framework
  function ngMockTest(define) {
    return function() {
      var spec = this;
      angular.mock.module.$$currentSpec(null);

      // configure our stubbed test framework and then hook ngMock into it
      // in much the same way
      angular.mock.module.$$beforeAllHook = sbeforeAll;
      angular.mock.module.$$afterAllHook = safterAll;

      sdescribe.root = sdescribe('root', function() {});

      sdescribe.root.beforeEach.push(angular.mock.module.$$beforeEach);
      sdescribe.root.afterEach.push(angular.mock.module.$$afterEach);

      try {
        define();
        sdescribe.root.run();
      } finally {
        // clear up
        angular.mock.module.$$beforeAllHook = null;
        angular.mock.module.$$afterAllHook = null;
        angular.mock.module.$$currentSpec(spec);
      }
    };
  }

  // stub test framework that follows the pattern of hooks that
  // jest/mocha do
  function sdescribe(name, define) {
    var self = { name: name };
    self.parent = sdescribe.current || sdescribe.root;
    if (self.parent) {
      self.parent.describes.push(self);
    }

    var previous = sdescribe.current;
    sdescribe.current = self;

    self.beforeAll = [];
    self.beforeEach = [];
    self.afterAll = [];
    self.afterEach = [];
    self.define = define;
    self.tests = [];
    self.describes = [];

    self.run = function() {
      var spec = {};
      self.hooks('beforeAll', spec);

      self.tests.forEach(function(test) {
        if (self.parent) self.parent.hooks('beforeEach', spec);
        self.hooks('beforeEach', spec);
        test.run.call(spec);
        self.hooks('afterEach', spec);
        if (self.parent) self.parent.hooks('afterEach', spec);
      });

      self.describes.forEach(function(d) {
        d.run();
      });

      self.hooks('afterAll', spec);
    };

    self.hooks = function(hook, spec) {
      self[hook].forEach(function(f) {
        f.call(spec);
      });
    };

    define();

    sdescribe.current = previous;

    return self;
  }

  function sit(name, fn) {
    if (typeof fn !== 'function') throw Error('not fn', fn);
    sdescribe.current.tests.push({
      name: name,
      run: fn
    });
  }

  function sbeforeAll(fn) {
    if (typeof fn !== 'function') throw Error('not fn', fn);
    sdescribe.current.beforeAll.push(fn);
  }

  function safterAll(fn) {
    if (typeof fn !== 'function') throw Error('not fn', fn);
    sdescribe.current.afterAll.push(fn);
  }

  function sbeforeEach(fn) {
    if (typeof fn !== 'function') throw Error('not fn', fn);
    sdescribe.current.beforeEach.push(fn);
  }

  function safterEach(fn) {
    if (typeof fn !== 'function') throw Error('not fn', fn);
    sdescribe.current.afterEach.push(fn);
  }
});
