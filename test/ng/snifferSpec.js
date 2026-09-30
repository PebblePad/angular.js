'use strict';
 describe('$sniffer', () => {
  function sniffer($window, $document) {
    /* global $SnifferProvider: false */
    $window.navigator = $window.navigator || {};
    $document = angular.element($document || {});
    if (!$document[0].body) {
      $document[0].body = window.document.body;
    }
    return new ngInternals.$SnifferProvider().$get[2]($window, $document);
  }


  describe('history', () => {
    test('should be true if history.pushState defined', () => {
      var mockWindow = {
        history: {
          pushState: angular.noop,
          replaceState: angular.noop
        }
      };

      expect(sniffer(mockWindow).history).toBe(true);
    });


    test('should be false if history or pushState not defined', () => {
      expect(sniffer({}).history).toBe(false);
      expect(sniffer({history: {}}).history).toBe(false);
    });


    test('should be false on Boxee box with an older version of Webkit', () => {
      var mockWindow = {
        history: {
          pushState: angular.noop
        },
        navigator: {
          userAgent: 'boxee (alpha/Darwin 8.7.1 i386 - 0.9.11.5591)'
        }
      };

      expect(sniffer(mockWindow).history).toBe(false);
    });


    test('should be true on NW.js apps (which look similar to Chrome Packaged Apps)', () => {
      var mockWindow = {
        history: {
          pushState: angular.noop
        },
        chrome: {
          app: {
            runtime: {}
          }
        },
        nw: {
          process: {}
        }
      };

      expect(sniffer(mockWindow).history).toBe(true);
    });


    test('should be false on Chrome Packaged Apps', () => {
      // Chrome Packaged Apps are not allowed to access `window.history.pushState`.
      // In Chrome, `window.app` might be available in "normal" webpages, but `window.app.runtime`
      // only exists in the context of a packaged app.

      expect(sniffer(createMockWindow()).history).toBe(true);
      expect(sniffer(createMockWindow(true)).history).toBe(true);
      expect(sniffer(createMockWindow(true, true)).history).toBe(false);

      function createMockWindow(isChrome, isPackagedApp) {
        var mockWindow = {
          history: {
            pushState: angular.noop
          }
        };

        if (isChrome) {
          var chromeAppObj = isPackagedApp ? {runtime: {}} : {};
          mockWindow.chrome = {app: chromeAppObj};
        }

        return mockWindow;
      }
    });


    test('should not try to access `history.pushState` in Chrome Packaged Apps', () => {
      var pushStateAccessCount = 0;

      var mockHistory = Object.create(Object.prototype, {
        pushState: {get() { pushStateAccessCount++; return angular.noop; }}
      });
      var mockWindow = {
        chrome: {
          app: {
            runtime: {}
          }
        },
        history: mockHistory
      };

      sniffer(mockWindow);

      expect(pushStateAccessCount).toBe(0);
    });

    test('should not try to access `history.pushState` in sandboxed Chrome Packaged Apps',
      function() {
        var pushStateAccessCount = 0;

        var mockHistory = Object.create(Object.prototype, {
          pushState: {get() { pushStateAccessCount++; return angular.noop; }}
        });
        var mockWindow = {
          chrome: {
            runtime: {
              id: 'x'
            }
          },
          history: mockHistory
        };

        sniffer(mockWindow);

        expect(pushStateAccessCount).toBe(0);
      }
    );
  });


  describe('hasEvent', () => {
    var mockDocument;
    var mockDivElement;
    var $sniffer;

     beforeEach(() => {
      var mockCreateElementFn = function(elm) { if (elm === 'div') return mockDivElement; };
      var createElementSpy = jest.fn().mockName('createElement').mockImplementation(mockCreateElementFn);

      mockDocument = {createElement: createElementSpy};
      $sniffer = sniffer({}, mockDocument);
    });


    test('should return true if "onchange" is present in a div element', () => {
      mockDivElement = {onchange: angular.noop};

      expect($sniffer.hasEvent('change')).toBe(true);
    });


    test('should return false if "oninput" is not present in a div element', () => {
      mockDivElement = {};

      expect($sniffer.hasEvent('input')).toBe(false);
    });


    test('should only create the element once', () => {
      mockDivElement = {};

      $sniffer.hasEvent('change');
      $sniffer.hasEvent('change');
      $sniffer.hasEvent('change');

      expect(mockDocument.createElement).toHaveBeenCalledTimes(1);
    });
  });


  describe('csp', () => {
    test('should have all rules set to false by default', () => {
      var csp = sniffer({}).csp;
      angular.forEach(Object.keys(csp), function(key) {
        expect(csp[key]).toEqual(false);
      });
    });
  });


  describe('animations', () => {
    test('should be either true or false', angular.mock.inject(function($sniffer) {
      expect($sniffer.animations).toBeDefined();
    }));


    test('should be false when there is no animation style', () => {
      var mockDocument = {
        body: {
          style: {}
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(false);
    });


    test('should be true with -webkit-prefixed animations', () => {
      var animationStyle = 'some_animation 2s linear';
      var mockDocument = {
        body: {
          style: {
            webkitAnimation: animationStyle
          }
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(true);
    });


    test('should be true with w3c-style animations', () => {
      var mockDocument = {
        body: {
          style: {
            animation: 'some_animation 2s linear'
          }
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(true);
    });


    test('should be true on android with older body style properties', () => {
      var mockWindow = {
        navigator: {
          userAgent: 'android 2'
        }
      };
      var mockDocument = {
        body: {
          style: {
            webkitAnimation: ''
          }
        }
      };

      expect(sniffer(mockWindow, mockDocument).animations).toBe(true);
    });


    test('should be true when an older version of Webkit is used', () => {
      var mockDocument = {
        body: {
          style: {
            WebkitOpacity: '0'
          }
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(false);
    });
  });


  describe('transitions', () => {
    test('should be either true or false', angular.mock.inject(function($sniffer) {
      expect($sniffer.transitions).toBeOneOf(true, false);
    }));


    test('should be false when there is no transition style', () => {
      var mockDocument = {
        body: {
          style: {}
        }
      };

      expect(sniffer({}, mockDocument).transitions).toBe(false);
    });


    test('should be true with -webkit-prefixed transitions', () => {
      var transitionStyle = '1s linear all';
      var mockDocument = {
        body: {
          style: {
            webkitTransition: transitionStyle
          }
        }
      };

      expect(sniffer({}, mockDocument).transitions).toBe(true);
    });


    test('should be true with w3c-style transitions', () => {
      var mockDocument = {
        body: {
          style: {
            transition: '1s linear all'
          }
        }
      };

      expect(sniffer({}, mockDocument).transitions).toBe(true);
    });


    test('should be true on android with older body style properties', () => {
      var mockWindow = {
        navigator: {
          userAgent: 'android 2'
        }
      };
      var mockDocument = {
        body: {
          style: {
            webkitTransition: ''
          }
        }
      };

      expect(sniffer(mockWindow, mockDocument).transitions).toBe(true);
    });
  });


  describe('android', () => {
    test('should provide the android version', () => {
      var mockWindow = {
        navigator: {
          userAgent: 'android 2'
        }
      };

      expect(sniffer(mockWindow).android).toBe(2);
    });
  });
});
