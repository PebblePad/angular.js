'use strict';

describe('$anchorScroll', function() {
  jest.useFakeTimers();
  Element.prototype.scrollIntoView = () => {};
  var elmSpy;

  function createMockWindow() {
    return function() {
      angular.mock.module(function($provide) {
        elmSpy = {};

        var mockedWin = {
          scrollTo: jest.fn(),
          scrollBy: jest.fn(),
          document: window.document,
          getComputedStyle(elem) {
            return window.getComputedStyle(elem);
          }
        };

        $provide.value('$window', mockedWin);
      });
    };
  }

  function addElements(...elements) {
    return function($window) {
      angular.forEach(elements, function(identifier) {
        var match = identifier.match(/(?:(\w*) )?(\w*)=(\w*)/);
        var nodeName = match[1] || 'a';

        var tmpl = '<' + nodeName + ' ' + match[2] + '="' + match[3] + '">' +
                  match[3] +   // add some content or else Firefox and IE place the element
                               // in weird ways that break yOffset-testing.
               '</' + nodeName + '>';

        var jqElm = angular.element(tmpl);
        var elm = jqElm[0];
        // Inline elements cause Firefox to report an unexpected value for
        // `getBoundingClientRect().top` on some platforms (depending on the default font and
        // line-height). Using inline-block elements prevents this.
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1014738
        elm.style.display = 'inline-block';

        elmSpy[identifier] = jest.spyOn(elm, 'scrollIntoView');
        angular.element($window.document.body).append(jqElm);
      });
    };
  }

  function callAnchorScroll(hash) {
    return function($anchorScroll) {
      $anchorScroll(hash);
    };
  }

  function changeHashAndScroll(hash) {
    return function($location, $anchorScroll) {
      $location.hash(hash);
      $anchorScroll();
    };
  }

  function initHash(hash = "", flush = false) {
    return function($anchorScroll, $location, $rootScope,$browser) {
      $rootScope.$apply(function() {
        $location.hash(hash);
      });
      jest.runAllTimers();
      if (flush) {
        $browser.defer.flush();
      }
    };
  }

  function changeHashTo(hash, flush = true) {
    return function($anchorScroll, $location, $rootScope, $browser) {
      $rootScope.$apply(function() {
        $location.hash(hash);
      });

      jest.runAllTimers();
      if (flush) {
        $browser.defer.flush();
      }
    };
  }

  function expectNoScrolling() {
    return expectScrollingTo(NaN);
  }

  function expectScrollingTo(identifierCountMap) {
    var map = {};
    if (angular.isString(identifierCountMap)) {
      map[identifierCountMap] = 1;
    } else if (angular.isArray(identifierCountMap)) {
      angular.forEach(identifierCountMap, function(identifier) {
        map[identifier] = 1;
      });
    } else {
      map = identifierCountMap;
    }

    return function($window) {
      angular.forEach(elmSpy, function(spy, id) {
        expect(spy).toHaveBeenCalledTimes(map[id] || 0);
      });
      expect($window.scrollTo).not.toHaveBeenCalled();
    };
  }

  function expectScrollingToTop($window) {
    angular.forEach(elmSpy, function(spy) {
      expect(spy).not.toHaveBeenCalled();
    });

    expect($window.scrollTo).toHaveBeenCalledWith(0, 0);
  }

  afterEach(angular.mock.inject(function($browser, $document) {
    expect($browser.deferredFns.length).toBe(0);
    dealoc($document);
  }));


  describe('when explicitly called', function() {

    beforeEach(createMockWindow());


    describe('and implicitly using `$location.hash()`', function() {

      it('should scroll to top of the window if empty hash', angular.mock.inject(
        changeHashAndScroll(''),
        expectScrollingToTop));


      it('should not scroll if hash does not match any element', angular.mock.inject(
        addElements('id=one', 'id=two'),
        changeHashAndScroll('non-existing'),
        expectNoScrolling()));


      it('should scroll to anchor element with name', angular.mock.inject(
        addElements('a name=abc'),
        changeHashAndScroll('abc'),
        expectScrollingTo('a name=abc')));


      it('should not scroll to other than anchor element with name', angular.mock.inject(
        addElements('input name=xxl', 'select name=xxl', 'form name=xxl'),
        changeHashAndScroll('xxl'),
        expectNoScrolling()));


      it('should scroll to anchor even if other element with given name exist', angular.mock.inject(
        addElements('input name=some', 'a name=some'),
        changeHashAndScroll('some'),
        expectScrollingTo('a name=some')));


      it('should scroll to element with id with precedence over name', angular.mock.inject(
        addElements('name=abc', 'id=abc'),
        changeHashAndScroll('abc'),
        expectScrollingTo('id=abc')));


      it('should scroll to top if hash === "top" and no matching element', angular.mock.inject(
        changeHashAndScroll('top'),
        expectScrollingToTop));


      it('should scroll to element with id "top" if present', angular.mock.inject(
        addElements('id=top'),
        changeHashAndScroll('top'),
        expectScrollingTo('id=top')));
    });


    describe('and specifying a hash', function() {

      it('should ignore the `hash` argument if not a string', angular.mock.inject(
        initHash('one', true),
        addElements('id=one', 'id=two'),
        callAnchorScroll({}),
        expectScrollingTo('id=one')));


      it('should ignore `$location.hash()` if `hash` is passed as argument', angular.mock.inject(
        initHash('one', true),
        addElements('id=one', 'id=two'),
        callAnchorScroll('two'),
        expectScrollingTo('id=two')));


      it('should scroll to top of the window if empty hash', angular.mock.inject(
        callAnchorScroll(''),
        expectScrollingToTop));


      it('should not scroll if hash does not match any element', angular.mock.inject(
        addElements('id=one', 'id=two'),
        callAnchorScroll('non-existing'),
        expectNoScrolling()));


      it('should scroll to anchor element with name', angular.mock.inject(
        addElements('a name=abc'),
        callAnchorScroll('abc'),
        expectScrollingTo('a name=abc')));


      it('should not scroll to other than anchor element with name', angular.mock.inject(
        addElements('input name=xxl', 'select name=xxl', 'form name=xxl'),
        callAnchorScroll('xxl'),
        expectNoScrolling()));


      it('should scroll to anchor even if other element with given name exist', angular.mock.inject(
        addElements('input name=some', 'a name=some'),
        callAnchorScroll('some'),
        expectScrollingTo('a name=some')));


      it('should scroll to element with id with precedence over name', angular.mock.inject(
        addElements('name=abc', 'id=abc'),
        callAnchorScroll('abc'),
        expectScrollingTo('id=abc')));


      it('should scroll to top if hash === "top" and no matching element', angular.mock.inject(
        callAnchorScroll('top'),
        expectScrollingToTop));


      it('should scroll to element with id "top" if present', angular.mock.inject(
        addElements('id=top'),
        callAnchorScroll('top'),
        expectScrollingTo('id=top')));


      it('should scroll to element with id "7" if present, with a given hash of type number', angular.mock.inject(
        addElements('id=7'),
        callAnchorScroll(7),
        expectScrollingTo('id=7')));


      it('should scroll to element with id "7" if present, with a given hash of type string', angular.mock.inject(
        addElements('id=7'),
        callAnchorScroll('7'),
        expectScrollingTo('id=7')));
    });
  });


  describe('watcher', function() {

    function initLocation(config) {
      return function($provide, $locationProvider) {
        $provide.value('$sniffer', {history: config.historyApi});
        $locationProvider.html5Mode(config.html5Mode);
      };
    }

    function disableAutoScrolling() {
      return function($anchorScrollProvider) {
        $anchorScrollProvider.disableAutoScrolling();
      };
    }


    beforeEach(createMockWindow());

    describe('when document has completed loading', function() {

      it('should scroll to element when hash change in hashbang mode', function() {
        angular.mock.module(initLocation({html5Mode: false, historyApi: true}));
        angular.mock.inject(
          initHash(),
          addElements('id=some'),
          changeHashTo('some'),
          expectScrollingTo('id=some')
        );
      });


      it('should scroll to element when hash change in html5 mode with no history api', function() {
        angular.mock.module(initLocation({html5Mode: true, historyApi: false}));
        angular.mock.inject(
          addElements('id=some'),
          changeHashTo('some'),
          expectScrollingTo('id=some')
        );
      });


      it('should not scroll to the top if $anchorScroll is initializing and location hash is empty',
        angular.mock.inject(
          expectNoScrolling())
      );


      it('should not scroll when element does not exist', function() {
        angular.mock.module(initLocation({html5Mode: false, historyApi: false}));
        angular.mock.inject(
          addElements('id=some'),
          changeHashTo('other'),
          expectNoScrolling()
        );
      });


      it('should scroll when html5 mode with history api', function() {
        angular.mock.module(initLocation({html5Mode: true, historyApi: true}));
        angular.mock.inject(
          addElements('id=some'),
          changeHashTo('some'),
          expectScrollingTo('id=some')
        );
      });


      it('should not scroll when auto-scrolling is disabled', function() {
        angular.mock.module(
            disableAutoScrolling(),
            initLocation({html5Mode: false, historyApi: false})
        );
        angular.mock.inject(
          initHash(),
          addElements('id=fake'),
          changeHashTo('fake', false),
          expectNoScrolling()
        );
      });


      it('should scroll when called explicitly (even if auto-scrolling is disabled)', function() {
        angular.mock.module(
            disableAutoScrolling(),
            initLocation({html5Mode: false, historyApi: false})
        );
        angular.mock.inject(
          initHash(),
          addElements('id=fake'),
          changeHashTo('fake', false),
          expectNoScrolling(),
          callAnchorScroll(),
          expectScrollingTo('id=fake')
        );
      });
    });
  });


  describe('yOffset', function() {

    function expectScrollingWithOffset(identifierCountMap, offsetList) {
      var list = angular.isArray(offsetList) ? offsetList : [offsetList];

      return function($rootScope, $window) {
        angular.mock.inject(expectScrollingTo(identifierCountMap));
        expect($window.scrollBy).toHaveBeenCalledTimes(list.length);
        angular.forEach(list, function(offset, idx) {
          // Due to sub-pixel rendering, there is a +/-1 error margin in the actual offset
          var args = $window.scrollBy.mock.calls[idx];
          expect(args[0]).toBe(0);
          expect(Math.abs(offset + args[1])).toBeLessThan(1);
        });
      };
    }

    function expectScrollingWithoutOffset(identifierCountMap) {
      return expectScrollingWithOffset(identifierCountMap, []);
    }

    function mockBoundingClientRect(childValuesMap) {
      return function($window) {
        var children = $window.document.body.children;
        angular.forEach(childValuesMap, function(valuesList, childIdx) {
          var elem = children[childIdx];
          elem.getBoundingClientRect = function() {
            var val = valuesList.shift();
            return {
              top: val,
              bottom: val
            };
          };
        });
      };
    }

    function setYOffset(yOffset) {
      return function($anchorScroll) {
        $anchorScroll.yOffset = yOffset;
      };
    }

    beforeEach(createMockWindow());


    describe('and body with no border/margin/padding', function() {

      describe('when set as a fixed number', function() {

        var yOffsetNumber = 50;

        beforeEach(angular.mock.inject(setYOffset(yOffsetNumber)));


        it('should scroll with vertical offset', angular.mock.inject(
          addElements('id=some'),
          mockBoundingClientRect({0: [0]}),
          changeHashTo('some'),
          expectScrollingWithOffset('id=some', yOffsetNumber)
        ));


        it('should use the correct vertical offset when changing `yOffset` at runtime', angular.mock.inject(
          addElements('id=some'),
          mockBoundingClientRect({0: [0, 0]}),
          changeHashTo('some'),
          setYOffset(yOffsetNumber - 10),
          callAnchorScroll(),
          expectScrollingWithOffset({'id=some': 2}, [yOffsetNumber, yOffsetNumber - 10])));


        it('should adjust the vertical offset for elements near the end of the page', function() {

          var targetAdjustedOffset = 20;

          angular.mock.inject(
            addElements('id=some1', 'id=some2'),
            mockBoundingClientRect({1: [yOffsetNumber - targetAdjustedOffset]}),
            changeHashTo('some2'),
            expectScrollingWithOffset('id=some2', targetAdjustedOffset));
        });
      });


      describe('when set as a function', function() {

        it('should scroll with vertical offset', function() {

          var val = 0;
          var increment = 10;

          function yOffsetFunction() {
            val += increment;
            return val;
          }

          angular.mock.inject(
            addElements('id=id1', 'name=name2'),
            mockBoundingClientRect({
              0: [0, 0, 0],
              1: [0]
            }),
            setYOffset(yOffsetFunction),
            changeHashTo('id1'),
            changeHashTo('name2'),
            changeHashTo('id1'),
            callAnchorScroll(),
            expectScrollingWithOffset({
              'id=id1': 3,
              'name=name2': 1
            }, [
              1 * increment,
              2 * increment,
              3 * increment,
              4 * increment
            ]));
        });
      });


      describe('when set as a jqLite element', function() {

        var elemBottom = 50;

        function createAndSetYOffsetElement(position) {
          var jqElem = angular.element('<div></div>');
          jqElem[0].style.position = position;

          return function($anchorScroll, $window) {
            angular.element($window.document.body).append(jqElem);
            $anchorScroll.yOffset = jqElem;
          };
        }


        it('should scroll with vertical offset when `position === fixed`', angular.mock.inject(
          createAndSetYOffsetElement('fixed'),
          addElements('id=some'),
          mockBoundingClientRect({0: [elemBottom], 1: [0]}),
          changeHashTo('some'),
          expectScrollingWithOffset('id=some', elemBottom)));


        it('should scroll without vertical offset when `position !== fixed`', angular.mock.inject(
          createAndSetYOffsetElement('absolute', elemBottom),
          expectScrollingWithoutOffset('id=some')));
      });
    });


    describe('and body with border/margin/padding', function() {

      var borderWidth = 4;
      var marginWidth = 8;
      var paddingWidth = 16;
      var yOffsetNumber = 50;
      var necessaryYOffset = yOffsetNumber - borderWidth - marginWidth - paddingWidth;

      beforeEach(angular.mock.inject(setYOffset(yOffsetNumber)));


      it('should scroll with vertical offset', angular.mock.inject(
        addElements('id=some'),
        mockBoundingClientRect({0: [yOffsetNumber - necessaryYOffset]}),
        changeHashTo('some'),
        expectScrollingWithOffset('id=some', necessaryYOffset)));


      it('should use the correct vertical offset when changing `yOffset` at runtime', angular.mock.inject(
        addElements('id=some'),
        mockBoundingClientRect({0: [
          yOffsetNumber - necessaryYOffset,
          yOffsetNumber - necessaryYOffset
        ]}),
        changeHashTo('some'),
        setYOffset(yOffsetNumber - 10),
        callAnchorScroll(),
        expectScrollingWithOffset({'id=some': 2}, [necessaryYOffset, necessaryYOffset - 10])));


      it('should adjust the vertical offset for elements near the end of the page', function() {

        var targetAdjustedOffset = 20;

        angular.mock.inject(
          addElements('id=some1', 'id=some2'),
          mockBoundingClientRect({1: [yOffsetNumber - targetAdjustedOffset]}),
          changeHashTo('some2'),
          expectScrollingWithOffset('id=some2', targetAdjustedOffset));
      });
    });


    describe('and body with border/margin/padding and boxSizing', function() {

      var borderWidth = 4;
      var marginWidth = 8;
      var paddingWidth = 16;
      var yOffsetNumber = 50;
      var necessaryYOffset = yOffsetNumber - borderWidth - marginWidth - paddingWidth;

      beforeEach(angular.mock.inject(setYOffset(yOffsetNumber)));


      it('should scroll with vertical offset', angular.mock.inject(
        addElements('id=some'),
        mockBoundingClientRect({0: [yOffsetNumber - necessaryYOffset]}),
        changeHashTo('some'),
        expectScrollingWithOffset('id=some', necessaryYOffset)));


      it('should use the correct vertical offset when changing `yOffset` at runtime', angular.mock.inject(
        addElements('id=some'),
        mockBoundingClientRect({0: [
          yOffsetNumber - necessaryYOffset,
          yOffsetNumber - necessaryYOffset
        ]}),
        changeHashTo('some'),
        setYOffset(yOffsetNumber - 10),
        callAnchorScroll(),
        expectScrollingWithOffset({'id=some': 2}, [necessaryYOffset, necessaryYOffset - 10])));


      it('should adjust the vertical offset for elements near the end of the page', function() {

        var targetAdjustedOffset = 20;

        angular.mock.inject(
          addElements('id=some1', 'id=some2'),
          mockBoundingClientRect({1: [yOffsetNumber - targetAdjustedOffset]}),
          changeHashTo('some2'),
          expectScrollingWithOffset('id=some2', targetAdjustedOffset));
      });
    });
  });
});
