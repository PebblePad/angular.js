'use strict';

/* eslint-disable no-script-url */

describe('ngSrc', function() {
  var element;

  afterEach(function() {
    dealoc(element);
  });

  describe('img[ng-src]', function() {
    it('should not result empty string in img src', angular.mock.inject(function($rootScope, $compile) {
      $rootScope.image = {};
      element = $compile('<img ng-src="{{image.url}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('src')).not.toBe('');
      expect(element.attr('src')).toBeUndefined();
    }));

    it('should sanitize url', angular.mock.inject(function($rootScope, $compile) {
      $rootScope.imageUrl = 'javascript:alert(1);';
      element = $compile('<img ng-src="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('src')).toBe('unsafe:javascript:alert(1);');
    }));
  });

  describe('iframe[ng-src]', function() {
    it('should pass through src attributes for the same domain', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<iframe ng-src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.attr('src')).toEqual('different_page');
    }));

    it('should error on src attributes for a different domain', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<iframe ng-src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(function() { $rootScope.$apply(); }).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
          'http://a.different.domain.example.com');
    }));

    it('should error on JS src attributes', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<iframe ng-src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(function() { $rootScope.$apply(); }).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
          'javascript:alert(1);');
    }));

    it('should error on non-resource_url src attributes', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<iframe ng-src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect($rootScope.$apply).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
          'javascript:doTrustedStuff()');
    }));

    it('should pass through $sce.trustAs() values in src attributes', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<iframe ng-src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.attr('src')).toEqual('javascript:doTrustedStuff()');
    }));
  });
});
