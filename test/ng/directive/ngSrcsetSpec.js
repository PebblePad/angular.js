'use strict';

/* eslint-disable no-script-url */
 describe('ngSrcset', () => {
  var element;

   afterEach(() => {
    dealoc(element);
  });

  test('should not result empty string in img srcset', angular.mock.inject(function($rootScope, $compile) {
    $rootScope.image = {};
    element = $compile('<img ng-srcset="{{image.url}} 2x">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBeUndefined();
  }));

  test('should sanitize good urls', angular.mock.inject(function($rootScope, $compile) {
    $rootScope.imageUrl = 'http://example.com/image1.png 1x, http://example.com/image2.png 2x';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBe('http://example.com/image1.png 1x,http://example.com/image2.png 2x');
  }));

  test('should sanitize evil url', angular.mock.inject(function($rootScope, $compile) {
    $rootScope.imageUrl = 'http://example.com/image1.png 1x, javascript:doEvilStuff() 2x';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBe('http://example.com/image1.png 1x,unsafe:javascript:doEvilStuff() 2x');
  }));

  test('should not throw an error if undefined', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<img ng-attr-srcset="{{undefined}}">')($rootScope);
    $rootScope.$digest();
  }));

  test('should interpolate the expression and bind to srcset', angular.mock.inject(function($compile, $rootScope) {
    var element = $compile('<img ng-srcset="some/{{id}} 2x"></div>')($rootScope);

    $rootScope.$digest();
    expect(element.attr('srcset')).toBeUndefined();

    $rootScope.$apply(function() {
      $rootScope.id = 1;
    });
    expect(element.attr('srcset')).toEqual('some/1 2x');

    dealoc(element);
  }));
});
