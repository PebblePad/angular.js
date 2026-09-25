'use strict';
 describe('$$animation', () => {

  beforeEach(angular.mock.module('ngAnimate'));
  beforeEach(angular.mock.module('ngAnimateMock'));

  var element;
   afterEach(() => {
    dealoc(element);
  });

  beforeEach(angular.mock.module(function($$animationProvider) {
    $$animationProvider.drivers.length = 0;
  }));

  test('should not run an animation if there are no drivers',
    angular.mock.inject(function($$animation, $animate, $rootScope) {

    element = angular.element('<div></div>');
    var done = false;
    $$animation(element, 'someEvent').then(function() {
      done = true;
    });
    $animate.flush();
    $rootScope.$digest();
    expect(done).toBe(true);
  }));

  test('should not run an animation if no drivers return an animation step function', () => {
    angular.mock.module(function($$animationProvider, $provide) {
      $$animationProvider.drivers.push('matiasDriver');
      $provide.value('matiasDriver', function() {
        return false;
      });
    });
    angular.mock.inject(function($$animation, $animate, $rootScope) {
      element = angular.element('<div></div>');
      var parent = angular.element('<div></div>');
      parent.append(element);

      var done = false;
      $$animation(element, 'someEvent').then(function() {
        done = true;
      });
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();
      expect(done).toBe(true);
    });
  });

  describe('drivers', () => {
    test('should use the first driver that returns a step function', () => {
      var count = 0;
      var activeDriver;
      angular.mock.module(function($$animationProvider, $provide) {
        $$animationProvider.drivers.push('1');
        $$animationProvider.drivers.push('2');
        $$animationProvider.drivers.push('3');

        var runner;

        $provide.value('1', function() {
          count++;
        });

        $provide.value('2', function() {
          count++;
          return {
            start() {
              activeDriver = '2';
              return runner;
            }
          };
        });

        $provide.value('3', function() {
          count++;
        });

        return function($$AnimateRunner) {
          runner = new $$AnimateRunner();
        };
      });

      angular.mock.inject(function($$animation, $rootScope, $rootElement) {
        element = angular.element('<div></div>');
        $rootElement.append(element);

        $$animation(element, 'enter');
        $rootScope.$digest();

        expect(count).toBe(2);
        expect(activeDriver).toBe('2');
      });
    });

    describe('step function', () => {
      var capturedAnimation;
      beforeEach(angular.mock.module(function($$animationProvider, $provide) {
        element = angular.element('<div></div>');

        $$animationProvider.drivers.push('stepper');
        $provide.factory('stepper', function($$AnimateRunner) {
          return function() {
            capturedAnimation = arguments;
            return {
              start() {
                return new $$AnimateRunner();
              }
            };
          };
        });
      }));

      test('should obtain the element, event, the provided options and the domOperation',
        angular.mock.inject(function($$animation, $rootScope, $rootElement) {
        $rootElement.append(element);

        var options = {};
        options.foo = 'bar';
        options.domOperation = function() {
          domOperationCalled = true;
        };
        var domOperationCalled = false;
        $$animation(element, 'megaEvent', options);
        $rootScope.$digest();

        var details = capturedAnimation[0];
        expect(details.element).toBe(element);
        expect(details.event).toBe('megaEvent');
        expect(details.options.foo).toBe(options.foo);

        // the function is wrapped inside of $$animation, but it is still a function
        expect(domOperationCalled).toBe(false);
        details.options.domOperation();
        expect(domOperationCalled).toBe(true);
      }));

      test('should obtain the classes string which is a combination of className, addClass and removeClass',
        angular.mock.inject(function($$animation, $rootScope, $rootElement) {

        element.addClass('blue red');
        $rootElement.append(element);

        $$animation(element, 'enter', {
          addClass: 'green',
          removeClass: 'orange',
          tempClasses: 'pink'
        });

        $rootScope.$digest();

        var classes = capturedAnimation[0].classes;
        expect(classes).toBe('blue red green orange pink');
      }));
    });

    test('should traverse the drivers in reverse order', () => {
      var log = [];
      angular.mock.module(function($$animationProvider, $provide) {
        $$animationProvider.drivers.push('first');
        $$animationProvider.drivers.push('second');

        $provide.value('first', function() {
          log.push('first');
          return false;
        });

        $provide.value('second', function() {
          log.push('second');
          return false;
        });
      });

      angular.mock.inject(function($$animation, $rootScope, $rootElement) {
        element = angular.element('<div></div>');
        $rootElement.append(element);
        $$animation(element, 'enter');
        $rootScope.$digest();
        expect(log).toEqual(['second', 'first']);
      });
    });

    test.each(['resolve', 'reject'].map((prop) => ({ prop, proped: prop === 'resolve' ? 'resolved' : 'rejected' })))(
        'should $prop the animation call if the driver $proped the returned promise', function({ prop: event }) {

      angular.mock.module(function($$animationProvider, $provide) {
        $$animationProvider.drivers.push('resolvingAnimation');
        $provide.factory('resolvingAnimation', function($$AnimateRunner) {
          return function() {
            return {
              start() {
                return new $$AnimateRunner();
              }
            };
          };
        });
      });

      angular.mock.inject(function($$animation, $rootScope, $animate) {
        var status;
        var element = angular.element('<div></div>');
        var parent = angular.element('<div></div>');
        parent.append(element);

        var runner = $$animation(element, 'enter');
        runner.then(function() {
            status = 'resolve';
          }, function() {
            status = 'reject';
          });

        // the animation is started
        $rootScope.$digest();

        if (event === 'resolve') {
          runner.end();
        } else {
          runner.cancel();
        }

        // the resolve/rejection digest
        $animate.flush();
        $rootScope.$digest();

        expect(status).toBe(event);
      });
    });

    test.each(['cancel', 'end'].map((prop) => ({ prop })))(
        'should $prop the driver animation when runner.$prop() is called', function({ prop: method }) {

      var log = [];

      angular.mock.module(function($$animationProvider, $provide) {
        $$animationProvider.drivers.push('actualDriver');
        $provide.factory('actualDriver', function($$AnimateRunner) {
          return function() {
            return {
              start() {
                log.push('start');
                return new $$AnimateRunner({
                  end() {
                    log.push('end');
                  },
                  cancel() {
                    log.push('cancel');
                  }
                });
              }
            };
          };
        });
      });

      angular.mock.inject(function($$animation, $rootScope, $rootElement) {
        element = angular.element('<div></div>');
        $rootElement.append(element);

        var runner = $$animation(element, 'enter');
        $rootScope.$digest();

        runner[method]();
        expect(log).toEqual(['start', method]);
      });
    });
  });

  describe('when', () => {
    var captureLog;
    var runnerLog;
    var capturedAnimation;

    beforeEach(angular.mock.module(function($$animationProvider, $provide) {
      captureLog = [];
      runnerLog = [];
      capturedAnimation = null;

      $$animationProvider.drivers.push('interceptorDriver');
      $provide.factory('interceptorDriver', function($$AnimateRunner) {
        return function(details) {
          captureLog.push(capturedAnimation = details); //only one param is passed into the driver
          return {
            start() {
              return new $$AnimateRunner({
                end: runnerEvent('end'),
                cancel: runnerEvent('cancel')
              });
            }
          };
        };
      });

      function runnerEvent(token) {
        return function() {
          runnerLog.push(token);
        };
      }
    }));

    describe('singular', () => {
      beforeEach(angular.mock.module(function($provide) {
        element = angular.element('<div></div>');
        return function($rootElement) {
          $rootElement.append(element);
        };
      }));

      test('should space out multiple ancestorial class-based animations with a RAF in between',
        angular.mock.inject(function($rootScope, $$animation, $$rAF) {

        var parent = element;
        var wrapper = angular.element('<div></div>');
        parent.append(wrapper);

        var child = angular.element('<div></div>');
        wrapper.append(child);

        $$animation(parent, 'addClass', { addClass: 'blue' });
        $$animation(wrapper, 'addClass', { addClass: 'red' });
        $$animation(child, 'addClass', { addClass: 'green' });

        $rootScope.$digest();

        expect(captureLog.length).toBe(1);
        expect(capturedAnimation.options.addClass).toBe('blue');

        $$rAF.flush();
        expect(captureLog.length).toBe(2);
        expect(capturedAnimation.options.addClass).toBe('red');

        $$rAF.flush();
        expect(captureLog.length).toBe(3);
        expect(capturedAnimation.options.addClass).toBe('green');
      }));

      test('should properly cancel out pending animations that are spaced with a RAF request before the digest completes',
        angular.mock.inject(function($rootScope, $$animation, $$rAF) {

        var parent = element;
        var wrapper = angular.element('<div></div>');
        parent.append(wrapper);

        var child = angular.element('<div></div>');
        wrapper.append(child);

        var r1 = $$animation(parent, 'addClass', { addClass: 'blue' });
        var r2 = $$animation(wrapper, 'addClass', { addClass: 'red' });
        var r3 = $$animation(child, 'addClass', { addClass: 'green' });

        r2.end();

        $rootScope.$digest();

        expect(captureLog.length).toBe(1);
        expect(capturedAnimation.options.addClass).toBe('blue');

        $$rAF.flush();

        expect(captureLog.length).toBe(2);
        expect(capturedAnimation.options.addClass).toBe('green');
      }));

      test('should properly cancel out pending animations that are spaced with a RAF request after the digest completes',
        angular.mock.inject(function($rootScope, $$animation, $$rAF) {

        var parent = element;
        var wrapper = angular.element('<div></div>');
        parent.append(wrapper);

        var child = angular.element('<div></div>');
        wrapper.append(child);

        var r1 = $$animation(parent, 'addClass', { addClass: 'blue' });
        var r2 = $$animation(wrapper, 'addClass', { addClass: 'red' });
        var r3 = $$animation(child, 'addClass', { addClass: 'green' });

        $rootScope.$digest();

        r2.end();

        expect(captureLog.length).toBe(1);
        expect(capturedAnimation.options.addClass).toBe('blue');

        $$rAF.flush();
        expect(captureLog.length).toBe(1);

        $$rAF.flush();
        expect(captureLog.length).toBe(2);
        expect(capturedAnimation.options.addClass).toBe('green');
      }));

      test.each(['end', 'cancel', 'then'].map((prop) => ({ prop })))(
          'should return a runner that object that contains a $prop() function', function({ prop: method }) {
        angular.mock.inject(function($$animation) {
          var runner = $$animation(element, 'someEvent');
          expect(angular.isFunction(runner[method])).toBe(true);
        });
      });

      test.each(['end', 'cancel'].map((prop) => ({ prop })))(
          'should close the animation if runner.$prop() is called before the $postDigest phase kicks in', function({ prop: method }) {
        angular.mock.inject(function($$animation, $rootScope, $animate) {
          var status;
          var runner = $$animation(element, 'someEvent');
          runner.then(function() { status = 'end'; },
                      function() { status = 'cancel'; });

          runner[method]();
          $rootScope.$digest();
          expect(runnerLog).toEqual([]);

          $animate.flush();
          expect(status).toBe(method);
        });
      });

      test.each(['end', 'cancel'].map((prop) => ({ prop })))(
          'should update the runner methods to the ones provided by the driver when the animation starts', function({ prop: method }) {

        var spy = jest.fn();
        angular.mock.module(function($$animationProvider, $provide) {
          $$animationProvider.drivers.push('animalDriver');
          $provide.factory('animalDriver', function($$AnimateRunner) {
            return function() {
              return {
                start() {
                  var data = {};
                  data[method] = spy;
                  return new $$AnimateRunner(data);
                }
              };
            };
          });
        });
        angular.mock.inject(function($$animation, $rootScope, $rootElement) {
          var r1 = $$animation(element, 'someEvent');
          r1[method]();
          expect(spy).not.toHaveBeenCalled();
          $rootScope.$digest(); // this clears the digest which cleans up the mess

          var r2 = $$animation(element, 'otherEvent');
          $rootScope.$digest();
          r2[method]();
          expect(spy).toHaveBeenCalled();
        });
      });

      test('should not start the animation if the element is removed from the DOM before the postDigest kicks in',
        angular.mock.inject(function($$animation) {

        var runner = $$animation(element, 'someEvent');

        expect(capturedAnimation).toBeFalsy();
        element.remove();
        expect(capturedAnimation).toBeFalsy();
      }));

      test('should immediately end the animation if the element is removed from the DOM during the animation',
        angular.mock.inject(function($$animation, $animate, $rootScope) {

        var runner = $$animation(element, 'someEvent');
        $rootScope.$digest();

        expect(capturedAnimation).toBeTruthy();
        expect(runnerLog).toEqual([]);
        element.remove();
        expect(runnerLog).toEqual(['end']);
      }));

      test('should not end the animation when the leave animation removes the element from the DOM',
        angular.mock.inject(function($$animation, $animate, $rootScope) {

        var runner = $$animation(element, 'leave', {}, function() {
          element.remove();
        });

        $rootScope.$digest();

        expect(runnerLog).toEqual([]);
        capturedAnimation.options.domOperation(); //this removes the element
        element.remove();
        expect(runnerLog).toEqual([]);
      }));

      test('should remove the $destroy event listener when the animation is closed',
        angular.mock.inject(function($$animation, $rootScope) {

        var addListen = jest.spyOn(element, 'on');
        var removeListen = jest.spyOn(element, 'off');
        var runner = $$animation(element, 'someEvent');

        var args = addListen.mock.lastCall[0];
        expect(args).toBe('$destroy');

        runner.end();

        args = removeListen.mock.lastCall[0];
        expect(args).toBe('$destroy');
      }));

      test('should always sort parent-element animations to run in order of parent-to-child DOM structure',
        angular.mock.inject(function($$animation, $rootScope, $animate) {

        var child = angular.element('<div></div>');
        var grandchild = angular.element('<div></div>');

        element.append(child);
        child.append(grandchild);

        $$animation(grandchild, 'enter');
        $$animation(child, 'enter');
        $$animation(element, 'enter');

        expect(captureLog.length).toBe(0);

        $rootScope.$digest();

        $animate.flush();

        expect(captureLog[0].element).toBe(element);
        expect(captureLog[1].element).toBe(child);
        expect(captureLog[2].element).toBe(grandchild);
      }));


      test.each(['enter', 'leave', 'move'].map((prop) => ({ prop })))(
          'should only apply the ng-$prop-prepare class if there are a child animations', function({ prop: animationType }) {
        angular.mock.inject(function($$animation, $rootScope, $animate) {
          var expectedClassName = 'ng-' + animationType + '-prepare';

          $$animation(element, animationType);
          $rootScope.$digest();
          expect(element).not.toHaveClass(expectedClassName);

          var child = angular.element('<div></div>');
          element.append(child);

          $$animation(element, animationType);
          $$animation(child, animationType);
          $rootScope.$digest();

          expect(element).not.toHaveClass(expectedClassName);
          expect(child).toHaveClass(expectedClassName);
        });
      });


      test.each(['enter', 'leave', 'move'].map((prop) => ({ prop })))(
          'should remove the preparation class before the $prop-animation starts', function({ prop: animationType }) {
        angular.mock.inject(function($$animation, $rootScope, $$rAF) {
          var expectedClassName = 'ng-' + animationType + '-prepare';

          var child = angular.element('<div></div>');
          element.append(child);

          $$animation(element, animationType);
          $$animation(child, animationType);
          $rootScope.$digest();

          expect(element).not.toHaveClass(expectedClassName);
          expect(child).toHaveClass(expectedClassName);

          $$rAF.flush();

          expect(element).not.toHaveClass(expectedClassName);
          expect(child).not.toHaveClass(expectedClassName);
        });
      });
    });

    describe('grouped', () => {
      var fromElement;
      var toElement;
      var fromAnchors;
      var toAnchors;
      beforeEach(angular.mock.module(function($provide) {
        fromElement = angular.element('<div></div>');
        toElement = angular.element('<div></div>');
        fromAnchors = [
          angular.element('<div>1</div>'),
          angular.element('<div>2</div>'),
          angular.element('<div>3</div>')
        ];
        toAnchors = [
          angular.element('<div>a</div>'),
          angular.element('<div>b</div>'),
          angular.element('<div>c</div>')
        ];

        return function($rootElement) {
          $rootElement.append(fromElement);
          $rootElement.append(toElement);
          angular.forEach(fromAnchors, function(a) {
            fromElement.append(a);
          });
          angular.forEach(toAnchors, function(a) {
            toElement.append(a);
          });
        };
      }));

      afterEach(() => {
        dealoc(fromElement);
        dealoc(toElement);
      });

      test('should group animations together when they have shared anchors and a shared CSS class',
        angular.mock.inject(function($$animation, $rootScope) {

        fromElement.addClass('shared-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('shared-class');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', '1');
        toAnchors[0].attr('ng-animate-ref', '1');
        $rootScope.$digest();

        expect(captureLog.length).toBe(1);

        var fromAnimation = capturedAnimation.from;
        expect(fromAnimation.element).toEqual(fromElement);
        expect(fromAnimation.event).toBe('leave');

        var toAnimation = capturedAnimation.to;
        expect(toAnimation.element).toBe(toElement);
        expect(toAnimation.event).toBe('enter');

        var fromElm = fromAnchors[0];
        var toElm = toAnchors[0];

        var anchors = capturedAnimation.anchors[0];
        assertCompareNodes(fromElm, anchors['out']);
        assertCompareNodes(toElm, anchors['in']);
      }));

      test('should group animations together and properly match up multiple anchors based on their references',
        angular.mock.inject(function($$animation, $rootScope) {

        var attr = 'ng-animate-ref';

        fromAnchors[0].attr(attr, '1');
        fromAnchors[1].attr(attr, '2');
        fromAnchors[2].attr(attr, '3');

        toAnchors[0].attr(attr, '1');
        toAnchors[1].attr(attr, '3');
        toAnchors[2].attr(attr, '2');

        fromElement.addClass('shared-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('shared-class');
        $$animation(toElement, 'enter');

        $rootScope.$digest();

        var anchors = capturedAnimation.anchors;
        assertCompareNodes(fromAnchors[0], anchors[0]['out']);
        assertCompareNodes(toAnchors[0], anchors[0]['in']);

        assertCompareNodes(fromAnchors[1], anchors[1]['out']);
        assertCompareNodes(toAnchors[2], anchors[1]['in']);

        assertCompareNodes(fromAnchors[2], anchors[2]['out']);
        assertCompareNodes(toAnchors[1], anchors[2]['in']);
      }));

      test('should group animations together on the from and to elements if their both contain matching anchors',
        angular.mock.inject(function($$animation, $rootScope) {

        fromElement.addClass('shared-class');
        fromElement.attr('ng-animate-ref', '1');
        $$animation(fromElement, 'leave');

        toElement.addClass('shared-class');
        toElement.attr('ng-animate-ref', '1');
        $$animation(toElement, 'enter');

        $rootScope.$digest();

        var anchors = capturedAnimation.anchors[0];
        assertCompareNodes(fromElement, anchors['out']);
        assertCompareNodes(toElement, anchors['in']);
      }));

      test('should not group animations into an anchored animation if enter/leave events are NOT used',
        angular.mock.inject(function($$animation, $rootScope, $$rAF) {

        fromElement.addClass('shared-class');
        fromElement.attr('ng-animate-ref', '1');
        $$animation(fromElement, 'addClass', {
          addClass: 'red'
        });

        toElement.addClass('shared-class');
        toElement.attr('ng-animate-ref', '1');
        $$animation(toElement, 'removeClass', {
          removeClass: 'blue'
        });

        $rootScope.$digest();
        $$rAF.flush();
        expect(captureLog.length).toBe(2);
      }));

      test('should not group animations together if a matching pair of anchors is not detected',
        angular.mock.inject(function($$animation, $rootScope) {

        fromElement.addClass('shared-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('shared-class');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', '6');
        toAnchors[0].attr('ng-animate-ref', '3');
        $rootScope.$digest();

        expect(captureLog.length).toBe(2);
      }));

      test('should not group animations together if a matching CSS class is not detected',
        angular.mock.inject(function($$animation, $rootScope) {

        fromElement.addClass('even-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('odd-class');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', '9');
        toAnchors[0].attr('ng-animate-ref', '9');
        $rootScope.$digest();

        expect(captureLog.length).toBe(2);
      }));

      test('should expose the shared CSS class in the options provided to the driver',
        angular.mock.inject(function($$animation, $rootScope) {

        fromElement.addClass('fresh-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('fresh-class');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', '9');
        toAnchors[0].attr('ng-animate-ref', '9');
        $rootScope.$digest();

        expect(capturedAnimation.classes).toBe('fresh-class');
      }));

      test('should update the runner methods to the grouped runner methods handled by the driver',
        angular.mock.inject(function($$animation, $rootScope) {

        fromElement.addClass('group-1');
        var runner1 = $$animation(fromElement, 'leave');

        toElement.addClass('group-1');
        var runner2 = $$animation(toElement, 'enter');

        expect(runner1).not.toBe(runner2);

        fromAnchors[0].attr('ng-animate-ref', 'abc');
        toAnchors[0].attr('ng-animate-ref', 'abc');
        $rootScope.$digest();

        expect(runner1).not.toBe(runner2);
        expect(runner1.end).toBe(runner2.end);
        expect(runner1.cancel).toBe(runner2.cancel);
      }));

      test.each(['from', 'to'].map((prop) => ({ prop })))(
          'should end the animation if the $prop element is prematurely removed from the DOM during the animation', function({ prop: event }) {
        angular.mock.inject(function($$animation, $rootScope) {
          fromElement.addClass('group-1');
          $$animation(fromElement, 'leave');

          toElement.addClass('group-1');
          $$animation(toElement, 'enter');

          fromAnchors[0].attr('ng-animate-ref', 'abc');
          toAnchors[0].attr('ng-animate-ref', 'abc');
          $rootScope.$digest();

          expect(runnerLog).toEqual([]);

          (event === 'from' ? fromElement : toElement).remove();
          expect(runnerLog).toEqual(['end']);
        });
      });

      test('should not end the animation when the `from` animation calls its own leave dom operation',
        angular.mock.inject(function($$animation, $rootScope) {

        fromElement.addClass('group-1');
        var elementRemoved = false;
        $$animation(fromElement, 'leave', {
          domOperation() {
            elementRemoved = true;
            fromElement.remove();
          }
        });

        toElement.addClass('group-1');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', 'abc');
        toAnchors[0].attr('ng-animate-ref', 'abc');
        $rootScope.$digest();

        var leaveAnimation = capturedAnimation.from;
        expect(leaveAnimation.event).toBe('leave');

        // this removes the element and this code is run normally
        // by the driver when it is time for the element to be removed
        leaveAnimation.options.domOperation();

        expect(elementRemoved).toBe(true);
        expect(runnerLog).toEqual([]);
      }));

      test('should not end the animation if any of the anchor elements are removed from the DOM during the animation',
        angular.mock.inject(function($$animation, $rootScope) {

        fromElement.addClass('group-1');
        var elementRemoved = false;
        $$animation(fromElement, 'leave', {}, function() {
          elementRemoved = true;
          fromElement.remove();
        });

        toElement.addClass('group-1');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', 'abc');
        toAnchors[0].attr('ng-animate-ref', 'abc');
        $rootScope.$digest();

        fromAnchors[0].remove();
        toAnchors[0].remove();

        expect(runnerLog).toEqual([]);
      }));

      test('should prepare a parent-element animation to run first before the anchored animation',
        angular.mock.inject(function($$animation, $rootScope, $rootElement, $animate) {

        fromAnchors[0].attr('ng-animate-ref', 'shared');
        toAnchors[0].attr('ng-animate-ref', 'shared');

        var parent = angular.element('<div></div>');
        parent.append(fromElement);
        parent.append(toElement);
        $rootElement.append(parent);

        fromElement.addClass('group-1');
        toElement.addClass('group-1');

        // issued first
        $$animation(toElement, 'enter');
        $$animation(fromElement, 'leave');

        // issued second
        $$animation(parent, 'addClass', { addClass: 'red' });

        expect(captureLog.length).toBe(0);

        $rootScope.$digest();
        $animate.flush();

        expect(captureLog[0].element).toBe(parent);
        expect(captureLog[1].from.element).toBe(fromElement);
        expect(captureLog[1].to.element).toBe(toElement);
        dealoc(parent);
      }));
    });
  });

  describe('[options]', () => {
    var runner;
    var defered;
    var parent;
    var mockedDriverFn;
    var mockedPlayerFn;

    beforeEach(angular.mock.module(function($$animationProvider, $provide) {
      $$animationProvider.drivers.push('mockedTestDriver');
      $provide.factory('mockedTestDriver', function() {
        return mockedDriverFn;
      });

      element = angular.element('<div></div>');
      parent = angular.element('<div></div>');

      return function($$AnimateRunner, $rootElement, $document) {
        angular.element($document[0].body).append($rootElement);
        $rootElement.append(parent);

        mockedDriverFn = function(element, method, options, domOperation) {
          return {
            start() {
              runner = new $$AnimateRunner();
              return runner;
            }
          };
        };
      };
    }));

    test('should temporarily assign the provided CSS class for the duration of the animation',
      angular.mock.inject(function($rootScope, $$animation) {

      parent.append(element);

      $$animation(element, 'enter', {
        tempClasses: 'temporary fudge'
      });
      $rootScope.$digest();

      expect(element).toHaveClass('temporary');
      expect(element).toHaveClass('fudge');

      runner.end();
      $rootScope.$digest();

      expect(element).not.toHaveClass('temporary');
      expect(element).not.toHaveClass('fudge');
    }));

    test('should add and remove the ng-animate CSS class when the animation is active',
      angular.mock.inject(function($$animation, $rootScope) {

      parent.append(element);

      $$animation(element, 'enter');
      $rootScope.$digest();
      expect(element).toHaveClass('ng-animate');

      runner.end();
      $rootScope.$digest();

      expect(element).not.toHaveClass('ng-animate');
    }));


    test('should apply the `ng-animate` and temporary CSS classes before the driver is invoked', () => {
      var capturedElementClasses;

      parent.append(element);

      angular.mock.module(function($provide) {
        $provide.factory('mockedTestDriver', function() {
          return function(details) {
            capturedElementClasses = details.element.attr('class');
          };
        });
      });

      angular.mock.inject(function($$animation, $rootScope) {
        parent.append(element);

        $$animation(element, 'enter', {
          tempClasses: 'temp-class-name'
        });
        $rootScope.$digest();

        expect(capturedElementClasses).toMatch(/\bng-animate\b/);
        expect(capturedElementClasses).toMatch(/\btemp-class-name\b/);
      });
    });

    test('should perform the DOM operation at the end of the animation if the driver doesn\'t run it already',
      angular.mock.inject(function($$animation, $rootScope) {

      parent.append(element);

      var domOperationFired = false;
      $$animation(element, 'enter', {
        domOperation() {
          domOperationFired = true;
        }
      });

      $rootScope.$digest();

      expect(domOperationFired).toBeFalsy();
      runner.end();
      $rootScope.$digest();

      expect(domOperationFired).toBeTruthy();
    }));

    test('should still apply the `from` and `to` styling even if no driver was detected', () => {
      angular.mock.module(function($$animationProvider) {
        $$animationProvider.drivers.length = 0;
      });
      angular.mock.inject(function($$animation, $rootScope) {
        $$animation(element, 'event', {
          from: { background: 'red' },
          to: { background: 'blue' }
        });

        expect(element.css('background')).toContain('blue');
      });
    });

    test('should still apply the `from` and `to` styling even if the driver does not do the job', () => {
      angular.mock.module(function($$animationProvider, $provide) {
        $$animationProvider.drivers[0] = 'dumbDriver';
        $provide.factory('dumbDriver', function($q) {
          return function stepFn() {
            return $q.resolve(true);
          };
        });
      });
      angular.mock.inject(function($$animation, $rootScope, $animate) {
        element.addClass('four');
        parent.append(element);

        var completed = false;
        $$animation(element, 'event', {
          from: { height: '100px' },
          to: { height: '200px', 'font-size': '50px' }
        }).then(function() {
          completed = true;
        });

        $rootScope.$digest(); //runs the animation
        $rootScope.$digest(); //flushes the step code
        $animate.flush();
        $rootScope.$digest(); //the runner promise

        expect(completed).toBe(true);
        expect(element.css('height')).toContain('200px');
        expect(element.css('font-size')).toBe('50px');
      });
    });

    test('should still resolve the `addClass` and `removeClass` classes even if no driver was detected', () => {
      angular.mock.module(function($$animationProvider) {
        $$animationProvider.drivers.length = 0;
      });
      angular.mock.inject(function($$animation, $rootScope) {
        element.addClass('four');

        $$animation(element, 'event', {
          addClass: 'one two three',
          removeClass: 'four'
        });

        expect(element).toHaveClass('one');
        expect(element).toHaveClass('two');
        expect(element).toHaveClass('three');
        expect(element).not.toHaveClass('four');
      });
    });

    test('should still resolve the `addClass` and `removeClass` classes even if the driver does not do the job', () => {
      angular.mock.module(function($$animationProvider, $provide) {
        $$animationProvider.drivers[0] = 'dumbDriver';
        $provide.factory('dumbDriver', function($$AnimateRunner) {
          return function initFn() {
            return function stepFn() {
              return new $$AnimateRunner();
            };
          };
        });
      });
      angular.mock.inject(function($$animation, $rootScope, $animate) {
        parent.append(element);
        element.addClass('four');

        var completed = false;
        var runner = $$animation(element, 'event', {
          addClass: 'one two three',
          removeClass: 'four'
        });
        runner.then(function() {
          completed = true;
        });

        $rootScope.$digest(); //runs the animation
        $rootScope.$digest(); //flushes the step code

        runner.end();
        $animate.flush();
        $rootScope.$digest(); //the runner promise

        expect(completed).toBe(true);
        expect(element).toHaveClass('one');
        expect(element).toHaveClass('two');
        expect(element).toHaveClass('three');
        expect(element).not.toHaveClass('four');
      });
    });
  });
});
