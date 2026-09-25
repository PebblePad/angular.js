'use strict';
 describe('ngStyle', () => {
  var element;


   afterEach(() => {
    dealoc(element);
  });


  test('should set', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<div ng-style="{height: \'40px\'}"></div>')($rootScope);
    $rootScope.$digest();
    expect(element.css('height')).toEqual('40px');
  }));


  test('should silently ignore undefined style', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<div ng-style="myStyle"></div>')($rootScope);
    $rootScope.$digest();
    expect(element.hasClass('ng-exception')).toBeFalsy();
  }));


  test('should support binding for object literals', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<div ng-style="{height: heightStr}"></div>')($rootScope);
    $rootScope.$digest();
    expect(parseInt(element.css('height') + 0, 10)).toEqual(0); // height could be '' or '0px'
    $rootScope.$apply('heightStr = "40px"');
    expect(element.css('height')).toBe('40px');

    $rootScope.$apply('heightStr = "100px"');
    expect(element.css('height')).toBe('100px');
  }));


  test('should support lazy one-time binding for object literals', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<div ng-style="::{height: heightStr}"></div>')($rootScope);
    $rootScope.$digest();
    expect(parseInt(element.css('height') + 0, 10)).toEqual(0); // height could be '' or '0px'
    $rootScope.$apply('heightStr = "40px"');
    expect(element.css('height')).toBe('40px');
  }));


  describe('preserving styles set before and after compilation', () => {
    var scope;
    var preCompStyle;
    var preCompVal;
    var postCompStyle;
    var postCompVal;
    var element;

    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      preCompStyle = 'width';
      preCompVal = '300px';
      postCompStyle = 'height';
      postCompVal = '100px';
      element = angular.element('<div ng-style="styleObj"></div>');
      element.css(preCompStyle, preCompVal);
      angular.element(window.document.body).append(element);
      $compile(element)($rootScope);
      scope = $rootScope;
      scope.styleObj = {'margin-top': '44px'};
      scope.$apply();
      element.css(postCompStyle, postCompVal);
    }));

     afterEach(() => {
      element.remove();
    });


    test('should not mess up stuff after compilation', () => {
      element.css('margin', '44px');
      expect(element.css(preCompStyle)).toBe(preCompVal);
      expect(element.css('margin-top')).toBe('44px');
      expect(element.css(postCompStyle)).toBe(postCompVal);
    });


    test('should not mess up stuff after $apply with no model changes', () => {
      element.css('padding-top', '33px');
      scope.$apply();
      expect(element.css(preCompStyle)).toBe(preCompVal);
      expect(element.css('margin-top')).toBe('44px');
      expect(element.css(postCompStyle)).toBe(postCompVal);
      expect(element.css('padding-top')).toBe('33px');
    });


    test('should not mess up stuff after $apply with non-colliding model changes', () => {
      scope.styleObj = {'padding-top': '99px'};
      scope.$apply();
      expect(element.css(preCompStyle)).toBe(preCompVal);
      expect(element.css('margin-top')).toBe('');
      expect(element.css('padding-top')).toBe('99px');
      expect(element.css(postCompStyle)).toBe(postCompVal);
    });


    test('should overwrite original styles after a colliding model change', () => {
      scope.styleObj = {'height': '99px', 'width': '88px'};
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = {};
      scope.$apply();
      expect(element.css(preCompStyle)).not.toBe('88px');
      expect(element.css(postCompStyle)).not.toBe('99px');
    });

    test('should clear style when the new model is null', () => {
      scope.styleObj = {'height': '99px', 'width': '88px'};
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = null;
      scope.$apply();
      expect(element.css(preCompStyle)).not.toBe('88px');
      expect(element.css(postCompStyle)).not.toBe('99px');
    });

    test('should clear style when the value is undefined or null', () => {
      scope.styleObj = {'height': '99px', 'width': '88px'};
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = {'height': undefined, 'width': null};
      scope.$apply();
      expect(element.css(preCompStyle)).not.toBe('88px');
      expect(element.css(postCompStyle)).not.toBe('99px');
    });

    test('should clear style when the value is false', () => {
      scope.styleObj = {'height': '99px', 'width': '88px'};
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = {'height': false, 'width': false};
      scope.$apply();
      expect(element.css(preCompStyle)).not.toBe('88px');
      expect(element.css(postCompStyle)).not.toBe('99px');
    });

    test('should set style when the value is zero', () => {
      scope.styleObj = {'height': '99px', 'width': '88px'};
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = {'height': 0, 'width': 0};
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('0px');
      expect(element.css(postCompStyle)).toBe('0px');
    });
  });
});
