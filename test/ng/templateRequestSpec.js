'use strict';

describe('$templateRequest', function() {

  describe('provider', function() {

    describe('httpOptions', function() {

      it('should default to undefined and fallback to default $http options', function() {

        var defaultHeader;

        angular.mock.module(function($templateRequestProvider) {
          expect($templateRequestProvider.httpOptions()).toBeUndefined();
        });

        angular.mock.inject(function($templateRequest, $http, $templateCache) {
          jest.spyOn($http, 'get');

          $templateRequest('tpl.html');

          expect($http.get).toHaveBeenCalledOnceWith('tpl.html', {
            cache: $templateCache,
            transformResponse: []
          });
        });

      });

      it('should be configurable', function() {

        function someTransform() {}

        angular.mock.module(function($templateRequestProvider) {

          // Configure the template request service to provide  specific headers and transforms
          $templateRequestProvider.httpOptions({
            headers: { Accept: 'moo' },
            transformResponse: [someTransform]
          });
        });

        angular.mock.inject(function($templateRequest, $http, $templateCache) {
          jest.spyOn($http, 'get');

          $templateRequest('tpl.html');

          expect($http.get).toHaveBeenCalledOnceWith('tpl.html', {
            cache: $templateCache,
            transformResponse: [someTransform],
            headers: { Accept: 'moo' }
          });
        });
      });


      it('should be allow you to override the cache', function() {

        var httpOptions = {};

        angular.mock.module(function($templateRequestProvider) {
          $templateRequestProvider.httpOptions(httpOptions);
        });

        angular.mock.inject(function($templateRequest, $http, $cacheFactory) {
          jest.spyOn($http, 'get');

          var customCache = $cacheFactory('customCache');
          httpOptions.cache = customCache;

          $templateRequest('tpl.html');

          expect($http.get).toHaveBeenCalledOnceWith('tpl.html', {
            cache: customCache,
            transformResponse: []
          });
        });
      });
    });
  });

  it('should download the provided template file',
    angular.mock.inject(function($rootScope, $templateRequest, $httpBackend) {

    $httpBackend.expectGET('tpl.html').respond('<div>abc</div>');

    var content;
    $templateRequest('tpl.html').then(function(html) { content = html; });

    $rootScope.$digest();
    $httpBackend.flush();

    expect(content).toBe('<div>abc</div>');
  }));

  it('should cache the request to prevent extra downloads',
    angular.mock.inject(function($rootScope, $templateRequest, $templateCache, $httpBackend) {

    $httpBackend.expectGET('tpl.html').respond('matias');

    var content = [];
    function tplRequestCb(html) {
      content.push(html);
    }

    $templateRequest('tpl.html').then(tplRequestCb);
    $httpBackend.flush();

    $templateRequest('tpl.html').then(tplRequestCb);
    $rootScope.$digest();

    expect(content[0]).toBe('matias');
    expect(content[1]).toBe('matias');
    expect($templateCache.get('tpl.html')).toBe('matias');
  }));

  it('should call `$exceptionHandler` on request error', function() {
    angular.mock.module(function($exceptionHandlerProvider) {
      $exceptionHandlerProvider.mode('log');
    });

    angular.mock.inject(function($exceptionHandler, $httpBackend, $templateRequest) {
      $httpBackend.expectGET('tpl.html').respond(404, '', {}, 'Not Found');

      var err;
      $templateRequest('tpl.html').catch(function(reason) { err = reason; });
      $httpBackend.flush();

      expect(err).toEqualMinErr('$compile', 'tpload',
          'Failed to load template: tpl.html (HTTP status: 404 Not Found)');
      expect($exceptionHandler.errors[0]).toEqualMinErr('$compile', 'tpload',
          'Failed to load template: tpl.html (HTTP status: 404 Not Found)');
    });
  });

  it('should not call `$exceptionHandler` on request error when `ignoreRequestError` is true',
    function() {
      angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      });

      angular.mock.inject(function($exceptionHandler, $httpBackend, $templateRequest) {
        $httpBackend.expectGET('tpl.html').respond(404);

        var err;
        $templateRequest('tpl.html', true).catch(function(reason) { err = reason; });
        $httpBackend.flush();

        expect(err.status).toBe(404);
        expect($exceptionHandler.errors).toEqual([]);
      });
    }
  );

  it('should not call `$exceptionHandler` when the template is empty',
    angular.mock.inject(function($exceptionHandler, $httpBackend, $rootScope, $templateRequest) {
      $httpBackend.expectGET('tpl.html').respond('');

      var onError = jest.fn();
      $templateRequest('tpl.html').catch(onError);
      $rootScope.$digest();
      $httpBackend.flush();

      expect(onError).not.toHaveBeenCalled();
      expect($exceptionHandler.errors).toEqual([]);
    })
  );

  it('should accept empty templates and refuse null or undefined templates in cache',
    angular.mock.inject(function($rootScope, $templateRequest, $templateCache, $sce) {

    // Will throw on any template not in cache.
    jest.spyOn($sce, 'getTrustedResourceUrl').mockReturnValue(false);

    expect(function() {
      $templateRequest('tpl.html'); // should go through $sce
      $rootScope.$digest();
    }).toThrow();

    $templateCache.put('tpl.html'); // is a no-op, so $sce check as well.
    expect(function() {
      $templateRequest('tpl.html');
      $rootScope.$digest();
    }).toThrow();
    $templateCache.removeAll();

    $templateCache.put('tpl.html', null); // makes no sense, but it's been added, so trust it.
    expect(function() {
      $templateRequest('tpl.html');
      $rootScope.$digest();
    }).not.toThrow();
    $templateCache.removeAll();

    $templateCache.put('tpl.html', ''); // should work (empty template)
    expect(function() {
      $templateRequest('tpl.html');
      $rootScope.$digest();
    }).not.toThrow();
    $templateCache.removeAll();
  }));

  it('should keep track of how many requests are going on',
    angular.mock.inject(function($rootScope, $templateRequest, $httpBackend) {

    $httpBackend.expectGET('a.html').respond('a');
    $httpBackend.expectGET('b.html').respond('c');
    $templateRequest('a.html');
    $templateRequest('b.html');

    expect($templateRequest.totalPendingRequests).toBe(2);

    $rootScope.$digest();
    $httpBackend.flush();

    expect($templateRequest.totalPendingRequests).toBe(0);

    $httpBackend.expectGET('c.html').respond(404);
    $templateRequest('c.html');

    expect($templateRequest.totalPendingRequests).toBe(1);
    $rootScope.$digest();

    try {
      $httpBackend.flush();
    } catch (e) { /* empty */ }

    expect($templateRequest.totalPendingRequests).toBe(0);
  }));

  it('should not try to parse a response as JSON',
    angular.mock.inject(function($templateRequest, $httpBackend) {
      var spy = jest.fn();
      $httpBackend.expectGET('a.html').respond('{{text}}', {
        'Content-Type': 'application/json'
      });
      $templateRequest('a.html').then(spy);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalledOnceWith('{{text}}');
  }));

  it('should use custom response transformers (array)', function() {
    angular.mock.module(function($httpProvider) {
      $httpProvider.defaults.transformResponse.push(function(data) {
        return data + '!!';
      });
    });
    angular.mock.inject(function($templateRequest, $httpBackend) {
      var spy = jest.fn();
      $httpBackend.expectGET('a.html').respond('{{text}}', {
        'Content-Type': 'application/json'
      });
      $templateRequest('a.html').then(spy);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalledOnceWith('{{text}}!!');
    });
  });

  it('should use custom response transformers (function)', function() {
    angular.mock.module(function($httpProvider) {
      $httpProvider.defaults.transformResponse = function(data) {
        return data + '!!';
      };
    });
    angular.mock.inject(function($templateRequest, $httpBackend) {
      var spy = jest.fn();
      $httpBackend.expectGET('a.html').respond('{{text}}', {
        'Content-Type': 'application/json'
      });
      $templateRequest('a.html').then(spy);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalledOnceWith('{{text}}!!');
    });
  });
});
