'use strict';

/* global getHash:true, stripHash:true */

var historyEntriesLength;
var sniffer = {};

// Resolves once `predicate` returns truthy, rejecting if that never happens
// within `timeout` ms.
function waitUntil(predicate, timeout) {
  timeout = timeout || 2000;

  return new Promise(function(resolve, reject) {
    var deadline = Date.now() + timeout;
    var intervalId = window.setInterval(function() {
      if (predicate()) {
        window.clearInterval(intervalId);
        resolve();
      } else if (Date.now() > deadline) {
        window.clearInterval(intervalId);
        reject(new Error('Timed out after ' + timeout + 'ms waiting for condition'));
      }
    }, 5);
  });
}

function MockWindow(options) {
  if (typeof options !== 'object') {
    options = {};
  }
  var events = {};
  var timeouts = this.timeouts = [];
  var locationHref = window.document.createElement('a');
  var committedHref = window.document.createElement('a');
  locationHref.href = committedHref.href = 'http://server/';
  var mockWindow = this;

  historyEntriesLength = 1;

  function replaceHash(href, hash) {
    // replace the hash with the new one (stripping off a leading hash if there is one)
    // See hash setter spec: https://url.spec.whatwg.org/#urlutils-and-urlutilsreadonly-members
    var index = href.indexOf('#');
    const hashlessHref = index === -1 ? href : href.slice(0, index);
    return hashlessHref + '#' + hash.replace(/^#/,'');
  }


  this.setTimeout = function(fn) {
    return timeouts.push(fn) - 1;
  };

  this.clearTimeout = function(id) {
    timeouts[id] = angular.noop;
  };

  this.setTimeout.flush = function(count) {
    count = count || timeouts.length;
    while (count-- > 0) timeouts.shift()();
  };

  this.addEventListener = function(name, listener) {
    if (angular.isUndefined(events[name])) events[name] = [];
    events[name].push(listener);
  };

  this.removeEventListener = angular.noop;

  this.fire = function(name) {
    angular.forEach(events[name], function(fn) {
      // type/target to make jQuery happy
      fn({
        type: name,
        target: {
          nodeType: 1
        }
      });
    });
  };

  this.location = {
    get href() {
      return committedHref.href;
    },
    set href(value) {
      locationHref.href = value;
      mockWindow.history.state = null;
      historyEntriesLength++;
      if (!options.updateAsync) this.flushHref();
    },
    get hash() {
      return getHash(committedHref.href);
    },
    set hash(value) {
      locationHref.href = replaceHash(locationHref.href, value);
      if (!options.updateAsync) this.flushHref();
    },
    replace(url) {
      locationHref.href = url;
      mockWindow.history.state = null;
      if (!options.updateAsync) this.flushHref();
    },
    flushHref() {
      committedHref.href = locationHref.href;
    }
  };

  this.history = {
    pushState() {
      this.replaceState(...arguments);
      historyEntriesLength++;
    },
    replaceState(state, title, url) {
      locationHref.href = url;
      if (!options.updateAsync) committedHref.href = locationHref.href;
      mockWindow.history.state = angular.copy(state);
      if (!options.updateAsync) this.flushHref();
    },
    flushHref() {
      committedHref.href = locationHref.href;
    }
  };
  this.history.state = null;
}

function MockDocument() {
  var self = this;

  this[0] = window.document;
  this.basePath = '/';

  this.find = function(name) {
    if (name === 'base') {
      return {
        attr(name) {
          if (name === 'href') {
            return self.basePath;
          } else {
            throw new Error(name);
          }
        }
      };
    } else {
      throw new Error(name);
    }
  };
}
 describe('browser', () => {
  /* global Browser: false, TaskTracker: false */
  var browser;

  var fakeWindow;
  var fakeDocument;
  var fakeLog;
  var logs;
  var taskTrackerFactory;

   beforeEach(() => {
    sniffer = {history: true};
    fakeWindow = new MockWindow();
    fakeDocument = new MockDocument();
    taskTrackerFactory = function(log) { return new ngInternals.TaskTracker(log); };

    logs = {log:[], warn:[], info:[], error:[]};

    fakeLog = {
      log() { logs.log.push(slice.call(arguments)); },
      warn() { logs.warn.push(slice.call(arguments)); },
      info() { logs.info.push(slice.call(arguments)); },
      error() { logs.error.push(slice.call(arguments)); }
    };


    browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);
  });

  describe('MockBrowser', () => {
    describe('historyEntriesLength', () => {
      test('should increment historyEntriesLength when setting location.href', () => {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.location.href = '/foo';
        expect(historyEntriesLength).toBe(2);
      });

      test('should not increment historyEntriesLength when using location.replace', () => {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.location.replace('/foo');
        expect(historyEntriesLength).toBe(1);
      });

      test('should increment historyEntriesLength when using history.pushState', () => {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.history.pushState({a: 2}, 'foo', '/bar');
        expect(historyEntriesLength).toBe(2);
      });

      test('should not increment historyEntriesLength when using history.replaceState', () => {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.history.replaceState({a: 2}, 'foo', '/bar');
        expect(historyEntriesLength).toBe(1);
      });
    });

    test('should return the same state object on every read', () => {
      fakeWindow = new MockWindow();
      fakeWindow.location.state = {prop: 'val'};
      browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);

      browser.url(fakeWindow.location.href, false, {prop: 'val'});
      expect(fakeWindow.history.state).toBe(fakeWindow.history.state);
    });
  });


  describe('notifyWhenNoOutstandingRequests', () => {
    test('should invoke callbacks immediately if there are no pending tasks', () => {
      var callback = jest.fn().mockName('callback');
      browser.notifyWhenNoOutstandingRequests(callback);
      expect(callback).toHaveBeenCalled();
    });


    test('should invoke callbacks immediately if there are no pending tasks (for specific task-type)',
      function() {
        var callbackAll = jest.fn().mockName('callbackAll');
        var callbackFoo = jest.fn().mockName('callbackFoo');

        browser.$$incOutstandingRequestCount();
        browser.notifyWhenNoOutstandingRequests(callbackAll);
        browser.notifyWhenNoOutstandingRequests(callbackFoo, 'foo');

        expect(callbackAll).not.toHaveBeenCalled();
        expect(callbackFoo).toHaveBeenCalled();
      }
    );


    test('should invoke callbacks as soon as there are no pending tasks', () => {
      var callback = jest.fn().mockName('callback');

      browser.$$incOutstandingRequestCount();
      browser.notifyWhenNoOutstandingRequests(callback);
      expect(callback).not.toHaveBeenCalled();

      browser.$$completeOutstandingRequest(angular.noop);
      expect(callback).toHaveBeenCalled();
    });


    test('should invoke callbacks as soon as there are no pending tasks (for specific task-type)',
      function() {
        var callbackAll = jest.fn().mockName('callbackAll');
        var callbackFoo = jest.fn().mockName('callbackFoo');

        browser.$$incOutstandingRequestCount();
        browser.$$incOutstandingRequestCount('foo');
        browser.notifyWhenNoOutstandingRequests(callbackAll);
        browser.notifyWhenNoOutstandingRequests(callbackFoo, 'foo');

        expect(callbackAll).not.toHaveBeenCalled();
        expect(callbackFoo).not.toHaveBeenCalled();

        browser.$$completeOutstandingRequest(angular.noop, 'foo');

        expect(callbackAll).not.toHaveBeenCalled();
        expect(callbackFoo).toHaveBeenCalledTimes(1);

        browser.$$completeOutstandingRequest(angular.noop);

        expect(callbackAll).toHaveBeenCalledTimes(1);
        expect(callbackFoo).toHaveBeenCalledTimes(1);
      }
    );
  });


  describe('defer', () => {
    test('should execute fn asynchronously via setTimeout', () => {
      var callback = jest.fn().mockName('deferred');

      browser.defer(callback);
      expect(callback).not.toHaveBeenCalled();

      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });


    test('should update outstandingRequests counter', () => {
      var noPendingTasksSpy = jest.fn().mockName('noPendingTasks');

      browser.defer(angular.noop);
      browser.notifyWhenNoOutstandingRequests(noPendingTasksSpy);
      expect(noPendingTasksSpy).not.toHaveBeenCalled();

      fakeWindow.setTimeout.flush();
      expect(noPendingTasksSpy).toHaveBeenCalledTimes(1);
    });


    test('should update outstandingRequests counter (for specific task-type)', () => {
      var noPendingFooTasksSpy = jest.fn().mockName('noPendingFooTasks');
      var noPendingTasksSpy = jest.fn().mockName('noPendingTasks');

      browser.defer(angular.noop, 0, 'foo');
      browser.defer(angular.noop, 0, 'bar');

      browser.notifyWhenNoOutstandingRequests(noPendingFooTasksSpy, 'foo');
      browser.notifyWhenNoOutstandingRequests(noPendingTasksSpy);
      expect(noPendingFooTasksSpy).not.toHaveBeenCalled();
      expect(noPendingTasksSpy).not.toHaveBeenCalled();

      fakeWindow.setTimeout.flush(1);
      expect(noPendingFooTasksSpy).toHaveBeenCalledTimes(1);
      expect(noPendingTasksSpy).not.toHaveBeenCalled();

      fakeWindow.setTimeout.flush(1);
      expect(noPendingFooTasksSpy).toHaveBeenCalledTimes(1);
      expect(noPendingTasksSpy).toHaveBeenCalledTimes(1);
    });


    test('should return unique deferId', () => {
      var deferId1 = browser.defer(angular.noop);
      var deferId2 = browser.defer(angular.noop);

      expect(deferId1).toBeDefined();
      expect(deferId2).toBeDefined();
      expect(deferId1).not.toEqual(deferId2);
    });


    describe('cancel', () => {
      test('should allow tasks to be canceled with returned deferId', () => {
        var log = [];
        var deferId1 = browser.defer(function() { log.push('cancel me'); });
        var deferId2 = browser.defer(function() { log.push('ok'); });
        var deferId3 = browser.defer(function() { log.push('cancel me, now!'); });

        expect(log).toEqual([]);
        expect(browser.defer.cancel(deferId1)).toBe(true);
        expect(browser.defer.cancel(deferId3)).toBe(true);
        fakeWindow.setTimeout.flush();
        expect(log).toEqual(['ok']);
        expect(browser.defer.cancel(deferId2)).toBe(false);
      });


      test('should update outstandingRequests counter', () => {
        var noPendingTasksSpy = jest.fn().mockName('noPendingTasks');
        var deferId = browser.defer(angular.noop);

        browser.notifyWhenNoOutstandingRequests(noPendingTasksSpy);
        expect(noPendingTasksSpy).not.toHaveBeenCalled();

        browser.defer.cancel(deferId);
        expect(noPendingTasksSpy).toHaveBeenCalledTimes(1);
      });


      test('should update outstandingRequests counter (for specific task-type)', () => {
        var noPendingFooTasksSpy = jest.fn().mockName('noPendingFooTasks');
        var noPendingTasksSpy = jest.fn().mockName('noPendingTasks');

        var deferId1 = browser.defer(angular.noop, 0, 'foo');
        var deferId2 = browser.defer(angular.noop, 0, 'bar');

        browser.notifyWhenNoOutstandingRequests(noPendingFooTasksSpy, 'foo');
        browser.notifyWhenNoOutstandingRequests(noPendingTasksSpy);
        expect(noPendingFooTasksSpy).not.toHaveBeenCalled();
        expect(noPendingTasksSpy).not.toHaveBeenCalled();

        browser.defer.cancel(deferId1);
        expect(noPendingFooTasksSpy).toHaveBeenCalledTimes(1);
        expect(noPendingTasksSpy).not.toHaveBeenCalled();

        browser.defer.cancel(deferId2);
        expect(noPendingFooTasksSpy).toHaveBeenCalledTimes(1);
        expect(noPendingTasksSpy).toHaveBeenCalledTimes(1);
      });
    });
  });


  describe('url', () => {
    var pushState;
    var replaceState;
    var locationReplace;

     beforeEach(() => {
      pushState = jest.spyOn(fakeWindow.history, 'pushState').mockImplementation(() => {});
      replaceState = jest.spyOn(fakeWindow.history, 'replaceState').mockImplementation(() => {});
      locationReplace = jest.spyOn(fakeWindow.location, 'replace').mockImplementation(() => {});
    });

    test('should return current location.href', () => {
      fakeWindow.location.href = 'http://test.com';
      expect(browser.url()).toEqual('http://test.com/');

      fakeWindow.location.href = 'https://another.com';
      expect(browser.url()).toEqual('https://another.com/');
    });

    test('should strip an empty hash fragment', () => {
      fakeWindow.location.href = 'http://test.com/#';
      expect(browser.url()).toEqual('http://test.com/');

      fakeWindow.location.href = 'https://another.com/#foo';
      expect(browser.url()).toEqual('https://another.com/#foo');
    });

    test('should use history.pushState when available', () => {
      sniffer.history = true;
      browser.url('http://new.org');

      expect(pushState).toHaveBeenCalledTimes(1);
      expect(pushState.mock.calls[0][2]).toEqual('http://new.org/');

      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });

    test('should use history.replaceState when available', () => {
      sniffer.history = true;
      browser.url('http://new.org', true);

      expect(replaceState).toHaveBeenCalledTimes(1);
      expect(replaceState.mock.calls[0][2]).toEqual('http://new.org/');

      expect(pushState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });

    test('should set location.href when pushState not available', () => {
      sniffer.history = false;
      browser.url('http://new.org');

      expect(fakeWindow.location.href).toEqual('http://new.org/');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
    });

    test('should set location.href and not use pushState when the url only changed in the hash fragment to please IE10/11', () => {
      sniffer.history = true;
      browser.url('http://server/#123');

      expect(fakeWindow.location.href).toEqual('http://server/#123');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
    });

    test('should retain the # character when the only change is clearing the hash fragment, to prevent page reload', () => {
      sniffer.history = true;

      browser.url('http://server/#123');
      expect(fakeWindow.location.href).toEqual('http://server/#123');

      browser.url('http://server/');
      expect(fakeWindow.location.href).toEqual('http://server/#');

    });

    test('should use location.replace when history.replaceState not available', () => {
      sniffer.history = false;
      browser.url('http://new.org', true);

      expect(locationReplace).toHaveBeenCalledWith('http://new.org/');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });


    test('should use location.replace and not use replaceState when the url only changed in the hash fragment to please IE10/11', () => {
      sniffer.history = true;
      browser.url('http://server/#123', true);

      expect(locationReplace).toHaveBeenCalledWith('http://server/#123');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });


    test('should return $browser to allow chaining', () => {
      expect(browser.url('http://any.com')).toBe(browser);
    });

    test('should return $browser to allow chaining even if the previous and current URLs and states match', () => {
      expect(browser.url('http://any.com').url('http://any.com')).toBe(browser);
      var state = { any: 'foo' };
      expect(browser.url('http://any.com', false, state).url('http://any.com', false, state)).toBe(browser);
      expect(browser.url('http://any.com', true, state).url('http://any.com', true, state)).toBe(browser);
    });

    test('should not set URL when the URL is already set', () => {
      var current = fakeWindow.location.href;
      sniffer.history = false;
      fakeWindow.location.href = 'http://dontchange/';
      browser.url(current);
      expect(fakeWindow.location.href).toBe('http://dontchange/');
    });

    test('should not read out location.href if a reload was triggered but still allow to change the url', () => {
      sniffer.history = false;
      browser.url('http://server/someOtherUrlThatCausesReload');
      expect(fakeWindow.location.href).toBe('http://server/someOtherUrlThatCausesReload');

      fakeWindow.location.href = 'http://someNewUrl';
      expect(browser.url()).toBe('http://server/someOtherUrlThatCausesReload');

      browser.url('http://server/someOtherUrl');
      expect(browser.url()).toBe('http://server/someOtherUrl');
      expect(fakeWindow.location.href).toBe('http://server/someOtherUrl');
    });

    test('assumes that changes to location.hash occur in sync', async function() {
      // This is an asynchronous integration test that changes the
      // hash in all possible ways and checks
      // - whether the change to the hash can be read out in sync
      // - whether the change to the hash can be read out in the hashchange event
      var realWin = window;

      var $realWin = angular.element(realWin);
      var hashInHashChangeEvent = [];

      function hashListener() {
        hashInHashChangeEvent.push(realWin.location.hash);
      }

      $realWin.on('hashchange', hashListener);

      try {
        realWin.location.hash = '1';
        realWin.location.href += '2';
        realWin.location.replace(realWin.location.href + '3');
        realWin.location.assign(realWin.location.href + '4');

        expect(realWin.location.hash).toBe('#1234');

        await waitUntil(function() {
          return hashInHashChangeEvent.length > 3;
        });

        angular.forEach(hashInHashChangeEvent, function(hash) {
          expect(hash).toBe('#1234');
        });
      } finally {
        $realWin.off('hashchange', hashListener);
      }
    });
  });

  describe('url (with ie 11 weirdnesses)', () => {

    test('url() should actually set the url, even if IE 11 is weird and replaces HTML entities in the URL', () => {
      // this test can not be expressed with the Jasmine spies in the previous describe block, because $browser.url()
      // needs to observe the change to location.href during its invocation to enter the failing code path, but the spies
      // are not callThrough

      sniffer.history = true;
      var originalReplace = fakeWindow.location.replace;
      fakeWindow.location.replace = function(url) {
        url = url.replace('&not', '¬');
        // I really don't know why IE 11 (sometimes) does this, but I am not the only one to notice:
        // https://connect.microsoft.com/IE/feedback/details/1040980/bug-in-ie-which-interprets-document-location-href-as-html
        originalReplace.call(this, url);
      };

      // the initial URL contains a lengthy oauth token in the hash
      var initialUrl = 'http://test.com/oauthcallback#state=xxx%3D&not-before-policy=0';
      fakeWindow.location.href = initialUrl;
      browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);

      // somehow, $location gets a version of this url where the = is no longer escaped, and tells the browser:
      var initialUrlFixedByLocation = initialUrl.replace('%3D', '=');
      browser.url(initialUrlFixedByLocation, true, null);
      expect(browser.url()).toEqual(initialUrlFixedByLocation);

      // a little later (but in the same digest cycle) the view asks $location to replace the url, which tells $browser
      var secondUrl = 'http://test.com/otherView';
      browser.url(secondUrl, true, null);
      expect(browser.url()).toEqual(secondUrl);
    });

  });

  describe('url (when state passed)', () => {
    var currentHref;
    var pushState;
    var replaceState;
    var locationReplace;

     beforeEach(() => {
      sniffer = {history: true};

      fakeWindow = new MockWindow();
      currentHref = fakeWindow.location.href;
      pushState = jest.spyOn(fakeWindow.history, 'pushState');
      replaceState = jest.spyOn(fakeWindow.history, 'replaceState');
      locationReplace = jest.spyOn(fakeWindow.location, 'replace');

      browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);
      browser.onUrlChange(function() {});
    });

    test('should change state', () => {
      browser.url(currentHref, false, {prop: 'val1'});
      expect(fakeWindow.history.state).toEqual({prop: 'val1'});
      browser.url(currentHref + '/something', false, {prop: 'val2'});
      expect(fakeWindow.history.state).toEqual({prop: 'val2'});
    });

    test('should allow to set falsy states (except `undefined`)', () => {
      fakeWindow.history.state = {prop: 'val1'};
      fakeWindow.fire('popstate');

      browser.url(currentHref, false, null);
      expect(fakeWindow.history.state).toBe(null);

      browser.url(currentHref, false, false);
      expect(fakeWindow.history.state).toBe(false);

      browser.url(currentHref, false, '');
      expect(fakeWindow.history.state).toBe('');

      browser.url(currentHref, false, 0);
      expect(fakeWindow.history.state).toBe(0);
    });

    test('should treat `undefined` state as `null`', () => {
      fakeWindow.history.state = {prop: 'val1'};
      fakeWindow.fire('popstate');

      browser.url(currentHref, false, undefined);
      expect(fakeWindow.history.state).toBe(null);
    });

    test('should do pushState with the same URL and a different state', () => {
      browser.url(currentHref, false, {prop: 'val1'});
      expect(fakeWindow.history.state).toEqual({prop: 'val1'});

      browser.url(currentHref, false, null);
      expect(fakeWindow.history.state).toBe(null);

      browser.url(currentHref, false, {prop: 'val2'});
      browser.url(currentHref, false, {prop: 'val3'});
      expect(fakeWindow.history.state).toEqual({prop: 'val3'});
    });

    test('should do pushState with the same URL and deep equal but referentially different state', () => {
      fakeWindow.history.state = {prop: 'val'};
      fakeWindow.fire('popstate');
      expect(historyEntriesLength).toBe(1);

      browser.url(currentHref, false, {prop: 'val'});
      expect(fakeWindow.history.state).toEqual({prop: 'val'});
      expect(historyEntriesLength).toBe(2);
    });

    test('should not do pushState with the same URL and state from $browser.state()', () => {
      browser.url(currentHref, false, {prop: 'val'});

      pushState.mockClear();
      replaceState.mockClear();
      locationReplace.mockClear();

      browser.url(currentHref, false, browser.state());
      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
    });

    test('should not do pushState with a URL using relative protocol', () => {
      browser.url('http://server/');

      pushState.mockClear();
      replaceState.mockClear();
      locationReplace.mockClear();

      browser.url('//server');
      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
    });

    test('should not do pushState with a URL only adding a trailing slash after domain', () => {
      // A domain without a trailing /
      browser.url('http://server');

      pushState.mockClear();
      replaceState.mockClear();
      locationReplace.mockClear();

      // A domain from something such as window.location.href with a trailing slash
      browser.url('http://server/');
      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
    });

    test('should not do pushState with a URL only removing a trailing slash after domain', () => {
      // A domain from something such as window.location.href with a trailing slash
      browser.url('http://server/');

      pushState.mockClear();
      replaceState.mockClear();
      locationReplace.mockClear();

      // A domain without a trailing /
      browser.url('http://server');
      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
    });

    test('should do pushState with a URL only adding a trailing slash after the path', () => {
      browser.url('http://server/foo');

      pushState.mockClear();
      replaceState.mockClear();
      locationReplace.mockClear();

      browser.url('http://server/foo/');
      expect(pushState).toHaveBeenCalledTimes(1);
      expect(fakeWindow.location.href).toEqual('http://server/foo/');
    });

    test('should do pushState with a URL only removing a trailing slash after the path', () => {
      browser.url('http://server/foo/');

      pushState.mockClear();
      replaceState.mockClear();
      locationReplace.mockClear();

      browser.url('http://server/foo');
      expect(pushState).toHaveBeenCalledTimes(1);
      expect(fakeWindow.location.href).toEqual('http://server/foo');
    });
  });

  describe('state', () => {
    var currentHref;

     beforeEach(() => {
      sniffer = {history: true};
      fakeWindow = new MockWindow();
      browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);
      currentHref = fakeWindow.location.href;
    });

    test('should not access `history.state` when `$sniffer.history` is false', () => {
      // In the context of a Chrome Packaged App, although `history.state` is present, accessing it
      // is not allowed and logs an error in the console. We should not try to access
      // `history.state` in contexts where `$sniffer.history` is false.

      var historyStateAccessed = false;
      var mockSniffer = {history: false};
      var mockWindow = new MockWindow();

      var _state = mockWindow.history.state;
      Object.defineProperty(mockWindow.history, 'state', {
        get() {
          historyStateAccessed = true;
          return _state;
        }
      });

      var browser = new ngInternals.Browser(mockWindow, fakeDocument, fakeLog, mockSniffer, taskTrackerFactory);

      expect(historyStateAccessed).toBe(false);
    });

    test('should return history.state', () => {
      browser.url(currentHref, false, {prop: 'val'});
      expect(browser.state()).toEqual({prop: 'val'});
      browser.url(currentHref, false, 2);
      expect(browser.state()).toEqual(2);
      browser.url(currentHref, false, null);
      expect(browser.state()).toEqual(null);
    });

    test('should return null if history.state is undefined', () => {
      browser.url(currentHref, false, undefined);
      expect(browser.state()).toBe(null);
    });

    test('should return the same state object in subsequent invocations', () => {
      browser.url(currentHref, false, {prop: 'val'});
      expect(browser.state()).toBe(browser.state());
    });
  });

  describe('urlChange', () => {
    var callback;

     beforeEach(() => {
      callback = jest.fn().mockName('onUrlChange');
    });

     afterEach(() => {
      dealoc(fakeWindow);
    });

    test('should return registered callback', () => {
      expect(browser.onUrlChange(callback)).toBe(callback);
    });

    test('should forward popstate event with new url when history supported', () => {
      sniffer.history = true;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      fakeWindow.fire('popstate');
      expect(callback).toHaveBeenCalledWith('http://server/new', null);

      fakeWindow.fire('hashchange');
      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should forward only popstate event when history supported', () => {
      sniffer.history = true;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      fakeWindow.fire('popstate');
      expect(callback).toHaveBeenCalledWith('http://server/new', null);

      fakeWindow.fire('hashchange');
      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should forward hashchange event with new url when history not supported', () => {
      sniffer.history = false;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      fakeWindow.fire('hashchange');
      expect(callback).toHaveBeenCalledWith('http://server/new', null);

      fakeWindow.fire('popstate');
      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should not fire urlChange if changed by browser.url method', () => {
      sniffer.history = false;
      browser.onUrlChange(callback);
      browser.url('http://new.com/');

      fakeWindow.fire('hashchange');
      expect(callback).not.toHaveBeenCalled();
    });

    describe('state handling', () => {
      var currentHref;

       beforeEach(() => {
        sniffer = {history: true};
        fakeWindow = new MockWindow();
        browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);
        currentHref = fakeWindow.location.href;
      });

      test('should fire onUrlChange listeners only once if both popstate and hashchange triggered', () => {
        fakeWindow.history.state = {prop: 'val'};
        browser.onUrlChange(callback);

        fakeWindow.fire('hashchange');
        fakeWindow.fire('popstate');
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });


    test('should stop calling callbacks when application has been torn down', () => {
      sniffer.history = true;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      browser.$$applicationDestroyed();

      fakeWindow.fire('popstate');
      expect(callback).not.toHaveBeenCalled();

      fakeWindow.fire('hashchange');
      fakeWindow.setTimeout.flush();
      expect(callback).not.toHaveBeenCalled();
    });

  });


  describe('baseHref', () => {
    var jqDocHead;

     beforeEach(() => {
      jqDocHead = angular.element(window.document).find('head');
    });

    test('should return value from <base href>', () => {
      fakeDocument.basePath = '/base/path/';
      expect(browser.baseHref()).toEqual('/base/path/');
    });

    test('should return \'\' (empty string) if no <base href>', () => {
      fakeDocument.basePath = undefined;
      expect(browser.baseHref()).toEqual('');
    });

    test('should remove domain from <base href>', () => {
      fakeDocument.basePath = 'http://host.com/base/path/';
      expect(browser.baseHref()).toEqual('/base/path/');

      fakeDocument.basePath = 'http://host.com/base/path/index.html';
      expect(browser.baseHref()).toEqual('/base/path/index.html');
    });

    test('should remove domain from <base href> beginning with \'//\'', () => {
      fakeDocument.basePath = '//google.com/base/path/';
      expect(browser.baseHref()).toEqual('/base/path/');
    });
  });

  describe('integration tests with $location', () => {

    function setup(options) {
      fakeWindow = new MockWindow(options);
      browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);

      angular.mock.module(function($provide, $locationProvider) {

        jest.spyOn(fakeWindow.history, 'pushState').mockImplementation(function(stateObj, title, newUrl) {
          fakeWindow.location.href = newUrl;
        });
        jest.spyOn(fakeWindow.location, 'replace').mockImplementation(function(newUrl) {
          fakeWindow.location.href = newUrl;
        });
        $provide.value('$browser', browser);

        sniffer.history = options.history;
        $provide.value('$sniffer', sniffer);

        $locationProvider.html5Mode(options.html5Mode);
      });
    }

    describe('update $location when it was changed outside of AngularJS in sync ' +
       'before $digest was called', function() {

      test('should work with no history support, no html5Mode', () => {
        setup({
          history: false,
          html5Mode: false
        });
        angular.mock.inject(function($rootScope, $location) {
          $rootScope.$apply(function() {
            $location.path('/initialPath');
          });
          expect(fakeWindow.location.href).toBe('http://server/#!/initialPath');

          fakeWindow.location.href = 'http://server/#!/someTestHash';

          $rootScope.$digest();

          expect($location.path()).toBe('/someTestHash');
        });
      });

      test('should work with history support, no html5Mode', () => {
        setup({
          history: true,
          html5Mode: false
        });
        angular.mock.inject(function($rootScope, $location) {
          $rootScope.$apply(function() {
            $location.path('/initialPath');
          });
          expect(fakeWindow.location.href).toBe('http://server/#!/initialPath');

          fakeWindow.location.href = 'http://server/#!/someTestHash';

          $rootScope.$digest();

          expect($location.path()).toBe('/someTestHash');
        });
      });

      test('should work with no history support, with html5Mode', () => {
        setup({
          history: false,
          html5Mode: true
        });
        angular.mock.inject(function($rootScope, $location) {
          $rootScope.$apply(function() {
            $location.path('/initialPath');
          });
          expect(fakeWindow.location.href).toBe('http://server/#!/initialPath');

          fakeWindow.location.href = 'http://server/#!/someTestHash';

          $rootScope.$digest();

          expect($location.path()).toBe('/someTestHash');
        });
      });

      test('should work with history support, with html5Mode', () => {
        setup({
          history: true,
          html5Mode: true
        });
        angular.mock.inject(function($rootScope, $location) {
          $rootScope.$apply(function() {
            $location.path('/initialPath');
          });
          expect(fakeWindow.location.href).toBe('http://server/initialPath');

          fakeWindow.location.href = 'http://server/someTestHash';

          $rootScope.$digest();

          expect($location.path()).toBe('/someTestHash');
        });
      });

    });

    test('should not reload the page on every $digest when the page will be reloaded due to url rewrite on load', () => {
      setup({
        history: false,
        html5Mode: true
      });
      fakeWindow.location.href = 'http://server/some/deep/path';
      var changeUrlCount = 0;
      var _url = browser.url;
      browser.url = function(newUrl, replace, state) {
        if (newUrl) {
          changeUrlCount++;
        }
        return _url.call(this, newUrl, replace);
      };
      jest.spyOn(browser, 'url');
      angular.mock.inject(function($rootScope, $location) {
        $rootScope.$digest();
        $rootScope.$digest();
        $rootScope.$digest();
        $rootScope.$digest();

        // from $location for rewriting the initial url into a hash url
        expect(browser.url).toHaveBeenCalledWith('http://server/#!/some/deep/path', true);
        expect(changeUrlCount).toBe(1);
      });

    });

    // issue #12241
    test('should not infinite digest if the browser does not synchronously update the location properties', () => {
      setup({
        history: true,
        html5Mode: true,
        updateAsync: true // Simulate a browser that doesn't update the href synchronously
      });

      angular.mock.inject(function($location, $rootScope) {

        // Change the hash within AngularJS and check that we don't infinitely digest
        $location.hash('newHash');
        expect(function() { $rootScope.$digest(); }).not.toThrow();
        expect($location.absUrl()).toEqual('http://server/#newHash');

        // Now change the hash from outside AngularJS and check that $location updates correctly
        fakeWindow.location.hash = '#otherHash';

        // simulate next tick - since this browser doesn't update synchronously
        fakeWindow.location.flushHref();
        fakeWindow.fire('hashchange');

        expect($location.absUrl()).toEqual('http://server/#otherHash');
      });
    });

    // issue #16632
    test('should not trigger `$locationChangeStart` more than once due to trailing `#`', () => {
      setup({
        history: true,
        html5Mode: true
      });

      angular.mock.inject(function($flushPendingTasks, $location, $rootScope) {
        $rootScope.$digest();

        var spy = jest.fn().mockName('$locationChangeStart');
        $rootScope.$on('$locationChangeStart', spy);

        $rootScope.$evalAsync(function() {
          fakeWindow.location.href += '#';
        });
        $rootScope.$digest();

        expect(fakeWindow.location.href).toBe('http://server/#');
        expect($location.absUrl()).toBe('http://server/');

        expect(spy.mock.calls.length).toBe(0);
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('integration test with $rootScope', () => {

    beforeEach(angular.mock.module(function($provide, $locationProvider) {
      $provide.value('$browser', browser);
    }));

    test('should not interfere with legacy browser url replace behavior', () => {
      angular.mock.inject(function($rootScope) {
        var current = fakeWindow.location.href;
        var newUrl = 'http://notyet/';
        sniffer.history = false;
        expect(historyEntriesLength).toBe(1);
        browser.url(newUrl, true);
        expect(browser.url()).toBe(newUrl);
        expect(historyEntriesLength).toBe(1);
        $rootScope.$digest();
        expect(browser.url()).toBe(newUrl);
        expect(historyEntriesLength).toBe(1);
      });
    });

  });
});
