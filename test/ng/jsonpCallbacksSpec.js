'use strict';
 describe('$jsonpCallbacks', () => {

  describe('createCallback(url)', () => {

    test('should return a new unique path to a callback function on each call', angular.mock.inject(function($jsonpCallbacks) {
      var path = $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      expect(path).toEqual('angular.callbacks._0');

      path = $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      expect(path).toEqual('angular.callbacks._1');

      path = $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      expect(path).toEqual('angular.callbacks._2');

      path = $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      expect(path).toEqual('angular.callbacks._3');
    }));

    test('should add a callback method to the $window.angular.callbacks collection on each call', angular.mock.inject(function($window, $jsonpCallbacks) {
      $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      expect($window.angular.callbacks._0).toEqual(expect.any(Function));

      $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      expect($window.angular.callbacks._1).toEqual(expect.any(Function));

      $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      expect($window.angular.callbacks._2).toEqual(expect.any(Function));

      $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      expect($window.angular.callbacks._3).toEqual(expect.any(Function));
    }));

    test('should produce unique callback paths across multiple instances', () => {
      var $jsonpCallbacks1 = angular.injector(['ng', 'ngMock']).get('$jsonpCallbacks');
      var $jsonpCallbacks2 = angular.injector(['ng', 'ngMock']).get('$jsonpCallbacks');

      var path1 = $jsonpCallbacks1.createCallback('http://some.dummy.com/jsonp/request');
      var path2 = $jsonpCallbacks2.createCallback('http://some.dummy.com/jsonp/request');

      expect(path1).toBe('angular.callbacks._0');
      expect(path2).toBe('angular.callbacks._1');
      expect(angular.callbacks._0).toBeDefined();
      expect(angular.callbacks._1).toBeDefined();
    });
  });


  describe('wasCalled(callbackPath)', () => {

    test('should return true once the callback has been called', angular.mock.inject(function($window, $jsonpCallbacks) {
      var path = $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      expect($jsonpCallbacks.wasCalled(path)).toBeFalsy();
      var response = {};
      $window.angular.callbacks._0(response);
      expect($jsonpCallbacks.wasCalled(path)).toBeTruthy();
    }));
  });


  describe('getResponse(callbackPath)', () => {

    test('should retrieve the data from when the callback was called', angular.mock.inject(function($window, $jsonpCallbacks) {
      var path = $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      var response = {};
      $window.angular.callbacks._0(response);
      var result = $jsonpCallbacks.getResponse(path);
      expect(result).toBe(response);
    }));
  });


  describe('removeCallback(callbackPath)', () => {

    test('should remove the callback', angular.mock.inject(function($window, $jsonpCallbacks) {
      var path = $jsonpCallbacks.createCallback('http://some.dummy.com/jsonp/request');
      $jsonpCallbacks.removeCallback(path);
      expect($window.angular.callbacks._0).toBeUndefined();
    }));
  });

  describe('mocked $window', () => {

    beforeEach(angular.mock.module(function($provide) {
      $provide.value('$window', {});
    }));

    test('should not throw when $window.angular does not exist', angular.mock.inject(function($injector) {
      expect(function() {
        $injector.get('$jsonpCallbacks');
      }).not.toThrow();
    }));
  });
});
