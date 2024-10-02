'use strict';

describe('$document', function() {


  it('should inject $document', angular.mock.inject(function($document) {
    expect($document).toEqual(angular.element(window.document));
  }));


  it('should be able to mock $document object', function() {
    angular.mock.module({$document: {}});
    angular.mock.inject(function($httpBackend, $http) {
      $httpBackend.expectGET('/dummy').respond('dummy');
      $http.get('/dummy');
      $httpBackend.flush();
    });
  });


  it('should be able to mock $document array', function() {
    angular.mock.module({$document: [{}]});
    angular.mock.inject(function($httpBackend, $http) {
      $httpBackend.expectGET('/dummy').respond('dummy');
      $http.get('/dummy');
      $httpBackend.flush();
    });
  });
});


describe('$$isDocumentHidden', function() {
  it('should listen on the visibilitychange event', function() {
    var spy = jest.spyOn(window.document, 'addEventListener');

    angular.mock.inject(function($$isDocumentHidden) {
      expect(spy.mock.calls[spy.mock.calls.length - 1][0]).toBe('visibilitychange');
      expect(spy.mock.calls[spy.mock.calls.length - 1][1]).toEqual(expect.any(Function));
      expect($$isDocumentHidden()).toBeFalsy(); // undefined in browsers that don't support visibility
    });

  });

  it('should remove the listener when the $rootScope is destroyed', function() {
    var spy = jest.spyOn(window.document, 'removeEventListener');

    angular.mock.inject(function($$isDocumentHidden, $rootScope) {
      $rootScope.$destroy();
      expect(spy.mock.calls[spy.mock.calls.length - 1][0]).toBe('visibilitychange');
      expect(spy.mock.calls[spy.mock.calls.length - 1][1]).toEqual(expect.any(Function));
    });
  });
});
