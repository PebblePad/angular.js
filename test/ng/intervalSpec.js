'use strict';
 describe('$interval', () => {
  /* global ngInternals.$IntervalProvider: false */

  beforeEach(angular.mock.module(function($provide) {
    var repeatFns = [];
    var nextRepeatId = 0;
    var now = 0;
    var $window;

    $window = {
      setInterval(fn, delay, count) {
        repeatFns.push({
          nextTime:(now + delay),
          delay: delay,
          fn: fn,
          id: nextRepeatId
        });
        repeatFns.sort(function(a, b) { return a.nextTime - b.nextTime;});

        return nextRepeatId++;
      },

      clearInterval(id) {
        var fnIndex;

        angular.forEach(repeatFns, function(fn, index) {
          if (fn.id === id) fnIndex = index;
        });

        if (angular.isDefined(fnIndex)) {
          repeatFns.splice(fnIndex, 1);
          return true;
        }

        return false;
      },

      flush(millis) {
        now += millis;
        while (repeatFns.length && repeatFns[0].nextTime <= now) {
          var task = repeatFns[0];
          task.fn();
          task.nextTime += task.delay;
          repeatFns.sort(function(a, b) { return a.nextTime - b.nextTime;});
        }
        return millis;
      }
    };

    $provide.provider('$interval', ngInternals.$IntervalProvider);
    $provide.value('$window', $window);
  }));

  test('should run tasks repeatedly', angular.mock.inject(function($interval, $window) {
    var counter = 0;
    $interval(function() { counter++; }, 1000);

    expect(counter).toBe(0);

    $window.flush(1000);
    expect(counter).toBe(1);

    $window.flush(1000);

    expect(counter).toBe(2);
  }));

  test('should call $apply after each task is executed',
      angular.mock.inject(function($interval, $rootScope, $window) {
    var applySpy = jest.spyOn($rootScope, '$apply');

    $interval(angular.noop, 1000);
    expect(applySpy).not.toHaveBeenCalled();

    $window.flush(1000);
    expect(applySpy).toHaveBeenCalledTimes(1);

    applySpy.mockClear();

    $interval(angular.noop, 1000);
    $interval(angular.noop, 1000);
    $window.flush(1000);
    expect(applySpy).toHaveBeenCalledTimes(3);
  }));


  test('should NOT call $apply if invokeApply is set to false',
      angular.mock.inject(function($interval, $rootScope, $window) {
    var applySpy = jest.spyOn($rootScope, '$apply');

    $interval(angular.noop, 1000, 0, false);
    expect(applySpy).not.toHaveBeenCalled();

    $window.flush(2000);
    expect(applySpy).not.toHaveBeenCalled();
  }));


  test('should NOT call $evalAsync or $digest if invokeApply is set to false',
      angular.mock.inject(function($interval, $rootScope, $window, $timeout) {
    var evalAsyncSpy = jest.spyOn($rootScope, '$evalAsync');
    var digestSpy = jest.spyOn($rootScope, '$digest');
    var notifySpy = jest.fn().mockName('notify');

    $interval(notifySpy, 1000, 1, false);

    $window.flush(2000);
    $timeout.flush(); // flush $browser.defer() timeout

    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(evalAsyncSpy).not.toHaveBeenCalled();
    expect(digestSpy).not.toHaveBeenCalled();
  }));


  test('should not depend on `notify` to trigger the callback call', () => {
    angular.mock.module(function($provide) {
      $provide.decorator('$q', function($delegate) {
        function replacement() {}
        replacement.defer = function() {
          var result = $delegate.defer();
          result.notify = angular.noop;
          return result;
        };
        return replacement;
      });
    });

    angular.mock.inject(function($interval, $window) {
      var counter = 0;
      $interval(function() { counter++; }, 1000);

      expect(counter).toBe(0);

      $window.flush(1000);
      expect(counter).toBe(1);

      $window.flush(1000);

      expect(counter).toBe(2);
    });
  });


  test('should allow you to specify the delay time', angular.mock.inject(function($interval, $window) {
    var counter = 0;
    $interval(function() { counter++; }, 123);

    expect(counter).toBe(0);

    $window.flush(122);
    expect(counter).toBe(0);

    $window.flush(1);
    expect(counter).toBe(1);
  }));


  test('should allow you to specify a number of iterations', angular.mock.inject(function($interval, $window) {
    var counter = 0;
    $interval(function() {counter++;}, 1000, 2);

    $window.flush(1000);
    expect(counter).toBe(1);
    $window.flush(1000);
    expect(counter).toBe(2);
    $window.flush(1000);
    expect(counter).toBe(2);
  }));


  test('should allow you to specify a number of arguments', angular.mock.inject(function($interval, $window) {
    var task1 = jest.fn().mockName('task1');
    var task2 = jest.fn().mockName('task2');
    var task3 = jest.fn().mockName('task3');
    $interval(task1, 1000, 2, true, 'Task1');
    $interval(task2, 1000, 2, true, 'Task2');
    $interval(task3, 1000, 2, true, 'I', 'am', 'a', 'Task3', 'spy');

    $window.flush(1000);
    expect(task1).toHaveBeenCalledWith('Task1');
    expect(task2).toHaveBeenCalledWith('Task2');
    expect(task3).toHaveBeenCalledWith('I', 'am', 'a', 'Task3', 'spy');

    task1.mockClear();
    task2.mockClear();
    task3.mockClear();

    $window.flush(1000);
    expect(task1).toHaveBeenCalledWith('Task1');
    expect(task2).toHaveBeenCalledWith('Task2');
    expect(task3).toHaveBeenCalledWith('I', 'am', 'a', 'Task3', 'spy');
  }));


  test('should return a promise which will be updated with the count on each iteration',
      angular.mock.inject(function($interval, $window) {
        var log = [];
        var promise = $interval(function() { log.push('tick'); }, 1000);

        promise.then(function(value) { log.push('promise success: ' + value); },
                     function(err) { log.push('promise error: ' + err); },
                     function(note) { log.push('promise update: ' + note); });
        expect(log).toEqual([]);

        $window.flush(1000);
        expect(log).toEqual(['tick', 'promise update: 0']);

        $window.flush(1000);
        expect(log).toEqual(['tick', 'promise update: 0', 'tick', 'promise update: 1']);
      }));


  test('should return a promise which will be resolved after the specified number of iterations',
      angular.mock.inject(function($interval, $window) {
        var log = [];
        var promise = $interval(function() { log.push('tick'); }, 1000, 2);

        promise.then(function(value) { log.push('promise success: ' + value); },
                     function(err) { log.push('promise error: ' + err); },
                     function(note) { log.push('promise update: ' + note); });
        expect(log).toEqual([]);

        $window.flush(1000);
        expect(log).toEqual(['tick', 'promise update: 0']);
        $window.flush(1000);

        expect(log).toEqual([
          'tick', 'promise update: 0', 'tick', 'promise update: 1', 'promise success: 2'
        ]);
      }));


  describe('exception handling', () => {
    beforeEach(angular.mock.module(function($exceptionHandlerProvider) {
      $exceptionHandlerProvider.mode('log');
    }));


    test('should delegate exception to the $exceptionHandler service', angular.mock.inject(
        function($interval, $exceptionHandler, $window) {
      $interval(function() { throw 'Test Error'; }, 1000);
      expect($exceptionHandler.errors).toEqual([]);

      $window.flush(1000);
      expect($exceptionHandler.errors).toEqual(['Test Error']);

      $window.flush(1000);
      expect($exceptionHandler.errors).toEqual(['Test Error', 'Test Error']);
    }));


    test('should call $apply even if an exception is thrown in callback', angular.mock.inject(
        function($interval, $rootScope, $window) {
      var applySpy = jest.spyOn($rootScope, '$apply');

      $interval(function() { throw 'Test Error'; }, 1000);
      expect(applySpy).not.toHaveBeenCalled();

      $window.flush(1000);
      expect(applySpy).toHaveBeenCalled();
    }));


    test('should still update the interval promise when an exception is thrown',
        angular.mock.inject(function($interval, $window) {
          var log = [];
          var promise = $interval(function() { throw 'Some Error'; }, 1000);

          promise.then(function(value) { log.push('promise success: ' + value); },
                     function(err) { log.push('promise error: ' + err); },
                     function(note) { log.push('promise update: ' + note); });
          $window.flush(1000);

          expect(log).toEqual(['promise update: 0']);
        }));
  });


  describe('cancel', () => {
    test('should cancel tasks', angular.mock.inject(function($interval, $window) {
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
      $window.flush(1000);

      expect(task1).not.toHaveBeenCalled();
      expect(task2).toHaveBeenCalledTimes(1);
      expect(task3).not.toHaveBeenCalled();
    }));


    test('should cancel the promise', angular.mock.inject(function($interval, $rootScope, $window) {
      var promise = $interval(angular.noop, 1000);
      var log = [];
      promise.then(function(value) { log.push('promise success: ' + value); },
                 function(err) { log.push('promise error: ' + err); },
                 function(note) { log.push('promise update: ' + note); });
      expect(log).toEqual([]);

      $window.flush(1000);
      $interval.cancel(promise);
      $window.flush(1000);
      $rootScope.$apply(); // For resolving the promise -
      // necessary since q uses $rootScope.evalAsync.

      expect(log).toEqual(['promise update: 0', 'promise error: canceled']);
    }));


    test('should return true if a task was successfully canceled',
        angular.mock.inject(function($interval, $window) {
          var task1 = jest.fn().mockName('task1');
          var task2 = jest.fn().mockName('task2');
          var promise1;
          var promise2;

          promise1 = $interval(task1, 1000, 1);
          $window.flush(1000);
          promise2 = $interval(task2, 1000, 1);

          expect($interval.cancel(promise1)).toBe(false);
          expect($interval.cancel(promise2)).toBe(true);
        }));


    test('should not throw an error when given an undefined promise', angular.mock.inject(function($interval) {
      expect($interval.cancel()).toBe(false);
    }));


    test('should throw an error when given a non-$interval promise', angular.mock.inject(function($interval) {
      var promise = $interval(angular.noop).then(angular.noop);
      expect(function() { $interval.cancel(promise); }).toThrowMinErr('$interval', 'badprom');
    }));


    test('should not trigger digest when cancelled', angular.mock.inject(function($interval, $rootScope, $browser) {
      var watchSpy = jest.fn().mockName('watchSpy');
      $rootScope.$watch(watchSpy);

      var t = $interval();
      $interval.cancel(t);
      expect(function() {$browser.defer.flush();}).toThrow('No deferred tasks to be flushed');
      expect(watchSpy).not.toHaveBeenCalled();
    }));
  });

  describe('$window delegation', () => {
    test('should use $window.setInterval instead of the global function', angular.mock.inject(function($interval, $window) {
      var setIntervalSpy = jest.spyOn($window, 'setInterval').mockImplementation(() => {});

      $interval(angular.noop, 1000);
      expect(setIntervalSpy).toHaveBeenCalled();
    }));

    test('should use $window.clearInterval instead of the global function', angular.mock.inject(function($interval, $window) {
      var clearIntervalSpy = jest.spyOn($window, 'clearInterval').mockImplementation(() => {});

      $interval(angular.noop, 1000, 1);
      $window.flush(1000);
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockClear();
      $interval.cancel($interval(angular.noop, 1000));
      expect(clearIntervalSpy).toHaveBeenCalled();
    }));
  });
});
