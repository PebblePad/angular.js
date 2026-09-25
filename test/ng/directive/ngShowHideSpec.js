'use strict';
 describe('ngShow / ngHide', () => {
  var $scope;
  var $compile;
  var element;

  function expectVisibility(exprs, ngShowOrNgHide, shownOrHidden) {
    element = $compile('<div></div>')($scope);
    angular.forEach(exprs, function(expr) {
      var childElem = $compile('<div ' + ngShowOrNgHide + '="' + expr + '"></div>')($scope);
      element.append(childElem);
      $scope.$digest();
      expect(childElem)[shownOrHidden === 'shown' ? 'toBeShown' : 'toBeHidden']();
    });
  }

  beforeEach(angular.mock.inject(function($rootScope, _$compile_) {
    $scope = $rootScope.$new();
    $compile = _$compile_;
  }));

   afterEach(() => {
    dealoc(element);
  });

  describe('ngShow', () => {
    function expectShown() {
      expectVisibility(arguments, 'ng-show', 'shown');
    }

    function expectHidden() {
      expectVisibility(arguments, 'ng-show', 'hidden');
    }

    test('should show and hide an element', () => {
      element = angular.element('<div ng-show="exp"></div>');
      element = $compile(element)($scope);
      $scope.$digest();
      expect(element).toBeHidden();
      $scope.exp = true;
      $scope.$digest();
      expect(element).toBeShown();
    });

    // https://github.com/angular/angular.js/issues/5414
    test('should show if the expression is a function with a no arguments', () => {
      element = angular.element('<div ng-show="exp"></div>');
      element = $compile(element)($scope);
      $scope.exp = function() {};
      $scope.$digest();
      expect(element).toBeShown();
    });

    test('should make hidden element visible', () => {
      element = angular.element('<div class="ng-hide" ng-show="exp"></div>');
      element = $compile(element)($scope);
      expect(element).toBeHidden();
      $scope.exp = true;
      $scope.$digest();
      expect(element).toBeShown();
    });

    test('should hide the element if condition is falsy', () => {
      expectHidden('false', 'undefined', 'null', 'NaN', '\'\'', '0');
    });

    test('should show the element if condition is a non-empty string', () => {
      expectShown('\'f\'', '\'0\'', '\'false\'', '\'no\'', '\'n\'', '\'[]\'');
    });

    test('should show the element if condition is an object', () => {
      expectShown('[]', '{}');
    });
  });

  describe('ngHide', () => {
    function expectShown() {
      expectVisibility(arguments, 'ng-hide', 'shown');
    }

    function expectHidden() {
      expectVisibility(arguments, 'ng-hide', 'hidden');
    }

    test('should hide an element', () => {
      element = angular.element('<div ng-hide="exp"></div>');
      element = $compile(element)($scope);
      expect(element).toBeShown();
      $scope.exp = true;
      $scope.$digest();
      expect(element).toBeHidden();
    });

    test('should show the element if condition is falsy', () => {
      expectShown('false', 'undefined', 'null', 'NaN', '\'\'', '0');
    });

    test('should hide the element if condition is a non-empty string', () => {
      expectHidden('\'f\'', '\'0\'', '\'false\'', '\'no\'', '\'n\'', '\'[]\'');
    });

    test('should hide the element if condition is an object', () => {
      expectHidden('[]', '{}');
    });
  });
});
 describe('ngShow / ngHide animations', () => {
  var body;
  var element;
  var $rootElement;

  function html(content) {
    body.append($rootElement);
    $rootElement.html(content);
    element = $rootElement.children().eq(0);
    return element;
  }

   beforeEach(() => {
    // we need to run animation on attached elements;
    body = angular.element(window.document.body);
  });

   afterEach(() => {
    dealoc(body);
    dealoc(element);
    body.removeAttr('ng-animation-running');
  });

  beforeEach(angular.mock.module('ngAnimateMock'));

  beforeEach(angular.mock.module(function($animateProvider, $provide) {
    return function(_$rootElement_) {
      $rootElement = _$rootElement_;
    };
  }));

  describe('ngShow', () => {
    test('should fire off the $animate.show and $animate.hide animation', angular.mock.inject(function($compile, $rootScope, $animate) {
      var item;
      var $scope = $rootScope.$new();
      $scope.on = true;
      element = $compile(html(
        '<div ng-show="on">data</div>'
      ))($scope);
      $scope.$digest();

      item = $animate.queue.shift();
      expect(item.event).toBe('removeClass');
      expect(item.element.text()).toBe('data');
      expect(item.element).toBeShown();

      $scope.on = false;
      $scope.$digest();

      item = $animate.queue.shift();
      expect(item.event).toBe('addClass');
      expect(item.element.text()).toBe('data');
      expect(item.element).toBeHidden();
    }));

    test('should apply the temporary `.ng-hide-animate` class to the element',
      angular.mock.inject(function($compile, $rootScope, $animate) {

      var item;
      var $scope = $rootScope.$new();
      $scope.on = false;
      element = $compile(html(
        '<div class="show-hide" ng-show="on">data</div>'
      ))($scope);
      $scope.$digest();

      item = $animate.queue.shift();
      expect(item.event).toEqual('addClass');
      expect(item.options.tempClasses).toEqual('ng-hide-animate');

      $scope.on = true;
      $scope.$digest();
      item = $animate.queue.shift();
      expect(item.event).toEqual('removeClass');
      expect(item.options.tempClasses).toEqual('ng-hide-animate');
    }));
  });

  describe('ngHide', () => {
    test('should fire off the $animate.show and $animate.hide animation', angular.mock.inject(function($compile, $rootScope, $animate) {
      var item;
      var $scope = $rootScope.$new();
      $scope.off = true;
      element = $compile(html(
          '<div ng-hide="off">datum</div>'
      ))($scope);
      $scope.$digest();

      item = $animate.queue.shift();
      expect(item.event).toBe('addClass');
      expect(item.element.text()).toBe('datum');
      expect(item.element).toBeHidden();

      $scope.off = false;
      $scope.$digest();

      item = $animate.queue.shift();
      expect(item.event).toBe('removeClass');
      expect(item.element.text()).toBe('datum');
      expect(item.element).toBeShown();
    }));

    test('should apply the temporary `.ng-hide-animate` class to the element',
      angular.mock.inject(function($compile, $rootScope, $animate) {

      var item;
      var $scope = $rootScope.$new();
      $scope.on = false;
      element = $compile(html(
        '<div class="show-hide" ng-hide="on">data</div>'
      ))($scope);
      $scope.$digest();

      item = $animate.queue.shift();
      expect(item.event).toEqual('removeClass');
      expect(item.options.tempClasses).toEqual('ng-hide-animate');

      $scope.on = true;
      $scope.$digest();
      item = $animate.queue.shift();
      expect(item.event).toEqual('addClass');
      expect(item.options.tempClasses).toEqual('ng-hide-animate');
    }));
  });
});
