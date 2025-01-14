'use strict';
// The http specs run against the mocked httpBackend

describe('$http', function() {
  var callback;
  var mockedCookies;
  var customParamSerializer = function(params) {
    return Object.keys(params).join('_');
  };

  beforeEach(angular.mock.module(function($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');

    callback = jest.fn();
    mockedCookies = {};
  }));

  beforeEach(angular.mock.module({
    $$cookieReader() { return mockedCookies; },
    customParamSerializer: customParamSerializer
  }));

  afterEach(angular.mock.inject(function($exceptionHandler, $httpBackend) {
    angular.forEach($exceptionHandler.errors, function(e) {
      dump('Unhandled exception: ', e);
    });

    if ($exceptionHandler.errors.length) {
      throw 'Unhandled exceptions trapped in $exceptionHandler!';
    }

    $httpBackend.verifyNoOutstandingExpectation();
  }));


  describe('$httpProvider', function() {
    describe('interceptors', function() {
      it('should chain request, requestReject, response and responseReject interceptors', function() {
        angular.mock.module(function($httpProvider) {
          var savedConfig;
          var savedResponse;
          $httpProvider.interceptors.push(function($q) {
            return {
              request(config) {
                config.url += '/1';
                savedConfig = config;
                return $q.reject('/2');
              }
            };
          });
          $httpProvider.interceptors.push(function($q) {
            return {
              requestError(error) {
                savedConfig.url += error;
                return $q.resolve(savedConfig);
              }
            };
          });
          $httpProvider.interceptors.push(function() {
            return {
              responseError(rejection) {
                savedResponse.data += rejection;
                return savedResponse;
              }
            };
          });
          $httpProvider.interceptors.push(function($q) {
            return {
              response(response) {
                response.data += ':1';
                savedResponse = response;
                return $q.reject(':2');
              }
            };
          });
        });
        angular.mock.inject(function($http, $httpBackend, $rootScope) {
          var response;
          $httpBackend.expect('GET', '/url/1/2').respond('response');
          $http({method: 'GET', url: '/url'}).then(function(r) {
            response = r;
          });
          $rootScope.$apply();
          $httpBackend.flush();
          expect(response.data).toEqual('response:1:2');
        });
      });


      it('should verify order of execution', function() {
        angular.mock.module(function($httpProvider) {
          $httpProvider.interceptors.push(function() {
            return {
              request(config) {
                config.url += '/outer';
                return config;
              },
              response(response) {
                response.data = '{' + response.data + '} outer';
                return response;
              }
            };
          });
          $httpProvider.interceptors.push(function() {
            return {
              request(config) {
                config.url += '/inner';
                return config;
              },
              response(response) {
                response.data = '{' + response.data + '} inner';
                return response;
              }
            };
          });
        });
        angular.mock.inject(function($http, $httpBackend) {
          var response;
          $httpBackend.expect('GET', '/url/outer/inner').respond('response');
          $http({method: 'GET', url: '/url'}).then(function(r) {
            response = r;
          });
          $httpBackend.flush();
          expect(response.data).toEqual('{{response} inner} outer');
        });
      });
    });


    describe('request interceptors', function() {
      it('should pass request config as a promise', function() {
        var run = false;
        angular.mock.module(function($httpProvider) {
          $httpProvider.interceptors.push(function() {
            return {
              request(config) {
                expect(config.url).toEqual('/url');
                expect(config.data).toEqual({one: 'two'});
                expect(config.headers.foo).toEqual('bar');
                run = true;
                return config;
              }
            };
          });
        });
        angular.mock.inject(function($http, $httpBackend, $rootScope) {
          $httpBackend.expect('POST', '/url').respond('');
          $http({method: 'POST', url: '/url', data: {one: 'two'}, headers: {foo: 'bar'}});
          $rootScope.$apply();
          expect(run).toEqual(true);
        });
      });

      it('should allow manipulation of request', function() {
        angular.mock.module(function($httpProvider) {
          $httpProvider.interceptors.push(function() {
            return {
              request(config) {
                config.url = '/intercepted';
                config.headers.foo = 'intercepted';
                return config;
              }
            };
          });
        });
        angular.mock.inject(function($http, $httpBackend, $rootScope) {
          $httpBackend.expect('GET', '/intercepted', null, function(headers) {
            return headers.foo === 'intercepted';
          }).respond('');
          $http.get('/url');
          $rootScope.$apply();
        });
      });


      it('should allow replacement of the headers object', function() {
        angular.mock.module(function($httpProvider) {
          $httpProvider.interceptors.push(function() {
            return {
              request(config) {
                config.headers = {foo: 'intercepted'};
                return config;
              }
            };
          });
        });
        angular.mock.inject(function($http, $httpBackend, $rootScope) {
          $httpBackend.expect('GET', '/url', null, function(headers) {
            return angular.equals(headers, {foo: 'intercepted'});
          }).respond('');
          $http.get('/url');
          $rootScope.$apply();
        });
      });

      it('should reject the http promise if an interceptor fails', function() {
        var reason = new Error('interceptor failed');
        angular.mock.module(function($httpProvider) {
          $httpProvider.interceptors.push(function($q) {
            return {
              request() {
                return $q.reject(reason);
              }
            };
          });
        });
        angular.mock.inject(function($http, $httpBackend, $rootScope) {
          var success = jest.fn();
          var error = jest.fn();
          $http.get('/url').then(success, error);
          $rootScope.$apply();
          expect(success).not.toHaveBeenCalled();
          expect(error).toHaveBeenCalledWith(reason);
        });
      });

      it('should not manipulate the passed-in config', function() {
        angular.mock.module(function($httpProvider) {
          $httpProvider.interceptors.push(function() {
            return {
              request(config) {
                config.url = '/intercepted';
                config.headers.foo = 'intercepted';
                return config;
              }
            };
          });
        });
        angular.mock.inject(function($http, $httpBackend, $rootScope) {
          var config = { headers: { foo: 'bar'} };
          var configCopy = angular.copy(config);
          $httpBackend.expect('GET', '/intercepted').respond('');
          $http.get('/url', config);
          $rootScope.$apply();
          expect(config).toEqual(configCopy);
          $httpBackend.expect('POST', '/intercepted').respond('');
          $http.post('/url', {bar: 'baz'}, config);
          $rootScope.$apply();
          expect(config).toEqual(configCopy);
        });
      });

      it('should support interceptors defined as services', function() {
        angular.mock.module(function($provide, $httpProvider) {
          $provide.factory('myInterceptor', function() {
            return {
              request(config) {
                config.url = '/intercepted';
                return config;
              }
            };
          });
          $httpProvider.interceptors.push('myInterceptor');
        });
        angular.mock.inject(function($http, $httpBackend, $rootScope) {
          $httpBackend.expect('POST', '/intercepted').respond('');
          $http.post('/url');
          $rootScope.$apply();
        });
      });

      it('should support complex interceptors based on promises', function() {
        angular.mock.module(function($provide, $httpProvider) {
          $provide.factory('myInterceptor', function($q) {
            return {
              request(config) {
                return $q.resolve('/intercepted').then(function(intercepted) {
                  config.url = intercepted;
                  return config;
                });
              }
            };
          });
          $httpProvider.interceptors.push('myInterceptor');
        });
        angular.mock.inject(function($http, $httpBackend, $rootScope) {
          $httpBackend.expect('POST', '/intercepted').respond('');
          $http.post('/two');
          $rootScope.$apply();
        });
      });
    });
  });


  describe('the instance', function() {
    var $httpBackend;
    var $http;
    var $rootScope;
    var $sce;

    beforeEach(angular.mock.module(function($sceDelegateProvider) {
      // Setup a special whitelisted url that we can use in testing JSONP requests
      $sceDelegateProvider.resourceUrlWhitelist(['http://special.whitelisted.resource.com/**']);
    }));

    beforeEach(angular.mock.inject(['$httpBackend', '$http', '$rootScope', '$sce', function($hb, $h, $rs, $sc) {
      $httpBackend = $hb;
      $http = $h;
      $rootScope = $rs;
      $sce = $sc;
      jest.spyOn($rootScope, '$apply');
    }]));

    it('should throw error if the request configuration is not an object', function() {
      expect(function() {
        $http('/url');
      }).toThrowMinErr('$http','badreq', 'Http request configuration must be an object.  Received: /url');
    });

    it('should throw error if the request configuration url is not a string nor a trusted object', function() {
      expect(function() {
        $http({url: false});
      }).toThrowMinErr('$http','badreq', 'Http request configuration url must be a string or a $sce trusted object.  Received: false');
      expect(function() {
        $http({url: null});
      }).toThrowMinErr('$http','badreq', 'Http request configuration url must be a string or a $sce trusted object.  Received: null');
      expect(function() {
        $http({url: 42});
      }).toThrowMinErr('$http','badreq', 'Http request configuration url must be a string or a $sce trusted object.  Received: 42');
      expect(function() {
        $http({});
      }).toThrowMinErr('$http','badreq', 'Http request configuration url must be a string or a $sce trusted object.  Received: undefined');
    });

    it('should accept a $sce trusted object for the request configuration url', function() {
      $httpBackend.expect('GET', '/url').respond('');
      $http({url: $sce.trustAsResourceUrl('/url')});
    });

    it('should send GET requests if no method specified', function() {
      $httpBackend.expect('GET', '/url').respond('');
      $http({url: '/url'});
    });

    it('should do basic request', function() {
      $httpBackend.expect('GET', '/url').respond('');
      $http({url: '/url', method: 'GET'});
    });


    it('should pass data if specified', function() {
      $httpBackend.expect('POST', '/url', 'some-data').respond('');
      $http({url: '/url', method: 'POST', data: 'some-data'});
    });


    describe('params', function() {
      it('should do basic request with params and encode', function() {
        $httpBackend.expect('GET', '/url?a%3D=%3F%26&b=2').respond('');
        $http({url: '/url', params: {'a=':'?&', b:2}, method: 'GET'});
      });


      it('should merge params if url contains some already', function() {
        $httpBackend.expect('GET', '/url?c=3&a=1&b=2').respond('');
        $http({url: '/url?c=3', params: {a:1, b:2}, method: 'GET'});
      });


      it('should jsonify objects in params map', function() {
        $httpBackend.expect('GET', '/url?a=1&b=%7B%22c%22:3%7D').respond('');
        $http({url: '/url', params: {a:1, b:{c:3}}, method: 'GET'});
      });


      it('should expand arrays in params map', function() {
        $httpBackend.expect('GET', '/url?a=1&a=2&a=3').respond('');
        $http({url: '/url', params: {a: [1,2,3]}, method: 'GET'});
      });


      it('should not encode @ in url params', function() {
        //encodeURIComponent is too aggressive and doesn't follow http://www.ietf.org/rfc/rfc3986.txt
        //with regards to the character set (pchar) allowed in path segments
        //so we need this test to make sure that we don't over-encode the params and break stuff
        //like buzz api which uses @self

        $httpBackend.expect('GET', '/Path?!do%26h=g%3Da+h&:bar=$baz@1').respond('');
        $http({url: '/Path', params: {':bar': '$baz@1', '!do&h': 'g=a h'}, method: 'GET'});
      });

      it('should not add question mark when params is empty', function() {
        $httpBackend.expect('GET', '/url').respond('');
        $http({url: '/url', params: {}, method: 'GET'});
      });

      it('should not double quote dates', function() {
        $httpBackend.expect('GET', '/url?date=2014-07-15T17:30:00.000Z').respond('');
        $http({url: '/url', params: {date:new Date('2014-07-15T17:30:00.000Z')}, method: 'GET'});
      });


      describe('custom params serialization', function() {

        it('should allow specifying custom paramSerializer as function', function() {
          $httpBackend.expect('GET', '/url?foo_bar').respond('');
          $http({url: '/url', params: {foo: 'fooVal', bar: 'barVal'}, paramSerializer: customParamSerializer});
        });

        it('should allow specifying custom paramSerializer as function from DI', function() {
          $httpBackend.expect('GET', '/url?foo_bar').respond('');
          $http({url: '/url', params: {foo: 'fooVal', bar: 'barVal'}, paramSerializer: 'customParamSerializer'});
        });
      });
    });


    describe('callbacks', function() {

      it('should pass in the response object when a request is successful', function() {
        $httpBackend.expect('GET', '/url').respond(207, 'my content', {'content-encoding': 'smurf'});
        $http({url: '/url', method: 'GET'}).then(function(response) {
          expect(response.data).toBe('my content');
          expect(response.status).toBe(207);
          expect(response.headers()).toEqual(angular.extend(Object.create(null), {'content-encoding': 'smurf'}));
          expect(response.config.url).toBe('/url');
          callback();
        });

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
      });


      it('should pass statusText in response object when a request is successful', function() {
        $httpBackend.expect('GET', '/url').respond(200, 'SUCCESS', {}, 'OK');
        $http({url: '/url', method: 'GET'}).then(function(response) {
          expect(response.statusText).toBe('OK');
          callback();
        });

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
      });


      it('should pass statusText in response object when a request fails', function() {
        $httpBackend.expect('GET', '/url').respond(404, 'ERROR', {}, 'Not Found');
        $http({url: '/url', method: 'GET'}).then(null, function(response) {
          expect(response.statusText).toBe('Not Found');
          callback();
        });

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should pass xhrStatus in response object when a request is successful', function() {
        $httpBackend.expect('GET', '/url').respond(200, 'SUCCESS', {}, 'OK');
        $http({url: '/url', method: 'GET'}).then(function(response) {
          expect(response.xhrStatus).toBe('complete');
          callback();
        });

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should pass xhrStatus in response object when a request fails', function() {
        $httpBackend.expect('GET', '/url').respond(404, 'ERROR', {}, 'Not Found');
        $http({url: '/url', method: 'GET'}).then(null, function(response) {
          expect(response.xhrStatus).toBe('complete');
          callback();
        });

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
      });


      it('should pass in the response object when a request failed', function() {
        $httpBackend.expect('GET', '/url').respond(543, 'bad error', {'request-id': '123'});
        $http({url: '/url', method: 'GET'}).then(null, function(response) {
          expect(response.data).toBe('bad error');
          expect(response.status).toBe(543);
          expect(response.headers()).toEqual(angular.extend(Object.create(null), {'request-id': '123'}));
          expect(response.config.url).toBe('/url');
          callback();
        });

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });


    describe('response headers', function() {

      it('should return single header', function() {
        $httpBackend.expect('GET', '/url').respond('', {'date': 'date-val'});
        callback.mockImplementation(function(r) {
          expect(r.headers('date')).toBe('date-val');
        });

        $http({url: '/url', method: 'GET'}).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledTimes(1);
      });


      it('should return null when single header does not exist', function() {
        $httpBackend.expect('GET', '/url').respond('', {'Some-Header': 'Fake'});
        callback.mockImplementation(function(r) {
          r.headers(); // we need that to get headers parsed first
          expect(r.headers('nothing')).toBe(null);
        });

        $http({url: '/url', method: 'GET'}).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledTimes(1);
      });


      it('should return all headers as object', function() {
        $httpBackend.expect('GET', '/url').respond('', {
          'content-encoding': 'gzip',
          'server': 'Apache'
        });

        callback.mockImplementation(function(r) {
          expect(r.headers()).toEqual(angular.extend(Object.create(null), {'content-encoding': 'gzip', 'server': 'Apache'}));
        });

        $http({url: '/url', method: 'GET'}).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledTimes(1);
      });


      it('should return empty object for jsonp request', function() {
        callback.mockImplementation(function(r) {
          expect(r.headers()).toEqual(Object.create(null));
        });

        $httpBackend.expect('JSONP', '/some?callback=JSON_CALLBACK').respond(200);
        $http({url: $sce.trustAsResourceUrl('/some'), method: 'JSONP'}).then(callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });


    describe('response headers parser', function() {
      it('should parse basic', function() {
        var parsed = ngInternals.parseHeaders(
            'date: Thu, 04 Aug 2011 20:23:08 GMT\n' +
            'content-encoding: gzip\n' +
            'transfer-encoding: chunked\n' +
            'x-cache-info: not cacheable; response has already expired, not cacheable; response has already expired\n' +
            'connection: Keep-Alive\n' +
            'x-backend-server: pm-dekiwiki03\n' +
            'pragma: no-cache\n' +
            'server: Apache\n' +
            'x-frame-options: DENY\n' +
            'content-type: text/html; charset=utf-8\n' +
            'vary: Cookie, Accept-Encoding\n' +
            'keep-alive: timeout=5, max=1000\n' +
            'expires: Thu: , 19 Nov 1981 08:52:00 GMT\n');

        expect(parsed['date']).toBe('Thu, 04 Aug 2011 20:23:08 GMT');
        expect(parsed['content-encoding']).toBe('gzip');
        expect(parsed['transfer-encoding']).toBe('chunked');
        expect(parsed['keep-alive']).toBe('timeout=5, max=1000');
      });


      it('should parse lines without space after colon', function() {
        expect(ngInternals.parseHeaders('key:value').key).toBe('value');
      });


      it('should trim the values', function() {
        expect(ngInternals.parseHeaders('key:    value ').key).toBe('value');
      });


      it('should allow headers without value', function() {
        expect(ngInternals.parseHeaders('key:').key).toBe('');
      });


      it('should merge headers with same key', function() {
        expect(ngInternals.parseHeaders('key: a\nkey:b\n').key).toBe('a, b');
      });


      it('should normalize keys to lower case', function() {
        expect(ngInternals.parseHeaders('KeY: value').key).toBe('value');
      });


      it('should parse CRLF as delimiter', function() {
        // IE does use CRLF
        expect(ngInternals.parseHeaders('a: b\r\nc: d\r\n')).toEqual(angular.extend(Object.create(null), {a: 'b', c: 'd'}));
        expect(ngInternals.parseHeaders('a: b\r\nc: d\r\n').a).toBe('b');
      });


      it('should parse tab after semi-colon', function() {
        expect(ngInternals.parseHeaders('a:\tbb').a).toBe('bb');
        expect(ngInternals.parseHeaders('a: \tbb').a).toBe('bb');
      });

      it('should parse multiple values for the same header', function() {
        expect(ngInternals.parseHeaders('key:value1\nkey:value2').key).toBe('value1, value2');
      });
    });


    describe('request headers', function() {

      it('should send custom headers', function() {
        $httpBackend.expect('GET', '/url', undefined, function(headers) {
          return headers['Custom'] === 'header';
        }).respond('');

        $http({url: '/url', method: 'GET', headers: {
          'Custom': 'header'
        }});

        $httpBackend.flush();
      });


      it('should set default headers for GET request', function() {
        $httpBackend.expect('GET', '/url', undefined, function(headers) {
          return headers['Accept'] === 'application/json, text/plain, */*';
        }).respond('');

        $http({url: '/url', method: 'GET', headers: {}});
        $httpBackend.flush();
      });


      it('should set default headers for POST request', function() {
        $httpBackend.expect('POST', '/url', 'messageBody', function(headers) {
          return headers['Accept'] === 'application/json, text/plain, */*' &&
                 headers['Content-Type'] === 'application/json;charset=utf-8';
        }).respond('');

        $http({url: '/url', method: 'POST', headers: {}, data: 'messageBody'});
        $httpBackend.flush();
      });


      it('should set default headers for PUT request', function() {
        $httpBackend.expect('PUT', '/url', 'messageBody', function(headers) {
          return headers['Accept'] === 'application/json, text/plain, */*' &&
                 headers['Content-Type'] === 'application/json;charset=utf-8';
        }).respond('');

        $http({url: '/url', method: 'PUT', headers: {}, data: 'messageBody'});
        $httpBackend.flush();
      });

      it('should set default headers for PATCH request', function() {
        $httpBackend.expect('PATCH', '/url', 'messageBody', function(headers) {
          return headers['Accept'] === 'application/json, text/plain, */*' &&
                 headers['Content-Type'] === 'application/json;charset=utf-8';
        }).respond('');

        $http({url: '/url', method: 'PATCH', headers: {}, data: 'messageBody'});
        $httpBackend.flush();
      });

      it('should set default headers for custom HTTP method', function() {
        $httpBackend.expect('FOO', '/url', undefined, function(headers) {
          return headers['Accept'] === 'application/json, text/plain, */*';
        }).respond('');

        $http({url: '/url', method: 'FOO', headers: {}});
        $httpBackend.flush();
      });


      it('should override default headers with custom', function() {
        $httpBackend.expect('POST', '/url', 'messageBody', function(headers) {
          return headers['Accept'] === 'Rewritten' &&
                 headers['Content-Type'] === 'Rewritten';
        }).respond('');

        $http({url: '/url', method: 'POST', data: 'messageBody', headers: {
          'Accept': 'Rewritten',
          'Content-Type': 'Rewritten'
        }});
        $httpBackend.flush();
      });

      it('should delete default headers if custom header function returns null', function() {

        $httpBackend.expect('POST', '/url', 'messageBody', function(headers) {
          return !('Accept' in headers);
        }).respond('');

        $http({url: '/url', method: 'POST', data: 'messageBody', headers: {
          'Accept': function() { return null; }
        }});
        $httpBackend.flush();
      });

      it('should override default headers with custom in a case insensitive manner', function() {
        $httpBackend.expect('POST', '/url', 'messageBody', function(headers) {
          return headers['accept'] === 'Rewritten' &&
                 headers['content-type'] === 'Content-Type Rewritten' &&
                 angular.isUndefined(headers['Accept']) &&
                 angular.isUndefined(headers['Content-Type']);
        }).respond('');

        $http({url: '/url', method: 'POST', data: 'messageBody', headers: {
          'accept': 'Rewritten',
          'content-type': 'Content-Type Rewritten'
        }});
        $httpBackend.flush();
      });

      it('should not send Content-Type header if request data/body is undefined', function() {
        $httpBackend.expect('POST', '/url', undefined, function(headers) {
          return !headers.hasOwnProperty('Content-Type');
        }).respond('');

        $httpBackend.expect('POST', '/url2', undefined, function(headers) {
          return !headers.hasOwnProperty('content-type');
        }).respond('');

        $http({url: '/url', method: 'POST'});
        $http({url: '/url2', method: 'POST', headers: {'content-type': 'Rewritten'}});
        $httpBackend.flush();
      });

      it('should NOT delete Content-Type header if request data/body is set by request transform', function() {
        $httpBackend.expect('POST', '/url', {'one': 'two'}, function(headers) {
          return headers['Content-Type'] === 'application/json;charset=utf-8';
        }).respond('');

        $http({
          url: '/url',
          method: 'POST',
          transformRequest(data) {
            data = {'one': 'two'};
            return data;
          }
        });

        $httpBackend.flush();
      });

      it('should send execute result if header value is function', function() {
        var headerConfig = {'Accept': function() { return 'Rewritten'; }};

        function checkHeaders(headers) {
          return headers['Accept'] === 'Rewritten';
        }

        $httpBackend.expect('GET', '/url', undefined, checkHeaders).respond('');
        $httpBackend.expect('POST', '/url', undefined, checkHeaders).respond('');
        $httpBackend.expect('PUT', '/url', undefined, checkHeaders).respond('');
        $httpBackend.expect('PATCH', '/url', undefined, checkHeaders).respond('');
        $httpBackend.expect('DELETE', '/url', undefined, checkHeaders).respond('');

        $http({url: '/url', method: 'GET', headers: headerConfig});
        $http({url: '/url', method: 'POST', headers: headerConfig});
        $http({url: '/url', method: 'PUT', headers: headerConfig});
        $http({url: '/url', method: 'PATCH', headers: headerConfig});
        $http({url: '/url', method: 'DELETE', headers: headerConfig});

        $httpBackend.flush();
      });

      it('should expose a config object to header functions', function() {
        var config = {
          foo: 'Rewritten',
          headers: {'Accept': function(config) {
            return config.foo;
          }}
        };

        $httpBackend.expect('GET', '/url', undefined, {Accept: 'Rewritten'}).respond('');
        $http.get('/url', config);
        $httpBackend.flush();
      });

      it('should not allow modifications to a config object in header functions', function() {
        var config = {
          headers: {'Accept': function(config) {
            config.foo = 'bar';
            return 'Rewritten';
          }}
        };

        $httpBackend.expect('GET', '/url', undefined, {Accept: 'Rewritten'}).respond('');
        $http.get('/url', config);
        $httpBackend.flush();

        expect(config.foo).toBeUndefined();
      });
    });


    describe('short methods', function() {

      function checkHeader(name, value) {
        return function(headers) {
          return headers[name] === value;
        };
      }

      it('should have get()', function() {
        $httpBackend.expect('GET', '/url').respond('');
        $http.get('/url');
      });


      it('get() should allow config param', function() {
        $httpBackend.expect('GET', '/url', undefined, checkHeader('Custom', 'Header')).respond('');
        $http.get('/url', {headers: {'Custom': 'Header'}});
      });


      it('should handle empty response header', function() {
       $httpBackend.expect('GET', '/url', undefined)
           .respond(200, '', { 'Custom-Empty-Response-Header': '', 'Constructor': '' });
       $http.get('/url').then(callback);
       $httpBackend.flush();
       expect(callback).toHaveBeenCalledTimes(1);
       var headers = callback.mock.calls[callback.mock.calls.length - 1][0].headers;
       expect(headers('custom-empty-response-Header')).toEqual('');
       expect(headers('ToString')).toBe(null);
       expect(headers('Constructor')).toBe('');
     });

      it('should have delete()', function() {
        $httpBackend.expect('DELETE', '/url').respond('');
        $http['delete']('/url');
      });


      it('delete() should allow config param', function() {
        $httpBackend.expect('DELETE', '/url', undefined, checkHeader('Custom', 'Header')).respond('');
        $http['delete']('/url', {headers: {'Custom': 'Header'}});
      });


      it('should have head()', function() {
        $httpBackend.expect('HEAD', '/url').respond('');
        $http.head('/url');
      });


      it('head() should allow config param', function() {
        $httpBackend.expect('HEAD', '/url', undefined, checkHeader('Custom', 'Header')).respond('');
        $http.head('/url', {headers: {'Custom': 'Header'}});
      });


      it('should have post()', function() {
        $httpBackend.expect('POST', '/url', 'some-data').respond('');
        $http.post('/url', 'some-data');
      });


      it('post() should allow config param', function() {
        $httpBackend.expect('POST', '/url', 'some-data', checkHeader('Custom', 'Header')).respond('');
        $http.post('/url', 'some-data', {headers: {'Custom': 'Header'}});
      });


      it('should have put()', function() {
        $httpBackend.expect('PUT', '/url', 'some-data').respond('');
        $http.put('/url', 'some-data');
      });


      it('put() should allow config param', function() {
        $httpBackend.expect('PUT', '/url', 'some-data', checkHeader('Custom', 'Header')).respond('');
        $http.put('/url', 'some-data', {headers: {'Custom': 'Header'}});
      });

      it('should have patch()', function() {
        $httpBackend.expect('PATCH', '/url', 'some-data').respond('');
        $http.patch('/url', 'some-data');
      });

      it('patch() should allow config param', function() {
        $httpBackend.expect('PATCH', '/url', 'some-data', checkHeader('Custom', 'Header')).respond('');
        $http.patch('/url', 'some-data', {headers: {'Custom': 'Header'}});
      });

      it('should have jsonp()', function() {
        $httpBackend.expect('JSONP', '/url?callback=JSON_CALLBACK').respond('');
        $http.jsonp($sce.trustAsResourceUrl('/url'));
      });


      it('jsonp() should allow config param', function() {
        $httpBackend.expect('JSONP', '/url?callback=JSON_CALLBACK', undefined, checkHeader('Custom', 'Header')).respond('');
        $http.jsonp($sce.trustAsResourceUrl('/url'), {headers: {'Custom': 'Header'}});
      });
    });

    describe('jsonp trust', function() {
      it('should throw error if the url is not a trusted resource', function() {
        var error;
        $http({method: 'JSONP', url: 'http://example.org/path'})
              .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$sce', 'insecurl');
      });

      it('should accept an explicitly trusted resource url', function() {
        $httpBackend.expect('JSONP', 'http://example.org/path?callback=JSON_CALLBACK').respond('');
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path')});
      });

      it('jsonp() should accept explicitly trusted urls', function() {
        $httpBackend.expect('JSONP', '/url?callback=JSON_CALLBACK').respond('');
        $http({method: 'JSONP', url: $sce.trustAsResourceUrl('/url')});

        $httpBackend.expect('JSONP', '/url?a=b&callback=JSON_CALLBACK').respond('');
        $http({method: 'JSONP', url: $sce.trustAsResourceUrl('/url'), params: {a: 'b'}});
      });

      it('should error if the URL contains more than one `?` query indicator', function() {
        var error;
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path?a=b?c=d')})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');
      });

      it('should error if the URL contains a JSON_CALLBACK parameter', function() {
        var error;
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path?callback=JSON_CALLBACK')})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');

        error = undefined;
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path?callback=JSON_C%41LLBACK')})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');

        error = undefined;
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path?other=JSON_CALLBACK')})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');

        error = undefined;
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path?other=JSON_C%41LLBACK')})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');
      });

      it('should error if a param contains a JSON_CALLBACK value', function() {
        var error;
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path'), params: {callback: 'JSON_CALLBACK'}})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');

        error = undefined;
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path'), params: {other: 'JSON_CALLBACK'}})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');
      });

      it('should allow encoded params that look like they contain the value JSON_CALLBACK or the configured callback key', function() {
        var error;
        error = undefined;
        $httpBackend.expect('JSONP', 'http://example.org/path?other=JSON_C%2541LLBACK&callback=JSON_CALLBACK').respond('');
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path'), params: {other: 'JSON_C%41LLBACK'}})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toBeUndefined();

        error = undefined;
        $httpBackend.expect('JSONP', 'http://example.org/path?c%2561llback=evilThing&callback=JSON_CALLBACK').respond('');
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path'), params: {'c%61llback': 'evilThing'}})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toBeUndefined();
      });

      it('should error if there is already a param matching the jsonpCallbackParam key', function() {
        var error;
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path'), params: {callback: 'evilThing'}})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');

        error = undefined;
        $http({ method: 'JSONP', url: $sce.trustAsResourceUrl('http://example.org/path?c%61llback=evilThing')})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');

        error = undefined;
        $http({ method: 'JSONP', jsonpCallbackParam: 'cb', url: $sce.trustAsResourceUrl('http://example.org/path'), params: {cb: 'evilThing'}})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');

        error = undefined;
        $http({ method: 'JSONP', jsonpCallbackParam: 'cb', url: $sce.trustAsResourceUrl('http://example.org/path?c%62=evilThing')})
            .catch(function(e) { error = e; });
        $rootScope.$digest();
        expect(error).toEqualMinErr('$http', 'badjsonp');
      });
    });

    describe('callbacks', function() {

      it('should $apply after success callback', function() {
        $httpBackend.when('GET').respond(200);
        $http({method: 'GET', url: '/some'});
        $httpBackend.flush();
        expect($rootScope.$apply).toHaveBeenCalledTimes(1);
      });


      it('should $apply after error callback', function() {
        $httpBackend.when('GET').respond(404);
        $http({method: 'GET', url: '/some'}).catch(angular.noop);
        $httpBackend.flush();
        expect($rootScope.$apply).toHaveBeenCalledTimes(1);
      });


      it('should $apply even if exception thrown during callback', angular.mock.inject(function($exceptionHandler) {
        $httpBackend.when('GET').respond(200);
        callback.mockImplementation(() => { throw 'error in callback' })

        $http({method: 'GET', url: '/some'}).then(callback);
        $httpBackend.flush();
        expect($rootScope.$apply).toHaveBeenCalledTimes(1);

        $exceptionHandler.errors = [];
      }));


      it('should pass the event handlers through to the backend', function() {
        var progressFn = jest.fn();
        var uploadProgressFn = jest.fn();
        $httpBackend.when('GET').respond(200);
        $http({
          method: 'GET',
          url: '/some',
          eventHandlers: {progress: progressFn},
          uploadEventHandlers: {progress: uploadProgressFn}
        });
        $rootScope.$apply();
        var mockXHR = angular.mock.MockXhr.$$lastInstance;
        expect(mockXHR.$$events.progress).toEqual(expect.any(Function));
        expect(mockXHR.upload.$$events.progress).toEqual(expect.any(Function));

        var eventObj = {};
        jest.spyOn($rootScope, '$digest').mockImplementation(() => {});

        mockXHR.$$events.progress(eventObj);
        expect(progressFn).toHaveBeenCalledOnceWith(eventObj);
        expect($rootScope.$digest).toHaveBeenCalledTimes(1);

        mockXHR.upload.$$events.progress(eventObj);
        expect(uploadProgressFn).toHaveBeenCalledOnceWith(eventObj);
        expect($rootScope.$digest).toHaveBeenCalledTimes(2);
      });
    });


    describe('transformData', function() {

      describe('request', function() {

        describe('default', function() {

          it('should transform object into json', function() {
            $httpBackend.expect('POST', '/url', '{"one":"two"}').respond('');
            $http({method: 'POST', url: '/url', data: {one: 'two'}});
          });


          it('should transform object with date into json', function() {
            $httpBackend.expect('POST', '/url', {'date': new Date(Date.UTC(2013, 11, 25))}).respond('');
            $http({method: 'POST', url: '/url', data: {date: new Date(Date.UTC(2013, 11, 25))}});
          });


          it('should ignore strings', function() {
            $httpBackend.expect('POST', '/url', 'string-data').respond('');
            $http({method: 'POST', url: '/url', data: 'string-data'});
          });


          it('should ignore File objects', function() {
            var file = new File([], "");

            $httpBackend.expect('POST', '/some', '[object File]').respond('');
            $http({method: 'POST', url: '/some', data: file});
          });
        });


        it('should ignore Blob objects', function() {
          // eslint-disable-next-line no-undef
          var blob = new Blob(['blob!'], { type: 'text/plain' });

          $httpBackend.expect('POST', '/url', '[object Blob]').respond('');
          $http({ method: 'POST', url: '/url', data: blob });
        });

        it('should ignore FormData objects', function() {
          if (!window.FormData) return;

          // eslint-disable-next-line no-undef
          var formData = new FormData();
          formData.append('angular', 'is great');

          $httpBackend.expect('POST', '/url', '[object FormData]').respond('');
          $http({ method: 'POST', url: '/url', data: formData });
        });

        it('should have access to request headers', function() {
          $httpBackend.expect('POST', '/url', 'header1').respond(200);
          $http.post('/url', 'req', {
            headers: {h1: 'header1'},
            transformRequest(data, headers) {
              return headers('h1');
            }
          }).then(callback);
          $httpBackend.flush();

          expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should have access to request headers with mixed case', function() {
          $httpBackend.expect('POST', '/url', 'header1').respond(200);
          $http.post('/url', 'req', {
            headers: {H1: 'header1'},
            transformRequest(data, headers) {
              return headers('H1');
            }
          }).then(callback);
          $httpBackend.flush();

          expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should not allow modifications to headers in a transform functions', function() {
          var config = {
            headers: {'Accept': 'bar'},
            transformRequest(data, headers) {
              angular.extend(headers(), {
                'Accept': 'foo'
              });
            }
          };

          $httpBackend.expect('GET', '/url', undefined, {Accept: 'bar'}).respond(200);
          $http.get('/url', config).then(callback);
          $httpBackend.flush();

          expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should pipeline more functions', function() {
          function first(d, h) {return d + '-first:' + h('h1');}
          function second(d) {return angular.uppercase(d);}

          $httpBackend.expect('POST', '/url', 'REQ-FIRST:V1').respond(200);
          $http.post('/url', 'req', {
            headers: {h1: 'v1'},
            transformRequest: [first, second]
          }).then(callback);
          $httpBackend.flush();

          expect(callback).toHaveBeenCalledTimes(1);
        });
      });


      describe('response', function() {

        describe('default', function() {

          it('should deserialize json objects', function() {
            $httpBackend.expect('GET', '/url').respond('{"foo":"bar","baz":23}');
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual({foo: 'bar', baz: 23});
          });


          it('should deserialize json arrays', function() {
            $httpBackend.expect('GET', '/url').respond('[1, "abc", {"foo":"bar"}]');
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual([1, 'abc', {foo: 'bar'}]);
          });


          it('should ignore leading/trailing whitespace', function() {
            $httpBackend.expect('GET', '/url').respond('  \n  {"foo":"bar","baz":23}  \r\n  \n  ');
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual({foo: 'bar', baz: 23});
          });


          it('should deserialize json numbers when response header contains application/json',
              function() {
            $httpBackend.expect('GET', '/url').respond('123', {'Content-Type': 'application/json'});
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual(123);
          });


          it('should deserialize json strings when response header contains application/json',
              function() {
            $httpBackend.expect('GET', '/url').respond('"asdf"', {'Content-Type': 'application/json'});
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual('asdf');
          });


          it('should deserialize json nulls when response header contains application/json',
              function() {
            $httpBackend.expect('GET', '/url').respond('null', {'Content-Type': 'application/json'});
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual(null);
          });


          it('should deserialize json true when response header contains application/json',
              function() {
            $httpBackend.expect('GET', '/url').respond('true', {'Content-Type': 'application/json'});
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual(true);
          });


          it('should deserialize json false when response header contains application/json',
              function() {
            $httpBackend.expect('GET', '/url').respond('false', {'Content-Type': 'application/json'});
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual(false);
          });


          it('should deserialize json empty string when response header contains application/json',
              function() {
            $httpBackend.expect('GET', '/url').respond('""', {'Content-Type': 'application/json'});
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual('');
          });


          it('should deserialize json with security prefix', function() {
            $httpBackend.expect('GET', '/url').respond(')]}\',\n[1, "abc", {"foo":"bar"}]');
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual([1, 'abc', {foo:'bar'}]);
          });


          it('should deserialize json with security prefix ")]}\'"', function() {
            $httpBackend.expect('GET', '/url').respond(')]}\'\n\n[1, "abc", {"foo":"bar"}]');
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual([1, 'abc', {foo:'bar'}]);
          });


          it('should retain security prefix if response is not json', function() {
            $httpBackend.expect('GET', '/url').respond(')]}\',\n This is not JSON !');
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual(')]}\',\n This is not JSON !');
          });


          it('should not attempt to deserialize json when HEAD request', function() {
            //per http spec for Content-Type, HEAD request should return a Content-Type header
            //set to what the content type would have been if a get was sent
            $httpBackend.expect('HEAD', '/url').respond('', {'Content-Type': 'application/json'});
            $http({method: 'HEAD', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual('');
          });

          it('should not attempt to deserialize json for an empty response whose header contains application/json', function() {
            //per http spec for Content-Type, HEAD request should return a Content-Type header
            //set to what the content type would have been if a get was sent
            $httpBackend.expect('GET', '/url').respond('', {'Content-Type': 'application/json'});
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual('');
          });

          it('should not attempt to deserialize json for a blank response whose header contains application/json', function() {
            //per http spec for Content-Type, HEAD request should return a Content-Type header
            //set to what the content type would have been if a get was sent
            $httpBackend.expect('GET', '/url').respond(' ', {'Content-Type': 'application/json'});
            $http({method: 'GET', url: '/url'}).then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual(' ');
          });

          it('should not deserialize tpl beginning with ng expression', function() {
            $httpBackend.expect('GET', '/url').respond('{{some}}');
            $http.get('/url').then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toEqual('{{some}}');
          });

          it('should not deserialize json when the opening and closing brackets do not match',
            function() {
              $httpBackend.expect('GET', '/url1').respond('[Code](url): function() {}');
              $httpBackend.expect('GET', '/url2').respond('{"is": "not"} ["json"]');
              $http.get('/url1').then(callback);
              $http.get('/url2').then(callback);
              $httpBackend.flush();

              expect(callback).toHaveBeenCalledTimes(2);
              expect(callback.mock.calls[0][0].data).toEqual('[Code](url): function() {}');
              expect(callback.mock.calls[1][0].data).toEqual('{"is": "not"} ["json"]');
            }
          );

          it('should return JSON data with error message if JSON is invalid', function() {
            var errCallback = jest.fn();
            $httpBackend.expect('GET', '/url').respond('{abcd}', {'Content-Type': 'application/json'});
            $http.get('/url').then(callback).catch(errCallback);
            $httpBackend.flush();

            expect(callback).not.toHaveBeenCalled();
            expect(errCallback).toHaveBeenCalledTimes(1);
            expect(errCallback.mock.calls[errCallback.mock.calls.length - 1][0]).toEqualMinErr('$http', 'baddata');
          });

          it('should not throw an error if JSON is invalid but content-type is not application/json', function() {
            $httpBackend.expect('GET', '/url').respond('{abcd}', {'Content-Type': 'text/plain'});

            $http.get('/url').then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
          });

          it('should not throw an error if JSON is invalid but content-type is not specified', function() {
            $httpBackend.expect('GET', '/url').respond('{abcd}');

            $http.get('/url').then(callback);
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledTimes(1);
          });

          it('should return response unprocessed if JSON is invalid but content-type is not application/json', function() {
            var response = '{abcd}';
            $httpBackend.expect('GET', '/url').respond(response, {'Content-Type': 'text/plain'});

            $http.get('/url').then(callback);
            $httpBackend.flush();

            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe(response);
          });

          it('should return response unprocessed if JSON is invalid but content-type is not specified', function() {
            var response = '{abcd}';
            $httpBackend.expect('GET', '/url').respond(response);

            $http.get('/url').then(callback);
            $httpBackend.flush();

            expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe(response);
          });

        });

        it('should have access to response headers', function() {
          $httpBackend.expect('GET', '/url').respond(200, 'response', {h1: 'header1'});
          $http.get('/url', {
            transformResponse(data, headers) {
              return headers('h1');
            }
          }).then(callback);
          $httpBackend.flush();

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('header1');
        });

        it('should have access to response status', function() {
          $httpBackend.expect('GET', '/url').respond(200, 'response', {h1: 'header1'});
          $http.get('/url', {
            transformResponse(data, headers, status) {
              return status;
            }
          }).then(callback);
          $httpBackend.flush();

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe(200);
        });


        it('should pipeline more functions', function() {
          function first(d, h) {return d + '-first:' + h('h1');}
          function second(d) {return angular.uppercase(d);}

          $httpBackend.expect('POST', '/url').respond(200, 'resp', {h1: 'v1'});
          $http.post('/url', '', {transformResponse: [first, second]}).then(callback);
          $httpBackend.flush();

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('RESP-FIRST:V1');
        });


        it('should apply `transformResponse` even if the response data is empty', function() {
          var callback = jest.fn();
          var config = {transformResponse: callback};

          $httpBackend.expect('GET', '/url1').respond(200, undefined);
          $httpBackend.expect('GET', '/url2').respond(200, null);
          $httpBackend.expect('GET', '/url3').respond(200, '');
          $http.get('/url1', config);
          $http.get('/url2', config);
          $http.get('/url3', config);
          $httpBackend.flush();

          expect(callback).toHaveBeenCalledTimes(3);
          expect(callback.mock.calls[0][0]).toBeUndefined();
          expect(callback.mock.calls[1][0]).toBe(null);
          expect(callback.mock.calls[2][0]).toBe('');
        });
      });
    });


    describe('cache', function() {

      var cache;

      beforeEach(angular.mock.inject(function($cacheFactory) {
        cache = $cacheFactory('testCache');
      }));


      function doFirstCacheRequest(method, respStatus, headers) {
        $httpBackend.expect(method || 'GET', '/url').respond(respStatus || 200, 'content', headers);
        $http({method: method || 'GET', url: '/url', cache: cache}).catch(angular.noop);
        $httpBackend.flush();
      }


      it('should cache GET request when cache is provided', angular.mock.inject(function($rootScope) {
        doFirstCacheRequest();

        $http({method: 'get', url: '/url', cache: cache}).then(callback);
        $rootScope.$digest();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('content');
      }));

      it('should cache JSONP request when cache is provided', angular.mock.inject(function($rootScope) {
        $httpBackend.expect('JSONP', '/url?callback=JSON_CALLBACK').respond('content');
        $http({method: 'JSONP', url: $sce.trustAsResourceUrl('/url'), cache: cache});
        $httpBackend.flush();

        $http({method: 'JSONP', url: $sce.trustAsResourceUrl('/url'), cache: cache}).then(callback);
        $rootScope.$digest();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('content');
      }));

      it('should cache request when cache is provided and no method specified', function() {
        doFirstCacheRequest();

        $http({url: '/url', cache: cache}).then(callback);
        $rootScope.$digest();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('content');
      });


      it('should not cache when cache is not provided', function() {
        doFirstCacheRequest();

        $httpBackend.expect('GET', '/url').respond();
        $http({method: 'GET', url: '/url'});
      });


      it('should perform request when cache cleared', function() {
        doFirstCacheRequest();

        cache.removeAll();
        $httpBackend.expect('GET', '/url').respond();
        $http({method: 'GET', url: '/url', cache: cache});
      });


      it('should always call callback asynchronously', function() {
        doFirstCacheRequest();
        $http({method: 'get', url: '/url', cache: cache}).then(callback);

        expect(callback).not.toHaveBeenCalled();
      });


      it('should not cache POST request', function() {
        doFirstCacheRequest('POST');

        $httpBackend.expect('POST', '/url').respond('content2');
        $http({method: 'POST', url: '/url', cache: cache}).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('content2');
      });


      it('should not cache PUT request', function() {
        doFirstCacheRequest('PUT');

        $httpBackend.expect('PUT', '/url').respond('content2');
        $http({method: 'PUT', url: '/url', cache: cache}).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('content2');
      });


      it('should not cache DELETE request', function() {
        doFirstCacheRequest('DELETE');

        $httpBackend.expect('DELETE', '/url').respond(206);
        $http({method: 'DELETE', url: '/url', cache: cache}).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledTimes(1);
      });


      it('should not cache non 2xx responses', function() {
        doFirstCacheRequest('GET', 404);

        $httpBackend.expect('GET', '/url').respond('content2');
        $http({method: 'GET', url: '/url', cache: cache}).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('content2');
      });


      it('should cache the headers as well', angular.mock.inject(function($rootScope) {
        doFirstCacheRequest('GET', 200, {'content-encoding': 'gzip', 'server': 'Apache'});
        callback.mockImplementation(function(response) {
          expect(response.headers()).toEqual(angular.extend(Object.create(null), {
            'content-encoding': 'gzip',
            'server': 'Apache'
          }));
          expect(response.headers('server')).toBe('Apache');
        });

        $http({method: 'GET', url: '/url', cache: cache}).then(callback);
        $rootScope.$digest();
        expect(callback).toHaveBeenCalledTimes(1);
      }));


      it('should not share the cached headers object instance', angular.mock.inject(function($rootScope) {
        doFirstCacheRequest('GET', 200, {'content-encoding': 'gzip', 'server': 'Apache'});
        callback.mockImplementation(function(response) {
          expect(response.headers()).toEqual(cache.get('/url')[2]);
          expect(response.headers()).not.toBe(cache.get('/url')[2]);
        });

        $http({method: 'GET', url: '/url', cache: cache}).then(callback);
        $rootScope.$digest();
        expect(callback).toHaveBeenCalledTimes(1);
      }));


      it('should not share the pending cached headers object instance', () => {
        var firstResult;
        callback.mockImplementation(function(result) {
          expect(result.headers()).toEqual(firstResult.headers());
          expect(result.headers()).not.toBe(firstResult.headers());
        });

        $httpBackend.expect('GET', '/url').respond(200, 'content', {'content-encoding': 'gzip', 'server': 'Apache'});
        $http({method: 'GET', url: '/url', cache: cache}).then(function(result) {
          firstResult = result;
        });
        $http({method: 'GET', url: '/url', cache: cache}).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledTimes(1);
      });


      it('should cache status code as well', angular.mock.inject(function($rootScope) {
        doFirstCacheRequest('GET', 201);
        callback.mockImplementation(function(response) {
          expect(response.status).toBe(201);
        });

        $http({method: 'get', url: '/url', cache: cache}).then(callback);
        $rootScope.$digest();
        expect(callback).toHaveBeenCalledTimes(1);
      }));

      it('should cache xhrStatus as well', angular.mock.inject(function($rootScope) {
        doFirstCacheRequest('GET', 201, null);
        callback.mockImplementation(function(response) {
          expect(response.xhrStatus).toBe('complete');
        });

        $http({method: 'get', url: '/url', cache: cache}).then(callback);
        $rootScope.$digest();
        expect(callback).toHaveBeenCalledTimes(1);
      }));


      it('should use cache even if second request was made before the first returned', function() {
        $httpBackend.expect('GET', '/url').respond(201, 'fake-response');

        callback.mockImplementation(function(response) {
          expect(response.data).toBe('fake-response');
          expect(response.status).toBe(201);
        });

        $http({method: 'GET', url: '/url', cache: cache}).then(callback);
        $http({method: 'GET', url: '/url', cache: cache}).then(callback);

        $httpBackend.flush();
        expect(callback).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(2);
      });


      it('should preserve config object when resolving from cache', function() {
        $httpBackend.expect('GET', '/url').respond(200, 'content');
        $http({method: 'GET', url: '/url', cache: cache, headers: {foo: 'bar'}});
        $httpBackend.flush();

        $http({method: 'GET', url: '/url', cache: cache, headers: {foo: 'baz'}}).then(callback);
        $rootScope.$digest();

        expect(callback.mock.calls[callback.mock.calls.length - 1][0].config.headers.foo).toBe('baz');
      });


      it('should preserve config object when resolving from pending cache', function() {
        $httpBackend.expect('GET', '/url').respond(200, 'content');
        $http({method: 'GET', url: '/url', cache: cache, headers: {foo: 'bar'}});

        $http({method: 'GET', url: '/url', cache: cache, headers: {foo: 'baz'}}).then(callback);
        $httpBackend.flush();

        expect(callback.mock.calls[callback.mock.calls.length - 1][0].config.headers.foo).toBe('baz');
      });


      it('should preserve config object when rejecting from pending cache', function() {
        $httpBackend.expect('GET', '/url').respond(404, 'content');
        $http({method: 'GET', url: '/url', cache: cache, headers: {foo: 'bar'}}).catch(angular.noop);

        $http({method: 'GET', url: '/url', cache: cache, headers: {foo: 'baz'}}).catch(callback);
        $httpBackend.flush();

        expect(callback.mock.calls[callback.mock.calls.length - 1][0].config.headers.foo).toBe('baz');
      });


      it('should allow the cached value to be an empty string', function() {
        cache.put('/abc', '');

        callback.mockImplementation(function(response) {
          expect(response.data).toBe('');
          expect(response.status).toBe(200);
        });

        $http({method: 'GET', url: '/abc', cache: cache}).then(callback);
        $rootScope.$digest();
        expect(callback).toHaveBeenCalled();
      });


      it('should default to status code 200 and empty headers if cache contains a non-array element',
          angular.mock.inject(function($rootScope) {
            cache.put('/myurl', 'simple response');
            $http.get('/myurl', {cache: cache}).then(function(response) {
              expect(response.data).toBe('simple response');
              expect(response.status).toBe(200);
              expect(response.headers()).toEqual(Object.create(null));
              callback();
            });

            $rootScope.$digest();
            expect(callback).toHaveBeenCalledTimes(1);
          })
      );

      describe('$http.defaults.cache', function() {

        it('should be undefined by default', function() {
          expect($http.defaults.cache).toBeUndefined();
        });

        it('should cache requests when no cache given in request config', function() {
          $http.defaults.cache = cache;

          // First request fills the cache from server response.
          $httpBackend.expect('GET', '/url').respond(200, 'content');
          $http({method: 'GET', url: '/url'}); // Notice no cache given in config.
          $httpBackend.flush();

          // Second should be served from cache, without sending request to server.
          $http({method: 'get', url: '/url'}).then(callback);
          $rootScope.$digest();

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('content');

          // Invalidate cache entry.
          $http.defaults.cache.remove('/url');

          // After cache entry removed, a request should be sent to server.
          $httpBackend.expect('GET', '/url').respond(200, 'content');
          $http({method: 'GET', url: '/url'});
          $httpBackend.flush();
        });

        it('should have less priority than explicitly given cache', angular.mock.inject(function($cacheFactory) {
          var localCache = $cacheFactory('localCache');
          $http.defaults.cache = cache;

          // Fill local cache.
          $httpBackend.expect('GET', '/url').respond(200, 'content-local-cache');
          $http({method: 'GET', url: '/url', cache: localCache});
          $httpBackend.flush();

          // Fill default cache.
          $httpBackend.expect('GET', '/url').respond(200, 'content-default-cache');
          $http({method: 'GET', url: '/url'});
          $httpBackend.flush();

          // Serve request from default cache when no local given.
          $http({method: 'get', url: '/url'}).then(callback);
          $rootScope.$digest();
          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('content-default-cache');
          callback.mockReset();

          // Serve request from local cache when it is given (but default filled too).
          $http({method: 'get', url: '/url', cache: localCache}).then(callback);
          $rootScope.$digest();
          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls[callback.mock.calls.length - 1][0].data).toBe('content-local-cache');
        }));

        it('should be skipped if {cache: false} is passed in request config', function() {
          $http.defaults.cache = cache;

          $httpBackend.expect('GET', '/url').respond(200, 'content');
          $http({method: 'GET', url: '/url'});
          $httpBackend.flush();

          $httpBackend.expect('GET', '/url').respond();
          $http({method: 'GET', url: '/url', cache: false});
          $httpBackend.flush();
        });
      });
    });


    describe('timeout', function() {

      it('should abort requests when timeout promise resolves', angular.mock.inject(function($q) {
        var canceler = $q.defer();

        $httpBackend.expect('GET', '/some').respond(200);

        $http({method: 'GET', url: '/some', timeout: canceler.promise}).catch(
            function(response) {
              expect(response.data).toBeUndefined();
              expect(response.status).toBe(-1);
              expect(response.xhrStatus).toBe('abort');
              expect(response.headers()).toEqual(Object.create(null));
              expect(response.config.url).toBe('/some');
              callback();
            });

        $rootScope.$apply(function() {
          canceler.resolve();
        });

        expect(callback).toHaveBeenCalled();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      }));


      it('should timeout request when numerical timeout is exceeded', angular.mock.inject(function($timeout) {
        var onFulfilled = jest.fn();
        var onRejected = jest.fn(function(response) {
          expect(response.xhrStatus).toBe('timeout');
        });

        $httpBackend.expect('GET', '/some').respond(200);

        $http({
          method: 'GET',
          url: '/some',
          timeout: 10
        }).then(onFulfilled, onRejected);

        $timeout.flush(100);

        expect(onFulfilled).not.toHaveBeenCalled();
        expect(onRejected).toHaveBeenCalled();
      }));


      it('should reject promise when timeout promise resolves', angular.mock.inject(function($timeout) {
        var onFulfilled = jest.fn();
        var onRejected = jest.fn(function(response) {
          expect(response.xhrStatus).toBe('timeout');
        });

        $httpBackend.expect('GET', '/some').respond(200);

        $http({
          method: 'GET',
          url: '/some',
          timeout: $timeout(angular.noop, 10)
        }).then(onFulfilled, onRejected);

        $timeout.flush(100);

        expect(onFulfilled).not.toHaveBeenCalled();
        expect(onRejected).toHaveBeenCalled();
      }));
    });


    describe('pendingRequests', function() {

      it('should be an array of pending requests', function() {
        $httpBackend.when('GET').respond(200);
        expect($http.pendingRequests.length).toBe(0);

        $http({method: 'get', url: '/some'});
        $rootScope.$digest();
        expect($http.pendingRequests.length).toBe(1);

        $httpBackend.flush();
        expect($http.pendingRequests.length).toBe(0);
      });


      it('should update pending requests even when served from cache', angular.mock.inject(function($rootScope) {
        $httpBackend.when('GET').respond(200);

        $http({method: 'get', url: '/cached', cache: true});
        $http({method: 'get', url: '/cached', cache: true});
        $rootScope.$digest();
        expect($http.pendingRequests.length).toBe(2);

        $httpBackend.flush();
        expect($http.pendingRequests.length).toBe(0);

        $http({method: 'get', url: '/cached', cache: true});
        jest.spyOn($http.pendingRequests, 'push');
        $rootScope.$digest();
        expect($http.pendingRequests.push).toHaveBeenCalledTimes(1);

        $rootScope.$apply();
        expect($http.pendingRequests.length).toBe(0);
      }));


      it('should remove the request before firing callbacks', function() {
        $httpBackend.when('GET').respond(200);
        $http({method: 'get', url: '/url'}).then(function() {
          expect($http.pendingRequests.length).toBe(0);
        });

        $rootScope.$digest();
        expect($http.pendingRequests.length).toBe(1);
        $httpBackend.flush();
      });
    });


    describe('defaults', function() {

      it('should expose the defaults object at runtime', function() {
        expect($http.defaults).toBeDefined();

        $http.defaults.headers.common.foo = 'bar';
        $httpBackend.expect('GET', '/url', undefined, function(headers) {
          return headers['foo'] === 'bar';
        }).respond('');

        $http.get('/url');
        $httpBackend.flush();
      });

      it('should have separate objects for defaults PUT and POST', function() {
        expect($http.defaults.headers.post).not.toBe($http.defaults.headers.put);
        expect($http.defaults.headers.post).not.toBe($http.defaults.headers.patch);
        expect($http.defaults.headers.put).not.toBe($http.defaults.headers.patch);
      });

      it('should expose default param serializer at runtime', function() {
        var paramSerializer = $http.defaults.paramSerializer;
        expect(paramSerializer({foo: 'foo', bar: ['bar', 'baz']})).toEqual('bar=bar&bar=baz&foo=foo');
      });
    });
  });


  describe('$browser\'s outstandingRequestCount', function() {
    var $http;
    var $httpBackend;
    var $rootScope;
    var incOutstandingRequestCountSpy;
    var completeOutstandingRequestSpy;


    describe('without interceptors', function() {
      beforeEach(setupServicesAndSpies);


      it('should immediately call `$browser.$$incOutstandingRequestCount()`', function() {
        expect(incOutstandingRequestCountSpy).not.toHaveBeenCalled();
        $http.get('');
        expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
      });


      it('should call `$browser.$$completeOutstandingRequest()` on success', function() {
        $httpBackend.when('GET').respond(200);

        $http.get('');
        expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(completeOutstandingRequestSpy).toHaveBeenCalledTimes(1);
      });


      it('should call `$browser.$$completeOutstandingRequest()` on error', function() {
        $httpBackend.when('GET').respond(500);

        $http.get('').catch(angular.noop);
        expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(completeOutstandingRequestSpy).toHaveBeenCalledTimes(1);
      });


      it('should increment/decrement `outstandingRequestCount` on error in `transformRequest`',
        function() {
          expect(incOutstandingRequestCountSpy).not.toHaveBeenCalled();
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          $http.get('', {transformRequest() { throw new Error(); }}).catch(angular.noop);

          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          $rootScope.$digest();

          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).toHaveBeenCalledTimes(1);
        }
      );


      it('should increment/decrement `outstandingRequestCount` on error in `transformResponse`',
        function() {
          expect(incOutstandingRequestCountSpy).not.toHaveBeenCalled();
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          $httpBackend.when('GET').respond(200);
          $http.get('', {transformResponse() { throw new Error(); }}).catch(angular.noop);

          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          $httpBackend.flush();

          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).toHaveBeenCalledTimes(1);
        }
      );
    });


    describe('with interceptors', function() {
      var reqInterceptorDeferred;
      var resInterceptorDeferred;
      var reqInterceptorFulfilled;
      var resInterceptorFulfilled;

      beforeEach(angular.mock.module(function($httpProvider) {
        reqInterceptorDeferred = null;
        resInterceptorDeferred = null;
        reqInterceptorFulfilled = false;
        resInterceptorFulfilled = false;

        $httpProvider.interceptors.push(function($q) {
          return {
            request(config) {
              return (reqInterceptorDeferred = $q.defer()).
                promise.
                finally(function() { reqInterceptorFulfilled = true; }).
                then(ngInternals.valueFn(config));
            },
            response() {
              return (resInterceptorDeferred = $q.defer()).
                promise.
                finally(function() { resInterceptorFulfilled = true; });
            }
          };
        });
      }));

      beforeEach(setupServicesAndSpies);

      beforeEach(function() {
        $httpBackend.when('GET').respond(200);
      });


      it('should increment/decrement `outstandingRequestCount` before/after async interceptors',
        function() {
          expect(reqInterceptorFulfilled).toBe(false);
          expect(resInterceptorFulfilled).toBe(false);
          expect(incOutstandingRequestCountSpy).not.toHaveBeenCalled();
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          $http.get('');
          $rootScope.$digest();

          expect(reqInterceptorFulfilled).toBe(false);
          expect(resInterceptorFulfilled).toBe(false);
          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          reqInterceptorDeferred.resolve();
          $httpBackend.flush();

          expect(reqInterceptorFulfilled).toBe(true);
          expect(resInterceptorFulfilled).toBe(false);
          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          resInterceptorDeferred.resolve();
          $rootScope.$digest();

          expect(reqInterceptorFulfilled).toBe(true);
          expect(resInterceptorFulfilled).toBe(true);
          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).toHaveBeenCalledTimes(1);
        }
      );


      it('should increment/decrement `outstandingRequestCount` on error in request interceptor',
        function() {
          expect(reqInterceptorFulfilled).toBe(false);
          expect(incOutstandingRequestCountSpy).not.toHaveBeenCalled();
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          $http.get('').catch(angular.noop);
          $rootScope.$digest();

          expect(reqInterceptorFulfilled).toBe(false);
          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          reqInterceptorDeferred.reject();
          $rootScope.$digest();

          expect(reqInterceptorFulfilled).toBe(true);
          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).toHaveBeenCalledTimes(1);
        }
      );


      it('should increment/decrement `outstandingRequestCount` on error in response interceptor',
        function() {
          expect(reqInterceptorFulfilled).toBe(false);
          expect(resInterceptorFulfilled).toBe(false);
          expect(incOutstandingRequestCountSpy).not.toHaveBeenCalled();
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          $http.get('').catch(angular.noop);
          $rootScope.$digest();

          expect(reqInterceptorFulfilled).toBe(false);
          expect(resInterceptorFulfilled).toBe(false);
          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          reqInterceptorDeferred.resolve();
          $httpBackend.flush();

          expect(reqInterceptorFulfilled).toBe(true);
          expect(resInterceptorFulfilled).toBe(false);
          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).not.toHaveBeenCalled();

          resInterceptorDeferred.reject();
          $rootScope.$digest();

          expect(reqInterceptorFulfilled).toBe(true);
          expect(resInterceptorFulfilled).toBe(true);
          expect(incOutstandingRequestCountSpy).toHaveBeenCalledTimes(1);
          expect(completeOutstandingRequestSpy).toHaveBeenCalledTimes(1);
        }
      );
    });


    // Helpers
    function setupServicesAndSpies() {
      angular.mock.inject(function($browser, _$http_, _$httpBackend_, _$rootScope_) {
        $http = _$http_;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;

        incOutstandingRequestCountSpy =
            jest.spyOn($browser, '$$incOutstandingRequestCount');
        completeOutstandingRequestSpy =
            jest.spyOn($browser, '$$completeOutstandingRequest');
      });
    }
  });


  describe('XSRF', function() {
    var $http;
    var $httpBackend;

    beforeEach(angular.mock.module(function($httpProvider) {
      $httpProvider.xsrfWhitelistedOrigins.push(
          'https://whitelisted.example.com',
          'https://whitelisted2.example.com:1337/ignored/path');
    }));

    beforeEach(angular.mock.inject(function(_$http_, _$httpBackend_) {
      $http = _$http_;
      $httpBackend = _$httpBackend_;
    }));


    it('should set the XSRF cookie into an XSRF header', function() {
      function checkXsrf(secret, header) {
        return function checkHeaders(headers) {
          return headers[header || 'X-XSRF-TOKEN'] === secret;
        };
      }

      mockedCookies['XSRF-TOKEN'] = 'secret';
      mockedCookies['aCookie'] = 'secret2';
      $httpBackend.expect('GET',    '/url', null, checkXsrf('secret')).respond(null);
      $httpBackend.expect('POST',   '/url', null, checkXsrf('secret')).respond(null);
      $httpBackend.expect('PUT',    '/url', null, checkXsrf('secret')).respond(null);
      $httpBackend.expect('DELETE', '/url', null, checkXsrf('secret')).respond(null);
      $httpBackend.expect('GET',    '/url', null, checkXsrf('secret', 'aHeader')).respond(null);
      $httpBackend.expect('GET',    '/url', null, checkXsrf('secret2')).respond(null);

      $http({method: 'GET',    url: '/url'});
      $http({method: 'POST',   url: '/url', headers: {'S-ome': 'Header'}});
      $http({method: 'PUT',    url: '/url', headers: {'Another': 'Header'}});
      $http({method: 'DELETE', url: '/url', headers: {}});
      $http({method: 'GET',    url: '/url', xsrfHeaderName: 'aHeader'});
      $http({method: 'GET',    url: '/url', xsrfCookieName: 'aCookie'});

      $httpBackend.flush();
    });


    it('should support setting a default XSRF cookie/header name', function() {
      $http.defaults.xsrfCookieName = 'aCookie';
      $http.defaults.xsrfHeaderName = 'aHeader';

      function checkHeaders(headers) {
        return headers.aHeader === 'secret';
      }

      mockedCookies.aCookie = 'secret';
      $httpBackend.expect('GET', '/url', null, checkHeaders).respond(null);

      $http.get('/url');

      $httpBackend.flush();
    });


    it('should support overriding the default XSRF cookie/header name per request', function() {
      $http.defaults.xsrfCookieName = 'aCookie';
      $http.defaults.xsrfHeaderName = 'aHeader';

      function checkHeaders(headers) {
        return headers.anotherHeader === 'anotherSecret';
      }

      mockedCookies.anotherCookie = 'anotherSecret';
      $httpBackend.expect('GET', '/url', null, checkHeaders).respond(null);

      $http.get('/url', {
        xsrfCookieName: 'anotherCookie',
        xsrfHeaderName: 'anotherHeader'
      });

      $httpBackend.flush();
    });


    it('should check the cache before checking the XSRF cookie', angular.mock.inject(function($cacheFactory) {
      function checkHeaders(headers) {
        return headers['X-XSRF-TOKEN'] === 'foo';
      }
      function setCookie() {
        mockedCookies['XSRF-TOKEN'] = 'foo';
      }

      var testCache = $cacheFactory('testCache');
      jest.spyOn(testCache, 'get').mockImplementation(setCookie);

      $httpBackend.expect('GET', '/url', null, checkHeaders).respond(null);
      $http.get('/url', {cache: testCache});

      $httpBackend.flush();
    }));


    it('should not set an XSRF header for cross-domain requests', function() {
      function checkHeaders(headers) {
        return angular.isUndefined(headers['X-XSRF-TOKEN']);
      }
      var requestUrls = [
        'https://api.example.com/path',
        'http://whitelisted.example.com',
        'https://whitelisted2.example.com:1338'
      ];

      mockedCookies['XSRF-TOKEN'] = 'secret';

      requestUrls.forEach(function(url) {
        $httpBackend.expect('GET', url, null, checkHeaders).respond(null);
        $http.get(url);
        $httpBackend.flush();
      });
    });


    it('should set an XSRF header for cross-domain requests to whitelisted origins',
      angular.mock.inject(function($browser) {
        function checkHeaders(headers) {
          return headers['X-XSRF-TOKEN'] === 'secret';
        }
        var currentUrl = 'https://example.com/path';
        var requestUrls = [
          'https://whitelisted.example.com/path',
          'https://whitelisted2.example.com:1337/path'
        ];

        $browser.url(currentUrl);
        mockedCookies['XSRF-TOKEN'] = 'secret';

        requestUrls.forEach(function(url) {
          $httpBackend.expect('GET', url, null, checkHeaders).respond(null);
          $http.get(url);
          $httpBackend.flush();
        });
      })
    );
  });


  it('should pass timeout, withCredentials and responseType', function() {
    var $httpBackend = jest.fn();

    $httpBackend.mockImplementation(function(m, u, d, c, h, timeout, withCredentials, responseType) {
      expect(timeout).toBe(12345);
      expect(withCredentials).toBe(true);
      expect(responseType).toBe('json');
    });

    angular.mock.module(function($provide) {
      $provide.value('$httpBackend', $httpBackend);
    });

    angular.mock.inject(function($http, $rootScope) {
      $http({
        method: 'GET',
        url: 'some.html',
        timeout: 12345,
        withCredentials: true,
        responseType: 'json'
      });
      $rootScope.$digest();
      expect($httpBackend).toHaveBeenCalledTimes(1);
    });

    $httpBackend.verifyNoOutstandingExpectation = angular.noop;
  });


  it('should use withCredentials from default', function() {
    var $httpBackend = jest.fn();

    $httpBackend.mockImplementation(function(m, u, d, c, h, timeout, withCredentials) {
      expect(withCredentials).toBe(true);
    });

    angular.mock.module(function($provide) {
      $provide.value('$httpBackend', $httpBackend);
    });

    angular.mock.inject(function($http, $rootScope) {
      $http.defaults.withCredentials = true;
      $http({
        method: 'GET',
        url: 'some.html',
        timeout: 12345,
        responseType: 'json'
      });
      $rootScope.$digest();
      expect($httpBackend).toHaveBeenCalledTimes(1);
    });

    $httpBackend.verifyNoOutstandingExpectation = angular.noop;
  });
});


