/* global createHttpBackend: false, angular.mock.createMockXhr: false, angular.mock.MockXhr: false */
'use strict';
 describe('$httpBackend', () => {
  var $backend;
  var $browser;
  var $jsonpCallbacks;
  var xhr;
  var fakeDocument;
  var callback;

  beforeEach(angular.mock.inject(function($injector) {

    $browser = $injector.get('$browser');

    fakeDocument = {
      $$scripts: [],
      createElement: jest.fn().mockName('createElement').mockImplementation(function() {
        // Return a proper script element...
        return window.document.createElement(arguments[0]);
      }),
      body: {
        appendChild: jest.fn().mockName('body.appendChild').mockImplementation(function(script) {
          fakeDocument.$$scripts.push(script);
        }),
        removeChild: jest.fn().mockName('body.removeChild').mockImplementation(function(script) {
          var index = fakeDocument.$$scripts.indexOf(script);
          if (index !== -1) {
            fakeDocument.$$scripts.splice(index, 1);
          }
        })
      }
    };

    $jsonpCallbacks = {
      createCallback(url) {
        $jsonpCallbacks[url] = function(data) {
          $jsonpCallbacks[url].called = true;
          $jsonpCallbacks[url].data = data;
        };
        return url;
      },
      wasCalled(callbackPath) {
        return $jsonpCallbacks[callbackPath].called;
      },
      getResponse(callbackPath) {
        return $jsonpCallbacks[callbackPath].data;
      },
      removeCallback(callbackPath) {
        delete $jsonpCallbacks[callbackPath];
      }
    };

    $backend = ngInternals.createHttpBackend($browser, angular.mock.createMockXhr, $browser.defer, $jsonpCallbacks, fakeDocument);
    callback = jest.fn().mockName('done');
  }));


  test('should do basics - open async xhr and send data', () => {
    $backend('GET', '/some-url', 'some-data', angular.noop);
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(xhr.$$method).toBe('GET');
    expect(xhr.$$url).toBe('/some-url');
    expect(xhr.$$data).toBe('some-data');
    expect(xhr.$$async).toBe(true);
  });

  test('should pass null to send if no body is set', () => {
    $backend('GET', '/some-url', undefined, angular.noop);
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(xhr.$$data).toBe(null);
  });

  test('should pass the correct falsy value to send if falsy body is set (excluding undefined, NaN)',
    function() {
      var values = [false, 0, '', null];
      angular.forEach(values, function(value) {
        $backend('GET', '/some-url', value, angular.noop);
        xhr = angular.mock.MockXhr.$$lastInstance;

        expect(xhr.$$data).toBe(value);
      });
    }
  );

  test('should pass NaN to send if NaN body is set', () => {
    $backend('GET', '/some-url', NaN, angular.noop);
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(isNaN(xhr.$$data)).toEqual(true);
  });

  test('should call completion function with xhr.statusText if present', () => {
    callback.mockImplementation(function(status, response, headers, statusText) {
      expect(statusText).toBe('OK');
    });

    $backend('GET', '/some-url', null, callback);
    xhr = angular.mock.MockXhr.$$lastInstance;
    xhr.statusText = 'OK';
    xhr.onload();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should call completion function with empty string if not present', () => {
    callback.mockImplementation(function(status, response, headers, statusText) {
      expect(statusText).toBe('');
    });

    $backend('GET', '/some-url', null, callback);
    xhr = angular.mock.MockXhr.$$lastInstance;
    xhr.onload();
    expect(callback).toHaveBeenCalledTimes(1);
  });


  test('should normalize IE\'s 1223 status code into 204', () => {
    callback.mockImplementation(function(status) {
      expect(status).toBe(204);
    });

    $backend('GET', 'URL', null, callback);
    xhr = angular.mock.MockXhr.$$lastInstance;

    xhr.status = 1223;
    xhr.onload();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should set only the requested headers', () => {
    $backend('POST', 'URL', null, angular.noop, {'X-header1': 'value1', 'X-header2': 'value2'});
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(xhr.$$reqHeaders).toEqual({
      'X-header1': 'value1',
      'X-header2': 'value2'
    });
  });

  test('should set requested headers even if they have falsy values', () => {
    $backend('POST', 'URL', null, angular.noop, {
      'X-header1': 0,
      'X-header2': '',
      'X-header3': false,
      'X-header4': undefined
    });

    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(xhr.$$reqHeaders).toEqual({
      'X-header1': 0,
      'X-header2': '',
      'X-header3': false
    });
  });

  test('should not try to read response data when request is aborted', () => {
    callback.mockImplementation(function(status, response, headers, statusText) {
      expect(status).toBe(-1);
      expect(response).toBe(null);
      expect(headers).toBe(null);
      expect(statusText).toBe('');
    });
    $backend('GET', '/url', null, callback, {}, 2000);
    xhr = angular.mock.MockXhr.$$lastInstance;
    jest.spyOn(xhr, 'abort').mockImplementation(() => {});

    $browser.defer.flush();
    expect(xhr.abort).toHaveBeenCalledTimes(1);

    xhr.status = 0;
    xhr.onabort();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should complete the request on timeout', () => {
    callback.mockImplementation(function(status, response, headers, statusText, xhrStatus) {
      expect(status).toBe(-1);
      expect(response).toBe(null);
      expect(headers).toBe(null);
      expect(statusText).toBe('');
      expect(xhrStatus).toBe('timeout');
    });
    $backend('GET', '/url', null, callback, {});
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(callback).not.toHaveBeenCalled();

    xhr.ontimeout();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should complete the request on abort', () => {
    callback.mockImplementation(function(status, response, headers, statusText, xhrStatus) {
      expect(status).toBe(-1);
      expect(response).toBe(null);
      expect(headers).toBe(null);
      expect(statusText).toBe('');
      expect(xhrStatus).toBe('abort');
    });
    $backend('GET', '/url', null, callback, {});
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(callback).not.toHaveBeenCalled();

    xhr.onabort();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should complete the request on error', () => {
    callback.mockImplementation(function(status, response, headers, statusText, xhrStatus) {
      expect(status).toBe(-1);
      expect(response).toBe(null);
      expect(headers).toBe(null);
      expect(statusText).toBe('');
      expect(xhrStatus).toBe('error');
    });
    $backend('GET', '/url', null, callback, {});
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(callback).not.toHaveBeenCalled();

    xhr.onerror();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should complete the request on success', () => {
    callback.mockImplementation(function(status, response, headers, statusText, xhrStatus) {
      expect(status).toBe(200);
      expect(response).toBe('response');
      expect(headers).toBe('');
      expect(statusText).toBe('');
      expect(xhrStatus).toBe('complete');
    });
    $backend('GET', '/url', null, callback, {});
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(callback).not.toHaveBeenCalled();

    xhr.statusText = '';
    xhr.response = 'response';
    xhr.status = 200;
    xhr.onload();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should abort request on numerical timeout', () => {
    callback.mockImplementation(function(status, response) {
      expect(status).toBe(-1);
    });

    $backend('GET', '/url', null, callback, {}, 2000);
    xhr = angular.mock.MockXhr.$$lastInstance;
    jest.spyOn(xhr, 'abort').mockImplementation(() => {});

    expect($browser.deferredFns[0].time).toBe(2000);

    $browser.defer.flush();
    expect(xhr.abort).toHaveBeenCalledTimes(1);

    xhr.status = 0;
    xhr.onabort();
    expect(callback).toHaveBeenCalledTimes(1);
  });


  test('should abort request on $timeout promise resolution', angular.mock.inject(function($timeout) {
    callback.mockImplementation(function(status, response, headers, statusText, xhrStatus) {
      expect(status).toBe(-1);
      expect(xhrStatus).toBe('timeout');
    });

    $backend('GET', '/url', null, callback, {}, $timeout(angular.noop, 2000));
    xhr = angular.mock.MockXhr.$$lastInstance;
    jest.spyOn(xhr, 'abort').mockImplementation(() => {});

    $timeout.flush();
    expect(xhr.abort).toHaveBeenCalledTimes(1);

    xhr.status = 0;
    xhr.onabort();
    expect(callback).toHaveBeenCalledTimes(1);
  }));


  test('should not abort resolved request on timeout promise resolution', angular.mock.inject(function($timeout) {
    callback.mockImplementation(function(status, response) {
      expect(status).toBe(200);
    });

    $backend('GET', '/url', null, callback, {}, $timeout(angular.noop, 2000));
    xhr = angular.mock.MockXhr.$$lastInstance;
    jest.spyOn(xhr, 'abort').mockImplementation(() => {});

    xhr.status = 200;
    xhr.onload();
    expect(callback).toHaveBeenCalledTimes(1);

    $timeout.flush();
    expect(xhr.abort).not.toHaveBeenCalled();
  }));


  test('should abort request on canceler promise resolution', angular.mock.inject(function($q, $browser) {
    var canceler = $q.defer();

    callback.mockImplementation(function(status, response, headers, statusText, xhrStatus) {
      expect(status).toBe(-1);
      expect(xhrStatus).toBe('abort');
    });

    $backend('GET', '/url', null, callback, {}, canceler.promise);
    xhr = angular.mock.MockXhr.$$lastInstance;

    canceler.resolve();
    $browser.defer.flush();

    expect(callback).toHaveBeenCalledTimes(1);
  }));


  test('should cancel timeout on completion', () => {
    callback.mockImplementation(function(status, response) {
      expect(status).toBe(200);
    });

    $backend('GET', '/url', null, callback, {}, 2000);
    xhr = angular.mock.MockXhr.$$lastInstance;
    jest.spyOn(xhr, 'abort').mockImplementation(() => {});

    expect($browser.deferredFns[0].time).toBe(2000);

    xhr.status = 200;
    xhr.onload();
    expect(callback).toHaveBeenCalledTimes(1);

    expect($browser.deferredFns.length).toBe(0);
    expect(xhr.abort).not.toHaveBeenCalled();
  });


  test('should call callback with xhrStatus "abort" on explicit xhr.abort() when $timeout is set', angular.mock.inject(function($timeout) {
    callback.mockImplementation(function(status, response, headers, statusText, xhrStatus) {
      expect(status).toBe(-1);
      expect(xhrStatus).toBe('abort');
    });

    $backend('GET', '/url', null, callback, {}, $timeout(angular.noop, 2000));
    xhr = angular.mock.MockXhr.$$lastInstance;
    jest.spyOn(xhr, 'abort');

    xhr.abort();

    expect(callback).toHaveBeenCalledTimes(1);
  }));


  test('should set withCredentials', () => {
    $backend('GET', '/some.url', null, callback, {}, null, true);
    expect(angular.mock.MockXhr.$$lastInstance.withCredentials).toBe(true);
  });


  test('should call $xhrFactory with method and url', () => {
    var mockXhrFactory = jest.fn().mockName('mockXhrFactory').mockImplementation(angular.mock.createMockXhr);
    $backend = ngInternals.createHttpBackend($browser, mockXhrFactory, $browser.defer, $jsonpCallbacks, fakeDocument);
    $backend('GET', '/some-url', 'some-data', angular.noop);
    expect(mockXhrFactory).toHaveBeenCalledWith('GET', '/some-url');
  });


  test('should set up event listeners', () => {
    var progressFn = function() {};
    var uploadProgressFn = function() {};
    $backend('GET', '/url', null, callback, {}, null, null, null,
        {progress: progressFn}, {progress: uploadProgressFn});
    xhr = angular.mock.MockXhr.$$lastInstance;
    expect(xhr.$$events.progress[0]).toBe(progressFn);
    expect(xhr.upload.$$events.progress[0]).toBe(uploadProgressFn);
  });


  describe('responseType', () => {

    test('should set responseType and return xhr.response', () => {
      $backend('GET', '/whatever', null, callback, {}, null, null, 'blob');

      var xhrInstance = angular.mock.MockXhr.$$lastInstance;
      expect(xhrInstance.responseType).toBe('blob');

      callback.mockImplementation(function(status, response) {
        expect(response).toBe(xhrInstance.response);
      });

      xhrInstance.response = {some: 'object'};
      xhrInstance.onload();

      expect(callback).toHaveBeenCalledTimes(1);
    });


    test('should read responseText if response was not defined', () => {
      //  old browsers like IE9, don't support responseType, so they always respond with responseText

      $backend('GET', '/whatever', null, callback, {}, null, null, 'blob');

      var xhrInstance = angular.mock.MockXhr.$$lastInstance;
      var responseText = '{"some": "object"}';
      expect(xhrInstance.responseType).toBe('blob');

      callback.mockImplementation(function(status, response) {
        expect(response).toBe(responseText);
      });

      xhrInstance.responseText = responseText;
      xhrInstance.onload();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });


  describe('JSONP', () => {

    var SCRIPT_URL = /([^?]*)\?cb=(.*)/;


    test('should add script tag for JSONP request', () => {
      callback.mockImplementation(function(status, response) {
        expect(status).toBe(200);
        expect(response).toBe('some-data');
      });

      $backend('JSONP', 'http://example.org/path?cb=JSON_CALLBACK', null, callback);
      expect(fakeDocument.$$scripts.length).toBe(1);

      var script = fakeDocument.$$scripts.shift();
      var url = script.src.match(SCRIPT_URL);

      expect(url[1]).toBe('http://example.org/path');
      $jsonpCallbacks[url[2]]('some-data');
      browserTrigger(script, 'load');

      expect(callback).toHaveBeenCalledTimes(1);
    });


    test('should clean up the callback and remove the script', () => {
      jest.spyOn($jsonpCallbacks, 'removeCallback');

      $backend('JSONP', 'http://example.org/path?cb=JSON_CALLBACK', null, callback);
      expect(fakeDocument.$$scripts.length).toBe(1);


      var script = fakeDocument.$$scripts.shift();
      var callbackId = script.src.match(SCRIPT_URL)[2];

      $jsonpCallbacks[callbackId]('some-data');
      browserTrigger(script, 'load');

      expect($jsonpCallbacks.removeCallback).toHaveBeenCalledOnceWith(callbackId);
      expect(fakeDocument.body.removeChild).toHaveBeenCalledOnceWith(script);
    });


    test('should set url to current location if not specified or empty string', () => {
      $backend('JSONP', undefined, null, callback);
      expect(fakeDocument.$$scripts[0].src).toBe($browser.url());
      fakeDocument.$$scripts.shift();

      $backend('JSONP', '', null, callback);
      expect(fakeDocument.$$scripts[0].src).toBe($browser.url());
    });


    test('should abort request on timeout and remove JSONP callback', () => {
      jest.spyOn($jsonpCallbacks, 'removeCallback');

      callback.mockImplementation(function(status, response) {
        expect(status).toBe(-1);
      });

      $backend('JSONP', 'http://example.org/path?cb=JSON_CALLBACK', null, callback, null, 2000);
      expect(fakeDocument.$$scripts.length).toBe(1);
      expect($browser.deferredFns[0].time).toBe(2000);

      var script = fakeDocument.$$scripts.shift();
      var callbackId = script.src.match(SCRIPT_URL)[2];

      $browser.defer.flush();
      expect(fakeDocument.$$scripts.length).toBe(0);
      expect(callback).toHaveBeenCalledTimes(1);

      expect($jsonpCallbacks.removeCallback).toHaveBeenCalledOnceWith(callbackId);
    });


    // TODO(vojta): test whether it fires "async-start"
    // TODO(vojta): test whether it fires "async-end" on both success and error
  });


  describe('protocols that return 0 status code', () => {

    function respond(status, content) {
      xhr = angular.mock.MockXhr.$$lastInstance;
      xhr.status = status;
      xhr.responseText = content;
      xhr.onload();
    }

     beforeEach(() => {
      $backend = ngInternals.createHttpBackend($browser, angular.mock.createMockXhr);
    });


    test('should convert 0 to 200 if content and file protocol', () => {
      $backend('GET', 'file:///whatever/index.html', null, callback);
      respond(0, 'SOME CONTENT');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.lastCall[0]).toBe(200);
    });

    test('should convert 0 to 200 if content for protocols other than file', () => {
      $backend('GET', 'someProtocol:///whatever/index.html', null, callback);
      respond(0, 'SOME CONTENT');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.lastCall[0]).toBe(200);
    });

    test('should convert 0 to 404 if no content and file protocol', () => {
      $backend('GET', 'file:///whatever/index.html', null, callback);
      respond(0, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.lastCall[0]).toBe(404);
    });

    test('should not convert 0 to 404 if no content for protocols other than file', () => {
      $backend('GET', 'someProtocol:///whatever/index.html', null, callback);
      respond(0, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.lastCall[0]).toBe(0);
    });

    test('should convert 0 to 404 if no content - relative url', () => {
      /* global urlParsingNode: true */
      var originalUrlParsingNodeValues = {
        hash: ngInternals.urlParsingNode.hash,
        host: ngInternals.urlParsingNode.host,
        hostname: ngInternals.urlParsingNode.hostname,
        href: ngInternals.urlParsingNode.href,
        pathname: ngInternals.urlParsingNode.pathname,
        port: ngInternals.urlParsingNode.port,
        protocol: ngInternals.urlParsingNode.protocol,
        search: ngInternals.urlParsingNode.search,
        setAttribute: ngInternals.urlParsingNode.setAttribute
      }

      //temporarily overriding the DOM element to pretend that the test runs origin with file:// protocol
      ngInternals.urlParsingNode.hash = '#/C:/';
      ngInternals.urlParsingNode.host = '';
      ngInternals.urlParsingNode.hostname = '';
      ngInternals.urlParsingNode.href = 'file:///C:/base#!/C:/foo';
      ngInternals.urlParsingNode.pathname = '/C:/foo';
      ngInternals.urlParsingNode.port = '';
      ngInternals.urlParsingNode.protocol = 'file:';
      ngInternals.urlParsingNode.search = '';
      ngInternals.urlParsingNode.setAttribute = angular.noop;

      try {

        $backend('GET', '/whatever/index.html', null, callback);
        respond(0, '');

        expect(callback).toHaveBeenCalled();
        expect(callback.mock.lastCall[0]).toBe(404);

      } finally {
        Object.entries(originalUrlParsingNodeValues).forEach(([k,v]) => ngInternals.urlParsingNode[k] = v);
      }
    });

    test('should return original backend status code if different from 0', () => {
      // request to http://
      $backend('POST', 'http://rest_api/create_whatever', null, callback);
      respond(201, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.lastCall[0]).toBe(201);


      // request to file://
      $backend('POST', 'file://rest_api/create_whatever', null, callback);
      respond(201, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.lastCall[0]).toBe(201);

      // request to file:// with HTTP status >= 300
      $backend('POST', 'file://rest_api/create_whatever', null, callback);
      respond(503, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.lastCall[0]).toBe(503);
    });
  });
});

