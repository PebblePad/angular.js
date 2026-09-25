'use strict';
 describe('$document', () => {


  test('should inject $document', angular.mock.inject(function($document) {
    expect($document).toEqual(angular.element(window.document));
  }));


  test('should be able to mock $document object', () => {
    angular.mock.module({$document: {}});
    angular.mock.inject(function($httpBackend, $http) {
      $httpBackend.expectGET('/dummy').respond('dummy');
      $http.get('/dummy');
      $httpBackend.flush();
    });
  });


  test('should be able to mock $document array', () => {
    angular.mock.module({$document: [{}]});
    angular.mock.inject(function($httpBackend, $http) {
      $httpBackend.expectGET('/dummy').respond('dummy');
      $http.get('/dummy');
      $httpBackend.flush();
    });
  });
});

 describe('$$isDocumentHidden', () => {
  test('should listen on the visibilitychange event', () => {
    var doc;

    var spy = jest.spyOn(window.document, 'addEventListener');

    angular.mock.inject(function($$isDocumentHidden, $document) {
      expect(spy.mock.lastCall[0]).toBe('visibilitychange');
      expect(spy.mock.lastCall[1]).toEqual(expect.any(Function));
      expect($$isDocumentHidden()).toBeFalsy(); // undefined in browsers that don't support visibility
    });

  });

  test('should remove the listener when the $rootScope is destroyed', () => {
    var spy = jest.spyOn(window.document, 'removeEventListener');

    angular.mock.inject(function($$isDocumentHidden, $rootScope) {
      $rootScope.$destroy();
      expect(spy.mock.lastCall[0]).toBe('visibilitychange');
      expect(spy.mock.lastCall[1]).toEqual(expect.any(Function));
    });
  });
});
