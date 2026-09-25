'use strict';
 describe('ngIf', () => {

  describe('basic', () => {
    var $scope;
    var $compile;
    var element;
    var $compileProvider;

    beforeEach(angular.mock.module(function(_$compileProvider_) {
      $compileProvider = _$compileProvider_;
    }));
    beforeEach(angular.mock.inject(function($rootScope, _$compile_) {
      $scope = $rootScope.$new();
      $compile = _$compile_;
      element = $compile('<div></div>')($scope);
    }));

     afterEach(() => {
      dealoc(element);
    });

    function makeIf() {
      angular.forEach(arguments, function(expr) {
        element.append($compile('<div class="my-class" ng-if="' + expr + '"><div>Hi</div></div>')($scope));
      });
      $scope.$apply();
    }

    test('should immediately remove the element if condition is falsy', () => {
      makeIf('false', 'undefined', 'null', 'NaN', '\'\'', '0');
      expect(element.children().length).toBe(0);
    });

    test('should leave the element if condition is true', () => {
      makeIf('true');
      expect(element.children().length).toBe(1);
    });

    test('should leave the element if the condition is a non-empty string', () => {
      makeIf('\'f\'', '\'0\'', '\'false\'', '\'no\'', '\'n\'', '\'[]\'');
      expect(element.children().length).toBe(6);
    });

    test('should leave the element if the condition is an object', () => {
      makeIf('[]', '{}');
      expect(element.children().length).toBe(2);
    });

    test('should not add the element twice if the condition goes from true to true', () => {
      $scope.hello = 'true1';
      makeIf('hello');
      expect(element.children().length).toBe(1);
      $scope.$apply('hello = "true2"');
      expect(element.children().length).toBe(1);
    });

    test('should not recreate the element if the condition goes from true to true', () => {
      $scope.hello = 'true1';
      makeIf('hello');
      element.children().data('flag', true);
      $scope.$apply('hello = "true2"');
      expect(element.children().data('flag')).toBe(true);
    });

    test('should create then remove the element if condition changes', () => {
      $scope.hello = true;
      makeIf('hello');
      expect(element.children().length).toBe(1);
      $scope.$apply('hello = false');
      expect(element.children().length).toBe(0);
    });

    test('should create a new scope every time the expression evaluates to true', () => {
      $scope.$apply('value = true');
      element.append($compile(
        '<div ng-if="value"><span ng-init="value=false"></span></div>'
      )($scope));
      $scope.$apply();
      expect(element.children('div').length).toBe(1);
    });

    test('should destroy the child scope every time the expression evaluates to false', () => {
      $scope.value = true;
      element.append($compile(
          '<div ng-if="value"></div>'
      )($scope));
      $scope.$apply();

      var childScope = element.children().scope();
      var destroyed = false;

      childScope.$on('$destroy', function() {
        destroyed = true;
      });

      $scope.value = false;
      $scope.$apply();

      expect(destroyed).toBe(true);
    });

    test('should play nice with other elements beside it', () => {
      $scope.values = [1, 2, 3, 4];
      element.append($compile(
        '<div ng-repeat="i in values"></div>' +
          '<div ng-if="values.length==4"></div>' +
          '<div ng-repeat="i in values"></div>'
      )($scope));
      $scope.$apply();
      expect(element.children().length).toBe(9);
      $scope.$apply('values.splice(0,1)');
      expect(element.children().length).toBe(6);
      $scope.$apply('values.push(1)');
      expect(element.children().length).toBe(9);
    });

    test('should play nice with ngInclude on the same element', angular.mock.inject(function($templateCache) {
      $templateCache.put('test.html', [200, '{{value}}', {}]);

      $scope.value = 'first';
      element.append($compile(
        '<div ng-if="value==\'first\'" ng-include="\'test.html\'"></div>'
      )($scope));
      $scope.$apply();
      expect(element.text()).toBe('first');

      $scope.value = 'later';
      $scope.$apply();
      expect(element.text()).toBe('');
    }));

    test('should work with multiple elements', () => {
      $scope.show = true;
      $scope.things = [1, 2, 3];
      element.append($compile(
        '<div>before;</div>' +
          '<div ng-if-start="show">start;</div>' +
          '<div ng-repeat="thing in things">{{thing}};</div>' +
          '<div ng-if-end>end;</div>' +
          '<div>after;</div>'
      )($scope));
      $scope.$apply();
      expect(element.text()).toBe('before;start;1;2;3;end;after;');

      $scope.things.push(4);
      $scope.$apply();
      expect(element.text()).toBe('before;start;1;2;3;4;end;after;');

      $scope.show = false;
      $scope.$apply();
      expect(element.text()).toBe('before;after;');
    });

    test('should restore the element to its compiled state', () => {
      $scope.value = true;
      makeIf('value');
      expect(element.children().length).toBe(1);
      angular.element(element.children()[0]).removeClass('my-class');
      expect(element.children()[0].className).not.toContain('my-class');
      $scope.$apply('value = false');
      expect(element.children().length).toBe(0);
      $scope.$apply('value = true');
      expect(element.children().length).toBe(1);
      expect(element.children()[0].className).toContain('my-class');
    });

    test('should work when combined with an ASYNC template that loads after the first digest', angular.mock.inject(function($httpBackend, $compile, $rootScope) {
      $compileProvider.directive('test', function() {
        return {
          templateUrl: 'test.html'
        };
      });
      $httpBackend.whenGET('test.html').respond('hello');
      element.append('<div ng-if="show" test></div>');
      $compile(element)($rootScope);
      $rootScope.show = true;
      $rootScope.$apply();
      expect(element.text()).toBe('');

      $httpBackend.flush();
      expect(element.text()).toBe('hello');

      $rootScope.show = false;
      $rootScope.$apply();
      // Note: there are still comments in element!
      expect(element.children().length).toBe(0);
      expect(element.text()).toBe('');
    }));

    test('should not trigger a digest when the element is removed', angular.mock.inject(function($$rAF, $rootScope, $timeout) {
      var spy = jest.spyOn($rootScope, '$digest');

      $scope.hello = true;
      makeIf('hello');
      expect(element.children().length).toBe(1);
      $scope.$apply('hello = false');
      spy.mockClear();
      expect(element.children().length).toBe(0);
      // The animation completion is async even without actual animations
      $$rAF.flush();

      expect(spy).not.toHaveBeenCalled();
      // A digest may have been triggered asynchronously, so check the queue
      $timeout.verifyNoPendingTasks();
    }));
  });

  describe('and transcludes', () => {
    test('should allow access to directive controller from children when used in a replace template', () => {
      var controller;
      angular.mock.module(function($compileProvider) {
        var directive = $compileProvider.directive;
        directive('template', ngInternals.valueFn({
          template: '<div ng-if="true"><span test></span></div>',
          replace: true,
          controller() {
            this.flag = true;
          }
        }));
        directive('test', ngInternals.valueFn({
          require: '^template',
          link(scope, el, attr, ctrl) {
            controller = ctrl;
          }
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        var element = $compile('<div><div template></div></div>')($rootScope);
        $rootScope.$apply();
        expect(controller.flag).toBe(true);
        dealoc(element);
      });
    });


    test('should use the correct transcluded scope', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('iso', ngInternals.valueFn({
          link(scope) {
            scope.val = 'value in iso scope';
          },
          restrict: 'E',
          transclude: true,
          template: '<div ng-if="true">val={{val}}-<div ng-transclude></div></div>',
          scope: {}
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        $rootScope.val = 'transcluded content';
        var element = $compile('<iso><span ng-bind="val"></span></iso>')($rootScope);
        $rootScope.$digest();
        expect(ngInternals.trim(element.text())).toEqual('val=value in iso scope-transcluded content');
        dealoc(element);
      });
    });
  });

  describe('and animations', () => {
    var body;
    var element;
    var $rootElement;

    function html(content) {
      $rootElement.html(content);
      element = $rootElement.children().eq(0);
      return element;
    }

    beforeEach(angular.mock.module('ngAnimateMock'));

    beforeEach(angular.mock.module(function() {
      // we need to run animation on attached elements;
      return function(_$rootElement_) {
        $rootElement = _$rootElement_;
        body = angular.element(window.document.body);
        body.append($rootElement);
      };
    }));

     afterEach(() => {
      dealoc(body);
      dealoc(element);
    });

    beforeEach(angular.mock.module(function($animateProvider, $provide) {
      return function($animate) {
        $animate.enabled(true);
      };
    }));

    test('should fire off the enter animation',
      angular.mock.inject(function($compile, $rootScope, $animate) {
        var item;
        var $scope = $rootScope.$new();
        element = $compile(html(
          '<div>' +
            '<div ng-if="value"><div>Hi</div></div>' +
          '</div>'
        ))($scope);

        $rootScope.$digest();
        $scope.$apply('value = true');

        item = $animate.queue.shift();
        expect(item.event).toBe('enter');
        expect(item.element.text()).toBe('Hi');

        expect(element.children().length).toBe(1);
      })
    );

    test('should fire off the leave animation',
      angular.mock.inject(function($compile, $rootScope, $animate) {
        var item;
        var $scope = $rootScope.$new();
        element = $compile(html(
          '<div>' +
            '<div ng-if="value"><div>Hi</div></div>' +
          '</div>'
        ))($scope);
        $scope.$apply('value = true');

        item = $animate.queue.shift();
        expect(item.event).toBe('enter');
        expect(item.element.text()).toBe('Hi');

        expect(element.children().length).toBe(1);
        $scope.$apply('value = false');

        item = $animate.queue.shift();
        expect(item.event).toBe('leave');
        expect(item.element.text()).toBe('Hi');

        expect(element.children().length).toBe(0);
      })
    );

    test('should destroy the previous leave animation if a new one takes place', () => {
      angular.mock.module(function($provide) {
        $provide.decorator('$animate', function($delegate, $$q) {
          var emptyPromise = $$q.defer().promise;
          emptyPromise.done = angular.noop;

          $delegate.leave = function() {
            return emptyPromise;
          };
          return $delegate;
        });
      });
      angular.mock.inject(function($compile, $rootScope, $animate) {
        var item;
        var $scope = $rootScope.$new();
        element = $compile(html(
          '<div>' +
            '<div ng-if="value">Yo</div>' +
          '</div>'
        ))($scope);

        $scope.$apply('value = true');

        var destroyed;
        var inner = element.children(0);
        inner.on('$destroy', function() {
          destroyed = true;
        });

        $scope.$apply('value = false');

        $scope.$apply('value = true');

        $scope.$apply('value = false');

        expect(destroyed).toBe(true);
      });
    });

    test('should work with svg elements when the svg container is transcluded', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('svgContainer', function() {
          return {
            template: '<svg ng-transclude></svg>',
            replace: true,
            transclude: true
          };
        });
      });
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<svg-container><circle ng-if="flag"></circle></svg-container>')($rootScope);
        $rootScope.flag = true;
        $rootScope.$apply();

        var circle = element.find('circle');
        expect(circle[0].toString()).toMatch(/SVG/);
      });
    });
  });
});
