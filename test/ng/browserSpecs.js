'use strict';

/* global getHash:true, stripHash:true */

var historyEntriesLength;
var sniffer = {};

function MockWindow(options) {
  if (typeof options !== 'object') {
    options = {};
  }
  var events = {};
  var timeouts = this.timeouts = [];
  var locationHref = 'http://server/';
  var committedHref = 'http://server/';
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

  this.setTimeout.flush = function() {
    var length = timeouts.length;
    while (length-- > 0) timeouts.shift()();
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
      return committedHref;
    },
    set href(value) {
      locationHref = value;
      mockWindow.history.state = null;
      historyEntriesLength++;
      if (!options.updateAsync) this.flushHref();
    },
    get hash() {
      return getHash(committedHref);
    },
    set hash(value) {
      locationHref = replaceHash(locationHref, value);
      if (!options.updateAsync) this.flushHref();
    },
    replace(url) {
      locationHref = url;
      mockWindow.history.state = null;
      if (!options.updateAsync) this.flushHref();
    },
    flushHref() {
      committedHref = locationHref;
    }
  };

  this.history = {
    pushState() {
      this._replaceState.apply(this, arguments);
      historyEntriesLength++;
    },
    flushHref() {
      committedHref = locationHref;
    },
    replaceState(state, title, url) {
      return this._replaceState(state, title, url);
    },
    _replaceState(state, title, url) {
      locationHref = url;
      if (!options.updateAsync) committedHref = locationHref;
      mockWindow.history.state = angular.copy(state);
      if (!options.updateAsync) this.flushHref();
    },
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

describe('browser', function() {
  /* global Browser: false */
  var browser;

  var fakeWindow;
  var fakeDocument;
  var fakeLog;
  var logs;
  var scripts;
  var removedScripts;

  beforeEach(function() {
    scripts = [];
    removedScripts = [];
    sniffer = {history: true};
    fakeWindow = new MockWindow();
    fakeDocument = new MockDocument();

    logs = {log:[], warn:[], info:[], error:[]};

    fakeLog = {log() { logs.log.push(slice.call(arguments)); },
                   warn() { logs.warn.push(slice.call(arguments)); },
                   info() { logs.info.push(slice.call(arguments)); },
                   error() { logs.error.push(slice.call(arguments)); }};

    browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer);
  });

  describe('MockBrowser', function() {
    describe('historyEntriesLength', function() {
      it('should increment historyEntriesLength when setting location.href', function() {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.location.href = '/foo';
        expect(historyEntriesLength).toBe(2);
      });

      it('should not increment historyEntriesLength when using location.replace', function() {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.location.replace('/foo');
        expect(historyEntriesLength).toBe(1);
      });

      it('should increment historyEntriesLength when using history.pushState', function() {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.history.pushState({a: 2}, 'foo', '/bar');
        expect(historyEntriesLength).toBe(2);
      });

      it('should not increment historyEntriesLength when using history.replaceState', function() {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.history.replaceState({a: 2}, 'foo', '/bar');
        expect(historyEntriesLength).toBe(1);
      });
    });

    describe('in a supported browser', runTests());

    function runTests() {
      return function() {
        it('should return the same state object on every read', function() {
          fakeWindow = new MockWindow();
          fakeWindow.location.state = {prop: 'val'};
          browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer);

          browser.url(fakeWindow.location.href, false, {prop: 'val'});
          expect(fakeWindow.history.state).toBe(fakeWindow.history.state);
        });
      };
    }
  });

  describe('outstanding requests', function() {
    it('should process callbacks immediately with no outstanding requests', function() {
      var callback = jest.fn();
      browser.notifyWhenNoOutstandingRequests(callback);
      expect(callback).toHaveBeenCalled();
    });
  });


  describe('defer', function() {
    it('should execute fn asynchronously via setTimeout', function() {
      var callback = jest.fn();

      browser.defer(callback);
      expect(callback).not.toHaveBeenCalled();

      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });


    it('should update outstandingRequests counter', function() {
      var callback = jest.fn();

      browser.defer(callback);
      expect(callback).not.toHaveBeenCalled();

      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });


    it('should return unique deferId', function() {
      var deferId1 = browser.defer(angular.noop);
      var deferId2 = browser.defer(angular.noop);

      expect(deferId1).toBeDefined();
      expect(deferId2).toBeDefined();
      expect(deferId1).not.toEqual(deferId2);
    });


    describe('cancel', function() {
      it('should allow tasks to be canceled with returned deferId', function() {
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
    });
  });


  describe('url', function() {
    var pushState;
    var replaceState;
    var locationReplace;

    beforeEach(function() {
      pushState = jest.spyOn(fakeWindow.history, 'pushState').mockImplementation(() => {});
      replaceState = jest.spyOn(fakeWindow.history, 'replaceState').mockImplementation(() => {});
      locationReplace = jest.spyOn(fakeWindow.location, 'replace').mockImplementation(() => {});
    });

    it('should return current location.href', function() {
      fakeWindow.location.href = 'http://test.com';
      expect(browser.url()).toEqual('http://test.com');

      fakeWindow.location.href = 'https://another.com';
      expect(browser.url()).toEqual('https://another.com');
    });

    it('should use history.pushState when available', function() {
      sniffer.history = true;
      browser.url('http://new.org');

      expect(pushState).toHaveBeenCalledTimes(1);
      expect(pushState.mock.calls[0][2]).toEqual('http://new.org');

      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });

    it('should use history.replaceState when available', function() {
      sniffer.history = true;
      browser.url('http://new.org', true);

      expect(replaceState).toHaveBeenCalledTimes(1);
      expect(replaceState.mock.calls[0][2]).toEqual('http://new.org');

      expect(pushState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });

    it('should set location.href when pushState not available', function() {
      sniffer.history = false;
      browser.url('http://new.org');

      expect(fakeWindow.location.href).toEqual('http://new.org');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
    });

    it('should set location.href and not use pushState when the url only changed in the hash fragment to please IE10/11', function() {
      sniffer.history = true;
      browser.url('http://server/#123');

      expect(fakeWindow.location.href).toEqual('http://server/#123');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
    });

    it('should retain the # character when the only change is clearing the hash fragment, to prevent page reload', function() {
      sniffer.history = true;

      browser.url('http://server/#123');
      expect(fakeWindow.location.href).toEqual('http://server/#123');

      browser.url('http://server/');
      expect(fakeWindow.location.href).toEqual('http://server/#');

    });

    it('should use location.replace when history.replaceState not available', function() {
      sniffer.history = false;
      browser.url('http://new.org', true);

      expect(locationReplace).toHaveBeenCalledWith('http://new.org');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });


    it('should use location.replace and not use replaceState when the url only changed in the hash fragment to please IE10/11', function() {
      sniffer.history = true;
      browser.url('http://server/#123', true);

      expect(locationReplace).toHaveBeenCalledWith('http://server/#123');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });


    it('should return $browser to allow chaining', function() {
      expect(browser.url('http://any.com')).toBe(browser);
    });

    it('should return $browser to allow chaining even if the previous and current URLs and states match', function() {
      expect(browser.url('http://any.com').url('http://any.com')).toBe(browser);
      var state = { any: 'foo' };
      expect(browser.url('http://any.com', false, state).url('http://any.com', false, state)).toBe(browser);
      expect(browser.url('http://any.com', true, state).url('http://any.com', true, state)).toBe(browser);
    });

    it('should decode single quotes to work around FF bug 407273', function() {
      fakeWindow.location.href = 'http://ff-bug/?single%27quote';
      expect(browser.url()).toBe('http://ff-bug/?single\'quote');
    });

    it('should not set URL when the URL is already set', function() {
      var current = fakeWindow.location.href;
      sniffer.history = false;
      fakeWindow.location.href = 'dontchange';
      browser.url(current);
      expect(fakeWindow.location.href).toBe('dontchange');
    });

    it('should not read out location.href if a reload was triggered but still allow to change the url', function() {
      sniffer.history = false;
      browser.url('http://server/someOtherUrlThatCausesReload');
      expect(fakeWindow.location.href).toBe('http://server/someOtherUrlThatCausesReload');

      fakeWindow.location.href = 'http://someNewUrl';
      expect(browser.url()).toBe('http://server/someOtherUrlThatCausesReload');

      browser.url('http://server/someOtherUrl');
      expect(browser.url()).toBe('http://server/someOtherUrl');
      expect(fakeWindow.location.href).toBe('http://server/someOtherUrl');
    });

    it('assumes that changes to location.hash occur in sync', function(done) {
      // This is an asynchronous integration test that changes the
      // hash in all possible ways and checks
      // - whether the change to the hash can be read out in sync
      // - whether the change to the hash can be read out in the hashchange event
      var realWin = window;

      var $realWin = angular.element(realWin);
      var hashInHashChangeEvent = [];

      var job = createAsync(done);
      job.runs(function() {
        $realWin.on('hashchange', hashListener);

        realWin.location.hash = '1';
        realWin.location.href += '2';
        realWin.location.replace(realWin.location.href + '3');
        realWin.location.assign(realWin.location.href + '4');

        expect(realWin.location.hash).toBe('#1234');
      })
      .waitsFor(function() {
        return hashInHashChangeEvent.length > 3;
      })
      .runs(function() {
        $realWin.off('hashchange', hashListener);

        angular.forEach(hashInHashChangeEvent, function(hash) {
          expect(hash).toBe('#1234');
        });
      }).done();
      job.start();

      function hashListener() {
        hashInHashChangeEvent.push(realWin.location.hash);
      }
    });
  });

  describe('url (when state passed)', function() {
    var currentHref;
    var pushState;
    var replaceState;
    var locationReplace;

    beforeEach(function() {
    });
    describe('in a supported browser', runTests());

    function runTests() {
      return function() {
        beforeEach(function() {
          sniffer = {history: true};

          fakeWindow = new MockWindow();
          currentHref = fakeWindow.location.href;
          pushState = jest.spyOn(fakeWindow.history, 'pushState');
          replaceState = jest.spyOn(fakeWindow.history, 'replaceState');
          locationReplace = jest.spyOn(fakeWindow.location, 'replace');

          browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer);
          browser.onUrlChange(function() {});
        });

        it('should change state', function() {
          browser.url(currentHref, false, {prop: 'val1'});
          expect(fakeWindow.history.state).toEqual({prop: 'val1'});
          browser.url(currentHref + '/something', false, {prop: 'val2'});
          expect(fakeWindow.history.state).toEqual({prop: 'val2'});
        });

        it('should allow to set falsy states (except `undefined`)', function() {
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

        it('should treat `undefined` state as `null`', function() {
          fakeWindow.history.state = {prop: 'val1'};
          fakeWindow.fire('popstate');

          browser.url(currentHref, false, undefined);
          expect(fakeWindow.history.state).toBe(null);
        });

        it('should do pushState with the same URL and a different state', function() {
          browser.url(currentHref, false, {prop: 'val1'});
          expect(fakeWindow.history.state).toEqual({prop: 'val1'});

          browser.url(currentHref, false, null);
          expect(fakeWindow.history.state).toBe(null);

          browser.url(currentHref, false, {prop: 'val2'});
          browser.url(currentHref, false, {prop: 'val3'});
          expect(fakeWindow.history.state).toEqual({prop: 'val3'});
        });

        it('should do pushState with the same URL and deep equal but referentially different state', function() {
          fakeWindow.history.state = {prop: 'val'};
          fakeWindow.fire('popstate');
          expect(historyEntriesLength).toBe(1);

          browser.url(currentHref, false, {prop: 'val'});
          expect(fakeWindow.history.state).toEqual({prop: 'val'});
          expect(historyEntriesLength).toBe(2);
        });

        it('should not do pushState with the same URL and state from $browser.state()', function() {
          browser.url(currentHref, false, {prop: 'val'});

          pushState.mockReset();
          replaceState.mockReset();
          locationReplace.mockReset();

          browser.url(currentHref, false, browser.state());
          expect(pushState).not.toHaveBeenCalled();
          expect(replaceState).not.toHaveBeenCalled();
          expect(locationReplace).not.toHaveBeenCalled();
        });
      };
    }
  });

  describe('state', function() {
    var currentHref;

    beforeEach(function() {
      sniffer = {history: true};
      currentHref = fakeWindow.location.href;
    });

    it('should not access `history.state` when `$sniffer.history` is false', function() {
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

      new ngInternals.Browser(mockWindow, fakeDocument, fakeLog, mockSniffer);
      expect(historyStateAccessed).toBe(false);
    });

    describe('in a supported browser', runTests());

    function runTests() {
      return function() {
        beforeEach(function() {
          fakeWindow = new MockWindow();
          browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer);
        });

        it('should return history.state', function() {
          browser.url(currentHref, false, {prop: 'val'});
          expect(browser.state()).toEqual({prop: 'val'});
          browser.url(currentHref, false, 2);
          expect(browser.state()).toEqual(2);
          browser.url(currentHref, false, null);
          expect(browser.state()).toEqual(null);
        });

        it('should return null if history.state is undefined', function() {
          browser.url(currentHref, false, undefined);
          expect(browser.state()).toBe(null);
        });

        it('should return the same state object in subsequent invocations in IE', function() {
          browser.url(currentHref, false, {prop: 'val'});
          expect(browser.state()).toBe(browser.state());
        });
      };
    }
  });

  describe('urlChange', function() {
    var callback;

    beforeEach(function() {
      callback = jest.fn();
    });

    afterEach(function() {
      dealoc(fakeWindow);
    });

    it('should return registered callback', function() {
      expect(browser.onUrlChange(callback)).toBe(callback);
    });

    it('should forward popstate event with new url when history supported', function() {
      sniffer.history = true;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      fakeWindow.fire('popstate');
      expect(callback).toHaveBeenCalledWith('http://server/new', null);

      fakeWindow.fire('hashchange');
      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should forward only popstate event when history supported', function() {
      sniffer.history = true;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      fakeWindow.fire('popstate');
      expect(callback).toHaveBeenCalledWith('http://server/new', null);

      fakeWindow.fire('hashchange');
      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should forward hashchange event with new url when history not supported', function() {
      sniffer.history = false;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      fakeWindow.fire('hashchange');
      expect(callback).toHaveBeenCalledWith('http://server/new', null);

      fakeWindow.fire('popstate');
      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not fire urlChange if changed by browser.url method', function() {
      sniffer.history = false;
      browser.onUrlChange(callback);
      browser.url('http://new.com');

      fakeWindow.fire('hashchange');
      expect(callback).not.toHaveBeenCalled();
    });

    describe('state handling', function() {
      var currentHref;

      beforeEach(function() {
        sniffer = {history: true};
        currentHref = fakeWindow.location.href;
      });

      describe('in a supported browser', runTests());

      function runTests() {
        return function() {
          beforeEach(function() {
            fakeWindow = new MockWindow();
            browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer);
          });

          it('should fire onUrlChange listeners only once if both popstate and hashchange triggered', function() {
            fakeWindow.history.state = {prop: 'val'};
            browser.onUrlChange(callback);

            fakeWindow.fire('hashchange');
            fakeWindow.fire('popstate');
            expect(callback).toHaveBeenCalledTimes(1);
          });
        };
      }
    });


    it('should stop calling callbacks when application has been torn down', function() {
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


  describe('baseHref', function() {
    var jqDocHead;

    beforeEach(function() {
      jqDocHead = angular.element(window.document).find('head');
    });

    it('should return value from <base href>', function() {
      fakeDocument.basePath = '/base/path/';
      expect(browser.baseHref()).toEqual('/base/path/');
    });

    it('should return \'\' (empty string) if no <base href>', function() {
      fakeDocument.basePath = undefined;
      expect(browser.baseHref()).toEqual('');
    });

    it('should remove domain from <base href>', function() {
      fakeDocument.basePath = 'http://host.com/base/path/';
      expect(browser.baseHref()).toEqual('/base/path/');

      fakeDocument.basePath = 'http://host.com/base/path/index.html';
      expect(browser.baseHref()).toEqual('/base/path/index.html');
    });

    it('should remove domain from <base href> beginning with \'//\'', function() {
      fakeDocument.basePath = '//google.com/base/path/';
      expect(browser.baseHref()).toEqual('/base/path/');
    });
  });

  describe('integration tests with $location', function() {

    function setup(options) {
      fakeWindow = new MockWindow(options);
      browser = new ngInternals.Browser(fakeWindow, fakeDocument, fakeLog, sniffer);

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

      it('should work with no history support, no html5Mode', function() {
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

      it('should work with history support, no html5Mode', function() {
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

      it('should work with no history support, with html5Mode', function() {
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

      it('should work with history support, with html5Mode', function() {
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

    it('should not reload the page on every $digest when the page will be reloaded due to url rewrite on load', function() {
      setup({
        history: false,
        html5Mode: true
      });
      fakeWindow.location.href = 'http://server/some/deep/path';
      var changeUrlCount = 0;
      var _url = browser.url;
      browser.url = function(newUrl, replace) {
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
    it('should not infinite digest if the browser does not synchronously update the location properties', function() {
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
  });

  describe('integration test with $rootScope', function() {

    beforeEach(angular.mock.module(function($provide) {
      $provide.value('$browser', browser);
    }));

    it('should not interfere with legacy browser url replace behavior', function() {
      angular.mock.inject(function($rootScope) {
        var newUrl = 'notyet';
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
