'use strict';

describe('ngStyle', function() {
  var element;


  afterEach(function() {
    dealoc(element);
  });


  it('should set', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<div ng-style="{height: \'40px\'}"></div>')($rootScope);
    $rootScope.$digest();
    expect(element.css('height')).toEqual('40px');
  }));


  it('should silently ignore undefined style', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<div ng-style="myStyle"></div>')($rootScope);
    $rootScope.$digest();
    expect(element.hasClass('ng-exception')).toBeFalsy();
  }));


  it('should support lazy one-time binding for object literals', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<div ng-style="::{height: heightStr}"></div>')($rootScope);
    $rootScope.$digest();
    expect(parseInt(element.css('height') + 0, 10)).toEqual(0); // height could be '' or '0px'
    $rootScope.$apply('heightStr = "40px"');
    expect(element.css('height')).toBe('40px');
  }));


  describe('preserving styles set before and after compilation', function() {
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

    afterEach(function() {
      element.remove();
    });


    it('should not mess up stuff after compilation', function() {
      element.css('margin', '44px');
      expect(element.css(preCompStyle)).toBe(preCompVal);
      expect(element.css('margin-top')).toBe('44px');
      expect(element.css(postCompStyle)).toBe(postCompVal);
    });


    it('should not mess up stuff after $apply with no model changes', function() {
      element.css('padding-top', '33px');
      scope.$apply();
      expect(element.css(preCompStyle)).toBe(preCompVal);
      expect(element.css('margin-top')).toBe('44px');
      expect(element.css(postCompStyle)).toBe(postCompVal);
      expect(element.css('padding-top')).toBe('33px');
    });


    it('should not mess up stuff after $apply with non-colliding model changes', function() {
      scope.styleObj = {'padding-top': '99px'};
      scope.$apply();
      expect(element.css(preCompStyle)).toBe(preCompVal);
      expect(element.css('margin-top')).toBe('44px');
      expect(element.css('padding-top')).toBe('99px');
      expect(element.css(postCompStyle)).toBe(postCompVal);
    });


    it('should overwrite original styles after a colliding model change', function() {
      scope.styleObj = {'height': '99px', 'width': '88px'};
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = {};
      scope.$apply();
      expect(element.css(preCompStyle)).not.toBe('88px');
      expect(element.css(postCompStyle)).not.toBe('99px');
    });
  });
});
