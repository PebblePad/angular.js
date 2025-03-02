'use strict';

describe('ngClick (touch)', function() {
  var element;
  var time;
  var orig_now;

  afterEach(function() {
    dealoc(element);
  });

  function mockTime() {
    return time;
  }


  describe('config', function() {
    beforeEach(angular.mock.module('ngTouch'));

    it('should expose ngClickOverrideEnabled in the $touchProvider', function() {
      var _$touchProvider;

      angular.mock.module(function($touchProvider) {
        _$touchProvider = $touchProvider;
      });

      angular.mock.inject(function() {
        expect(_$touchProvider.ngClickOverrideEnabled).toEqual(expect.any(Function));
      });
    });


    it('should return "false" for ngClickOverrideEnabled by default', function() {
      var enabled;

      angular.mock.module(function($touchProvider) {
        enabled = $touchProvider.ngClickOverrideEnabled();
      });

      angular.mock.inject(function() {
        expect(enabled).toBe(false);
      });
    });


    it('should not apply the ngClick override directive by default', function() {
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
        $rootScope.$digest();
        expect($rootScope.tapped).toBeUndefined();

        browserTrigger(element, 'touchstart');
        browserTrigger(element, 'touchend');
        expect($rootScope.tapped).toBeUndefined();
      });
    });
  });

  describe('interaction with custom ngClick directives', function() {

    it('should not remove other ngClick directives when removing ngTouch ngClick in the decorator', function() {
      // Add another ngClick before ngTouch
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('ngClick', function() {
          return {};
        });
      });

      angular.mock.module('ngTouch');

      angular.mock.module(function($touchProvider) {
        $touchProvider.ngClickOverrideEnabled(true);
        $touchProvider.ngClickOverrideEnabled(false);
      });

      angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
        $rootScope.$digest();
        expect($rootScope.tapped).toBeUndefined();

        browserTrigger(element, 'touchstart');
        browserTrigger(element, 'touchend');
        expect($rootScope.tapped).toBeUndefined();
      });
    });

  });

  describe('directive', function() {

    beforeEach(function() {
      angular.mock.module('ngTouch');
      angular.mock.module(function($touchProvider) {
        $touchProvider.ngClickOverrideEnabled(true);
      });
      orig_now = Date.now;
      time = 0;
      Date.now = mockTime;
    });

    afterEach(function() {
      dealoc(element);
      Date.now = orig_now;
    });

    it('should not apply the ngClick override directive if ngClickOverrideEnabled has been set to false again', function() {
      angular.mock.module(function($touchProvider) {
        // beforeEach calls this with "true"
        $touchProvider.ngClickOverrideEnabled(false);
      });

      angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
        $rootScope.$digest();
        expect($rootScope.tapped).toBeUndefined();

        browserTrigger(element, 'touchstart');
        browserTrigger(element, 'touchend');
        expect($rootScope.tapped).toBeUndefined();
      });
    });


    it('should get called on a tap', angular.mock.inject(function($rootScope, $compile) {
      element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.tapped).toBeUndefined();

      browserTrigger(element, 'touchstart');
      browserTrigger(element, 'touchend');
      expect($rootScope.tapped).toEqual(true);
    }));


    it('should pass event object', angular.mock.inject(function($rootScope, $compile) {
      element = $compile('<div ng-click="event = $event"></div>')($rootScope);
      $rootScope.$digest();

      browserTrigger(element, 'touchstart');
      browserTrigger(element, 'touchend');
      expect($rootScope.event).toBeDefined();
    }));

    if (window.jQuery) {
      it('should not unwrap a jQuery-wrapped event object on click', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div ng-click="event = $event"></div>')($rootScope);
        $rootScope.$digest();

        browserTrigger(element, 'click', {
          keys: [],
          x: 10,
          y: 10
        });
        expect($rootScope.event.originalEvent).toBeDefined();
        expect($rootScope.event.originalEvent.clientX).toBe(10);
        expect($rootScope.event.originalEvent.clientY).toBe(10);
      }));

      it('should not unwrap a jQuery-wrapped event object on touchstart/touchend',
          angular.mock.inject(function($rootScope, $compile, $rootElement) {
        element = $compile('<div ng-click="event = $event"></div>')($rootScope);
        $rootElement.append(element);
        $rootScope.$digest();

        browserTrigger(element, 'touchstart');
        browserTrigger(element, 'touchend');

        expect($rootScope.event.originalEvent).toBeDefined();
      }));
    }


    it('should not click if the touch is held too long', angular.mock.inject(function($rootScope, $compile, $rootElement) {
      element = $compile('<div ng-click="count = count + 1"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.count = 0;
      $rootScope.$digest();

      expect($rootScope.count).toBe(0);

      time = 10;
      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });

      time = 900;
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });

      expect($rootScope.count).toBe(0);
    }));


    it('should not click if the touchend is too far away', angular.mock.inject(function($rootScope, $compile, $rootElement) {
      element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.tapped).toBeUndefined();

      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 400,
        y: 400
      });

      expect($rootScope.tapped).toBeUndefined();
    }));


    it('should not prevent click if a touchmove comes before touchend', angular.mock.inject(function($rootScope, $compile, $rootElement) {
      element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.tapped).toBeUndefined();

      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      browserTrigger(element, 'touchmove');
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 15,
        y: 15
      });

      expect($rootScope.tapped).toEqual(true);
    }));

    it('should add the CSS class while the element is held down, and then remove it', angular.mock.inject(function($rootScope, $compile, $rootElement) {
      element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();
      expect($rootScope.tapped).toBeUndefined();

      var CSS_CLASS = 'ng-click-active';

      expect(element.hasClass(CSS_CLASS)).toBe(false);
      browserTrigger(element, 'touchstart',{
        keys: [],
        x: 10,
        y: 10
      });
      expect(element.hasClass(CSS_CLASS)).toBe(true);
      browserTrigger(element, 'touchend',{
        keys: [],
        x: 10,
        y: 10
      });
      expect(element.hasClass(CSS_CLASS)).toBe(false);
      expect($rootScope.tapped).toBe(true);
    }));

    if (!/\bEdge\//.test(window.navigator.userAgent)) {
      // Edge cannot blur svg elements
      it('should click when target element is an SVG', angular.mock.inject(
        function($rootScope, $compile, $rootElement) {
          element = $compile('<svg ng-click="tapped = true"></svg>')($rootScope);
          $rootElement.append(element);
          $rootScope.$digest();

          browserTrigger(element, 'touchstart');
          browserTrigger(element, 'touchend');
          browserTrigger(element, 'click', {x:1, y:1});

          expect($rootScope.tapped).toEqual(true);
      }));
    }

    describe('the clickbuster', function() {
      var element1;
      var element2;

      afterEach(function() {
        dealoc(element1);
        dealoc(element2);
      });

      beforeEach(angular.mock.inject(function($rootElement, $document) {
        $document.find('body').append($rootElement);
      }));

      afterEach(angular.mock.inject(function($document) {
        $document.find('body').empty();
      }));


      it('should cancel the following click event', angular.mock.inject(function($rootScope, $compile, $rootElement) {
        element = $compile('<div ng-click="count = count + 1"></div>')($rootScope);
        $rootElement.append(element);

        $rootScope.count = 0;
        $rootScope.$digest();

        expect($rootScope.count).toBe(0);

        // Fire touchstart at 10ms, touchend at 50ms, the click at 300ms.
        time = 10;
        browserTrigger(element, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });

        time = 50;
        browserTrigger(element, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.count).toBe(1);

        time = 100;
        browserTrigger(element, 'click',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.count).toBe(1);
      }));


      it('should cancel the following click event even when the element has changed', angular.mock.inject(
          function($rootScope, $compile, $rootElement) {
        $rootElement.append(
            '<div ng-show="!tapped" ng-click="count1 = count1 + 1; tapped = true">x</div>' +
            '<div ng-show="tapped" ng-click="count2 = count2 + 1">y</div>'
        );
        $compile($rootElement)($rootScope);

        element1 = $rootElement.find('div').eq(0);
        element2 = $rootElement.find('div').eq(1);

        $rootScope.count1 = 0;
        $rootScope.count2 = 0;

        $rootScope.$digest();

        expect($rootScope.count1).toBe(0);
        expect($rootScope.count2).toBe(0);

        time = 10;
        browserTrigger(element1, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });

        time = 50;
        browserTrigger(element1, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.count1).toBe(1);

        time = 100;
        browserTrigger(element2, 'click',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.count1).toBe(1);
        expect($rootScope.count2).toBe(0);
      }));


      it('should not cancel clicks on distant elements', angular.mock.inject(function($rootScope, $compile, $rootElement) {
        $rootElement.append(
            '<div ng-click="count1 = count1 + 1">x</div>' +
            '<div ng-click="count2 = count2 + 1">y</div>'
        );
        $compile($rootElement)($rootScope);

        element1 = $rootElement.find('div').eq(0);
        element2 = $rootElement.find('div').eq(1);

        $rootScope.count1 = 0;
        $rootScope.count2 = 0;

        $rootScope.$digest();

        expect($rootScope.count1).toBe(0);
        expect($rootScope.count2).toBe(0);

        time = 10;
        browserTrigger(element1, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });

        time = 50;
        browserTrigger(element1, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.count1).toBe(1);

        time = 90;
        // Verify that it is blurred so we don't get soft-keyboard
        element1[0].blur = jest.fn();
        browserTrigger(element1, 'click',{
          keys: [],
          x: 10,
          y: 10
        });
        expect(element1[0].blur).toHaveBeenCalled();

        expect($rootScope.count1).toBe(1);

        time = 100;
        browserTrigger(element1, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });

        time = 130;
        browserTrigger(element1, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.count1).toBe(2);

        // Click on other element that should go through.
        time = 150;
        browserTrigger(element2, 'touchstart',{
          keys: [],
          x: 100,
          y: 120
        });
        browserTrigger(element2, 'touchend',{
          keys: [],
          x: 100,
          y: 120
        });
        browserTrigger(element2, 'click',{
          keys: [],
          x: 100,
          y: 120
        });

        expect($rootScope.count2).toBe(1);

        // Click event for the element that should be busted.
        time = 200;
        browserTrigger(element1, 'click',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.count1).toBe(2);
        expect($rootScope.count2).toBe(1);
      }));


      it('should not cancel clicks that come long after', angular.mock.inject(function($rootScope, $compile) {
        element1 = $compile('<div ng-click="count = count + 1"></div>')($rootScope);

        $rootScope.count = 0;

        $rootScope.$digest();

        expect($rootScope.count).toBe(0);

        time = 10;
        browserTrigger(element1, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });

        time = 50;
        browserTrigger(element1, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });
        expect($rootScope.count).toBe(1);

        time = 2700;
        browserTrigger(element1, 'click',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.count).toBe(2);
      }));


      describe('when clicking on a label immediately following a touch event', function() {
        var touch = function(element, x, y) {
          time = 10;
          browserTrigger(element, 'touchstart',{
            keys: [],
            x: x,
            y: y
          });

          time = 50;
          browserTrigger(element, 'touchend',{
            keys: [],
            x: x,
            y: y
          });
        };

        var click = function(element, x, y) {
          browserTrigger(element, 'click',{
            keys: [],
            x: x,
            y: y
          });
        };

        var $rootScope;
        var container;
        var otherElement;
        var input;
        var label;
        beforeEach(angular.mock.inject(function(_$rootScope_, $compile, $rootElement) {
          $rootScope = _$rootScope_;
          var container = $compile('<div><div ng-click="count = count + 1"></div>' +
            '<input id="input1" type="radio" ng-model="selection" value="radio1">' +
            '<label for="input1">Input1</label></div>')($rootScope);
          $rootElement.append(container);
          otherElement = container.children()[0];
          input = container.children()[1];
          label = container.children()[2];

          $rootScope.selection = 'initial';

          $rootScope.$digest();
        }));


        afterEach(function() {
          dealoc(label);
          dealoc(input);
          dealoc(otherElement);
          dealoc(container);
        });


        it('should not cancel input clicks with (0,0) coordinates', function() {
          touch(otherElement, 100, 100);

          time = 500;
          click(label, 10, 10);
          click(input, 0, 0);

          expect($rootScope.selection).toBe('radio1');
        });


        it('should not cancel input clicks with negative coordinates', function() {
          touch(otherElement, 100, 100);

          time = 500;
          click(label, 10, 10);
          click(input, -1, -1);

          expect($rootScope.selection).toBe('radio1');
        });


        it('should not cancel input clicks with positive coordinates identical to label click', function() {
          touch(otherElement, 100, 100);

          time = 500;
          click(label, 10, 10);
          click(input, 10, 10);

          expect($rootScope.selection).toBe('radio1');
        });


        it('should cancel input clicks with positive coordinates different than label click', function() {
          touch(otherElement, 100, 100);

          time = 500;
          click(label, 10, 10);
          click(input, 11, 11);

          expect($rootScope.selection).toBe('initial');
        });


        it('should blur the other element on click', function() {
          var blurSpy = jest.spyOn(otherElement, 'blur');
          touch(otherElement, 10, 10);

          time = 500;
          click(label, 10, 10);

          expect(blurSpy).toHaveBeenCalled();
        });
      });
    });


    describe('click fallback', function() {

      it('should treat a click as a tap on desktop', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div ng-click="tapped = true"></div>')($rootScope);
        $rootScope.$digest();
        expect($rootScope.tapped).toBeFalsy();

        browserTrigger(element, 'click');
        expect($rootScope.tapped).toEqual(true);
      }));


      it('should pass event object', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div ng-click="event = $event"></div>')($rootScope);
        $rootScope.$digest();

        browserTrigger(element, 'click');
        expect($rootScope.event).toBeDefined();
      }));
    });


    describe('disabled state', function() {
      it('should not trigger click if ngDisabled is true', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div ng-click="event = $event" ng-disabled="disabled"></div>')($rootScope);
        $rootScope.disabled = true;
        $rootScope.$digest();

        browserTrigger(element, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });
        browserTrigger(element, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.event).toBeUndefined();
      }));
      it('should trigger click if ngDisabled is false', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div ng-click="event = $event" ng-disabled="disabled"></div>')($rootScope);
        $rootScope.disabled = false;
        $rootScope.$digest();

        browserTrigger(element, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });
        browserTrigger(element, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.event).toBeDefined();
      }));
      it('should not trigger click if regular disabled is true', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div ng-click="event = $event" disabled="true"></div>')($rootScope);

        browserTrigger(element, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });
        browserTrigger(element, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.event).toBeUndefined();
      }));
      it('should not trigger click if regular disabled is present', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<button ng-click="event = $event" disabled ></button>')($rootScope);

        browserTrigger(element, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });
        browserTrigger(element, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.event).toBeUndefined();
      }));
      it('should trigger click if regular disabled is not present', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div ng-click="event = $event" ></div>')($rootScope);

        browserTrigger(element, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });
        browserTrigger(element, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });

        expect($rootScope.event).toBeDefined();
      }));
    });


    describe('the normal click event', function() {
      it('should be capturable by other handlers', angular.mock.inject(function($rootScope, $compile) {
        var called = false;

        element = $compile('<div ng-click="event = $event" ></div>')($rootScope);

        element.on('click', function() {
          called = true;
        });

        browserTrigger(element, 'touchstart',{
          keys: [],
          x: 10,
          y: 10
        });
        browserTrigger(element, 'touchend',{
          keys: [],
          x: 10,
          y: 10
        });

        expect(called).toEqual(true);
      }));
    });
  });
});
