/* global ngInternals.createHttpBackend: false, angular.mock.createMockXhr: false, angular.mock.MockXhr: false */
'use strict';

describe('$httpBackend', function() {

  var $backend, $browser, $jsonpCallbacks,
      xhr, fakeDocument, callback;

  beforeEach(angular.mock.inject(function($injector) {

    $browser = $injector.get('$browser');

    fakeDocument = {
      $$scripts: [],
      createElement: jest.fn(function() {
        // Return a proper script element...
        return window.document.createElement(arguments[0]);
      }),
      body: {
        appendChild: jest.fn(function(script) {
          fakeDocument.$$scripts.push(script);
        }),
        removeChild: jest.fn(function(script) {
          var index = fakeDocument.$$scripts.indexOf(script);
          if (index !== -1) {
            fakeDocument.$$scripts.splice(index, 1);
          }
        })
      }
    };

    $jsonpCallbacks = {
      createCallback: function(url) {
        $jsonpCallbacks[url] = function(data) {
          $jsonpCallbacks[url].called = true;
          $jsonpCallbacks[url].data = data;
        };
        return url;
      },
      wasCalled: function(callbackPath) {
        return $jsonpCallbacks[callbackPath].called;
      },
      getResponse: function(callbackPath) {
        return $jsonpCallbacks[callbackPath].data;
      },
      removeCallback: function(callbackPath) {
        delete $jsonpCallbacks[callbackPath];
      }
    };

    $backend = ngInternals.createHttpBackend($browser, angular.mock.createMockXhr, $browser.defer, $jsonpCallbacks, fakeDocument);
    callback = jest.fn();
  }));


  it('should do basics - open async xhr and send data', function() {
    $backend('GET', '/some-url', 'some-data', angular.noop);
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(xhr.$$method).toBe('GET');
    expect(xhr.$$url).toBe('/some-url');
    expect(xhr.$$data).toBe('some-data');
    expect(xhr.$$async).toBe(true);
  });

  it('should pass null to send if no body is set', function() {
    $backend('GET', '/some-url', undefined, angular.noop);
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(xhr.$$data).toBe(null);
  });

  it('should pass the correct falsy value to send if falsy body is set (excluding undefined, NaN)',
    function() {
      var values = [false, 0, '', null];
      angular.forEach(values, function(value) {
        $backend('GET', '/some-url', value, angular.noop);
        xhr = angular.mock.MockXhr.$$lastInstance;

        expect(xhr.$$data).toBe(value);
      });
    }
  );

  it('should pass NaN to send if NaN body is set', function() {
    $backend('GET', '/some-url', NaN, angular.noop);
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(isNaN(xhr.$$data)).toEqual(true);
  });

  it('should call completion function with xhr.statusText if present', function() {
    callback.mockImplementation(function(status, response, headers, statusText) {
      expect(statusText).toBe('OK');
    });

    $backend('GET', '/some-url', null, callback);
    xhr = angular.mock.MockXhr.$$lastInstance;
    xhr.statusText = 'OK';
    xhr.onload();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should call completion function with empty string if not present', function() {
    callback.mockImplementation(function(status, response, headers, statusText) {
      expect(statusText).toBe('');
    });

    $backend('GET', '/some-url', null, callback);
    xhr = angular.mock.MockXhr.$$lastInstance;
    xhr.onload();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should set only the requested headers', function() {
    $backend('POST', 'URL', null, angular.noop, {'X-header1': 'value1', 'X-header2': 'value2'});
    xhr = angular.mock.MockXhr.$$lastInstance;

    expect(xhr.$$reqHeaders).toEqual({
      'X-header1': 'value1',
      'X-header2': 'value2'
    });
  });

  it('should set requested headers even if they have falsy values', function() {
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

  it('should not try to read response data when request is aborted', function() {
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

  it('should complete the request on timeout', function() {
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

  it('should complete the request on abort', function() {
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

  it('should complete the request on error', function() {
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

  it('should complete the request on success', function() {
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

  it('should abort request on numerical timeout', function() {
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


  it('should abort request on $timeout promise resolution', angular.mock.inject(function($timeout) {
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


  it('should not abort resolved request on timeout promise resolution', angular.mock.inject(function($timeout) {
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


  it('should abort request on canceler promise resolution', angular.mock.inject(function($q, $browser) {
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


  it('should cancel timeout on completion', function() {
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


  it('should call callback with xhrStatus "abort" on explicit xhr.abort() when $timeout is set', angular.mock.inject(function($timeout) {
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


  it('should set withCredentials', function() {
    $backend('GET', '/some.url', null, callback, {}, null, true);
    expect(angular.mock.MockXhr.$$lastInstance.withCredentials).toBe(true);
  });


  it('should call $xhrFactory with method and url', function() {
    var mockXhrFactory = jest.fn(angular.mock.createMockXhr);
    $backend = ngInternals.createHttpBackend($browser, mockXhrFactory, $browser.defer, $jsonpCallbacks, fakeDocument);
    $backend('GET', '/some-url', 'some-data', angular.noop);
    expect(mockXhrFactory).toHaveBeenCalledWith('GET', '/some-url');
  });


  it('should set up event listeners', function() {
    var progressFn = function() {};
    var uploadProgressFn = function() {};
    $backend('GET', '/url', null, callback, {}, null, null, null,
        {progress: progressFn}, {progress: uploadProgressFn});
    xhr = angular.mock.MockXhr.$$lastInstance;
    expect(xhr.$$events.progress[0]).toBe(progressFn);
    expect(xhr.upload.$$events.progress[0]).toBe(uploadProgressFn);
  });


  describe('responseType', function() {

    it('should set responseType and return xhr.response', function() {
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
  });


  describe('JSONP', function() {

    var SCRIPT_URL = /([^?]*)\?cb=(.*)/;


    it('should add script tag for JSONP request', function() {
      callback.mockImplementation(function(status, response) {
        expect(status).toBe(200);
        expect(response).toBe('some-data');
      });

      $backend('JSONP', 'http://example.org/path?cb=JSON_CALLBACK', null, callback);
      expect(fakeDocument.$$scripts.length).toBe(1);

      var script = fakeDocument.$$scripts.shift(),
          url = script.src.match(SCRIPT_URL);

      expect(url[1]).toBe('http://example.org/path');
      $jsonpCallbacks[url[2]]('some-data');
      browserTrigger(script, 'load');

      expect(callback).toHaveBeenCalledTimes(1);
    });


    it('should clean up the callback and remove the script', function() {
      jest.spyOn($jsonpCallbacks, 'removeCallback');

      $backend('JSONP', 'http://example.org/path?cb=JSON_CALLBACK', null, callback);
      expect(fakeDocument.$$scripts.length).toBe(1);


      var script = fakeDocument.$$scripts.shift(),
          callbackId = script.src.match(SCRIPT_URL)[2];

      $jsonpCallbacks[callbackId]('some-data');
      browserTrigger(script, 'load');

      expect($jsonpCallbacks.removeCallback).toHaveBeenCalledOnceWith(callbackId);
      expect(fakeDocument.body.removeChild).toHaveBeenCalledOnceWith(script);
    });


    it('should set url to current location if not specified or empty string', function() {
      $backend('JSONP', undefined, null, callback);
      expect(fakeDocument.$$scripts[0].src).toBe($browser.url());
      fakeDocument.$$scripts.shift();

      $backend('JSONP', '', null, callback);
      expect(fakeDocument.$$scripts[0].src).toBe($browser.url());
    });


    it('should abort request on timeout and remove JSONP callback', function() {
      jest.spyOn($jsonpCallbacks, 'removeCallback');

      callback.mockImplementation(function(status, response) {
        expect(status).toBe(-1);
      });

      $backend('JSONP', 'http://example.org/path?cb=JSON_CALLBACK', null, callback, null, 2000);
      expect(fakeDocument.$$scripts.length).toBe(1);
      expect($browser.deferredFns[0].time).toBe(2000);

      var script = fakeDocument.$$scripts.shift(),
        callbackId = script.src.match(SCRIPT_URL)[2];

      $browser.defer.flush();
      expect(fakeDocument.$$scripts.length).toBe(0);
      expect(callback).toHaveBeenCalledTimes(1);

      expect($jsonpCallbacks.removeCallback).toHaveBeenCalledOnceWith(callbackId);
    });


    // TODO(vojta): test whether it fires "async-start"
    // TODO(vojta): test whether it fires "async-end" on both success and error
  });


  describe('protocols that return 0 status code', function() {

    function respond(status, content) {
      xhr = angular.mock.MockXhr.$$lastInstance;
      xhr.status = status;
      xhr.responseText = content;
      xhr.onload();
    }

    beforeEach(function() {
      $backend = ngInternals.createHttpBackend($browser, angular.mock.createMockXhr);
    });


    it('should convert 0 to 200 if content and file protocol', function() {
      $backend('GET', 'file:///whatever/index.html', null, callback);
      respond(0, 'SOME CONTENT');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[callback.mock.calls.length - 1][0]).toBe(200);
    });

    it('should convert 0 to 200 if content for protocols other than file', function() {
      $backend('GET', 'someProtocol:///whatever/index.html', null, callback);
      respond(0, 'SOME CONTENT');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[callback.mock.calls.length - 1][0]).toBe(200);
    });

    it('should convert 0 to 404 if no content and file protocol', function() {
      $backend('GET', 'file:///whatever/index.html', null, callback);
      respond(0, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[callback.mock.calls.length - 1][0]).toBe(404);
    });

    it('should not convert 0 to 404 if no content for protocols other than file', function() {
      $backend('GET', 'someProtocol:///whatever/index.html', null, callback);
      respond(0, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[callback.mock.calls.length - 1][0]).toBe(0);
    });

    it('should return original backend status code if different from 0', function() {
      // request to http://
      $backend('POST', 'http://rest_api/create_whatever', null, callback);
      respond(201, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[callback.mock.calls.length - 1][0]).toBe(201);


      // request to file://
      $backend('POST', 'file://rest_api/create_whatever', null, callback);
      respond(201, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[callback.mock.calls.length - 1][0]).toBe(201);

      // request to file:// with HTTP status >= 300
      $backend('POST', 'file://rest_api/create_whatever', null, callback);
      respond(503, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[callback.mock.calls.length - 1][0]).toBe(503);
    });
  });
});

