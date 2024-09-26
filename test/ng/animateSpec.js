'use strict';

describe('$animate', function() {

  describe('without animation', function() {
    // var element, $rootElement;
    //
    // beforeEach(angular.mock.inject(function(_$rootElement_) {
    //     element = compileForTest('<div></div>');
    //     $rootElement = _$rootElement_;
    // }));
    //
    it('should add element at the start of enter animation', angular.mock.inject(function($animate) {
      var element = compileForTest('<div></div>');
      var child = compileForTest('<div></div>');
      expect(element.contents().length).toBe(0);
      $animate.enter(child, element);
      expect(element.contents().length).toBe(1);
    }));

    it('should enter the element to the start of the parent container',
      angular.mock.inject(function($animate, $compile, $rootScope) {
        var element = compileForTest('<div></div>');
      for (var i = 0; i < 5; i++) {
        element.append(angular.element('<div> ' + i + '</div>'));
      }

      var child = angular.element('<div>first</div>');
      $animate.enter(child, element);

      expect(element.text()).toEqual('first 0 1 2 3 4');
    }));

    it('should remove the element at the end of leave animation', angular.mock.inject(function($animate) {
      var element = compileForTest('<div></div>');
      var child = compileForTest('<div></div>');
      element.append(child);
      expect(element.contents().length).toBe(1);
      $animate.leave(child);
      expect(element.contents().length).toBe(0);
    }));

    it('should reorder the move animation', angular.mock.inject(function($animate) {
      var element = compileForTest('<div></div>');
      var child1 = compileForTest('<div>1</div>');
      var child2 = compileForTest('<div>2</div>');
      element.append(child1);
      element.append(child2);
      expect(element.text()).toBe('12');
      $animate.move(child1, element, child2);
      expect(element.text()).toBe('21');
    }));

    it('should apply styles instantly to the element',
      angular.mock.inject(function($animate, $compile, $rootScope) {
        var element = compileForTest('<div></div>');

      $animate.animate(element, { color: 'rgb(0, 0, 0)' });
      expect(element.css('color')).toBe('rgb(0, 0, 0)');

      $animate.animate(element, { color: 'rgb(255, 0, 0)' }, { color: 'rgb(0, 255, 0)' });
      expect(element.css('color')).toBe('rgb(0, 255, 0)');
    }));

    it('should still perform DOM operations even if animations are disabled (post-digest)', angular.mock.inject(function($animate, $rootScope) {
      var element = compileForTest('<div></div>');
      $animate.enabled(false);
      expect(element).toBeShown();
      $animate.addClass(element, 'ng-hide');
      $rootScope.$digest();
      expect(element).toBeHidden();
    }));

    it('should run each method and return a promise', angular.mock.inject(function($animate, $document) {
      var element = angular.element('<div></div>');
      var move   = angular.element('<div></div>');
      var parent = angular.element($document[0].body);
      parent.append(move);

      expect($animate.enter(element, parent)).toBeAPromise();
      expect($animate.move(element, move)).toBeAPromise();
      expect($animate.addClass(element, 'on')).toBeAPromise();
      expect($animate.removeClass(element, 'off')).toBeAPromise();
      expect($animate.setClass(element, 'on', 'off')).toBeAPromise();
      expect($animate.leave(element)).toBeAPromise();
    }));

    it('should provide the `enabled` and `cancel` methods', angular.mock.inject(function($animate) {
      expect($animate.enabled()).toBeUndefined();
      expect($animate.cancel({})).toBeUndefined();
    }));

    it('should provide the `on` and `off` methods', angular.mock.inject(function($animate) {
      expect(angular.isFunction($animate.on)).toBe(true);
      expect(angular.isFunction($animate.off)).toBe(true);
    }));

    it('should add and remove classes on SVG elements', angular.mock.inject(function($animate, $rootScope) {
      if (!window.SVGElement) return;
      var svg = angular.element('<svg><rect></rect></svg>');
      var rect = svg.children();
      $animate.enabled(false);
      expect(rect).toBeShown();
      $animate.addClass(rect, 'ng-hide');
      $rootScope.$digest();
      expect(rect).toBeHidden();
      $animate.removeClass(rect, 'ng-hide');
      $rootScope.$digest();
      expect(rect).not.toBeHidden();
    }));

    it('should throw error on wrong selector', function() {
      angular.mock.module(function($animateProvider) {
        expect(function() {
          $animateProvider.register('abc', null);
        }).toThrowMinErr('$animate', 'notcsel', 'Expecting class selector starting with \'.\' got \'abc\'.');
      });
      angular.mock.inject();
    });

    it('should register the animation and be available for lookup', function() {
      var provider;
      angular.mock.module(function($animateProvider) {
        provider = $animateProvider;
      });
      angular.mock.inject(function() {
        // by using hasOwnProperty we know for sure that the lookup object is an empty object
        // instead of inheriting properties from its original prototype.
        expect(provider.$$registeredAnimations.hasOwnProperty).toBeFalsy();

        provider.register('.filter', angular.noop);
        expect(provider.$$registeredAnimations['filter']).toBe('.filter-animation');
      });
    });

    it('should apply and retain inline styles on the element that is animated', angular.mock.inject(function($animate, $rootScope) {
      var element = angular.element('<div></div>');
      var parent = angular.element('<div></div>');
      var other = angular.element('<div></div>');
      parent.append(other);
      $animate.enabled(true);

      $animate.enter(element, parent, null, {
        to: { color: 'red' }
      });
      assertColor('red');

      $animate.move(element, null, other, {
        to: { color: 'yellow' }
      });
      assertColor('yellow');

      $animate.addClass(element, 'on', {
        to: { color: 'green' }
      });
      $rootScope.$digest();
      assertColor('green');

      $animate.setClass(element, 'off', 'on', {
        to: { color: 'black' }
      });
      $rootScope.$digest();
      assertColor('black');

      $animate.removeClass(element, 'off', {
        to: { color: 'blue' }
      });
      $rootScope.$digest();
      assertColor('blue');

      $animate.leave(element, {
        to: { color: 'yellow' }
      });
      $rootScope.$digest();
      assertColor('yellow');

      function assertColor(color) {
        expect(element[0].style.color).toBe(color);
      }
    }));

    it('should merge the from and to styles that are provided',
      angular.mock.inject(function($animate, $rootScope) {

      var element = angular.element('<div></div>');

      element.css('color', 'red');
      $animate.addClass(element, 'on', {
        from: { color: 'green' },
        to: { borderColor: 'purple' }
      });
      $rootScope.$digest();

      var style = element[0].style;
      expect(style.color).toBe('green');
      expect(style.borderColor).toBe('purple');
    }));

    it('should avoid cancelling out add/remove when the element already contains the class',
      angular.mock.inject(function($animate, $rootScope) {

      var element = angular.element('<div class="ng-hide"></div>');

      $animate.addClass(element, 'ng-hide');
      $animate.removeClass(element, 'ng-hide');
      $rootScope.$digest();

      expect(element).not.toHaveClass('ng-hide');
    }));

    it('should avoid cancelling out remove/add if the element does not contain the class',
      angular.mock.inject(function($animate, $rootScope) {

      var element = angular.element('<div></div>');

      $animate.removeClass(element, 'ng-hide');
      $animate.addClass(element, 'ng-hide');
      $rootScope.$digest();

      expect(element).toHaveClass('ng-hide');
    }));

    test.each(['enter', 'move'])('should accept an unwrapped "parent" element for the %s event' , function(method) {
      angular.mock.inject(function($document, $animate, $rootElement) {
        var element = angular.element('<div></div>');
        var parent = $document[0].createElement('div');
        $rootElement.append(parent);

        $animate[method](element, parent);
        expect(element[0].parentNode).toBe(parent);
      });
    });

    test.each(['enter', 'move'])('should accept an unwrapped "after" element for the %s event', function(method) {
      angular.mock.inject(function($document, $animate, $rootElement) {
        var element = angular.element('<div></div>');
        var after = $document[0].createElement('div');
        $rootElement.append(after);

        $animate[method](element, null, after);
        expect(element[0].previousSibling).toBe(after);
      });
    });

    test.each(['enter', 'move', 'leave', 'addClass', 'removeClass', 'setClass', 'animate'])('%s should operate using a native DOM element', function(event) {

      var captureSpy = jest.fn();

      angular.mock.module(function($provide) {
        $provide.value('$$animateQueue', {
          push: captureSpy
        });
      });

      angular.mock.inject(function($animate, $rootScope, $document, $rootElement) {
        var element = angular.element('<div></div>');
        var parent2 = angular.element('<div></div>');
        var parent = $rootElement;
        parent.append(parent2);

        if (event !== 'enter' && event !== 'move') {
          parent.append(element);
        }

        var fn, invalidOptions = function() { };

        switch (event) {
          case 'enter':
          case 'move':
            fn = function() {
              $animate[event](element, parent, parent2, invalidOptions);
            };
            break;

          case 'addClass':
            fn = function() {
              $animate.addClass(element, 'klass', invalidOptions);
            };
            break;

          case 'removeClass':
            element.className = 'klass';
            fn = function() {
              $animate.removeClass(element, 'klass', invalidOptions);
            };
            break;

          case 'setClass':
            element.className = 'two';
            fn = function() {
              $animate.setClass(element, 'one', 'two', invalidOptions);
            };
            break;

          case 'leave':
            fn = function() {
              $animate.leave(element, invalidOptions);
            };
            break;

          case 'animate':
            var toStyles = { color: 'red' };
            fn = function() {
              $animate.animate(element, {}, toStyles, 'klass', invalidOptions);
            };
            break;
        }

        expect(function() {
          fn();
          $rootScope.$digest();
        }).not.toThrow();

        var optionsArg = captureSpy.mock.calls[captureSpy.mock.calls.length - 1][2];
        expect(optionsArg).not.toBe(invalidOptions);
        expect(angular.isObject(optionsArg)).toBeTruthy();
      });
    });
  });

  it('should not issue a call to addClass if the provided class value is not a string or array', function() {
    angular.mock.inject(function($animate, $rootScope, $rootElement) {

      var element = angular.element('<div></div>');
      var parent = $rootElement;

      $animate.enter(element, parent, null, { addClass: angular.noop });
      $rootScope.$digest();
      expect(element[0].className).toBe("");

      $animate.leave(element, { addClass: true });
      $rootScope.$digest();
      expect(element[0].className).toBe("");

      $animate.enter(element, parent, null, { addClass: 'fatias' });
      $rootScope.$digest();
      expect(element[0].className).toBe("fatias");
    });
  });


  it('should not break postDigest for subsequent elements if addClass contains non-valid CSS class names', function() {
    angular.mock.inject(function($animate, $rootScope, $rootElement) {
      var element1 = angular.element('<div></div>');
      var element2 = angular.element('<div></div>');

      $animate.enter(element1, $rootElement, null, { addClass: ' ' });
      $animate.enter(element2, $rootElement, null, { addClass: 'valid-name' });
      $rootScope.$digest();

      expect(element2.hasClass('valid-name')).toBeTruthy();
    });
  });


  it('should not issue a call to removeClass if the provided class value is not a string or array', function() {
    angular.mock.inject(function($animate, $rootScope, $rootElement) {
      var element = angular.element('<div class="fatias"></div>');
      var parent = $rootElement;

      $animate.enter(element, parent, null, {removeClass: angular.noop });
      $rootScope.$digest();
      expect(element[0].className).toBe("fatias");

      $animate.leave(element, { removeClass: true });
      $rootScope.$digest();
      expect(element[0].className).toBe("fatias");

      element.addClass('fatias');
      $animate.enter(element, parent, null, { removeClass: 'fatias' });
      $rootScope.$digest();
      expect(element[0].className).toBe("");
    });
  });

  it('should not alter the provided options input in any way throughout the animation', angular.mock.inject(function($animate, $rootElement, $rootScope) {
    var element = angular.element('<div></div>');
    var parent = $rootElement;

    var initialOptions = {
      from: { height: '50px' },
      to: { width: '50px' },
      addClass: 'one',
      removeClass: 'two'
    };

    var copiedOptions = angular.copy(initialOptions);
    expect(copiedOptions).toEqual(initialOptions);

    var runner = $animate.enter(element, parent, null, copiedOptions);
    expect(copiedOptions).toEqual(initialOptions);

    $rootScope.$digest();
    expect(copiedOptions).toEqual(initialOptions);
  }));

  describe('CSS class DOM manipulation', function() {
    var element;
    var addClass;
    var removeClass;

    beforeEach(angular.mock.module(provideLog));

    afterEach(function() {
      dealoc(element);
    });

    function setupClassManipulationSpies() {
      angular.mock.inject(function($animate) {
        addClass = jest.spyOn(window, 'jqLiteAddClass');
        removeClass = jest.spyOn(window, 'jqLiteRemoveClass');
      });
    }

    function setupClassManipulationLogger(log) {
      angular.mock.inject(function() {
        var _addClass = jqLiteAddClass;
        addClass = jest.spyOn(window, 'jqLiteAddClass').mockImplementation(function(element, classes) {
          var names = classes;
          if (Object.prototype.toString.call(classes) === '[object Array]') names = classes.join(' ');
          log('addClass(' + names + ')');
          return _addClass(element, classes);
        });

        var _removeClass = jqLiteRemoveClass;
        removeClass = jest.spyOn(window, 'jqLiteRemoveClass').mockImplementation(function(element, classes) {
          var names = classes;
          if (Object.prototype.toString.call(classes) === '[object Array]') names = classes.join(' ');
          log('removeClass(' + names + ')');
          return _removeClass(element, classes);
        });
      });
    }

    it('should defer class manipulation until end of digest', angular.mock.inject(function($rootScope, $animate, log) {
      element = angular.element('<p>test</p>');

      $rootScope.$apply(function() {
        $animate.addClass(element, 'test-class1');
        expect(element).not.toHaveClass('test-class1');

        $animate.removeClass(element, 'test-class1');

        $animate.addClass(element, 'test-class2');
        expect(element).not.toHaveClass('test-class2');

        $animate.setClass(element, 'test-class3', 'test-class4');
        expect(element).not.toHaveClass('test-class3');
        expect(element).not.toHaveClass('test-class4');
      });

      expect(element).not.toHaveClass('test-class1');
      expect(element).not.toHaveClass('test-class4');
      expect(element).toHaveClass('test-class2');
      expect(element).toHaveClass('test-class3');
    }));


    it('should defer class manipulation until postDigest when outside of digest', angular.mock.inject(function($rootScope, $animate, log) {
      element = angular.element('<p class="test-class4">test</p>');

      $animate.addClass(element, 'test-class1');
      $animate.removeClass(element, 'test-class1');
      $animate.addClass(element, 'test-class2');
      $animate.setClass(element, 'test-class3', 'test-class4');
      expect(element).toHaveClass('test-class4');
      expect(element).not.toHaveClass('test-class1');
      expect(element).not.toHaveClass('test-class2');
      expect(element).not.toHaveClass('test-class3');
      $rootScope.$digest();

      expect(element).not.toHaveClass('test-class1');
      expect(element).toHaveClass('test-class2');
      expect(element).toHaveClass('test-class3');
    }));


    it('should return a promise which is resolved on a different turn', angular.mock.inject(function(log, $animate, $$rAF, $rootScope) {
      element = angular.element('<p class="test2">test</p>');

      $animate.addClass(element, 'test1').then(log.fn('addClass(test1)'));
      $animate.removeClass(element, 'test2').then(log.fn('removeClass(test2)'));

      $rootScope.$digest();
      expect(log).toEqual([]);
      $$rAF.flush();
      $rootScope.$digest();
      expect(log).toEqual(['addClass(test1)', 'removeClass(test2)']);

      log.reset();
      element = angular.element('<p class="test4">test</p>');

      $rootScope.$apply(function() {
        $animate.addClass(element, 'test3').then(log.fn('addClass(test3)'));
        $animate.removeClass(element, 'test4').then(log.fn('removeClass(test4)'));
      });

      $$rAF.flush();
      $rootScope.$digest();
      expect(log).toEqual(['addClass(test3)', 'removeClass(test4)']);
    }));


    it('should defer class manipulation until end of digest for SVG', angular.mock.inject(function($rootScope, $animate) {
      element = angular.element('<svg><g></g></svg>');
      var target = element.children().eq(0);

      $rootScope.$apply(function() {
        $animate.addClass(target, 'test-class1');
        expect(target).not.toHaveClass('test-class1');

        $animate.removeClass(target, 'test-class1');

        $animate.addClass(target, 'test-class2');
        expect(target).not.toHaveClass('test-class2');

        $animate.setClass(target, 'test-class3', 'test-class4');
        expect(target).not.toHaveClass('test-class3');
        expect(target).not.toHaveClass('test-class4');
      });

      expect(target).not.toHaveClass('test-class1');
      expect(target).toHaveClass('test-class2');
    }));


    it('should defer class manipulation until postDigest when outside of digest for SVG', angular.mock.inject(function($rootScope, $animate, log) {
      element = angular.element('<svg><g class="test-class4"></g></svg>');
      var target = element.children().eq(0);

      $animate.addClass(target, 'test-class1');
      $animate.removeClass(target, 'test-class1');
      $animate.addClass(target, 'test-class2');
      $animate.setClass(target, 'test-class3', 'test-class4');

      expect(target).toHaveClass('test-class4');
      expect(target).not.toHaveClass('test-class1');
      expect(target).not.toHaveClass('test-class2');
      expect(target).not.toHaveClass('test-class3');
      $rootScope.$digest();

      expect(target).not.toHaveClass('test-class1');
      expect(target).toHaveClass('test-class2');
      expect(target).toHaveClass('test-class3');
    }));
  });
});
