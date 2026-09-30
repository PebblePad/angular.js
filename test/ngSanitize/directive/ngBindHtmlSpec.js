'use strict';

 describe('ngBindHtml', () => {
  let element;
  beforeEach(angular.mock.module('ngSanitize'));
  afterEach(() => {
    dealoc(element);
  });

  test('should set html', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<div ng-bind-html="html"></div>')($rootScope);
    $rootScope.html = '<div unknown>hello</div>';
    $rootScope.$digest();
    expect(angular.$$lowercase(element.html())).toEqual('<div>hello</div>');
  }));


  test('should reset html when value is null or undefined', angular.mock.inject(function($compile, $rootScope) {
    element = $compile('<div ng-bind-html="html"></div>')($rootScope);

    angular.forEach([null, undefined, ''], function(val) {
      $rootScope.html = 'some val';
      $rootScope.$digest();
      expect(angular.$$lowercase(element.html())).toEqual('some val');

      $rootScope.html = val;
      $rootScope.$digest();
      expect(angular.$$lowercase(element.html())).toEqual('');
    });
  }));
});
