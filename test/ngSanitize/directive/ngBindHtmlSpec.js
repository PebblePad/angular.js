'use strict';


describe('ngBindHtml', function() {
  beforeEach(angular.mock.module('ngSanitize'));

  it('should set html', angular.mock.inject(function($rootScope, $compile) {
    var element = $compile('<div ng-bind-html="html"></div>')($rootScope);
    $rootScope.html = '<div unknown>hello</div>';
    $rootScope.$digest();
    expect(angular.lowercase(element.html())).toEqual('<div>hello</div>');
    dealoc(element);
  }));


  it('should reset html when value is null or undefined', angular.mock.inject(function($compile, $rootScope) {
    var element = $compile('<div ng-bind-html="html"></div>')($rootScope);

    angular.forEach([null, undefined, ''], function(val) {
      $rootScope.html = 'some val';
      $rootScope.$digest();
      expect(angular.lowercase(element.html())).toEqual('some val');

      $rootScope.html = val;
      $rootScope.$digest();
      expect(angular.lowercase(element.html())).toEqual('');
    });

    dealoc(element);
  }));
});
