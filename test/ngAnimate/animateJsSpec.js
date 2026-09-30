'use strict';
 describe('ngAnimate $$animateJs', () => {
  var enterMoveEvents = ['enter', 'move'];
  beforeEach(angular.mock.module('ngAnimate'));
  beforeEach(angular.mock.module('ngAnimateMock'));

  function getDoneFunction(args) {
    for (var i = 1; i < args.length; i++) {
      var a = args[i];
      if (angular.isFunction(a)) return a;
    }
  }

  test('should return nothing if no animations are registered at all', angular.mock.inject(function($$animateJs) {
    var element = angular.element('<div></div>');
    expect($$animateJs(element, 'enter')).toBeFalsy();
  }));

  test('should return nothing if no matching animations classes are found', () => {
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.foo', function() {
        return { enter: angular.noop };
      });
    });
    angular.mock.inject(function($$animateJs) {
      var element = angular.element('<div class="bar"></div>');
      expect($$animateJs(element, 'enter')).toBeFalsy();
    });
  });

  test('should return nothing if a matching animation class is found, but not a matching event', () => {
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.foo', function() {
        return { enter: angular.noop };
      });
    });
    angular.mock.inject(function($$animateJs) {
      var element = angular.element('<div class="foo"></div>');
      expect($$animateJs(element, 'leave')).toBeFalsy();
    });
  });

  test('should return a truthy value if a matching animation class and event are found', () => {
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.foo', function() {
        return { enter: angular.noop };
      });
    });
    angular.mock.inject(function($$animateJs) {
      var element = angular.element('<div class="foo"></div>');
      expect($$animateJs(element, 'enter')).toBeTruthy();
    });
  });

  test('should strictly query for the animation based on the classes value if passed in', () => {
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.superman', function() {
        return { enter: angular.noop };
      });
      $animateProvider.register('.batman', function() {
        return { leave: angular.noop };
      });
    });
    angular.mock.inject(function($$animateJs) {
      var element = angular.element('<div class="batman"></div>');
      expect($$animateJs(element, 'enter', 'superman')).toBeTruthy();
      expect($$animateJs(element, 'leave', 'legoman batman')).toBeTruthy();
      expect($$animateJs(element, 'enter', 'legoman')).toBeFalsy();
      expect($$animateJs(element, 'leave', {})).toBeTruthy();
    });
  });

  test('should run multiple animations in parallel', () => {
    var doneCallbacks = [];
    function makeAnimation(event) {
      return function() {
        var data = {};
        data[event] = function(element, done) {
          doneCallbacks.push(done);
        };
        return data;
      };
    }
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.one', makeAnimation('enter'));
      $animateProvider.register('.two', makeAnimation('enter'));
      $animateProvider.register('.three', makeAnimation('enter'));
    });
    angular.mock.inject(function($$animateJs, $animate) {
      var element = angular.element('<div class="one two three"></div>');
      var animator = $$animateJs(element, 'enter');
      var complete = false;
      animator.start().done(function() {
        complete = true;
      });
      expect(doneCallbacks.length).toBe(3);
      angular.forEach(doneCallbacks, function(cb) {
        cb();
      });
      $animate.flush();
      expect(complete).toBe(true);
    });
  });

  test.each(['end', 'cancel'].map((prop) => ({ prop })))(
      'should $prop the animation when runner.$prop() is called', function({ prop: method }) {
    var ended = false;
    var status;
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.the-end', function() {
        return {
          enter() {
            return function(cancelled) {
              ended = true;
              status = cancelled ? 'cancel' : 'end';
            };
          }
        };
      });
    });
    angular.mock.inject(function($$animateJs) {
      var element = angular.element('<div class="the-end"></div>');
      var animator = $$animateJs(element, 'enter');
      var runner = animator.start();

      expect(angular.isFunction(runner[method])).toBe(true);

      expect(ended).toBeFalsy();
      runner[method]();
      expect(ended).toBeTruthy();
      expect(status).toBe(method);
    });
  });

  test.each(['end', 'cancel'].map((prop) => ({ prop })))(
      'should $prop all of the running the animations when runner.$prop() is called', function({ prop: method }) {

    var lookup = {};
    angular.mock.module(function($animateProvider) {
      angular.forEach(['one','two','three'], function(klass) {
        $animateProvider.register('.' + klass, function() {
          return {
            enter() {
              return function(cancelled) {
                lookup[klass] = cancelled ? 'cancel' : 'end';
              };
            }
          };
        });
      });
    });
    angular.mock.inject(function($$animateJs) {
      var element = angular.element('<div class="one two three"></div>');
      var animator = $$animateJs(element, 'enter');
      var runner = animator.start();

      runner[method]();
      expect(lookup.one).toBe(method);
      expect(lookup.two).toBe(method);
      expect(lookup.three).toBe(method);
    });
  });

  test.each(['end', 'cancel'].map((prop) => ({ prop })))(
      'should only run the $prop operation once', function({ prop: method }) {
    var ended = false;
    var count = 0;
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.the-end', function() {
        return {
          enter() {
            return function(cancelled) {
              ended = true;
              count++;
            };
          }
        };
      });
    });
    angular.mock.inject(function($$animateJs) {
      var element = angular.element('<div class="the-end"></div>');
      var animator = $$animateJs(element, 'enter');
      var runner = animator.start();

      expect(angular.isFunction(runner[method])).toBe(true);

      expect(ended).toBeFalsy();
      runner[method]();
      expect(ended).toBeTruthy();
      expect(count).toBe(1);

      runner[method]();
      expect(count).toBe(1);
    });
  });

  test('should always run the provided animation in atleast one RAF frame if defined', () => {
    var before;
    var after;
    var endCalled;
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.the-end', function() {
        return {
          beforeAddClass(element, className, done) {
            before = done;
          },
          addClass(element, className, done) {
            after = done;
          }
        };
      });
    });
    angular.mock.inject(function($$animateJs, $animate) {
      var element = angular.element('<div class="the-end"></div>');
      var animator = $$animateJs(element, 'addClass', {
        addClass: 'red'
      });

      var runner = animator.start();
      runner.done(function() {
        endCalled = true;
      });

      expect(before).toBeDefined();
      before();

      expect(after).toBeUndefined();
      $animate.flush();
      expect(after).toBeDefined();
      after();

      expect(endCalled).toBeUndefined();
      $animate.flush();
      expect(endCalled).toBe(true);
    });
  });

  test.each(['cancel', 'end'].map((prop) => ({ prop })))(
      'should still run the associated DOM event when the $prop function is run but no more animations', function({ prop: method }) {
    var log = [];
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.the-end', function() {
        return {
          beforeAddClass() {
            return function(cancelled) {
              var status = cancelled ? 'cancel' : 'end';
              log.push('before addClass ' + status);
            };
          },
          addClass() {
            return function(cancelled) {
              var status = cancelled ? 'cancel' : 'end';
              log.push('after addClass' + status);
            };
          }
        };
      });
    });
    angular.mock.inject(function($$animateJs, $animate) {
      var element = angular.element('<div class="the-end"></div>');
      var animator = $$animateJs(element, 'addClass', {
        domOperation() {
          log.push('dom addClass');
        }
      });
      var runner = animator.start();
      runner.done(function() {
        log.push('addClass complete');
      });
      runner[method]();

      $animate.flush();
      expect(log).toEqual(
        ['before addClass ' + method,
         'dom addClass',
         'addClass complete']);
    });
  });

  test('should resolve the promise when end() is called', () => {
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.the-end', function() {
        return { beforeAddClass: angular.noop };
      });
    });
    angular.mock.inject(function($$animateJs, $animate, $rootScope) {
      var element = angular.element('<div class="the-end"></div>');
      var animator = $$animateJs(element, 'addClass');
      var runner = animator.start();
      var done = false;
      var cancelled = false;
      runner.then(function() {
          done = true;
        }, function() {
          cancelled = true;
        });

      runner.end();
      $animate.flush();
      $rootScope.$digest();
      expect(done).toBe(true);
      expect(cancelled).toBe(false);
    });
  });

  test('should reject the promise when cancel() is called', () => {
    angular.mock.module(function($animateProvider) {
      $animateProvider.register('.the-end', function() {
        return { beforeAddClass: angular.noop };
      });
    });
    angular.mock.inject(function($$animateJs, $animate, $rootScope) {
      var element = angular.element('<div class="the-end"></div>');
      var animator = $$animateJs(element, 'addClass');
      var runner = animator.start();
      var done = false;
      var cancelled = false;
      runner.then(function() {
        done = true;
      }, function() {
        cancelled = true;
      });

      runner.cancel();
      $animate.flush();
      $rootScope.$digest();
      expect(done).toBe(false);
      expect(cancelled).toBe(true);
    });
  });

  describe('events', () => {
    var animations;
    var runAnimation;
    var element;
    var log;
    beforeEach(angular.mock.module(function($animateProvider) {
      element = angular.element('<div class="test-animation"></div>');
      animations = {};
      log = [];

      $animateProvider.register('.test-animation', function() {
        return animations;
      });

      return function($$animateJs) {
        runAnimation = function(method, done, error, options) {
          options = angular.extend(options || {}, {
            domOperation() {
              log.push('dom ' + method);
            }
          });

          var driver = $$animateJs(element, method, 'test-animation', options);
          driver.start().done(function(status) {
            ((status ? done : error) || angular.noop)();
          });
        };
      };
    }));

    test.each(['enter', 'move', 'leave'].map((prop) => ({ prop })))(
        '$prop should have the function signature of (element, done, options) for the after animation', function({ prop: event }) {
      angular.mock.inject(function() {
        var args;
        var animationOptions = {};
        animationOptions.foo = 'bar';
        animations[event] = function() {
          args = arguments;
        };
        runAnimation(event, angular.noop, angular.noop, animationOptions);

        expect(args.length).toBe(3);
        expect(args[0]).toBe(element);
        expect(angular.isFunction(args[1])).toBe(true);
        expect(args[2].foo).toBe(animationOptions.foo);
      });
    });

    test.each(['addClass', 'removeClass'].map((prop) => ({ prop })))(
        '$prop should have the function signature of (element, className, done, options) for the before animation', function({ prop: event }) {
      angular.mock.inject(function() {
        var beforeMethod = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
        var args;
        var className = 'matias';
        animations[beforeMethod] = function() {
          args = arguments;
        };

        var animationOptions = {};
        animationOptions.foo = 'bar';
        animationOptions[event] = className;
        runAnimation(event, angular.noop, angular.noop, animationOptions);

        expect(args.length).toBe(4);
        expect(args[0]).toBe(element);
        expect(args[1]).toBe(className);
        expect(angular.isFunction(args[2])).toBe(true);
        expect(args[3].foo).toBe(animationOptions.foo);
      });
    });

    test.each(['addClass', 'removeClass'].map((prop) => ({ prop })))(
        '$prop should have the function signature of (element, className, done, options) for the after animation', function({ prop: event }) {
      angular.mock.inject(function() {
        var args;
        var className = 'fatias';
        animations[event] = function() {
          args = arguments;
        };

        var animationOptions = {};
        animationOptions.foo = 'bar';
        animationOptions[event] = className;
        runAnimation(event, angular.noop, angular.noop, animationOptions);

        expect(args.length).toBe(4);
        expect(args[0]).toBe(element);
        expect(args[1]).toBe(className);
        expect(angular.isFunction(args[2])).toBe(true);
        expect(args[3].foo).toBe(animationOptions.foo);
      });
    });

    test.each(['before', 'after'].map((prop) => ({ prop })))(
        'setClass should have the function signature of (element, addClass, removeClass, done, options) for the $prop animation', function({ prop: event }) {
      angular.mock.inject(function() {
        var args;
        var method = event === 'before' ? 'beforeSetClass' : 'setClass';
        animations[method] = function() {
          args = arguments;
        };

        var addClass = 'on';
        var removeClass = 'on';
        var animationOptions = {
          foo: 'bar',
          addClass: addClass,
          removeClass: removeClass
        };
        runAnimation('setClass', angular.noop, angular.noop, animationOptions);

        expect(args.length).toBe(5);
        expect(args[0]).toBe(element);
        expect(args[1]).toBe(addClass);
        expect(args[2]).toBe(removeClass);
        expect(angular.isFunction(args[3])).toBe(true);
        expect(args[4].foo).toBe(animationOptions.foo);
      });
    });

    test.each(['before', 'after'].map((prop) => ({ prop })))(
        'animate should have the function signature of (element, from, to, done, options) for the $prop animation', function({ prop: event }) {
      angular.mock.inject(function() {
        var args;
        var method = event === 'before' ? 'beforeAnimate' : 'animate';
        animations[method] = function() {
          args = arguments;
        };

        var to = { color: 'red' };
        var from = { color: 'blue' };
        var animationOptions = {
          foo: 'bar',
          to: to,
          from: from
        };
        runAnimation('animate', angular.noop, angular.noop, animationOptions);

        expect(args.length).toBe(5);
        expect(args[0]).toBe(element);
        expect(args[1]).toBe(from);
        expect(args[2]).toBe(to);
        expect(angular.isFunction(args[3])).toBe(true);
        expect(args[4].foo).toBe(animationOptions.foo);
      });
    });

    test.each(['before', 'after'].map((prop) => ({ prop })))(
        'custom events should have the function signature of (element, done, options) for the $prop animation', function({ prop: event }) {
      angular.mock.inject(function() {
        var args;
        var method = event === 'before' ? 'beforeCustom' : 'custom';
        animations[method] = function() {
          args = arguments;
        };

        var animationOptions = {};
        animationOptions.foo = 'bar';
        runAnimation('custom', angular.noop, angular.noop, animationOptions);

        expect(args.length).toBe(3);
        expect(args[0]).toBe(element);
        expect(angular.isFunction(args[1])).toBe(true);
        expect(args[2].foo).toBe(animationOptions.foo);
      });
    });

    var otherEvents = ['addClass', 'removeClass', 'setClass'];
    var allEvents = ['leave'].concat(otherEvents).concat(enterMoveEvents);

    test.each(otherEvents.map((prop) => ({ prop })))(
        '$prop should asynchronously render the before$prop animation', function({ prop: event }) {
      angular.mock.inject(function($animate) {
        var beforeMethod = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
        animations[beforeMethod] = function(element, a, b, c) {
          log.push('before ' + event);
          var done = getDoneFunction(arguments);
          done();
        };

        runAnimation(event);
        expect(log).toEqual(['before ' + event]);
        $animate.flush();

        expect(log).toEqual(['before ' + event, 'dom ' + event]);
      });
    });

    test.each(allEvents.map((prop) => ({ prop })))(
        '$prop should asynchronously render the $prop animation', function({ prop: event }) {
      angular.mock.inject(function($animate) {
        animations[event] = function(element, a, b, c) {
          log.push('after ' + event);
          var done = getDoneFunction(arguments);
          done();
        };

        runAnimation(event, function() {
          log.push('complete');
        });

        if (event === 'leave') {
          expect(log).toEqual(['after leave']);
          $animate.flush();
          expect(log).toEqual(['after leave', 'dom leave', 'complete']);
        } else {
          expect(log).toEqual(['dom ' + event, 'after ' + event]);
          $animate.flush();
          expect(log).toEqual(['dom ' + event, 'after ' + event, 'complete']);
        }
      });
    });

    test.each(allEvents.map((prop) => ({ prop })))(
        '$prop should asynchronously render the $prop animation when a start/end animator object is returned', function({ prop: event }) {

      angular.mock.inject(function($animate, $$AnimateRunner) {
        var runner;
        animations[event] = function(element, a, b, c) {
          return {
            start() {
              log.push('start ' + event);
              runner = new $$AnimateRunner();
              return runner;
            }
          };
        };

        runAnimation(event, function() {
          log.push('complete');
        });

        if (event === 'leave') {
          expect(log).toEqual(['start leave']);
          runner.end();
          $animate.flush();
          expect(log).toEqual(['start leave', 'dom leave', 'complete']);
        } else {
          expect(log).toEqual(['dom ' + event, 'start ' + event]);
          runner.end();
          $animate.flush();
          expect(log).toEqual(['dom ' + event, 'start ' + event, 'complete']);
        }
      });
    });

    test.each(allEvents.map((prop) => ({ prop })))(
        '$prop should asynchronously render the $prop animation when an instance of $$AnimateRunner is returned', function({ prop: event }) {

      angular.mock.inject(function($animate, $$AnimateRunner) {
        var runner;
        animations[event] = function(element, a, b, c) {
          log.push('start ' + event);
          runner = new $$AnimateRunner();
          return runner;
        };

        runAnimation(event, function() {
          log.push('complete');
        });

        if (event === 'leave') {
          expect(log).toEqual(['start leave']);
          runner.end();
          $animate.flush();
          expect(log).toEqual(['start leave', 'dom leave', 'complete']);
        } else {
          expect(log).toEqual(['dom ' + event, 'start ' + event]);
          runner.end();
          $animate.flush();
          expect(log).toEqual(['dom ' + event, 'start ' + event, 'complete']);
        }
      });
    });

    test.each(otherEvents.map((prop) => ({ prop })))(
        '$prop should asynchronously reject the before animation if the callback function is called with false', function({ prop: event }) {
      angular.mock.inject(function($animate, $rootScope) {
        var beforeMethod = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
        animations[beforeMethod] = function(element, a, b, c) {
          log.push('before ' + event);
          var done = getDoneFunction(arguments);
          done(false);
        };

        animations[event] = function(element, a, b, c) {
          log.push('after ' + event);
          var done = getDoneFunction(arguments);
          done();
        };

        runAnimation(event,
          function() { log.push('pass'); },
          function() { log.push('fail'); });

        expect(log).toEqual(['before ' + event]);
        $animate.flush();
        expect(log).toEqual(['before ' + event, 'dom ' + event, 'fail']);
      });
    });

    test.each(allEvents.map((prop) => ({ prop })))(
        '$prop should asynchronously reject the after animation if the callback function is called with false', function({ prop: event }) {
      angular.mock.inject(function($animate, $rootScope) {
        animations[event] = function(element, a, b, c) {
          log.push('after ' + event);
          var done = getDoneFunction(arguments);
          done(false);
        };

        runAnimation(event,
          function() { log.push('pass'); },
          function() { log.push('fail'); });

        var expectations = [];
        if (event === 'leave') {
          expect(log).toEqual(['after leave']);
          $animate.flush();
          expect(log).toEqual(['after leave', 'dom leave', 'fail']);
        } else {
          expect(log).toEqual(['dom ' + event, 'after ' + event]);
          $animate.flush();
          expect(log).toEqual(['dom ' + event, 'after ' + event, 'fail']);
        }
      });
    });

    test('setClass should delegate down to addClass/removeClass if not defined', angular.mock.inject(function($animate) {
      animations.addClass = function(element, done) {
        log.push('addClass');
      };

      animations.removeClass = function(element, done) {
        log.push('removeClass');
      };

      expect(animations.setClass).toBeFalsy();

      runAnimation('setClass');

      expect(log).toEqual(['dom setClass', 'removeClass', 'addClass']);
    }));

    test('beforeSetClass should delegate down to beforeAddClass/beforeRemoveClass if not defined',
      angular.mock.inject(function($animate) {

      animations.beforeAddClass = function(element, className, done) {
        log.push('beforeAddClass');
        done();
      };

      animations.beforeRemoveClass = function(element, className, done) {
        log.push('beforeRemoveClass');
        done();
      };

      expect(animations.setClass).toBeFalsy();

      runAnimation('setClass');
      $animate.flush();

      expect(log).toEqual(['beforeRemoveClass', 'beforeAddClass', 'dom setClass']);
    }));

    test('leave should always ignore the `beforeLeave` animation',
      angular.mock.inject(function($animate) {

      animations.beforeLeave = function(element, done) {
        log.push('beforeLeave');
        done();
      };

      animations.leave = function(element, done) {
        log.push('leave');
        done();
      };

      runAnimation('leave');
      $animate.flush();

      expect(log).toEqual(['leave', 'dom leave']);
    }));

    test('should allow custom events to be triggered',
      angular.mock.inject(function($animate) {

      animations.beforeFlex = function(element, done) {
        log.push('beforeFlex');
        done();
      };

      animations.flex = function(element, done) {
        log.push('flex');
        done();
      };

      runAnimation('flex');
      $animate.flush();

      expect(log).toEqual(['beforeFlex', 'dom flex', 'flex']);
    }));
  });
});
