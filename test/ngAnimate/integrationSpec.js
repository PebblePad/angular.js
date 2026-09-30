'use strict';
 describe('ngAnimate integration tests', () => {
  beforeEach(angular.mock.module('ngAnimate'));
  beforeEach(angular.mock.module('ngAnimateMock'));

  var element;
  var html;
  var ss;
  beforeEach(angular.mock.module(function() {
    return function($rootElement, $document, $animate) {
      $animate.enabled(true);

      ss = createMockStyleSheet($document);

      var body = angular.element($document[0].body);
      html = function(element) {
        body.append($rootElement);
        $rootElement.append(element);
      };
    };
  }));

   afterEach(() => {
    dealoc(element);
    ss.destroy();
  });


  test('should cancel a running and started removeClass animation when a follow-up addClass animation adds the same class',
     angular.mock.inject(function($animate, $rootScope, $$rAF, $document, $rootElement) {

     angular.element($document[0].body).append($rootElement);
     element = angular.element('<div></div>');
     $rootElement.append(element);

     element.addClass('active-class');

     var runner = $animate.removeClass(element, 'active-class');
     $rootScope.$digest();

     var doneHandler = jest.fn().mockName('addClass done');
     runner.done(doneHandler);

     $$rAF.flush(); // Trigger the actual animation

     expect(doneHandler).not.toHaveBeenCalled();

     $animate.addClass(element, 'active-class');
     $rootScope.$digest();

     // Cancelling the removeClass animation triggers the done callback
     expect(doneHandler).toHaveBeenCalled();
   }));

  test('should remove a class that is currently being added by a running animation when another class is added in before in the same digest',
    angular.mock.inject(function($animate, $rootScope, $$rAF, $document, $rootElement) {

    angular.element($document[0].body).append($rootElement);
    element = angular.element('<div></div>');
    $rootElement.append(element);

    var runner = $animate.addClass(element, 'red');

    $rootScope.$digest();

    $animate.addClass(element, 'blue');
    $animate.removeClass(element, 'red');
    $rootScope.$digest();

    $$rAF.flush();

    expect(element).not.toHaveClass('red');
    expect(element).toHaveClass('blue');
  }));


  test('should add a class that is currently being removed by a running animation when another class is removed before in the same digest',
    angular.mock.inject(function($animate, $rootScope, $$rAF, $document, $rootElement) {

    angular.element($document[0].body).append($rootElement);
    element = angular.element('<div></div>');
    $rootElement.append(element);
    element.addClass('red blue');

    var runner = $animate.removeClass(element, 'red');

    $rootScope.$digest();

    $animate.removeClass(element, 'blue');
    $animate.addClass(element, 'red');
    $rootScope.$digest();

    $$rAF.flush();

    expect(element).not.toHaveClass('blue');
    expect(element).toHaveClass('red');
  }));


  describe('CSS animations', () => {
    test.each(['enter', 'leave', 'move', 'addClass', 'removeClass', 'setClass'].map((prop) => ({ prop })))(
        'should render an $prop animation', function({ prop: event }) {

      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement) {
        element = compileForTest('<div class="animate-me"></div>')

        var className = 'klass';
        var addClass;
        var removeClass;
        var parent = angular.element('<div></div>');
        html(parent);

        var setupClass;
        var activeClass;
        var args;
        var classRuleSuffix = '';

        switch (event) {
          case 'enter':
          case 'move':
            setupClass = 'ng-' + event;
            activeClass = 'ng-' + event + '-active';
            args = [element, parent];
            break;

          case 'leave':
            parent.append(element);
            setupClass = 'ng-' + event;
            activeClass = 'ng-' + event + '-active';
            args = [element];
            break;

          case 'addClass':
            parent.append(element);
            classRuleSuffix = '.add';
            setupClass = className + '-add';
            activeClass = className + '-add-active';
            addClass = className;
            args = [element, className];
            break;

          case 'removeClass':
            parent.append(element);
            setupClass = className + '-remove';
            activeClass = className + '-remove-active';
            element.addClass(className);
            args = [element, className];
            break;

          case 'setClass':
            parent.append(element);
            addClass = className;
            removeClass = 'removing-class';
            setupClass = addClass + '-add ' + removeClass + '-remove';
            activeClass = addClass + '-add-active ' + removeClass + '-remove-active';
            element.addClass(removeClass);
            args = [element, addClass, removeClass];
            break;
        }

        ss.addRule('.animate-me', 'animation-duration:0.00001s;animation-iteration-count:1;transition-duration:2s;transition-delay:0s');

        var runner = $animate[event](...args);
        $rootScope.$apply();

        var animationCompleted = false;
        runner.then(function() {
          animationCompleted = true;
        });

        expect(element).toHaveClass(setupClass);
        $animate.flush();
        expect(element).toHaveClass(activeClass);

        browserTrigger(element, 'transitionend', { timeStamp: Date.now(), elapsedTime: 2 });
        $animate.flush();

        expect(element).not.toHaveClass(setupClass);
        expect(element).not.toHaveClass(activeClass);

        $rootScope.$digest();

        expect(animationCompleted).toBe(true);
      });
    });

    test('should not throw an error if the element is orphaned before the CSS animation starts',
      angular.mock.inject(function($rootScope, $rootElement, $animate) {

      ss.addRule('.animate-me', 'transition-duration:2s;');

      var parent = angular.element('<div></div>');
      html(parent);

      var element = angular.element('<div class="animate-me">DOING</div>');
      parent.append(element);

      $animate.addClass(parent, 'on');
      $animate.addClass(element, 'on');
      $rootScope.$digest();

      // this will run the first class-based animation
      $animate.flush();

      element.remove();

      expect(function() {
        $animate.flush();
      }).not.toThrow();

      dealoc(element);
      dealoc(parent);
    }));

    test('should include the added/removed classes in lieu of the enter animation',
      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement, $document) {

      // ss.addRule('.animate-me.ng-enter.on', 'transition-duration:2s;');
      ss.addRule('.animate-me.ng-enter.on', 'animation-duration:0.00001s;animation-iteration-count:1;transition-duration:2s;transition-delay:0s');

      element = angular.element('<div><div ng-if="exp" ng-class="{on:exp2}" class="animate-me"></div></div>');

      $rootElement.append(element);
      angular.element($document[0].body).append($rootElement);

      $compile(element)($rootScope);

      $rootScope.exp = true;
      $rootScope.$digest();
      $animate.flush();

      var child = element.find('div');

      expect(child).not.toHaveClass('on');
      expect(child).not.toHaveClass('ng-enter');

      $rootScope.exp = false;
      $rootScope.$digest();

      $rootScope.exp = true;
      $rootScope.exp2 = true;
      $rootScope.$digest();

      child = element.find('div');

      expect(child).toHaveClass('on');
      expect(child).toHaveClass('ng-enter');

      $animate.flush();

      expect(child).toHaveClass('ng-enter-active');

      browserTrigger(child, 'transitionend', { timeStamp: Date.now(), elapsedTime: 2 });
      $animate.flush();

      expect(child).not.toHaveClass('ng-enter-active');
      expect(child).not.toHaveClass('ng-enter');
      dealoc($rootElement)
    }));

    test('should animate ng-class and a structural animation in parallel on the same element',
      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement, $document) {

      ss.addRule('.animate-me.ng-enter', 'transition-duration:2s;');
      ss.addRule('.animate-me.expand', 'transition-duration:5s; font-size:200px;');

      element = angular.element('<div><div ng-if="exp" ng-class="{expand:exp2}" class="animate-me"></div></div>');

      $rootElement.append(element);
      angular.element($document[0].body).append($rootElement);

      $compile(element)($rootScope);

      $rootScope.exp = true;
      $rootScope.exp2 = true;
      $rootScope.$digest();

      var child = element.find('div');

      expect(child).toHaveClass('ng-enter');
      expect(child).toHaveClass('expand-add');
      expect(child).toHaveClass('expand');

      $animate.flush();

      expect(child).toHaveClass('ng-enter-active');
      expect(child).toHaveClass('expand-add-active');

      browserTrigger(child, 'transitionend', { timeStamp: Date.now(), elapsedTime: 2 });
      $animate.flush();

      expect(child).not.toHaveClass('ng-enter-active');
      expect(child).not.toHaveClass('ng-enter');
      expect(child).not.toHaveClass('expand-add-active');
      expect(child).not.toHaveClass('expand-add');
    }));

    test('should issue a RAF for each element animation on all DOM levels', () => {
      angular.mock.module('ngAnimateMock');
      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement, $document, $$rAF) {
        ss.addRule('.ng-enter', 'transition-duration:2s;');

        element = angular.element(
          '<div ng-class="{parent:exp}">' +
            '<div ng-class="{parent2:exp}">' +
               '<div ng-repeat="item in items" ng-class="{fade:exp}">' +
                  '{{ item }}' +
               '</div>' +
            '</div>' +
          '</div>'
        );

        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.$digest();

        var outer = element;
        var inner = element.find('div');

        $rootScope.exp = true;
        $rootScope.items = [1,2,3,4,5,6,7,8,9,10];

        $rootScope.$digest();
        expect(outer).not.toHaveClass('parent');
        expect(inner).not.toHaveClass('parent2');

        assertTotalRepeats(0);

        $$rAF.flush();
        expect(outer).toHaveClass('parent');

        assertTotalRepeats(0);

        $$rAF.flush();
        expect(inner).toHaveClass('parent2');

        assertTotalRepeats(10);

        function assertTotalRepeats(total) {
          expect(inner[0].querySelectorAll('div.ng-enter').length).toBe(total);
        }
      });
    });


    test('should add the preparation class for an enter animation before a parent class-based animation is applied', () => {
      angular.mock.module('ngAnimateMock');
      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement, $document) {
        element = angular.element(
          '<div ng-class="{parent:exp}">' +
            '<div ng-if="exp">' +
            '</div>' +
          '</div>'
        );

        ss.addRule('.ng-enter', 'transition-duration:2s;');
        ss.addRule('.parent-add', 'transition-duration:5s;');

        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.exp = true;
        $rootScope.$digest();

        var parent = element;
        var child = element.find('div');

        expect(parent).not.toHaveClass('parent');
        expect(parent).toHaveClass('parent-add');
        expect(child).not.toHaveClass('ng-enter');
        expect(child).toHaveClass('ng-enter-prepare');

        $animate.flush();
        expect(parent).toHaveClass('parent parent-add parent-add-active');
        expect(child).toHaveClass('ng-enter ng-enter-active');
        expect(child).not.toHaveClass('ng-enter-prepare');
      });
    });


    test('should avoid adding the ng-enter-prepare method to a parent structural animation that contains child animations', () => {
      angular.mock.module('ngAnimateMock');
      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement, $document, $$rAF) {
        element = angular.element(
          '<div ng-animate-children="true">' +
            '<div ng-if="parent" class="parent">' +
              '<div ng-if="child" class="child">' +
                '<div ng-class="{something:true}"></div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );

        ss.addRule('.ng-enter', 'transition-duration:2s;');

        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.parent = true;
        $rootScope.child = true;
        $rootScope.$digest();

        var parent = angular.element(element[0].querySelector('.parent'));
        var child = angular.element(element[0].querySelector('.child'));

        expect(parent).not.toHaveClass('ng-enter-prepare');
        expect(child).toHaveClass('ng-enter-prepare');

        $$rAF.flush();

        expect(parent).not.toHaveClass('ng-enter-prepare');
        expect(child).not.toHaveClass('ng-enter-prepare');
      });
    });

    test('should add the preparation class for an enter animation before a parent class-based animation is applied', () => {
      angular.mock.module('ngAnimateMock');
      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement, $document) {
        element = angular.element(
          '<div ng-class="{parent:exp}">' +
            '<div ng-if="exp">' +
            '</div>' +
          '</div>'
        );

        ss.addRule('.ng-enter', 'transition-duration:2s;');
        ss.addRule('.parent-add', 'transition-duration:5s;');

        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.exp = true;
        $rootScope.$digest();

        var parent = element;
        var child = element.find('div');

        expect(parent).not.toHaveClass('parent');
        expect(parent).toHaveClass('parent-add');
        expect(child).not.toHaveClass('ng-enter');
        expect(child).toHaveClass('ng-enter-prepare');

        $animate.flush();
        expect(parent).toHaveClass('parent parent-add parent-add-active');
        expect(child).toHaveClass('ng-enter ng-enter-active');
        expect(child).not.toHaveClass('ng-enter-prepare');
      });
    });


    test('should remove the prepare classes when different structural animations happen in the same digest', () => {
      angular.mock.module('ngAnimateMock');
      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement, $document, $$animateCache) {
        element = angular.element(
           // Class animation on parent element is neeeded so the child elements get the prepare class
          '<div id="outer" ng-class="{blue: cond}" ng-switch="cond">' +
            '<div id="default" ng-switch-default></div>' +
            '<div id="truthy" ng-switch-when="true"></div>' +
          '</div>'
        );

        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.cond = false;
        $rootScope.$digest();

        $rootScope.cond = true;
        $rootScope.$digest();

        var parent = element;
        var truthySwitch = angular.element(parent[0].querySelector('#truthy'));
        var defaultSwitch = angular.element(parent[0].querySelector('#default'));

        expect(parent).not.toHaveClass('blue');
        expect(parent).toHaveClass('blue-add');
        expect(truthySwitch).toHaveClass('ng-enter-prepare');
        expect(defaultSwitch).toHaveClass('ng-leave-prepare');

        $animate.flush();

        expect(parent).toHaveClass('blue');
        expect(parent).not.toHaveClass('blue-add');
        expect(truthySwitch).not.toHaveClass('ng-enter-prepare');
        expect(defaultSwitch).not.toHaveClass('ng-leave-prepare');
      });
    });

    test('should respect the element node for caching when animations with the same type happen in the same digest', () => {
      angular.mock.module('ngAnimateMock');
      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement, $document, $$animateCache) {
        ss.addRule('.animate.ng-enter', 'transition-duration:2s;');

        element = angular.element(
          '<div>' +
            '<div>' +
              '<div id="noanimate" ng-if="cond"></div>' +
            '</div>' +
            '<div>' +
              '<div id="animate" class="animate" ng-if="cond"></div>' +
            '</div>' +
          '</div>'
        );

        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.cond = true;
        $rootScope.$digest();

        var parent = element;
        var noanimate = angular.element(parent[0].querySelector('#noanimate'));
        var animate = angular.element(parent[0].querySelector('#animate'));

        expect(noanimate).not.toHaveClass('ng-enter');
        expect(animate).toHaveClass('ng-enter');

        $animate.closeAndFlush();

        expect(noanimate).not.toHaveClass('ng-enter');
        expect(animate).not.toHaveClass('ng-enter');
      });
    });


    test('should pack level elements into their own RAF flush', () => {
      angular.mock.module('ngAnimateMock');
      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement, $document) {
        ss.addRule('.inner', 'transition-duration:2s;');

        element = angular.element(
          '<div>' +
            '<div class="outer" ng-class="{on:exp}">' +
               '<div class="inner" ng-if="exp"></div>' +
            '</div>' +
            '<div class="outer" ng-class="{on:exp}">' +
               '<div class="inner" ng-if="exp"></div>' +
            '</div>' +
            '<div class="outer" ng-class="{on:exp}">' +
               '<div class="inner" ng-if="exp"></div>' +
            '</div>' +
            '<div class="outer" ng-class="{on:exp}"></div>' +
          '</div>'
        );

        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);
        $compile(element)($rootScope);
        $rootScope.$digest();

        assertGroupHasClass(query('outer'), 'on', true);
        expect(query('inner').length).toBe(0);

        $rootScope.exp = true;
        $rootScope.$digest();

        assertGroupHasClass(query('outer'), 'on', true);
        assertGroupHasClass(query('inner'), 'ng-enter', true);

        $animate.flush();

        assertGroupHasClass(query('outer'), 'on');
        assertGroupHasClass(query('inner'), 'ng-enter');

        function query(className) {
          return element[0].querySelectorAll('.' + className);
        }

        function assertGroupHasClass(elms, className, not) {
          for (var i = 0; i < elms.length; i++) {
            var assert = expect(angular.element(elms[i]));
            (not ? assert.not : assert).toHaveClass(className);
          }
        }
      });
    });

    test('should trigger callbacks at the start and end of an animation',
      angular.mock.inject(function($rootScope, $rootElement, $animate, $compile) {

      ss.addRule('.animate-me', 'transition-duration:2s;');

      var parent = angular.element('<div><div ng-if="exp" class="animate-me"></div></div>');
      var element1 = parent.find('div');
      html(parent);

      compileForTest(parent);
      $rootScope.$digest();

      var spy = jest.fn();
      $animate.on('enter', parent, spy);

      $rootScope.exp = true;
      $rootScope.$digest();

      element = parent.find('div');

      $animate.flush();

      expect(spy).toHaveBeenCalledTimes(1);

      browserTrigger(element, 'transitionend', { timeStamp: Date.now(), elapsedTime: 2 });
      $animate.flush();

      expect(spy).toHaveBeenCalledTimes(2);

      dealoc(element1);
      dealoc(element);
      dealoc(parent);
    }));


    test('should remove a class when the same class is currently being added by a joined class-based animation',
      angular.mock.inject(function($animate, $animateCss, $rootScope, $document, $rootElement, $$rAF) {

      ss.addRule('.hide', 'opacity: 0');
      ss.addRule('.hide-add, .hide-remove', 'transition-duration:1s;');

      angular.element($document[0].body).append($rootElement);
      element = angular.element('<div></div>');
      $rootElement.append(element);

      // These animations will be joined together
      $animate.addClass(element, 'red');
      $animate.addClass(element, 'hide');
      $rootScope.$digest();

      expect(element).toHaveClass('red-add');
      expect(element).toHaveClass('hide-add');

      // When a digest has passed, but no $rAF has been issued yet, .hide hasn't been added to
      // the element yet
      $animate.removeClass(element, 'hide');
      $rootScope.$digest();
      $$rAF.flush();

      expect(element).not.toHaveClass('hide-add hide-add-active');
      expect(element).toHaveClass('hide-remove hide-remove-active');

      //End the animation process
      browserTrigger(element, 'transitionend',
        { timeStamp: Date.now() + 1000, elapsedTime: 2 });
      $animate.flush();

      expect(element).not.toHaveClass('hide-add-active red-add-active');
      expect(element).toHaveClass('red');
      expect(element).not.toHaveClass('hide');
    }));

    test('should handle ng-if & ng-class with a class that is removed before its add animation has concluded', () => {
      angular.mock.inject(function($animate, $rootScope, $compile, $timeout, $$rAF) {

        ss.addRule('.animate-me', 'transition-duration:0.5s;');

        element = angular.element('<section><div ng-if="true" class="animate-me" ng-class="{' +
          'red: red,' +
          'blue: blue' +
          '}"></div></section>');

        html(element);
        $rootScope.blue = true;
        $rootScope.red = true;
        $compile(element)($rootScope);
        $rootScope.$digest();

        var child = element.find('div');

        // Trigger class removal before the add animation has been concluded
        $rootScope.blue = false;
        $animate.closeAndFlush();

        expect(child).toHaveClass('red');
        expect(child).not.toHaveClass('blue');
      });
    });

    test('should not apply ngAnimate CSS preparation classes when a css animation definition has duration = 0', () => {
      function fill(max) {
        var arr = [];
        for (var i = 0; i < max; i++) {
          arr.push(i);
        }
        return arr;
      }

      angular.mock.inject(function($animate, $rootScope, $compile, $timeout, $$rAF, $$jqLite) {
        ss.addRule('.animate-me', 'transition-duration:0.5s;');

        var classAddSpy = jest.spyOn($$jqLite, 'addClass');
        var classRemoveSpy = jest.spyOn($$jqLite, 'removeClass');

        element = angular.element(
          '<div>' +
            '<div ng-repeat="item in items"></div>' +
          '</div> '
        );

        html(element);
        $compile(element)($rootScope);

        $rootScope.items = fill(100);
        $rootScope.$digest();

        expect(classAddSpy.mock.calls.length).toBe(2);
        expect(classRemoveSpy.mock.calls.length).toBe(2);

        expect(classAddSpy.mock.calls[0][1]).toBe('ng-animate');
        expect(classAddSpy.mock.calls[1][1]).toBe('ng-enter');
        expect(classRemoveSpy.mock.calls[0][1]).toBe('ng-enter');
        expect(classRemoveSpy.mock.calls[1][1]).toBe('ng-animate');

        expect(element.children().length).toBe(100);
        classAddSpy.mockRestore();
        classRemoveSpy.mockRestore();
      });
    });
  });

  describe('JS animations', () => {
    test.each(['enter', 'leave', 'move', 'addClass', 'removeClass', 'setClass'].map((prop) => ({ prop })))(
        'should render an $prop animation', function({ prop: event }) {

      var endAnimation;
      var animateCompleteCallbackFired = true;

      angular.mock.module(function($animateProvider) {
        $animateProvider.register('.animate-me', function() {
          var animateFactory = {};
          animateFactory[event] = function(element, addClass, removeClass, done) {
            endAnimation = arguments[arguments.length - 2]; // the done method is the 2nd last one
            return function(status) {
              animateCompleteCallbackFired = status === false;
            };
          };
          return animateFactory;
        });
      });

      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement) {
        element = angular.element('<div class="animate-me"></div>');
        $compile(element)($rootScope);

        var className = 'klass';
        var addClass;
        var removeClass;
        var parent = angular.element('<div></div>');
        html(parent);

        var args;
        switch (event) {
          case 'enter':
          case 'move':
            args = [element, parent];
            break;

          case 'leave':
            parent.append(element);
            args = [element];
            break;

          case 'addClass':
            parent.append(element);
            args = [element, className];
            break;

          case 'removeClass':
            parent.append(element);
            element.addClass(className);
            args = [element, className];
            break;

          case 'setClass':
            parent.append(element);
            addClass = className;
            removeClass = 'removing-class';
            element.addClass(removeClass);
            args = [element, addClass, removeClass];
            break;
        }

        var runner = $animate[event](...args);
        var animationCompleted = false;
        runner.then(function() {
          animationCompleted = true;
        });

        $rootScope.$digest();

        expect(angular.isFunction(endAnimation)).toBe(true);

        endAnimation();
        $animate.flush();
        expect(animateCompleteCallbackFired).toBe(true);

        $rootScope.$digest();
        expect(animationCompleted).toBe(true);
      });
    });

    test.each(['beforeAddClass', 'beforeRemoveClass', 'beforeSetClass'].map((prop) => ({ prop })))(
        'should not wait for a parent\'s classes to resolve if a $prop is animation used for children', function({ prop: phase }) {

      var capturedChildClasses;
      var endParentAnimationFn;

      angular.mock.module(function($animateProvider) {
        $animateProvider.register('.parent-man', function() {
          var animateFactory = {};
          animateFactory[phase] = function(element, addClass, removeClass, done) {
            // this will wait until things are over
            endParentAnimationFn = done;
          };
          return animateFactory;
        });

        $animateProvider.register('.child-man', function() {
          return {
            enter(element, done) {
              capturedChildClasses = element.parent().attr('class');
              done();
            }
          };
        });
      });

      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement) {
        element = angular.element('<div class="parent-man"></div>');
        var child = angular.element('<div class="child-man"></div>');

        html(element);
        $compile(element)($rootScope);

        $animate.enter(child, element);
        switch (phase) {
          case 'beforeAddClass':
            $animate.addClass(element, 'cool');
            break;

          case 'beforeSetClass':
            $animate.setClass(element, 'cool');
            break;

          case 'beforeRemoveClass':
            element.addClass('cool');
            $animate.removeClass(element, 'cool');
            break;
        }

        $rootScope.$digest();
        $animate.flush();

        expect(endParentAnimationFn).toBeTruthy();

        // the spaces are used so that ` cool ` can be matched instead
        // of just a substring like `cool-add`.
        var safeClassMatchString = ' ' + capturedChildClasses + ' ';
        if (phase === 'beforeRemoveClass') {
          expect(safeClassMatchString).toContain(' cool ');
        } else {
          expect(safeClassMatchString).not.toContain(' cool ');
        }
      });
    });

    test.each(['addClass', 'removeClass', 'setClass'].map((prop) => ({ prop })))(
        'should have the parent\'s classes already applied in time for the children if $prop is used', function({ prop: phase }) {

      var capturedChildClasses;
      var endParentAnimationFn;

      angular.mock.module(function($animateProvider) {
        $animateProvider.register('.parent-man', function() {
          var animateFactory = {};
          animateFactory[phase] = function(element, addClass, removeClass, done) {
            // this will wait until things are over
            endParentAnimationFn = done;
          };
          return animateFactory;
        });

        $animateProvider.register('.child-man', function() {
          return {
            enter(element, done) {
              capturedChildClasses = element.parent().attr('class');
              done();
            }
          };
        });
      });

      angular.mock.inject(function($animate, $compile, $rootScope, $rootElement) {
        element = angular.element('<div class="parent-man"></div>');
        var child = angular.element('<div class="child-man"></div>');

        html(element);
        $compile(element)($rootScope);

        $animate.enter(child, element);
        switch (phase) {
          case 'addClass':
            $animate.addClass(element, 'cool');
            break;

          case 'setClass':
            $animate.setClass(element, 'cool');
            break;

          case 'removeClass':
            element.addClass('cool');
            $animate.removeClass(element, 'cool');
            break;
        }

        $rootScope.$digest();
        $animate.flush();

        expect(endParentAnimationFn).toBeTruthy();

        // the spaces are used so that ` cool ` can be matched instead
        // of just a substring like `cool-add`.
        var safeClassMatchString = ' ' + capturedChildClasses + ' ';
        if (phase === 'removeClass') {
          expect(safeClassMatchString).not.toContain(' cool ');
        } else {
          expect(safeClassMatchString).toContain(' cool ');
        }
      });
    });

    test('should not alter the provided options values in anyway throughout the animation', () => {
      var animationSpy = jest.fn();
      angular.mock.module(function($animateProvider) {
        $animateProvider.register('.this-animation', function() {
          return {
            enter(element, done) {
              animationSpy();
              done();
            }
          };
        });
      });

      angular.mock.inject(function($animate, $rootScope, $compile) {
        element = angular.element('<div class="parent-man"></div>');
        var child = angular.element('<div class="child-man one"></div>');

        var initialOptions = {
          from: { height: '50px' },
          to: { width: '100px' },
          addClass: 'one',
          removeClass: 'two',
          domOperation: undefined
        };

        var copiedOptions = angular.copy(initialOptions);
        expect(copiedOptions).toEqual(initialOptions);

        html(element);
        $compile(element)($rootScope);

        $animate.enter(child, element, null, copiedOptions);
        $rootScope.$digest();
        expect(copiedOptions).toEqual(initialOptions);

        $animate.flush();
        expect(copiedOptions).toEqual(initialOptions);

        expect(child).toHaveClass('one');
        expect(child).not.toHaveClass('two');

        expect(child.attr('style')).toContain('100px');
        expect(child.attr('style')).toContain('50px');
      });
    });


    test('should execute the enter animation on a <form> with ngIf that has an ' +
      '<input type="email" required>', function() {

      var animationSpy = jest.fn();

      angular.mock.module(function($animateProvider) {
        $animateProvider.register('.animate-me', function() {
          return {
            enter(element, done) {
              animationSpy();
              done();
            }
          };
        });
      });

      angular.mock.inject(function($animate, $rootScope, $compile) {

        element = angular.element(
          '<div>' +
            '<form class="animate-me" ng-if="show">' +
              '<input ng-model="myModel" type="email" required />' +
            '</form>' +
          '</div>');

        html(element);

        $compile(element)($rootScope);

        $rootScope.show = true;
        $rootScope.$digest();

        $animate.flush();
        expect(animationSpy).toHaveBeenCalled();
      });
    });
  });
});
