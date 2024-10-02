'use strict';

/* eslint-disable no-script-url */

describe('ngSrcset', function() {
  var element;

  afterEach(function() {
    dealoc(element);
  });

  it('should not result empty string in img srcset', angular.mock.inject(function($rootScope, $compile) {
    $rootScope.image = {};
    element = $compile('<img ng-srcset="{{image.url}} 2x">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBeUndefined();
  }));

  it('should sanitize good urls', angular.mock.inject(function($rootScope, $compile) {
    $rootScope.imageUrl = 'http://example.com/image1.png 1x, http://example.com/image2.png 2x';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBe('http://example.com/image1.png 1x,http://example.com/image2.png 2x');
  }));

  it('should sanitize evil url', angular.mock.inject(function($rootScope, $compile) {
    $rootScope.imageUrl = 'http://example.com/image1.png 1x, javascript:doEvilStuff() 2x';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBe('http://example.com/image1.png 1x,unsafe:javascript:doEvilStuff() 2x');
  }));

  it('should not throw an error if undefined', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<img ng-attr-srcset="{{undefined}}">')($rootScope);
    $rootScope.$digest();
  }));
});

