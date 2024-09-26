'use strict';

describe('$routeParams', function() {

  beforeEach(angular.mock.module('ngRoute'));


  it('should publish the params into a service',  function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/foo', {});
      $routeProvider.when('/bar/:barId', {});
    });

    angular.mock.inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/foo').search('a=b');
      $rootScope.$digest();
      expect($routeParams).toEqual({a:'b'});

      $location.path('/bar/123').search('x=abc');
      $rootScope.$digest();
      expect($routeParams).toEqual({barId:'123', x:'abc'});
    });
  });

  it('should correctly extract the params when a param name is part of the route',  function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/bar/:foo/:bar', {});
    });

    angular.mock.inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/bar/foovalue/barvalue');
      $rootScope.$digest();
      expect($routeParams).toEqual({bar:'barvalue', foo:'foovalue'});
    });
  });

  it('should support route params not preceded by slashes', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/bar:barId/foo:fooId/', {});
    });

    angular.mock.inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/barbarvalue/foofoovalue/');
      $rootScope.$digest();
      expect($routeParams).toEqual({barId: 'barvalue', fooId: 'foovalue'});
    });
  });

  it('should correctly extract the params when an optional param name is part of the route',  function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/bar/:foo?', {});
      $routeProvider.when('/baz/:foo?/edit', {});
      $routeProvider.when('/qux/:bar?/:baz?', {});
    });

    angular.mock.inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/bar');
      $rootScope.$digest();
      expect($routeParams).toEqual({});

      $location.path('/bar/fooValue');
      $rootScope.$digest();
      expect($routeParams).toEqual({foo: 'fooValue'});

      $location.path('/baz/fooValue/edit');
      $rootScope.$digest();
      expect($routeParams).toEqual({foo: 'fooValue'});

      $location.path('/baz/edit');
      $rootScope.$digest();
      expect($routeParams).toEqual({});

      $location.path('/qux//bazValue');
      $rootScope.$digest();
      expect($routeParams).toEqual({baz: 'bazValue'});

    });
  });


});