describe('$http with $applyAsync', function() {
  var $http;
  var $httpBackend;
  var $rootScope;
  var $browser;
  var log;
  beforeEach(angular.mock.module(function($httpProvider) {
    $httpProvider.useApplyAsync(true);
  }, provideLog));


  beforeEach(angular.mock.inject(['$http', '$httpBackend', '$rootScope', '$browser', 'log', function(http, backend, scope, browser, logger) {
    $http = http;
    $httpBackend = backend;
    $rootScope = scope;
    $browser = browser;
    jest.spyOn($rootScope, '$apply');
    jest.spyOn($rootScope, '$applyAsync');
    jest.spyOn($rootScope, '$digest');
    jest.spyOn($browser.defer, 'cancel');
    log = logger;
  }]));


  it('should schedule coalesced apply on response', function() {
    var handler = jest.fn();
    $httpBackend.expect('GET', '/template1.html').respond(200, '<h1>Header!</h1>', {});
    $http.get('/template1.html').then(handler);
    // Ensure requests are sent
    $rootScope.$digest();

    $httpBackend.flush(null, null, false);
    expect($rootScope.$applyAsync).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();

    $browser.defer.flush();
    expect(handler).toHaveBeenCalledTimes(1);
  });


  it('should combine multiple responses within short time frame into a single $apply', function() {
    $httpBackend.expect('GET', '/template1.html').respond(200, '<h1>Header!</h1>', {});
    $httpBackend.expect('GET', '/template2.html').respond(200, '<p>Body!</p>', {});

    $http.get('/template1.html').then(log.fn('response 1'));
    $http.get('/template2.html').then(log.fn('response 2'));
    // Ensure requests are sent
    $rootScope.$digest();

    $httpBackend.flush(null, null, false);
    expect(log).toEqual([]);

    $browser.defer.flush();
    expect(log).toEqual(['response 1', 'response 2']);
  });


  it('should handle pending responses immediately if a digest occurs on $rootScope', function() {
    $httpBackend.expect('GET', '/template1.html').respond(200, '<h1>Header!</h1>', {});
    $httpBackend.expect('GET', '/template2.html').respond(200, '<p>Body!</p>', {});
    $httpBackend.expect('GET', '/template3.html').respond(200, '<p>Body!</p>', {});

    $http.get('/template1.html').then(log.fn('response 1'));
    $http.get('/template2.html').then(log.fn('response 2'));
    $http.get('/template3.html').then(log.fn('response 3'));
    // Ensure requests are sent
    $rootScope.$digest();

    // Intermediate $digest occurs before 3rd response is received, assert that pending responses
    /// are handled
    $httpBackend.flush(2);
    expect(log).toEqual(['response 1', 'response 2']);

    // Finally, third response is received, and a second coalesced $apply is started
    $httpBackend.flush(null, null, false);
    $browser.defer.flush();
    expect(log).toEqual(['response 1', 'response 2', 'response 3']);
  });
});


