'use strict';
 describe('ngAnimate $$animateCssDriver', () => {

  beforeEach(angular.mock.module('ngAnimate'));
  beforeEach(angular.mock.module('ngAnimateMock'));

  function int(x) {
    return parseInt(x, 10);
  }

  function hasAll(array, vals) {
    for (var i = 0; i < vals.length; i++) {
      if (!array.includes(vals[i])) return false;
    }
    return true;
  }

  test('should return a noop driver handler if the browser does not support CSS transitions and keyframes', () => {
    angular.mock.module(function($provide) {
      $provide.value('$sniffer', {});
    });
    angular.mock.inject(function($$animateCssDriver) {
      expect($$animateCssDriver).toBe(angular.noop);
    });
  });

  describe('when active', () => {
    var element;
    var ss;
     afterEach(() => {
      dealoc(element);
      if (ss) {
        ss.destroy();
      }
    });

    var capturedAnimation;
    var captureLog;
    var driver;
    var captureFn;
    beforeEach(angular.mock.module(function($provide) {
      capturedAnimation = null;
      captureLog = [];
      captureFn = angular.noop;

      $provide.factory('$animateCss', function($$AnimateRunner) {
        return function() {
          var runner = new $$AnimateRunner();

          capturedAnimation = arguments;
          captureFn(...arguments);
          captureLog.push({
            element: arguments[0],
            args: arguments,
            runner: runner
          });

          return {
            $$willAnimate: true,
            start() {
              return runner;
            }
          };
        };
      });

      element = angular.element('<div></div>');

      return function($$animateCssDriver, $document) {
        driver = function(details, cb) {
          return $$animateCssDriver(details, cb || angular.noop);
        };
        ss = createMockStyleSheet($document);
      };
    }));

    test('should register the $$animateCssDriver into the list of drivers found in $animateProvider',
      angular.mock.module(function($animateProvider) {

      expect($animateProvider.drivers).toContain('$$animateCssDriver');
    }));

    test('should register the $$animateCssDriver into the list of drivers found in $animateProvider',
      angular.mock.module(function($animateProvider) {

      expect($animateProvider.drivers).toContain('$$animateCssDriver');
    }));

    describe('regular animations', () => {
      test('should render an animation on the given element', angular.mock.inject(function() {
        driver({ element: element });
        expect(capturedAnimation[0]).toBe(element);
      }));

      test('should return an object with a start function', angular.mock.inject(function() {
        var runner = driver({ element: element });
        expect(angular.isFunction(runner.start)).toBeTruthy();
      }));

      test('should not signal $animateCss to apply the classes early when animation is structural', angular.mock.inject(function() {
        driver({ element: element });
        expect(capturedAnimation[1].applyClassesEarly).toBeFalsy();

        driver({ element: element, structural: true });
        expect(capturedAnimation[1].applyClassesEarly).toBeTruthy();
      }));

      test('should only set the event value if the animation is structural', angular.mock.inject(function() {
        driver({ element: element, structural: true, event: 'superman' });
        expect(capturedAnimation[1].event).toBe('superman');

        driver({ element: element, event: 'batman' });
        expect(capturedAnimation[1].event).toBeFalsy();
      }));
    });

    describe('anchored animations', () => {
      var from;
      var to;
      var fromAnimation;
      var toAnimation;

      beforeEach(angular.mock.module(function() {
        return function($rootElement, $document) {
          from = element;
          to = angular.element('<div></div>');
          fromAnimation = { element: from, event: 'enter' };
          toAnimation = { element: to, event: 'leave' };
          $rootElement.append(from);
          $rootElement.append(to);

          var doc = $document[0];

          // there is one test in here that expects the rootElement
          // to supersede the body node
          if (!$rootElement[0].contains(doc.body)) {
            // we need to do this so that style detection works
            angular.element(doc.body).append($rootElement);
          }
        };
      }));

      test('should not return anything if no animation is detected', () => {
        angular.mock.module(function($provide) {
          $provide.value('$animateCss', function() {
            return { $$willAnimate: false };
          });
        });
        angular.mock.inject(function() {
          var runner = driver({
            from: fromAnimation,
            to: toAnimation
          });
          expect(runner).toBeFalsy();
        });
      });

      test('should return a start method', angular.mock.inject(function() {
        var animator = driver({
          from: fromAnimation,
          to: toAnimation
        });
        expect(angular.isFunction(animator.start)).toBeTruthy();
      }));

      test.each(['end', 'cancel'].map((prop) => ({ prop })))(
          'should return a runner with a $prop() method which will end the animation', function({ prop: method }) {

        var closeAnimation;
        angular.mock.module(function($provide) {
          $provide.factory('$animateCss', function($q, $$AnimateRunner) {
            return function() {
              return {
                $$willAnimate: true,
                start() {
                  return new $$AnimateRunner({
                    end() {
                      closeAnimation();
                    }
                  });
                }
              };
            };
          });
        });

        angular.mock.inject(function() {
          var animator = driver({
            from: fromAnimation,
            to: toAnimation
          });

          var animationClosed = false;
          closeAnimation = function() {
            animationClosed = true;
          };

          var runner = animator.start();

          expect(angular.isFunction(runner[method])).toBe(true);
          runner[method]();
          expect(animationClosed).toBe(true);
        });
      });

      test('should end the animation for each of the from and to elements as well as all the anchors', () => {
        var closeLog = {};
        angular.mock.module(function($provide) {
          $provide.factory('$animateCss', function($q, $$AnimateRunner) {
            return function(element, options) {
              var type = options.event || 'anchor';
              closeLog[type] = closeLog[type] || [];
              return {
                $$willAnimate: true,
                start() {
                  return new $$AnimateRunner({
                    end() {
                      closeLog[type].push(element);
                    }
                  });
                }
              };
            };
          });
        });

        angular.mock.inject(function() {
          //we'll just use one animation to make the test smaller
          var anchorAnimation = {
            'in': angular.element('<div></div>'),
            'out': angular.element('<div></div>')
          };

          fromAnimation.structural = true;
          fromAnimation.element.append(anchorAnimation['out']);
          toAnimation.structural = true;
          toAnimation.element.append(anchorAnimation['in']);

          var animator = driver({
            from: fromAnimation,
            to: toAnimation,
            anchors: [
              anchorAnimation,
              anchorAnimation,
              anchorAnimation
            ]
          });

          var runner = animator.start();
          runner.end();

          expect(closeLog.enter[0]).toEqual(fromAnimation.element);
          expect(closeLog.leave[0]).toEqual(toAnimation.element);
          expect(closeLog.anchor.length).toBe(3);
        });
      });

      test('should render an animation on both the from and to elements', angular.mock.inject(function() {
        captureFn = function(element, details) {
          element.addClass(details.event);
        };

        fromAnimation.structural = true;
        toAnimation.structural = true;

        var runner = driver({
          from: fromAnimation,
          to: toAnimation
        });

        expect(captureLog.length).toBe(2);
        expect(fromAnimation.element).toHaveClass('enter');
        expect(toAnimation.element).toHaveClass('leave');
      }));

      test('should start the animations on the from and to elements in parallel', () => {
        var animationLog = [];
        angular.mock.module(function($provide) {
          $provide.factory('$animateCss', function($$AnimateRunner) {
            return function(element, details) {
              return {
                $$willAnimate: true,
                start() {
                  animationLog.push([element, details.event]);
                  return new $$AnimateRunner();
                }
              };
            };
          });
        });
        angular.mock.inject(function() {
          fromAnimation.structural = true;
          toAnimation.structural = true;

          var runner = driver({
            from: fromAnimation,
            to: toAnimation
          });

          expect(animationLog.length).toBe(0);
          runner.start();
          expect(animationLog).toEqual([
            [fromAnimation.element, 'enter'],
            [toAnimation.element, 'leave']
          ]);
        });
      });

      test('should start an animation for each anchor', angular.mock.inject(function() {
        var o1 = angular.element('<div></div>');
        from.append(o1);
        var o2 = angular.element('<div></div>');
        from.append(o2);
        var o3 = angular.element('<div></div>');
        from.append(o3);

        var i1 = angular.element('<div></div>');
        to.append(i1);
        var i2 = angular.element('<div></div>');
        to.append(i2);
        var i3 = angular.element('<div></div>');
        to.append(i3);

        var anchors = [
          { 'out': o1, 'in': i1, classes: 'red' },
          { 'out': o2, 'in': i2, classes: 'blue' },
          { 'out': o2, 'in': i2, classes: 'green' }
        ];

        var runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: anchors
        });

        expect(captureLog.length).toBe(5);
      }));

      test('should create a clone of the starting element for each anchor animation', angular.mock.inject(function() {
        var o1 = angular.element('<div class="out1"></div>');
        from.append(o1);
        var o2 = angular.element('<div class="out2"></div>');
        from.append(o2);

        var i1 = angular.element('<div class="in1"></div>');
        to.append(i1);
        var i2 = angular.element('<div class="in2"></div>');
        to.append(i2);

        var anchors = [
          { 'out': o1, 'in': i1 },
          { 'out': o2, 'in': i2 }
        ];

        var runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: anchors
        });

        var a2 = captureLog.pop().element;
        var a1 = captureLog.pop().element;

        expect(a1).not.toEqual(o1);
        expect(a1.attr('class')).toMatch(/\bout1\b/);
        expect(a2).not.toEqual(o2);
        expect(a2.attr('class')).toMatch(/\bout2\b/);
      }));

      test('should create a clone of the starting element and place it at the end of the $rootElement container',
        angular.mock.inject(function($rootElement) {

        //stick some garbage into the rootElement
        $rootElement.append(angular.element('<div></div>'));
        $rootElement.append(angular.element('<div></div>'));
        $rootElement.append(angular.element('<div></div>'));

        var fromAnchor = angular.element('<div class="out"></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div class="in"></div>');
        to.append(toAnchor);

        var runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'in': fromAnchor,
            'out': toAnchor
          }]
        });

        var anchor = captureLog.pop().element;
        var anchorNode = anchor[0];
        var contents = $rootElement.contents();

        expect(contents.length).toBeGreaterThan(1);
        expect(contents[contents.length - 1]).toEqual(anchorNode);
      }));

      test('should first do an addClass(\'ng-anchor-out\') animation on the cloned anchor', angular.mock.inject(function($rootElement) {
        var fromAnchor = angular.element('<div></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        var runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        });

        var anchorDetails = captureLog.pop().args[1];
        expect(anchorDetails.addClass).toBe('ng-anchor-out');
        expect(anchorDetails.event).toBeFalsy();
      }));

      test('should then do an addClass(\'ng-anchor-in\') animation on the cloned anchor and remove the old class',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        var runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        captureLog.pop().runner.end();

        var anchorDetails = captureLog.pop().args[1];
        expect(anchorDetails.removeClass.trim()).toBe('ng-anchor-out');
        expect(anchorDetails.addClass.trim()).toBe('ng-anchor-in');
        expect(anchorDetails.event).toBeFalsy();
      }));

      test.each(['out', 'in'].map((prop) => ({ prop })))(
          'should only fire the ng-anchor-$prop animation if only a $prop animation is defined', function({ prop: direction }) {

        var expectedClass = 'ng-anchor-' + direction;
        var animationStarted;
        var runner;

        angular.mock.module(function($provide) {
          $provide.factory('$animateCss', function($$AnimateRunner) {
            return function(element, options) {
              var addClass = (options.addClass || '').trim();
              return {
                $$willAnimate: addClass === expectedClass,
                start() {
                  animationStarted = addClass;
                  runner = new $$AnimateRunner();
                  return runner;
                }
              };
            };
          });
        });

        angular.mock.inject(function($rootElement, $animate) {
          var fromAnchor = angular.element('<div></div>');
          from.append(fromAnchor);
          var toAnchor = angular.element('<div></div>');
          to.append(toAnchor);

          $rootElement.append(fromAnchor);
          $rootElement.append(toAnchor);

          var complete = false;

          driver({
            from: fromAnimation,
            to: toAnimation,
            anchors: [{
              'out': fromAnchor,
              'in': toAnchor
            }]
          }).start().done(function() {
            complete = true;
          });

          expect(animationStarted).toBe(expectedClass);
          runner.end();
          $animate.flush();
          expect(complete).toBe(true);
        });
      });


      test('should provide an explicit delay setting in the options provided to $animateCss for anchor animations',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        var runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        });

        expect(capturedAnimation[1].delay).toBeTruthy();
      }));

      test('should append a `px` value for all seeded animation styles', angular.mock.inject(function($rootElement) {
        ss.addRule('.starting-element', 'width:10px; height:20px; display:inline-block;');

        var fromAnchor = angular.element('<div class="starting-element"' +
                                    ' style="margin-top:30px; margin-left:40px;"></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        var runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        });

        var anchorAnimation = captureLog.pop();
        var anchorDetails = anchorAnimation.args[1];

        angular.forEach(anchorDetails.from, function(value) {
          expect(value.substr(value.length - 2)).toBe('px');
        });

        // the out animation goes first
        anchorAnimation.runner.end();

        anchorAnimation = captureLog.pop();
        anchorDetails = anchorAnimation.args[1];

        angular.forEach(anchorDetails.to, function(value) {
          expect(value.substr(value.length - 2)).toBe('px');
        });
      }));

      test('should then do an removeClass(\'out\') + addClass(\'in\') animation on the cloned anchor',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        // the out animation goes first
        captureLog.pop().runner.end();

        var anchorDetails = captureLog.pop().args[1];
        expect(anchorDetails.removeClass).toMatch(/\bout\b/);
        expect(anchorDetails.addClass).toMatch(/\bin\b/);
        expect(anchorDetails.event).toBeFalsy();
      }));

      test('should add the `ng-anchor` class to the cloned anchor element',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        var clonedAnchor = captureLog.pop().element;
        expect(clonedAnchor).toHaveClass('ng-anchor');
      }));

      test('should add and remove the `ng-animate-shim` class on the in anchor element during the animation',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        expect(fromAnchor).toHaveClass('ng-animate-shim');

        // the out animation goes first
        captureLog.pop().runner.end();
        captureLog.pop().runner.end();

        expect(fromAnchor).not.toHaveClass('ng-animate-shim');
      }));

      test('should add and remove the `ng-animate-shim` class on the out anchor element during the animation',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        expect(toAnchor).toHaveClass('ng-animate-shim');

        // the out animation goes first
        captureLog.pop().runner.end();

        expect(toAnchor).toHaveClass('ng-animate-shim');
        captureLog.pop().runner.end();

        expect(toAnchor).not.toHaveClass('ng-animate-shim');
      }));

      test('should create the cloned anchor with all of the classes from the from anchor element',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div class="yes no maybe"></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        var addedClasses = captureLog.pop().element.attr('class').split(' ');
        expect(hasAll(addedClasses, ['yes', 'no', 'maybe'])).toBe(true);
      }));

      test('should remove the classes of the starting anchor from the cloned anchor node during the in animation and also add the classes of the destination anchor within the same animation',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div class="yes no maybe"></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div class="why ok so-what"></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        // the out animation goes first
        captureLog.pop().runner.end();

        var anchorDetails = captureLog.pop().args[1];
        var removedClasses = anchorDetails.removeClass.split(' ');
        var addedClasses = anchorDetails.addClass.split(' ');

        expect(hasAll(removedClasses, ['yes', 'no', 'maybe'])).toBe(true);
        expect(hasAll(addedClasses, ['why', 'ok', 'so-what'])).toBe(true);
      }));

      test('should not attempt to add/remove any classes that contain a `ng-` prefix',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div class="ng-yes ng-no sure"></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div class="ng-bar ng-foo maybe"></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        // the out animation goes first
        captureLog.pop().runner.end();

        var inAnimation = captureLog.pop();
        var details = inAnimation.args[1];

        var addedClasses = details.addClass.split(' ');
        var removedClasses = details.removeClass.split(' ');

        expect(addedClasses).not.toContain('ng-foo');
        expect(addedClasses).not.toContain('ng-bar');

        expect(removedClasses).not.toContain('ng-yes');
        expect(removedClasses).not.toContain('ng-no');
      }));

      test('should not remove any shared CSS classes between the starting and destination anchor element during the in animation',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div class="blue green red"></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div class="blue brown red black"></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        // the out animation goes first
        captureLog.pop().runner.end();

        var inAnimation = captureLog.pop();
        var clonedAnchor = inAnimation.element;
        var details = inAnimation.args[1];

        var addedClasses = details.addClass.split(' ');
        var removedClasses = details.removeClass.split(' ');

        expect(hasAll(addedClasses, ['brown', 'black'])).toBe(true);
        expect(hasAll(removedClasses, ['green'])).toBe(true);

        expect(addedClasses).not.toContain('red');
        expect(addedClasses).not.toContain('blue');

        expect(removedClasses).not.toContain('brown');
        expect(removedClasses).not.toContain('black');

        expect(removedClasses).not.toContain('red');
        expect(removedClasses).not.toContain('blue');

        inAnimation.runner.end();

        expect(clonedAnchor).toHaveClass('red');
        expect(clonedAnchor).toHaveClass('blue');
      }));

      test('should remove the cloned anchor node from the DOM once the \'in\' animation is complete',
        angular.mock.inject(function($rootElement) {

        var fromAnchor = angular.element('<div class="blue green red"></div>');
        from.append(fromAnchor);
        var toAnchor = angular.element('<div class="blue brown red black"></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        // the out animation goes first
        var inAnimation = captureLog.pop();
        var clonedAnchor = inAnimation.element;
        expect(clonedAnchor.parent().length).toBe(1);
        inAnimation.runner.end();

        // now the in animation completes
        expect(clonedAnchor.parent().length).toBe(1);
        captureLog.pop().runner.end();

        expect(clonedAnchor.parent().length).toBe(0);
      }));

      test('should pass the provided domOperation into $animateCss to be run right after the element is animated if a leave animation is present',
        angular.mock.inject(function($rootElement) {

        toAnimation.structural = true;
        toAnimation.event = 'enter';
        toAnimation.options = {};

        fromAnimation.structural = true;
        fromAnimation.event = 'leave';
        fromAnimation.options = {};

        var leaveOp = function() { };
        fromAnimation.options.domOperation = leaveOp;

        driver({
          from: fromAnimation,
          to: toAnimation
        }).start();

        var leaveAnimation = captureLog.shift();
        var enterAnimation = captureLog.shift();

        expect(leaveAnimation.args[1].onDone).toBe(leaveOp);
        expect(enterAnimation.args[1].onDone).toBeUndefined();
      }));

      test('should fire the returned runner promise when the from, to and anchor animations are all complete',
        angular.mock.inject(function($rootElement, $rootScope, $animate) {

        ss.addRule('.ending-element', 'width:9999px; height:6666px; display:inline-block;');

        var fromAnchor = angular.element('<div></div>');
        from.append(fromAnchor);

        var toAnchor = angular.element('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        var completed = false;
        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start().then(function() {
          completed = true;
        });

        captureLog.pop().runner.end(); //from
        captureLog.pop().runner.end(); //to
        captureLog.pop().runner.end(); //anchor(out)
        captureLog.pop().runner.end(); //anchor(in)

        $animate.flush();
        $rootScope.$digest();

        expect(completed).toBe(true);
      }));

      test('should use <body> as the element container if the rootElement exists outside of the <body> tag', () => {
        angular.mock.module(function($provide) {
          $provide.factory('$rootElement', function($document) {
            return angular.element($document[0].querySelector('html'));
          });
        });
        angular.mock.inject(function($rootElement, $rootScope, $animate, $document) {
          ss.addRule('.ending-element', 'width:9999px; height:6666px; display:inline-block;');

          var fromAnchor = angular.element('<div></div>');
          from.append(fromAnchor);

          var toAnchor = angular.element('<div></div>');
          to.append(toAnchor);

          $rootElement.append(fromAnchor);
          $rootElement.append(toAnchor);

          var completed = false;
          driver({
            from: fromAnimation,
            to: toAnimation,
            anchors: [{
              'out': fromAnchor,
              'in': toAnchor
            }]
          }).start();

          var clone = captureLog[2].element[0];
          expect(clone.parentNode).toBe($document[0].body);
        });
      });
    });
  });
});