describe('$http param serializers', function() {
  var defSer;
  var jqrSer;
  beforeEach(angular.mock.inject(function($httpParamSerializer, $httpParamSerializerJQLike) {
    defSer = $httpParamSerializer;
    jqrSer = $httpParamSerializerJQLike;
  }));

  describe('common functionality', function() {

    it('should return empty string for null or undefined params', function() {
        expect(defSer(undefined)).toEqual('');
        expect(jqrSer(undefined)).toEqual('');
        expect(defSer(null)).toEqual('');
        expect(jqrSer(null)).toEqual('');
    });

    it('should serialize objects', function() {
      expect(defSer({foo: 'foov', bar: 'barv'})).toEqual('bar=barv&foo=foov');
      expect(jqrSer({foo: 'foov', bar: 'barv'})).toEqual('bar=barv&foo=foov');
      expect(defSer({someDate: new Date('2014-07-15T17:30:00.000Z')})).toEqual('someDate=2014-07-15T17:30:00.000Z');
      expect(jqrSer({someDate: new Date('2014-07-15T17:30:00.000Z')})).toEqual('someDate=2014-07-15T17:30:00.000Z');
    });
  });

  describe('default array serialization', function() {

    it('should serialize arrays by repeating param name', function() {
      expect(defSer({a: 'b', foo: ['bar', 'baz']})).toEqual('a=b&foo=bar&foo=baz');
    });

    it('should NOT serialize functions', function() {
      expect(defSer({foo: 'foov', bar() {}})).toEqual('foo=foov');
    });
  });

  describe('jquery array and objects serialization', function() {

    it('should serialize arrays by repeating param name with [] suffix', function() {
      expect(jqrSer({a: 'b', foo: ['bar', 'baz']})).toEqual('a=b&foo%5B%5D=bar&foo%5B%5D=baz');
      expect(decodeURIComponent(jqrSer({a: 'b', foo: ['bar', 'baz']}))).toEqual('a=b&foo[]=bar&foo[]=baz');
    });

    it('should serialize objects by repeating param name with [key] suffix', function() {
      expect(jqrSer({a: 'b', foo: {'bar': 'barv', 'baz': 'bazv'}})).toEqual('a=b&foo%5Bbar%5D=barv&foo%5Bbaz%5D=bazv');
                                                                           //a=b&foo[bar]=barv&foo[baz]=bazv
    });

    it('should serialize nested objects by repeating param name with [key] suffix', function() {
      expect(jqrSer({a: ['b', {c: 'd'}], e: {f: 'g', 'h': ['i', 'j']}})).toEqual(
         'a%5B%5D=b&a%5B1%5D%5Bc%5D=d&e%5Bf%5D=g&e%5Bh%5D%5B%5D=i&e%5Bh%5D%5B%5D=j');
         //a[]=b&a[1][c]=d&e[f]=g&e[h][]=i&e[h][]=j
    });

    it('should serialize objects inside array elements using their index', function() {
      expect(jqrSer({a: ['b', 'c'], d: [{e: 'f', g: 'h'}, 'i', {j: 'k'}]})).toEqual(
         'a%5B%5D=b&a%5B%5D=c&d%5B0%5D%5Be%5D=f&d%5B0%5D%5Bg%5D=h&d%5B%5D=i&d%5B2%5D%5Bj%5D=k');
         //a[]=b&a[]=c&d[0][e]=f&d[0][g]=h&d[]=i&d[2][j]=k
    });
  });
});
