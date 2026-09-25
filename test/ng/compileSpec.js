'use strict';

/* eslint-disable no-script-url */
 describe('$compile', () => {
  var document = window.document;

  function isUnknownElement(el) {
    return !!el.toString().match(/Unknown/);
  }

  function isSVGElement(el) {
    return !!el.toString().match(/SVG/);
  }

  function isHTMLElement(el) {
    return !!el.toString().match(/HTML/);
  }

  function supportsMathML() {
    var d = document.createElement('div');
    d.innerHTML = '<math></math>';
    return !isUnknownElement(d.firstChild);
  }

  // IE9-11 do not support foreignObject in svg...
  function supportsForeignObject() {
    var d = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    return !!d.toString().match(/SVGForeignObject/);
  }

  function getChildScopes(scope) {
    var children = [];
    if (!scope.$$childHead) { return children; }
    var childScope = scope.$$childHead;
    do {
      children.push(childScope);
      children = children.concat(getChildScopes(childScope));
    } while ((childScope = childScope.$$nextSibling));
    return children;
  }

  var element;
  var directive;
  var $compile;
  var $rootScope;

  beforeEach(angular.mock.module(provideLog, function($provide, $compileProvider) {
    element = null;
    directive = $compileProvider.directive;

    directive('log', function(log) {
      return {
        restrict: 'CAM',
        priority:0,
        compile: ngInternals.valueFn(function(scope, element, attrs) {
          log(attrs.log || 'LOG');
        })
      };
    });

    directive('highLog', function(log) {
      return { restrict: 'CAM', priority:3, compile: ngInternals.valueFn(function(scope, element, attrs) {
        log(attrs.highLog || 'HIGH');
      })};
    });

    directive('mediumLog', function(log) {
      return { restrict: 'CAM', priority:2, compile: ngInternals.valueFn(function(scope, element, attrs) {
        log(attrs.mediumLog || 'MEDIUM');
      })};
    });

    directive('greet', function() {
      return { restrict: 'CAM', priority:10,  compile: ngInternals.valueFn(function(scope, element, attrs) {
        element.text('Hello ' + attrs.greet);
      })};
    });

    directive('set', function() {
      return function(scope, element, attrs) {
        element.text(attrs.set);
      };
    });

    directive('mediumStop', ngInternals.valueFn({
      priority: 2,
      terminal: true
    }));

    directive('stop', ngInternals.valueFn({
      terminal: true
    }));

    directive('negativeStop', ngInternals.valueFn({
      priority: -100, // even with negative priority we still should be able to stop descend
      terminal: true
    }));

    directive('svgContainer', function() {
      return {
        template: '<svg width="400" height="400" ng-transclude></svg>',
        replace: true,
        transclude: true
      };
    });

    directive('svgCustomTranscludeContainer', function() {
      return {
        template: '<svg width="400" height="400"></svg>',
        transclude: true,
        link(scope, element, attr, ctrls, $transclude) {
          var futureParent = element.children().eq(0);
          $transclude(function(clone) {
            futureParent.append(clone);
          }, futureParent);
        }
      };
    });

    directive('svgCircle', function() {
      return {
        template: '<circle cx="2" cy="2" r="1"></circle>',
        templateNamespace: 'svg',
        replace: true
      };
    });

    directive('myForeignObject', function() {
      return {
        template: '<foreignObject width="100" height="100" ng-transclude></foreignObject>',
        templateNamespace: 'svg',
        replace: true,
        transclude: true
      };
    });


    return function(_$compile_, _$rootScope_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    };
  }));

  function compile(html) {
    element = angular.element(html);
    $compile(element)($rootScope);
  }

   afterEach(() => {
    dealoc(element);
  });


  describe('configuration', () => {

    test('should use $$sanitizeUriProvider for reconfiguration of the `aHrefSanitizationTrustedUrlList`', () => {
      angular.mock.module(function($compileProvider, $$sanitizeUriProvider) {
        var newRe = /safe:/;
        var returnVal;

        expect($compileProvider.aHrefSanitizationTrustedUrlList()).toBe($$sanitizeUriProvider.aHrefSanitizationTrustedUrlList());
        returnVal = $compileProvider.aHrefSanitizationTrustedUrlList(newRe);
        expect(returnVal).toBe($compileProvider);
        expect($$sanitizeUriProvider.aHrefSanitizationTrustedUrlList()).toBe(newRe);
        expect($compileProvider.aHrefSanitizationTrustedUrlList()).toBe(newRe);
      });
      angular.mock.inject(function() {
        // needed to the module definition above is run...
      });
    });

    test('should use $$sanitizeUriProvider for reconfiguration of the `imgSrcSanitizationTrustedUrlList`', () => {
      angular.mock.module(function($compileProvider, $$sanitizeUriProvider) {
        var newRe = /safe:/;
        var returnVal;

        expect($compileProvider.imgSrcSanitizationTrustedUrlList()).toBe($$sanitizeUriProvider.imgSrcSanitizationTrustedUrlList());
        returnVal = $compileProvider.imgSrcSanitizationTrustedUrlList(newRe);
        expect(returnVal).toBe($compileProvider);
        expect($$sanitizeUriProvider.imgSrcSanitizationTrustedUrlList()).toBe(newRe);
        expect($compileProvider.imgSrcSanitizationTrustedUrlList()).toBe(newRe);
      });
      angular.mock.inject(function() {
        // needed to the module definition above is run...
      });
    });

    test('should allow debugInfoEnabled to be configured', () => {
      angular.mock.module(function($compileProvider) {
        expect($compileProvider.debugInfoEnabled()).toBe(true); // the default
        $compileProvider.debugInfoEnabled(false);
        expect($compileProvider.debugInfoEnabled()).toBe(false);
      });
      angular.mock.inject();
    });

    test('should allow strictComponentBindingsEnabled to be configured', () => {
      angular.mock.module(function($compileProvider) {
        expect($compileProvider.strictComponentBindingsEnabled()).toBe(false); // the default
        $compileProvider.strictComponentBindingsEnabled(true);
        expect($compileProvider.strictComponentBindingsEnabled()).toBe(true);
      });
      angular.mock.inject();
    });

    test('should allow onChangesTtl to be configured', () => {
      angular.mock.module(function($compileProvider) {
        expect($compileProvider.onChangesTtl()).toBe(10); // the default
        $compileProvider.onChangesTtl(2);
        expect($compileProvider.onChangesTtl()).toBe(2);
      });
      angular.mock.inject();
    });

    test('should allow commentDirectivesEnabled to be configured', () => {
      angular.mock.module(function($compileProvider) {
        expect($compileProvider.commentDirectivesEnabled()).toBe(true); // the default
        $compileProvider.commentDirectivesEnabled(false);
        expect($compileProvider.commentDirectivesEnabled()).toBe(false);
      });
      angular.mock.inject();
    });

    test('should allow cssClassDirectivesEnabled to be configured', () => {
      angular.mock.module(function($compileProvider) {
        expect($compileProvider.cssClassDirectivesEnabled()).toBe(true); // the default
        $compileProvider.cssClassDirectivesEnabled(false);
        expect($compileProvider.cssClassDirectivesEnabled()).toBe(false);
      });
      angular.mock.inject();
    });

    test('should register a directive', () => {
      angular.mock.module(function() {
        directive('div', function(log) {
          return {
            restrict: 'ECA',
            link(scope, element) {
              log('OK');
              element.text('SUCCESS');
            }
          };
        });
      });
      angular.mock.inject(function($compile, $rootScope, log) {
        element = $compile('<div></div>')($rootScope);
        expect(element.text()).toEqual('SUCCESS');
        expect(log).toEqual('OK');
      });
    });

    test('should allow registration of multiple directives with same name', () => {
      angular.mock.module(function() {
        directive('div', function(log) {
          return {
            restrict: 'ECA',
            link: {
              pre: log.fn('pre1'),
              post: log.fn('post1')
            }
          };
        });
        directive('div', function(log) {
          return {
            restrict: 'ECA',
            link: {
              pre: log.fn('pre2'),
              post: log.fn('post2')
            }
          };
        });
      });
      angular.mock.inject(function($compile, $rootScope, log) {
        element = $compile('<div></div>')($rootScope);
        expect(log).toEqual('pre1; pre2; post2; post1');
      });
    });

    test('should throw an exception if a directive is called "hasOwnProperty"', () => {
      angular.mock.module(function() {
        expect(function() {
          directive('hasOwnProperty', function() { });
        }).toThrowMinErr('ng','badname', 'hasOwnProperty is not a valid directive name');
      });
      angular.mock.inject(function($compile) {});
    });

    test('should throw an exception if a directive name starts with a non-lowercase letter', () => {
      angular.mock.module(function() {
        expect(function() {
          directive('BadDirectiveName', function() { });
        }).toThrowMinErr('$compile','baddir', 'Directive/Component name \'BadDirectiveName\' is invalid. The first character must be a lowercase letter');
      });
      angular.mock.inject(function($compile) {});
    });

    test('should throw an exception if a directive name has leading or trailing whitespace', () => {
      angular.mock.module(function() {
        function assertLeadingOrTrailingWhitespaceInDirectiveName(name) {
          expect(function() {
            directive(name, function() { });
          }).toThrowMinErr(
            '$compile','baddir', 'Directive/Component name \'' + name + '\' is invalid. ' +
            'The name should not contain leading or trailing whitespaces');
        }
        assertLeadingOrTrailingWhitespaceInDirectiveName(' leadingWhitespaceDirectiveName');
        assertLeadingOrTrailingWhitespaceInDirectiveName('trailingWhitespaceDirectiveName ');
        assertLeadingOrTrailingWhitespaceInDirectiveName(' leadingAndTrailingWhitespaceDirectiveName ');
      });
      angular.mock.inject(function($compile) {});
    });

    test('should throw an exception if the directive name is not defined', () => {
      angular.mock.module(function() {
        expect(function() {
          directive();
        }).toThrowMinErr('ng','areq');
      });
      angular.mock.inject(function($compile) {});
    });

    test('should ignore special chars before processing attribute directive name', () => {
      // a regression https://github.com/angular/angular.js/issues/16278
      angular.mock.module(function() {
        directive('t', function(log) {
          return {
            restrict: 'A',
            link: {
              pre: log.fn('pre'),
              post: log.fn('post')
            }
          };
        });
      });
      angular.mock.inject(function(log) {
        compileForTest('<div _t></div>');
        compileForTest('<div -t></div>');
        compileForTest('<div :t></div>');
        expect(log).toEqual('pre; post; pre; post; pre; post');
      });
    });

    test('should throw an exception if the directive factory is not defined', () => {
      angular.mock.module(function() {
        expect(function() {
          directive('myDir');
        }).toThrowMinErr('ng','areq');
      });
      angular.mock.inject(function($compile) {});
    });

    test('should preserve context within declaration', () => {
      angular.mock.module(function() {
        directive('ff', function(log) {
          var declaration = {
            restrict: 'E',
            template() {
              log('ff template: ' + (this === declaration));
            },
            compile() {
              log('ff compile: ' + (this === declaration));
              return function() {
                log('ff post: ' + (this === declaration));
              };
            }
          };
          return declaration;
        });

        directive('fff', function(log) {
          var declaration = {
            restrict: 'E',
            link: {
              pre() {
                log('fff pre: ' + (this === declaration));
              },
              post() {
                log('fff post: ' + (this === declaration));
              }
            }
          };
          return declaration;
        });

        directive('ffff', function(log) {
          var declaration = {
            restrict: 'E',
            compile() {
              return {
                pre() {
                  log('ffff pre: ' + (this === declaration));
                },
                post() {
                  log('ffff post: ' + (this === declaration));
                }
              };
            }
          };
          return declaration;
        });

        directive('fffff', function(log) {
          var declaration = {
            restrict: 'E',
            templateUrl() {
              log('fffff templateUrl: ' + (this === declaration));
              return 'fffff.html';
            },
            link() {
              log('fffff post: ' + (this === declaration));
            }
          };
          return declaration;
        });
      });

      angular.mock.inject(function($templateCache, log) {
        $templateCache.put('fffff.html', '');

        compileForTest('<ff></ff>');
        compileForTest('<fff></fff>');
        compileForTest('<ffff></ffff>');
        compileForTest('<fffff></fffff>');
        $rootScope.$digest();

        expect(log).toEqual(
          'ff template: true; ' +
          'ff compile: true; ' +
          'ff post: true; ' +
          'fff pre: true; ' +
          'fff post: true; ' +
          'ffff pre: true; ' +
          'ffff post: true; ' +
          'fffff templateUrl: true; ' +
          'fffff post: true'
        );
      });
    });
  });


  describe('svg namespace transcludes', () => {
    var ua = window.navigator.userAgent;
    var isEdge = /Edge/.test(ua);

    // this method assumes some sort of sized SVG element is being inspected.
    function assertIsValidSvgCircle(elem) {
      expect(isUnknownElement(elem)).toBe(false);
      expect(isSVGElement(elem)).toBe(true);
    }

    test('should handle transcluded svg elements', angular.mock.inject(function($compile) {
      element = angular.element('<div><svg-container>' +
          '<circle cx="4" cy="4" r="2"></circle>' +
          '</svg-container></div>');
      $compile(element.contents())($rootScope);
      document.body.appendChild(element[0]);

      var circle = element.find('circle');

      assertIsValidSvgCircle(circle[0]);
    }));

    test('should handle custom svg elements inside svg tag', angular.mock.inject(function() {
      element = angular.element('<div><svg width="300" height="300">' +
          '<svg-circle></svg-circle>' +
          '</svg></div>');
      $compile(element.contents())($rootScope);
      document.body.appendChild(element[0]);

      var circle = element.find('circle');
      assertIsValidSvgCircle(circle[0]);
    }));

    test('should handle transcluded custom svg elements', angular.mock.inject(function() {
      element = angular.element('<div><svg-container>' +
          '<svg-circle></svg-circle>' +
          '</svg-container></div>');
      $compile(element.contents())($rootScope);
      document.body.appendChild(element[0]);

      var circle = element.find('circle');
      assertIsValidSvgCircle(circle[0]);
    }));

    if (supportsForeignObject()) {
      // Supports: Chrome 53-57+
      // Since Chrome 53-57+, the reported size of `<foreignObject>` elements and their descendants
      // is affected by global display settings (e.g. font size) and browser settings (e.g. default
      // zoom level). In order to avoid false negatives, we compare against the size of the
      // equivalent, hand-written SVG instead of fixed widths/heights.
      var HAND_WRITTEN_SVG =
        '<svg width="400" height="400">' +
          '<foreignObject width="100" height="100">' +
            '<div style="position:absolute;width:20px;height:20px">test</div>' +
          '</foreignObject>' +
        '</svg>';

      test('should handle foreignObject', angular.mock.inject(function() {
        element = angular.element(
          '<div>' +
            // By hand (for reference)
            HAND_WRITTEN_SVG +
            // By directive
            '<svg-container>' +
              '<foreignObject width="100" height="100">' +
                '<div style="position:absolute;width:20px;height:20px">test</div>' +
              '</foreignObject>' +
            '</svg-container>' +
          '</div>');
        $compile(element.contents())($rootScope);
        document.body.appendChild(element[0]);

        var referenceElem = element.find('div')[0];
        var testElem = element.find('div')[1];
        var referenceBounds = referenceElem.getBoundingClientRect();
        var testBounds = testElem.getBoundingClientRect();

        expect(isHTMLElement(testElem)).toBe(true);
        expect(referenceBounds.width).toBeGreaterThan(0);
        expect(referenceBounds.height).toBeGreaterThan(0);
        expect(testBounds.width).toBe(referenceBounds.width);
        expect(testBounds.height).toBe(referenceBounds.height);
      }));

      test('should handle custom svg containers that transclude to foreignObject that transclude html', angular.mock.inject(function() {
        element = angular.element(
          '<div>' +
            // By hand (for reference)
            HAND_WRITTEN_SVG +
            // By directive
            '<svg-container>' +
              '<my-foreign-object>' +
                '<div style="width:20px;height:20px">test</div>' +
              '</my-foreign-object>' +
            '</svg-container>' +
          '</div>');
        $compile(element.contents())($rootScope);
        document.body.appendChild(element[0]);

        var referenceElem = element.find('div')[0];
        var testElem = element.find('div')[1];
        var referenceBounds = referenceElem.getBoundingClientRect();
        var testBounds = testElem.getBoundingClientRect();

        expect(isHTMLElement(testElem)).toBe(true);
        expect(referenceBounds.width).toBeGreaterThan(0);
        expect(referenceBounds.height).toBeGreaterThan(0);
        expect(testBounds.width).toBe(referenceBounds.width);
        expect(testBounds.height).toBe(referenceBounds.height);
      }));

      // NOTE: This test may be redundant.
      // Support: Edge 14-15+
      // An `<svg>` element inside a `<foreignObject>` element on MS Edge has no
      // size, causing the included `<circle>` element to also have no size and thus fails an
      // assertion (relying on the element having a non-zero size).
      if (!isEdge) {
        test('should handle custom svg containers that transclude to foreignObject' +
           ' that transclude to custom svg containers that transclude to custom elements', angular.mock.inject(function() {
          element = angular.element('<div><svg-container>' +
              '<my-foreign-object><svg-container><svg-circle></svg-circle></svg-container></my-foreign-object>' +
              '</svg-container></div>');
          $compile(element.contents())($rootScope);
          document.body.appendChild(element[0]);

          var circle = element.find('circle');
          assertIsValidSvgCircle(circle[0]);
        }));
      }
    }

    test('should handle directives with templates that manually add the transclude further down', angular.mock.inject(function() {
      element = angular.element('<div><svg-custom-transclude-container>' +
          '<circle cx="2" cy="2" r="1"></circle></svg-custom-transclude-container>' +
          '</div>');
      $compile(element.contents())($rootScope);
      document.body.appendChild(element[0]);

      var circle = element.find('circle');
      assertIsValidSvgCircle(circle[0]);

    }));

    test('should support directives with SVG templates and a slow url ' +
       'that are stamped out later by a transcluding directive', function() {
      angular.mock.module(function() {
        directive('svgCircleUrl', ngInternals.valueFn({
          replace: true,
          templateUrl: 'template.html',
          templateNamespace: 'SVG'
        }));
      });
      angular.mock.inject(function($compile, $rootScope, $httpBackend) {
        $httpBackend.expect('GET', 'template.html').respond('<circle></circle>');
        element = $compile('<svg><g ng-repeat="l in list"><svg-circle-url></svg-circle-url></g></svg>')($rootScope);

        // initially the template is not yet loaded
        $rootScope.$apply(function() {
          $rootScope.list = [1];
        });
        expect(element.find('svg-circle-url').length).toBe(1);
        expect(element.find('circle').length).toBe(0);

        // template is loaded and replaces the existing nodes
        $httpBackend.flush();
        expect(element.find('svg-circle-url').length).toBe(0);
        expect(element.find('circle').length).toBe(1);

        // new entry should immediately use the loaded template
        $rootScope.$apply(function() {
          $rootScope.list.push(2);
        });
        expect(element.find('svg-circle-url').length).toBe(0);
        expect(element.find('circle').length).toBe(2);
      });
    });
  });

  describe('compile phase', () => {

    test('should attach scope to the document node when it is compiled explicitly', angular.mock.inject(function($document) {
      compileForTest($document);
      expect($document.scope()).toBe($rootScope);
    }));


    test('should not wrap root text nodes in spans', () => {
      element = angular.element(
        '<div>   <div>A</div>\n  ' +
        '<div>B</div>C\t\n  ' +
        '</div>');
      $compile(element.contents())($rootScope);
      var spans = element.find('span');
      expect(spans.length).toEqual(0);
    });


    test('should be able to compile text nodes at the root', angular.mock.inject(function($rootScope) {
      element = angular.element('<div>Name: {{name}}<br />\nColor: {{color}}</div>');
      $rootScope.name = 'Lucas';
      $rootScope.color = 'blue';
      $compile(element.contents())($rootScope);
      $rootScope.$digest();
      expect(element.text()).toEqual('Name: Lucas\nColor: blue');
    }));


    test('should not leak memory when there are top level empty text nodes', () => {
      // We compile the contents of element (i.e. not element itself)
      // Then delete these contents and check the cache has been reset to zero

      // First with only elements at the top level
      element = angular.element('<div><div></div></div>');
      $compile(element.contents())($rootScope);
      element.empty();
      expect(jqLiteCacheSize()).toEqual(0);

      // Next with non-empty text nodes at the top level
      // (in this case the compiler will wrap them in a <span>)
      element = angular.element('<div>xxx</div>');
      $compile(element.contents())($rootScope);
      element.empty();
      expect(jqLiteCacheSize()).toEqual(0);

      // Next with comment nodes at the top level
      element = angular.element('<div><!-- comment --></div>');
      $compile(element.contents())($rootScope);
      element.empty();
      expect(jqLiteCacheSize()).toEqual(0);

      // Finally with empty text nodes at the top level
      element = angular.element('<div>   \n<div></div>   </div>');
      $compile(element.contents())($rootScope);
      element.empty();
      expect(jqLiteCacheSize()).toEqual(0);
    });


    test('should not blow up when elements with no childNodes property are compiled', angular.mock.inject(
        function($compile, $rootScope) {
      // it turns out that when a browser plugin is bound to a DOM element (typically <object>),
      // the plugin's context rather than the usual DOM apis are exposed on this element, so
      // childNodes might not exist.

      element = angular.element('<div>{{1+2}}</div>');

      try {
        element[0].childNodes[1] = {nodeType: 3, nodeName: 'OBJECT', textContent: 'fake node'};
      } catch (e) { /* empty */ }
      if (!element[0].childNodes[1]) return; // browser doesn't support this kind of mocking

      expect(element[0].childNodes[1].textContent).toBe('fake node');

      $compile(element)($rootScope);
      $rootScope.$apply();

      // object's children can't be compiled in this case, so we expect them to be raw
      expect(element.html()).toBe('3');
    }));

    test('should detect anchor elements with the string "SVG" in the `href` attribute as an anchor', angular.mock.inject(function($compile, $rootScope) {
      element = angular.element('<div><a href="/ID_SVG_ID">' +
        '<span ng-if="true">Should render</span>' +
        '</a></div>');
      $compile(element.contents())($rootScope);
      $rootScope.$digest();
      document.body.appendChild(element[0]);
      expect(element.find('span').text()).toContain('Should render');
    }));

    describe('multiple directives per element', () => {
      test('should allow multiple directives per element', angular.mock.inject(function($compile, $rootScope, log) {
        element = $compile(
          '<span greet="angular" log="L" x-high-log="H" data-medium-log="M"></span>')($rootScope);
        expect(element.text()).toEqual('Hello angular');
        expect(log).toEqual('L; M; H');
      }));


      test('should recurse to children', angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div>0<a set="hello">1</a>2<b set="angular">3</b>4</div>')($rootScope);
        expect(element.text()).toEqual('0hello2angular4');
      }));


      test('should allow directives in classes', angular.mock.inject(function($compile, $rootScope, log) {
        element = $compile('<div class="greet: angular; log:123;"></div>')($rootScope);
        expect(element.html()).toEqual('Hello angular');
        expect(log).toEqual('123');
      }));


      test('should allow directives in SVG element classes', angular.mock.inject(function($compile, $rootScope, log) {
        if (!window.SVGElement) return;
        element = $compile('<svg><text class="greet: angular; log:123;"></text></svg>')($rootScope);
        var text = element.children().eq(0);
        // In old Safari, SVG elements don't have innerHTML, so element.html() won't work
        // (https://bugs.webkit.org/show_bug.cgi?id=136903)
        expect(text.text()).toEqual('Hello angular');
        expect(log).toEqual('123');
      }));


      test('should ignore not set CSS classes on SVG elements', angular.mock.inject(function($compile, $rootScope, log) {
        if (!window.SVGElement) return;
        // According to spec SVG element className property is readonly, but only FF
        // implements it this way which causes compile exceptions.
        element = $compile('<svg><text>{{1}}</text></svg>')($rootScope);
        $rootScope.$digest();
        expect(element.text()).toEqual('1');
      }));


      test('should receive scope, element, and attributes', () => {
        var injector;
        angular.mock.module(function() {
          directive('log', function($injector, $rootScope) {
            injector = $injector;
            return {
              restrict: 'CA',
              compile(element, templateAttr) {
                expect(typeof templateAttr.$normalize).toBe('function');
                expect(typeof templateAttr.$set).toBe('function');
                expect(angular.isElement(templateAttr.$$element)).toBeTruthy();
                expect(element.text()).toEqual('unlinked');
                expect(templateAttr.exp).toEqual('abc');
                expect(templateAttr.aa).toEqual('A');
                expect(templateAttr.bb).toEqual('B');
                expect(templateAttr.cc).toEqual('C');
                return function(scope, element, attr) {
                  expect(element.text()).toEqual('unlinked');
                  expect(attr).toBe(templateAttr);
                  expect(scope).toEqual($rootScope);
                  element.text('worked');
                };
              }
            };
          });
        });
        angular.mock.inject(function($rootScope, $compile, $injector) {
          element = $compile(
              '<div class="log" exp="abc" aa="A" x-Bb="B" daTa-cC="C">unlinked</div>')($rootScope);
          expect(element.text()).toEqual('worked');
          expect(injector).toBe($injector); // verify that directive is injectable
        });
      });
    });

    describe('error handling', () => {

      test('should handle exceptions', () => {
        angular.mock.module(function($exceptionHandlerProvider) {
          $exceptionHandlerProvider.mode('log');
          directive('factoryError', function() { throw 'FactoryError'; });
          directive('templateError',
              ngInternals.valueFn({ compile() { throw 'TemplateError'; } }));
          directive('linkingError',
              ngInternals.valueFn(function() { throw 'LinkingError'; }));
        });
        angular.mock.inject(function($rootScope, $compile, $exceptionHandler) {
          element = $compile('<div factory-error template-error linking-error></div>')($rootScope);
          expect($exceptionHandler.errors[0]).toEqual('FactoryError');
          expect($exceptionHandler.errors[1][0]).toEqual('TemplateError');
          expect(sortTag($exceptionHandler.errors[1][1])).
              toEqual('<div factory-error="" linking-error="" template-error="">');
          expect($exceptionHandler.errors[2][0]).toEqual('LinkingError');
          expect(sortTag($exceptionHandler.errors[2][1])).
              toEqual('<div class="ng-scope" factory-error="" linking-error="" template-error="">');

          // Support: IE 9-11 only, Edge 15+
          // IE/Edge sort attributes in a different order.
          function sortTag(text) {
            var parts;
            var elementName;

            parts = text
              .replace('<', '')
              .replace('>', '')
              .split(' ');
            elementName = parts.shift();
            parts.sort();
            parts.unshift(elementName);

            return '<' + parts.join(' ') + '>';
          }
        });
      });


      test('should allow changing the template structure after the current node', () => {
        angular.mock.module(function() {
          directive('after', ngInternals.valueFn({
            compile(element) {
              element.after('<span log>B</span>');
            }
          }));
        });
        angular.mock.inject(function($compile, $rootScope, log) {
          element = angular.element('<div><div after>A</div></div>');
          $compile(element)($rootScope);
          expect(element.text()).toBe('AB');
          expect(log).toEqual('LOG');
        });
      });


      test('should allow changing the template structure after the current node inside ngRepeat', () => {
        angular.mock.module(function() {
          directive('after', ngInternals.valueFn({
            compile(element) {
              element.after('<span log>B</span>');
            }
          }));
        });
        angular.mock.inject(function($compile, $rootScope, log) {
          element = angular.element('<div><div ng-repeat="i in [1,2]"><div after>A</div></div></div>');
          $compile(element)($rootScope);
          $rootScope.$digest();
          expect(element.text()).toBe('ABAB');
          expect(log).toEqual('LOG; LOG');
        });
      });


      test('should allow modifying the DOM structure in post link fn', () => {
        angular.mock.module(function() {
          directive('removeNode', ngInternals.valueFn({
            link($scope, $element) {
              $element.remove();
            }
          }));
        });
        angular.mock.inject(function($compile, $rootScope) {
          element = angular.element('<div><div remove-node></div><div>{{test}}</div></div>');
          $rootScope.test = 'Hello';
          $compile(element)($rootScope);
          $rootScope.$digest();
          expect(element.children().length).toBe(1);
          expect(element.text()).toBe('Hello');
        });
      });
    });

    describe('compiler control', () => {
      describe('priority', () => {
        test('should honor priority', angular.mock.inject(function($compile, $rootScope, log) {
          element = $compile(
            '<span log="L" x-high-log="H" data-medium-log="M"></span>')($rootScope);
          expect(log).toEqual('L; M; H');
        }));
      });


      describe('terminal', () => {

        test('should prevent further directives from running', angular.mock.inject(function($rootScope, $compile) {
            element = $compile('<div negative-stop><a set="FAIL">OK</a></div>')($rootScope);
            expect(element.text()).toEqual('OK');
          }
        ));


        test('should prevent further directives from running, but finish current priority level',
          angular.mock.inject(function($rootScope, $compile, log) {
            // class is processed after attrs, so putting log in class will put it after
            // the stop in the current level. This proves that the log runs after stop
            element = $compile(
              '<div high-log medium-stop log class="medium-log"><a set="FAIL">OK</a></div>')($rootScope);
            expect(element.text()).toEqual('OK');
            expect(log.toArray().sort()).toEqual(['HIGH', 'MEDIUM']);
          })
        );
      });


      describe('restrict', () => {

        test('should allow restriction of availability', () => {
          angular.mock.module(function() {
            angular.forEach({div: 'E', attr: 'A', clazz: 'C', comment: 'M', all: 'EACM'},
                function(restrict, name) {
              directive(name, function(log) {
                return {
                  restrict: restrict,
                  compile: ngInternals.valueFn(function(scope, element, attr) {
                    log(name);
                  })
                };
              });
            });
          });
          angular.mock.inject(function($rootScope, $compile, log) {
            dealoc($compile('<span div class="div"></span>')($rootScope));
            expect(log).toEqual('');
            log.reset();

            dealoc($compile('<div></div>')($rootScope));
            expect(log).toEqual('div');
            log.reset();

            dealoc($compile('<attr class="attr"></attr>')($rootScope));
            expect(log).toEqual('');
            log.reset();

            dealoc($compile('<span attr></span>')($rootScope));
            expect(log).toEqual('attr');
            log.reset();

            dealoc($compile('<clazz clazz></clazz>')($rootScope));
            expect(log).toEqual('');
            log.reset();

            dealoc($compile('<span class="clazz"></span>')($rootScope));
            expect(log).toEqual('clazz');
            log.reset();

            dealoc($compile('<!-- directive: comment -->')($rootScope));
            expect(log).toEqual('comment');
            log.reset();

            dealoc($compile('<all class="all" all><!-- directive: all --></all>')($rootScope));
            expect(log).toEqual('all; all; all; all');
          });
        });


        test('should use EA rule as the default', () => {
          angular.mock.module(function() {
            directive('defaultDir', function(log) {
              return {
                compile() {
                  log('defaultDir');
                }
              };
            });
          });
          angular.mock.inject(function($rootScope, $compile, log) {
            dealoc($compile('<span default-dir ></span>')($rootScope));
            expect(log).toEqual('defaultDir');
            log.reset();

            dealoc($compile('<default-dir></default-dir>')($rootScope));
            expect(log).toEqual('defaultDir');
            log.reset();

            dealoc($compile('<span class="default-dir"></span>')($rootScope));
            expect(log).toEqual('');
            log.reset();
          });
        });
      });


      describe('template', () => {

        beforeEach(angular.mock.module(function() {
          directive('replace', ngInternals.valueFn({
            restrict: 'CAM',
            replace: true,
            template: '<div class="log" style="width: 10px" high-log>Replace!</div>',
            compile(element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('nomerge', ngInternals.valueFn({
            restrict: 'CAM',
            replace: true,
            template: '<div class="log" id="myid" high-log>No Merge!</div>',
            compile(element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('append', ngInternals.valueFn({
            restrict: 'CAM',
            template: '<div class="log" style="width: 10px" high-log>Append!</div>',
            compile(element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('replaceWithInterpolatedClass', ngInternals.valueFn({
            replace: true,
            template: '<div class="class_{{1+1}}">Replace with interpolated class!</div>',
            compile(element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('replaceWithInterpolatedStyle', ngInternals.valueFn({
            replace: true,
            template: '<div style="width:{{1+1}}px">Replace with interpolated style!</div>',
            compile(element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('replaceWithTr', ngInternals.valueFn({
            replace: true,
            template: '<tr><td>TR</td></tr>'
          }));
          directive('replaceWithTd', ngInternals.valueFn({
            replace: true,
            template: '<td>TD</td>'
          }));
          directive('replaceWithTh', ngInternals.valueFn({
            replace: true,
            template: '<th>TH</th>'
          }));
          directive('replaceWithThead', ngInternals.valueFn({
            replace: true,
            template: '<thead><tr><td>TD</td></tr></thead>'
          }));
          directive('replaceWithTbody', ngInternals.valueFn({
            replace: true,
            template: '<tbody><tr><td>TD</td></tr></tbody>'
          }));
          directive('replaceWithTfoot', ngInternals.valueFn({
            replace: true,
            template: '<tfoot><tr><td>TD</td></tr></tfoot>'
          }));
          directive('replaceWithOption', ngInternals.valueFn({
            replace: true,
            template: '<option>OPTION</option>'
          }));
          directive('replaceWithOptgroup', ngInternals.valueFn({
            replace: true,
            template: '<optgroup>OPTGROUP</optgroup>'
          }));
        }));


        test('should replace element with template', angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div><div replace>ignore</div><div>')($rootScope);
          expect(element.text()).toEqual('Replace!');
          expect(element.find('div').attr('compiled')).toEqual('COMPILED');
        }));


        test('should append element with template', angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div><div append>ignore</div><div>')($rootScope);
          expect(element.text()).toEqual('Append!');
          expect(element.find('div').attr('compiled')).toEqual('COMPILED');
        }));


        test('should compile template when replacing', angular.mock.inject(function($compile, $rootScope, log) {
          element = $compile('<div><div replace medium-log>ignore</div><div>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('Replace!');
          expect(log).toEqual('LOG; HIGH; MEDIUM');
        }));


        test('should compile template when appending', angular.mock.inject(function($compile, $rootScope, log) {
          element = $compile('<div><div append medium-log>ignore</div><div>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('Append!');
          expect(log).toEqual('LOG; HIGH; MEDIUM');
        }));


        test('should merge attributes including style attr', angular.mock.inject(function($compile, $rootScope) {
          element = $compile(
            '<div><div replace class="medium-log" style="height: 20px" ></div><div>')($rootScope);
          var div = element.find('div');
          expect(div.hasClass('medium-log')).toBe(true);
          expect(div.hasClass('log')).toBe(true);
          expect(div.css('width')).toBe('10px');
          expect(div.css('height')).toBe('20px');
          expect(div.attr('replace')).toEqual('');
          expect(div.attr('high-log')).toEqual('');
        }));

        test('should not merge attributes if they are the same', angular.mock.inject(function($compile, $rootScope) {
          element = $compile(
            '<div><div nomerge class="medium-log" id="myid"></div><div>')($rootScope);
          var div = element.find('div');
          expect(div.hasClass('medium-log')).toBe(true);
          expect(div.hasClass('log')).toBe(true);
          expect(div.attr('id')).toEqual('myid');
        }));


        test('should correctly merge attributes that contain special characters', angular.mock.inject(function($compile, $rootScope) {
          element = $compile(
            '<div><div replace (click)="doSomething()" [value]="someExpression" ω="omega"></div><div>')($rootScope);
          var div = element.find('div');
          expect(div.attr('(click)')).toEqual('doSomething()');
          expect(div.attr('[value]')).toEqual('someExpression');
          expect(div.attr('ω')).toEqual('omega');
        }));


        test('should not add white-space when merging an attribute that is "" in the replaced element',
          angular.mock.inject(function($compile, $rootScope) {
            element = $compile(
              '<div><div replace class=""></div><div>')($rootScope);
            var div = element.find('div');
            expect(div.hasClass('log')).toBe(true);
            expect(div.attr('class')).toBe('log');
          })
        );


        test('should not set merged attributes twice in $attrs', () => {
          var attrs;

          angular.mock.module(function() {
            directive('logAttrs', function() {
              return {
                link($scope, $element, $attrs) {
                  attrs = $attrs;
                }
              };
            });
          });

          angular.mock.inject(function($compile, $rootScope) {
            element = $compile(
              '<div><div log-attrs replace class="myLog"></div><div>')($rootScope);
            var div = element.find('div');
            expect(div.attr('class')).toBe('myLog log');
            expect(attrs.class).toBe('myLog log');
          });
        });


        test('should prevent multiple templates per element', angular.mock.inject(function($compile) {
          try {
            $compile('<div><span replace class="replace"></span></div>');
            this.fail(new Error('should have thrown Multiple directives error'));
          } catch (e) {
            expect(e.message).toMatch(/Multiple directives .* asking for template/);
          }
        }));

        test('should play nice with repeater when replacing', angular.mock.inject(function($compile, $rootScope) {
          element = $compile(
            '<div>' +
              '<div ng-repeat="i in [1,2]" replace></div>' +
            '</div>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('Replace!Replace!');
        }));


        test('should play nice with repeater when appending', angular.mock.inject(function($compile, $rootScope) {
          element = $compile(
            '<div>' +
              '<div ng-repeat="i in [1,2]" append></div>' +
            '</div>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('Append!Append!');
        }));


        test('should handle interpolated css class from replacing directive', angular.mock.inject(
            function($compile, $rootScope) {
          element = $compile('<div replace-with-interpolated-class></div>')($rootScope);
          $rootScope.$digest();
          expect(element).toHaveClass('class_2');
        }));

        test('should handle interpolated css style from replacing directive', angular.mock.inject(
          function($compile, $rootScope) {
            element = $compile('<div replace-with-interpolated-style></div>')($rootScope);
            $rootScope.$digest();
            expect(element.css('width')).toBe('2px');
          }
        ));

        test('should merge interpolated css class', angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div class="one {{cls}} three" replace></div>')($rootScope);

          $rootScope.$apply(function() {
            $rootScope.cls = 'two';
          });

          expect(element).toHaveClass('one');
          expect(element).toHaveClass('two'); // interpolated
          expect(element).toHaveClass('three');
          expect(element).toHaveClass('log'); // merged from replace directive template
        }));


        test('should merge interpolated css class with ngRepeat',
            angular.mock.inject(function($compile, $rootScope) {
          element = $compile(
              '<div>' +
                '<div ng-repeat="i in [1]" class="one {{cls}} three" replace></div>' +
              '</div>')($rootScope);

          $rootScope.$apply(function() {
            $rootScope.cls = 'two';
          });

          var child = element.find('div').eq(0);
          expect(child).toHaveClass('one');
          expect(child).toHaveClass('two'); // interpolated
          expect(child).toHaveClass('three');
          expect(child).toHaveClass('log'); // merged from replace directive template
        }));

        test('should interpolate the values once per digest',
            angular.mock.inject(function($compile, $rootScope, log) {
          element = $compile('<div>{{log("A")}} foo {{::log("B")}}</div>')($rootScope);
          $rootScope.log = log;
          $rootScope.$digest();
          expect(log).toEqual('A; B; A; B');
        }));

        test('should update references to replaced jQuery context', () => {
          angular.mock.module(function($compileProvider) {
            $compileProvider.directive('foo', function() {
              return {
                replace: true,
                template: '<div></div>'
              };
            });
          });

          angular.mock.inject(function($compile, $rootScope) {
            element = angular.element(document.createElement('span')).attr('foo', '');
            expect(ngInternals.nodeName_(element)).toBe('span');

            var preCompiledNode = element[0];

            var linked = $compile(element)($rootScope);
            expect(linked).toBe(element);
            expect(ngInternals.nodeName_(element)).toBe('div');
            if (element.context) {
              expect(element.context).toBe(element[0]);
            }
          });
        });

        describe('replace and not exactly one root element', () => {
          var templateVar;

          beforeEach(angular.mock.module(function() {
            directive('template', function() {
              return {
                replace: true,
                template() {
                  return templateVar;
                }
              };
            });
          }));

          test.each(Object.entries({
              'no root element': 'dada',
              'multiple root elements': '<div></div><div></div>'
            }).map(([prop, value]) => ({ prop, value })))(
              'should throw if: $prop', function({ value: directiveTemplate }) {

              angular.mock.inject(function($compile) {
                templateVar = directiveTemplate;
                expect(function() {
                  $compile('<p template></p>');
                }).toThrowMinErr('$compile', 'tplrt',
                  'Template for directive \'template\' must have exactly one root element.'
                );
              });
          });

          test.each(Object.entries({
              'whitespace': '  <div>Hello World!</div> \n',
              'comments': '<!-- oh hi --><div>Hello World!</div> \n',
              'comments + whitespace': '  <!-- oh hi -->  <div>Hello World!</div>  <!-- oh hi -->\n'
            }).map(([prop, value]) => ({ prop, value })))(
              'should not throw if the root element is accompanied by: $prop', function({ value: directiveTemplate }) {

              angular.mock.inject(function() {
                templateVar = directiveTemplate;
                var element;
                expect(function() {
                  element = compileForTest('<p template></p>');
                }).not.toThrow();
                expect(element.length).toBe(1);
                expect(element.text()).toBe('Hello World!');
              });
          });
        });

        test('should support templates with root <tr> tags', angular.mock.inject(function($compile, $rootScope) {
          expect(function() {
            element = $compile('<div replace-with-tr></div>')($rootScope);
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/tr/i);
        }));

        test('should support templates with root <td> tags', angular.mock.inject(function($compile, $rootScope) {
          expect(function() {
            element = $compile('<div replace-with-td></div>')($rootScope);
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/td/i);
        }));

        test('should support templates with root <th> tags', angular.mock.inject(function($compile, $rootScope) {
          expect(function() {
            element = $compile('<div replace-with-th></div>')($rootScope);
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/th/i);
        }));

        test('should support templates with root <thead> tags', angular.mock.inject(function($compile, $rootScope) {
          expect(function() {
            element = $compile('<div replace-with-thead></div>')($rootScope);
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/thead/i);
        }));

        test('should support templates with root <tbody> tags', angular.mock.inject(function($compile, $rootScope) {
          expect(function() {
            element = $compile('<div replace-with-tbody></div>')($rootScope);
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/tbody/i);
        }));

        test('should support templates with root <tfoot> tags', angular.mock.inject(function($compile, $rootScope) {
          expect(function() {
            element = $compile('<div replace-with-tfoot></div>')($rootScope);
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/tfoot/i);
        }));

        test('should support templates with root <option> tags', angular.mock.inject(function($compile, $rootScope) {
          expect(function() {
            element = $compile('<div replace-with-option></div>')($rootScope);
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/option/i);
        }));

        test('should support templates with root <optgroup> tags', angular.mock.inject(function($compile, $rootScope) {
          expect(function() {
            element = $compile('<div replace-with-optgroup></div>')($rootScope);
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/optgroup/i);
        }));

        test('should support SVG templates using directive.templateNamespace=svg', () => {
          angular.mock.module(function() {
            directive('svgAnchor', ngInternals.valueFn({
              replace: true,
              template: '<a xlink:href="{{linkurl}}">{{text}}</a>',
              templateNamespace: 'SVG',
              scope: {
                linkurl: '@svgAnchor',
                text: '@?'
              }
            }));
          });
          angular.mock.inject(function($compile, $rootScope) {
            element = $compile('<svg><g svg-anchor="/foo/bar" text="foo/bar!"></g></svg>')($rootScope);
            var child = element.children().eq(0);
            $rootScope.$digest();
            expect(ngInternals.nodeName_(child)).toMatch(/a/i);
            expect(isSVGElement(child[0])).toBe(true);
            expect(child[0].href.baseVal).toBe('/foo/bar');
          });
        });

        if (supportsMathML()) {
          // MathML is only natively supported in Firefox at the time of this test's writing,
          // and even there, the browser does not export MathML element constructors globally.
          test('should support MathML templates using directive.templateNamespace=math', () => {
            angular.mock.module(function() {
              directive('pow', ngInternals.valueFn({
                replace: true,
                transclude: true,
                template: '<msup><mn>{{pow}}</mn></msup>',
                templateNamespace: 'MATH',
                scope: {
                  pow: '@pow'
                },
                link(scope, elm, attr, ctrl, transclude) {
                  transclude(function(node) {
                    elm.prepend(node[0]);
                  });
                }
              }));
            });
            angular.mock.inject(function($compile, $rootScope) {
              element = $compile('<math><mn pow="2"><mn>8</mn></mn></math>')($rootScope);
              $rootScope.$digest();
              var child = element.children().eq(0);
              expect(ngInternals.nodeName_(child)).toMatch(/msup/i);
              expect(isUnknownElement(child[0])).toBe(false);
              expect(isHTMLElement(child[0])).toBe(false);
            });
          });
        }

        test('should keep prototype properties on directive', () => {
          angular.mock.module(function() {
            function DirectiveClass() {
              this.restrict = 'E';
              this.template = '<p>{{value}}</p>';
            }

            DirectiveClass.prototype.compile = function() {
              return function(scope, element, attrs) {
                scope.value = 'Test Value';
              };
            };

            directive('templateUrlWithPrototype', ngInternals.valueFn(new DirectiveClass()));
          });

          angular.mock.inject(function($compile, $rootScope) {
            element = $compile('<template-url-with-prototype><template-url-with-prototype>')($rootScope);
            $rootScope.$digest();
            expect(element.find('p')[0].innerHTML).toEqual('Test Value');
          });
        });
      });


      describe('template as function', () => {

        beforeEach(angular.mock.module(function() {
          directive('myDirective', ngInternals.valueFn({
            replace: true,
            template($element, $attrs) {
              expect($element.text()).toBe('original content');
              expect($attrs.myDirective).toBe('some value');
              return '<div id="templateContent">template content</div>';
            },
            compile($element, $attrs) {
              expect($element.text()).toBe('template content');
              expect($attrs.id).toBe('templateContent');
            }
          }));
        }));


        test('should evaluate `template` when defined as fn and use returned string as template', angular.mock.inject(
            function($compile, $rootScope) {
          element = $compile('<div my-directive="some value">original content<div>')($rootScope);
          expect(element.text()).toEqual('template content');
        }));
      });


      describe('templateUrl', () => {

        beforeEach(angular.mock.module(
          function() {
            directive('hello', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'hello.html',
              transclude: true
            }));
            directive('cau', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'cau.html'
            }));
            directive('crossDomainTemplate', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'http://example.com/should-not-load.html'
            }));
            directive('trustedTemplate', function($sce) {
              return {
                restrict: 'CAM',
                templateUrl() {
                  return $sce.trustAsResourceUrl('http://example.com/trusted-template.html');
                }
              };
            });
            directive('cError', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl:'error.html',
              compile() {
                throw new Error('cError');
              }
            }));
            directive('lError', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'error.html',
              compile() {
                throw new Error('lError');
              }
            }));


            directive('iHello', ngInternals.valueFn({
              restrict: 'CAM',
              replace: true,
              templateUrl: 'hello.html'
            }));
            directive('iCau', ngInternals.valueFn({
              restrict: 'CAM',
              replace: true,
              templateUrl:'cau.html'
            }));

            directive('iCError', ngInternals.valueFn({
              restrict: 'CAM',
              replace: true,
              templateUrl:'error.html',
              compile() {
                throw new Error('cError');
              }
            }));
            directive('iLError', ngInternals.valueFn({
              restrict: 'CAM',
              replace: true,
              templateUrl: 'error.html',
              compile() {
                throw new Error('lError');
              }
            }));

            directive('replace', ngInternals.valueFn({
              replace: true,
              template: '<span>Hello, {{name}}!</span>'
            }));

            directive('replaceWithTr', ngInternals.valueFn({
              replace: true,
              templateUrl: 'tr.html'
            }));
            directive('replaceWithTd', ngInternals.valueFn({
              replace: true,
              templateUrl: 'td.html'
            }));
            directive('replaceWithTh', ngInternals.valueFn({
              replace: true,
              templateUrl: 'th.html'
            }));
            directive('replaceWithThead', ngInternals.valueFn({
              replace: true,
              templateUrl: 'thead.html'
            }));
            directive('replaceWithTbody', ngInternals.valueFn({
              replace: true,
              templateUrl: 'tbody.html'
            }));
            directive('replaceWithTfoot', ngInternals.valueFn({
              replace: true,
              templateUrl: 'tfoot.html'
            }));
            directive('replaceWithOption', ngInternals.valueFn({
              replace: true,
              templateUrl: 'option.html'
            }));
            directive('replaceWithOptgroup', ngInternals.valueFn({
              replace: true,
              templateUrl: 'optgroup.html'
            }));
          }
        ));

        test('should not load cross domain templates by default', angular.mock.inject(
          function($compile, $rootScope) {
            expect(function() {
              $compile('<div class="crossDomainTemplate"></div>')($rootScope);
            }).toThrowMinErr('$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example.com/should-not-load.html');
          }
        ));

        test('should trust what is already in the template cache', angular.mock.inject(
          function($compile, $httpBackend, $rootScope, $templateCache) {
            $httpBackend.expect('GET', 'http://example.com/should-not-load.html').respond('<span>example.com/remote-version</span>');
            $templateCache.put('http://example.com/should-not-load.html', '<span>example.com/cached-version</span>');
            element = $compile('<div class="crossDomainTemplate"></div>')($rootScope);
            expect(sortedHtml(element)).toEqual('<div class="crossDomainTemplate"></div>');
            $rootScope.$digest();
            expect(sortedHtml(element)).toEqual('<div class="crossDomainTemplate"><span>example.com/cached-version</span></div>');
          }
        ));

        test('should load cross domain templates when trusted', angular.mock.inject(
          function($compile, $httpBackend, $rootScope, $sce) {
            $httpBackend.expect('GET', 'http://example.com/trusted-template.html').respond('<span>example.com/trusted_template_contents</span>');
            element = $compile('<div class="trustedTemplate"></div>')($rootScope);
            expect(sortedHtml(element)).
                toEqual('<div class="trustedTemplate"></div>');
            $httpBackend.flush();
            expect(sortedHtml(element)).
                toEqual('<div class="trustedTemplate"><span>example.com/trusted_template_contents</span></div>');
          }
        ));

        test('should append template via $http and cache it in $templateCache', angular.mock.inject(
            function($compile, $httpBackend, $templateCache, $rootScope, $browser) {
              $httpBackend.expect('GET', 'hello.html').respond('<span>Hello!</span> World!');
              $templateCache.put('cau.html', '<span>Cau!</span>');
              element = $compile('<div><b class="hello">ignore</b><b class="cau">ignore</b></div>')($rootScope);
              expect(sortedHtml(element)).
                  toEqual('<div><b class="hello"></b><b class="cau"></b></div>');

              $rootScope.$digest();


              expect(sortedHtml(element)).
                  toEqual('<div><b class="hello"></b><b class="cau"><span>Cau!</span></b></div>');

              $httpBackend.flush();
              expect(sortedHtml(element)).toEqual(
                  '<div>' +
                    '<b class="hello"><span>Hello!</span> World!</b>' +
                    '<b class="cau"><span>Cau!</span></b>' +
                  '</div>');
            }
        ));


        test('should inline template via $http and cache it in $templateCache', angular.mock.inject(
            function($compile, $httpBackend, $templateCache, $rootScope) {
              $httpBackend.expect('GET', 'hello.html').respond('<span>Hello!</span>');
              $templateCache.put('cau.html', '<span>Cau!</span>');
              element = $compile('<div><b class=i-hello>ignore</b><b class=i-cau>ignore</b></div>')($rootScope);
              expect(sortedHtml(element)).
                  toEqual('<div><b class="i-hello"></b><b class="i-cau"></b></div>');

              $rootScope.$digest();


              expect(sortedHtml(element)).toBe('<div><b class="i-hello"></b><span class="i-cau">Cau!</span></div>');

              $httpBackend.flush();
              expect(sortedHtml(element)).toBe('<div><span class="i-hello">Hello!</span><span class="i-cau">Cau!</span></div>');
            }
        ));


        test('should compile, link and flush the template append', angular.mock.inject(
            function($compile, $templateCache, $rootScope, $browser) {
              $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
              $rootScope.name = 'Elvis';
              element = $compile('<div><b class="hello"></b></div>')($rootScope);

              $rootScope.$digest();

              expect(sortedHtml(element)).
                  toEqual('<div><b class="hello"><span>Hello, Elvis!</span></b></div>');
            }
        ));


        test('should compile, link and flush the template inline', angular.mock.inject(
            function($compile, $templateCache, $rootScope) {
              $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
              $rootScope.name = 'Elvis';
              element = $compile('<div><b class=i-hello></b></div>')($rootScope);

              $rootScope.$digest();

              expect(sortedHtml(element)).toBe('<div><span class="i-hello">Hello, Elvis!</span></div>');
            }
        ));


        test('should compile, flush and link the template append', angular.mock.inject(
            function($compile, $templateCache, $rootScope) {
              $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
              $rootScope.name = 'Elvis';
              var template = $compile('<div><b class="hello"></b></div>');

              element = template($rootScope);
              $rootScope.$digest();

              expect(sortedHtml(element)).
                  toEqual('<div><b class="hello"><span>Hello, Elvis!</span></b></div>');
            }
        ));


        test('should compile, flush and link the template inline', angular.mock.inject(
            function($compile, $templateCache, $rootScope) {
              $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
              $rootScope.name = 'Elvis';
              var template = $compile('<div><b class=i-hello></b></div>');

              element = template($rootScope);
              $rootScope.$digest();

              expect(sortedHtml(element)).toBe('<div><span class="i-hello">Hello, Elvis!</span></div>');
            }
        ));


        test('should compile template when replacing element in another template',
            angular.mock.inject(function($compile, $templateCache, $rootScope) {
          $templateCache.put('hello.html', '<div replace></div>');
          $rootScope.name = 'Elvis';
          element = $compile('<div><b class="hello"></b></div>')($rootScope);

          $rootScope.$digest();

          expect(sortedHtml(element)).
            toEqual('<div><b class="hello"><span replace="">Hello, Elvis!</span></b></div>');
        }));


        test('should compile template when replacing root element',
            angular.mock.inject(function($compile, $templateCache, $rootScope) {
              $rootScope.name = 'Elvis';
              element = $compile('<div replace></div>')($rootScope);

              $rootScope.$digest();

              expect(sortedHtml(element)).
                  toEqual('<span replace="">Hello, Elvis!</span>');
            }));


        test('should resolve widgets after cloning in append mode', () => {
          angular.mock.module(function($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject(function($compile, $templateCache, $rootScope, $httpBackend, $browser,
                   $exceptionHandler) {
            $httpBackend.expect('GET', 'hello.html').respond('<span>{{greeting}} </span>');
            $httpBackend.expect('GET', 'error.html').respond('<div></div>');
            $templateCache.put('cau.html', '<span>{{name}}</span>');
            $rootScope.greeting = 'Hello';
            $rootScope.name = 'Elvis';
            var template = $compile(
              '<div>' +
                '<b class="hello"></b>' +
                '<b class="cau"></b>' +
                '<b class=c-error></b>' +
                '<b class=l-error></b>' +
              '</div>');
            var e1;
            var e2;

            e1 = template($rootScope.$new(), angular.noop); // clone
            expect(e1.text()).toEqual('');

            $httpBackend.flush();

            e2 = template($rootScope.$new(), angular.noop); // clone
            $rootScope.$digest();
            expect(e1.text()).toEqual('Hello Elvis');
            expect(e2.text()).toEqual('Hello Elvis');

            expect($exceptionHandler.errors.length).toEqual(2);
            expect($exceptionHandler.errors[0][0].message).toEqual('cError');
            expect($exceptionHandler.errors[1][0].message).toEqual('lError');

            dealoc(e1);
            dealoc(e2);
          });
        });

        test('should resolve widgets after cloning in append mode without $templateCache', () => {
          angular.mock.module(function($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject(function($compile, $templateCache, $rootScope, $httpBackend, $browser,
                          $exceptionHandler) {
            $httpBackend.expect('GET', 'cau.html').respond('<span>{{name}}</span>');
            $rootScope.name = 'Elvis';
            var template = $compile('<div class="cau"></div>');
            var e1;
            var e2;

            e1 = template($rootScope.$new(), angular.noop); // clone
            expect(e1.text()).toEqual('');

            $httpBackend.flush();

            e2 = template($rootScope.$new(), angular.noop); // clone
            $rootScope.$digest();
            expect(e1.text()).toEqual('Elvis');
            expect(e2.text()).toEqual('Elvis');

            dealoc(e1);
            dealoc(e2);
          });
        });

        test('should resolve widgets after cloning in inline mode', () => {
          angular.mock.module(function($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject(function($compile, $templateCache, $rootScope, $httpBackend, $browser,
                   $exceptionHandler) {
            $httpBackend.expect('GET', 'hello.html').respond('<span>{{greeting}} </span>');
            $httpBackend.expect('GET', 'error.html').respond('<div></div>');
            $templateCache.put('cau.html', '<span>{{name}}</span>');
            $rootScope.greeting = 'Hello';
            $rootScope.name = 'Elvis';
            var template = $compile(
              '<div>' +
                '<b class=i-hello></b>' +
                '<b class=i-cau></b>' +
                '<b class=i-c-error></b>' +
                '<b class=i-l-error></b>' +
              '</div>');
            var e1;
            var e2;

            e1 = template($rootScope.$new(), angular.noop); // clone
            expect(e1.text()).toEqual('');

            $httpBackend.flush();

            e2 = template($rootScope.$new(), angular.noop); // clone
            $rootScope.$digest();
            expect(e1.text()).toEqual('Hello Elvis');
            expect(e2.text()).toEqual('Hello Elvis');

            expect($exceptionHandler.errors.length).toEqual(2);
            expect($exceptionHandler.errors[0][0].message).toEqual('cError');
            expect($exceptionHandler.errors[1][0].message).toEqual('lError');

            dealoc(e1);
            dealoc(e2);
          });
        });

        test('should resolve widgets after cloning in inline mode without $templateCache', () => {
          angular.mock.module(function($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject(function($compile, $templateCache, $rootScope, $httpBackend, $browser,
                          $exceptionHandler) {
            $httpBackend.expect('GET', 'cau.html').respond('<span>{{name}}</span>');
            $rootScope.name = 'Elvis';
            var template = $compile('<div class="i-cau"></div>');
            var e1;
            var e2;

            e1 = template($rootScope.$new(), angular.noop); // clone
            expect(e1.text()).toEqual('');

            $httpBackend.flush();

            e2 = template($rootScope.$new(), angular.noop); // clone
            $rootScope.$digest();
            expect(e1.text()).toEqual('Elvis');
            expect(e2.text()).toEqual('Elvis');

            dealoc(e1);
            dealoc(e2);
          });
        });


        test('should be implicitly terminal and not compile placeholder content in append', angular.mock.inject(
            function($compile, $templateCache, $rootScope, log) {
              // we can't compile the contents because that would result in a memory leak

              $templateCache.put('hello.html', 'Hello!');
              element = $compile('<div><b class="hello"><div log></div></b></div>')($rootScope);

              expect(log).toEqual('');
            }
        ));


        test('should be implicitly terminal and not compile placeholder content in inline', angular.mock.inject(
            function($compile, $templateCache, $rootScope, log) {
              // we can't compile the contents because that would result in a memory leak

              $templateCache.put('hello.html', 'Hello!');
              element = $compile('<div><b class=i-hello><div log></div></b></div>')($rootScope);

              expect(log).toEqual('');
            }
        ));


        test('should throw an error and clear element content if the template fails to load',
          angular.mock.inject(function($compile, $httpBackend, $rootScope) {
            $httpBackend.expect('GET', 'hello.html').respond(404, 'Not Found!');
            element = $compile('<div><b class="hello">content</b></div>')($rootScope);

            expect(function() {
              $httpBackend.flush();
            }).toThrowMinErr('$templateRequest', 'tpload', 'Failed to load template: hello.html');
            expect(sortedHtml(element)).toBe('<div><b class="hello"></b></div>');
          })
        );


        test('should prevent multiple templates per element', () => {
          angular.mock.module(function() {
            directive('sync', ngInternals.valueFn({
              restrict: 'C',
              template: '<span></span>'
            }));
            directive('async', ngInternals.valueFn({
              restrict: 'C',
              templateUrl: 'template.html'
            }));
          });
          angular.mock.inject(function($compile, $httpBackend) {
            $httpBackend.whenGET('template.html').respond('<p>template.html</p>');

            expect(function() {
              $compile('<div><div class="sync async"></div></div>');
              $httpBackend.flush();
            }).toThrowMinErr('$compile', 'multidir',
                'Multiple directives [async, sync] asking for template on: ' +
                '<div class="sync async">');
          });
        });


        test('should copy classes from pre-template node into linked element', () => {
          angular.mock.module(function() {
            directive('test', ngInternals.valueFn({
              templateUrl: 'test.html',
              replace: true
            }));
          });
          angular.mock.inject(function($compile, $templateCache, $rootScope) {
            var child;
            $templateCache.put('test.html', '<p class="template-class">Hello</p>');
            element = $compile('<div test></div>')($rootScope, function(node) {
              node.addClass('clonefn-class');
            });
            $rootScope.$digest();
            expect(element).toHaveClass('template-class');
            expect(element).toHaveClass('clonefn-class');
          });
        });


        describe('delay compile / linking functions until after template is resolved', () => {
          var template;
          beforeEach(angular.mock.module(function() {
            function logDirective(name, priority, options) {
              directive(name, function(log) {
                return angular.extend({
                  priority: priority,
                  compile() {
                    log(name + '-C');
                    return {
                      pre() { log(name + '-PreL'); },
                      post() { log(name + '-PostL'); }
                    };
                  }
                }, options || {});
              });
            }

            logDirective('first', 10);
            logDirective('second', 5, { templateUrl: 'second.html' });
            logDirective('third', 3);
            logDirective('last', 0);

            logDirective('iFirst', 10, {replace: true});
            logDirective('iSecond', 5, {replace: true, templateUrl: 'second.html' });
            logDirective('iThird', 3, {replace: true});
            logDirective('iLast', 0, {replace: true});
          }));

          test('should flush after link append', angular.mock.inject(
              function($compile, $rootScope, $httpBackend, log) {
            $httpBackend.expect('GET', 'second.html').respond('<div third>{{1+2}}</div>');
            template = $compile('<div><span first second last></span></div>');
            element = template($rootScope);
            expect(log).toEqual('first-C');

            log('FLUSH');
            $httpBackend.flush();
            $rootScope.$digest();
            expect(log).toEqual(
              'first-C; FLUSH; second-C; last-C; third-C; ' +
              'first-PreL; second-PreL; last-PreL; third-PreL; ' +
              'third-PostL; last-PostL; second-PostL; first-PostL');

            var span = element.find('span');
            expect(span.attr('first')).toEqual('');
            expect(span.attr('second')).toEqual('');
            expect(span.find('div').attr('third')).toEqual('');
            expect(span.attr('last')).toEqual('');

            expect(span.text()).toEqual('3');
          }));


          test('should flush after link inline', angular.mock.inject(
              function($compile, $rootScope, $httpBackend, log) {
            $httpBackend.expect('GET', 'second.html').respond('<div i-third>{{1+2}}</div>');
            template = $compile('<div><span i-first i-second i-last></span></div>');
            element = template($rootScope);
            expect(log).toEqual('iFirst-C');

            log('FLUSH');
            $httpBackend.flush();
            $rootScope.$digest();
            expect(log).toEqual(
              'iFirst-C; FLUSH; iSecond-C; iThird-C; iLast-C; ' +
              'iFirst-PreL; iSecond-PreL; iThird-PreL; iLast-PreL; ' +
              'iLast-PostL; iThird-PostL; iSecond-PostL; iFirst-PostL');

            var div = element.find('div');
            expect(div.attr('i-first')).toEqual('');
            expect(div.attr('i-second')).toEqual('');
            expect(div.attr('i-third')).toEqual('');
            expect(div.attr('i-last')).toEqual('');

            expect(div.text()).toEqual('3');
          }));


          test('should flush before link append', angular.mock.inject(
              function($compile, $rootScope, $httpBackend, log) {
            $httpBackend.expect('GET', 'second.html').respond('<div third>{{1+2}}</div>');
            template = $compile('<div><span first second last></span></div>');
            expect(log).toEqual('first-C');
            log('FLUSH');
            $httpBackend.flush();
            expect(log).toEqual('first-C; FLUSH; second-C; last-C; third-C');

            element = template($rootScope);
            $rootScope.$digest();
            expect(log).toEqual(
              'first-C; FLUSH; second-C; last-C; third-C; ' +
              'first-PreL; second-PreL; last-PreL; third-PreL; ' +
              'third-PostL; last-PostL; second-PostL; first-PostL');

            var span = element.find('span');
            expect(span.attr('first')).toEqual('');
            expect(span.attr('second')).toEqual('');
            expect(span.find('div').attr('third')).toEqual('');
            expect(span.attr('last')).toEqual('');

            expect(span.text()).toEqual('3');
          }));


          test('should flush before link inline', angular.mock.inject(
              function($compile, $rootScope, $httpBackend, log) {
            $httpBackend.expect('GET', 'second.html').respond('<div i-third>{{1+2}}</div>');
            template = $compile('<div><span i-first i-second i-last></span></div>');
            expect(log).toEqual('iFirst-C');
            log('FLUSH');
            $httpBackend.flush();
            expect(log).toEqual('iFirst-C; FLUSH; iSecond-C; iThird-C; iLast-C');

            element = template($rootScope);
            $rootScope.$digest();
            expect(log).toEqual(
              'iFirst-C; FLUSH; iSecond-C; iThird-C; iLast-C; ' +
              'iFirst-PreL; iSecond-PreL; iThird-PreL; iLast-PreL; ' +
              'iLast-PostL; iThird-PostL; iSecond-PostL; iFirst-PostL');

            var div = element.find('div');
            expect(div.attr('i-first')).toEqual('');
            expect(div.attr('i-second')).toEqual('');
            expect(div.attr('i-third')).toEqual('');
            expect(div.attr('i-last')).toEqual('');

            expect(div.text()).toEqual('3');
          }));
        });


        test('should allow multiple elements in template', angular.mock.inject(function($compile, $httpBackend) {
          $httpBackend.expect('GET', 'hello.html').respond('before <b>mid</b> after');
          element = angular.element('<div hello></div>');
          $compile(element);
          $httpBackend.flush();
          expect(element.text()).toEqual('before mid after');
        }));


        test('should work when directive is on the root element', angular.mock.inject(
          function($compile, $httpBackend, $rootScope) {
            $httpBackend.expect('GET', 'hello.html').
                respond('<span>3==<span ng-transclude></span></span>');
            element = angular.element('<b class="hello">{{1+2}}</b>');
            $compile(element)($rootScope);

            $httpBackend.flush();
            expect(element.text()).toEqual('3==3');
          }
        ));


        describe('when directive is in a repeater', () => {
          var is;
           beforeEach(() => {
            is = [1, 2];
          });

          function runTest() {
            angular.mock.inject(function($compile, $httpBackend, $rootScope) {
              $httpBackend.expect('GET', 'hello.html').
                respond('<span>i=<span ng-transclude></span>;</span>');
              element = angular.element('<div><b class=hello ng-repeat="i in [' + is + ']">{{i}}</b></div>');
              $compile(element)($rootScope);

              $httpBackend.flush();
              expect(element.text()).toEqual('i=' + is.join(';i=') + ';');
            });
          }

          test('should work in jqLite and jQuery with jQuery.cleanData last patched by Angular', runTest);

          test('should work with another library patching jqLite/jQuery.cleanData after Angular', () => {
            var cleanedCount = 0;
            var currentCleanData = angular.element.cleanData;
            angular.element.cleanData = function(elems) {
              cleanedCount += elems.length;
              // Don't return the output and explicitly pass only the first parameter
              // so that we're sure we're not relying on either of them. jQuery UI patch
              // behaves in this way.
              currentCleanData(elems);
            };

            runTest();

            // The initial ng-repeat div is dumped after parsing hence we expect cleanData
            // count to be one larger than size of the iterated array.
            expect(cleanedCount).toBe(is.length + 1);

            // Restore the previous cleanData.
            angular.element.cleanData = currentCleanData;
          });
        });

        describe('replace and not exactly one root element', () => {

          beforeEach(angular.mock.module(function() {

            directive('template', function() {
              return {
                replace: true,
                templateUrl: 'template.html'
              };
            });
          }));

          test.each(Object.entries({
              'no root element': 'dada',
              'multiple root elements': '<div></div><div></div>'
            }).map(([prop, value]) => ({ prop, value })))(
              'should throw if: $prop', function({ value: directiveTemplate }) {

              angular.mock.inject(function($templateCache, $rootScope) {
                $templateCache.put('template.html', directiveTemplate);

                expect(function() {
                  compileForTest('<p template></p>');
                  $rootScope.$digest();
                }).toThrowMinErr('$compile', 'tplrt',
                    'Template for directive \'template\' must have exactly one root element. ' +
                    'template.html');
              });
          });

          test.each(Object.entries({
              'whitespace': '  <div>Hello World!</div> \n',
              'comments': '<!-- oh hi --><div>Hello World!</div> \n',
              'comments + whitespace': '  <!-- oh hi -->  <div>Hello World!</div>  <!-- oh hi -->\n'
            }).map(([prop, value]) => ({ prop, value })))(
              'should not throw if the root element is accompanied by: $prop', function({ value: directiveTemplate }) {

              angular.mock.inject(function($compile, $templateCache, $rootScope) {
                $templateCache.put('template.html', directiveTemplate);
                element = $compile('<p template></p>')($rootScope);
                expect(function() {
                  $rootScope.$digest();
                }).not.toThrow();
                expect(element.length).toBe(1);
                expect(element.text()).toBe('Hello World!');
              });
          });
        });

        test('should resume delayed compilation without duplicates when in a repeater', () => {
          // this is a test for a regression
          // scope creation, isolate watcher setup, controller instantiation, etc should happen
          // only once even if we are dealing with delayed compilation of a node due to templateUrl
          // and the template node is in a repeater

          var controllerSpy = jest.fn().mockName('controller');

          angular.mock.module(function($compileProvider) {
            $compileProvider.directive('delayed', ngInternals.valueFn({
              controller: controllerSpy,
              templateUrl: 'delayed.html',
              scope: {
                title: '@'
              }
            }));
          });

          angular.mock.inject(function($templateCache, $compile, $rootScope) {
            $rootScope.coolTitle = 'boom!';
            $templateCache.put('delayed.html', '<div>{{title}}</div>');
            element = $compile(
                '<div><div ng-repeat="i in [1,2]"><div delayed title="{{coolTitle + i}}"></div>|</div></div>'
            )($rootScope);

            $rootScope.$apply();

            expect(controllerSpy).toHaveBeenCalledTimes(2);
            expect(element.text()).toBe('boom!1|boom!2|');
          });
        });


        test('should support templateUrl with replace', () => {
          // a regression https://github.com/angular/angular.js/issues/3792
          angular.mock.module(function($compileProvider) {
            $compileProvider.directive('simple', function() {
              return {
                templateUrl: '/some.html',
                replace: true
              };
            });
          });

          angular.mock.inject(function($templateCache, $rootScope, $compile) {
            $templateCache.put('/some.html',
              '<div ng-switch="i">' +
                '<div ng-switch-when="1">i = 1</div>' +
                '<div ng-switch-default>I dont know what `i` is.</div>' +
              '</div>');

            element = $compile('<div simple></div>')($rootScope);

            $rootScope.$apply(function() {
              $rootScope.i = 1;
            });

            expect(element.html()).toContain('i = 1');
          });
        });

        test('should support templates with root <tr> tags', angular.mock.inject(function($compile, $rootScope, $templateCache) {
          $templateCache.put('tr.html', '<tr><td>TR</td></tr>');
          expect(function() {
            element = $compile('<div replace-with-tr></div>')($rootScope);
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/tr/i);
        }));

        test('should support templates with root <td> tags', angular.mock.inject(function($compile, $rootScope, $templateCache) {
          $templateCache.put('td.html', '<td>TD</td>');
          expect(function() {
            element = $compile('<div replace-with-td></div>')($rootScope);
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/td/i);
        }));

        test('should support templates with root <th> tags', angular.mock.inject(function($compile, $rootScope, $templateCache) {
          $templateCache.put('th.html', '<th>TH</th>');
          expect(function() {
            element = $compile('<div replace-with-th></div>')($rootScope);
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/th/i);
        }));

        test('should support templates with root <thead> tags', angular.mock.inject(function($compile, $rootScope, $templateCache) {
          $templateCache.put('thead.html', '<thead><tr><td>TD</td></tr></thead>');
          expect(function() {
            element = $compile('<div replace-with-thead></div>')($rootScope);
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/thead/i);
        }));

        test('should support templates with root <tbody> tags', angular.mock.inject(function($compile, $rootScope, $templateCache) {
          $templateCache.put('tbody.html', '<tbody><tr><td>TD</td></tr></tbody>');
          expect(function() {
            element = $compile('<div replace-with-tbody></div>')($rootScope);
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/tbody/i);
        }));

        test('should support templates with root <tfoot> tags', angular.mock.inject(function($compile, $rootScope, $templateCache) {
          $templateCache.put('tfoot.html', '<tfoot><tr><td>TD</td></tr></tfoot>');
          expect(function() {
            element = $compile('<div replace-with-tfoot></div>')($rootScope);
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/tfoot/i);
        }));

        test('should support templates with root <option> tags', angular.mock.inject(function($compile, $rootScope, $templateCache) {
          $templateCache.put('option.html', '<option>OPTION</option>');
          expect(function() {
            element = $compile('<div replace-with-option></div>')($rootScope);
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/option/i);
        }));

        test('should support templates with root <optgroup> tags', angular.mock.inject(function($compile, $rootScope, $templateCache) {
          $templateCache.put('optgroup.html', '<optgroup>OPTGROUP</optgroup>');
          expect(function() {
            element = $compile('<div replace-with-optgroup></div>')($rootScope);
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/optgroup/i);
        }));

        test('should support SVG templates using directive.templateNamespace=svg', () => {
          angular.mock.module(function() {
            directive('svgAnchor', ngInternals.valueFn({
              replace: true,
              templateUrl: 'template.html',
              templateNamespace: 'SVG',
              scope: {
                linkurl: '@svgAnchor',
                text: '@?'
              }
            }));
          });
          angular.mock.inject(function($compile, $rootScope, $templateCache) {
            $templateCache.put('template.html', '<a xlink:href="{{linkurl}}">{{text}}</a>');
            element = $compile('<svg><g svg-anchor="/foo/bar" text="foo/bar!"></g></svg>')($rootScope);
            $rootScope.$digest();
            var child = element.children().eq(0);
            expect(ngInternals.nodeName_(child)).toMatch(/a/i);
            expect(isSVGElement(child[0])).toBe(true);
            expect(child[0].href.baseVal).toBe('/foo/bar');
          });
        });

        if (supportsMathML()) {
          // MathML is only natively supported in Firefox at the time of this test's writing,
          // and even there, the browser does not export MathML element constructors globally.
          test('should support MathML templates using directive.templateNamespace=math', () => {
            angular.mock.module(function() {
              directive('pow', ngInternals.valueFn({
                replace: true,
                transclude: true,
                templateUrl: 'template.html',
                templateNamespace: 'math',
                scope: {
                  pow: '@pow'
                },
                link(scope, elm, attr, ctrl, transclude) {
                  transclude(function(node) {
                    elm.prepend(node[0]);
                  });
                }
              }));
            });
            angular.mock.inject(function($compile, $rootScope, $templateCache) {
              $templateCache.put('template.html', '<msup><mn>{{pow}}</mn></msup>');
              element = $compile('<math><mn pow="2"><mn>8</mn></mn></math>')($rootScope);
              $rootScope.$digest();
              var child = element.children().eq(0);
              expect(ngInternals.nodeName_(child)).toMatch(/msup/i);
              expect(isUnknownElement(child[0])).toBe(false);
              expect(isHTMLElement(child[0])).toBe(false);
            });
          });
        }

        test('should keep prototype properties on sync version of async directive', () => {
          angular.mock.module(function() {
            function DirectiveClass() {
              this.restrict = 'E';
              this.templateUrl = 'test.html';
            }

            DirectiveClass.prototype.compile = function() {
              return function(scope, element, attrs) {
                scope.value = 'Test Value';
              };
            };

            directive('templateUrlWithPrototype', ngInternals.valueFn(new DirectiveClass()));
          });

          angular.mock.inject(function($compile, $rootScope, $httpBackend) {
            $httpBackend.whenGET('test.html').
              respond('<p>{{value}}</p>');
            element = $compile('<template-url-with-prototype><template-url-with-prototype>')($rootScope);
            $httpBackend.flush();
            $rootScope.$digest();
            expect(element.find('p')[0].innerHTML).toEqual('Test Value');
          });
        });

      });


      describe('templateUrl as function', () => {

        beforeEach(angular.mock.module(function() {
          directive('myDirective', ngInternals.valueFn({
            replace: true,
            templateUrl($element, $attrs) {
              expect($element.text()).toBe('original content');
              expect($attrs.myDirective).toBe('some value');
              return 'my-directive.html';
            },
            compile($element, $attrs) {
              expect($element.text()).toBe('template content');
              expect($attrs.id).toBe('templateContent');
            }
          }));
        }));


        test('should evaluate `templateUrl` when defined as fn and use returned value as url', angular.mock.inject(
            function($compile, $rootScope, $templateCache) {
          $templateCache.put('my-directive.html', '<div id="templateContent">template content</span>');
          element = $compile('<div my-directive="some value">original content<div>')($rootScope);
          expect(element.text()).toEqual('');

          $rootScope.$digest();

          expect(element.text()).toEqual('template content');
        }));
      });


      describe('scope', () => {
        var iscope;

        beforeEach(angular.mock.module(function() {
          angular.forEach(['', 'a', 'b'], function(name) {
            directive('scope' + angular.$$uppercase(name), function(log) {
              return {
                scope: true,
                restrict: 'CA',
                compile() {
                  return {pre(scope, element) {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  }};
                }
              };
            });
            directive('iscope' + angular.$$uppercase(name), function(log) {
              return {
                scope: {},
                restrict: 'CA',
                compile() {
                  return function(scope, element) {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScopeNoTemplate')).toBe(scope);
                  };
                }
              };
            });
            directive('tscope' + angular.$$uppercase(name), function(log) {
              return {
                scope: true,
                restrict: 'CA',
                templateUrl: 'tscope.html',
                compile() {
                  return function(scope, element) {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  };
                }
              };
            });
            directive('stscope' + angular.$$uppercase(name), function(log) {
              return {
                scope: true,
                restrict: 'CA',
                template: '<span></span>',
                compile() {
                  return function(scope, element) {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  };
                }
              };
            });
            directive('trscope' + angular.$$uppercase(name), function(log) {
              return {
                scope: true,
                replace: true,
                restrict: 'CA',
                templateUrl: 'trscope.html',
                compile() {
                  return function(scope, element) {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  };
                }
              };
            });
            directive('tiscope' + angular.$$uppercase(name), function(log) {
              return {
                scope: {},
                restrict: 'CA',
                templateUrl: 'tiscope.html',
                compile() {
                  return function(scope, element) {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScope')).toBe(scope);
                  };
                }
              };
            });
            directive('stiscope' + angular.$$uppercase(name), function(log) {
              return {
                scope: {},
                restrict: 'CA',
                template: '<span></span>',
                compile() {
                  return function(scope, element) {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScope')).toBe(scope);
                  };
                }
              };
            });
          });
          directive('log', function(log) {
            return {
              restrict: 'CA',
              link: {pre(scope) {
                log('log-' + scope.$id + '-' + (scope.$parent && scope.$parent.$id || 'no-parent'));
              }}
            };
          });
          directive('prototypeMethodNameAsScopeVarA', function() {
            return {
              scope: {
                'constructor': '=?',
                'valueOf': '='
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('prototypeMethodNameAsScopeVarB', function() {
            return {
              scope: {
                'constructor': '@?',
                'valueOf': '@'
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('prototypeMethodNameAsScopeVarC', function() {
            return {
              scope: {
                'constructor': '&?',
                'valueOf': '&'
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('prototypeMethodNameAsScopeVarD', function() {
            return {
              scope: {
                'constructor': '<?',
                'valueOf': '<'
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('watchAsScopeVar', function() {
            return {
              scope: {
                'watch': '='
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
        }));


        test('should allow creation of new scopes', angular.mock.inject(function($rootScope, $compile, log) {
          element = $compile('<div><span scope><a log></a></span></div>')($rootScope);
          expect(log).toEqual('2; log-2-1; LOG');
          expect(element.find('span').hasClass('ng-scope')).toBe(true);
        }));


        test('should allow creation of new isolated scopes for directives', angular.mock.inject(
            function($rootScope, $compile, log) {
          element = $compile('<div><span iscope><a log></a></span></div>')($rootScope);
          expect(log).toEqual('log-1-no-parent; LOG; 2');
          $rootScope.name = 'abc';
          expect(iscope.$parent).toBe($rootScope);
          expect(iscope.name).toBeUndefined();
        }));


        test('should allow creation of new scopes for directives with templates', angular.mock.inject(
            function($rootScope, $compile, log, $httpBackend) {
          $httpBackend.expect('GET', 'tscope.html').respond('<a log>{{name}}; scopeId: {{$id}}</a>');
          element = $compile('<div><span tscope></span></div>')($rootScope);
          $httpBackend.flush();
          expect(log).toEqual('log-2-1; LOG; 2');
          $rootScope.name = 'Jozo';
          $rootScope.$apply();
          expect(element.text()).toBe('Jozo; scopeId: 2');
          expect(element.find('span').scope().$id).toBe(2);
        }));


        test('should allow creation of new scopes for replace directives with templates', angular.mock.inject(
            function($rootScope, $compile, log, $httpBackend) {
          $httpBackend.expect('GET', 'trscope.html').
              respond('<p><a log>{{name}}; scopeId: {{$id}}</a></p>');
          element = $compile('<div><span trscope></span></div>')($rootScope);
          $httpBackend.flush();
          expect(log).toEqual('log-2-1; LOG; 2');
          $rootScope.name = 'Jozo';
          $rootScope.$apply();
          expect(element.text()).toBe('Jozo; scopeId: 2');
          expect(element.find('a').scope().$id).toBe(2);
        }));


        test('should allow creation of new scopes for replace directives with templates in a repeater',
            angular.mock.inject(function($rootScope, $compile, log, $httpBackend) {
          $httpBackend.expect('GET', 'trscope.html').
              respond('<p><a log>{{name}}; scopeId: {{$id}} |</a></p>');
          element = $compile('<div><span ng-repeat="i in [1,2,3]" trscope></span></div>')($rootScope);
          $httpBackend.flush();
          expect(log).toEqual('log-3-2; LOG; 3; log-5-4; LOG; 5; log-7-6; LOG; 7');
          $rootScope.name = 'Jozo';
          $rootScope.$apply();
          expect(element.text()).toBe('Jozo; scopeId: 3 |Jozo; scopeId: 5 |Jozo; scopeId: 7 |');
          expect(element.find('p').scope().$id).toBe(3);
          expect(element.find('a').scope().$id).toBe(3);
        }));


        test('should allow creation of new isolated scopes for directives with templates', angular.mock.inject(
            function($rootScope, $compile, log, $httpBackend) {
          $httpBackend.expect('GET', 'tiscope.html').respond('<a log></a>');
          element = $compile('<div><span tiscope></span></div>')($rootScope);
          $httpBackend.flush();
          expect(log).toEqual('log-2-1; LOG; 2');
          $rootScope.name = 'abc';
          expect(iscope.$parent).toBe($rootScope);
          expect(iscope.name).toBeUndefined();
        }));


        test('should correctly create the scope hierarchy', angular.mock.inject(
          function($rootScope, $compile, log) {
            element = $compile(
                '<div>' + //1
                  '<b class=scope>' + //2
                    '<b class=scope><b class=log></b></b>' + //3
                    '<b class=log></b>' +
                  '</b>' +
                  '<b class=scope>' + //4
                    '<b class=log></b>' +
                  '</b>' +
                '</div>'
              )($rootScope);
            expect(log).toEqual('2; 3; log-3-2; LOG; log-2-1; LOG; 4; log-4-1; LOG');
          })
        );


        test('should allow more than one new scope directives per element, but directives should share' +
            'the scope', angular.mock.inject(
          function($rootScope, $compile, log) {
            element = $compile('<div class="scope-a; scope-b"></div>')($rootScope);
            expect(log).toEqual('2; 2');
          })
        );

        test('should not allow more than one isolate scope creation per element', angular.mock.inject(
          function($rootScope, $compile) {
            expect(function() {
              $compile('<div class="iscope-a; scope-b"></div>');
            }).toThrowMinErr('$compile', 'multidir', 'Multiple directives [iscopeA, scopeB] asking for new/isolated scope on: ' +
                '<div class="iscope-a; scope-b">');
          })
        );

        test('should not allow more than one isolate/new scope creation per element regardless of `templateUrl`',
          angular.mock.inject(function($httpBackend) {
            $httpBackend.expect('GET', 'tiscope.html').respond('<div>Hello, world !</div>');

            expect(function() {
              compile('<div class="tiscope-a; scope-b"></div>');
              $httpBackend.flush();
            }).toThrowMinErr('$compile', 'multidir',
                'Multiple directives [scopeB, tiscopeA] asking for new/isolated scope on: ' +
                '<div class="tiscope-a; scope-b ng-scope">');
          })
        );

        test('should not allow more than one isolate scope creation per element regardless of directive priority', () => {
          angular.mock.module(function($compileProvider) {
            $compileProvider.directive('highPriorityScope', function() {
              return {
                restrict: 'C',
                priority: 1,
                scope: true,
                link() {}
              };
            });
          });
          angular.mock.inject(function($compile) {
            expect(function() {
              $compile('<div class="iscope-a; high-priority-scope"></div>');
            }).toThrowMinErr('$compile', 'multidir', 'Multiple directives [highPriorityScope, iscopeA] asking for new/isolated scope on: ' +
                    '<div class="iscope-a; high-priority-scope">');
          });
        });


        test('should create new scope even at the root of the template', angular.mock.inject(
          function($rootScope, $compile, log) {
            element = $compile('<div scope-a></div>')($rootScope);
            expect(log).toEqual('2');
          })
        );


        test('should create isolate scope even at the root of the template', angular.mock.inject(
          function($rootScope, $compile, log) {
            element = $compile('<div iscope></div>')($rootScope);
            expect(log).toEqual('2');
          })
        );


        describe('scope()/isolate() scope getters', () => {

          describe('with no directives', () => {

            test('should return the scope of the parent node', angular.mock.inject(
              function($rootScope, $compile) {
                element = $compile('<div></div>')($rootScope);
                expect(element.scope()).toBe($rootScope);
              })
            );
          });


          describe('with new scope directives', () => {

            test('should return the new scope at the directive element', angular.mock.inject(
              function($rootScope, $compile) {
                element = $compile('<div scope></div>')($rootScope);
                expect(element.scope().$parent).toBe($rootScope);
              })
            );


            test('should return the new scope for children in the original template', angular.mock.inject(
              function($rootScope, $compile) {
                element = $compile('<div scope><a></a></div>')($rootScope);
                expect(element.find('a').scope().$parent).toBe($rootScope);
              })
            );


            test('should return the new scope for children in the directive template', angular.mock.inject(
              function($rootScope, $compile, $httpBackend) {
                $httpBackend.expect('GET', 'tscope.html').respond('<a></a>');
                element = $compile('<div tscope></div>')($rootScope);
                $httpBackend.flush();
                expect(element.find('a').scope().$parent).toBe($rootScope);
              })
            );

            test('should return the new scope for children in the directive sync template', angular.mock.inject(
              function($rootScope, $compile) {
                element = $compile('<div stscope></div>')($rootScope);
                expect(element.find('span').scope().$parent).toBe($rootScope);
              })
            );
          });


          describe('with isolate scope directives', () => {

            test('should return the root scope for directives at the root element', angular.mock.inject(
              function($rootScope, $compile) {
                element = $compile('<div iscope></div>')($rootScope);
                expect(element.scope()).toBe($rootScope);
              })
            );


            test('should return the non-isolate scope at the directive element', angular.mock.inject(
              function($rootScope, $compile) {
                var directiveElement;
                element = $compile('<div><div iscope></div></div>')($rootScope);
                directiveElement = element.children();
                expect(directiveElement.scope()).toBe($rootScope);
                expect(directiveElement.isolateScope().$parent).toBe($rootScope);
              })
            );


            test('should return the isolate scope for children in the original template', angular.mock.inject(
              function($rootScope, $compile) {
                element = $compile('<div iscope><a></a></div>')($rootScope);
                expect(element.find('a').scope()).toBe($rootScope); //xx
              })
            );


            test('should return the isolate scope for children in directive template', angular.mock.inject(
              function($rootScope, $compile, $httpBackend) {
                $httpBackend.expect('GET', 'tiscope.html').respond('<a></a>');
                element = $compile('<div tiscope></div>')($rootScope);
                expect(element.isolateScope()).toBeUndefined(); // this is the current behavior, not desired feature
                $httpBackend.flush();
                expect(element.find('a').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe($rootScope);
              })
            );

            test('should return the isolate scope for children in directive sync template', angular.mock.inject(
              function($rootScope, $compile) {
                element = $compile('<div stiscope></div>')($rootScope);
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe($rootScope);
              })
            );

            test('should handle "=" bindings with same method names in Object.prototype correctly when not present', angular.mock.inject(
              function($rootScope, $compile) {
                var func = function() {
                  element = $compile(
                    '<div prototype-method-name-as-scope-var-a></div>'
                  )($rootScope);
                };

                expect(func).not.toThrow();
                var scope = element.isolateScope();
                expect(element.find('span').scope()).toBe(scope);
                expect(scope).not.toBe($rootScope);

                // Not shadowed because optional
                expect(scope.constructor).toBe($rootScope.constructor);
                expect(scope.hasOwnProperty('constructor')).toBe(false);

                // Shadowed with undefined because not optional
                expect(scope.valueOf).toBeUndefined();
                expect(scope.hasOwnProperty('valueOf')).toBe(true);
              })
            );

            test('should handle "=" bindings with same method names in Object.prototype correctly when present', angular.mock.inject(
                function($rootScope, $compile) {
                  $rootScope.constructor = 'constructor';
                  $rootScope.valueOf = 'valueOf';
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-a constructor="constructor" value-of="valueOf"></div>'
                    )($rootScope);
                  };

                  expect(func).not.toThrow();
                  var scope = element.isolateScope();
                  expect(element.find('span').scope()).toBe(scope);
                  expect(scope).not.toBe($rootScope);
                  expect(scope.constructor).toBe('constructor');
                  expect(scope.hasOwnProperty('constructor')).toBe(true);
                  expect(scope.valueOf).toBe('valueOf');
                  expect(scope.hasOwnProperty('valueOf')).toBe(true);
                })
            );

            test('should throw an error for undefined non-optional "=" bindings when ' +
               'strictComponentBindingsEnabled is true', function() {
              window.disableCacheLeakCheck = true;
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function() {
                  var func = function() {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-a></div>'
                    );
                  };
                  expect(func).toThrowMinErr('$compile',
                    'missingattr',
                    'Attribute \'valueOf\' of \'prototypeMethodNameAs' +
                    'ScopeVarA\' is non-optional and must be set!');
                });
            });

            test('should not throw an error for set non-optional "=" bindings when ' +
              'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-a constructor="constructor" value-of="valueOf"></div>'
                    )($rootScope);
                  };
                  expect(func).not.toThrow();
                });
            });

            test('should not throw an error for undefined optional "=" bindings when ' +
               'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-a value-of="valueOf"></div>'
                    )($rootScope);
                  };
                  expect(func).not.toThrow();
                });
            });

            test('should handle "@" bindings with same method names in Object.prototype correctly when not present', angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile('<div prototype-method-name-as-scope-var-b></div>')($rootScope);
                  };

                  expect(func).not.toThrow();
                  var scope = element.isolateScope();
                  expect(element.find('span').scope()).toBe(scope);
                  expect(scope).not.toBe($rootScope);

                  // Does not shadow value because optional
                  expect(scope.constructor).toBe($rootScope.constructor);
                  expect(scope.hasOwnProperty('constructor')).toBe(false);

                  // Shadows value because not optional
                  expect(scope.valueOf).toBeUndefined();
                  expect(scope.hasOwnProperty('valueOf')).toBe(true);
                })
            );

            test('should handle "@" bindings with same method names in Object.prototype correctly when present', angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-b constructor="constructor" value-of="valueOf"></div>'
                    )($rootScope);
                  };

                  expect(func).not.toThrow();
                  expect(element.find('span').scope()).toBe(element.isolateScope());
                  expect(element.isolateScope()).not.toBe($rootScope);
                  expect(element.isolateScope()['constructor']).toBe('constructor');
                  expect(element.isolateScope()['valueOf']).toBe('valueOf');
                })
            );

            test('should throw an error for undefined non-optional "@" bindings when ' +
               'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function() {
                  var func = function() {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-b></div>'
                    );
                  };
                  expect(func).toThrowMinErr('$compile',
                    'missingattr',
                    'Attribute \'valueOf\' of \'prototypeMethodNameAs' +
                    'ScopeVarB\' is non-optional and must be set!');
                });
            });

            test('should not throw an error for set non-optional "@" bindings when ' +
              'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-b constructor="constructor" value-of="valueOf"></div>'
                    )($rootScope);
                  };
                  expect(func).not.toThrow();
                });
            });

            test('should not throw an error for undefined optional "@" bindings when ' +
              'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-b value-of="valueOf"></div>'
                    )($rootScope);
                  };
                  expect(func).not.toThrow();
                });
            });

            test('should handle "&" bindings with same method names in Object.prototype correctly when not present', angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile('<div prototype-method-name-as-scope-var-c></div>')($rootScope);
                  };

                  expect(func).not.toThrow();
                  expect(element.find('span').scope()).toBe(element.isolateScope());
                  expect(element.isolateScope()).not.toBe($rootScope);
                  expect(element.isolateScope()['constructor']).toBe($rootScope.constructor);
                  expect(element.isolateScope()['valueOf']()).toBeUndefined();
                })
            );

            test('should handle "&" bindings with same method names in Object.prototype correctly when present', angular.mock.inject(
                function($rootScope, $compile) {
                  $rootScope.constructor = function() { return 'constructor'; };
                  $rootScope.valueOf = function() { return 'valueOf'; };
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-c constructor="constructor()" value-of="valueOf()"></div>'
                    )($rootScope);
                  };

                  expect(func).not.toThrow();
                  expect(element.find('span').scope()).toBe(element.isolateScope());
                  expect(element.isolateScope()).not.toBe($rootScope);
                  expect(element.isolateScope()['constructor']()).toBe('constructor');
                  expect(element.isolateScope()['valueOf']()).toBe('valueOf');
                })
            );

            test('should throw an error for undefined non-optional "&" bindings when ' +
               'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function() {
                  var func = function() {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-c></div>'
                    );
                  };
                  expect(func).toThrowMinErr('$compile',
                                             'missingattr',
                                             'Attribute \'valueOf\' of \'prototypeMethodNameAs' +
                                             'ScopeVarC\' is non-optional and must be set!');
                });
            });

            test('should not throw an error for set non-optional "&" bindings when ' +
              'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-c constructor="constructor" value-of="valueOf"></div>'
                    )($rootScope);
                  };
                  expect(func).not.toThrow();
                });
            });

            test('should not throw an error for undefined optional "&" bindings when ' +
              'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-c value-of="valueOf"></div>'
                    )($rootScope);
                  };
                  expect(func).not.toThrow();
                });
            });

            test('should throw an error for undefined non-optional "<" bindings when ' +
               'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function() {
                  var func = function() {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-d></div>'
                    );
                  };
                  expect(func).toThrowMinErr('$compile',
                                             'missingattr',
                                             'Attribute \'valueOf\' of \'prototypeMethodNameAs' +
                                             'ScopeVarD\' is non-optional and must be set!');
                });
            });

            test('should not throw an error for set non-optional "<" bindings when ' +
              'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-d constructor="constructor" value-of="valueOf"></div>'
                    )($rootScope);
                  };
                  expect(func).not.toThrow();
                });
            });

            test('should not throw an error for undefined optional "<" bindings when ' +
              'strictComponentBindingsEnabled is true', function() {
              angular.mock.module(function($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function($rootScope, $compile) {
                  var func = function() {
                    element = $compile(
                      '<div prototype-method-name-as-scope-var-d value-of="valueOf"></div>'
                    )($rootScope);
                  };
                  expect(func).not.toThrow();
                });
            });

            test('should not throw exception when using "watch" as binding in Firefox', angular.mock.inject(
                function($rootScope, $compile) {
                  $rootScope.watch = 'watch';
                  var func = function() {
                    element = $compile(
                      '<div watch-as-scope-var watch="watch"></div>'
                    )($rootScope);
                  };

                  expect(func).not.toThrow();
                  expect(element.find('span').scope()).toBe(element.isolateScope());
                  expect(element.isolateScope()).not.toBe($rootScope);
                  expect(element.isolateScope()['watch']).toBe('watch');
                })
            );

            test('should handle @ bindings on BOOLEAN attributes', () => {
              var checkedVal;
              angular.mock.module(function($compileProvider) {
                $compileProvider.directive('test', function() {
                  return {
                    scope: { checked: '@' },
                    link(scope, element, attrs) {
                      checkedVal = scope.checked;
                    }
                  };
                });
              });
              angular.mock.inject(function() {
                compileForTest('<input test checked="checked">');
                expect(checkedVal).toEqual(true);
              });
            });

            test('should handle updates to @ bindings on BOOLEAN attributes', () => {
              var componentScope;
              angular.mock.module(function($compileProvider) {
                $compileProvider.directive('test', function() {
                  return {
                    scope: {checked: '@'},
                    link(scope, element, attrs) {
                      componentScope = scope;
                      attrs.$set('checked', true);
                    }
                  };
                });
              });
              angular.mock.inject(function() {
                compileForTest('<test></test>');
                expect(componentScope.checked).toBe(true);
              });
            });
          });


          describe('with isolate scope directives and directives that manually create a new scope', () => {

            test('should return the new scope at the directive element', angular.mock.inject(
              function($rootScope, $compile) {
                var directiveElement;
                element = $compile('<div><a ng-if="true" iscope></a></div>')($rootScope);
                $rootScope.$apply();
                directiveElement = element.find('a');
                expect(directiveElement.scope().$parent).toBe($rootScope);
                expect(directiveElement.scope()).not.toBe(directiveElement.isolateScope());
              })
            );


            test('should return the isolate scope for child elements', angular.mock.inject(
              function($rootScope, $compile, $httpBackend) {
                var directiveElement;
                var child;
                $httpBackend.expect('GET', 'tiscope.html').respond('<span></span>');
                element = $compile('<div><a ng-if="true" tiscope></a></div>')($rootScope);
                $rootScope.$apply();
                $httpBackend.flush();
                directiveElement = element.find('a');
                child = directiveElement.find('span');
                expect(child.scope()).toBe(directiveElement.isolateScope());
              })
            );

            test('should return the isolate scope for child elements in directive sync template', angular.mock.inject(
              function($rootScope, $compile) {
                var directiveElement;
                var child;
                element = $compile('<div><a ng-if="true" stiscope></a></div>')($rootScope);
                $rootScope.$apply();
                directiveElement = element.find('a');
                child = directiveElement.find('span');
                expect(child.scope()).toBe(directiveElement.isolateScope());
              })
            );
          });
        });

        describe('multidir isolated scope error messages', () => {
          angular.module('fakeIsoledScopeModule', [])
            .directive('fakeScope', function(log) {
              return {
                scope: true,
                restrict: 'CA',
                compile() {
                  return {pre(scope, element) {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  }};
                }
              };
            })
            .directive('fakeIScope', function(log) {
              return {
                scope: {},
                restrict: 'CA',
                compile() {
                  return function(scope, element) {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScopeNoTemplate')).toBe(scope);
                  };
                }
              };
            });

          beforeEach(angular.mock.module('fakeIsoledScopeModule', function() {
            directive('anonymModuleScopeDirective', function(log) {
              return {
                scope: true,
                restrict: 'CA',
                compile() {
                  return {pre(scope, element) {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  }};
                }
              };
            });
          }));

          test('should add module name to multidir isolated scope message if directive defined through module', angular.mock.inject(
              function($rootScope, $compile) {
                expect(function() {
                  $compile('<div class="fake-scope; fake-i-scope"></div>');
                }).toThrowMinErr('$compile', 'multidir',
                  'Multiple directives [fakeIScope (module: fakeIsoledScopeModule), fakeScope (module: fakeIsoledScopeModule)] ' +
                  'asking for new/isolated scope on: <div class="fake-scope; fake-i-scope">');
              })
          );

          test('shouldn\'t add module name to multidir isolated scope message if directive is defined directly with $compileProvider', angular.mock.inject(
            function($rootScope, $compile) {
              expect(function() {
                $compile('<div class="anonym-module-scope-directive; fake-i-scope"></div>');
              }).toThrowMinErr('$compile', 'multidir',
                'Multiple directives [anonymModuleScopeDirective, fakeIScope (module: fakeIsoledScopeModule)] ' +
                'asking for new/isolated scope on: <div class="anonym-module-scope-directive; fake-i-scope">');
            })
          );
        });
      });
    });
  });


  describe('interpolation', () => {
    var observeSpy;
    var directiveAttrs;
    var deregisterObserver;

    beforeEach(angular.mock.module(function() {
      directive('observer', function() {
        return function(scope, elm, attr) {
          directiveAttrs = attr;
          observeSpy = jest.fn().mockName('$observe attr');
          deregisterObserver = attr.$observe('someAttr', observeSpy);
        };
      });
      directive('replaceSomeAttr', ngInternals.valueFn({
        compile(element, attr) {
          attr.$set('someAttr', 'bar-{{1+1}}');
          expect(element).toBe(attr.$$element);
        }
      }));
    }));


    test('should compile and link both attribute and text bindings', angular.mock.inject(
        function($rootScope, $compile) {
          $rootScope.name = 'angular';
          element = $compile('<div name="attr: {{name}}">text: {{name}}</div>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('text: angular');
          expect(element.attr('name')).toEqual('attr: angular');
        })
    );


    test('should one-time bind if the expression starts with two colons', angular.mock.inject(
        function($rootScope, $compile) {
          $rootScope.name = 'angular';
          element = $compile('<div name="attr: {{::name}}">text: {{::name}}</div>')($rootScope);
          expect($rootScope.$$watchers.length).toBe(2);
          $rootScope.$digest();
          expect(element.text()).toEqual('text: angular');
          expect(element.attr('name')).toEqual('attr: angular');
          expect($rootScope.$$watchers.length).toBe(0);
          $rootScope.name = 'not-angular';
          $rootScope.$digest();
          expect(element.text()).toEqual('text: angular');
          expect(element.attr('name')).toEqual('attr: angular');
        })
    );

    test('should one-time bind if the expression starts with a space and two colons', angular.mock.inject(
        function($rootScope, $compile) {
          $rootScope.name = 'angular';
          element = $compile('<div name="attr: {{::name}}">text: {{ ::name }}</div>')($rootScope);
          expect($rootScope.$$watchers.length).toBe(2);
          $rootScope.$digest();
          expect(element.text()).toEqual('text: angular');
          expect(element.attr('name')).toEqual('attr: angular');
          expect($rootScope.$$watchers.length).toBe(0);
          $rootScope.name = 'not-angular';
          $rootScope.$digest();
          expect(element.text()).toEqual('text: angular');
          expect(element.attr('name')).toEqual('attr: angular');
        })
    );

    test('should interpolate a multi-part expression for regular attributes', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<div foo="some/{{id}}"></div>')($rootScope);
      $rootScope.$digest();
      expect(element.attr('foo')).toBe('some/');
      $rootScope.$apply(function() {
        $rootScope.id = 1;
      });
      expect(element.attr('foo')).toEqual('some/1');
    }));

    test('should process attribute interpolation in pre-linking phase at priority 100', () => {
      angular.mock.module(function() {
        directive('attrLog', function(log) {
          return {
            compile($element, $attrs) {
              log('compile=' + $attrs.myName);

              return {
                pre($scope, $element, $attrs) {
                  log('preLinkP0=' + $attrs.myName);
                },
                post($scope, $element, $attrs) {
                  log('postLink=' + $attrs.myName);
                }
              };
            }
          };
        });
      });
      angular.mock.module(function() {
        directive('attrLogHighPriority', function(log) {
          return {
            priority: 101,
            compile() {
              return {
                pre($scope, $element, $attrs) {
                  log('preLinkP101=' + $attrs.myName);
                }
              };
            }
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile, log) {
        element = $compile('<div attr-log-high-priority attr-log my-name="{{name}}"></div>')($rootScope);
        $rootScope.name = 'angular';
        $rootScope.$apply();
        log('digest=' + element.attr('my-name'));
        expect(log).toEqual('compile={{name}}; preLinkP101={{name}}; preLinkP0=; postLink=; digest=angular');
      });
    });

    test('should allow the attribute to be removed before the attribute interpolation', () => {
       angular.mock.module(function() {
         directive('removeAttr', function() {
           return {
             restrict:'A',
             compile(tElement, tAttr) {
               tAttr.$set('removeAttr', null);
             }
           };
         });
       });
       angular.mock.inject(function($rootScope, $compile) {
         expect(function() {
           element = $compile('<div remove-attr="{{ toBeRemoved }}"></div>')($rootScope);
         }).not.toThrow();
         expect(element.attr('remove-attr')).toBeUndefined();
       });
     });

    describe('SCE values', () => {
      test('should resolve compile and link both attribute and text bindings', angular.mock.inject(
          function($rootScope, $compile, $sce) {
            $rootScope.name = $sce.trustAsHtml('angular');
            element = $compile('<div name="attr: {{name}}">text: {{name}}</div>')($rootScope);
            $rootScope.$digest();
            expect(element.text()).toEqual('text: angular');
            expect(element.attr('name')).toEqual('attr: angular');
          }));
    });

    describe('decorating with binding info', () => {

      test('should not occur if `debugInfoEnabled` is false', () => {
        angular.mock.module(function($compileProvider) {
          $compileProvider.debugInfoEnabled(false);
        });

        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div>{{1+2}}</div>')($rootScope);
          expect(element.hasClass('ng-binding')).toBe(false);
          expect(element.data('$binding')).toBeUndefined();
        });
      });


      test('should occur if `debugInfoEnabled` is true', () => {
        angular.mock.module(function($compileProvider) {
          $compileProvider.debugInfoEnabled(true);
        });

        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div>{{1+2}}</div>')($rootScope);
          expect(element.hasClass('ng-binding')).toBe(true);
          expect(element.data('$binding')).toEqual(['1+2']);
        });
      });
    });

    test('should observe interpolated attrs', angular.mock.inject(function($rootScope, $compile) {
      $compile('<div some-attr="{{value}}" observer></div>')($rootScope);

      // should be async
      expect(observeSpy).not.toHaveBeenCalled();

      $rootScope.$apply(function() {
        $rootScope.value = 'bound-value';
      });
      expect(observeSpy).toHaveBeenCalledOnceWith('bound-value');
    }));


    test('should return a deregistration function while observing an attribute', angular.mock.inject(function($rootScope, $compile) {
      $compile('<div some-attr="{{value}}" observer></div>')($rootScope);

      $rootScope.$apply('value = "first-value"');
      expect(observeSpy).toHaveBeenCalledWith('first-value');

      deregisterObserver();
      $rootScope.$apply('value = "new-value"');
      expect(observeSpy).not.toHaveBeenCalledWith('new-value');
    }));


    test('should set interpolated attrs to initial interpolation value', angular.mock.inject(function($rootScope, $compile) {
      // we need the interpolated attributes to be initialized so that linking fn in a component
      // can access the value during link
      $rootScope.whatever = 'test value';
      $compile('<div some-attr="{{whatever}}" observer></div>')($rootScope);
      expect(directiveAttrs.someAttr).toBe($rootScope.whatever);
    }));


    test('should allow directive to replace interpolated attributes before attr interpolation compilation', angular.mock.inject(
        function($compile, $rootScope) {
      element = $compile('<div some-attr="foo-{{1+1}}" replace-some-attr></div>')($rootScope);
      $rootScope.$digest();
      expect(element.attr('some-attr')).toEqual('bar-2');
    }));


    test('should call observer of non-interpolated attr through $evalAsync',
      angular.mock.inject(function($rootScope, $compile) {
        $compile('<div some-attr="nonBound" observer></div>')($rootScope);
        expect(directiveAttrs.someAttr).toBe('nonBound');

        expect(observeSpy).not.toHaveBeenCalled();
        $rootScope.$digest();
        expect(observeSpy).toHaveBeenCalled();
      })
    );

    test('should support non-interpolated `src` and `data-src` on the same element',
      angular.mock.inject(function($rootScope, $compile) {
        var element = $compile('<img src="abc" data-src="123">')($rootScope);
        expect(element.attr('src')).toEqual('abc');
        expect(element.attr('data-src')).toEqual('123');
        $rootScope.$digest();
        expect(element.attr('src')).toEqual('abc');
        expect(element.attr('data-src')).toEqual('123');
    }));

    test('should call observer only when the attribute value changes', () => {
      angular.mock.module(function() {
        directive('observingDirective', function() {
          return {
            restrict: 'E',
            scope: { someAttr: '@' }
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        $compile('<observing-directive observer></observing-directive>')($rootScope);
        $rootScope.$digest();
        expect(observeSpy).not.toHaveBeenCalledWith(undefined);
      });
    });


    test('should delegate exceptions to $exceptionHandler', () => {
      observeSpy = jest.fn().mockName('$observe attr').mockImplementation(() => { throw new Error('ERROR'); });

      angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
        directive('error', function() {
          return function(scope, elm, attr) {
            attr.$observe('someAttr', observeSpy);
            attr.$observe('someAttr', observeSpy);
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope, $exceptionHandler) {
        $compile('<div some-attr="{{value}}" error></div>')($rootScope);
        $rootScope.$digest();

        expect(observeSpy).toHaveBeenCalled();
        expect(observeSpy).toHaveBeenCalledTimes(2);
        expect($exceptionHandler.errors).toEqual([new Error('ERROR'), new Error('ERROR')]);
      });
    });


    test('should translate {{}} in terminal nodes', angular.mock.inject(function($rootScope, $compile) {
      element = $compile('<select ng:model="x"><option value="">Greet {{name}}!</option></select>')($rootScope);
      $rootScope.$digest();
      expect(sortedHtml(element).replace(' selected="selected"', '')).
        toEqual('<select ng:model="x">' +
                  '<option value="">Greet !</option>' +
                '</select>');
      $rootScope.name = 'Misko';
      $rootScope.$digest();
      expect(sortedHtml(element).replace(' selected="selected"', '')).
        toEqual('<select ng:model="x">' +
                  '<option value="">Greet Misko!</option>' +
                '</select>');
    }));


    test('should handle consecutive text elements as a single text element', angular.mock.inject(function($rootScope, $compile) {
      // No point it running the test, if there is no MutationObserver
      if (!window.MutationObserver) return;

      // Create and register the MutationObserver
      var observer = new window.MutationObserver(angular.noop);
      observer.observe(document.body, {childList: true, subtree: true});

      // Run the actual test
      var base = angular.element('<div>&mdash; {{ "This doesn\'t." }}</div>');
      element = $compile(base)($rootScope);
      $rootScope.$digest();
      expect(element.text()).toBe('— This doesn\'t.');

      // Unregister the MutationObserver (and hope it doesn't mess up with subsequent tests)
      observer.disconnect();
    }));


    test('should not process text nodes merged into their sibling', angular.mock.inject(function($compile, $rootScope) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode('1{{ value }}'));
      div.appendChild(document.createTextNode('2{{ value }}'));
      div.appendChild(document.createTextNode('3{{ value }}'));

      element = angular.element(div.childNodes);

      var initialWatcherCount = $rootScope.$countWatchers();
      $compile(element)($rootScope);
      $rootScope.$apply('value = 0');
      var newWatcherCount = $rootScope.$countWatchers() - initialWatcherCount;

      expect(element.text()).toBe('102030');
      expect(newWatcherCount).toBe(3);

      dealoc(div);
    }));


    test('should support custom start/end interpolation symbols in template and directive template',
        function() {
      angular.mock.module(function($interpolateProvider, $compileProvider) {
        $interpolateProvider.startSymbol('##').endSymbol(']]');
        $compileProvider.directive('myDirective', function() {
          return {
            template: '<span>{{hello}}|{{hello|uppercase}}</span>'
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div>##hello|uppercase]]|<div my-directive></div></div>')($rootScope);
        $rootScope.hello = 'ahoj';
        $rootScope.$digest();
        expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
      });
    });


    test('should support custom start interpolation symbol, even when `endSymbol` doesn\'t change',
      function() {
        angular.mock.module(function($compileProvider, $interpolateProvider) {
          $interpolateProvider.startSymbol('[[');
          $compileProvider.directive('myDirective', function() {
            return {
              template: '<span>{{ hello }}|{{ hello | uppercase }}</span>'
            };
          });
        });

        angular.mock.inject(function($compile, $rootScope) {
          var tmpl = '<div>[[ hello | uppercase }}|<div my-directive></div></div>';
          element = $compile(tmpl)($rootScope);

          $rootScope.hello = 'ahoj';
          $rootScope.$digest();

          expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
        });
      }
    );


    test('should support custom end interpolation symbol, even when `startSymbol` doesn\'t change',
      function() {
        angular.mock.module(function($compileProvider, $interpolateProvider) {
          $interpolateProvider.endSymbol(']]');
          $compileProvider.directive('myDirective', function() {
            return {
              template: '<span>{{ hello }}|{{ hello | uppercase }}</span>'
            };
          });
        });

        angular.mock.inject(function($compile, $rootScope) {
          var tmpl = '<div>{{ hello | uppercase ]]|<div my-directive></div></div>';
          element = $compile(tmpl)($rootScope);

          $rootScope.hello = 'ahoj';
          $rootScope.$digest();

          expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
        });
      }
    );


    test('should support custom start/end interpolation symbols in async directive template',
        function() {
      angular.mock.module(function($interpolateProvider, $compileProvider) {
        $interpolateProvider.startSymbol('##').endSymbol(']]');
        $compileProvider.directive('myDirective', function() {
          return {
            templateUrl: 'myDirective.html'
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('myDirective.html', '<span>{{hello}}|{{hello|uppercase}}</span>');
        element = $compile('<div>##hello|uppercase]]|<div my-directive></div></div>')($rootScope);
        $rootScope.hello = 'ahoj';
        $rootScope.$digest();
        expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
      });
    });


    test('should make attributes observable for terminal directives', () => {
      angular.mock.module(function() {
        directive('myAttr', function(log) {
          return {
            terminal: true,
            link(scope, element, attrs) {
              attrs.$observe('myAttr', function(val) {
                log(val);
              });
            }
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope, log) {
        element = $compile('<div my-attr="{{myVal}}"></div>')($rootScope);
        expect(log).toEqual([]);

        $rootScope.myVal = 'carrot';
        $rootScope.$digest();

        expect(log).toEqual(['carrot']);
      });
    });
  });

  describe('collector', () => {

    var collected;
    beforeEach(angular.mock.module(function($compileProvider) {
      collected = false;
      $compileProvider.directive('testCollect', function() {
        return {
          restrict: 'EACM',
          link() {
            collected = true;
          }
        };
      });
    }));

    test('should collect comment directives by default', angular.mock.inject(function() {
      var html = '<!-- directive: test-collect -->';
      element = $compile('<div>' + html + '</div>')($rootScope);
      expect(collected).toBe(true);
    }));

    test('should collect css class directives by default', angular.mock.inject(function() {
      element = $compile('<div class="test-collect"></div>')($rootScope);
      expect(collected).toBe(true);
    }));

    angular.forEach([
      {commentEnabled: true, cssEnabled: true},
      {commentEnabled: true, cssEnabled: false},
      {commentEnabled: false, cssEnabled: true},
      {commentEnabled: false, cssEnabled: false}
    ], function(config) {
      describe('commentDirectivesEnabled(' + config.commentEnabled + ') ' +
               'cssClassDirectivesEnabled(' + config.cssEnabled + ')', function() {
        beforeEach(angular.mock.module(function($compileProvider) {
          $compileProvider.commentDirectivesEnabled(config.commentEnabled);
          $compileProvider.cssClassDirectivesEnabled(config.cssEnabled);
        }));

        var $compile;
        var $rootScope;
        beforeEach(angular.mock.inject(function(_$compile_,_$rootScope_) {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
        }));

        test('should handle comment directives appropriately', () => {
          var html = '<!-- directive: test-collect -->';
          element = $compile('<div>' + html + '</div>')($rootScope);
          expect(collected).toBe(config.commentEnabled);
        });

        test('should handle css directives appropriately', () => {
          element = $compile('<div class="test-collect"></div>')($rootScope);
          expect(collected).toBe(config.cssEnabled);
        });

        test('should not prevent to compile entity directives', () => {
          element = $compile('<test-collect></test-collect>')($rootScope);
          expect(collected).toBe(true);
        });

        test('should not prevent to compile attribute directives', () => {
          element = $compile('<span test-collect></span>')($rootScope);
          expect(collected).toBe(true);
        });

        test('should not prevent to compile interpolated expressions', () => {
          element = $compile('<span>{{"text "+"interpolated"}}</span>')($rootScope);
          $rootScope.$apply();
          expect(element.text()).toBe('text interpolated');
        });

        test('should interpolate expressions inside class attribute', () => {
          $rootScope.interpolateMe = 'interpolated';
          var html = '<div class="{{interpolateMe}}"></div>';
          element = $compile(html)($rootScope);
          $rootScope.$apply();
          expect(element).toHaveClass('interpolated');
        });
      });
    });

    test('should configure comment directives true by default',
      angular.mock.module(function($compileProvider) {
        var commentDirectivesEnabled = $compileProvider.commentDirectivesEnabled();
        expect(commentDirectivesEnabled).toBe(true);
      })
    );

    test('should return self when setting commentDirectivesEnabled',
      angular.mock.module(function($compileProvider) {
        var self = $compileProvider.commentDirectivesEnabled(true);
        expect(self).toBe($compileProvider);
      })
    );

    test('should cache commentDirectivesEnabled value when configure ends', () => {
      var $compileProvider;
      angular.mock.module(function(_$compileProvider_) {
        $compileProvider = _$compileProvider_;
        $compileProvider.commentDirectivesEnabled(false);
      });

      angular.mock.inject(function($compile, $rootScope) {
        $compileProvider.commentDirectivesEnabled(true);
        var html = '<!-- directive: test-collect -->';
        element = $compile('<div>' + html + '</div>')($rootScope);
        expect(collected).toBe(false);
      });
    });

    test('should configure css class directives true by default',
      angular.mock.module(function($compileProvider) {
        var cssClassDirectivesEnabled = $compileProvider.cssClassDirectivesEnabled();
        expect(cssClassDirectivesEnabled).toBe(true);
      })
    );

    test('should return self when setting cssClassDirectivesEnabled',
      angular.mock.module(function($compileProvider) {
        var self = $compileProvider.cssClassDirectivesEnabled(true);
        expect(self).toBe($compileProvider);
      })
    );

    test('should cache cssClassDirectivesEnabled value when configure ends', () => {
      var $compileProvider;
      angular.mock.module(function(_$compileProvider_) {
        $compileProvider = _$compileProvider_;
        $compileProvider.cssClassDirectivesEnabled(false);
      });

      angular.mock.inject(function($compile, $rootScope) {
        $compileProvider.cssClassDirectivesEnabled(true);
        element = $compile('<div class="test-collect"></div>')($rootScope);
        expect(collected).toBe(false);
      });
    });
  });

  describe('link phase', () => {

    beforeEach(angular.mock.module(function() {

      angular.forEach(['a', 'b', 'c'], function(name) {
        directive(name, function(log) {
          return {
            restrict: 'ECA',
            compile() {
              log('t' + angular.$$uppercase(name));
              return {
                pre() {
                  log('pre' + angular.$$uppercase(name));
                },
                post: function linkFn() {
                  log('post' + angular.$$uppercase(name));
                }
              };
            }
          };
        });
      });
    }));


    test('should not store linkingFns for noop branches', angular.mock.inject(function($rootScope, $compile) {
      element = angular.element('<div name="{{a}}"><span>ignore</span></div>');
      var linkingFn = $compile(element);
      // Now prune the branches with no directives
      element.find('span').remove();
      expect(element.find('span').length).toBe(0);
      // and we should still be able to compile without errors
      linkingFn($rootScope);
    }));


    test('should compile from top to bottom but link from bottom up', angular.mock.inject(
        function($compile, $rootScope, log) {
          element = $compile('<a b><c></c></a>')($rootScope);
          expect(log).toEqual('tA; tB; tC; preA; preB; preC; postC; postB; postA');
        }
    ));


    test('should support link function on directive object', () => {
      angular.mock.module(function() {
        directive('abc', ngInternals.valueFn({
          link(scope, element, attrs) {
            element.text(attrs.abc);
          }
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div abc="WORKS">FAIL</div>')($rootScope);
        expect(element.text()).toEqual('WORKS');
      });
    });

    test('should support $observe inside link function on directive object', () => {
      angular.mock.module(function() {
        directive('testLink', ngInternals.valueFn({
          templateUrl: 'test-link.html',
          link(scope, element, attrs) {
            attrs.$observe('testLink', function(val) {
              scope.testAttr = val;
            });
          }
        }));
      });
      angular.mock.inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('test-link.html', '{{testAttr}}');
        element = $compile('<div test-link="{{1+2}}"></div>')($rootScope);
        $rootScope.$apply();
        expect(element.text()).toBe('3');
      });
    });

    test('should throw multilink error when linking the same element more then once', () => {
      var linker = $compile('<div>');
      linker($rootScope).remove();
      expect(function() {
        linker($rootScope);
      }).toThrowMinErr('$compile', 'multilink', 'This element has already been linked.');
    });
  });


  describe('attrs', () => {

    test('should allow setting of attributes', () => {
      angular.mock.module(function() {
        directive({
          setter: ngInternals.valueFn(function(scope, element, attr) {
            attr.$set('name', 'abc');
            attr.$set('disabled', true);
            expect(attr.name).toBe('abc');
            expect(attr.disabled).toBe(true);
          })
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div setter></div>')($rootScope);
        expect(element.attr('name')).toEqual('abc');
        expect(element.attr('disabled')).toEqual('disabled');
      });
    });


    test('should read boolean attributes as boolean only on control elements', () => {
      var value;
      angular.mock.module(function() {
        directive({
          input: ngInternals.valueFn({
            restrict: 'ECA',
            link(scope, element, attr) {
              value = attr.required;
            }
          })
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<input required></input>')($rootScope);
        expect(value).toEqual(true);
      });
    });

    test('should read boolean attributes as text on non-controll elements', () => {
      var value;
      angular.mock.module(function() {
        directive({
          div: ngInternals.valueFn({
            restrict: 'ECA',
            link(scope, element, attr) {
              value = attr.required;
            }
          })
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<div required="some text"></div>')($rootScope);
        expect(value).toEqual('some text');
      });
    });


    test('should create new instance of attr for each template stamping', () => {
      angular.mock.module(function($provide) {
        var state = { first: [], second: [] };
        $provide.value('state', state);
        directive({
          first: ngInternals.valueFn({
            priority: 1,
            compile(templateElement, templateAttr) {
              return function(scope, element, attr) {
                state.first.push({
                  template: {element: templateElement, attr:templateAttr},
                  link: {element: element, attr: attr}
                });
              };
            }
          }),
          second: ngInternals.valueFn({
            priority: 2,
            compile(templateElement, templateAttr) {
              return function(scope, element, attr) {
                state.second.push({
                  template: {element: templateElement, attr:templateAttr},
                  link: {element: element, attr: attr}
                });
              };
            }
          })
        });
      });
      angular.mock.inject(function($rootScope, $compile, state) {
        var template = $compile('<div first second>');
        dealoc(template($rootScope.$new(), angular.noop));
        dealoc(template($rootScope.$new(), angular.noop));

        // instance between directives should be shared
        expect(state.first[0].template.element).toBe(state.second[0].template.element);
        expect(state.first[0].template.attr).toBe(state.second[0].template.attr);

        // the template and the link can not be the same instance
        expect(state.first[0].template.element).not.toBe(state.first[0].link.element);
        expect(state.first[0].template.attr).not.toBe(state.first[0].link.attr);

        // each new template needs to be new instance
        expect(state.first[0].link.element).not.toBe(state.first[1].link.element);
        expect(state.first[0].link.attr).not.toBe(state.first[1].link.attr);
        expect(state.second[0].link.element).not.toBe(state.second[1].link.element);
        expect(state.second[0].link.attr).not.toBe(state.second[1].link.attr);
      });
    });


    test('should properly $observe inside ng-repeat', () => {
      var spies = [];

      angular.mock.module(function() {
        directive('observer', function() {
          return function(scope, elm, attr) {
            spies.push(jest.fn().mockName('observer ' + spies.length));
            attr.$observe('some', spies[spies.length - 1]);
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div><div ng-repeat="i in items">' +
                              '<span some="id_{{i.id}}" observer></span>' +
                           '</div></div>')($rootScope);

        $rootScope.$apply(function() {
          $rootScope.items = [{id: 1}, {id: 2}];
        });

        expect(spies[0]).toHaveBeenCalledOnceWith('id_1');
        expect(spies[1]).toHaveBeenCalledOnceWith('id_2');
        spies[0].mockClear();
        spies[1].mockClear();

        $rootScope.$apply(function() {
          $rootScope.items[0].id = 5;
        });

        expect(spies[0]).toHaveBeenCalledOnceWith('id_5');
      });
    });


    describe('$set', () => {
      var attr;
       beforeEach(() => {
        angular.mock.module(function() {
          // Create directives that capture the `attr` object
          ['input', 'a', 'img'].forEach(function(tag) {
            directive(tag, ngInternals.valueFn({
              restrict: 'ECA',
              link(scope, element, attr) {
                scope.attr = attr;
              }
            }));
          });
        });
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<input></input>')($rootScope);
          attr = $rootScope.attr;
          expect(attr).toBeDefined();
        });
      });


      test('should set attributes', () => {
        attr.$set('ngMyAttr', 'value');
        expect(element.attr('ng-my-attr')).toEqual('value');
        expect(attr.ngMyAttr).toEqual('value');
      });


      test('should allow overriding of attribute name and remember the name', () => {
        attr.$set('ngOther', '123', true, 'other');
        expect(element.attr('other')).toEqual('123');
        expect(attr.ngOther).toEqual('123');

        attr.$set('ngOther', '246');
        expect(element.attr('other')).toEqual('246');
        expect(attr.ngOther).toEqual('246');
      });


      test('should remove attribute', () => {
        attr.$set('ngMyAttr', 'value');
        expect(element.attr('ng-my-attr')).toEqual('value');

        attr.$set('ngMyAttr', undefined);
        expect(element.attr('ng-my-attr')).toBeUndefined();

        attr.$set('ngMyAttr', 'value');
        attr.$set('ngMyAttr', null);
        expect(element.attr('ng-my-attr')).toBeUndefined();
      });

      test('should set the value to lowercased keys for boolean attrs', () => {
        attr.$set('disabled', 'value');
        expect(element.attr('disabled')).toEqual('disabled');

        element.removeAttr('disabled');

        attr.$set('dISaBlEd', 'VaLuE');
        expect(element.attr('disabled')).toEqual('disabled');
      });

      test('should call removeAttr for boolean attrs when value is `false`', () => {
        attr.$set('disabled', 'value');

        jest.spyOn(angular.element.prototype, 'attr');
        jest.spyOn(angular.element.prototype, 'removeAttr');

        attr.$set('disabled', false);

        expect(element.attr).not.toHaveBeenCalled();
        expect(element.removeAttr).toHaveBeenCalledWith('disabled');
        expect(element.attr('disabled')).toEqual(undefined);

        attr.$set('disabled', 'value');

        element.attr.mockClear();
        element.removeAttr.mockClear();

        attr.$set('dISaBlEd', false);

        expect(element.attr).not.toHaveBeenCalled();
        expect(element.removeAttr).toHaveBeenCalledWith('disabled');
        expect(element.attr('disabled')).toEqual(undefined);
      });


      test('should not set DOM element attr if writeAttr false', () => {
        attr.$set('test', 'value', false);

        expect(element.attr('test')).toBeUndefined();
        expect(attr.test).toBe('value');
      });

      test('should not automatically sanitize a[href]', angular.mock.inject(function($compile, $rootScope) {
        // Breaking change in https://github.com/angular/angular.js/pull/16378
        element = $compile('<a></a>')($rootScope);
        $rootScope.attr.$set('href', 'evil:foo()');
        expect(element.attr('href')).toEqual('evil:foo()');
        expect($rootScope.attr.href).toEqual('evil:foo()');
      }));

      test('should not automatically sanitize img[src]', angular.mock.inject(function($compile, $rootScope) {
        // Breaking change in https://github.com/angular/angular.js/pull/16378
        element = $compile('<img></img>')($rootScope);
        $rootScope.attr.$set('img', 'evil:foo()');
        expect(element.attr('img')).toEqual('evil:foo()');
        expect($rootScope.attr.img).toEqual('evil:foo()');
      }));

      test('should automatically sanitize img[srcset]', angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<img></img>')($rootScope);
        $rootScope.attr.$set('srcset', 'evil:foo()');
        expect(element.attr('srcset')).toEqual('unsafe:evil:foo()');
        expect($rootScope.attr.srcset).toEqual('unsafe:evil:foo()');
      }));

      test('should not accept trusted values for img[srcset]', angular.mock.inject(function($compile, $rootScope, $sce) {
        var trusted = $sce.trustAsMediaUrl('trustme:foo()');
        element = $compile('<img></img>')($rootScope);
        expect(function() {
          $rootScope.attr.$set('srcset', trusted);
        }).toThrowMinErr('$compile', 'srcset', 'Can\'t pass trusted values to `$set(\'srcset\', value)`: "trustme:foo()"');
      }));
    });
  });

  describe('controller lifecycle hooks', () => {

    describe('$onInit', () => {

      test('should call `$onInit`, if provided, after all the controllers on the element have been initialized', () => {

        function check() {
          expect(this.element.controller('d1').id).toEqual(1);
          expect(this.element.controller('d2').id).toEqual(2);
        }

        function Controller1($element) { this.id = 1; this.element = $element; }
        Controller1.prototype.$onInit = jest.fn().mockName('$onInit').mockImplementation(check);

        function Controller2($element) { this.id = 2; this.element = $element; }
        Controller2.prototype.$onInit = jest.fn().mockName('$onInit').mockImplementation(check);

        angular.module('my', [])
          .directive('d1', ngInternals.valueFn({ controller: Controller1 }))
          .directive('d2', ngInternals.valueFn({ controller: Controller2 }));

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div d1 d2></div>')($rootScope);
          expect(Controller1.prototype.$onInit).toHaveBeenCalledTimes(1);
          expect(Controller2.prototype.$onInit).toHaveBeenCalledTimes(1);
        });
      });

      test('should continue to trigger other `$onInit` hooks if one throws an error', () => {
        function ThrowingController() {
          this.$onInit = function() {
            throw new Error('bad hook');
          };
        }
        function LoggingController($log) {
          this.$onInit = function() {
            $log.info('onInit');
          };
        }

        angular.module('my', [])
          .component('c1', {
            controller: ThrowingController,
            bindings: {'prop': '<'}
          })
          .component('c2', {
            controller: LoggingController,
            bindings: {'prop': '<'}
          })
          .config(function($exceptionHandlerProvider) {
            // We need to test with the exceptionHandler not rethrowing...
            $exceptionHandlerProvider.mode('log');
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope, $exceptionHandler, $log) {

          // Setup the directive with bindings that will keep updating the bound value forever
          element = $compile('<div><c1 prop="a"></c1><c2 prop="a"></c2>')($rootScope);

          // The first component's error should be logged
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook'));

          // The second component's hook should still be called
          expect($log.info.logs.pop()).toEqual(['onInit']);
        });
      });
    });


    describe('$onDestroy', () => {

      test('should call `$onDestroy`, if provided, on the controller when its scope is destroyed', () => {

        function TestController() { this.count = 0; }
        TestController.prototype.$onDestroy = function() { this.count++; };

        angular.module('my', [])
          .directive('d1', ngInternals.valueFn({ scope: true, controller: TestController }))
          .directive('d2', ngInternals.valueFn({ scope: {}, controller: TestController }))
          .directive('d3', ngInternals.valueFn({ controller: TestController }));

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {

          element = $compile('<div><d1 ng-if="show[0]"></d1><d2 ng-if="show[1]"></d2><div ng-if="show[2]"><d3></d3></div></div>')($rootScope);

          $rootScope.$apply('show = [true, true, true]');
          var d1Controller = element.find('d1').controller('d1');
          var d2Controller = element.find('d2').controller('d2');
          var d3Controller = element.find('d3').controller('d3');

          expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([0,0,0]);
          $rootScope.$apply('show = [false, true, true]');
          expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([1,0,0]);
          $rootScope.$apply('show = [false, false, true]');
          expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([1,1,0]);
          $rootScope.$apply('show = [false, false, false]');
          expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([1,1,1]);
        });
      });


      test('should call `$onDestroy` top-down (the same as `scope.$broadcast`)', () => {
        var log = [];
        function ParentController() { log.push('parent created'); }
        ParentController.prototype.$onDestroy = function() { log.push('parent destroyed'); };
        function ChildController() { log.push('child created'); }
        ChildController.prototype.$onDestroy = function() { log.push('child destroyed'); };
        function GrandChildController() { log.push('grand child created'); }
        GrandChildController.prototype.$onDestroy = function() { log.push('grand child destroyed'); };

        angular.module('my', [])
          .directive('parent', ngInternals.valueFn({ scope: true, controller: ParentController }))
          .directive('child', ngInternals.valueFn({ scope: true, controller: ChildController }))
          .directive('grandChild', ngInternals.valueFn({ scope: true, controller: GrandChildController }));

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {

          element = $compile('<parent ng-if="show"><child><grand-child></grand-child></child></parent>')($rootScope);
          $rootScope.$apply('show = true');
          expect(log).toEqual(['parent created', 'child created', 'grand child created']);
          log = [];
          $rootScope.$apply('show = false');
          expect(log).toEqual(['parent destroyed', 'child destroyed', 'grand child destroyed']);
        });
      });
    });


    describe('$postLink', () => {

      test('should call `$postLink`, if provided, after the element has completed linking (i.e. post-link)', () => {

        var log = [];

        function Controller1() { }
        Controller1.prototype.$postLink = function() { log.push('d1 view init'); };

        function Controller2() { }
        Controller2.prototype.$postLink = function() { log.push('d2 view init'); };

        angular.module('my', [])
          .directive('d1', ngInternals.valueFn({
            controller: Controller1,
            link: { pre(s, e) { log.push('d1 pre: ' + e.text()); }, post(s, e) { log.push('d1 post: ' + e.text()); } },
            template: '<d2></d2>'
          }))
          .directive('d2', ngInternals.valueFn({
            controller: Controller2,
            link: { pre(s, e) { log.push('d2 pre: ' + e.text()); }, post(s, e) { log.push('d2 post: ' + e.text()); } },
            template: 'loaded'
          }));

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<d1></d1>')($rootScope);
          expect(log).toEqual([
            'd1 pre: loaded',
            'd2 pre: loaded',
            'd2 post: loaded',
            'd2 view init',
            'd1 post: loaded',
            'd1 view init'
          ]);
        });
      });
    });

    describe('$doCheck', () => {
      test('should call `$doCheck`, if provided, for each digest cycle, after $onChanges and $onInit', () => {
        var log = [];

        function TestController() { }
        TestController.prototype.$doCheck = function() { log.push('$doCheck'); };
        TestController.prototype.$onChanges = function() { log.push('$onChanges'); };
        TestController.prototype.$onInit = function() { log.push('$onInit'); };

        angular.module('my', [])
          .component('dcc', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<dcc prop1="val"></dcc>')($rootScope);
          expect(log).toEqual([
            '$onChanges',
            '$onInit',
            '$doCheck'
          ]);

          // Clear log
          log = [];

          $rootScope.$apply();
          expect(log).toEqual([
            '$doCheck',
            '$doCheck'
          ]);

          // Clear log
          log = [];

          $rootScope.$apply('val = 2');
          expect(log).toEqual([
            '$doCheck',
            '$onChanges',
            '$doCheck'
          ]);
        });
      });

      test('should work if $doCheck is provided in the constructor', () => {
        var log = [];

        function TestController() {
          this.$doCheck = function() { log.push('$doCheck'); };
          this.$onChanges = function() { log.push('$onChanges'); };
          this.$onInit = function() { log.push('$onInit'); };
        }

        angular.module('my', [])
          .component('dcc', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<dcc prop1="val"></dcc>')($rootScope);
          expect(log).toEqual([
            '$onChanges',
            '$onInit',
            '$doCheck'
          ]);

          // Clear log
          log = [];

          $rootScope.$apply();
          expect(log).toEqual([
            '$doCheck',
            '$doCheck'
          ]);

          // Clear log
          log = [];

          $rootScope.$apply('val = 2');
          expect(log).toEqual([
            '$doCheck',
            '$onChanges',
            '$doCheck'
          ]);
        });
      });
    });

    describe('$onChanges', () => {

      test('should call `$onChanges`, if provided, when a one-way (`<`) or interpolation (`@`) bindings are updated', () => {
        var log = [];
        function TestController() { }
        TestController.prototype.$onChanges = function(change) { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop1': '<', 'prop2': '<', 'other': '=', 'attr': '@' }
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          // Setup a watch to indicate some complicated updated logic
          $rootScope.$watch('val', function(val, oldVal) { $rootScope.val2 = val * 2; });
          // Setup the directive with two bindings
          element = $compile('<c1 prop1="val" prop2="val2" other="val3" attr="{{val4}}"></c1>')($rootScope);

          expect(log).toEqual([
            {
              prop1: expect.objectContaining({currentValue: undefined}),
              prop2: expect.objectContaining({currentValue: undefined}),
              attr: expect.objectContaining({currentValue: ''})
            }
          ]);

          // Clear the initial changes from the log
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('val = 42');

          // Now we should have a single changes entry in the log
          expect(log).toEqual([
            {
              prop1: expect.objectContaining({currentValue: 42}),
              prop2: expect.objectContaining({currentValue: 84})
            }
          ]);

          // Clear the log
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('val = 17');
          // Now we should have a single changes entry in the log
          expect(log).toEqual([
            {
              prop1: expect.objectContaining({previousValue: 42, currentValue: 17}),
              prop2: expect.objectContaining({previousValue: 84, currentValue: 34})
            }
          ]);

          // Clear the log
          log = [];

          // Update val3 to trigger the "other" two-way binding
          $rootScope.$apply('val3 = 63');
          // onChanges should not have been called
          expect(log).toEqual([]);

          // Update val4 to trigger the "attr" interpolation binding
          $rootScope.$apply('val4 = 22');
          // onChanges should not have been called
          expect(log).toEqual([
            {
              attr: expect.objectContaining({previousValue: '', currentValue: '22'})
            }
          ]);
        });
      });


      test('should trigger `$onChanges` even if the inner value already equals the new outer value', () => {
        var log = [];
        function TestController() { }
        TestController.prototype.$onChanges = function(change) { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<c1 prop1="val"></c1>')($rootScope);

          $rootScope.$apply('val = 1');
          expect(log.pop()).toEqual({prop1: expect.objectContaining({previousValue: undefined, currentValue: 1})});

          element.isolateScope().$ctrl.prop1 = 2;
          $rootScope.$apply('val = 2');
          expect(log.pop()).toEqual({prop1: expect.objectContaining({previousValue: 1, currentValue: 2})});
        });
      });


      test('should trigger `$onChanges` for literal expressions when expression input value changes (simple value)', () => {
        var log = [];
        function TestController() { }
        TestController.prototype.$onChanges = function(change) { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<c1 prop1="[val]"></c1>')($rootScope);

          $rootScope.$apply('val = 1');
          expect(log.pop()).toEqual({prop1: expect.objectContaining({previousValue: [undefined], currentValue: [1]})});

          $rootScope.$apply('val = 2');
          expect(log.pop()).toEqual({prop1: expect.objectContaining({previousValue: [1], currentValue: [2]})});
        });
      });


      test('should trigger `$onChanges` for literal expressions when expression input value changes (complex value)', () => {
        var log = [];
        function TestController() { }
        TestController.prototype.$onChanges = function(change) { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<c1 prop1="[val]"></c1>')($rootScope);

          $rootScope.$apply('val = [1]');
          expect(log.pop()).toEqual({prop1: expect.objectContaining({previousValue: [undefined], currentValue: [[1]]})});

          $rootScope.$apply('val = [2]');
          expect(log.pop()).toEqual({prop1: expect.objectContaining({previousValue: [[1]], currentValue: [[2]]})});
        });
      });


      test('should trigger `$onChanges` for literal expressions when expression input value changes instances, even when equal', () => {
        var log = [];
        function TestController() { }
        TestController.prototype.$onChanges = function(change) { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<c1 prop1="[val]"></c1>')($rootScope);

          $rootScope.$apply('val = [1]');
          expect(log.pop()).toEqual({prop1: expect.objectContaining({previousValue: [undefined], currentValue: [[1]]})});

          $rootScope.$apply('val = [1]');
          expect(log.pop()).toEqual({prop1: expect.objectContaining({previousValue: [[1]], currentValue: [[1]]})});
        });
      });


      test('should pass the original value as `previousValue` even if there were multiple changes in a single digest', () => {
        var log = [];
        function TestController() { }
        TestController.prototype.$onChanges = function(change) { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<c1 prop="a + b"></c1>')($rootScope);

          // We add this watch after the compilation to ensure that it will run after the binding watchers
          // therefore triggering the thing that this test is hoping to enforce
          $rootScope.$watch('a', function(val) { $rootScope.b = val * 2; });

          expect(log).toEqual([{prop: expect.objectContaining({currentValue: undefined})}]);

          // Clear the initial values from the log
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('a = 42');
          // Now the change should have the real previous value (undefined), not the intermediate one (42)
          expect(log).toEqual([{prop: expect.objectContaining({currentValue: 126})}]);

          // Clear the log
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('a = 7');
          // Now the change should have the real previous value (126), not the intermediate one, (91)
          expect(log).toEqual([{prop: expect.objectContaining({previousValue: 126, currentValue: 21})}]);
        });
      });


      test('should trigger an initial onChanges call for each binding with the `isFirstChange()` returning true', () => {
        var log = [];
        function TestController() { }
        TestController.prototype.$onChanges = function(change) { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop': '<', attr: '@' }
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {

          $rootScope.$apply('a = 7');
          element = $compile('<c1 prop="a" attr="{{a}}"></c1>')($rootScope);

          expect(log).toEqual([
            {
              prop: expect.objectContaining({currentValue: 7}),
              attr: expect.objectContaining({currentValue: '7'})
            }
          ]);
          expect(log[0].prop.isFirstChange()).toEqual(true);
          expect(log[0].attr.isFirstChange()).toEqual(true);

          log = [];
          $rootScope.$apply('a = 9');
          expect(log).toEqual([
            {
              prop: expect.objectContaining({previousValue: 7, currentValue: 9}),
              attr: expect.objectContaining({previousValue: '7', currentValue: '9'})
            }
          ]);
          expect(log[0].prop.isFirstChange()).toEqual(false);
          expect(log[0].attr.isFirstChange()).toEqual(false);
        });
      });


      test('should trigger an initial onChanges call for each binding even if the hook is defined in the constructor', () => {
        var log = [];
        function TestController() {
          this.$onChanges = function(change) { log.push(change); };
        }

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop': '<', attr: '@' }
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {
          $rootScope.$apply('a = 7');
          element = $compile('<c1 prop="a" attr="{{a}}"></c1>')($rootScope);

          expect(log).toEqual([
            {
              prop: expect.objectContaining({currentValue: 7}),
              attr: expect.objectContaining({currentValue: '7'})
            }
          ]);
          expect(log[0].prop.isFirstChange()).toEqual(true);
          expect(log[0].attr.isFirstChange()).toEqual(true);

          log = [];
          $rootScope.$apply('a = 10');
          expect(log).toEqual([
            {
              prop: expect.objectContaining({previousValue: 7, currentValue: 10}),
              attr: expect.objectContaining({previousValue: '7', currentValue: '10'})
            }
          ]);
          expect(log[0].prop.isFirstChange()).toEqual(false);
          expect(log[0].attr.isFirstChange()).toEqual(false);
        });
      });

      test('should clean up `@`-binding observers when re-assigning bindings', () => {
        var constructorSpy = jest.fn().mockName('constructor');
        var prototypeSpy = jest.fn().mockName('prototype');

        function TestController() {
          return {$onChanges: constructorSpy};
        }
        TestController.prototype.$onChanges = prototypeSpy;

        angular.mock.module(function($compileProvider) {
          $compileProvider.component('test', {
            bindings: {attr: '@'},
            controller: TestController
          });
        });

        angular.mock.inject(function($compile, $rootScope) {
          var template = '<test attr="{{a}}"></test>';
          $rootScope.a = 'foo';

          element = $compile(template)($rootScope);
          $rootScope.$digest();
          expect(constructorSpy).toHaveBeenCalled();
          expect(prototypeSpy).not.toHaveBeenCalled();

          constructorSpy.mockClear();
          $rootScope.$apply('a = "bar"');
          expect(constructorSpy).toHaveBeenCalled();
          expect(prototypeSpy).not.toHaveBeenCalled();
        });
      });

      test('should not call `$onChanges` twice even when the initial value is `NaN`', () => {
        var onChangesSpy = jest.fn().mockName('$onChanges');

        angular.mock.module(function($compileProvider) {
          $compileProvider.component('test', {
            bindings: {prop: '<', attr: '@'},
            controller: function TestController() {
              this.$onChanges = onChangesSpy;
            }
          });
        });

        angular.mock.inject(function($compile, $rootScope) {
          var template = '<test prop="a" attr="{{a}}"></test>' +
                         '<test prop="b" attr="{{b}}"></test>';
          $rootScope.a = 'foo';
          $rootScope.b = NaN;

          element = $compile(template)($rootScope);
          $rootScope.$digest();

          expect(onChangesSpy).toHaveBeenCalledTimes(2);
          expect(onChangesSpy.mock.calls[0][0]).toEqual({
            prop: expect.objectContaining({currentValue: 'foo'}),
            attr: expect.objectContaining({currentValue: 'foo'})
          });
          expect(onChangesSpy.mock.calls[1][0]).toEqual({
            prop: expect.objectContaining({currentValue: NaN}),
            attr: expect.objectContaining({currentValue: 'NaN'})
          });

          onChangesSpy.mockClear();
          $rootScope.$apply('a = "bar"; b = 42');

          expect(onChangesSpy).toHaveBeenCalledTimes(2);
          expect(onChangesSpy.mock.calls[0][0]).toEqual({
            prop: expect.objectContaining({previousValue: 'foo', currentValue: 'bar'}),
            attr: expect.objectContaining({previousValue: 'foo', currentValue: 'bar'})
          });
          expect(onChangesSpy.mock.calls[1][0]).toEqual({
            prop: expect.objectContaining({previousValue: NaN, currentValue: 42}),
            attr: expect.objectContaining({previousValue: 'NaN', currentValue: '42'})
          });
        });
      });


      test('should only trigger one extra digest however many controllers have changes', () => {
        var log = [];
        function TestController1() { }
        TestController1.prototype.$onChanges = function(change) { log.push(['TestController1', change]); };
        function TestController2() { }
        TestController2.prototype.$onChanges = function(change) { log.push(['TestController2', change]); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController1,
            bindings: {'prop': '<'}
          })
          .component('c2', {
            controller: TestController2,
            bindings: {'prop': '<'}
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {

          // Create a watcher to count the number of digest cycles
          var watchCount = 0;
          $rootScope.$watch(function() { watchCount++; });

          // Setup two sibling components with bindings that will change
          element = $compile('<div><c1 prop="val1"></c1><c2 prop="val2"></c2></div>')($rootScope);

          // Clear out initial changes
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('val1 = 42; val2 = 17');

          expect(log).toEqual([
            ['TestController1', {prop: expect.objectContaining({currentValue: 42})}],
            ['TestController2', {prop: expect.objectContaining({currentValue: 17})}]
          ]);
          // A single apply should only trigger three turns of the digest loop
          expect(watchCount).toEqual(3);
        });
      });


      test('should cope with changes occurring inside `$onChanges()` hooks', () => {
        var log = [];
        function OuterController() {}
        OuterController.prototype.$onChanges = function(change) {
          log.push(['OuterController', change]);
          // Make a change to the inner component
          this.b = this.prop1 * 2;
        };

        function InnerController() { }
        InnerController.prototype.$onChanges = function(change) { log.push(['InnerController', change]); };

        angular.module('my', [])
          .component('outer', {
            controller: OuterController,
            bindings: {'prop1': '<'},
            template: '<inner prop2="$ctrl.b"></inner>'
          })
          .component('inner', {
            controller: InnerController,
            bindings: {'prop2': '<'}
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {

          // Setup the directive with two bindings
          element = $compile('<outer prop1="a"></outer>')($rootScope);

          // Clear out initial changes
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('a = 42');

          expect(log).toEqual([
            ['OuterController', {prop1: expect.objectContaining({previousValue: undefined, currentValue: 42})}],
            ['InnerController', {prop2: expect.objectContaining({previousValue: NaN, currentValue: 84})}]
          ]);
        });
      });


      test('should throw an error if `$onChanges()` hooks are not stable', () => {
        function TestController() {}
        TestController.prototype.$onChanges = function(change) {
          this.onChange();
        };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: {'prop': '<', onChange: '&'}
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope) {

          // Setup the directive with bindings that will keep updating the bound value forever
          element = $compile('<c1 prop="a" on-change="a = -a"></c1>')($rootScope);

          // Update val to trigger the unstable onChanges, which will result in an error
          expect(function() {
            $rootScope.$apply('a = 42');
          }).toThrowMinErr('$compile', 'infchng');

          dealoc(element);
          element = $compile('<c1 prop="b" on-change=""></c1>')($rootScope);
          $rootScope.$apply('b = 24');
          $rootScope.$apply('b = 48');
        });
      });


      test('should log an error if `$onChanges()` hooks are not stable', () => {
        function TestController() {}
        TestController.prototype.$onChanges = function(change) {
          this.onChange();
        };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: {'prop': '<', onChange: '&'}
          })
          .config(function($exceptionHandlerProvider) {
            // We need to test with the exceptionHandler not rethrowing...
            $exceptionHandlerProvider.mode('log');
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope, $exceptionHandler) {

          // Setup the directive with bindings that will keep updating the bound value forever
          element = $compile('<c1 prop="a" on-change="a = -a"></c1>')($rootScope);

          // Update val to trigger the unstable onChanges, which will result in an error
          $rootScope.$apply('a = 42');
          expect($exceptionHandler.errors.length).toEqual(1);
          expect($exceptionHandler.errors[0]).
              toEqualMinErr('$compile', 'infchng', '10 $onChanges() iterations reached.');
        });
      });


      test('should continue to trigger other `$onChanges` hooks if one throws an error', () => {
        function ThrowingController() {
          this.$onChanges = function(change) {
            throw new Error('bad hook');
          };
        }
        function LoggingController($log) {
          this.$onChanges = function(change) {
            $log.info('onChange');
          };
        }

        angular.module('my', [])
          .component('c1', {
            controller: ThrowingController,
            bindings: {'prop': '<'}
          })
          .component('c2', {
            controller: LoggingController,
            bindings: {'prop': '<'}
          })
          .config(function($exceptionHandlerProvider) {
            // We need to test with the exceptionHandler not rethrowing...
            $exceptionHandlerProvider.mode('log');
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope, $exceptionHandler, $log) {

          // Setup the directive with bindings that will keep updating the bound value forever
          element = $compile('<div><c1 prop="a"></c1><c2 prop="a"></c2>')($rootScope);

          // The first component's error should be logged
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook'));

          // The second component's changes should still be called
          expect($log.info.logs.pop()).toEqual(['onChange']);

          $rootScope.$apply('a = 42');

          // The first component's error should be logged
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook'));

          // The second component's changes should still be called
          expect($log.info.logs.pop()).toEqual(['onChange']);
        });
      });


      test('should throw `$onChanges` errors immediately', () => {
        function ThrowingController() {
          this.$onChanges = function(change) {
            throw new Error('bad hook: ' + this.prop);
          };
        }

        angular.module('my', [])
          .component('c1', {
            controller: ThrowingController,
            bindings: {'prop': '<'}
          })
          .config(function($exceptionHandlerProvider) {
            // We need to test with the exceptionHandler not rethrowing...
            $exceptionHandlerProvider.mode('log');
          });

        angular.mock.module('my');
        angular.mock.inject(function($compile, $rootScope, $exceptionHandler, $log) {

          // Setup the directive with bindings that will keep updating the bound value forever
          element = $compile('<div><c1 prop="a"></c1><c1 prop="a * 2"></c1>')($rootScope);

          // Both component's errors should be logged
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook: NaN'));
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook: undefined'));

          $rootScope.$apply('a = 42');

          // Both component's error should be logged individually
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook: 84'));
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook: 42'));
        });
      });
    });
  });


  describe('isolated locals', () => {
    var componentScope;
    var regularScope;

    beforeEach(angular.mock.module(function() {
      directive('myComponent', function() {
        return {
          scope: {
            attr: '@',
            attrAlias: '@attr',
            $attrAlias: '@$attr$',
            ref: '=',
            refAlias: '= ref',
            $refAlias: '= $ref$',
            reference: '=',
            optref: '=?',
            optrefAlias: '=? optref',
            $optrefAlias: '=? $optref$',
            optreference: '=?',
            colref: '=*',
            colrefAlias: '=* colref',
            $colrefAlias: '=* $colref$',
            owRef: '<',
            owRefAlias: '< owRef',
            $owRefAlias: '< $owRef$',
            owOptref: '<?',
            owOptrefAlias: '<? owOptref',
            $owOptrefAlias: '<? $owOptref$',
            owColref: '<*',
            owColrefAlias: '<* owColref',
            $owColrefAlias: '<* $owColref$',
            expr: '&',
            optExpr: '&?',
            exprAlias: '&expr',
            $exprAlias: '&$expr$',
            constructor: '&?'
          },
          link(scope) {
            componentScope = scope;
          }
        };
      });
      directive('badDeclaration', function() {
        return {
          scope: { attr: 'xxx' }
        };
      });
      directive('storeScope', function() {
        return {
          link(scope) {
            regularScope = scope;
          }
        };
      });
    }));


    test('should give other directives the parent scope', angular.mock.inject(function($rootScope) {
      compile('<div><input type="text" my-component store-scope ng-model="value"></div>');
      $rootScope.$apply(function() {
        $rootScope.value = 'from-parent';
      });
      expect(element.find('input').val()).toBe('from-parent');
      expect(componentScope).not.toBe(regularScope);
      expect(componentScope.$parent).toBe(regularScope);
    }));


    test('should not give the isolate scope to other directive template', () => {
      angular.mock.module(function() {
        directive('otherTplDir', function() {
          return {
            template: 'value: {{value}}'
          };
        });
      });

      angular.mock.inject(function($rootScope) {
        compile('<div my-component other-tpl-dir>');

        $rootScope.$apply(function() {
          $rootScope.value = 'from-parent';
        });

        expect(element.html()).toBe('value: from-parent');
      });
    });


    test('should not give the isolate scope to other directive template (with templateUrl)', () => {
      angular.mock.module(function() {
        directive('otherTplDir', function() {
          return {
            templateUrl: 'other.html'
          };
        });
      });

      angular.mock.inject(function($rootScope, $templateCache) {
        $templateCache.put('other.html', 'value: {{value}}');
        compile('<div my-component other-tpl-dir>');

        $rootScope.$apply(function() {
          $rootScope.value = 'from-parent';
        });

        expect(element.html()).toBe('value: from-parent');
      });
    });


    test('should not give the isolate scope to regular child elements', () => {
      angular.mock.inject(function($rootScope) {
        compile('<div my-component>value: {{value}}</div>');

        $rootScope.$apply(function() {
          $rootScope.value = 'from-parent';
        });

        expect(element.html()).toBe('value: from-parent');
      });
    });


    test('should update parent scope when "="-bound NaN changes', angular.mock.inject(function($compile, $rootScope) {
      $rootScope.num = NaN;
      compile('<div my-component reference="num"></div>');
      var isolateScope = element.isolateScope();
      expect(isolateScope.reference).toBeNaN();

      isolateScope.$apply(function(scope) { scope.reference = 64; });
      expect($rootScope.num).toBe(64);
    }));


    test('should update isolate scope when "="-bound NaN changes', angular.mock.inject(function($compile, $rootScope) {
      $rootScope.num = NaN;
      compile('<div my-component reference="num"></div>');
      var isolateScope = element.isolateScope();
      expect(isolateScope.reference).toBeNaN();

      $rootScope.$apply(function(scope) { scope.num = 64; });
      expect(isolateScope.reference).toBe(64);
    }));


    test('should be able to bind attribute names which are present in Object.prototype', () => {
      angular.mock.module(function() {
        directive('inProtoAttr', ngInternals.valueFn({
          scope: {
            'constructor': '@',
            'toString': '&',

            // Spidermonkey extension, may be obsolete in the future
            'watch': '='
          }
        }));
      });
      angular.mock.inject(function($rootScope) {
        expect(function() {
          compile('<div in-proto-attr constructor="hello, world" watch="[]" ' +
                    'to-string="value = !value"></div>');
        }).not.toThrow();
        var isolateScope = element.isolateScope();

        expect(typeof isolateScope.constructor).toBe('string');
        expect(angular.isArray(isolateScope.watch)).toBe(true);
        expect(typeof isolateScope.toString).toBe('function');
        expect($rootScope.value).toBeUndefined();
        isolateScope.toString();
        expect($rootScope.value).toBe(true);
      });
    });

    test('should be able to interpolate attribute names which are present in Object.prototype', () => {
      var attrs;
      angular.mock.module(function() {
        directive('attrExposer', ngInternals.valueFn({
          link($scope, $element, $attrs) {
            attrs = $attrs;
          }
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        $compile('<div attr-exposer to-string="{{1 + 1}}">')($rootScope);
        $rootScope.$apply();
        expect(attrs.toString).toBe('2');
      });
    });


    test('should not initialize scope value if optional expression binding is not passed', angular.mock.inject(function($compile) {
      compile('<div my-component></div>');
      var isolateScope = element.isolateScope();
      expect(isolateScope.optExpr).toBeUndefined();
    }));


    test('should not initialize scope value if optional expression binding with Object.prototype name is not passed', angular.mock.inject(function($compile) {
      compile('<div my-component></div>');
      var isolateScope = element.isolateScope();
      expect(isolateScope.constructor).toBe($rootScope.constructor);
    }));


    test('should initialize scope value if optional expression binding is passed', angular.mock.inject(function($compile) {
      compile('<div my-component opt-expr="value = \'did!\'"></div>');
      var isolateScope = element.isolateScope();
      expect(typeof isolateScope.optExpr).toBe('function');
      expect(isolateScope.optExpr()).toBe('did!');
      expect($rootScope.value).toBe('did!');
    }));


    test('should initialize scope value if optional expression binding with Object.prototype name is passed', angular.mock.inject(function($compile) {
      compile('<div my-component constructor="value = \'did!\'"></div>');
      var isolateScope = element.isolateScope();
      expect(typeof isolateScope.constructor).toBe('function');
      expect(isolateScope.constructor()).toBe('did!');
      expect($rootScope.value).toBe('did!');
    }));


    test('should not overwrite @-bound property each digest when not present', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('testDir', ngInternals.valueFn({
          scope: {prop: '@'},
          controller($scope) {
            $scope.prop = $scope.prop || 'default';
            this.getProp = function() {
              return $scope.prop;
            };
          },
          controllerAs: 'ctrl',
          template: '<p></p>'
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div test-dir></div>')($rootScope);
        var scope = element.isolateScope();
        expect(scope.ctrl.getProp()).toBe('default');

        $rootScope.$digest();
        expect(scope.ctrl.getProp()).toBe('default');
      });
    });


    test('should ignore optional "="-bound property if value is the empty string', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('testDir', ngInternals.valueFn({
          scope: {prop: '=?'},
          controller($scope) {
            $scope.prop = $scope.prop || 'default';
            this.getProp = function() {
              return $scope.prop;
            };
          },
          controllerAs: 'ctrl',
          template: '<p></p>'
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div test-dir></div>')($rootScope);
        var scope = element.isolateScope();
        expect(scope.ctrl.getProp()).toBe('default');
        $rootScope.$digest();
        expect(scope.ctrl.getProp()).toBe('default');
        scope.prop = 'foop';
        $rootScope.$digest();
        expect(scope.ctrl.getProp()).toBe('foop');
      });
    });


    describe('bind-once', () => {

      function countWatches(scope) {
        var result = 0;
        while (scope !== null) {
          result += (scope.$$watchers && scope.$$watchers.length) || 0;
          result += countWatches(scope.$$childHead);
          scope = scope.$$nextSibling;
        }
        return result;
      }

      test('should be possible to one-time bind a parameter on a component with a template', () => {
        angular.mock.module(function() {
          directive('otherTplDir', function() {
            return {
              scope: {param1: '=', param2: '='},
              template: '1:{{param1}};2:{{param2}};3:{{::param1}};4:{{::param2}}'
            };
          });
        });

        angular.mock.inject(function($rootScope) {
          compile('<div other-tpl-dir param1="::foo" param2="bar"></div>');
          expect(countWatches($rootScope)).toEqual(6); // 4 -> template watch group, 2 -> '='
          $rootScope.$digest();
          expect(element.html()).toBe('1:;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(6);

          $rootScope.foo = 'foo';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:;3:foo;4:');
          expect(countWatches($rootScope)).toEqual(4);

          $rootScope.foo = 'baz';
          $rootScope.bar = 'bar';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:bar;3:foo;4:bar');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.bar = 'baz';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:baz;3:foo;4:bar');
        });
      });

      test('should be possible to one-time bind a parameter on a component with a template', () => {
        angular.mock.module(function() {
          directive('otherTplDir', function() {
            return {
              scope: {param1: '@', param2: '@'},
              template: '1:{{param1}};2:{{param2}};3:{{::param1}};4:{{::param2}}'
            };
          });
        });

        angular.mock.inject(function($rootScope) {
          compile('<div other-tpl-dir param1="{{::foo}}" param2="{{bar}}"></div>');
          expect(countWatches($rootScope)).toEqual(6); // 4 -> template watch group, 2 -> {{ }}
          $rootScope.$digest();
          expect(element.html()).toBe('1:;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(4); // (- 2) -> bind-once in template

          $rootScope.foo = 'foo';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.foo = 'baz';
          $rootScope.bar = 'bar';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:bar;3:;4:');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.bar = 'baz';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:baz;3:;4:');
        });
      });

      test('should be possible to one-time bind a parameter on a component with a template', () => {
        angular.mock.module(function() {
          directive('otherTplDir', function() {
            return {
              scope: {param1: '=', param2: '='},
              templateUrl: 'other.html'
            };
          });
        });

        angular.mock.inject(function($rootScope, $templateCache) {
          $templateCache.put('other.html', '1:{{param1}};2:{{param2}};3:{{::param1}};4:{{::param2}}');
          compile('<div other-tpl-dir param1="::foo" param2="bar"></div>');
          $rootScope.$digest();
          expect(element.html()).toBe('1:;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(6); // 4 -> template watch group, 2 -> '='

          $rootScope.foo = 'foo';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:;3:foo;4:');
          expect(countWatches($rootScope)).toEqual(4);

          $rootScope.foo = 'baz';
          $rootScope.bar = 'bar';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:bar;3:foo;4:bar');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.bar = 'baz';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:baz;3:foo;4:bar');
        });
      });

      test('should be possible to one-time bind a parameter on a component with a template', () => {
        angular.mock.module(function() {
          directive('otherTplDir', function() {
            return {
              scope: {param1: '@', param2: '@'},
              templateUrl: 'other.html'
            };
          });
        });

        angular.mock.inject(function($rootScope, $templateCache) {
          $templateCache.put('other.html', '1:{{param1}};2:{{param2}};3:{{::param1}};4:{{::param2}}');
          compile('<div other-tpl-dir param1="{{::foo}}" param2="{{bar}}"></div>');
          $rootScope.$digest();
          expect(element.html()).toBe('1:;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(4); // (4 - 2) -> template watch group, 2 -> {{ }}

          $rootScope.foo = 'foo';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.foo = 'baz';
          $rootScope.bar = 'bar';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:bar;3:;4:');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.bar = 'baz';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:baz;3:;4:');
        });
      });

      test('should continue with a digets cycle when there is a two-way binding from the child to the parent', () => {
        angular.mock.module(function() {
          directive('hello', function() {
            return {
              restrict: 'E',
              scope: { greeting: '=' },
              template: '<button ng-click="setGreeting()">Say hi!</button>',
              link(scope) {
                scope.setGreeting = function() { scope.greeting = 'Hello!'; };
              }
            };
          });
        });

        angular.mock.inject(function($rootScope) {
          compile('<div>' +
                    '<p>{{greeting}}</p>' +
                    '<div><hello greeting="greeting"></hello></div>' +
                  '</div>');
          $rootScope.$digest();
          browserTrigger(element.find('button'), 'click');
          expect(element.find('p').text()).toBe('Hello!');
        });
      });

    });


    describe('attribute', () => {
      test('should copy simple attribute', angular.mock.inject(function() {
        compile('<div><span my-component attr="some text" $attr$="some other text">');

        expect(componentScope.attr).toEqual('some text');
        expect(componentScope.attrAlias).toEqual('some text');
        expect(componentScope.$attrAlias).toEqual('some other text');
        expect(componentScope.attrAlias).toEqual(componentScope.attr);
      }));

      test('should copy an attribute with spaces', angular.mock.inject(function() {
        compile('<div><span my-component attr=" some text " $attr$=" some other text ">');

        expect(componentScope.attr).toEqual(' some text ');
        expect(componentScope.attrAlias).toEqual(' some text ');
        expect(componentScope.$attrAlias).toEqual(' some other text ');
        expect(componentScope.attrAlias).toEqual(componentScope.attr);
      }));

      test('should set up the interpolation before it reaches the link function', angular.mock.inject(function() {
        $rootScope.name = 'misko';
        compile('<div><span my-component attr="hello {{name}}" $attr$="hi {{name}}">');
        expect(componentScope.attr).toEqual('hello misko');
        expect(componentScope.attrAlias).toEqual('hello misko');
        expect(componentScope.$attrAlias).toEqual('hi misko');
      }));

      test('should update when interpolated attribute updates', angular.mock.inject(function() {
        compile('<div><span my-component attr="hello {{name}}" $attr$="hi {{name}}">');

        $rootScope.name = 'igor';
        $rootScope.$apply();

        expect(componentScope.attr).toEqual('hello igor');
        expect(componentScope.attrAlias).toEqual('hello igor');
        expect(componentScope.$attrAlias).toEqual('hi igor');
      }));
    });


    describe('object reference', () => {
      test('should update local when origin changes', angular.mock.inject(function() {
        compile('<div><span my-component ref="name" $ref$="name">');
        expect(componentScope.ref).toBeUndefined();
        expect(componentScope.refAlias).toBe(componentScope.ref);
        expect(componentScope.$refAlias).toBe(componentScope.ref);

        $rootScope.name = 'misko';
        $rootScope.$apply();

        expect($rootScope.name).toBe('misko');
        expect(componentScope.ref).toBe('misko');
        expect(componentScope.refAlias).toBe('misko');
        expect(componentScope.$refAlias).toBe('misko');

        $rootScope.name = {};
        $rootScope.$apply();
        expect(componentScope.ref).toBe($rootScope.name);
        expect(componentScope.refAlias).toBe($rootScope.name);
        expect(componentScope.$refAlias).toBe($rootScope.name);
      }));


      test('should update local when both change', angular.mock.inject(function() {
        compile('<div><span my-component ref="name" $ref$="name">');
        $rootScope.name = {mark:123};
        componentScope.ref = 'misko';

        $rootScope.$apply();
        expect($rootScope.name).toEqual({mark:123});
        expect(componentScope.ref).toBe($rootScope.name);
        expect(componentScope.refAlias).toBe($rootScope.name);
        expect(componentScope.$refAlias).toBe($rootScope.name);

        $rootScope.name = 'igor';
        componentScope.ref = {};
        $rootScope.$apply();
        expect($rootScope.name).toEqual('igor');
        expect(componentScope.ref).toBe($rootScope.name);
        expect(componentScope.refAlias).toBe($rootScope.name);
        expect(componentScope.$refAlias).toBe($rootScope.name);
      }));

      test('should not break if local and origin both change to the same value', angular.mock.inject(function() {
        $rootScope.name = 'aaa';

        compile('<div><span my-component ref="name">');

        //change both sides to the same item within the same digest cycle
        componentScope.ref = 'same';
        $rootScope.name = 'same';
        $rootScope.$apply();

        //change origin back to its previous value
        $rootScope.name = 'aaa';
        $rootScope.$apply();

        expect($rootScope.name).toBe('aaa');
        expect(componentScope.ref).toBe('aaa');
      }));

      test('should complain on non assignable changes', angular.mock.inject(function() {
        compile('<div><span my-component ref="\'hello \' + name">');
        $rootScope.name = 'world';
        $rootScope.$apply();
        expect(componentScope.ref).toBe('hello world');

        componentScope.ref = 'ignore me';
        expect(function() { $rootScope.$apply(); }).
            toThrowMinErr('$compile', 'nonassign', 'Expression \'\'hello \' + name\' in attribute \'ref\' used with directive \'myComponent\' is non-assignable!');
        expect(componentScope.ref).toBe('hello world');
        // reset since the exception was rethrown which prevented phase clearing
        $rootScope.$$phase = null;

        $rootScope.name = 'misko';
        $rootScope.$apply();
        expect(componentScope.ref).toBe('hello misko');
      }));

      test('should complain if assigning to undefined', angular.mock.inject(function() {
        compile('<div><span my-component>');
        $rootScope.$apply();
        expect(componentScope.ref).toBeUndefined();

        componentScope.ref = 'ignore me';
        expect(function() { $rootScope.$apply(); }).
            toThrowMinErr('$compile', 'nonassign', 'Expression \'undefined\' in attribute \'ref\' used with directive \'myComponent\' is non-assignable!');
        expect(componentScope.ref).toBeUndefined();

        $rootScope.$$phase = null; // reset since the exception was rethrown which prevented phase clearing
        $rootScope.$apply();
        expect(componentScope.ref).toBeUndefined();
      }));

      // regression
      test('should stabilize model', angular.mock.inject(function() {
        compile('<div><span my-component reference="name">');

        var lastRefValueInParent;
        $rootScope.$watch('name', function(ref) {
          lastRefValueInParent = ref;
        });

        $rootScope.name = 'aaa';
        $rootScope.$apply();

        componentScope.reference = 'new';
        $rootScope.$apply();

        expect(lastRefValueInParent).toBe('new');
      }));

      describe('literal objects', () => {
        test('should copy parent changes', angular.mock.inject(function() {
          compile('<div><span my-component reference="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          expect(componentScope.reference).toEqual({name: 'a'});

          $rootScope.name = 'b';
          $rootScope.$apply();
          expect(componentScope.reference).toEqual({name: 'b'});
        }));

        test('should not change the component when parent does not change', angular.mock.inject(function() {
          compile('<div><span my-component reference="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          var lastComponentValue = componentScope.reference;
          $rootScope.$apply();
          expect(componentScope.reference).toBe(lastComponentValue);
        }));

        test('should complain when the component changes', angular.mock.inject(function() {
          compile('<div><span my-component reference="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          componentScope.reference = {name: 'b'};
          expect(function() {
            $rootScope.$apply();
          }).toThrowMinErr('$compile', 'nonassign', 'Expression \'{name: name}\' in attribute \'reference\' used with directive \'myComponent\' is non-assignable!');

        }));

        test('should work for primitive literals', angular.mock.inject(function() {
          test('1', 1);
          test('null', null);
          test('undefined', undefined);
          test('\'someString\'', 'someString');
          test('true', true);

          function test(literalString, literalValue) {
            compile('<div><span my-component reference="' + literalString + '">');

            $rootScope.$apply();
            expect(componentScope.reference).toBe(literalValue);
            dealoc(element);
          }
        }));

      });

    });


    describe('optional object reference', () => {
      test('should update local when origin changes', angular.mock.inject(function() {
        compile('<div><span my-component optref="name" $optref$="name">');
        expect(componentScope.optRef).toBeUndefined();
        expect(componentScope.optRefAlias).toBe(componentScope.optRef);
        expect(componentScope.$optRefAlias).toBe(componentScope.optRef);

        $rootScope.name = 'misko';
        $rootScope.$apply();
        expect(componentScope.optref).toBe($rootScope.name);
        expect(componentScope.optrefAlias).toBe($rootScope.name);
        expect(componentScope.$optrefAlias).toBe($rootScope.name);

        $rootScope.name = {};
        $rootScope.$apply();
        expect(componentScope.optref).toBe($rootScope.name);
        expect(componentScope.optrefAlias).toBe($rootScope.name);
        expect(componentScope.$optrefAlias).toBe($rootScope.name);
      }));

      test('should not throw exception when reference does not exist', angular.mock.inject(function() {
        compile('<div><span my-component>');

        expect(componentScope.optref).toBeUndefined();
        expect(componentScope.optrefAlias).toBeUndefined();
        expect(componentScope.$optrefAlias).toBeUndefined();
        expect(componentScope.optreference).toBeUndefined();
      }));
    });


    describe('collection object reference', () => {
      test('should update isolate scope when origin scope changes', angular.mock.inject(function() {
        $rootScope.collection = [{
          name: 'Gabriel',
          value: 18
        }, {
          name: 'Tony',
          value: 91
        }];
        $rootScope.query = '';
        $rootScope.$apply();

        compile('<div><span my-component colref="collection | filter:query" $colref$="collection | filter:query">');

        expect(componentScope.colref).toEqual($rootScope.collection);
        expect(componentScope.colrefAlias).toEqual(componentScope.colref);
        expect(componentScope.$colrefAlias).toEqual(componentScope.colref);

        $rootScope.query = 'Gab';
        $rootScope.$apply();

        expect(componentScope.colref).toEqual([$rootScope.collection[0]]);
        expect(componentScope.colrefAlias).toEqual([$rootScope.collection[0]]);
        expect(componentScope.$colrefAlias).toEqual([$rootScope.collection[0]]);
      }));

      test('should update origin scope when isolate scope changes', angular.mock.inject(function() {
        $rootScope.collection = [{
          name: 'Gabriel',
          value: 18
        }, {
          name: 'Tony',
          value: 91
        }];

        compile('<div><span my-component colref="collection">');

        var newItem = {
          name: 'Pablo',
          value: 10
        };
        componentScope.colref.push(newItem);
        componentScope.$apply();

        expect($rootScope.collection[2]).toEqual(newItem);
      }));
    });


    describe('one-way binding', () => {
      test('should update isolate when the identity of origin changes', angular.mock.inject(function() {
        compile('<div><span my-component ow-ref="obj" $ow-ref$="obj">');

        expect(componentScope.owRef).toBeUndefined();
        expect(componentScope.owRefAlias).toBe(componentScope.owRef);
        expect(componentScope.$owRefAlias).toBe(componentScope.owRef);

        $rootScope.obj = {value: 'initial'};
        $rootScope.$apply();

        expect($rootScope.obj).toEqual({value: 'initial'});
        expect(componentScope.owRef).toEqual({value: 'initial'});
        expect(componentScope.owRefAlias).toBe(componentScope.owRef);
        expect(componentScope.$owRefAlias).toBe(componentScope.owRef);

        // This changes in both scopes because of reference
        $rootScope.obj.value = 'origin1';
        $rootScope.$apply();
        expect(componentScope.owRef.value).toBe('origin1');
        expect(componentScope.owRefAlias.value).toBe('origin1');
        expect(componentScope.$owRefAlias.value).toBe('origin1');

        componentScope.owRef = {value: 'isolate1'};
        componentScope.$apply();
        expect($rootScope.obj.value).toBe('origin1');

        // Change does not propagate because object identity hasn't changed
        $rootScope.obj.value = 'origin2';
        $rootScope.$apply();
        expect(componentScope.owRef.value).toBe('isolate1');
        expect(componentScope.owRefAlias.value).toBe('origin2');
        expect(componentScope.$owRefAlias.value).toBe('origin2');

        // Change does propagate because object identity changes
        $rootScope.obj = {value: 'origin3'};
        $rootScope.$apply();
        expect(componentScope.owRef.value).toBe('origin3');
        expect(componentScope.owRef).toBe($rootScope.obj);
        expect(componentScope.owRefAlias).toBe($rootScope.obj);
        expect(componentScope.$owRefAlias).toBe($rootScope.obj);
      }));

      test('should update isolate when both change', angular.mock.inject(function() {
        compile('<div><span my-component ow-ref="name" $ow-ref$="name">');

        $rootScope.name = {mark:123};
        componentScope.owRef = 'misko';

        $rootScope.$apply();
        expect($rootScope.name).toEqual({mark:123});
        expect(componentScope.owRef).toBe($rootScope.name);
        expect(componentScope.owRefAlias).toBe($rootScope.name);
        expect(componentScope.$owRefAlias).toBe($rootScope.name);

        $rootScope.name = 'igor';
        componentScope.owRef = {};
        $rootScope.$apply();
        expect($rootScope.name).toEqual('igor');
        expect(componentScope.owRef).toBe($rootScope.name);
        expect(componentScope.owRefAlias).toBe($rootScope.name);
        expect(componentScope.$owRefAlias).toBe($rootScope.name);
      }));

      describe('initialization', () => {
        var component;
        var log;

         beforeEach(() => {
          log = [];
          angular.module('owComponentTest', [])
            .component('owComponent', {
              bindings: { input: '<' },
              controller() {
                component = this;
                this.input = 'constructor';
                log.push('constructor');

                this.$onInit = function() {
                  this.input = '$onInit';
                  log.push('$onInit');
                };

                this.$onChanges = function(changes) {
                  if (changes.input) {
                    log.push(['$onChanges', angular.copy(changes.input)]);
                  }
                };
              }
            });
        });

        test('should not update isolate again after $onInit if outer has not changed', () => {
          angular.mock.module('owComponentTest');
          angular.mock.inject(function() {
            $rootScope.name = 'outer';
            compile('<ow-component input="name"></ow-component>');

            expect($rootScope.name).toEqual('outer');
            expect(component.input).toEqual('$onInit');

            $rootScope.$digest();

            expect($rootScope.name).toEqual('outer');
            expect(component.input).toEqual('$onInit');

            expect(log).toEqual([
              'constructor',
              ['$onChanges', expect.objectContaining({ currentValue: 'outer' })],
              '$onInit'
            ]);
          });
        });

        test('should not update isolate again after $onInit if outer object reference has not changed', () => {
          angular.mock.module('owComponentTest');
          angular.mock.inject(function() {
            $rootScope.name = ['outer'];
            compile('<ow-component input="name"></ow-component>');

            expect($rootScope.name).toEqual(['outer']);
            expect(component.input).toEqual('$onInit');

            $rootScope.name[0] = 'inner';
            $rootScope.$digest();

            expect($rootScope.name).toEqual(['inner']);
            expect(component.input).toEqual('$onInit');

            expect(log).toEqual([
              'constructor',
              ['$onChanges', expect.objectContaining({ currentValue: ['outer'] })],
              '$onInit'
            ]);
          });
        });

        test('should update isolate again after $onInit if outer object reference changes even if equal', () => {
          angular.mock.module('owComponentTest');
          angular.mock.inject(function() {
            $rootScope.name = ['outer'];
            compile('<ow-component input="name"></ow-component>');

            expect($rootScope.name).toEqual(['outer']);
            expect(component.input).toEqual('$onInit');

            $rootScope.name = ['outer'];
            $rootScope.$digest();

            expect($rootScope.name).toEqual(['outer']);
            expect(component.input).toEqual(['outer']);

            expect(log).toEqual([
              'constructor',
              ['$onChanges', expect.objectContaining({ currentValue: ['outer'] })],
              '$onInit',
              ['$onChanges', expect.objectContaining({ previousValue: ['outer'], currentValue: ['outer'] })]
            ]);
          });
        });

        test('should not update isolate again after $onInit if outer is a literal', () => {
          angular.mock.module('owComponentTest');
          angular.mock.inject(function() {
            $rootScope.name = 'outer';
            compile('<ow-component input="[name]"></ow-component>');

            expect(component.input).toEqual('$onInit');

            // No outer change
            $rootScope.$apply('name = "outer"');
            expect(component.input).toEqual('$onInit');

            // Outer change
            $rootScope.$apply('name = "re-outer"');
            expect(component.input).toEqual(['re-outer']);

            expect(log).toEqual([
              'constructor',
              [
                '$onChanges',
                expect.objectContaining({currentValue: ['outer']})
              ],
              '$onInit',
              [
                '$onChanges',
                expect.objectContaining({previousValue: ['outer'], currentValue: ['re-outer']})
              ]
            ]);
          });
        });

        test('should update isolate again after $onInit if outer has changed (before initial watchAction call)', () => {
          angular.mock.module('owComponentTest');
          angular.mock.inject(function() {
            $rootScope.name = 'outer1';
            compile('<ow-component input="name"></ow-component>');

            expect(component.input).toEqual('$onInit');
            $rootScope.$apply('name = "outer2"');

            expect($rootScope.name).toEqual('outer2');
            expect(component.input).toEqual('outer2');
            expect(log).toEqual([
              'constructor',
              ['$onChanges', expect.objectContaining({ currentValue: 'outer1' })],
              '$onInit',
              ['$onChanges', expect.objectContaining({ currentValue: 'outer2', previousValue: 'outer1' })]
            ]);
          });
        });

        test('should update isolate again after $onInit if outer has changed (before initial watchAction call)', () => {
          angular.module('owComponentTest')
            .directive('changeInput', function() {
              return function(scope, elem, attrs) {
                scope.name = 'outer2';
              };
            });
          angular.mock.module('owComponentTest');
          angular.mock.inject(function() {
            $rootScope.name = 'outer1';
            compile('<ow-component input="name" change-input></ow-component>');

            expect(component.input).toEqual('$onInit');
            $rootScope.$digest();

            expect($rootScope.name).toEqual('outer2');
            expect(component.input).toEqual('outer2');
            expect(log).toEqual([
              'constructor',
              ['$onChanges', expect.objectContaining({ currentValue: 'outer1' })],
              '$onInit',
              ['$onChanges', expect.objectContaining({ currentValue: 'outer2', previousValue: 'outer1' })]
            ]);
          });
        });
      });

      test('should not break when isolate and origin both change to the same value', angular.mock.inject(function() {
        $rootScope.name = 'aaa';
        compile('<div><span my-component ow-ref="name">');

        //change both sides to the same item within the same digest cycle
        componentScope.owRef = 'same';
        $rootScope.name = 'same';
        $rootScope.$apply();

        //change origin back to its previous value
        $rootScope.name = 'aaa';
        $rootScope.$apply();

        expect($rootScope.name).toBe('aaa');
        expect(componentScope.owRef).toBe('aaa');
      }));


      test('should not update origin when identity of isolate changes', angular.mock.inject(function() {
        $rootScope.name = {mark:123};
        compile('<div><span my-component ow-ref="name" $ow-ref$="name">');

        expect($rootScope.name).toEqual({mark:123});
        expect(componentScope.owRef).toBe($rootScope.name);
        expect(componentScope.owRefAlias).toBe($rootScope.name);
        expect(componentScope.$owRefAlias).toBe($rootScope.name);

        componentScope.owRef = 'martin';
        $rootScope.$apply();
        expect($rootScope.name).toEqual({mark: 123});
        expect(componentScope.owRef).toBe('martin');
        expect(componentScope.owRefAlias).toEqual({mark: 123});
        expect(componentScope.$owRefAlias).toEqual({mark: 123});
      }));


      test('should update origin when property of isolate object reference changes', angular.mock.inject(function() {
        $rootScope.obj = {mark:123};
        compile('<div><span my-component ow-ref="obj">');

        expect($rootScope.obj).toEqual({mark:123});
        expect(componentScope.owRef).toBe($rootScope.obj);

        componentScope.owRef.mark = 789;
        $rootScope.$apply();
        expect($rootScope.obj).toEqual({mark: 789});
        expect(componentScope.owRef).toBe($rootScope.obj);
      }));


      test('should not throw on non assignable expressions in the parent', angular.mock.inject(function() {
        compile('<div><span my-component ow-ref="\'hello \' + name">');

        $rootScope.name = 'world';
        $rootScope.$apply();
        expect(componentScope.owRef).toBe('hello world');

        componentScope.owRef = 'ignore me';
        expect(componentScope.owRef).toBe('ignore me');
        expect($rootScope.name).toBe('world');

        $rootScope.name = 'misko';
        $rootScope.$apply();
        expect(componentScope.owRef).toBe('hello misko');
      }));


      test('should not throw when assigning to undefined', angular.mock.inject(function() {
        compile('<div><span my-component>');

        expect(componentScope.owRef).toBeUndefined();

        componentScope.owRef = 'ignore me';
        expect(componentScope.owRef).toBe('ignore me');

        $rootScope.$apply();
        expect(componentScope.owRef).toBe('ignore me');
      }));


      test('should update isolate scope when "<"-bound NaN changes', angular.mock.inject(function() {
        $rootScope.num = NaN;
        compile('<div my-component ow-ref="num"></div>');

        var isolateScope = element.isolateScope();
        expect(isolateScope.owRef).toBeNaN();

        $rootScope.num = 64;
        $rootScope.$apply();
        expect(isolateScope.owRef).toBe(64);
      }));


      describe('literal objects', () => {
        test('should copy parent changes', angular.mock.inject(function() {
          compile('<div><span my-component ow-ref="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          expect(componentScope.owRef).toEqual({name: 'a'});

          $rootScope.name = 'b';
          $rootScope.$apply();
          expect(componentScope.owRef).toEqual({name: 'b'});
        }));


        test('should not change the isolated scope when origin does not change', angular.mock.inject(function() {
          compile('<div><span my-component ref="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          var lastComponentValue = componentScope.owRef;
          $rootScope.$apply();
          expect(componentScope.owRef).toBe(lastComponentValue);
        }));


        test('should watch input values to array literals', angular.mock.inject(function() {
          $rootScope.name = 'georgios';
          $rootScope.obj = {name: 'pete'};
          compile('<div><span my-component ow-ref="[{name: name}, obj]">');

          expect(componentScope.owRef).toEqual([{name: 'georgios'}, {name: 'pete'}]);

          $rootScope.name = 'lucas';
          $rootScope.obj = {name: 'martin'};
          $rootScope.$apply();
          expect(componentScope.owRef).toEqual([{name: 'lucas'}, {name: 'martin'}]);
        }));


        test('should watch input values object literals', angular.mock.inject(function() {
          $rootScope.name = 'georgios';
          $rootScope.obj = {name: 'pete'};
          compile('<div><span my-component ow-ref="{name: name, item: obj}">');

          expect(componentScope.owRef).toEqual({name: 'georgios', item: {name: 'pete'}});

          $rootScope.name = 'lucas';
          $rootScope.obj = {name: 'martin'};
          $rootScope.$apply();
          expect(componentScope.owRef).toEqual({name: 'lucas', item: {name: 'martin'}});
        }));


        // https://github.com/angular/angular.js/issues/15833
        test('should work with ng-model inputs', () => {
          var componentScope;

          angular.mock.module(function($compileProvider) {
            $compileProvider.directive('undi', function() {
              return {
                restrict: 'A',
                scope: {
                  undi: '<'
                },
                link($scope) { componentScope = $scope; }
              };
            });
          });

          angular.mock.inject(function($compile, $rootScope) {
            element = $compile('<form name="f" undi="[f.i]"><input name="i" ng-model="a"/></form>')($rootScope);
            $rootScope.$apply();
            expect(componentScope.undi).toBeDefined();
          });
        });


        test('should not complain when the isolated scope changes', angular.mock.inject(function() {
          compile('<div><span my-component ow-ref="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          componentScope.owRef = {name: 'b'};
          componentScope.$apply();

          expect(componentScope.owRef).toEqual({name: 'b'});
          expect($rootScope.name).toBe('a');

          $rootScope.name = 'c';
          $rootScope.$apply();
          expect(componentScope.owRef).toEqual({name: 'c'});
        }));

        test('should work for primitive literals', angular.mock.inject(function() {
          test('1', 1);
          test('null', null);
          test('undefined', undefined);
          test('\'someString\'', 'someString');
          test('true', true);

          function test(literalString, literalValue) {
            compile('<div><span my-component ow-ref="' + literalString + '">');

            expect(componentScope.owRef).toBe(literalValue);
            dealoc(element);
          }
        }));

        describe('optional one-way binding', () => {
          test('should update local when origin changes', angular.mock.inject(function() {
            compile('<div><span my-component ow-optref="name" $ow-optref$="name">');

            expect(componentScope.owOptref).toBeUndefined();
            expect(componentScope.owOptrefAlias).toBe(componentScope.owOptref);
            expect(componentScope.$owOptrefAlias).toBe(componentScope.owOptref);

            $rootScope.name = 'misko';
            $rootScope.$apply();
            expect(componentScope.owOptref).toBe($rootScope.name);
            expect(componentScope.owOptrefAlias).toBe($rootScope.name);
            expect(componentScope.$owOptrefAlias).toBe($rootScope.name);

            $rootScope.name = {};
            $rootScope.$apply();
            expect(componentScope.owOptref).toBe($rootScope.name);
            expect(componentScope.owOptrefAlias).toBe($rootScope.name);
            expect(componentScope.$owOptrefAlias).toBe($rootScope.name);
          }));

          test('should not throw exception when reference does not exist', angular.mock.inject(function() {
            compile('<div><span my-component>');

            expect(componentScope.owOptref).toBeUndefined();
            expect(componentScope.owOptrefAlias).toBeUndefined();
            expect(componentScope.$owOptrefAlias).toBeUndefined();
          }));
        });
      });
    });

    describe('one-way collection bindings', () => {
      test('should update isolate scope when origin scope changes', angular.mock.inject(function() {
        $rootScope.collection = [{
          name: 'Gabriel',
          value: 18
        }, {
          name: 'Tony',
          value: 91
        }];
        $rootScope.query = '';
        $rootScope.$apply();

        compile('<div><span my-component ow-colref="collection | filter:query" $ow-colref$="collection | filter:query">');

        expect(componentScope.owColref).toEqual($rootScope.collection);
        expect(componentScope.owColrefAlias).toEqual(componentScope.owColref);
        expect(componentScope.$owColrefAlias).toEqual(componentScope.owColref);

        $rootScope.query = 'Gab';
        $rootScope.$apply();

        expect(componentScope.owColref).toEqual([$rootScope.collection[0]]);
        expect(componentScope.owColrefAlias).toEqual([$rootScope.collection[0]]);
        expect(componentScope.$owColrefAlias).toEqual([$rootScope.collection[0]]);
      }));

      test('should not update isolate scope when deep state within origin scope changes', angular.mock.inject(function() {
        $rootScope.collection = [{
          name: 'Gabriel',
          value: 18
        }, {
          name: 'Tony',
          value: 91
        }];
        $rootScope.$apply();

        compile('<div><span my-component ow-colref="collection" $ow-colref$="collection">');

        expect(componentScope.owColref).toEqual($rootScope.collection);
        expect(componentScope.owColrefAlias).toEqual(componentScope.owColref);
        expect(componentScope.$owColrefAlias).toEqual(componentScope.owColref);

        componentScope.owColref = componentScope.owColrefAlias = componentScope.$owColrefAlias = undefined;
        $rootScope.collection[0].name = 'Joe';
        $rootScope.$apply();

        expect(componentScope.owColref).toBeUndefined();
        expect(componentScope.owColrefAlias).toBeUndefined();
        expect(componentScope.$owColrefAlias).toBeUndefined();
      }));

      test('should update isolate scope when origin scope changes', angular.mock.inject(function() {
        $rootScope.gab = {
          name: 'Gabriel',
          value: 18
        };
        $rootScope.tony = {
          name: 'Tony',
          value: 91
        };
        $rootScope.query = '';
        $rootScope.$apply();

        compile('<div><span my-component ow-colref="[gab, tony] | filter:query" $ow-colref$="[gab, tony] | filter:query">');

        expect(componentScope.owColref).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.$owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);

        $rootScope.query = 'Gab';
        $rootScope.$apply();

        expect(componentScope.owColref).toEqual([$rootScope.gab]);
        expect(componentScope.owColrefAlias).toEqual([$rootScope.gab]);
        expect(componentScope.$owColrefAlias).toEqual([$rootScope.gab]);
      }));

      test('should update isolate scope when origin literal object content changes', angular.mock.inject(function() {
        $rootScope.gab = {
          name: 'Gabriel',
          value: 18
        };
        $rootScope.tony = {
          name: 'Tony',
          value: 91
        };
        $rootScope.$apply();

        compile('<div><span my-component ow-colref="[gab, tony]" $ow-colref$="[gab, tony]">');

        expect(componentScope.owColref).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.$owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);

        $rootScope.tony = {
          name: 'Bob',
          value: 42
        };
        $rootScope.$apply();

        expect(componentScope.owColref).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.$owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);
      }));
    });

    describe('executable expression', () => {
      test('should allow expression execution with locals', angular.mock.inject(function() {
        compile('<div><span my-component expr="count = count + offset" $expr$="count = count + offset">');
        $rootScope.count = 2;

        expect(typeof componentScope.expr).toBe('function');
        expect(typeof componentScope.exprAlias).toBe('function');
        expect(typeof componentScope.$exprAlias).toBe('function');

        expect(componentScope.expr({offset: 1})).toEqual(3);
        expect($rootScope.count).toEqual(3);

        expect(componentScope.exprAlias({offset: 10})).toEqual(13);
        expect(componentScope.$exprAlias({offset: 10})).toEqual(23);
        expect($rootScope.count).toEqual(23);
      }));
    });

    test('should throw on unknown definition', angular.mock.inject(function() {
      expect(function() {
        compile('<div><span bad-declaration>');
      }).toThrowMinErr('$compile', 'iscp', 'Invalid isolate scope definition for directive \'badDeclaration\'. Definition: {... attr: \'xxx\' ...}');
    }));

    test('should expose a $$isolateBindings property onto the scope', angular.mock.inject(function() {
      compile('<div><span my-component>');

      expect(typeof componentScope.$$isolateBindings).toBe('object');

      expect(componentScope.$$isolateBindings.attr.mode).toBe('@');
      expect(componentScope.$$isolateBindings.attr.attrName).toBe('attr');
      expect(componentScope.$$isolateBindings.attrAlias.attrName).toBe('attr');
      expect(componentScope.$$isolateBindings.$attrAlias.attrName).toBe('$attr$');
      expect(componentScope.$$isolateBindings.ref.mode).toBe('=');
      expect(componentScope.$$isolateBindings.ref.attrName).toBe('ref');
      expect(componentScope.$$isolateBindings.refAlias.attrName).toBe('ref');
      expect(componentScope.$$isolateBindings.$refAlias.attrName).toBe('$ref$');
      expect(componentScope.$$isolateBindings.reference.mode).toBe('=');
      expect(componentScope.$$isolateBindings.reference.attrName).toBe('reference');
      expect(componentScope.$$isolateBindings.owRef.mode).toBe('<');
      expect(componentScope.$$isolateBindings.owRef.attrName).toBe('owRef');
      expect(componentScope.$$isolateBindings.owRefAlias.attrName).toBe('owRef');
      expect(componentScope.$$isolateBindings.$owRefAlias.attrName).toBe('$owRef$');
      expect(componentScope.$$isolateBindings.expr.mode).toBe('&');
      expect(componentScope.$$isolateBindings.expr.attrName).toBe('expr');
      expect(componentScope.$$isolateBindings.exprAlias.attrName).toBe('expr');
      expect(componentScope.$$isolateBindings.$exprAlias.attrName).toBe('$expr$');

      var firstComponentScope = componentScope;
      var first$$isolateBindings = componentScope.$$isolateBindings;

      dealoc(element);
      compile('<div><span my-component>');
      expect(componentScope).not.toBe(firstComponentScope);
      expect(componentScope.$$isolateBindings).toBe(first$$isolateBindings);
    }));


    test('should expose isolate scope variables on controller with controllerAs when bindToController is true (template)', () => {
      var controllerCalled = false;
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          template: '<p>isolate</p>',
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controller($scope) {
            this.$onInit = function() {
              expect(this.data).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.oneway).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
            };
            controllerCalled = true;
          },
          controllerAs: 'test',
          bindToController: true
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = $compile('<div foo-dir dir-data="remoteData" ' +
                                'dir-str="Hello, {{whom}}!" ' +
                                'dir-fn="fn()"></div>')($rootScope);
        expect(controllerCalled).toBe(true);
      });
    });


    test('should not pre-assign bound properties to the controller', () => {
      var controllerCalled = false;
      var onInitCalled = false;
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          template: '<p>isolate</p>',
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controller($scope) {
            expect(this.data).toBeUndefined();
            expect(this.oneway).toBeUndefined();
            expect(this.str).toBeUndefined();
            expect(this.fn).toBeUndefined();
            controllerCalled = true;
            this.$onInit = function() {
              expect(this.data).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.oneway).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
              onInitCalled = true;
            };
          },
          controllerAs: 'test',
          bindToController: true
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = $compile('<div foo-dir dir-data="remoteData" ' +
                                'dir-str="Hello, {{whom}}!" ' +
                                'dir-fn="fn()"></div>')($rootScope);
        expect(controllerCalled).toBe(true);
        expect(onInitCalled).toBe(true);
      });
    });

    test('should eventually expose isolate scope variables on ES6 class controller with controllerAs when bindToController is true', () => {
      if (!support.classes) return;
      var controllerCalled = false;
      // eslint-disable-next-line no-eval
      var Controller = eval('(\n' +
        'class Foo {\n' +
        '  constructor($scope) {}\n' +
        '  $onInit() {\n' +
        '    expect(this.data).toEqualData({\n' +
        '      \'foo\': \'bar\',\n' +
        '      \'baz\': \'biz\'\n' +
        '    });\n' +
        '    expect(this.oneway).toEqualData({\n' +
        '      \'foo\': \'bar\',\n' +
        '      \'baz\': \'biz\'\n' +
        '    });\n' +
        '    expect(this.str).toBe(\'Hello, world!\');\n' +
        '    expect(this.fn()).toBe(\'called!\');\n' +
        '    controllerCalled = true;\n' +
        '  }\n' +
        '}\n' +
        ')');
      jest.spyOn(Controller.prototype, '$onInit');

      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          template: '<p>isolate</p>',
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controller: Controller,
          controllerAs: 'test',
          bindToController: true
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = $compile('<div foo-dir dir-data="remoteData" ' +
                                'dir-str="Hello, {{whom}}!" ' +
                                'dir-fn="fn()"></div>')($rootScope);
        expect(Controller.prototype.$onInit).toHaveBeenCalled();
        expect(controllerCalled).toBe(true);
      });
    });


    test('should update @-bindings on controller when bindToController and attribute change observed', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('atBinding', ngInternals.valueFn({
          template: '<p>{{At.text}}</p>',
          scope: {
            text: '@atBinding'
          },
          controller($scope) {},
          bindToController: true,
          controllerAs: 'At'
        }));
      });

      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div at-binding="Test: {{text}}"></div>')($rootScope);
        var p = element.find('p');
        $rootScope.$digest();
        expect(p.text()).toBe('Test: ');

        $rootScope.text = 'Kittens';
        $rootScope.$digest();
        expect(p.text()).toBe('Test: Kittens');
      });
    });


    test('should expose isolate scope variables on controller with controllerAs when bindToController is true (templateUrl)', () => {
      var controllerCalled = false;
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          templateUrl: 'test.html',
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controller($scope) {
            this.$onInit = function() {
              expect(this.data).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.oneway).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
            };
            controllerCalled = true;
          },
          controllerAs: 'test',
          bindToController: true
        }));
      });
      angular.mock.inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('test.html', '<p>isolate</p>');
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = $compile('<div foo-dir dir-data="remoteData" ' +
                                'dir-str="Hello, {{whom}}!" ' +
                                'dir-fn="fn()"></div>')($rootScope);
        $rootScope.$digest();
        expect(controllerCalled).toBe(true);
      });
    });


    test('should throw noctrl when missing controller', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('noCtrl', ngInternals.valueFn({
          templateUrl: 'test.html',
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controllerAs: 'test',
          bindToController: true
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        expect(function() {
          $compile('<div no-ctrl>')($rootScope);
        }).toThrowMinErr('$compile', 'noctrl',
            'Cannot bind to controller without directive \'noCtrl\'s controller.');
      });
    });


    test('should throw badrestrict on first compilation when restrict is invalid', () => {
      angular.mock.module(function($compileProvider, $exceptionHandlerProvider) {
        $compileProvider.directive('invalidRestrictBadString', ngInternals.valueFn({restrict: '"'}));
        $compileProvider.directive('invalidRestrictTrue', ngInternals.valueFn({restrict: true}));
        $compileProvider.directive('invalidRestrictObject', ngInternals.valueFn({restrict: {}}));
        $compileProvider.directive('invalidRestrictNumber', ngInternals.valueFn({restrict: 42}));

        // We need to test with the exceptionHandler not rethrowing...
        $exceptionHandlerProvider.mode('log');
      });

      angular.mock.inject(function($exceptionHandler, $compile, $rootScope) {
        $compile('<div invalid-restrict-true>')($rootScope);
        expect($exceptionHandler.errors.length).toBe(1);
        expect($exceptionHandler.errors[0].toString()).toMatch(/\$compile.*badrestrict.*'true'/);

        $compile('<div invalid-restrict-bad-string>')($rootScope);
        $compile('<div invalid-restrict-bad-string>')($rootScope);
        expect($exceptionHandler.errors.length).toBe(2);
        expect($exceptionHandler.errors[1].toString()).toMatch(/\$compile.*badrestrict.*'"'/);

        $compile('<div invalid-restrict-bad-string invalid-restrict-object>')($rootScope);
        expect($exceptionHandler.errors.length).toBe(3);
        expect($exceptionHandler.errors[2].toString()).toMatch(/\$compile.*badrestrict.*'{}'/);

        $compile('<div invalid-restrict-object invalid-restrict-number>')($rootScope);
        expect($exceptionHandler.errors.length).toBe(4);
        expect($exceptionHandler.errors[3].toString()).toMatch(/\$compile.*badrestrict.*'42'/);
      });
    });


    describe('should bind to controller via object notation', () => {
      var controllerOptions = [{
          description: 'no controller identifier',
          controller: 'myCtrl'
        }, {
          description: '"Ctrl as ident" syntax',
          controller: 'myCtrl as myCtrl'
        }, {
          description: 'controllerAs setting',
          controller: 'myCtrl',
          controllerAs: 'myCtrl'
        }];

      var scopeOptions = [{
        description: 'isolate scope',
        scope: {}
      }, {
        description: 'new scope',
        scope: true
      }, {
        description: 'no scope',
        scope: false
      }];

      var templateOptions = [{
        description: 'inline template',
        template: '<p>template</p>'
      }, {
        description: 'templateUrl setting',
        templateUrl: 'test.html'
      }, {
        description: 'no template'
      }];

      angular.forEach(controllerOptions, function(controllerOption) {
        angular.forEach(scopeOptions, function(scopeOption) {
          angular.forEach(templateOptions, function(templateOption) {
            var description = [];

            var ddo = {
              bindToController: {
                'data': '=dirData',
                'oneway': '<dirData',
                'str': '@dirStr',
                'fn': '&dirFn'
              }
            };

            angular.forEach([controllerOption, scopeOption, templateOption], function(option) {
              description.push(option.description);
              delete option.description;
              angular.extend(ddo, option);
            });

            test('(' + description.join(', ') + ')', () => {
              var controllerCalled = false;
              angular.mock.module(function($compileProvider, $controllerProvider) {
                $controllerProvider.register('myCtrl', function() {
                  this.$onInit = function() {
                    expect(this.data).toEqualData({
                      'foo': 'bar',
                      'baz': 'biz'
                    });
                    expect(this.oneway).toEqualData({
                      'foo': 'bar',
                      'baz': 'biz'
                    });
                    expect(this.str).toBe('Hello, world!');
                    expect(this.fn()).toBe('called!');
                  };
                  controllerCalled = true;
                });
                $compileProvider.directive('fooDir', ngInternals.valueFn(ddo));
              });
              angular.mock.inject(function($compile, $rootScope, $templateCache) {
                $templateCache.put('test.html', '<p>template</p>');
                $rootScope.fn = ngInternals.valueFn('called!');
                $rootScope.whom = 'world';
                $rootScope.remoteData = {
                  'foo': 'bar',
                  'baz': 'biz'
                };
                element = $compile('<div foo-dir dir-data="remoteData" ' +
                                  'dir-str="Hello, {{whom}}!" ' +
                                  'dir-fn="fn()"></div>')($rootScope);
                $rootScope.$digest();
                expect(controllerCalled).toBe(true);
                if (ddo.controllerAs || ddo.controller.includes(' as ')) {
                  if (ddo.scope) {
                    expect($rootScope.myCtrl).toBeUndefined();
                  } else {
                    // The controller identifier was added to the containing scope.
                    expect($rootScope.myCtrl).toBeDefined();
                  }
                }
              });
            });
          });
        });
      });
    });


    test('should bind to multiple directives controllers via object notation (no scope)', () => {
      var controller1Called = false;
      var controller2Called = false;
      angular.mock.module(function($compileProvider, $controllerProvider) {
        $compileProvider.directive('foo', ngInternals.valueFn({
          bindToController: {
            'data': '=fooData',
            'oneway': '<fooData',
            'str': '@fooStr',
            'fn': '&fooFn'
          },
          controllerAs: 'fooCtrl',
          controller() {
            this.$onInit = function() {
              expect(this.data).toEqualData({'foo': 'bar', 'baz': 'biz'});
              expect(this.oneway).toEqualData({'foo': 'bar', 'baz': 'biz'});
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
            };
            controller1Called = true;
          }
        }));
        $compileProvider.directive('bar', ngInternals.valueFn({
          bindToController: {
            'data': '=barData',
            'oneway': '<barData',
            'str': '@barStr',
            'fn': '&barFn'
          },
          controllerAs: 'barCtrl',
          controller() {
            this.$onInit = function() {
              expect(this.data).toEqualData({'foo2': 'bar2', 'baz2': 'biz2'});
              expect(this.oneway).toEqualData({'foo2': 'bar2', 'baz2': 'biz2'});
              expect(this.str).toBe('Hello, second world!');
              expect(this.fn()).toBe('second called!');
            };
            controller2Called = true;
          }
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.string = 'world';
        $rootScope.data = {'foo': 'bar','baz': 'biz'};
        $rootScope.fn2 = ngInternals.valueFn('second called!');
        $rootScope.string2 = 'second world';
        $rootScope.data2 = {'foo2': 'bar2', 'baz2': 'biz2'};
        element = $compile(
          '<div ' +
            'foo ' +
            'foo-data="data" ' +
            'foo-str="Hello, {{string}}!" ' +
            'foo-fn="fn()" ' +
            'bar ' +
            'bar-data="data2" ' +
            'bar-str="Hello, {{string2}}!" ' +
            'bar-fn="fn2()" > ' +
          '</div>')($rootScope);
        $rootScope.$digest();
        expect(controller1Called).toBe(true);
        expect(controller2Called).toBe(true);
      });
    });


    test('should bind to multiple directives controllers via object notation (new iso scope)', () => {
      var controller1Called = false;
      var controller2Called = false;
      angular.mock.module(function($compileProvider, $controllerProvider) {
        $compileProvider.directive('foo', ngInternals.valueFn({
          bindToController: {
            'data': '=fooData',
            'oneway': '<fooData',
            'str': '@fooStr',
            'fn': '&fooFn'
          },
          scope: {},
          controllerAs: 'fooCtrl',
          controller() {
            this.$onInit = function() {
              expect(this.data).toEqualData({'foo': 'bar', 'baz': 'biz'});
              expect(this.oneway).toEqualData({'foo': 'bar', 'baz': 'biz'});
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
            };
            controller1Called = true;
          }
        }));
        $compileProvider.directive('bar', ngInternals.valueFn({
          bindToController: {
            'data': '=barData',
            'oneway': '<barData',
            'str': '@barStr',
            'fn': '&barFn'
          },
          controllerAs: 'barCtrl',
          controller() {
            this.$onInit = function() {
              expect(this.data).toEqualData({'foo2': 'bar2', 'baz2': 'biz2'});
              expect(this.oneway).toEqualData({'foo2': 'bar2', 'baz2': 'biz2'});
              expect(this.str).toBe('Hello, second world!');
              expect(this.fn()).toBe('second called!');
            };
            controller2Called = true;
          }
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.string = 'world';
        $rootScope.data = {'foo': 'bar','baz': 'biz'};
        $rootScope.fn2 = ngInternals.valueFn('second called!');
        $rootScope.string2 = 'second world';
        $rootScope.data2 = {'foo2': 'bar2', 'baz2': 'biz2'};
        element = $compile(
          '<div ' +
            'foo ' +
            'foo-data="data" ' +
            'foo-str="Hello, {{string}}!" ' +
            'foo-fn="fn()" ' +
            'bar ' +
            'bar-data="data2" ' +
            'bar-str="Hello, {{string2}}!" ' +
            'bar-fn="fn2()" > ' +
          '</div>')($rootScope);
        $rootScope.$digest();
        expect(controller1Called).toBe(true);
        expect(controller2Called).toBe(true);
      });
    });


    test('should bind to multiple directives controllers via object notation (new scope)', () => {
      var controller1Called = false;
      var controller2Called = false;
      angular.mock.module(function($compileProvider, $controllerProvider) {
        $compileProvider.directive('foo', ngInternals.valueFn({
          bindToController: {
            'data': '=fooData',
            'oneway': '<fooData',
            'str': '@fooStr',
            'fn': '&fooFn'
          },
          scope: true,
          controllerAs: 'fooCtrl',
          controller() {
            this.$onInit = function() {
              expect(this.data).toEqualData({'foo': 'bar', 'baz': 'biz'});
              expect(this.oneway).toEqualData({'foo': 'bar', 'baz': 'biz'});
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
            };
            controller1Called = true;
          }
        }));
        $compileProvider.directive('bar', ngInternals.valueFn({
          bindToController: {
            'data': '=barData',
            'oneway': '<barData',
            'str': '@barStr',
            'fn': '&barFn'
          },
          scope: true,
          controllerAs: 'barCtrl',
          controller() {
            this.$onInit = function() {
              expect(this.data).toEqualData({'foo2': 'bar2', 'baz2': 'biz2'});
              expect(this.oneway).toEqualData({'foo2': 'bar2', 'baz2': 'biz2'});
              expect(this.str).toBe('Hello, second world!');
              expect(this.fn()).toBe('second called!');
            };
            controller2Called = true;
          }
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.string = 'world';
        $rootScope.data = {'foo': 'bar','baz': 'biz'};
        $rootScope.fn2 = ngInternals.valueFn('second called!');
        $rootScope.string2 = 'second world';
        $rootScope.data2 = {'foo2': 'bar2', 'baz2': 'biz2'};
        element = $compile(
          '<div ' +
            'foo ' +
            'foo-data="data" ' +
            'foo-str="Hello, {{string}}!" ' +
            'foo-fn="fn()" ' +
            'bar ' +
            'bar-data="data2" ' +
            'bar-str="Hello, {{string2}}!" ' +
            'bar-fn="fn2()" > ' +
          '</div>')($rootScope);
        $rootScope.$digest();
        expect(controller1Called).toBe(true);
        expect(controller2Called).toBe(true);
      });
    });


    test('should evaluate against the correct scope, when using `bindToController` (new scope)',
      function() {
        angular.mock.module(function($compileProvider, $controllerProvider) {
          $controllerProvider.register({
            'ParentCtrl': function() {
              this.value1 = 'parent1';
              this.value2 = 'parent2';
              this.value3 = function() { return 'parent3'; };
              this.value4 = 'parent4';
            },
            'ChildCtrl': function() {
              this.value1 = 'child1';
              this.value2 = 'child2';
              this.value3 = function() { return 'child3'; };
              this.value4 = 'child4';
            }
          });

          $compileProvider.directive('child', ngInternals.valueFn({
            scope: true,
            controller: 'ChildCtrl as ctrl',
            bindToController: {
              fromParent1: '@',
              fromParent2: '=',
              fromParent3: '&',
              fromParent4: '<'
            },
            template: ''
          }));
        });

        angular.mock.inject(function($compile, $rootScope) {
          element = $compile(
              '<div ng-controller="ParentCtrl as ctrl">' +
                '<child ' +
                    'from-parent-1="{{ ctrl.value1 }}" ' +
                    'from-parent-2="ctrl.value2" ' +
                    'from-parent-3="ctrl.value3" ' +
                    'from-parent-4="ctrl.value4">' +
                '</child>' +
              '</div>')($rootScope);
          $rootScope.$digest();

          var parentCtrl = element.controller('ngController');
          var childCtrl = element.find('child').controller('child');

          expect(childCtrl.fromParent1).toBe(parentCtrl.value1);
          expect(childCtrl.fromParent1).not.toBe(childCtrl.value1);
          expect(childCtrl.fromParent2).toBe(parentCtrl.value2);
          expect(childCtrl.fromParent2).not.toBe(childCtrl.value2);
          expect(childCtrl.fromParent3()()).toBe(parentCtrl.value3());
          expect(childCtrl.fromParent3()()).not.toBe(childCtrl.value3());
          expect(childCtrl.fromParent4).toBe(parentCtrl.value4);
          expect(childCtrl.fromParent4).not.toBe(childCtrl.value4);

          childCtrl.fromParent2 = 'modified';
          $rootScope.$digest();

          expect(parentCtrl.value2).toBe('modified');
          expect(childCtrl.value2).toBe('child2');
        });
      }
    );


    test('should evaluate against the correct scope, when using `bindToController` (new iso scope)',
      function() {
        angular.mock.module(function($compileProvider, $controllerProvider) {
          $controllerProvider.register({
            'ParentCtrl': function() {
              this.value1 = 'parent1';
              this.value2 = 'parent2';
              this.value3 = function() { return 'parent3'; };
              this.value4 = 'parent4';
            },
            'ChildCtrl': function() {
              this.value1 = 'child1';
              this.value2 = 'child2';
              this.value3 = function() { return 'child3'; };
              this.value4 = 'child4';
            }
          });

          $compileProvider.directive('child', ngInternals.valueFn({
            scope: {},
            controller: 'ChildCtrl as ctrl',
            bindToController: {
              fromParent1: '@',
              fromParent2: '=',
              fromParent3: '&',
              fromParent4: '<'
            },
            template: ''
          }));
        });

        angular.mock.inject(function($compile, $rootScope) {
          element = $compile(
              '<div ng-controller="ParentCtrl as ctrl">' +
                '<child ' +
                    'from-parent-1="{{ ctrl.value1 }}" ' +
                    'from-parent-2="ctrl.value2" ' +
                    'from-parent-3="ctrl.value3" ' +
                    'from-parent-4="ctrl.value4">' +
                '</child>' +
              '</div>')($rootScope);
          $rootScope.$digest();

          var parentCtrl = element.controller('ngController');
          var childCtrl = element.find('child').controller('child');

          expect(childCtrl.fromParent1).toBe(parentCtrl.value1);
          expect(childCtrl.fromParent1).not.toBe(childCtrl.value1);
          expect(childCtrl.fromParent2).toBe(parentCtrl.value2);
          expect(childCtrl.fromParent2).not.toBe(childCtrl.value2);
          expect(childCtrl.fromParent3()()).toBe(parentCtrl.value3());
          expect(childCtrl.fromParent3()()).not.toBe(childCtrl.value3());
          expect(childCtrl.fromParent4).toBe(parentCtrl.value4);
          expect(childCtrl.fromParent4).not.toBe(childCtrl.value4);

          childCtrl.fromParent2 = 'modified';
          $rootScope.$digest();

          expect(parentCtrl.value2).toBe('modified');
          expect(childCtrl.value2).toBe('child2');
        });
      }
    );


    test('should put controller in scope when controller identifier present but not using controllerAs', () => {
      var controllerCalled = false;
      var myCtrl;
      angular.mock.module(function($compileProvider, $controllerProvider) {
        $controllerProvider.register('myCtrl', function() {
          controllerCalled = true;
          myCtrl = this;
        });
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          templateUrl: 'test.html',
          bindToController: {},
          scope: true,
          controller: 'myCtrl as theCtrl'
        }));
      });
      angular.mock.inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('test.html', '<p>isolate</p>');
        element = $compile('<div foo-dir>')($rootScope);
        $rootScope.$digest();
        expect(controllerCalled).toBe(true);
        var childScope = element.children().scope();
        expect(childScope).not.toBe($rootScope);
        expect(childScope.theCtrl).toBe(myCtrl);
      });
    });


    test('should re-install controllerAs and bindings for returned value from controller (new scope)', () => {
      var controllerCalled = false;
      var myCtrl;

      function MyCtrl() {
      }
      MyCtrl.prototype.test = function() {
        expect(this.data).toEqualData({
          'foo': 'bar',
          'baz': 'biz'
        });
        expect(this.oneway).toEqualData({
          'foo': 'bar',
          'baz': 'biz'
        });
        expect(this.str).toBe('Hello, world!');
        expect(this.fn()).toBe('called!');
      };

      angular.mock.module(function($compileProvider, $controllerProvider) {
        $controllerProvider.register('myCtrl', function() {
          controllerCalled = true;
          myCtrl = this;
          return new MyCtrl();
        });
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          templateUrl: 'test.html',
          bindToController: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          scope: true,
          controller: 'myCtrl as theCtrl'
        }));
      });
      angular.mock.inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('test.html', '<p>isolate</p>');
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = $compile('<div foo-dir dir-data="remoteData" ' +
                          'dir-str="Hello, {{whom}}!" ' +
                          'dir-fn="fn()"></div>')($rootScope);
        $rootScope.$digest();
        expect(controllerCalled).toBe(true);
        var childScope = element.children().scope();
        expect(childScope).not.toBe($rootScope);
        expect(childScope.theCtrl).not.toBe(myCtrl);
        expect(childScope.theCtrl.constructor).toBe(MyCtrl);
        childScope.theCtrl.test();
      });
    });


    test('should re-install controllerAs and bindings for returned value from controller (isolate scope)', () => {
      var controllerCalled = false;
      var myCtrl;

      function MyCtrl() {
      }
      MyCtrl.prototype.test = function() {
        expect(this.data).toEqualData({
          'foo': 'bar',
          'baz': 'biz'
        });
        expect(this.oneway).toEqualData({
          'foo': 'bar',
          'baz': 'biz'
        });
        expect(this.str).toBe('Hello, world!');
        expect(this.fn()).toBe('called!');
      };

      angular.mock.module(function($compileProvider, $controllerProvider) {
        $controllerProvider.register('myCtrl', function() {
          controllerCalled = true;
          myCtrl = this;
          return new MyCtrl();
        });
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          templateUrl: 'test.html',
          bindToController: true,
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controller: 'myCtrl as theCtrl'
        }));
      });
      angular.mock.inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('test.html', '<p>isolate</p>');
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = $compile('<div foo-dir dir-data="remoteData" ' +
        'dir-str="Hello, {{whom}}!" ' +
        'dir-fn="fn()"></div>')($rootScope);
        $rootScope.$digest();
        expect(controllerCalled).toBe(true);
        var childScope = element.children().scope();
        expect(childScope).not.toBe($rootScope);
        expect(childScope.theCtrl).not.toBe(myCtrl);
        expect(childScope.theCtrl.constructor).toBe(MyCtrl);
        childScope.theCtrl.test();
      });
    });

    describe('should not overwrite @-bound property each digest when not present', () => {
      test('when creating new scope', () => {
        angular.mock.module(function($compileProvider) {
          $compileProvider.directive('testDir', ngInternals.valueFn({
            scope: true,
            bindToController: {
              prop: '@'
            },
            controller() {
              var self = this;
              this.$onInit = function() {
                this.prop = this.prop || 'default';
              };
              this.getProp = function() {
                return self.prop;
              };
            },
            controllerAs: 'ctrl',
            template: '<p></p>'
          }));
        });
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div test-dir></div>')($rootScope);
          var scope = element.scope();
          expect(scope.ctrl.getProp()).toBe('default');

          $rootScope.$digest();
          expect(scope.ctrl.getProp()).toBe('default');
        });
      });

      test('when creating isolate scope', () => {
        angular.mock.module(function($compileProvider) {
          $compileProvider.directive('testDir', ngInternals.valueFn({
            scope: {},
            bindToController: {
              prop: '@'
            },
            controller() {
              var self = this;
              this.$onInit = function() {
                this.prop = this.prop || 'default';
              };
              this.getProp = function() {
                return self.prop;
              };
            },
            controllerAs: 'ctrl',
            template: '<p></p>'
          }));
        });
        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div test-dir></div>')($rootScope);
          var scope = element.isolateScope();
          expect(scope.ctrl.getProp()).toBe('default');

          $rootScope.$digest();
          expect(scope.ctrl.getProp()).toBe('default');
        });
      });
    });
  });

  describe('require', () => {

    test('should get required controller', () => {
      angular.mock.module(function() {
        directive('main', function(log) {
          return {
            priority: 2,
            controller() {
              this.name = 'main';
            },
            link(scope, element, attrs, controller) {
              log(controller.name);
            }
          };
        });
        directive('dep', function(log) {
          return {
            priority: 1,
            require: 'main',
            link(scope, element, attrs, controller) {
              log('dep:' + controller.name);
            }
          };
        });
        directive('other', function(log) {
          return {
            link(scope, element, attrs, controller) {
              log(!!controller); // should be false
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<div main dep other></div>')($rootScope);
        expect(log).toEqual('false; dep:main; main');
      });
    });


    test('should respect explicit return value from controller', () => {
      var expectedController;
      angular.mock.module(function() {
        directive('logControllerProp', function(log) {
          return {
            controller($scope) {
              this.foo = 'baz'; // value should not be used.
              expectedController = {foo: 'bar'};
              return expectedController;
            },
            link(scope, element, attrs, controller) {
              expect(expectedController).toBeDefined();
              expect(controller).toBe(expectedController);
              expect(controller.foo).toBe('bar');
              log('done');
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<log-controller-prop></log-controller-prop>')($rootScope);
        expect(log).toEqual('done');
        expect(element.data('$logControllerPropController')).toBe(expectedController);
      });
    });


    test('should get explicit return value of required parent controller', () => {
      var expectedController;
      angular.mock.module(function() {
        directive('nested', function(log) {
          return {
            require: '^^?nested',
            controller() {
              if (!expectedController) expectedController = {foo: 'bar'};
              return expectedController;
            },
            link(scope, element, attrs, controller) {
              if (element.parent().length) {
                expect(expectedController).toBeDefined();
                expect(controller).toBe(expectedController);
                expect(controller.foo).toBe('bar');
                log('done');
              }
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<div nested><div nested></div></div>')($rootScope);
        expect(log).toEqual('done');
        expect(element.data('$nestedController')).toBe(expectedController);
      });
    });


    test('should respect explicit controller return value when using controllerAs', () => {
      angular.mock.module(function() {
        directive('main', function() {
          return {
            templateUrl: 'main.html',
            scope: {},
            controller() {
              this.name = 'lucas';
              return {name: 'george'};
            },
            controllerAs: 'mainCtrl'
          };
        });
      });
      angular.mock.inject(function($templateCache, $compile, $rootScope) {
        $templateCache.put('main.html', '<span>template:{{mainCtrl.name}}</span>');
        element = $compile('<main/>')($rootScope);
        $rootScope.$apply();
        expect(element.text()).toBe('template:george');
      });
    });


    test('transcluded children should receive explicit return value of parent controller', () => {
      var expectedController;
      angular.mock.module(function() {
        directive('nester', ngInternals.valueFn({
          transclude: true,
          controller($transclude) {
            this.foo = 'baz';
            expectedController = {transclude:$transclude, foo: 'bar'};
            return expectedController;
          },
          link(scope, el, attr, ctrl) {
            ctrl.transclude(cloneAttach);
            function cloneAttach(clone) {
              el.append(clone);
            }
          }
        }));
        directive('nested', function(log) {
          return {
            require: '^^nester',
            link(scope, element, attrs, controller) {
              expect(controller).toBeDefined();
              expect(controller).toBe(expectedController);
              log('done');
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile) {
        element = $compile('<div nester><div nested></div></div>')($rootScope);
        $rootScope.$apply();
        expect(log.toString()).toBe('done');
        expect(element.data('$nesterController')).toBe(expectedController);
      });
    });


    test('explicit controller return values are ignored if they are primitives', () => {
      angular.mock.module(function() {
        directive('logControllerProp', function(log) {
          return {
            controller($scope) {
              this.foo = 'baz'; // value *will* be used.
              return 'bar';
            },
            link(scope, element, attrs, controller) {
              log(controller.foo);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<log-controller-prop></log-controller-prop>')($rootScope);
        expect(log).toEqual('baz');
        expect(element.data('$logControllerPropController').foo).toEqual('baz');
      });
    });


    test('should correctly assign controller return values for multiple directives', () => {
      var directiveController;
      var otherDirectiveController;
      angular.mock.module(function() {

        directive('myDirective', function(log) {
          return {
            scope: true,
            controller($scope) {
              directiveController = {
                foo: 'bar'
              };
              return directiveController;
            }
          };
        });

        directive('myOtherDirective', function(log) {
          return {
            controller($scope) {
              otherDirectiveController = {
                baz: 'luh'
              };
              return otherDirectiveController;
            }
          };
        });

      });

      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<my-directive my-other-directive></my-directive>')($rootScope);
        expect(element.data('$myDirectiveController')).toBe(directiveController);
        expect(element.data('$myOtherDirectiveController')).toBe(otherDirectiveController);
      });
    });


    test('should get required parent controller', () => {
      angular.mock.module(function() {
        directive('nested', function(log) {
          return {
            require: '^^?nested',
            controller($scope) {},
            link(scope, element, attrs, controller) {
              log(!!controller);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<div nested><div nested></div></div>')($rootScope);
        expect(log).toEqual('true; false');
      });
    });


    test('should get required parent controller when the question mark precedes the ^^', () => {
      angular.mock.module(function() {
        directive('nested', function(log) {
          return {
            require: '?^^nested',
            controller($scope) {},
            link(scope, element, attrs, controller) {
              log(!!controller);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<div nested><div nested></div></div>')($rootScope);
        expect(log).toEqual('true; false');
      });
    });


    test('should throw if required parent is not found', () => {
      angular.mock.module(function() {
        directive('nested', function() {
          return {
            require: '^^nested',
            controller($scope) {},
            link(scope, element, attrs, controller) {}
          };
        });
      });
      angular.mock.inject(function($compile, $rootScope) {
        expect(function() {
          element = $compile('<div nested></div>')($rootScope);
        }).toThrowMinErr('$compile', 'ctreq', 'Controller \'nested\', required by directive \'nested\', can\'t be found!');
      });
    });


    test('should get required controller via linkingFn (template)', () => {
      angular.mock.module(function() {
        directive('dirA', function() {
          return {
            controller() {
              this.name = 'dirA';
            }
          };
        });
        directive('dirB', function(log) {
          return {
            require: 'dirA',
            template: '<p>dirB</p>',
            link(scope, element, attrs, dirAController) {
              log('dirAController.name: ' + dirAController.name);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<div dir-a dir-b></div>')($rootScope);
        expect(log).toEqual('dirAController.name: dirA');
      });
    });


    test('should get required controller via linkingFn (templateUrl)', () => {
      angular.mock.module(function() {
        directive('dirA', function() {
          return {
            controller() {
              this.name = 'dirA';
            }
          };
        });
        directive('dirB', function(log) {
          return {
            require: 'dirA',
            templateUrl: 'dirB.html',
            link(scope, element, attrs, dirAController) {
              log('dirAController.name: ' + dirAController.name);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope, $templateCache) {
        $templateCache.put('dirB.html', '<p>dirB</p>');
        element = $compile('<div dir-a dir-b></div>')($rootScope);
        $rootScope.$digest();
        expect(log).toEqual('dirAController.name: dirA');
      });
    });

    test('should bind the required controllers to the directive controller, if provided as an object and bindToController is truthy', () => {
      var parentController;
      var siblingController;

      function ParentController() { this.name = 'Parent'; }
      function SiblingController() { this.name = 'Sibling'; }
      function MeController() { this.name = 'Me'; }
      MeController.prototype.$onInit = function() {
        parentController = this.container;
        siblingController = this.friend;
      };
      jest.spyOn(MeController.prototype, '$onInit');

      angular.module('my', [])
        .directive('me', function() {
          return {
            restrict: 'E',
            scope: {},
            require: { container: '^parent', friend: 'sibling' },
            bindToController: true,
            controller: MeController,
            controllerAs: '$ctrl'
          };
        })
        .directive('parent', function() {
          return {
            restrict: 'E',
            scope: {},
            controller: ParentController
          };
        })
        .directive('sibling', function() {
          return {
            controller: SiblingController
          };
        });

      angular.mock.module('my');
      angular.mock.inject(function($compile, $rootScope, meDirective) {
        element = $compile('<parent><me sibling></me></parent>')($rootScope);
        expect(MeController.prototype.$onInit).toHaveBeenCalled();
        expect(parentController).toEqual(expect.any(ParentController));
        expect(siblingController).toEqual(expect.any(SiblingController));
      });
    });

    test('should use the key if the name of a required controller is omitted', () => {
      function ParentController() { this.name = 'Parent'; }
      function ParentOptController() { this.name = 'ParentOpt'; }
      function ParentOrSiblingController() { this.name = 'ParentOrSibling'; }
      function ParentOrSiblingOptController() { this.name = 'ParentOrSiblingOpt'; }
      function SiblingController() { this.name = 'Sibling'; }
      function SiblingOptController() { this.name = 'SiblingOpt'; }

      angular.module('my', [])
        .component('me', {
          require: {
            parent: '^^',
            parentOpt: '?^^',
            parentOrSibling1: '^',
            parentOrSiblingOpt1: '?^',
            parentOrSibling2: '^',
            parentOrSiblingOpt2: '?^',
            sibling: '',
            siblingOpt: '?'
          }
        })
        .directive('parent', function() {
          return {controller: ParentController};
        })
        .directive('parentOpt', function() {
          return {controller: ParentOptController};
        })
        .directive('parentOrSibling1', function() {
          return {controller: ParentOrSiblingController};
        })
        .directive('parentOrSiblingOpt1', function() {
          return {controller: ParentOrSiblingOptController};
        })
        .directive('parentOrSibling2', function() {
          return {controller: ParentOrSiblingController};
        })
        .directive('parentOrSiblingOpt2', function() {
          return {controller: ParentOrSiblingOptController};
        })
        .directive('sibling', function() {
          return {controller: SiblingController};
        })
        .directive('siblingOpt', function() {
          return {controller: SiblingOptController};
        });

      angular.mock.module('my');
      angular.mock.inject(function($compile, $rootScope) {
        var template =
          '<div>' +
            // With optional
            '<parent parent-opt parent-or-sibling-1 parent-or-sibling-opt-1>' +
              '<me parent-or-sibling-2 parent-or-sibling-opt-2 sibling sibling-opt></me>' +
            '</parent>' +
            // Without optional
            '<parent parent-or-sibling-1>' +
              '<me parent-or-sibling-2 sibling></me>' +
            '</parent>' +
          '</div>';
        element = $compile(template)($rootScope);

        var ctrl1 = element.find('me').eq(0).controller('me');
        expect(ctrl1.parent).toEqual(expect.any(ParentController));
        expect(ctrl1.parentOpt).toEqual(expect.any(ParentOptController));
        expect(ctrl1.parentOrSibling1).toEqual(expect.any(ParentOrSiblingController));
        expect(ctrl1.parentOrSiblingOpt1).toEqual(expect.any(ParentOrSiblingOptController));
        expect(ctrl1.parentOrSibling2).toEqual(expect.any(ParentOrSiblingController));
        expect(ctrl1.parentOrSiblingOpt2).toEqual(expect.any(ParentOrSiblingOptController));
        expect(ctrl1.sibling).toEqual(expect.any(SiblingController));
        expect(ctrl1.siblingOpt).toEqual(expect.any(SiblingOptController));

        var ctrl2 = element.find('me').eq(1).controller('me');
        expect(ctrl2.parent).toEqual(expect.any(ParentController));
        expect(ctrl2.parentOpt).toBe(null);
        expect(ctrl2.parentOrSibling1).toEqual(expect.any(ParentOrSiblingController));
        expect(ctrl2.parentOrSiblingOpt1).toBe(null);
        expect(ctrl2.parentOrSibling2).toEqual(expect.any(ParentOrSiblingController));
        expect(ctrl2.parentOrSiblingOpt2).toBe(null);
        expect(ctrl2.sibling).toEqual(expect.any(SiblingController));
        expect(ctrl2.siblingOpt).toBe(null);
      });
    });


    test('should not bind required controllers if bindToController is falsy', () => {
      var parentController;
      var siblingController;

      function ParentController() { this.name = 'Parent'; }
      function SiblingController() { this.name = 'Sibling'; }
      function MeController() { this.name = 'Me'; }
      MeController.prototype.$onInit = function() {
        parentController = this.container;
        siblingController = this.friend;
      };
      jest.spyOn(MeController.prototype, '$onInit');

      angular.module('my', [])
        .directive('me', function() {
          return {
            restrict: 'E',
            scope: {},
            require: { container: '^parent', friend: 'sibling' },
            controller: MeController
          };
        })
        .directive('parent', function() {
          return {
            restrict: 'E',
            scope: {},
            controller: ParentController
          };
        })
        .directive('sibling', function() {
          return {
            controller: SiblingController
          };
        });

      angular.mock.module('my');
      angular.mock.inject(function($compile, $rootScope, meDirective) {
        element = $compile('<parent><me sibling></me></parent>')($rootScope);
        expect(MeController.prototype.$onInit).toHaveBeenCalled();
        expect(parentController).toBeUndefined();
        expect(siblingController).toBeUndefined();
      });
    });

    test('should bind required controllers to controller that has an explicit constructor return value', () => {
      var parentController;
      var siblingController;
      var meController;

      function ParentController() { this.name = 'Parent'; }
      function SiblingController() { this.name = 'Sibling'; }
      function MeController() {
        meController = {
          name: 'Me',
          $onInit() {
            parentController = this.container;
            siblingController = this.friend;
          }
        };
        jest.spyOn(meController, '$onInit');
        return meController;
      }

      angular.module('my', [])
        .directive('me', function() {
          return {
            restrict: 'E',
            scope: {},
            require: { container: '^parent', friend: 'sibling' },
            bindToController: true,
            controller: MeController,
            controllerAs: '$ctrl'
          };
        })
        .directive('parent', function() {
          return {
            restrict: 'E',
            scope: {},
            controller: ParentController
          };
        })
        .directive('sibling', function() {
          return {
            controller: SiblingController
          };
        });

      angular.mock.module('my');
      angular.mock.inject(function($compile, $rootScope, meDirective) {
        element = $compile('<parent><me sibling></me></parent>')($rootScope);
        expect(meController.$onInit).toHaveBeenCalled();
        expect(parentController).toEqual(expect.any(ParentController));
        expect(siblingController).toEqual(expect.any(SiblingController));
      });
    });


    test('should bind required controllers to controllers that return an explicit constructor return value', () => {
      var parentController;
      var containerController;
      var siblingController;
      var friendController;
      var meController;

      function MeController() {
        this.name = 'Me';
        this.$onInit = function() {
          containerController = this.container;
          friendController = this.friend;
        };
      }
      function ParentController() {
        parentController = { name: 'Parent' };
        return parentController;
      }
      function SiblingController() {
        siblingController = { name: 'Sibling' };
        return siblingController;
      }

      angular.module('my', [])
        .directive('me', function() {
          return {
            priority: 1, // make sure it is run before sibling to test this case correctly
            restrict: 'E',
            scope: {},
            require: { container: '^parent', friend: 'sibling' },
            bindToController: true,
            controller: MeController,
            controllerAs: '$ctrl'
          };
        })
        .directive('parent', function() {
          return {
            restrict: 'E',
            scope: {},
            controller: ParentController
          };
        })
        .directive('sibling', function() {
          return {
            controller: SiblingController
          };
        });

      angular.mock.module('my');
      angular.mock.inject(function($compile, $rootScope, meDirective) {
        element = $compile('<parent><me sibling></me></parent>')($rootScope);
        expect(containerController).toEqual(parentController);
        expect(friendController).toEqual(siblingController);
      });
    });

    test('should require controller of an isolate directive from a non-isolate directive on the ' +
        'same element', function() {
      var IsolateController = function() {};
      var isolateDirControllerInNonIsolateDirective;

      angular.mock.module(function() {
        directive('isolate', function() {
          return {
            scope: {},
            controller: IsolateController
          };
        });
        directive('nonIsolate', function() {
          return {
            require: 'isolate',
            link(_, __, ___, isolateDirController) {
              isolateDirControllerInNonIsolateDirective = isolateDirController;
            }
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div isolate non-isolate></div>')($rootScope);

        expect(isolateDirControllerInNonIsolateDirective).toBeDefined();
        expect(isolateDirControllerInNonIsolateDirective instanceof IsolateController).toBe(true);
      });
    });


    test('should give the isolate scope to the controller of another replaced directives in the template', () => {
      angular.mock.module(function() {
        directive('testDirective', function() {
          return {
            replace: true,
            restrict: 'E',
            scope: {},
            template: '<input type="checkbox" ng-model="model">'
          };
        });
      });

      angular.mock.inject(function($rootScope) {
        compile('<div><test-directive></test-directive></div>');

        element = element.children().eq(0);
        expect(element[0].checked).toBe(false);
        element.isolateScope().model = true;
        $rootScope.$digest();
        expect(element[0].checked).toBe(true);
      });
    });


    test('should share isolate scope with replaced directives (template)', () => {
      var normalScope;
      var isolateScope;

      angular.mock.module(function() {
        directive('isolate', function() {
          return {
            replace: true,
            scope: {},
            template: '<span ng-init="name=\'WORKS\'">{{name}}</span>',
            link(s) {
              isolateScope = s;
            }
          };
        });
        directive('nonIsolate', function() {
          return {
            link(s) {
              normalScope = s;
            }
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div isolate non-isolate></div>')($rootScope);

        expect(normalScope).toBe($rootScope);
        expect(normalScope.name).toEqual(undefined);
        expect(isolateScope.name).toEqual('WORKS');
        $rootScope.$digest();
        expect(element.text()).toEqual('WORKS');
      });
    });


    test('should share isolate scope with replaced directives (templateUrl)', () => {
      var normalScope;
      var isolateScope;

      angular.mock.module(function() {
        directive('isolate', function() {
          return {
            replace: true,
            scope: {},
            templateUrl: 'main.html',
            link(s) {
              isolateScope = s;
            }
          };
        });
        directive('nonIsolate', function() {
          return {
            link(s) {
              normalScope = s;
            }
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('main.html', '<span ng-init="name=\'WORKS\'">{{name}}</span>');
        element = $compile('<div isolate non-isolate></div>')($rootScope);
        $rootScope.$apply();

        expect(normalScope).toBe($rootScope);
        expect(normalScope.name).toEqual(undefined);
        expect(isolateScope.name).toEqual('WORKS');
        expect(element.text()).toEqual('WORKS');
      });
    });


    test('should not get confused about where to use isolate scope when a replaced directive is used multiple times',
        function() {

      angular.mock.module(function() {
        directive('isolate', function() {
          return {
            replace: true,
            scope: {},
            template: '<span scope-tester="replaced"><span scope-tester="inside"></span></span>'
          };
        });
        directive('scopeTester', function(log) {
          return {
            link($scope, $element) {
              log($element.attr('scope-tester') + '=' + ($scope.$root === $scope ? 'non-isolate' : 'isolate'));
            }
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope, log) {
        element = $compile('<div>' +
                            '<div isolate scope-tester="outside"></div>' +
                            '<span scope-tester="sibling"></span>' +
                          '</div>')($rootScope);

        $rootScope.$digest();
        expect(log).toEqual('inside=isolate; ' +
                            'outside replaced=non-isolate; ' + // outside
                            'outside replaced=isolate; ' + // replaced
                            'sibling=non-isolate');
      });
    });


    test('should require controller of a non-isolate directive from an isolate directive on the ' +
      'same element', function() {
      var NonIsolateController = function() {};
      var nonIsolateDirControllerInIsolateDirective;

      angular.mock.module(function() {
        directive('isolate', function() {
          return {
            scope: {},
            require: 'nonIsolate',
            link(_, __, ___, nonIsolateDirController) {
              nonIsolateDirControllerInIsolateDirective = nonIsolateDirController;
            }
          };
        });
        directive('nonIsolate', function() {
          return {
            controller: NonIsolateController
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div isolate non-isolate></div>')($rootScope);

        expect(nonIsolateDirControllerInIsolateDirective).toBeDefined();
        expect(nonIsolateDirControllerInIsolateDirective instanceof NonIsolateController).toBe(true);
      });
    });


    test('should support controllerAs', () => {
      angular.mock.module(function() {
        directive('main', function() {
          return {
            templateUrl: 'main.html',
            transclude: true,
            scope: {},
            controller() {
              this.name = 'lucas';
            },
            controllerAs: 'mainCtrl'
          };
        });
      });
      angular.mock.inject(function($templateCache, $compile, $rootScope) {
        $templateCache.put('main.html', '<span>template:{{mainCtrl.name}} <div ng-transclude></div></span>');
        element = $compile('<div main>transclude:{{mainCtrl.name}}</div>')($rootScope);
        $rootScope.$apply();
        expect(element.text()).toBe('template:lucas transclude:');
      });
    });


    test('should support controller alias', () => {
      angular.mock.module(function($controllerProvider) {
        $controllerProvider.register('MainCtrl', function() {
          this.name = 'lucas';
        });
        directive('main', function() {
          return {
            templateUrl: 'main.html',
            scope: {},
            controller: 'MainCtrl as mainCtrl'
          };
        });
      });
      angular.mock.inject(function($templateCache, $compile, $rootScope) {
        $templateCache.put('main.html', '<span>{{mainCtrl.name}}</span>');
        element = $compile('<div main></div>')($rootScope);
        $rootScope.$apply();
        expect(element.text()).toBe('lucas');
      });
    });



    test('should require controller on parent element',function() {
      angular.mock.module(function() {
        directive('main', function(log) {
          return {
            controller() {
              this.name = 'main';
            }
          };
        });
        directive('dep', function(log) {
          return {
            require: '^main',
            link(scope, element, attrs, controller) {
              log('dep:' + controller.name);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<div main><div dep></div></div>')($rootScope);
        expect(log).toEqual('dep:main');
      });
    });


    test('should throw an error if required controller can\'t be found',function() {
      angular.mock.module(function() {
        directive('dep', function(log) {
          return {
            require: '^main',
            link(scope, element, attrs, controller) {
              log('dep:' + controller.name);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        expect(function() {
          $compile('<div main><div dep></div></div>')($rootScope);
        }).toThrowMinErr('$compile', 'ctreq', 'Controller \'main\', required by directive \'dep\', can\'t be found!');
      });
    });


    test('should pass null if required controller can\'t be found and is optional',function() {
      angular.mock.module(function() {
        directive('dep', function(log) {
          return {
            require: '?^main',
            link(scope, element, attrs, controller) {
              log('dep:' + controller);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        $compile('<div main><div dep></div></div>')($rootScope);
        expect(log).toEqual('dep:null');
      });
    });


    test('should pass null if required controller can\'t be found and is optional with the question mark on the right',function() {
      angular.mock.module(function() {
        directive('dep', function(log) {
          return {
            require: '^?main',
            link(scope, element, attrs, controller) {
              log('dep:' + controller);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        $compile('<div main><div dep></div></div>')($rootScope);
        expect(log).toEqual('dep:null');
      });
    });


    test('should have optional controller on current element', () => {
      angular.mock.module(function() {
        directive('dep', function(log) {
          return {
            require: '?main',
            link(scope, element, attrs, controller) {
              log('dep:' + !!controller);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<div main><div dep></div></div>')($rootScope);
        expect(log).toEqual('dep:false');
      });
    });


    test('should support multiple controllers', () => {
      angular.mock.module(function() {
        directive('c1', ngInternals.valueFn({
          controller() { this.name = 'c1'; }
        }));
        directive('c2', ngInternals.valueFn({
          controller() { this.name = 'c2'; }
        }));
        directive('dep', function(log) {
          return {
            require: ['^c1', '^c2'],
            link(scope, element, attrs, controller) {
              log('dep:' + controller[0].name + '-' + controller[1].name);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<div c1 c2><div dep></div></div>')($rootScope);
        expect(log).toEqual('dep:c1-c2');
      });
    });

    test('should support multiple controllers as an object hash', () => {
      angular.mock.module(function() {
        directive('c1', ngInternals.valueFn({
          controller() { this.name = 'c1'; }
        }));
        directive('c2', ngInternals.valueFn({
          controller() { this.name = 'c2'; }
        }));
        directive('dep', function(log) {
          return {
            require: { myC1: '^c1', myC2: '^c2' },
            link(scope, element, attrs, controllers) {
              log('dep:' + controllers.myC1.name + '-' + controllers.myC2.name);
            }
          };
        });
      });
      angular.mock.inject(function(log, $compile, $rootScope) {
        element = $compile('<div c1 c2><div dep></div></div>')($rootScope);
        expect(log).toEqual('dep:c1-c2');
      });
    });

    test('should support omitting the name of the required controller if it is the same as the key',
      function() {
        angular.mock.module(function() {
          directive('myC1', ngInternals.valueFn({
            controller() { this.name = 'c1'; }
          }));
          directive('myC2', ngInternals.valueFn({
            controller() { this.name = 'c2'; }
          }));
          directive('dep', function(log) {
            return {
              require: { myC1: '^', myC2: '^' },
              link(scope, element, attrs, controllers) {
                log('dep:' + controllers.myC1.name + '-' + controllers.myC2.name);
              }
            };
          });
        });
        angular.mock.inject(function(log, $compile, $rootScope) {
          element = $compile('<div my-c1 my-c2><div dep></div></div>')($rootScope);
          expect(log).toEqual('dep:c1-c2');
        });
      }
    );

    test('should instantiate the controller just once when template/templateUrl', () => {
      var syncCtrlSpy = jest.fn().mockName('sync controller');
      var asyncCtrlSpy = jest.fn().mockName('async controller');

      angular.mock.module(function() {
        directive('myDirectiveSync', ngInternals.valueFn({
          template: '<div>Hello!</div>',
          controller: syncCtrlSpy
        }));
        directive('myDirectiveAsync', ngInternals.valueFn({
          templateUrl: 'myDirectiveAsync.html',
          controller: asyncCtrlSpy,
          compile() {
            return function() {
            };
          }
        }));
      });

      angular.mock.inject(function($templateCache, $compile, $rootScope) {
        expect(syncCtrlSpy).not.toHaveBeenCalled();
        expect(asyncCtrlSpy).not.toHaveBeenCalled();

        $templateCache.put('myDirectiveAsync.html', '<div>Hello!</div>');
        element = $compile('<div>' +
                  '<span xmy-directive-sync></span>' +
                  '<span my-directive-async></span>' +
                '</div>')($rootScope);
        expect(syncCtrlSpy).not.toHaveBeenCalled();
        expect(asyncCtrlSpy).not.toHaveBeenCalled();

        $rootScope.$apply();

        //expect(syncCtrlSpy).toHaveBeenCalledTimes(1);
        expect(asyncCtrlSpy).toHaveBeenCalledTimes(1);
      });
    });



    test('should instantiate controllers in the parent->child order when transclusion, templateUrl and replacement ' +
        'are in the mix', function() {
      // When a child controller is in the transclusion that replaces the parent element that has a directive with
      // a controller, we should ensure that we first instantiate the parent and only then stuff that comes from the
      // transclusion.
      //
      // The transclusion moves the child controller onto the same element as parent controller so both controllers are
      // on the same level.

      angular.mock.module(function() {
        directive('parentDirective', function() {
          return {
            transclude: true,
            replace: true,
            templateUrl: 'parentDirective.html',
            controller(log) { log('parentController'); }
          };
        });
        directive('childDirective', function() {
          return {
            require: '^parentDirective',
            templateUrl: 'childDirective.html',
            controller(log) { log('childController'); }
          };
        });
      });

      angular.mock.inject(function($templateCache, log, $compile, $rootScope) {
        $templateCache.put('parentDirective.html', '<div ng-transclude>parentTemplateText;</div>');
        $templateCache.put('childDirective.html', '<span>childTemplateText;</span>');

        element = $compile('<div parent-directive><div child-directive></div>childContentText;</div>')($rootScope);
        $rootScope.$apply();
        expect(log).toEqual('parentController; childController');
        expect(element.text()).toBe('childTemplateText;childContentText;');
      });
    });


    test('should instantiate the controller after the isolate scope bindings are initialized (with template)', () => {
      angular.mock.module(function() {
        var Ctrl = function($scope, log) {
          log('myFoo=' + $scope.myFoo);
        };

        directive('myDirective', function() {
          return {
            scope: {
              myFoo: '='
            },
            template: '<p>Hello</p>',
            controller: Ctrl
          };
        });
      });

      angular.mock.inject(function($templateCache, $compile, $rootScope, log) {
        $rootScope.foo = 'bar';

        element = $compile('<div my-directive my-foo="foo"></div>')($rootScope);
        $rootScope.$apply();
        expect(log).toEqual('myFoo=bar');
      });
    });


    test('should instantiate the controller after the isolate scope bindings are initialized (with templateUrl)', () => {
      angular.mock.module(function() {
        var Ctrl = function($scope, log) {
          log('myFoo=' + $scope.myFoo);
        };

        directive('myDirective', function() {
          return {
            scope: {
              myFoo: '='
            },
            templateUrl: 'hello.html',
            controller: Ctrl
          };
        });
      });

      angular.mock.inject(function($templateCache, $compile, $rootScope, log) {
        $templateCache.put('hello.html', '<p>Hello</p>');
        $rootScope.foo = 'bar';

        element = $compile('<div my-directive my-foo="foo"></div>')($rootScope);
        $rootScope.$apply();
        expect(log).toEqual('myFoo=bar');
      });
    });


    test('should instantiate controllers in the parent->child->baby order when nested transclusion, templateUrl and ' +
        'replacement are in the mix', function() {
      // similar to the test above, except that we have one more layer of nesting and nested transclusion

      angular.mock.module(function() {
        directive('parentDirective', function() {
          return {
            transclude: true,
            replace: true,
            templateUrl: 'parentDirective.html',
            controller(log) { log('parentController'); }
          };
        });
        directive('childDirective', function() {
          return {
            require: '^parentDirective',
            transclude: true,
            replace: true,
            templateUrl: 'childDirective.html',
            controller(log) { log('childController'); }
          };
        });
        directive('babyDirective', function() {
          return {
            require: '^childDirective',
            templateUrl: 'babyDirective.html',
            controller(log) { log('babyController'); }
          };
        });
      });

      angular.mock.inject(function($templateCache, log, $compile, $rootScope) {
        $templateCache.put('parentDirective.html', '<div ng-transclude>parentTemplateText;</div>');
        $templateCache.put('childDirective.html', '<span ng-transclude>childTemplateText;</span>');
        $templateCache.put('babyDirective.html', '<span>babyTemplateText;</span>');

        element = $compile('<div parent-directive>' +
                            '<div child-directive>' +
                              'childContentText;' +
                              '<div baby-directive>babyContent;</div>' +
                              '</div>' +
                            '</div>')($rootScope);
        $rootScope.$apply();
        expect(log).toEqual('parentController; childController; babyController');
        expect(element.text()).toBe('childContentText;babyTemplateText;');
      });
    });


    test('should allow controller usage in pre-link directive functions with templateUrl', () => {
      angular.mock.module(function() {
        var Ctrl = function(log) {
          log('instance');
        };

        directive('myDirective', function() {
          return {
            scope: true,
            templateUrl: 'hello.html',
            controller: Ctrl,
            compile() {
              return {
                pre(scope, template, attr, ctrl) {},
                post() {}
              };
            }
          };
        });
      });

      angular.mock.inject(function($templateCache, $compile, $rootScope, log) {
        $templateCache.put('hello.html', '<p>Hello</p>');

        element = $compile('<div my-directive></div>')($rootScope);
        $rootScope.$apply();

        expect(log).toEqual('instance');
        expect(element.text()).toBe('Hello');
      });
    });


    test('should allow controller usage in pre-link directive functions with a template', () => {
      angular.mock.module(function() {
        var Ctrl = function(log) {
          log('instance');
        };

        directive('myDirective', function() {
          return {
            scope: true,
            template: '<p>Hello</p>',
            controller: Ctrl,
            compile() {
              return {
                pre(scope, template, attr, ctrl) {},
                post() {}
              };
            }
          };
        });
      });

      angular.mock.inject(function($templateCache, $compile, $rootScope, log) {
        element = $compile('<div my-directive></div>')($rootScope);
        $rootScope.$apply();

        expect(log).toEqual('instance');
        expect(element.text()).toBe('Hello');
      });
    });


    test('should throw ctreq with correct directive name, regardless of order', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('aDir', ngInternals.valueFn({
          restrict: 'E',
          require: 'ngModel',
          link: angular.noop
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        expect(function() {
          // a-dir will cause a ctreq error to be thrown. Previously, the error would reference
          // the last directive in the chain (which in this case would be ngClick), based on
          // priority and alphabetical ordering. This test verifies that the ordering does not
          // affect which directive is referenced in the minErr message.
          element = $compile('<a-dir ng-click="foo=bar"></a-dir>')($rootScope);
        }).toThrowMinErr('$compile', 'ctreq',
            'Controller \'ngModel\', required by directive \'aDir\', can\'t be found!');
      });
    });
  });


  describe('transclude', () => {

    describe('content transclusion', () => {

      test('should support transclude directive', () => {
        angular.mock.module(function() {
          directive('trans', function() {
            return {
              transclude: 'content',
              replace: true,
              scope: {},
              link(scope) {
                scope.x = 'iso';
              },
              template: '<ul><li>W:{{x}}-{{$parent.$id}}-{{$id}};</li><li ng-transclude></li></ul>'
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div><div trans>T:{{x}}-{{$parent.$id}}-{{$id}}<span>;</span></div></div>')($rootScope);
          $rootScope.x = 'root';
          $rootScope.$apply();
          expect(element.text()).toEqual('W:iso-1-2;T:root-2-3;');
          expect(angular.element(angular.element(element.find('li')[1]).contents()[0]).text()).toEqual('T:root-2-3');
          expect(angular.element(element.find('span')[0]).text()).toEqual(';');
        });
      });


      test('should transclude transcluded content', () => {
        angular.mock.module(function() {
          directive('book', ngInternals.valueFn({
            transclude: 'content',
            template: '<div>book-<div chapter>(<div ng-transclude></div>)</div></div>'
          }));
          directive('chapter', ngInternals.valueFn({
            transclude: 'content',
            templateUrl: 'chapter.html'
          }));
          directive('section', ngInternals.valueFn({
            transclude: 'content',
            template: '<div>section-!<div ng-transclude></div>!</div></div>'
          }));
          return function($httpBackend) {
            $httpBackend.
                expect('GET', 'chapter.html').
                respond('<div>chapter-<div section>[<div ng-transclude></div>]</div></div>');
          };
        });
        angular.mock.inject(function(log, $rootScope, $compile, $httpBackend) {
          element = $compile('<div><div book>paragraph</div></div>')($rootScope);
          $rootScope.$apply();

          expect(element.text()).toEqual('book-');

          $httpBackend.flush();
          $rootScope.$apply();
          expect(element.text()).toEqual('book-chapter-section-![(paragraph)]!');
        });
      });


      test('should compile directives with lower priority than ngTransclude', () => {
        var ngTranscludePriority;
        var lowerPriority = -1;

        angular.mock.module(function($provide) {
          $provide.decorator('ngTranscludeDirective', function($delegate) {
            ngTranscludePriority = $delegate[0].priority;
            return $delegate;
          });

          directive('lower', function(log) {
            return {
              priority: lowerPriority,
              link: {
                pre() {
                  log('pre');
                },
                post() {
                  log('post');
                }
              }
            };
          });
          directive('trans', function(log) {
            return {
              transclude: true,
              template: '<div lower ng-transclude></div>'
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div trans><span>transcluded content</span></div>')($rootScope);

          expect(lowerPriority).toBeLessThan(ngTranscludePriority);

          $rootScope.$apply();

          expect(element.text()).toEqual('transcluded content');
          expect(log).toEqual('pre; post');
        });
      });


      test('should not merge text elements from transcluded content', () => {
        angular.mock.module(function() {
          directive('foo', ngInternals.valueFn({
            transclude: 'content',
            template: '<div>This is before {{before}}. </div>',
            link(scope, element, attr, ctrls, $transclude) {
              var futureParent = element.children().eq(0);
              $transclude(function(clone) {
                futureParent.append(clone);
              }, futureParent);
            },
            scope: true
          }));
        });
        angular.mock.inject(function($rootScope, $compile) {
          element = $compile('<div><div foo>This is after {{after}}</div></div>')($rootScope);
          $rootScope.before = 'BEFORE';
          $rootScope.after = 'AFTER';
          $rootScope.$apply();
          expect(element.text()).toEqual('This is before BEFORE. This is after AFTER');

          $rootScope.before = 'Not-Before';
          $rootScope.after = 'AfTeR';
          $rootScope.$$childHead.before = 'BeFoRe';
          $rootScope.$$childHead.after = 'Not-After';
          $rootScope.$apply();
          expect(element.text()).toEqual('This is before BeFoRe. This is after AfTeR');
        });
      });


      test('should only allow one content transclusion per element', () => {
        angular.mock.module(function() {
          directive('first', ngInternals.valueFn({
            transclude: true
          }));
          directive('second', ngInternals.valueFn({
            transclude: true
          }));
        });
        angular.mock.inject(function($compile) {
          expect(function() {
            $compile('<div first="" second=""></div>');
          }).toThrowMinErr('$compile', 'multidir', /Multiple directives \[first, second] asking for transclusion on: <div .+/);
        });
      });


      test('should correctly handle multi-element directives', () => {
        angular.mock.module(function() {
          directive('foo', ngInternals.valueFn({
            template: '[<div ng-transclude></div>]',
            transclude: true
          }));
          directive('bar', ngInternals.valueFn({
            template: '[<div ng-transclude="header"></div>|<div ng-transclude="footer"></div>]',
            transclude: {
              header: 'header',
              footer: 'footer'
            }
          }));
        });

        angular.mock.inject(function($compile, $rootScope) {
          var tmplWithFoo =
              '<foo>' +
                '<div ng-if-start="true">Hello, </div>' +
                '<div ng-if-end>world!</div>' +
              '</foo>';
          var tmplWithBar =
              '<bar>' +
                '<header ng-if-start="true">This is a </header>' +
                '<header ng-if-end>header!</header>' +
                '<footer ng-if-start="true">This is a </footer>' +
                '<footer ng-if-end>footer!</footer>' +
              '</bar>';

          var elem1 = $compile(tmplWithFoo)($rootScope);
          var elem2 = $compile(tmplWithBar)($rootScope);

          $rootScope.$digest();

          expect(elem1.text()).toBe('[Hello, world!]');
          expect(elem2.text()).toBe('[This is a header!|This is a footer!]');

          dealoc(elem1);
          dealoc(elem2);
        });
      });


      //see issue https://github.com/angular/angular.js/issues/12936
      test('should use the proper scope when it is on the root element of a replaced directive template', () => {
        angular.mock.module(function() {
          directive('isolate', ngInternals.valueFn({
            scope: {},
            replace: true,
            template: '<div trans>{{x}}</div>',
            link(scope, element, attr, ctrl) {
              scope.x = 'iso';
            }
          }));
          directive('trans', ngInternals.valueFn({
            transclude: 'content',
            link(scope, element, attr, ctrl, $transclude) {
              $transclude(function(clone) {
                element.append(clone);
              });
            }
          }));
        });
        angular.mock.inject(function($rootScope, $compile) {
          element = $compile('<isolate></isolate>')($rootScope);
          $rootScope.x = 'root';
          $rootScope.$apply();
          expect(element.text()).toEqual('iso');
        });
      });


      //see issue https://github.com/angular/angular.js/issues/12936
      test('should use the proper scope when it is on the root element of a replaced directive template with child scope', () => {
        angular.mock.module(function() {
          directive('child', ngInternals.valueFn({
            scope: true,
            replace: true,
            template: '<div trans>{{x}}</div>',
            link(scope, element, attr, ctrl) {
              scope.x = 'child';
            }
          }));
          directive('trans', ngInternals.valueFn({
            transclude: 'content',
            link(scope, element, attr, ctrl, $transclude) {
              $transclude(function(clone) {
                element.append(clone);
              });
            }
          }));
        });
        angular.mock.inject(function($rootScope, $compile) {
          element = $compile('<child></child>')($rootScope);
          $rootScope.x = 'root';
          $rootScope.$apply();
          expect(element.text()).toEqual('child');
        });
      });

      test('should throw if a transcluded node is transcluded again', () => {
        angular.mock.module(function() {
          directive('trans', ngInternals.valueFn({
            transclude: true,
            link(scope, element, attr, ctrl, $transclude) {
              $transclude();
              $transclude();
            }
          }));
        });
        angular.mock.inject(function($rootScope, $compile) {
          expect(function() {
            $compile('<trans></trans>')($rootScope);
          }).toThrowMinErr('$compile', 'multilink', 'This element has already been linked.');
        });
      });

      test('should not leak if two "element" transclusions are on the same element (with debug info)', () => {
        angular.mock.module(function($compileProvider) {
          $compileProvider.debugInfoEnabled(true);
        });

        angular.mock.inject(function($compile, $rootScope) {
          var cacheSize = jqLiteCacheSize();

          element = $compile('<div><div ng-repeat="x in xs" ng-if="x==1">{{x}}</div></div>')($rootScope);
          expect(jqLiteCacheSize()).toEqual(cacheSize + 1);

          $rootScope.$apply('xs = [0,1]');
          expect(jqLiteCacheSize()).toEqual(cacheSize + 2);

          $rootScope.$apply('xs = [0]');
          expect(jqLiteCacheSize()).toEqual(cacheSize + 1);

          $rootScope.$apply('xs = []');
          expect(jqLiteCacheSize()).toEqual(cacheSize + 1);

          element.remove();
          expect(jqLiteCacheSize()).toEqual(cacheSize + 0);
        });
      });


      test('should not leak if two "element" transclusions are on the same element (without debug info)', () => {
        angular.mock.module(function($compileProvider) {
          $compileProvider.debugInfoEnabled(false);
        });

        angular.mock.inject(function($compile, $rootScope) {
          var cacheSize = jqLiteCacheSize();

          element = $compile('<div><div ng-repeat="x in xs" ng-if="x==1">{{x}}</div></div>')($rootScope);
          expect(jqLiteCacheSize()).toEqual(cacheSize);

          $rootScope.$apply('xs = [0,1]');
          expect(jqLiteCacheSize()).toEqual(cacheSize);

          $rootScope.$apply('xs = [0]');
          expect(jqLiteCacheSize()).toEqual(cacheSize);

          $rootScope.$apply('xs = []');
          expect(jqLiteCacheSize()).toEqual(cacheSize);

          element.remove();
          expect(jqLiteCacheSize()).toEqual(cacheSize);
        });
      });


      test('should not leak if two "element" transclusions are on the same element (with debug info)', () => {
        angular.mock.module(function($compileProvider) {
          $compileProvider.debugInfoEnabled(true);
        });

        angular.mock.inject(function($compile, $rootScope) {
          var cacheSize = jqLiteCacheSize();
          element = $compile('<div><div ng-repeat="x in xs" ng-if="val">{{x}}</div></div>')($rootScope);

          $rootScope.$apply('xs = [0,1]');
          // At this point we have a bunch of comment placeholders but no real transcluded elements
          // So the cache only contains the root element's data
          expect(jqLiteCacheSize()).toEqual(cacheSize + 1);

          $rootScope.$apply('val = true');
          // Now we have two concrete transcluded elements plus some comments so two more cache items
          expect(jqLiteCacheSize()).toEqual(cacheSize + 3);

          $rootScope.$apply('val = false');
          // Once again we only have comments so no transcluded elements and the cache is back to just
          // the root element
          expect(jqLiteCacheSize()).toEqual(cacheSize + 1);

          element.remove();
          // Now we've even removed the root element along with its cache
          expect(jqLiteCacheSize()).toEqual(cacheSize + 0);
        });
      });

      test('should not leak when continuing the compilation of elements on a scope that was destroyed', () => {
        var linkFn = jest.fn().mockName('linkFn');

        angular.mock.module(function($controllerProvider, $compileProvider) {
          $controllerProvider.register('Leak', function($scope, $timeout) {
            $scope.code = 'red';
            $timeout(function() {
              $scope.code = 'blue';
            });
          });
          $compileProvider.directive('isolateRed', function() {
            return {
              restrict: 'A',
              scope: {},
              template: '<div red></div>'
            };
          });
          $compileProvider.directive('red', function() {
            return {
              restrict: 'A',
              templateUrl: 'red.html',
              scope: {},
              link: linkFn
            };
          });
        });

        angular.mock.inject(function($compile, $rootScope, $httpBackend, $timeout, $templateCache) {
          var cacheSize = jqLiteCacheSize();
          $httpBackend.whenGET('red.html').respond('<p>red.html</p>');
          var template = $compile(
            '<div ng-controller="Leak">' +
              '<div ng-switch="code">' +
                '<div ng-switch-when="red">' +
                  '<div isolate-red></div>' +
                '</div>' +
              '</div>' +
            '</div>');
          element = template($rootScope, angular.noop);
          $rootScope.$digest();
          $timeout.flush();
          $httpBackend.flush();
          expect(linkFn).not.toHaveBeenCalled();
          expect(jqLiteCacheSize()).toEqual(cacheSize + 2);

          $templateCache.removeAll();
          var destroyedScope = $rootScope.$new();
          destroyedScope.$destroy();
          var clone = template(destroyedScope, angular.noop);
          $rootScope.$digest();
          $timeout.flush();
          expect(linkFn).not.toHaveBeenCalled();
          clone.remove();
        });
      });

      describe('cleaning up after a replaced element', () => {
        var $compile;
        var xs;
        beforeEach(angular.mock.inject(function(_$compile_) {
          $compile = _$compile_;
          xs = [0, 1];
        }));

        function testCleanup() {
          var privateData;
          var firstRepeatedElem;

          element = $compile('<div><div ng-repeat="x in xs" ng-click="noop()">{{x}}</div></div>')($rootScope);

          $rootScope.$apply('xs = [' + xs + ']');
          firstRepeatedElem = element.children('.ng-scope').eq(0);

          expect(firstRepeatedElem.data('$scope')).toBeDefined();
          privateData = angular.element._data(firstRepeatedElem[0]);
          expect(privateData.events).toBeDefined();
          expect(privateData.events.click).toBeDefined();
          expect(privateData.events.click[0]).toBeDefined();

          // Ensure the AngularJS $destroy event is still sent
          var destroyCount = 0;
          element.find('div').on('$destroy', function() { destroyCount++; });

          $rootScope.$apply('xs = null');

          expect(destroyCount).toBe(2);
          expect(firstRepeatedElem.data('$scope')).not.toBeDefined();
          privateData = angular.element._data(firstRepeatedElem[0]);
          expect(privateData && privateData.events).not.toBeDefined();
        }

        test('should work without external libraries (except jQuery)', testCleanup);

        test('should work with another library patching jqLite/jQuery.cleanData after AngularJS', () => {
          var cleanedCount = 0;
          var currentCleanData = angular.element.cleanData;
          angular.element.cleanData = function(elems) {
            cleanedCount += elems.length;
            // Don't return the output and explicitly pass only the first parameter
            // so that we're sure we're not relying on either of them. jQuery UI patch
            // behaves in this way.
            currentCleanData(elems);
          };

          testCleanup();

          // The ng-repeat template is removed/cleaned (the +1)
          // and each clone of the ng-repeat template is also removed (xs.length)
          expect(cleanedCount).toBe(xs.length + 1);

          // Restore the previous cleanData.
          angular.element.cleanData = currentCleanData;
        });
      });


      test('should add a $$transcluded property onto the transcluded scope', () => {
        angular.mock.module(function() {
          directive('trans', function() {
            return {
              transclude: true,
              replace: true,
              scope: true,
              template: '<div><span>I:{{$$transcluded}}</span><span ng-transclude></span></div>'
            };
          });
        });
        angular.mock.inject(function($rootScope, $compile) {
          element = $compile('<div><div trans>T:{{$$transcluded}}</div></div>')($rootScope);
          $rootScope.$apply();
          expect(angular.element(element.find('span')[0]).text()).toEqual('I:');
          expect(angular.element(element.find('span')[1]).text()).toEqual('T:true');
        });
      });


      test('should clear contents of the ng-transclude element before appending transcluded content' +
        ' if transcluded content exists', function() {
        angular.mock.module(function() {
          directive('trans', function() {
            return {
              transclude: true,
              template: '<div ng-transclude>old stuff!</div>'
            };
          });
        });
        angular.mock.inject(function($rootScope, $compile) {
          element = $compile('<div trans>unicorn!</div>')($rootScope);
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">unicorn!</div>');
        });
      });

      test('should NOT clear contents of the ng-transclude element before appending transcluded content' +
        ' if transcluded content does NOT exist', function() {
        angular.mock.module(function() {
          directive('trans', function() {
            return {
              transclude: true,
              template: '<div ng-transclude>old stuff!</div>'
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div trans></div>')($rootScope);
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">old stuff!</div>');
        });
      });


      test('should clear the fallback content from the element during compile and before linking', () => {
        angular.mock.module(function() {
          directive('trans', function() {
            return {
              transclude: true,
              template: '<div ng-transclude>fallback content</div>'
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = angular.element('<div trans></div>');
          var linkfn = $compile(element);
          expect(element.html()).toEqual('<div ng-transclude=""></div>');
          linkfn($rootScope);
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">fallback content</div>');
        });
      });


      test('should allow cloning of the fallback via ngRepeat', () => {
        angular.mock.module(function() {
          directive('trans', function() {
            return {
              transclude: true,
              template: '<div ng-repeat="i in [0,1,2]"><div ng-transclude>{{i}}</div></div>'
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div trans></div>')($rootScope);
          $rootScope.$apply();
          expect(element.text()).toEqual('012');
        });
      });


      test('should not link the fallback content if transcluded content is provided', () => {
        var linkSpy = jest.fn().mockName('postlink');

        angular.mock.module(function() {
          directive('inner', function() {
            return {
              restrict: 'E',
              template: 'old stuff! ',
              link: linkSpy
            };
          });

          directive('trans', function() {
            return {
              transclude: true,
              template: '<div ng-transclude><inner></inner></div>'
            };
          });
        });
        angular.mock.inject(function($rootScope, $compile) {
          element = $compile('<div trans>unicorn!</div>')($rootScope);
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">unicorn!</div>');
          expect(linkSpy).not.toHaveBeenCalled();
        });
      });

      test('should compile and link the fallback content if no transcluded content is provided', () => {
        var linkSpy = jest.fn().mockName('postlink');

        angular.mock.module(function() {
          directive('inner', function() {
            return {
              restrict: 'E',
              template: 'old stuff! ',
              link: linkSpy
            };
          });

          directive('trans', function() {
            return {
              transclude: true,
              template: '<div ng-transclude><inner></inner></div>'
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div trans></div>')($rootScope);
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude=""><inner>old stuff! </inner></div>');
          expect(linkSpy).toHaveBeenCalled();
        });
      });

      test('should compile and link the fallback content if only whitespace transcluded content is provided', () => {
        var linkSpy = jest.fn().mockName('postlink');

        angular.mock.module(function() {
          directive('inner', function() {
            return {
              restrict: 'E',
              template: 'old stuff! ',
              link: linkSpy
            };
          });

          directive('trans', function() {
            return {
              transclude: true,
              template: '<div ng-transclude><inner></inner></div>'
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div trans>\n  \n</div>')($rootScope);
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude=""><inner>old stuff! </inner></div>');
          expect(linkSpy).toHaveBeenCalled();
        });
      });

      test('should not link the fallback content if only whitespace and comments are provided as transclude content', () => {
        var linkSpy = jest.fn().mockName('postlink');

        angular.mock.module(function() {
          directive('inner', function() {
            return {
              restrict: 'E',
              template: 'old stuff! ',
              link: linkSpy
            };
          });

          directive('trans', function() {
            return {
              transclude: true,
              template: '<div ng-transclude><inner></inner></div>'
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div trans>\n<!-- some comment -->  \n</div>')($rootScope);
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">\n<!-- some comment -->  \n</div>');
          expect(linkSpy).not.toHaveBeenCalled();
        });
      });

      test('should compile and link the fallback content if an optional transclusion slot is not provided', () => {
        var linkSpy = jest.fn().mockName('postlink');

        angular.mock.module(function() {
          directive('inner', function() {
            return {
              restrict: 'E',
              template: 'old stuff! ',
              link: linkSpy
            };
          });

          directive('trans', function() {
            return {
              transclude: { optionalSlot: '?optional'},
              template: '<div ng-transclude="optionalSlot"><inner></inner></div>'
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div trans></div>')($rootScope);
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude="optionalSlot"><inner>old stuff! </inner></div>');
          expect(linkSpy).toHaveBeenCalled();
        });
      });

      test('should cope if there is neither transcluded content nor fallback content', () => {
        angular.mock.module(function() {
          directive('trans', function() {
            return {
              transclude: true,
              template: '<div ng-transclude></div>'
            };
          });
        });
        angular.mock.inject(function($rootScope, $compile) {
          element = $compile('<div trans></div>')($rootScope);
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude=""></div>');
        });
      });

      test('should throw on an ng-transclude element inside no transclusion directive', () => {
        angular.mock.inject(function($rootScope, $compile) {
          var error;

          try {
            $compile('<div><div ng-transclude></div></div>')($rootScope);
          } catch (e) {
            error = e;
          }

          expect(error).toEqualMinErr('ngTransclude', 'orphan',
              'Illegal use of ngTransclude directive in the template! ' +
              'No parent directive that requires a transclusion found. ' +
              'Element: <div ng-transclude');
          // we need to do this because different browsers print empty attributes differently
        });
      });


      test('should not pass transclusion into a template directive when the directive didn\'t request transclusion', () => {

        angular.mock.module(function($compileProvider) {

          $compileProvider.directive('transFoo', ngInternals.valueFn({
            template: '<div>' +
              '<div no-trans-bar></div>' +
              '<div ng-transclude>this one should get replaced with content</div>' +
              '<div class="foo" ng-transclude></div>' +
            '</div>',
            transclude: true

          }));

          $compileProvider.directive('noTransBar', ngInternals.valueFn({
            template: '<div>' +
              // This ng-transclude is invalid. It should throw an error.
              '<div class="bar" ng-transclude></div>' +
            '</div>',
            transclude: false

          }));
        });

        angular.mock.inject(function($compile, $rootScope) {
          expect(function() {
            $compile('<div trans-foo>content</div>')($rootScope);
          }).toThrowMinErr('ngTransclude', 'orphan',
              'Illegal use of ngTransclude directive in the template! No parent directive that requires a transclusion found. Element: <div class="bar" ng-transclude="">');
        });
      });


      test('should not pass transclusion into a templateUrl directive', () => {

        angular.mock.module(function($compileProvider) {

          $compileProvider.directive('transFoo', ngInternals.valueFn({
            template: '<div>' +
              '<div no-trans-bar></div>' +
              '<div ng-transclude>this one should get replaced with content</div>' +
              '<div class="foo" ng-transclude></div>' +
            '</div>',
            transclude: true
          }));

          $compileProvider.directive('noTransBar', ngInternals.valueFn({
            templateUrl: 'noTransBar.html',
            transclude: false
          }));
        });

        angular.mock.inject(function($compile, $rootScope, $templateCache) {
          $templateCache.put('noTransBar.html',
            '<div>' +
              // This ng-transclude is invalid. It should throw an error.
              '<div class="bar" ng-transclude></div>' +
            '</div>');

          expect(function() {
            element = $compile('<div trans-foo>content</div>')($rootScope);
            $rootScope.$digest();
          }).toThrowMinErr('ngTransclude', 'orphan',
              'Illegal use of ngTransclude directive in the template! ' +
              'No parent directive that requires a transclusion found. ' +
              'Element: <div class="bar" ng-transclude="">');
        });
      });


      test('should expose transcludeFn in compile fn even for templateUrl', () => {
        angular.mock.module(function() {
          directive('transInCompile', ngInternals.valueFn({
            transclude: true,
            // template: '<div class="foo">whatever</div>',
            templateUrl: 'foo.html',
            compile(_, __, transclude) {
              return function(scope, element) {
                transclude(scope, function(clone, scope) {
                  element.html('');
                  element.append(clone);
                });
              };
            }
          }));
        });

        angular.mock.inject(function($compile, $rootScope, $templateCache) {
          $templateCache.put('foo.html', '<div class="foo">whatever</div>');

          compile('<div trans-in-compile>transcluded content</div>');
          $rootScope.$apply();

          expect(ngInternals.trim(element.text())).toBe('transcluded content');
        });
      });


      test('should make the result of a transclusion available to the parent directive in post-linking phase' +
          '(template)', function() {
        angular.mock.module(function() {
          directive('trans', function(log) {
            return {
              transclude: true,
              template: '<div ng-transclude></div>',
              link: {
                pre($scope, $element) {
                  log('pre(' + $element.text() + ')');
                },
                post($scope, $element) {
                  log('post(' + $element.text() + ')');
                }
              }
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div trans><span>unicorn!</span></div>')($rootScope);
          $rootScope.$apply();
          expect(log).toEqual('pre(); post(unicorn!)');
        });
      });


      test('should make the result of a transclusion available to the parent directive in post-linking phase' +
          '(templateUrl)', function() {
        // when compiling an async directive the transclusion is always processed before the directive
        // this is different compared to sync directive. delaying the transclusion makes little sense.

        angular.mock.module(function() {
          directive('trans', function(log) {
            return {
              transclude: true,
              templateUrl: 'trans.html',
              link: {
                pre($scope, $element) {
                  log('pre(' + $element.text() + ')');
                },
                post($scope, $element) {
                  log('post(' + $element.text() + ')');
                }
              }
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile, $templateCache) {
          $templateCache.put('trans.html', '<div ng-transclude></div>');

          element = $compile('<div trans><span>unicorn!</span></div>')($rootScope);
          $rootScope.$apply();
          expect(log).toEqual('pre(); post(unicorn!)');
        });
      });


      test('should make the result of a transclusion available to the parent *replace* directive in post-linking phase' +
          '(template)', function() {
        angular.mock.module(function() {
          directive('replacedTrans', function(log) {
            return {
              transclude: true,
              replace: true,
              template: '<div ng-transclude></div>',
              link: {
                pre($scope, $element) {
                  log('pre(' + $element.text() + ')');
                },
                post($scope, $element) {
                  log('post(' + $element.text() + ')');
                }
              }
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div replaced-trans><span>unicorn!</span></div>')($rootScope);
          $rootScope.$apply();
          expect(log).toEqual('pre(); post(unicorn!)');
        });
      });


      test('should make the result of a transclusion available to the parent *replace* directive in post-linking phase' +
          ' (templateUrl)', function() {
        angular.mock.module(function() {
          directive('replacedTrans', function(log) {
            return {
              transclude: true,
              replace: true,
              templateUrl: 'trans.html',
              link: {
                pre($scope, $element) {
                  log('pre(' + $element.text() + ')');
                },
                post($scope, $element) {
                  log('post(' + $element.text() + ')');
                }
              }
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile, $templateCache) {
          $templateCache.put('trans.html', '<div ng-transclude></div>');

          element = $compile('<div replaced-trans><span>unicorn!</span></div>')($rootScope);
          $rootScope.$apply();
          expect(log).toEqual('pre(); post(unicorn!)');
        });
      });

      test('should copy the directive controller to all clones', () => {
        var transcludeCtrl;
        var cloneCount = 2;
        angular.mock.module(function() {
          directive('transclude', ngInternals.valueFn({
            transclude: 'content',
            controller($transclude) {
              transcludeCtrl = this;
            },
            link(scope, el, attr, ctrl, $transclude) {
              var i;
              for (i = 0; i < cloneCount; i++) {
                $transclude(cloneAttach);
              }

              function cloneAttach(clone) {
                el.append(clone);
              }
            }
          }));
        });
        angular.mock.inject(function($compile) {
          element = $compile('<div transclude><span></span></div>')($rootScope);
          var children = element.children();
          var i;
          expect(transcludeCtrl).toBeDefined();

          expect(element.data('$transcludeController')).toBe(transcludeCtrl);
          for (i = 0; i < cloneCount; i++) {
            expect(children.eq(i).data('$transcludeController')).toBeUndefined();
          }
        });
      });

      test('should provide the $transclude controller local as 5th argument to the pre and post-link function', () => {
        var ctrlTransclude;
        var preLinkTransclude;
        var postLinkTransclude;
        angular.mock.module(function() {
          directive('transclude', ngInternals.valueFn({
            transclude: 'content',
            controller($transclude) {
              ctrlTransclude = $transclude;
            },
            compile() {
              return {
                pre(scope, el, attr, ctrl, $transclude) {
                  preLinkTransclude = $transclude;
                },
                post(scope, el, attr, ctrl, $transclude) {
                  postLinkTransclude = $transclude;
                }
              };
            }
          }));
        });
        angular.mock.inject(function($compile) {
          element = $compile('<div transclude></div>')($rootScope);
          expect(ctrlTransclude).toBeDefined();
          expect(ctrlTransclude).toBe(preLinkTransclude);
          expect(ctrlTransclude).toBe(postLinkTransclude);
        });
      });

      test('should allow an optional scope argument in $transclude', () => {
        var capturedChildCtrl;
        angular.mock.module(function() {
          directive('transclude', ngInternals.valueFn({
            transclude: 'content',
            link(scope, element, attr, ctrl, $transclude) {
              $transclude(scope, function(clone) {
                element.append(clone);
              });
            }
          }));
        });
        angular.mock.inject(function($compile) {
          element = $compile('<div transclude>{{$id}}</div>')($rootScope);
          $rootScope.$apply();
          expect(element.text()).toBe('' + $rootScope.$id);
        });

      });

      test('should expose the directive controller to transcluded children', () => {
        var capturedChildCtrl;
        angular.mock.module(function() {
          directive('transclude', ngInternals.valueFn({
            transclude: 'content',
            controller() {
            },
            link(scope, element, attr, ctrl, $transclude) {
              $transclude(function(clone) {
                element.append(clone);
              });
            }
          }));
          directive('child', ngInternals.valueFn({
            require: '^transclude',
            link(scope, element, attr, ctrl) {
              capturedChildCtrl = ctrl;
            }
          }));
        });
        angular.mock.inject(function($compile) {
          element = $compile('<div transclude><div child></div></div>')($rootScope);
          expect(capturedChildCtrl).toBeTruthy();
        });
      });


      // See issue https://github.com/angular/angular.js/issues/14924
      test('should not process top-level transcluded text nodes merged into their sibling',
        function() {
          angular.mock.module(function() {
            directive('transclude', ngInternals.valueFn({
              template: '<ng-transclude></ng-transclude>',
              transclude: true,
              scope: {}
            }));
          });

          angular.mock.inject(function($compile) {
            element = angular.element('<div transclude></div>');
            element[0].appendChild(document.createTextNode('1{{ value }}'));
            element[0].appendChild(document.createTextNode('2{{ value }}'));
            element[0].appendChild(document.createTextNode('3{{ value }}'));

            var initialWatcherCount = $rootScope.$countWatchers();
            $compile(element)($rootScope);
            $rootScope.$apply('value = 0');
            var newWatcherCount = $rootScope.$countWatchers() - initialWatcherCount;

            expect(element.text()).toBe('102030');
            expect(newWatcherCount).toBe(3);
          });
        }
      );


      // see issue https://github.com/angular/angular.js/issues/9413
      describe('passing a parent bound transclude function to the link ' +
          'function returned from `$compile`', function() {

        beforeEach(angular.mock.module(function() {
          directive('lazyCompile', function($compile) {
            return {
              compile(tElement, tAttrs) {
                var content = tElement.contents();
                tElement.empty();
                return function(scope, element, attrs, ctrls, transcludeFn) {
                  element.append(content);
                  $compile(content)(scope, undefined, {
                    parentBoundTranscludeFn: transcludeFn
                  });
                };
              }
            };
          });
          directive('toggle', ngInternals.valueFn({
            scope: {t: '=toggle'},
            transclude: true,
            template: '<div ng-if="t"><lazy-compile><div ng-transclude></div></lazy-compile></div>'
          }));
        }));

        test('should preserve the bound scope', () => {

          angular.mock.inject(function($compile, $rootScope) {
            element = $compile(
              '<div>' +
                '<div ng-init="outer=true"></div>' +
                '<div toggle="t">' +
                  '<span ng-if="outer">Success</span><span ng-if="!outer">Error</span>' +
                '</div>' +
              '</div>')($rootScope);

            $rootScope.$apply('t = false');
            expect($rootScope.$countChildScopes()).toBe(1);
            expect(element.text()).toBe('');

            $rootScope.$apply('t = true');
            expect($rootScope.$countChildScopes()).toBe(4);
            expect(element.text()).toBe('Success');

            $rootScope.$apply('t = false');
            expect($rootScope.$countChildScopes()).toBe(1);
            expect(element.text()).toBe('');

            $rootScope.$apply('t = true');
            expect($rootScope.$countChildScopes()).toBe(4);
            expect(element.text()).toBe('Success');
          });
        });


        test('should preserve the bound scope when using recursive transclusion', () => {

          directive('recursiveTransclude', ngInternals.valueFn({
            transclude: true,
            template: '<div><lazy-compile><div ng-transclude></div></lazy-compile></div>'
          }));

          angular.mock.inject(function($compile, $rootScope) {
            element = $compile(
              '<div>' +
                '<div ng-init="outer=true"></div>' +
                '<div toggle="t">' +
                  '<div recursive-transclude>' +
                    '<span ng-if="outer">Success</span><span ng-if="!outer">Error</span>' +
                  '</div>' +
                '</div>' +
              '</div>')($rootScope);

            $rootScope.$apply('t = false');
            expect($rootScope.$countChildScopes()).toBe(1);
            expect(element.text()).toBe('');

            $rootScope.$apply('t = true');
            expect($rootScope.$countChildScopes()).toBe(4);
            expect(element.text()).toBe('Success');

            $rootScope.$apply('t = false');
            expect($rootScope.$countChildScopes()).toBe(1);
            expect(element.text()).toBe('');

            $rootScope.$apply('t = true');
            expect($rootScope.$countChildScopes()).toBe(4);
            expect(element.text()).toBe('Success');
          });
        });
      });


      // see issue https://github.com/angular/angular.js/issues/9095
      describe('removing a transcluded element', () => {

        beforeEach(angular.mock.module(function() {
          directive('toggle', function() {
            return {
              transclude: true,
              template: '<div ng:if="t"><div ng:transclude></div></div>'
            };
          });
        }));


        test('should not leak the transclude scope when the transcluded content is an element transclusion directive',
              angular.mock.inject(function($compile, $rootScope) {

          element = $compile(
            '<div toggle>' +
              '<div ng:repeat="msg in [\'msg-1\']">{{ msg }}</div>' +
            '</div>'
          )($rootScope);

          $rootScope.$apply('t = true');
          expect(element.text()).toContain('msg-1');
          // Expected scopes: $rootScope, ngIf, transclusion, ngRepeat
          expect($rootScope.$countChildScopes()).toBe(3);

          $rootScope.$apply('t = false');
          expect(element.text()).not.toContain('msg-1');
          // Expected scopes: $rootScope
          expect($rootScope.$countChildScopes()).toBe(0);

          $rootScope.$apply('t = true');
          expect(element.text()).toContain('msg-1');
          // Expected scopes: $rootScope, ngIf, transclusion, ngRepeat
          expect($rootScope.$countChildScopes()).toBe(3);

          $rootScope.$apply('t = false');
          expect(element.text()).not.toContain('msg-1');
          // Expected scopes: $rootScope
          expect($rootScope.$countChildScopes()).toBe(0);
        }));


        test('should not leak the transclude scope when the transcluded content is an multi-element transclusion directive',
              angular.mock.inject(function($compile, $rootScope) {

          element = $compile(
            '<div toggle>' +
              '<div ng:repeat-start="msg in [\'msg-1\']">{{ msg }}</div>' +
              '<div ng:repeat-end>{{ msg }}</div>' +
            '</div>'
          )($rootScope);

          $rootScope.$apply('t = true');
          expect(element.text()).toContain('msg-1msg-1');
          // Expected scopes: $rootScope, ngIf, transclusion, ngRepeat
          expect($rootScope.$countChildScopes()).toBe(3);

          $rootScope.$apply('t = false');
          expect(element.text()).not.toContain('msg-1msg-1');
          // Expected scopes: $rootScope
          expect($rootScope.$countChildScopes()).toBe(0);

          $rootScope.$apply('t = true');
          expect(element.text()).toContain('msg-1msg-1');
          // Expected scopes: $rootScope, ngIf, transclusion, ngRepeat
          expect($rootScope.$countChildScopes()).toBe(3);

          $rootScope.$apply('t = false');
          expect(element.text()).not.toContain('msg-1msg-1');
          // Expected scopes: $rootScope
          expect($rootScope.$countChildScopes()).toBe(0);
        }));


        test('should not leak the transclude scope if the transcluded contains only comments',
              angular.mock.inject(function($compile, $rootScope) {

          element = $compile(
            '<div toggle>' +
              '<!-- some comment -->' +
            '</div>'
          )($rootScope);

          $rootScope.$apply('t = true');
          expect(element.html()).toContain('some comment');
          // Expected scopes: $rootScope, ngIf, transclusion
          expect($rootScope.$countChildScopes()).toBe(2);

          $rootScope.$apply('t = false');
          expect(element.html()).not.toContain('some comment');
          // Expected scopes: $rootScope
          expect($rootScope.$countChildScopes()).toBe(0);

          $rootScope.$apply('t = true');
          expect(element.html()).toContain('some comment');
          // Expected scopes: $rootScope, ngIf, transclusion
          expect($rootScope.$countChildScopes()).toBe(2);

          $rootScope.$apply('t = false');
          expect(element.html()).not.toContain('some comment');
          // Expected scopes: $rootScope
          expect($rootScope.$countChildScopes()).toBe(0);
        }));

        test('should not leak the transclude scope if the transcluded contains only text nodes',
              angular.mock.inject(function($compile, $rootScope) {

          element = $compile(
            '<div toggle>' +
              'some text' +
            '</div>'
          )($rootScope);

          $rootScope.$apply('t = true');
          expect(element.html()).toContain('some text');
          // Expected scopes: $rootScope, ngIf, transclusion
          expect($rootScope.$countChildScopes()).toBe(2);

          $rootScope.$apply('t = false');
          expect(element.html()).not.toContain('some text');
          // Expected scopes: $rootScope
          expect($rootScope.$countChildScopes()).toBe(0);

          $rootScope.$apply('t = true');
          expect(element.html()).toContain('some text');
          // Expected scopes: $rootScope, ngIf, transclusion
          expect($rootScope.$countChildScopes()).toBe(2);

          $rootScope.$apply('t = false');
          expect(element.html()).not.toContain('some text');
          // Expected scopes: $rootScope
          expect($rootScope.$countChildScopes()).toBe(0);
        }));

        test('should mark as destroyed all sub scopes of the scope being destroyed',
              angular.mock.inject(function($compile, $rootScope) {

          element = $compile(
            '<div toggle>' +
              '<div ng:repeat="msg in [\'msg-1\']">{{ msg }}</div>' +
            '</div>'
          )($rootScope);

          $rootScope.$apply('t = true');
          var childScopes = getChildScopes($rootScope);

          $rootScope.$apply('t = false');
          for (var i = 0; i < childScopes.length; ++i) {
            expect(childScopes[i].$$destroyed).toBe(true);
          }
        }));
      });


      describe('nested transcludes', () => {

        beforeEach(angular.mock.module(function($compileProvider) {

          $compileProvider.directive('noop', ngInternals.valueFn({}));

          $compileProvider.directive('sync', ngInternals.valueFn({
            template: '<div ng-transclude></div>',
            transclude: true
          }));

          $compileProvider.directive('async', ngInternals.valueFn({
            templateUrl: 'async',
            transclude: true
          }));

          $compileProvider.directive('syncSync', ngInternals.valueFn({
            template: '<div noop><div sync><div ng-transclude></div></div></div>',
            transclude: true
          }));

          $compileProvider.directive('syncAsync', ngInternals.valueFn({
            template: '<div noop><div async><div ng-transclude></div></div></div>',
            transclude: true
          }));

          $compileProvider.directive('asyncSync', ngInternals.valueFn({
            templateUrl: 'asyncSync',
            transclude: true
          }));

          $compileProvider.directive('asyncAsync', ngInternals.valueFn({
            templateUrl: 'asyncAsync',
            transclude: true
          }));

        }));

        beforeEach(angular.mock.inject(function($templateCache) {
          $templateCache.put('async', '<div ng-transclude></div>');
          $templateCache.put('asyncSync', '<div noop><div sync><div ng-transclude></div></div></div>');
          $templateCache.put('asyncAsync', '<div noop><div async><div ng-transclude></div></div></div>');
        }));


        test('should allow nested transclude directives with sync template containing sync template', angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div sync-sync>transcluded content</div>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

        test('should allow nested transclude directives with sync template containing async template', angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div sync-async>transcluded content</div>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

        test('should allow nested transclude directives with async template containing sync template', angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div async-sync>transcluded content</div>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

        test('should allow nested transclude directives with async template containing asynch template', angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div async-async>transcluded content</div>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));


        test('should not leak memory with nested transclusion', () => {
          angular.mock.inject(function($compile, $rootScope) {
            var size;
            var initialSize = jqLiteCacheSize();

            element = angular.element('<div><ul><li ng-repeat="n in nums">{{n}} => <i ng-if="0 === n%2">Even</i><i ng-if="1 === n%2">Odd</i></li></ul></div>');
            $compile(element)($rootScope.$new());

            $rootScope.nums = [0,1,2];
            $rootScope.$apply();
            size = jqLiteCacheSize();

            $rootScope.nums = [3,4,5];
            $rootScope.$apply();
            expect(jqLiteCacheSize()).toEqual(size);

            element.remove();
            expect(jqLiteCacheSize()).toEqual(initialSize);
          });
        });
      });


      describe('nested isolated scope transcludes', () => {
        beforeEach(angular.mock.module(function($compileProvider) {

          $compileProvider.directive('trans', ngInternals.valueFn({
            restrict: 'E',
            template: '<div ng-transclude></div>',
            transclude: true
          }));

          $compileProvider.directive('transAsync', ngInternals.valueFn({
            restrict: 'E',
            templateUrl: 'transAsync',
            transclude: true
          }));

          $compileProvider.directive('iso', ngInternals.valueFn({
            restrict: 'E',
            transclude: true,
            template: '<trans><span ng-transclude></span></trans>',
            scope: {}
          }));
          $compileProvider.directive('isoAsync1', ngInternals.valueFn({
            restrict: 'E',
            transclude: true,
            template: '<trans-async><span ng-transclude></span></trans-async>',
            scope: {}
          }));
          $compileProvider.directive('isoAsync2', ngInternals.valueFn({
            restrict: 'E',
            transclude: true,
            templateUrl: 'isoAsync',
            scope: {}
          }));
        }));

        beforeEach(angular.mock.inject(function($templateCache) {
          $templateCache.put('transAsync', '<div ng-transclude></div>');
          $templateCache.put('isoAsync', '<trans-async><span ng-transclude></span></trans-async>');
        }));


        test('should pass the outer scope to the transclude on the isolated template sync-sync', angular.mock.inject(function($compile, $rootScope) {

          $rootScope.val = 'transcluded content';
          element = $compile('<iso><span ng-bind="val"></span></iso>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

        test('should pass the outer scope to the transclude on the isolated template async-sync', angular.mock.inject(function($compile, $rootScope) {

          $rootScope.val = 'transcluded content';
          element = $compile('<iso-async1><span ng-bind="val"></span></iso-async1>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

        test('should pass the outer scope to the transclude on the isolated template async-async', angular.mock.inject(function($compile, $rootScope) {

          $rootScope.val = 'transcluded content';
          element = $compile('<iso-async2><span ng-bind="val"></span></iso-async2>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

      });

      describe('multiple siblings receiving transclusion', () => {

        test('should only receive transclude from parent', () => {

          angular.mock.module(function($compileProvider) {

            $compileProvider.directive('myExample', ngInternals.valueFn({
              scope: {},
              link: function link(scope, element, attrs) {
                var foo = element[0].querySelector('.foo');
                scope.children = angular.element(foo).children().length;
              },
              template: '<div>' +
                '<div>myExample {{children}}!</div>' +
                '<div ng-if="children">has children</div>' +
                '<div class="foo" ng-transclude></div>' +
              '</div>',
              transclude: true

            }));

          });

          angular.mock.inject(function($compile, $rootScope) {
            var element = $compile('<div my-example></div>')($rootScope);
            $rootScope.$digest();
            expect(element.text()).toEqual('myExample 0!');
            dealoc(element);

            element = $compile('<div my-example><p></p></div>')($rootScope);
            $rootScope.$digest();
            expect(element.text()).toEqual('myExample 1!has children');
            dealoc(element);
          });
        });
      });
    });


    describe('element transclusion', () => {

      test('should support basic element transclusion', () => {
        angular.mock.module(function() {
          directive('trans', function(log) {
            return {
              transclude: 'element',
              priority: 2,
              controller($transclude) { this.$transclude = $transclude; },
              compile(element, attrs, template) {
                log('compile: ' + angular.mock.dump(element));
                return function(scope, element, attrs, ctrl) {
                  log('link');
                  var cursor = element;
                  template(scope.$new(), function(clone) {cursor.after(cursor = clone);});
                  ctrl.$transclude(function(clone) {cursor.after(clone);});
                };
              }
            };
          });
        });
        angular.mock.inject(function(log, $rootScope, $compile) {
          element = $compile('<div><div high-log trans="text" log>{{$parent.$id}}-{{$id}};</div></div>')($rootScope);
          $rootScope.$apply();
          expect(log).toEqual('compile: <!-- trans: text -->; link; LOG; LOG; HIGH');
          expect(element.text()).toEqual('1-2;1-3;');
        });
      });

      test('should only allow one element transclusion per element', () => {
        angular.mock.module(function() {
          directive('first', ngInternals.valueFn({
            transclude: 'element'
          }));
          directive('second', ngInternals.valueFn({
            transclude: 'element'
          }));
        });
        angular.mock.inject(function($compile) {
          expect(function() {
            $compile('<div first second></div>');
          }).toThrowMinErr('$compile', 'multidir', 'Multiple directives [first, second] asking for transclusion on: ' +
                  '<!-- first: -->');
        });
      });


      test('should only allow one element transclusion per element when directives have different priorities', () => {
        // we restart compilation in this case and we need to remember the duplicates during the second compile
        // regression #3893
        angular.mock.module(function() {
          directive('first', ngInternals.valueFn({
            transclude: 'element',
            priority: 100
          }));
          directive('second', ngInternals.valueFn({
            transclude: 'element'
          }));
        });
        angular.mock.inject(function($compile) {
          expect(function() {
            $compile('<div first second></div>');
          }).toThrowMinErr('$compile', 'multidir', /Multiple directives \[first, second] asking for transclusion on: <div .+/);
        });
      });


      test('should only allow one element transclusion per element when async replace directive is in the mix', () => {
        angular.mock.module(function() {
          directive('template', ngInternals.valueFn({
            templateUrl: 'template.html',
            replace: true
          }));
          directive('first', ngInternals.valueFn({
            transclude: 'element',
            priority: 100
          }));
          directive('second', ngInternals.valueFn({
            transclude: 'element'
          }));
        });
        angular.mock.inject(function($compile, $httpBackend) {
          $httpBackend.expectGET('template.html').respond('<p second>template.html</p>');

          expect(function() {
            $compile('<div template first></div>');
            $httpBackend.flush();
          }).toThrowMinErr('$compile', 'multidir',
              'Multiple directives [first, second] asking for transclusion on: <p ');
        });
      });

      test('should only allow one element transclusion per element when replace directive is in the mix', () => {
        angular.mock.module(function() {
          directive('template', ngInternals.valueFn({
            template: '<p second></p>',
            replace: true
          }));
          directive('first', ngInternals.valueFn({
            transclude: 'element',
            priority: 100
          }));
          directive('second', ngInternals.valueFn({
            transclude: 'element'
          }));
        });
        angular.mock.inject(function($compile) {
          expect(function() {
            $compile('<div template first></div>');
          }).toThrowMinErr('$compile', 'multidir', /Multiple directives \[first, second] asking for transclusion on: <p .+/);
        });
      });


      test('should support transcluded element on root content', () => {
        var comment;
        angular.mock.module(function() {
          directive('transclude', ngInternals.valueFn({
            transclude: 'element',
            compile(element, attr, linker) {
              return function(scope, element, attr) {
                comment = element;
              };
            }
          }));
        });
        angular.mock.inject(function($compile, $rootScope) {
          var element = angular.element('<div>before<div transclude></div>after</div>').contents();
          expect(element.length).toEqual(3);
          expect(ngInternals.nodeName_(element[1])).toBe('div');
          $compile(element)($rootScope);
          expect(ngInternals.nodeName_(element[1])).toBe('#comment');
          expect(ngInternals.nodeName_(comment)).toBe('#comment');
        });
      });


      test('should terminate compilation only for element transclusion', () => {
        angular.mock.module(function() {
          directive('elementTrans', function(log) {
            return {
              transclude: 'element',
              priority: 50,
              compile: log.fn('compile:elementTrans')
            };
          });
          directive('regularTrans', function(log) {
            return {
              transclude: true,
              priority: 50,
              compile: log.fn('compile:regularTrans')
            };
          });
        });
        angular.mock.inject(function(log, $compile, $rootScope) {
          $compile('<div><div element-trans log="elem"></div><div regular-trans log="regular"></div></div>')($rootScope);
          expect(log).toEqual('compile:elementTrans; compile:regularTrans; regular');
        });
      });


      test('should instantiate high priority controllers only once, but low priority ones each time we transclude',
          function() {
        angular.mock.module(function() {
          directive('elementTrans', function(log) {
            return {
              transclude: 'element',
              priority: 50,
              controller($transclude, $element) {
                log('controller:elementTrans');
                $transclude(function(clone) {
                  $element.after(clone);
                });
                $transclude(function(clone) {
                  $element.after(clone);
                });
                $transclude(function(clone) {
                  $element.after(clone);
                });
              }
            };
          });
          directive('normalDir', function(log) {
            return {
              controller() {
                log('controller:normalDir');
              }
            };
          });
        });
        angular.mock.inject(function($compile, $rootScope, log) {
          element = $compile('<div><div element-trans normal-dir></div></div>')($rootScope);
          expect(log).toEqual([
            'controller:elementTrans',
            'controller:normalDir',
            'controller:normalDir',
            'controller:normalDir'
          ]);
        });
      });

      test('should allow to access $transclude in the same directive', () => {
        var _$transclude;
        angular.mock.module(function() {
          directive('transclude', ngInternals.valueFn({
            transclude: 'element',
            controller($transclude) {
              _$transclude = $transclude;
            }
          }));
        });
        angular.mock.inject(function($compile) {
          element = $compile('<div transclude></div>')($rootScope);
          expect(_$transclude).toBeDefined();
        });
      });

      test('should copy the directive controller to all clones', () => {
        var transcludeCtrl;
        var cloneCount = 2;
        angular.mock.module(function() {
          directive('transclude', ngInternals.valueFn({
            transclude: 'element',
            controller() {
              transcludeCtrl = this;
            },
            link(scope, el, attr, ctrl, $transclude) {
              var i;
              for (i = 0; i < cloneCount; i++) {
                $transclude(cloneAttach);
              }

              function cloneAttach(clone) {
                el.after(clone);
              }
            }
          }));
        });
        angular.mock.inject(function($compile) {
          element = $compile('<div><div transclude></div></div>')($rootScope);
          var children = element.children();
          var i;
          for (i = 0; i < cloneCount; i++) {
            expect(children.eq(i).data('$transcludeController')).toBe(transcludeCtrl);
          }
        });
      });

      test('should expose the directive controller to transcluded children', () => {
        var capturedTranscludeCtrl;
        angular.mock.module(function() {
          directive('transclude', ngInternals.valueFn({
            transclude: 'element',
            controller() {
            },
            link(scope, element, attr, ctrl, $transclude) {
              $transclude(scope, function(clone) {
                element.after(clone);
              });
            }
          }));
          directive('child', ngInternals.valueFn({
            require: '^transclude',
            link(scope, element, attr, ctrl) {
              capturedTranscludeCtrl = ctrl;
            }
          }));
        });
        angular.mock.inject(function($compile) {
          // We need to wrap the transclude directive's element in a parent element so that the
          // cloned element gets deallocated/cleaned up correctly
          element = $compile('<div><div transclude><div child></div></div></div>')($rootScope);
          expect(capturedTranscludeCtrl).toBeTruthy();
        });
      });

      test('should allow access to $transclude in a templateUrl directive', () => {
        var transclude;
        angular.mock.module(function() {
          directive('template', ngInternals.valueFn({
            templateUrl: 'template.html',
            replace: true
          }));
          directive('transclude', ngInternals.valueFn({
            transclude: 'content',
            controller($transclude) {
              transclude = $transclude;
            }
          }));
        });
        angular.mock.inject(function($compile, $httpBackend) {
          $httpBackend.expectGET('template.html').respond('<div transclude></div>');
          element = $compile('<div template></div>')($rootScope);
          $httpBackend.flush();
          expect(transclude).toBeDefined();
        });
      });

      // issue #6006
      test('should link directive with $element as a comment node', () => {
        angular.mock.module(function($provide) {
          directive('innerAgain', function(log) {
            return {
              transclude: 'element',
              link(scope, element, attr, controllers, transclude) {
                log('innerAgain:' + angular.$$lowercase(ngInternals.nodeName_(element)) + ':' + ngInternals.trim(element[0].data));
                transclude(scope, function(clone) {
                  element.parent().append(clone);
                });
              }
            };
          });
          directive('inner', function(log) {
            return {
              replace: true,
              templateUrl: 'inner.html',
              link(scope, element) {
                log('inner:' + angular.$$lowercase(ngInternals.nodeName_(element)) + ':' + ngInternals.trim(element[0].data));
              }
            };
          });
          directive('outer', function(log) {
            return {
              transclude: 'element',
              link(scope, element, attrs, controllers, transclude) {
                log('outer:' + angular.$$lowercase(ngInternals.nodeName_(element)) + ':' + ngInternals.trim(element[0].data));
                transclude(scope, function(clone) {
                  element.parent().append(clone);
                });
              }
            };
          });
        });
        angular.mock.inject(function(log, $compile, $rootScope, $templateCache) {
          $templateCache.put('inner.html', '<div inner-again><p>Content</p></div>');
          element = $compile('<div><div outer><div inner></div></div></div>')($rootScope);
          $rootScope.$digest();
          var child = element.children();

          expect(log.toArray()).toEqual([
            'outer:#comment:outer:',
            'innerAgain:#comment:innerAgain:',
            'inner:#comment:innerAgain:'
          ]);
          expect(child.length).toBe(1);
          expect(child.contents().length).toBe(2);
          expect(angular.$$lowercase(ngInternals.nodeName_(child.contents().eq(0)))).toBe('#comment');
          expect(angular.$$lowercase(ngInternals.nodeName_(child.contents().eq(1)))).toBe('div');
        });
      });
    });


    test('should be possible to change the scope of a directive using $provide', () => {
      angular.mock.module(function($provide) {
        directive('foo', function() {
          return {
            scope: {},
            template: '<div></div>'
          };
        });
        $provide.decorator('fooDirective', function($delegate) {
          var directive = $delegate[0];
          directive.scope.something = '=';
          directive.template = '<span>{{something}}</span>';
          return $delegate;
        });
      });
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div><div foo something="bar"></div></div>')($rootScope);
        $rootScope.bar = 'bar';
        $rootScope.$digest();
        expect(element.text()).toBe('bar');
      });
    });


    test('should distinguish different bindings with the same binding name', () => {
      angular.mock.module(function() {
        directive('foo', function() {
          return {
            scope: {
              foo: '=',
              bar: '='
            },
            template: '<div><div>{{foo}}</div><div>{{bar}}</div></div>'
          };
        });
      });
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<div><div foo="\'foo\'" bar="\'bar\'"></div></div>')($rootScope);
        $rootScope.$digest();
        expect(element.text()).toBe('foobar');
      });
    });


    test('should safely create transclude comment node and not break with "-->"',
        angular.mock.inject(function($rootScope) {
      // see: https://github.com/angular/angular.js/issues/1740
      element = $compile('<ul><li ng-repeat="item in [\'-->\', \'x\']">{{item}}|</li></ul>')($rootScope);
      $rootScope.$digest();

      expect(element.text()).toBe('-->|x|');
    }));


    describe('lazy compilation', () => {
      // See https://github.com/angular/angular.js/issues/7183
      test('should pass transclusion through to template of a \'replace\' directive', () => {
        angular.mock.module(function() {
          directive('transSync', function() {
            return {
              transclude: true,
              link(scope, element, attr, ctrl, transclude) {

                expect(transclude).toEqual(expect.any(Function));

                transclude(function(child) { element.append(child); });
              }
            };
          });

          directive('trans', function($timeout) {
            return {
              transclude: true,
              link(scope, element, attrs, ctrl, transclude) {

                // We use timeout here to simulate how ng-if works
                $timeout(function() {
                  transclude(function(child) { element.append(child); });
                });
              }
            };
          });

          directive('replaceWithTemplate', function() {
            return {
              templateUrl: 'template.html',
              replace: true
            };
          });
        });

        angular.mock.inject(function($compile, $rootScope, $templateCache, $timeout) {

          $templateCache.put('template.html', '<div trans-sync>Content To Be Transcluded</div>');

          expect(function() {
            element = $compile('<div><div trans><div replace-with-template></div></div></div>')($rootScope);
            $timeout.flush();
          }).not.toThrow();

          expect(element.text()).toEqual('Content To Be Transcluded');
        });

      });

      test('should lazily compile the contents of directives that are transcluded', () => {
        var innerCompilationCount = 0;
        var transclude;

        angular.mock.module(function() {
          directive('trans', ngInternals.valueFn({
            transclude: true,
            controller($transclude) {
              transclude = $transclude;
            }
          }));

          directive('inner', ngInternals.valueFn({
            template: '<span>FooBar</span>',
            compile() {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<trans><inner></inner></trans>')($rootScope);
          expect(innerCompilationCount).toBe(0);
          transclude(function(child) { element.append(child); });
          expect(innerCompilationCount).toBe(1);
          expect(element.text()).toBe('FooBar');
        });
      });

      test('should lazily compile the contents of directives that are transcluded with a template', () => {
        var innerCompilationCount = 0;
        var transclude;

        angular.mock.module(function() {
          directive('trans', ngInternals.valueFn({
            transclude: true,
            template: '<div>Baz</div>',
            controller($transclude) {
              transclude = $transclude;
            }
          }));

          directive('inner', ngInternals.valueFn({
            template: '<span>FooBar</span>',
            compile() {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<trans><inner></inner></trans>')($rootScope);
          expect(innerCompilationCount).toBe(0);
          transclude(function(child) { element.append(child); });
          expect(innerCompilationCount).toBe(1);
          expect(element.text()).toBe('BazFooBar');
        });
      });

      test('should lazily compile the contents of directives that are transcluded with a templateUrl', () => {
        var innerCompilationCount = 0;
        var transclude;

        angular.mock.module(function() {
          directive('trans', ngInternals.valueFn({
            transclude: true,
            templateUrl: 'baz.html',
            controller($transclude) {
              transclude = $transclude;
            }
          }));

          directive('inner', ngInternals.valueFn({
            template: '<span>FooBar</span>',
            compile() {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(function($compile, $rootScope, $httpBackend) {
          $httpBackend.expectGET('baz.html').respond('<div>Baz</div>');
          element = $compile('<trans><inner></inner></trans>')($rootScope);
          $httpBackend.flush();

          expect(innerCompilationCount).toBe(0);
          transclude(function(child) { element.append(child); });
          expect(innerCompilationCount).toBe(1);
          expect(element.text()).toBe('BazFooBar');
        });
      });

      test('should lazily compile the contents of directives that are transclude element', () => {
        var innerCompilationCount = 0;
        var transclude;

        angular.mock.module(function() {
          directive('trans', ngInternals.valueFn({
            transclude: 'element',
            controller($transclude) {
              transclude = $transclude;
            }
          }));

          directive('inner', ngInternals.valueFn({
            template: '<span>FooBar</span>',
            compile() {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(function($compile, $rootScope) {
          element = $compile('<div><trans><inner></inner></trans></div>')($rootScope);
          expect(innerCompilationCount).toBe(0);
          transclude(function(child) { element.append(child); });
          expect(innerCompilationCount).toBe(1);
          expect(element.text()).toBe('FooBar');
        });
      });

      test('should lazily compile transcluded directives with ngIf on them', () => {
        var innerCompilationCount = 0;
        var outerCompilationCount = 0;
        var transclude;

        angular.mock.module(function() {
          directive('outer', ngInternals.valueFn({
            transclude: true,
            compile() {
              outerCompilationCount += 1;
            },
            controller($transclude) {
              transclude = $transclude;
            }
          }));

          directive('inner', ngInternals.valueFn({
            template: '<span>FooBar</span>',
            compile() {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(function($compile, $rootScope) {
          $rootScope.shouldCompile = false;

          element = $compile('<div><outer ng-if="shouldCompile"><inner></inner></outer></div>')($rootScope);
          expect(outerCompilationCount).toBe(0);
          expect(innerCompilationCount).toBe(0);
          expect(transclude).toBeUndefined();
          $rootScope.$apply('shouldCompile=true');
          expect(outerCompilationCount).toBe(1);
          expect(innerCompilationCount).toBe(0);
          expect(transclude).toBeDefined();
          transclude(function(child) { element.append(child); });
          expect(outerCompilationCount).toBe(1);
          expect(innerCompilationCount).toBe(1);
          expect(element.text()).toBe('FooBar');
        });
      });

      test('should eagerly compile multiple directives with transclusion and templateUrl/replace', () => {
        var innerCompilationCount = 0;

        angular.mock.module(function() {
          directive('outer', ngInternals.valueFn({
            transclude: true
          }));

          directive('outer', ngInternals.valueFn({
            templateUrl: 'inner.html',
            replace: true
          }));

          directive('inner', ngInternals.valueFn({
            compile() {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(function($compile, $rootScope, $httpBackend) {
          $httpBackend.expectGET('inner.html').respond('<inner></inner>');
          element = $compile('<outer></outer>')($rootScope);
          $httpBackend.flush();

          expect(innerCompilationCount).toBe(1);
        });
      });
    });

  });

  describe('multi-slot transclude', () => {
    test('should only include elements without a matching transclusion element in default transclusion slot', () => {
      angular.mock.module(function() {
        directive('minionComponent', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              bossSlot: 'boss'
            },
            template:
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile(
          '<minion-component>' +
            '<span>stuart</span>' +
            '<span>bob</span>' +
            '<boss>gru</boss>' +
            '<span>kevin</span>' +
          '</minion-component>')($rootScope);
        $rootScope.$apply();
        expect(element.text()).toEqual('stuartbobkevin');
      });
    });

    test('should use the default transclusion slot if the ng-transclude attribute has the same value as its key', () => {
      angular.mock.module(function() {
        directive('minionComponent', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {},
            template:
              '<div class="a" ng-transclude="ng-transclude"></div>' +
              '<div class="b" ng:transclude="ng:transclude"></div>' +
              '<div class="c" data-ng-transclude="data-ng-transclude"></div>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile(
          '<minion-component>' +
            '<span>stuart</span>' +
            '<span>bob</span>' +
            '<span>kevin</span>' +
          '</minion-component>')($rootScope);
        $rootScope.$apply();
        var a = element.children().eq(0);
        var b = element.children().eq(1);
        var c = element.children().eq(2);
        expect(a).toHaveClass('a');
        expect(b).toHaveClass('b');
        expect(c).toHaveClass('c');
        expect(a.text()).toEqual('stuartbobkevin');
        expect(b.text()).toEqual('stuartbobkevin');
        expect(c.text()).toEqual('stuartbobkevin');
      });
    });


    test('should include non-element nodes in the default transclusion', () => {
      angular.mock.module(function() {
        directive('minionComponent', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              bossSlot: 'boss'
            },
            template:
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile(
          '<minion-component>' +
            'text1' +
            '<span>stuart</span>' +
            '<span>bob</span>' +
            '<boss>gru</boss>' +
            'text2' +
            '<span>kevin</span>' +
          '</minion-component>')($rootScope);
        $rootScope.$apply();
        expect(element.text()).toEqual('text1stuartbobtext2kevin');
      });
    });

    test('should transclude elements to an `ng-transclude` with a matching transclusion slot name', () => {
      angular.mock.module(function() {
        directive('minionComponent', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: 'boss'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot"></div>' +
              '<div class="minion" ng-transclude="minionSlot"></div>' +
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile(
          '<minion-component>' +
            '<minion>stuart</minion>' +
            '<span>dorothy</span>' +
            '<boss>gru</boss>' +
            '<minion>kevin</minion>' +
          '</minion-component>')($rootScope);
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('gru');
        expect(element.children().eq(1).text()).toEqual('stuartkevin');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });


    test('should use the `ng-transclude-slot` attribute if ng-transclude is used as an element', () => {
      angular.mock.module(function() {
        directive('minionComponent', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: 'boss'
            },
            template:
              '<ng-transclude class="boss" ng-transclude-slot="bossSlot"></ng-transclude>' +
              '<ng-transclude class="minion" ng-transclude-slot="minionSlot"></ng-transclude>' +
              '<ng-transclude class="other"></ng-transclude>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile(
          '<minion-component>' +
            '<minion>stuart</minion>' +
            '<span>dorothy</span>' +
            '<boss>gru</boss>' +
            '<minion>kevin</minion>' +
          '</minion-component>')($rootScope);
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('gru');
        expect(element.children().eq(1).text()).toEqual('stuartkevin');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });

    test('should error if a required transclude slot is not filled', () => {
      angular.mock.module(function() {
        directive('minionComponent', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: 'boss'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot"></div>' +
              '<div class="minion" ng-transclude="minionSlot"></div>' +
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        expect(function() {
          element = $compile(
            '<minion-component>' +
              '<minion>stuart</minion>' +
              '<span>dorothy</span>' +
            '</minion-component>')($rootScope);
        }).toThrowMinErr('$compile', 'reqslot', 'Required transclusion slot `bossSlot` was not filled.');
      });
    });


    test('should not error if an optional transclude slot is not filled', () => {
      angular.mock.module(function() {
        directive('minionComponent', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: '?boss'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot"></div>' +
              '<div class="minion" ng-transclude="minionSlot"></div>' +
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile(
          '<minion-component>' +
            '<minion>stuart</minion>' +
            '<span>dorothy</span>' +
          '</minion-component>')($rootScope);
        $rootScope.$apply();
        expect(element.children().eq(1).text()).toEqual('stuart');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });


    test('should error if we try to transclude a slot that was not declared by the directive', () => {
      angular.mock.module(function() {
        directive('minionComponent', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot"></div>' +
              '<div class="minion" ng-transclude="minionSlot"></div>' +
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        expect(function() {
          element = $compile(
            '<minion-component>' +
              '<minion>stuart</minion>' +
              '<span>dorothy</span>' +
            '</minion-component>')($rootScope);
        }).toThrowMinErr('$compile', 'noslot',
          'No parent directive that requires a transclusion with slot name "bossSlot". ' +
          'Element: <div class="boss" ng-transclude="bossSlot">');
      });
    });

    test('should allow the slot name to equal the element name', () => {

      angular.mock.module(function() {
        directive('foo', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              bar: 'bar'
            },
            template:
              '<div class="other" ng-transclude="bar"></div>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile(
          '<foo>' +
            '<bar>baz</bar>' +
          '</foo>')($rootScope);
        $rootScope.$apply();
        expect(element.text()).toEqual('baz');
      });
    });


    test('should match the normalized form of the element name', () => {
      angular.mock.module(function() {
        directive('foo', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              fooBarSlot: 'fooBar',
              mooKarSlot: 'mooKar'
            },
            template:
              '<div class="a" ng-transclude="fooBarSlot"></div>' +
              '<div class="b" ng-transclude="mooKarSlot"></div>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile(
          '<foo>' +
            '<foo-bar>bar1</foo-bar>' +
            '<foo:bar>bar2</foo:bar>' +
            '<moo-kar>baz1</moo-kar>' +
            '<data-moo-kar>baz2</data-moo-kar>' +
          '</foo>')($rootScope);
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('bar1bar2');
        expect(element.children().eq(1).text()).toEqual('baz1baz2');
      });
    });


    test('should return true from `isSlotFilled(slotName) for slots that have content in the transclusion', () => {
      var capturedTranscludeFn;
      angular.mock.module(function() {
        directive('minionComponent', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: '?boss'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot"></div>' +
              '<div class="minion" ng-transclude="minionSlot"></div>' +
              '<div class="other" ng-transclude></div>',
            link(s, e, a, c, transcludeFn) {
              capturedTranscludeFn = transcludeFn;
            }
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile, log) {
        element = $compile(
          '<minion-component>' +
          '  <minion>stuart</minion>' +
          '  <minion>bob</minion>' +
          '  <span>dorothy</span>' +
          '</minion-component>')($rootScope);
        $rootScope.$apply();

        var hasMinions = capturedTranscludeFn.isSlotFilled('minionSlot');
        var hasBosses = capturedTranscludeFn.isSlotFilled('bossSlot');

        expect(hasMinions).toBe(true);
        expect(hasBosses).toBe(false);
      });
    });

    test('should not overwrite the contents of an `ng-transclude` element, if the matching optional slot is not filled', () => {
      angular.mock.module(function() {
        directive('minionComponent', function() {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: '?boss'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot">default boss content</div>' +
              '<div class="minion" ng-transclude="minionSlot">default minion content</div>' +
              '<div class="other" ng-transclude>default content</div>'
          };
        });
      });
      angular.mock.inject(function($rootScope, $compile) {
        element = $compile(
          '<minion-component>' +
            '<minion>stuart</minion>' +
            '<span>dorothy</span>' +
            '<minion>kevin</minion>' +
          '</minion-component>')($rootScope);
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('default boss content');
        expect(element.children().eq(1).text()).toEqual('stuartkevin');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });


    // See issue https://github.com/angular/angular.js/issues/14924
    test('should not process top-level transcluded text nodes merged into their sibling',
      function() {
        angular.mock.module(function() {
          directive('transclude', ngInternals.valueFn({
            template: '<ng-transclude></ng-transclude>',
            transclude: {},
            scope: {}
          }));
        });

        angular.mock.inject(function($compile) {
          element = angular.element('<div transclude></div>');
          element[0].appendChild(document.createTextNode('1{{ value }}'));
          element[0].appendChild(document.createTextNode('2{{ value }}'));
          element[0].appendChild(document.createTextNode('3{{ value }}'));

          var initialWatcherCount = $rootScope.$countWatchers();
          $compile(element)($rootScope);
          $rootScope.$apply('value = 0');
          var newWatcherCount = $rootScope.$countWatchers() - initialWatcherCount;

          expect(element.text()).toBe('102030');
          expect(newWatcherCount).toBe(3);
        });
      }
    );
  });

  ['img', 'audio', 'video'].forEach(function(tag) {
    describe(tag + '[src] context requirement', function() {
      test('should NOT require trusted values for trusted URIs', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<' + tag + ' src="{{testUrl}}"></' + tag + '>')($rootScope);
        $rootScope.testUrl = 'http://example.com/image.mp4'; // `http` is trusted
        $rootScope.$digest();
        expect(element.attr('src')).toEqual('http://example.com/image.mp4');
      }));

      test('should accept trusted values', angular.mock.inject(function($rootScope, $compile, $sce) {
        // As a MEDIA_URL URL
        element = $compile('<' + tag + ' src="{{testUrl}}"></' + tag + '>')($rootScope);
        // Some browsers complain if you try to write `javascript:` into an `img[src]`
        // So for the test use something different
        $rootScope.testUrl = $sce.trustAsMediaUrl('untrusted:foo()');
        $rootScope.$digest();
        expect(element.attr('src')).toEqual('untrusted:foo()');

        // As a URL
        element = $compile('<' + tag + ' src="{{testUrl}}"></' + tag + '>')($rootScope);
        $rootScope.testUrl = $sce.trustAsUrl('untrusted:foo()');
        $rootScope.$digest();
        expect(element.attr('src')).toEqual('untrusted:foo()');

        // As a RESOURCE URL
        element = $compile('<' + tag + ' src="{{testUrl}}"></' + tag + '>')($rootScope);
        $rootScope.testUrl = $sce.trustAsResourceUrl('untrusted:foo()');
        $rootScope.$digest();
        expect(element.attr('src')).toEqual('untrusted:foo()');
      }));
    });
  });

  ['source', 'track'].forEach(function(tag) {
    describe(tag + '[src]', function() {
      test('should NOT require trusted values for trusted URIs', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<video><' + tag + ' src="{{testUrl}}"></' + tag + '></video>')($rootScope);
        $rootScope.testUrl = 'http://example.com/image.mp4'; // `http` is trusted
        $rootScope.$digest();
        expect(element.find(tag).attr('src')).toEqual('http://example.com/image.mp4');
      }));

      test('should accept trusted values', angular.mock.inject(function($rootScope, $compile, $sce) {
        // As a MEDIA_URL URL
        element = $compile('<video><' + tag + ' src="{{testUrl}}"></' + tag + '></video>')($rootScope);
        $rootScope.testUrl = $sce.trustAsMediaUrl('javascript:foo()');
        $rootScope.$digest();
        expect(element.find(tag).attr('src')).toEqual('javascript:foo()');

        // As a URL
        element = $compile('<video><' + tag + ' src="{{testUrl}}"></' + tag + '></video>')($rootScope);
        $rootScope.testUrl = $sce.trustAsUrl('javascript:foo()');
        $rootScope.$digest();
        expect(element.find(tag).attr('src')).toEqual('javascript:foo()');

        // As a RESOURCE URL
        element = $compile('<video><' + tag + ' src="{{testUrl}}"></' + tag + '></video>')($rootScope);
        $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:foo()');
        $rootScope.$digest();
        expect(element.find(tag).attr('src')).toEqual('javascript:foo()');
      }));
    });
  });

  describe('img[src] sanitization', () => {

    test('should accept trusted values', angular.mock.inject(function($rootScope, $compile, $sce) {
      element = $compile('<img src="{{testUrl}}"></img>')($rootScope);
      // Some browsers complain if you try to write `javascript:` into an `img[src]`
      // So for the test use something different
      $rootScope.testUrl = $sce.trustAsMediaUrl('someUntrustedThing:foo();');
      $rootScope.$digest();
      expect(element.attr('src')).toEqual('someUntrustedThing:foo();');
    }));

    test('should sanitize concatenated values even if they are trusted', angular.mock.inject(function($rootScope, $compile, $sce) {
      element = $compile('<img src="{{testUrl}}ponies"></img>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl('untrusted:foo();');
      $rootScope.$digest();
      expect(element.attr('src')).toEqual('unsafe:untrusted:foo();ponies');

      element = $compile('<img src="http://{{testUrl2}}"></img>')($rootScope);
      $rootScope.testUrl2 = $sce.trustAsUrl('xyz;');
      $rootScope.$digest();
      expect(element.attr('src')).toEqual('http://xyz;');

      element = $compile('<img src="{{testUrl3}}{{testUrl3}}"></img>')($rootScope);
      $rootScope.testUrl3 = $sce.trustAsUrl('untrusted:foo();');
      $rootScope.$digest();
      expect(element.attr('src')).toEqual('unsafe:untrusted:foo();untrusted:foo();');
    }));

    test('should not sanitize attributes other than src', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<img title="{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();
      expect(element.attr('title')).toBe('javascript:doEvilStuff()');
    }));

    test('should use $$sanitizeUri', () => {
      var $$sanitizeUri = jest.fn().mockName('$$sanitizeUri');
      angular.mock.module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<img src="{{testUrl}}"></img>')($rootScope);
        $rootScope.testUrl = 'someUrl';

        $$sanitizeUri.mockReturnValue('someSanitizedUrl');
        $rootScope.$apply();
        expect(element.attr('src')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, true);
      });
    });


    test('should use $$sanitizeUri on concatenated trusted values', () => {
      var $$sanitizeUri = jest.fn().mockName('$$sanitizeUri').mockReturnValue('someSanitizedUrl');
      angular.mock.module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function($compile, $rootScope, $sce) {
        element = $compile('<img src="{{testUrl}}ponies"></img>')($rootScope);
        $rootScope.testUrl = $sce.trustAsUrl('javascript:foo();');
        $rootScope.$digest();
        expect(element.attr('src')).toEqual('someSanitizedUrl');

        element = $compile('<img src="http://{{testUrl}}"></img>')($rootScope);
        $rootScope.testUrl = $sce.trustAsUrl('xyz');
        $rootScope.$digest();
        expect(element.attr('src')).toEqual('someSanitizedUrl');
      });
    });

    test('should not use $$sanitizeUri with trusted values', () => {
      var $$sanitizeUri = jest.fn().mockName('$$sanitizeUri').mockImplementation(() => { throw new Error('Should not have been called'); });
      angular.mock.module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function($compile, $rootScope, $sce) {
        element = $compile('<img src="{{testUrl}}"></img>')($rootScope);
        // Assigning javascript:foo to src makes at least IE9-11 complain, so use another
        // protocol name.
        $rootScope.testUrl = $sce.trustAsMediaUrl('untrusted:foo();');
        $rootScope.$apply();
        expect(element.attr('src')).toEqual('untrusted:foo();');
      });
    });
  });

  describe('img[srcset] sanitization', () => {
    test('should not error if srcset is undefined', () => {
      var linked = false;
      angular.mock.module(function() {
        directive('setter', ngInternals.valueFn(function(scope, elem, attrs) {
          // Set srcset to a value
          attrs.$set('srcset', 'http://example.com/');
          expect(attrs.srcset).toBe('http://example.com/');
          // Now set it to undefined
          attrs.$set('srcset', undefined);
          expect(attrs.srcset).toBeUndefined();
          linked = true;
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<img setter></img>')($rootScope);
        expect(linked).toBe(true);
        expect(element.attr('srcset')).toBeUndefined();
      });
    });

    test('should NOT require trusted values for trusted URI values', angular.mock.inject(function($rootScope, $compile, $sce) {
      element = $compile('<img srcset="{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = 'http://example.com/image.png'; // `http` is trusted
      $rootScope.$digest();
      expect(element.attr('srcset')).toEqual('http://example.com/image.png');
    }));

    test('should accept trusted values, if they are also trusted URIs', angular.mock.inject(function($rootScope, $compile, $sce) {
      element = $compile('<img srcset="{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl('http://example.com');
      $rootScope.$digest();
      expect(element.attr('srcset')).toEqual('http://example.com');
    }));

    test('should NOT work with trusted values', angular.mock.inject(function($rootScope, $compile, $sce) {
      // A limitation of the approach used for srcset is that you cannot use `trustAsUrl`.
      // Use trustAsHtml and ng-bind-html to work around this.
      element = $compile('<img srcset="{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl('javascript:something');
      $rootScope.$digest();
      expect(element.attr('srcset')).toEqual('unsafe:javascript:something');

      element = $compile('<img srcset="{{testUrl}},{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl('javascript:something');
      $rootScope.$digest();
      expect(element.attr('srcset')).toEqual(
          'unsafe:javascript:something ,unsafe:javascript:something');
    }));

    test('should use $$sanitizeUri', () => {
      var $$sanitizeUri = jest.fn().mockName('$$sanitizeUri').mockReturnValue('someSanitizedUrl');
      angular.mock.module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<img srcset="{{testUrl}}"></img>')($rootScope);
        $rootScope.testUrl = 'someUrl';
        $rootScope.$apply();
        expect(element.attr('srcset')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, true);

        element = $compile('<img srcset="{{testUrl}}, {{testUrl}}"></img>')($rootScope);
        $rootScope.testUrl = 'javascript:yay';
        $rootScope.$apply();
        expect(element.attr('srcset')).toEqual('someSanitizedUrl ,someSanitizedUrl');

        element = $compile('<img srcset="java{{testUrl}}"></img>')($rootScope);
        $rootScope.testUrl = 'script:yay, javascript:nay';
        $rootScope.$apply();
        expect(element.attr('srcset')).toEqual('someSanitizedUrl ,someSanitizedUrl');
      });
    });

    test('should sanitize all uris in srcset', angular.mock.inject(function($rootScope, $compile) {
      element = $compile('<img srcset="{{testUrl}}"></img>')($rootScope);
      var testSet = {
        'http://example.com/image.png':'http://example.com/image.png',
        ' http://example.com/image.png':'http://example.com/image.png',
        'http://example.com/image.png ':'http://example.com/image.png',
        'http://example.com/image.png 128w':'http://example.com/image.png 128w',
        'http://example.com/image.png 2x':'http://example.com/image.png 2x',
        'http://example.com/image.png 1.5x':'http://example.com/image.png 1.5x',
        'http://example.com/image1.png 1x,http://example.com/image2.png 2x':'http://example.com/image1.png 1x,http://example.com/image2.png 2x',
        'http://example.com/image1.png 1x ,http://example.com/image2.png 2x':'http://example.com/image1.png 1x ,http://example.com/image2.png 2x',
        'http://example.com/image1.png 1x, http://example.com/image2.png 2x':'http://example.com/image1.png 1x,http://example.com/image2.png 2x',
        'http://example.com/image1.png 1x , http://example.com/image2.png 2x':'http://example.com/image1.png 1x ,http://example.com/image2.png 2x',
        'http://example.com/image1.png 48w,http://example.com/image2.png 64w':'http://example.com/image1.png 48w,http://example.com/image2.png 64w',
        //Test regex to make sure doesn't mistake parts of url for width descriptors
        'http://example.com/image1.png?w=48w,http://example.com/image2.png 64w':'http://example.com/image1.png?w=48w,http://example.com/image2.png 64w',
        'http://example.com/image1.png 1x,http://example.com/image2.png 64w':'http://example.com/image1.png 1x,http://example.com/image2.png 64w',
        'http://example.com/image1.png,http://example.com/image2.png':'http://example.com/image1.png ,http://example.com/image2.png',
        'http://example.com/image1.png ,http://example.com/image2.png':'http://example.com/image1.png ,http://example.com/image2.png',
        'http://example.com/image1.png, http://example.com/image2.png':'http://example.com/image1.png ,http://example.com/image2.png',
        'http://example.com/image1.png , http://example.com/image2.png':'http://example.com/image1.png ,http://example.com/image2.png',
        'http://example.com/image1.png 1x, http://example.com/image2.png 2x, http://example.com/image3.png 3x':
          'http://example.com/image1.png 1x,http://example.com/image2.png 2x,http://example.com/image3.png 3x',
        'javascript:doEvilStuff() 2x': 'unsafe:javascript:doEvilStuff() 2x',
        'http://example.com/image1.png 1x,javascript:doEvilStuff() 2x':'http://example.com/image1.png 1x,unsafe:javascript:doEvilStuff() 2x',
        'http://example.com/image1.jpg?x=a,b 1x,http://example.com/ima,ge2.jpg 2x':'http://example.com/image1.jpg?x=a,b 1x,http://example.com/ima,ge2.jpg 2x',
        //Test regex to make sure doesn't mistake parts of url for pixel density descriptors
        'http://example.com/image1.jpg?x=a2x,b 1x,http://example.com/ima,ge2.jpg 2x':'http://example.com/image1.jpg?x=a2x,b 1x,http://example.com/ima,ge2.jpg 2x'
      };

      angular.forEach(testSet, function(ref, url) {
        $rootScope.testUrl = url;
        $rootScope.$digest();
        expect(element.attr('srcset')).toEqual(ref);
      });

    }));
  });

  describe('a[href] sanitization', () => {
    test('should NOT require trusted values for trusted URI values', angular.mock.inject(function($rootScope, $compile) {
      $rootScope.testUrl = 'http://example.com/image.png'; // `http` is trusted
      element = $compile('<a href="{{testUrl}}"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.attr('href')).toEqual('http://example.com/image.png');

      element = $compile('<a ng-href="{{testUrl}}"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.attr('ng-href')).toEqual('http://example.com/image.png');
    }));

    test('should accept trusted values for non-trusted URI values', angular.mock.inject(function($rootScope, $compile, $sce) {
      $rootScope.testUrl = $sce.trustAsUrl('javascript:foo()'); // `javascript` is not trusted
      element = $compile('<a href="{{testUrl}}"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.attr('href')).toEqual('javascript:foo()');

      element = $compile('<a ng-href="{{testUrl}}"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.attr('ng-href')).toEqual('javascript:foo()');
    }));

    test('should sanitize non-trusted values', angular.mock.inject(function($rootScope, $compile) {
      $rootScope.testUrl = 'javascript:foo()'; // `javascript` is not trusted
      element = $compile('<a href="{{testUrl}}"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.attr('href')).toEqual('unsafe:javascript:foo()');

      element = $compile('<a ng-href="{{testUrl}}"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.attr('href')).toEqual('unsafe:javascript:foo()');
    }));

    test('should not sanitize href on elements other than anchor', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<div href="{{testUrl}}"></div>')($rootScope);
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.attr('href')).toBe('javascript:doEvilStuff()');
    }));

    test('should not sanitize attributes other than href/ng-href', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<a title="{{testUrl}}"></a>')($rootScope);
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.attr('title')).toBe('javascript:doEvilStuff()');
    }));

    test('should use $$sanitizeUri', () => {
      var $$sanitizeUri = jest.fn().mockName('$$sanitizeUri').mockReturnValue('someSanitizedUrl');
      angular.mock.module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<a href="{{testUrl}}"></a>')($rootScope);
        $rootScope.testUrl = 'someUrl';
        $rootScope.$apply();
        expect(element.attr('href')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);

        $$sanitizeUri.mockClear();

        element = $compile('<a ng-href="{{testUrl}}"></a>')($rootScope);
        $rootScope.$apply();
        expect(element.attr('href')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
      });
    });

    test('should use $$sanitizeUri when working with svg and xlink:href', () => {
      var $$sanitizeUri = jest.fn().mockName('$$sanitizeUri').mockReturnValue('https://clean.example.org');
      angular.mock.module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function($compile, $rootScope) {
        // This URL would fail the RESOURCE_URL trusted list, but that test shouldn't be run
        // because these interpolations will be resolved against the URL context instead
        $rootScope.testUrl = 'https://bad.example.org';

        var elementA = $compile('<svg><a xlink:href="{{ testUrl + \'aTag\' }}"></a></svg>')($rootScope);
        $rootScope.$apply();
        expect(elementA.find('a').attr('xlink:href')).toBe('https://clean.example.org');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl + 'aTag', false);

        var elementImage = $compile('<svg><image xlink:href="{{ testUrl + \'imageTag\' }}"></image></svg>')($rootScope);
        $rootScope.$apply();
        expect(elementImage.find('image').attr('xlink:href')).toBe('https://clean.example.org');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl + 'imageTag', true);
      });
    });

    test('should use $$sanitizeUri when working with svg and xlink:href through ng-href', () => {
      var $$sanitizeUri = jest.fn().mockName('$$sanitizeUri').mockReturnValue('https://clean.example.org');
      angular.mock.module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function($compile, $rootScope) {
        // This URL would fail the RESOURCE_URL trusted list, but that test shouldn't be run
        // because these interpolations will be resolved against the URL context instead
        $rootScope.testUrl = 'https://bad.example.org';

        element = $compile('<svg><a xlink:href="" ng-href="{{ testUrl }}"></a></svg>')($rootScope);
        $rootScope.$apply();
        expect(element.find('a').prop('href').baseVal).toBe('https://clean.example.org');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
      });
    });

    test('should require a RESOURCE_URL context for xlink:href by if not on an anchor or image', () => {
      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<svg><whatever xlink:href="{{ testUrl }}"></whatever></svg>')($rootScope);
        $rootScope.testUrl = 'https://bad.example.org';

        expect(function() {
          $rootScope.$apply();
        }).toThrowMinErr('$interpolate', 'interr', 'Can\'t interpolate: {{ testUrl }}\n' +
                        'Error: [$sce:insecurl] Blocked loading resource from url not allowed by $sceDelegate policy.  ' +
                        'URL: https://bad.example.org');
      });
    });

    test('should not have endless digests when given arrays in concatenable context', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<foo href="{{testUrl}}"></foo><foo href="{{::testUrl}}"></foo>' +
        '<foo href="http://example.com/{{testUrl}}"></foo><foo href="http://example.com/{{::testUrl}}"></foo>')($rootScope);
      $rootScope.testUrl = [1];
      $rootScope.$digest();

      $rootScope.testUrl = [];
      $rootScope.$digest();

      $rootScope.testUrl = {a:'b'};
      $rootScope.$digest();

      $rootScope.testUrl = {};
      $rootScope.$digest();
    }));
  });

  describe('interpolation on HTML DOM event handler attributes onclick, onXYZ, formaction', () => {
    test('should disallow interpolation on onclick', angular.mock.inject(function($compile, $rootScope) {
      // All interpolations are disallowed.
      $rootScope.onClickJs = '';
      expect(function() {
          $compile('<button onclick="{{onClickJs}}"></button>');
        }).toThrowMinErr(
          '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed');
      expect(function() {
          $compile('<button ONCLICK="{{onClickJs}}"></button>');
        }).toThrowMinErr(
          '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed');
      expect(function() {
          $compile('<button ng-attr-onclick="{{onClickJs}}"></button>');
        }).toThrowMinErr(
          '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed');
      expect(function() {
          $compile('<button ng-attr-ONCLICK="{{onClickJs}}"></button>');
        }).toThrowMinErr(
          '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed');
    }));

    test('should pass through arbitrary values on onXYZ event attributes that contain a hyphen', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<button on-click="{{onClickJs}}"></button>')($rootScope);
      $rootScope.onClickJs = 'javascript:doSomething()';
      $rootScope.$apply();
      expect(element.attr('on-click')).toEqual('javascript:doSomething()');
    }));

    test('should pass through arbitrary values on "on" and "data-on" attributes', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<button data-on="{{dataOnVar}}"></button>')($rootScope);
      $rootScope.dataOnVar = 'data-on text';
      $rootScope.$apply();
      expect(element.attr('data-on')).toEqual('data-on text');

      element = $compile('<button on="{{onVar}}"></button>')($rootScope);
      $rootScope.onVar = 'on text';
      $rootScope.$apply();
      expect(element.attr('on')).toEqual('on text');
    }));
  });

  describe('iframe[src]', () => {
    test('should pass through src attributes for the same domain', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<iframe src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.attr('src')).toEqual('different_page');
    }));

    test('should clear out src attributes for a different domain', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<iframe src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(function() { $rootScope.$apply(); }).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
          'http://a.different.domain.example.com');
    }));

    test('should clear out JS src attributes', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<iframe src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(function() { $rootScope.$apply(); }).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
          'javascript:alert(1);');
    }));

    test('should clear out non-resource_url src attributes', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<iframe src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect($rootScope.$apply).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: javascript:doTrustedStuff()');
    }));

    test('should pass through $sce.trustAs() values in src attributes', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<iframe src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.attr('src')).toEqual('javascript:doTrustedStuff()');
    }));
  });

  describe('base[href]', () => {
    test('should be a RESOURCE_URL context', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<base href="{{testUrl}}"/>')($rootScope);

      $rootScope.testUrl = $sce.trustAsResourceUrl('https://example.com/');
      $rootScope.$apply();
      expect(element.attr('href')).toContain('https://example.com/');

      $rootScope.testUrl = 'https://not.example.com/';
      expect(function() { $rootScope.$apply(); }).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
          'https://not.example.com/');
    }));
  });

  describe('form[action]', () => {
    test('should pass through action attribute for the same domain', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<form action="{{testUrl}}"></form>')($rootScope);
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.attr('action')).toEqual('different_page');
    }));

    test('should clear out action attribute for a different domain', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<form action="{{testUrl}}"></form>')($rootScope);
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(function() { $rootScope.$apply(); }).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
          'http://a.different.domain.example.com');
    }));

    test('should clear out JS action attribute', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<form action="{{testUrl}}"></form>')($rootScope);
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(function() { $rootScope.$apply(); }).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
          'javascript:alert(1);');
    }));

    test('should clear out non-resource_url action attribute', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<form action="{{testUrl}}"></form>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect($rootScope.$apply).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: javascript:doTrustedStuff()');
    }));


    test('should pass through $sce.trustAsResourceUrl() values in action attribute', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<form action="{{testUrl}}"></form>')($rootScope);
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.attr('action')).toEqual('javascript:doTrustedStuff()');
    }));
  });

  describe('link[href]', () => {
    test('should reject invalid RESOURCE_URLs', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<link href="{{testUrl}}" rel="stylesheet" />')($rootScope);
      $rootScope.testUrl = 'https://evil.example.org/css.css';
      expect(function() { $rootScope.$apply(); }).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
          'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
          'https://evil.example.org/css.css');
    }));

    test('should accept valid RESOURCE_URLs', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<link href="{{testUrl}}" rel="stylesheet" />')($rootScope);

      $rootScope.testUrl = './css1.css';
      $rootScope.$apply();
      expect(element.attr('href')).toContain('css1.css');

      $rootScope.testUrl = $sce.trustAsResourceUrl('https://elsewhere.example.org/css2.css');
      $rootScope.$apply();
      expect(element.attr('href')).toContain('https://elsewhere.example.org/css2.css');
    }));

    test('should accept valid constants', angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<link href="https://elsewhere.example.org/css2.css" rel="stylesheet" />')($rootScope);

      $rootScope.$apply();
      expect(element.attr('href')).toContain('https://elsewhere.example.org/css2.css');
    }));
  });

  describe('iframe[srcdoc]', () => {
    test('should NOT set iframe contents for untrusted values', angular.mock.inject(function($compile, $rootScope, $sce) {
      element = $compile('<iframe srcdoc="{{html}}"></iframe>')($rootScope);
      $rootScope.html = '<div onclick="">hello</div>';
      expect(function() { $rootScope.$digest(); }).toThrowMinErr('$interpolate', 'interr', new RegExp(
          /Can't interpolate: {{html}}\n/.source +
          /[^[]*\[\$sce:unsafe] Attempting to use an unsafe value in a safe context./.source));
    }));

    test('should NOT set html for wrongly typed values', angular.mock.inject(function($rootScope, $compile, $sce) {
      element = $compile('<iframe srcdoc="{{html}}"></iframe>')($rootScope);
      $rootScope.html = $sce.trustAsCss('<div onclick="">hello</div>');
      expect(function() { $rootScope.$digest(); }).toThrowMinErr('$interpolate', 'interr', new RegExp(
          /Can't interpolate: \{\{html}}\n/.source +
          /[^[]*\[\$sce:unsafe] Attempting to use an unsafe value in a safe context./.source));
    }));

    test('should set html for trusted values', angular.mock.inject(function($rootScope, $compile, $sce) {
      element = $compile('<iframe srcdoc="{{html}}"></iframe>')($rootScope);
      $rootScope.html = $sce.trustAsHtml('<div onclick="">hello</div>');
      $rootScope.$digest();
      expect(angular.$$lowercase(element.attr('srcdoc'))).toEqual('<div onclick="">hello</div>');
    }));
  });

  describe('ngAttr* attribute binding', () => {
    test('should bind after digest but not before', angular.mock.inject(function() {
      $rootScope.name = 'Misko';
      element = $compile('<span ng-attr-test="{{name}}"></span>')($rootScope);
      expect(element.attr('test')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
    }));

    test('should bind after digest but not before when after overridden attribute', angular.mock.inject(function() {
      $rootScope.name = 'Misko';
      element = $compile('<span test="123" ng-attr-test="{{name}}"></span>')($rootScope);
      expect(element.attr('test')).toBe('123');
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
    }));

    test('should bind after digest but not before when before overridden attribute', angular.mock.inject(function() {
      $rootScope.name = 'Misko';
      element = $compile('<span ng-attr-test="{{name}}" test="123"></span>')($rootScope);
      expect(element.attr('test')).toBe('123');
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
    }));

    test('should set the attribute (after digest) even if there is no interpolation', angular.mock.inject(function() {
      element = $compile('<span ng-attr-test="foo"></span>')($rootScope);
      expect(element.attr('test')).toBeUndefined();

      $rootScope.$digest();
      expect(element.attr('test')).toBe('foo');
    }));

    test('should remove attribute if any bindings are undefined', angular.mock.inject(function() {
      element = $compile('<span ng-attr-test="{{name}}{{emphasis}}"></span>')($rootScope);
      $rootScope.$digest();
      expect(element.attr('test')).toBeUndefined();
      $rootScope.name = 'caitp';
      $rootScope.$digest();
      expect(element.attr('test')).toBeUndefined();
      $rootScope.emphasis = '!!!';
      $rootScope.$digest();
      expect(element.attr('test')).toBe('caitp!!!');
    }));

    describe('in directive', () => {
      var log;

      beforeEach(angular.mock.module(function() {
        directive('syncTest', function(log) {
          return {
            link: {
              pre(s, e, attr) { log(attr.test); },
              post(s, e, attr) { log(attr.test); }
            }
          };
        });
        directive('asyncTest', function(log) {
          return {
            templateUrl: 'async.html',
            link: {
              pre(s, e, attr) { log(attr.test); },
              post(s, e, attr) { log(attr.test); }
            }
          };
        });
      }));

      beforeEach(angular.mock.inject(function($templateCache, _log_) {
        log = _log_;
        $templateCache.put('async.html', '<h1>Test</h1>');
      }));

      test('should provide post-digest value in synchronous directive link functions when after overridden attribute',
        function() {
          $rootScope.test = 'TEST';
          element = $compile('<div sync-test test="123" ng-attr-test="{{test}}"></div>')($rootScope);
          expect(element.attr('test')).toBe('123');
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );

      test('should provide post-digest value in synchronous directive link functions when before overridden attribute',
        function() {
          $rootScope.test = 'TEST';
          element = $compile('<div sync-test ng-attr-test="{{test}}" test="123"></div>')($rootScope);
          expect(element.attr('test')).toBe('123');
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );


      test('should provide post-digest value in asynchronous directive link functions when after overridden attribute',
        function() {
          $rootScope.test = 'TEST';
          element = $compile('<div async-test test="123" ng-attr-test="{{test}}"></div>')($rootScope);
          expect(element.attr('test')).toBe('123');
          $rootScope.$digest();
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );

      test('should provide post-digest value in asynchronous directive link functions when before overridden attribute',
        function() {
          $rootScope.test = 'TEST';
          element = $compile('<div async-test ng-attr-test="{{test}}" test="123"></div>')($rootScope);
          expect(element.attr('test')).toBe('123');
          $rootScope.$digest();
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );
    });

    test('should work with different prefixes', angular.mock.inject(function() {
      $rootScope.name = 'Misko';
      element = $compile('<span ng:attr:test="{{name}}" ng-Attr-test2="{{name}}" ng_Attr_test3="{{name}}"></span>')($rootScope);
      expect(element.attr('test')).toBeUndefined();
      expect(element.attr('test2')).toBeUndefined();
      expect(element.attr('test3')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
      expect(element.attr('test2')).toBe('Misko');
      expect(element.attr('test3')).toBe('Misko');
    }));

    test('should use the non-prefixed name in $attr mappings', () => {
      var attrs;
      angular.mock.module(function() {
        directive('attrExposer', ngInternals.valueFn({
          link($scope, $element, $attrs) {
            attrs = $attrs;
          }
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        $compile('<div attr-exposer ng-attr-title="12" ng-attr-super-title="34" ng-attr-my-camel_title="56">')($rootScope);
        $rootScope.$apply();

        expect(attrs.title).toBe('12');
        expect(attrs.$attr.title).toBe('title');
        expect(attrs.ngAttrTitle).toBeUndefined();
        expect(attrs.$attr.ngAttrTitle).toBeUndefined();

        expect(attrs.superTitle).toBe('34');
        expect(attrs.$attr.superTitle).toBe('super-title');
        expect(attrs.ngAttrSuperTitle).toBeUndefined();
        expect(attrs.$attr.ngAttrSuperTitle).toBeUndefined();

        // Note the casing is incorrect: https://github.com/angular/angular.js/issues/16624
        expect(attrs.myCameltitle).toBe('56');
        expect(attrs.$attr.myCameltitle).toBe('my-camelTitle');
        expect(attrs.ngAttrMyCameltitle).toBeUndefined();
        expect(attrs.ngAttrMyCamelTitle).toBeUndefined();
        expect(attrs.$attr.ngAttrMyCameltitle).toBeUndefined();
        expect(attrs.$attr.ngAttrMyCamelTitle).toBeUndefined();
      });
    });

    test('should work with the "href" attribute', angular.mock.inject(function() {
      $rootScope.value = 'test';
      element = $compile('<a ng-attr-href="test/{{value}}"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.attr('href')).toBe('test/test');
    }));

    test('should work if they are prefixed with x- or data- and different prefixes', angular.mock.inject(function() {
      $rootScope.name = 'Misko';
      element = $compile('<span data-ng-attr-test2="{{name}}" x-ng-attr-test3="{{name}}" data-ng:attr-test4="{{name}}" ' +
        'x_ng-attr-test5="{{name}}" data:ng-attr-test6="{{name}}"></span>')($rootScope);
      expect(element.attr('test2')).toBeUndefined();
      expect(element.attr('test3')).toBeUndefined();
      expect(element.attr('test4')).toBeUndefined();
      expect(element.attr('test5')).toBeUndefined();
      expect(element.attr('test6')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('test2')).toBe('Misko');
      expect(element.attr('test3')).toBe('Misko');
      expect(element.attr('test4')).toBe('Misko');
      expect(element.attr('test5')).toBe('Misko');
      expect(element.attr('test6')).toBe('Misko');
    }));

    describe('with media url attributes', () => {
      test('should work with interpolated ng-attr-src', angular.mock.inject(function() {
        $rootScope.name = 'some-image.png';
        element = $compile('<img ng-attr-src="{{name}}">')($rootScope);
        expect(element.attr('src')).toBeUndefined();

        $rootScope.$digest();
        expect(element.attr('src')).toBe('some-image.png');

        $rootScope.name = 'other-image.png';
        $rootScope.$digest();
        expect(element.attr('src')).toBe('other-image.png');
      }));

      test('should work with interpolated ng-attr-data-src', angular.mock.inject(function() {
        $rootScope.name = 'some-image.png';
        element = $compile('<img ng-attr-data-src="{{name}}">')($rootScope);
        expect(element.attr('data-src')).toBeUndefined();

        $rootScope.$digest();
        expect(element.attr('data-src')).toBe('some-image.png');

        $rootScope.name = 'other-image.png';
        $rootScope.$digest();
        expect(element.attr('data-src')).toBe('other-image.png');
      }));

      test('should work alongside constant [src]-attribute and [ng-attr-data-src] attributes', angular.mock.inject(function() {
        $rootScope.name = 'some-image.png';
        element = $compile('<img src="constant.png" ng-attr-data-src="{{name}}">')($rootScope);
        expect(element.attr('data-src')).toBeUndefined();

        $rootScope.$digest();
        expect(element.attr('src')).toBe('constant.png');
        expect(element.attr('data-src')).toBe('some-image.png');

        $rootScope.name = 'other-image.png';
        $rootScope.$digest();
        expect(element.attr('src')).toBe('constant.png');
        expect(element.attr('data-src')).toBe('other-image.png');
      }));
    });

    describe('when an attribute has a dash-separated name', () => {
      test('should work with different prefixes', angular.mock.inject(function() {
        $rootScope.name = 'JamieMason';
        element = $compile('<span ng:attr:dash-test="{{name}}" ng-Attr-dash-test2="{{name}}" ng_Attr_dash-test3="{{name}}"></span>')($rootScope);
        expect(element.attr('dash-test')).toBeUndefined();
        expect(element.attr('dash-test2')).toBeUndefined();
        expect(element.attr('dash-test3')).toBeUndefined();
        $rootScope.$digest();
        expect(element.attr('dash-test')).toBe('JamieMason');
        expect(element.attr('dash-test2')).toBe('JamieMason');
        expect(element.attr('dash-test3')).toBe('JamieMason');
      }));

      test('should work if they are prefixed with x- or data-', angular.mock.inject(function() {
        $rootScope.name = 'JamieMason';
        element = $compile('<span data-ng-attr-dash-test2="{{name}}" x-ng-attr-dash-test3="{{name}}" data-ng:attr-dash-test4="{{name}}"></span>')($rootScope);
        expect(element.attr('dash-test2')).toBeUndefined();
        expect(element.attr('dash-test3')).toBeUndefined();
        expect(element.attr('dash-test4')).toBeUndefined();
        $rootScope.$digest();
        expect(element.attr('dash-test2')).toBe('JamieMason');
        expect(element.attr('dash-test3')).toBe('JamieMason');
        expect(element.attr('dash-test4')).toBe('JamieMason');
      }));

      test('should keep attributes ending with -start single-element directives', () => {
        angular.mock.module(function($compileProvider) {
          $compileProvider.directive('dashStarter', function(log) {
            return {
              link(scope, element, attrs) {
                log(attrs.onDashStart);
              }
            };
          });
        });
        angular.mock.inject(function($compile, $rootScope, log) {
          $compile('<span data-dash-starter data-on-dash-start="starter"></span>')($rootScope);
          $rootScope.$digest();
          expect(log).toEqual('starter');
        });
      });

      test('should keep attributes ending with -end single-element directives', () => {
        angular.mock.module(function($compileProvider) {
          $compileProvider.directive('dashEnder', function(log) {
            return {
              link(scope, element, attrs) {
                log(attrs.onDashEnd);
              }
            };
          });
        });
        angular.mock.inject(function($compile, $rootScope, log) {
          $compile('<span data-dash-ender data-on-dash-end="ender"></span>')($rootScope);
          $rootScope.$digest();
          expect(log).toEqual('ender');
        });
      });
    });
  });


  describe('addPropertySecurityContext', () => {
    function testProvider(provider) {
      angular.mock.module(provider);
      angular.mock.inject(function($compile) { /* done! */ });
    }

    test('should allow adding new properties', () => {
      testProvider(function($compileProvider) {
        $compileProvider.addPropertySecurityContext('div', 'title', 'mediaUrl');
        $compileProvider.addPropertySecurityContext('*', 'my-prop', 'resourceUrl');
      });
    });

    test('should allow different sce types of a property on different element types', () => {
      testProvider(function($compileProvider) {
        $compileProvider.addPropertySecurityContext('div', 'title', 'mediaUrl');
        $compileProvider.addPropertySecurityContext('span', 'title', 'css');
        $compileProvider.addPropertySecurityContext('*', 'title', 'resourceUrl');
        $compileProvider.addPropertySecurityContext('article', 'title', 'html');
      });
    });

    test('should throw \'ctxoverride\' when changing an existing context', () => {
      testProvider(function($compileProvider) {
        $compileProvider.addPropertySecurityContext('div', 'title', 'mediaUrl');

        expect(function() {
          $compileProvider.addPropertySecurityContext('div', 'title', 'resourceUrl');
        })
        .toThrowMinErr('$compile', 'ctxoverride', 'Property context \'div.title\' already set to \'mediaUrl\', cannot override to \'resourceUrl\'.');
      });
    });

    test('should allow setting the same property/element to the same value', () => {
      testProvider(function($compileProvider) {
        $compileProvider.addPropertySecurityContext('div', 'title', 'mediaUrl');
        $compileProvider.addPropertySecurityContext('div', 'title', 'mediaUrl');
      });
    });

    test('should enforce the specified sce type for properties added for specific elements', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.addPropertySecurityContext('div', 'foo', 'mediaUrl');
      });
      angular.mock.inject(function($compile, $rootScope, $sce) {
        var element = $compile('<div ng-prop-foo="bar"></div>')($rootScope);

        $rootScope.bar = 'untrusted:test1';
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test1');

        $rootScope.bar = $sce.trustAsCss('untrusted:test2');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test2');

        $rootScope.bar = $sce.trustAsMediaUrl('untrusted:test3');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('untrusted:test3');
      });
    });

    test('should enforce the specified sce type for properties added for all elements (*)', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.addPropertySecurityContext('*', 'foo', 'mediaUrl');
      });
      angular.mock.inject(function($compile, $rootScope, $sce) {
        var element = $compile('<div ng-prop-foo="bar"></div>')($rootScope);

        $rootScope.bar = 'untrusted:test1';
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test1');

        $rootScope.bar = $sce.trustAsCss('untrusted:test2');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test2');

        $rootScope.bar = $sce.trustAsMediaUrl('untrusted:test3');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('untrusted:test3');
      });
    });

    test('should enforce the specific sce type when both an element specific and generic exist', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.addPropertySecurityContext('*', 'foo', 'css');
        $compileProvider.addPropertySecurityContext('div', 'foo', 'mediaUrl');
      });
      angular.mock.inject(function($compile, $rootScope, $sce) {
        var element = $compile('<div ng-prop-foo="bar"></div>')($rootScope);

        $rootScope.bar = 'untrusted:test1';
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test1');

        $rootScope.bar = $sce.trustAsCss('untrusted:test2');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test2');

        $rootScope.bar = $sce.trustAsMediaUrl('untrusted:test3');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('untrusted:test3');
      });
    });
  });


  describe('when an attribute has an underscore-separated name', () => {

    test('should work with different prefixes', angular.mock.inject(function($compile, $rootScope) {
      $rootScope.dimensions = '0 0 0 0';
      element = $compile('<svg ng:attr:view_box="{{dimensions}}"></svg>')($rootScope);
      expect(element.attr('viewBox')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('viewBox')).toBe('0 0 0 0');
    }));

    test('should work if they are prefixed with x- or data-', angular.mock.inject(function($compile, $rootScope) {
      $rootScope.dimensions = '0 0 0 0';
      $rootScope.number = 0.42;
      $rootScope.scale = 1;
      element = $compile('<svg data-ng-attr-view_box="{{dimensions}}">' +
        '<filter x-ng-attr-filter_units="{{number}}">' +
        '<feDiffuseLighting data-ng:attr_surface_scale="{{scale}}">' +
        '</feDiffuseLighting>' +
        '<feSpecularLighting x-ng:attr_surface_scale="{{scale}}">' +
        '</feSpecularLighting></filter></svg>')($rootScope);
      expect(element.attr('viewBox')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('viewBox')).toBe('0 0 0 0');
      expect(element.find('filter').attr('filterUnits')).toBe('0.42');
      expect(element.find('feDiffuseLighting').attr('surfaceScale')).toBe('1');
      expect(element.find('feSpecularLighting').attr('surfaceScale')).toBe('1');
    }));
  });

  describe('multi-element directive', () => {
    test('should group on link function', angular.mock.inject(function($compile, $rootScope) {
      $rootScope.show = false;
      element = $compile(
          '<div>' +
              '<span ng-show-start="show"></span>' +
              '<span ng-show-end></span>' +
          '</div>')($rootScope);
      $rootScope.$digest();
      var spans = element.find('span');
      expect(spans.eq(0)).toBeHidden();
      expect(spans.eq(1)).toBeHidden();
    }));


    test('should group on compile function', angular.mock.inject(function($compile, $rootScope) {
      $rootScope.show = false;
      element = $compile(
          '<div>' +
              '<span ng-repeat-start="i in [1,2]">{{i}}A</span>' +
              '<span ng-repeat-end>{{i}}B;</span>' +
          '</div>')($rootScope);
      $rootScope.$digest();
      expect(element.text()).toEqual('1A1B;2A2B;');
    }));


    test('should support grouping over text nodes', angular.mock.inject(function($compile, $rootScope) {
      $rootScope.show = false;
      element = $compile(
          '<div>' +
              '<span ng-repeat-start="i in [1,2]">{{i}}A</span>' +
              ':' + // Important: proves that we can iterate over non-elements
              '<span ng-repeat-end>{{i}}B;</span>' +
          '</div>')($rootScope);
      $rootScope.$digest();
      expect(element.text()).toEqual('1A:1B;2A:2B;');
    }));


    test('should group on $root compile function', angular.mock.inject(function($compile, $rootScope) {
      $rootScope.show = false;
      element = $compile(
          '<div></div>' +
              '<span ng-repeat-start="i in [1,2]">{{i}}A</span>' +
              '<span ng-repeat-end>{{i}}B;</span>' +
          '<div></div>')($rootScope);
      $rootScope.$digest();
      element = angular.element(element[0].parentNode.childNodes); // reset because repeater is top level.
      expect(element.text()).toEqual('1A1B;2A2B;');
    }));


    test('should group on nested groups', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('ngMultiBind', ngInternals.valueFn({
          multiElement: true,
          link(scope, element, attr) {
            element.text(scope.$eval(attr.ngMultiBind));
          }
        }));
      });
      angular.mock.inject(function($compile, $rootScope) {
        $rootScope.show = false;
        element = $compile(
            '<div></div>' +
                '<div ng-repeat-start="i in [1,2]">{{i}}A</div>' +
                '<span ng-multi-bind-start="\'.\'"></span>' +
                '<span ng-multi-bind-end></span>' +
                '<div ng-repeat-end>{{i}}B;</div>' +
            '<div></div>')($rootScope);
        $rootScope.$digest();
        element = angular.element(element[0].parentNode.childNodes); // reset because repeater is top level.
        expect(element.text()).toEqual('1A..1B;2A..2B;');
      });
    });


    test('should group on nested groups of same directive', angular.mock.inject(function($compile, $rootScope) {
      $rootScope.show = false;
      element = $compile(
          '<div></div>' +
              '<div ng-repeat-start="i in [1,2]">{{i}}(</div>' +
              '<span ng-repeat-start="j in [2,3]">{{j}}-</span>' +
              '<span ng-repeat-end>{{j}}</span>' +
              '<div ng-repeat-end>){{i}};</div>' +
          '<div></div>')($rootScope);
      $rootScope.$digest();
      element = angular.element(element[0].parentNode.childNodes); // reset because repeater is top level.
      expect(element.text()).toEqual('1(2-23-3)1;2(2-23-3)2;');
    }));


    test('should set up and destroy the transclusion scopes correctly',
          angular.mock.inject(function($compile, $rootScope) {
      element = $compile(
        '<div>' +
          '<div ng-if-start="val0"><span ng-if="val1"></span></div>' +
          '<div ng-if-end><span ng-if="val2"></span></div>' +
        '</div>'
      )($rootScope);
      $rootScope.$apply('val0 = true; val1 = true; val2 = true');

      // At this point we should have something like:
      //
      // <div class="ng-scope">
      //
      //   <!-- ngIf: val0 -->
      //
      //   <div ng-if-start="val0" class="ng-scope">
      //     <!-- ngIf: val1 -->
      //     <span ng-if="val1" class="ng-scope"></span>
      //     <!-- end ngIf: val1 -->
      //   </div>
      //
      //   <div ng-if-end="" class="ng-scope">
      //     <!-- ngIf: val2 -->
      //     <span ng-if="val2" class="ng-scope"></span>
      //     <!-- end ngIf: val2 -->
      //   </div>
      //
      //   <!-- end ngIf: val0 -->
      // </div>
      var ngIfStartScope = element.find('div').eq(0).scope();
      var ngIfEndScope = element.find('div').eq(1).scope();

      expect(ngIfStartScope.$id).toEqual(ngIfEndScope.$id);

      var ngIf1Scope = element.find('span').eq(0).scope();
      var ngIf2Scope = element.find('span').eq(1).scope();

      expect(ngIf1Scope.$id).not.toEqual(ngIf2Scope.$id);
      expect(ngIf1Scope.$parent.$id).toEqual(ngIf2Scope.$parent.$id);

      $rootScope.$apply('val1 = false');

      // Now we should have something like:
      //
      // <div class="ng-scope">
      //   <!-- ngIf: val0 -->
      //   <div ng-if-start="val0" class="ng-scope">
      //     <!-- ngIf: val1 -->
      //   </div>
      //   <div ng-if-end="" class="ng-scope">
      //     <!-- ngIf: val2 -->
      //     <span ng-if="val2" class="ng-scope"></span>
      //     <!-- end ngIf: val2 -->
      //   </div>
      //   <!-- end ngIf: val0 -->
      // </div>

      expect(ngIfStartScope.$$destroyed).not.toEqual(true);
      expect(ngIf1Scope.$$destroyed).toEqual(true);
      expect(ngIf2Scope.$$destroyed).not.toEqual(true);

      $rootScope.$apply('val0 = false');

      // Now we should have something like:
      //
      // <div class="ng-scope">
      //   <!-- ngIf: val0 -->
      // </div>

      expect(ngIfStartScope.$$destroyed).toEqual(true);
      expect(ngIf1Scope.$$destroyed).toEqual(true);
      expect(ngIf2Scope.$$destroyed).toEqual(true);
    }));


    test('should set up and destroy the transclusion scopes correctly',
          angular.mock.inject(function($compile, $rootScope) {
      element = $compile(
        '<div>' +
          '<div ng-repeat-start="val in val0" ng-if="val1"></div>' +
          '<div ng-repeat-end ng-if="val2"></div>' +
        '</div>'
      )($rootScope);

      // To begin with there is (almost) nothing:
      // <div class="ng-scope">
      //   <!-- ngRepeat: val in val0 -->
      // </div>

      expect(element.scope().$id).toEqual($rootScope.$id);

      // Now we create all the elements
      $rootScope.$apply('val0 = [1]; val1 = true; val2 = true');

      // At this point we have:
      //
      // <div class="ng-scope">
      //
      //   <!-- ngRepeat: val in val0 -->
      //   <!-- ngIf: val1 -->
      //   <div ng-repeat-start="val in val0" class="ng-scope">
      //   </div>
      //   <!-- end ngIf: val1 -->
      //
      //   <!-- ngIf: val2 -->
      //   <div ng-repeat-end="" class="ng-scope">
      //   </div>
      //   <!-- end ngIf: val2 -->
      //   <!-- end ngRepeat: val in val0 -->
      // </div>
      var ngIf1Scope = element.find('div').eq(0).scope();
      var ngIf2Scope = element.find('div').eq(1).scope();
      var ngRepeatScope = ngIf1Scope.$parent;

      expect(ngIf1Scope.$id).not.toEqual(ngIf2Scope.$id);
      expect(ngIf1Scope.$parent.$id).toEqual(ngRepeatScope.$id);
      expect(ngIf2Scope.$parent.$id).toEqual(ngRepeatScope.$id);

      // What is happening here??
      // We seem to have a repeater scope which doesn't actually match to any element
      expect(ngRepeatScope.$parent.$id).toEqual($rootScope.$id);


      // Now remove the first ngIf element from the first item in the repeater
      $rootScope.$apply('val1 = false');

      // At this point we should have:
      //
      // <div class="ng-scope">
      //   <!-- ngRepeat: val in val0 -->
      //
      //   <!-- ngIf: val1 -->
      //
      //   <!-- ngIf: val2 -->
      //   <div ng-repeat-end="" ng-if="val2" class="ng-scope"></div>
      //   <!-- end ngIf: val2 -->
      //
      //   <!-- end ngRepeat: val in val0 -->
      // </div>
      //
      expect(ngRepeatScope.$$destroyed).toEqual(false);
      expect(ngIf1Scope.$$destroyed).toEqual(true);
      expect(ngIf2Scope.$$destroyed).toEqual(false);

      // Now remove the second ngIf element from the first item in the repeater
      $rootScope.$apply('val2 = false');

      // We are mostly back to where we started
      //
      // <div class="ng-scope">
      //   <!-- ngRepeat: val in val0 -->
      //   <!-- ngIf: val1 -->
      //   <!-- ngIf: val2 -->
      //   <!-- end ngRepeat: val in val0 -->
      // </div>

      expect(ngRepeatScope.$$destroyed).toEqual(false);
      expect(ngIf1Scope.$$destroyed).toEqual(true);
      expect(ngIf2Scope.$$destroyed).toEqual(true);

      // Finally remove the repeat items
      $rootScope.$apply('val0 = []');

      // Somehow this ngRepeat scope knows how to destroy itself...
      expect(ngRepeatScope.$$destroyed).toEqual(true);
      expect(ngIf1Scope.$$destroyed).toEqual(true);
      expect(ngIf2Scope.$$destroyed).toEqual(true);
    }));

    test('should throw error if unterminated', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('foo', function() {
          return {
            multiElement: true
          };
        });
      });
      angular.mock.inject(function($compile, $rootScope) {
        expect(function() {
          element = $compile(
              '<div>' +
                '<span foo-start></span>' +
              '</div>');
        }).toThrowMinErr('$compile', 'uterdir', 'Unterminated attribute, found \'foo-start\' but no matching \'foo-end\' found.');
      });
    });


    test('should correctly collect ranges on multiple directives on a single element', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('emptyDirective', function() {
          return {
            multiElement: true,
            link(scope, element) {
              element.data('x', 'abc');
            }
          };
        });
        $compileProvider.directive('rangeDirective', function() {
          return {
            multiElement: true,
            link(scope) {
              scope.x = 'X';
              scope.y = 'Y';
            }
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope) {
        element = $compile(
          '<div>' +
            '<div range-directive-start empty-directive>{{x}}</div>' +
            '<div range-directive-end>{{y}}</div>' +
          '</div>'
        )($rootScope);

        $rootScope.$digest();
        expect(element.text()).toBe('XY');
        expect(angular.element(element[0].firstChild).data('x')).toBe('abc');
      });
    });


    test('should throw error if unterminated (containing termination as a child)', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('foo', function() {
          return {
            multiElement: true
          };
        });
      });
      angular.mock.inject(function($compile) {
        expect(function() {
          element = $compile(
              '<div>' +
                  '<span foo-start><span foo-end></span></span>' +
              '</div>');
        }).toThrowMinErr('$compile', 'uterdir', 'Unterminated attribute, found \'foo-start\' but no matching \'foo-end\' found.');
      });
    });


    test('should support data- and x- prefix', angular.mock.inject(function($compile, $rootScope) {
      $rootScope.show = false;
      element = $compile(
          '<div>' +
              '<span data-ng-show-start="show"></span>' +
              '<span data-ng-show-end></span>' +
              '<span x-ng-show-start="show"></span>' +
              '<span x-ng-show-end></span>' +
          '</div>')($rootScope);
      $rootScope.$digest();
      var spans = element.find('span');
      expect(spans.eq(0)).toBeHidden();
      expect(spans.eq(1)).toBeHidden();
      expect(spans.eq(2)).toBeHidden();
      expect(spans.eq(3)).toBeHidden();
    }));
  });

  describe('$animate animation hooks', () => {

    beforeEach(angular.mock.module('ngAnimateMock'));

    test('should automatically fire the addClass and removeClass animation hooks',
      angular.mock.inject(function($compile, $animate, $rootScope) {
        var data;
        var element = angular.element('<div class="{{val1}} {{val2}} fire"></div>');
        $compile(element)($rootScope);

        $rootScope.$digest();

        expect(element.hasClass('fire')).toBe(true);

        $rootScope.val1 = 'ice';
        $rootScope.val2 = 'rice';
        $rootScope.$digest();

        data = $animate.queue.shift();
        expect(data.event).toBe('addClass');
        expect(data.args[1]).toBe('ice rice');

        expect(element.hasClass('ice')).toBe(true);
        expect(element.hasClass('rice')).toBe(true);
        expect(element.hasClass('fire')).toBe(true);

        $rootScope.val2 = 'dice';
        $rootScope.$digest();

        data = $animate.queue.shift();
        expect(data.event).toBe('addClass');
        expect(data.args[1]).toBe('dice');

        data = $animate.queue.shift();
        expect(data.event).toBe('removeClass');
        expect(data.args[1]).toBe('rice');

        expect(element.hasClass('ice')).toBe(true);
        expect(element.hasClass('dice')).toBe(true);
        expect(element.hasClass('fire')).toBe(true);

        $rootScope.val1 = '';
        $rootScope.val2 = '';
        $rootScope.$digest();

        data = $animate.queue.shift();
        expect(data.event).toBe('removeClass');
        expect(data.args[1]).toBe('ice dice');

        expect(element.hasClass('ice')).toBe(false);
        expect(element.hasClass('dice')).toBe(false);
        expect(element.hasClass('fire')).toBe(true);
      }));
  });

  describe('element replacement', () => {
    test('should broadcast $destroy only on removed elements, not replaced', () => {
      var linkCalls = [];
      var destroyCalls = [];

      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('replace', function() {
          return {
            multiElement: true,
            replace: true,
            templateUrl: 'template123'
          };
        });

        $compileProvider.directive('foo', function() {
          return {
            priority: 1, // before the replace directive
            link($scope, $element, $attrs) {
              linkCalls.push($attrs.foo);
              $element.on('$destroy', function() {
                destroyCalls.push($attrs.foo);
              });
            }
          };
        });
      });

      angular.mock.inject(function($compile, $templateCache, $rootScope) {
        $templateCache.put('template123', '<p></p>');

        $compile(
          '<div replace-start foo="1"><span foo="1.1"></span></div>' +
          '<div foo="2"><span foo="2.1"></span></div>' +
          '<div replace-end foo="3"><span foo="3.1"></span></div>'
        )($rootScope);

        expect(linkCalls).toEqual(['2', '3']);
        expect(destroyCalls).toEqual([]);
        $rootScope.$apply();
        expect(linkCalls).toEqual(['2', '3', '1']);
        expect(destroyCalls).toEqual(['2', '3']);
      });
    });

    function getAll($root) {
      // check for .querySelectorAll to support comment nodes
      return [$root[0]].concat($root[0].querySelectorAll ? ngInternals.sliceArgs($root[0].querySelectorAll('*')) : []);
    }

    function testCompileLinkDataCleanup(template) {
      angular.mock.inject(function($compile, $rootScope) {
        var toCompile = angular.element(template);

        var preCompiledChildren = getAll(toCompile);
        angular.forEach(preCompiledChildren, function(element, i) {
          angular.element.data(element, 'foo', 'template#' + i);
        });

        var linkedElements = $compile(toCompile)($rootScope);
        $rootScope.$apply();
        linkedElements.remove();

        angular.forEach(preCompiledChildren, function(element, i) {
          expect(angular.element.hasData(element)).toBe(false, 'template#' + i);
        });
        angular.forEach(getAll(linkedElements), function(element, i) {
          expect(angular.element.hasData(element)).toBe(false, 'linked#' + i);
        });
      });
    }
    test('should clean data of element-transcluded link-cloned elements', () => {
      testCompileLinkDataCleanup('<div><div ng-repeat-start="i in [1,2]"><span></span></div><div ng-repeat-end></div></div>');
    });
    test('should clean data of element-transcluded elements', () => {
      testCompileLinkDataCleanup('<div ng-if-start="false"><span><span/></div><span></span><div ng-if-end><span></span></div>');
    });

    function testReplaceElementCleanup(dirOptions) {
      var template = '<div></div>';
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('theDir', function() {
          return {
            multiElement: true,
            replace: dirOptions.replace,
            transclude: dirOptions.transclude,
            template: dirOptions.asyncTemplate ? undefined : template,
            templateUrl: dirOptions.asyncTemplate ? 'the-dir-template-url' : undefined
          };
        });
      });
      angular.mock.inject(function($templateCache, $compile, $rootScope) {
        $templateCache.put('the-dir-template-url', template);

        testCompileLinkDataCleanup(
          '<div>' +
          '<div the-dir-start><span></span></div>' +
          '<div><span></span><span></span></div>' +
          '<div the-dir-end><span></span></div>' +
          '</div>'
        );
      });
    }
    test('should clean data of elements removed for directive template', () => {
      testReplaceElementCleanup({});
    });
    test('should clean data of elements removed for directive templateUrl', () => {
      testReplaceElementCleanup({asyncTemplate: true});
    });
    test('should clean data of elements transcluded into directive template', () => {
      testReplaceElementCleanup({transclude: true});
    });
    test('should clean data of elements transcluded into directive templateUrl', () => {
      testReplaceElementCleanup({transclude: true, asyncTemplate: true});
    });
    test('should clean data of elements replaced with directive template', () => {
      testReplaceElementCleanup({replace: true});
    });
    test('should clean data of elements replaced with directive templateUrl', () => {
      testReplaceElementCleanup({replace: true, asyncTemplate: true});
    });
  });

  describe('component helper', () => {
    test('should return the module', () => {
      var myModule = angular.module('my', []);
      expect(myModule.component('myComponent', {})).toBe(myModule);
      expect(myModule.component({})).toBe(myModule);
    });

    test('should register a directive', () => {
      angular.module('my', []).component('myComponent', {
        template: '<div>SUCCESS</div>',
        controller(log) {
          log('OK');
        }
      });
      angular.mock.module('my');

      angular.mock.inject(function($compile, $rootScope, log) {
        element = $compile('<my-component></my-component>')($rootScope);
        expect(element.find('div').text()).toEqual('SUCCESS');
        expect(log).toEqual('OK');
      });
    });

    test('should register multiple directives when object passed as first parameter', () => {
      var log = '';
      angular.module('my', []).component({
        fooComponent: {
          template: '<div>FOO SUCCESS</div>',
          controller() {
            log += 'FOO:OK';
          }
        },
        barComponent: {
          template: '<div>BAR SUCCESS</div>',
          controller() {
            log += 'BAR:OK';
          }
        }
      });
      angular.mock.module('my');

      angular.mock.inject(function($compile, $rootScope) {
        var fooElement = $compile('<foo-component></foo-component>')($rootScope);
        var barElement = $compile('<bar-component></bar-component>')($rootScope);

        expect(fooElement.find('div').text()).toEqual('FOO SUCCESS');
        expect(barElement.find('div').text()).toEqual('BAR SUCCESS');
        expect(log).toEqual('FOO:OKBAR:OK');
      });
    });

    test('should register a directive via $compileProvider.component()', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.component('myComponent', {
          template: '<div>SUCCESS</div>',
          controller(log) {
            log('OK');
          }
        });
      });

      angular.mock.inject(function($compile, $rootScope, log) {
        element = $compile('<my-component></my-component>')($rootScope);
        expect(element.find('div').text()).toEqual('SUCCESS');
        expect(log).toEqual('OK');
      });
    });

    test('should add additional annotations to directive factory', () => {
      var myModule = angular.module('my', []).component('myComponent', {
        $canActivate: 'canActivate',
        $routeConfig: 'routeConfig',
        $customAnnotation: 'XXX'
      });
      expect(myModule._invokeQueue.pop().pop()[1]).toEqual(expect.objectContaining({
        $canActivate: 'canActivate',
        $routeConfig: 'routeConfig',
        $customAnnotation: 'XXX'
      }));
    });

    test('should expose additional annotations on the directive definition object', () => {
      angular.module('my', []).component('myComponent', {
        $canActivate: 'canActivate',
        $routeConfig: 'routeConfig',
        $customAnnotation: 'XXX'
      });
      angular.mock.module('my');
      angular.mock.inject(function(myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          $canActivate: 'canActivate',
          $routeConfig: 'routeConfig',
          $customAnnotation: 'XXX'
        }));
      });
    });

    test('should support custom annotations if the controller is named', () => {
      angular.module('my', []).component('myComponent', {
        $customAnnotation: 'XXX',
        controller: 'SomeNamedController'
      });
      angular.mock.module('my');
      angular.mock.inject(function(myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          $customAnnotation: 'XXX'
        }));
      });
    });

    test('should provide a new empty controller if none is specified', () => {
      angular.module('my', []).
        component('myComponent1', {$customAnnotation1: 'XXX'}).
        component('myComponent2', {$customAnnotation2: 'YYY'});

      angular.mock.module('my');

      angular.mock.inject(function(myComponent1Directive, myComponent2Directive) {
        var ctrl1 = myComponent1Directive[0].controller;
        var ctrl2 = myComponent2Directive[0].controller;

        expect(ctrl1).not.toBe(ctrl2);
        expect(ctrl1.$customAnnotation1).toBe('XXX');
        expect(ctrl1.$customAnnotation2).toBeUndefined();
        expect(ctrl2.$customAnnotation1).toBeUndefined();
        expect(ctrl2.$customAnnotation2).toBe('YYY');
      });
    });

    test('should return ddo with reasonable defaults', () => {
      angular.module('my', []).component('myComponent', {});
      angular.mock.module('my');
      angular.mock.inject(function(myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          controller: expect.any(Function),
          controllerAs: '$ctrl',
          template: '',
          templateUrl: undefined,
          transclude: undefined,
          scope: {},
          bindToController: {},
          restrict: 'E'
        }));
      });
    });

    test('should return ddo with assigned options', () => {
      function myCtrl() {}
      angular.module('my', []).component('myComponent', {
        controller: myCtrl,
        controllerAs: 'ctrl',
        template: 'abc',
        templateUrl: 'def.html',
        transclude: true,
        bindings: {abc: '='}
      });
      angular.mock.module('my');
      angular.mock.inject(function(myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          controller: myCtrl,
          controllerAs: 'ctrl',
          template: 'abc',
          templateUrl: 'def.html',
          transclude: true,
          scope: {},
          bindToController: {abc: '='},
          restrict: 'E'
        }));
      });
    });

    test('should allow passing injectable functions as template/templateUrl', () => {
      var log = '';
      angular.module('my', []).component('myComponent', {
        template($element, $attrs, myValue) {
          log += 'template,' + $element + ',' + $attrs + ',' + myValue + '\n';
        },
        templateUrl($element, $attrs, myValue) {
          log += 'templateUrl,' + $element + ',' + $attrs + ',' + myValue + '\n';
        }
      }).value('myValue', 'blah');
      angular.mock.module('my');
      angular.mock.inject(function(myComponentDirective) {
        myComponentDirective[0].template('a', 'b');
        myComponentDirective[0].templateUrl('c', 'd');
        expect(log).toEqual('template,a,b,blah\ntemplateUrl,c,d,blah\n');
      });
    });

    test('should allow passing injectable arrays as template/templateUrl', () => {
      var log = '';
      angular.module('my', []).component('myComponent', {
        template: ['$element', '$attrs', 'myValue', function($element, $attrs, myValue) {
          log += 'template,' + $element + ',' + $attrs + ',' + myValue + '\n';
        }],
        templateUrl: ['$element', '$attrs', 'myValue', function($element, $attrs, myValue) {
          log += 'templateUrl,' + $element + ',' + $attrs + ',' + myValue + '\n';
        }]
      }).value('myValue', 'blah');
      angular.mock.module('my');
      angular.mock.inject(function(myComponentDirective) {
        myComponentDirective[0].template('a', 'b');
        myComponentDirective[0].templateUrl('c', 'd');
        expect(log).toEqual('template,a,b,blah\ntemplateUrl,c,d,blah\n');
      });
    });

    test('should allow passing transclude as object', () => {
      angular.module('my', []).component('myComponent', {
        transclude: {}
      });
      angular.mock.module('my');
      angular.mock.inject(function(myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          transclude: {}
        }));
      });
    });

    test('should give ctrl as syntax priority over controllerAs', () => {
      angular.module('my', []).component('myComponent', {
        controller: 'MyCtrl as vm'
      });
      angular.mock.module('my');
      angular.mock.inject(function(myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          controllerAs: 'vm'
        }));
      });
    });
  });

  describe('$$createComment', () => {
    test('should create empty comments if `debugInfoEnabled` is false', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.debugInfoEnabled(false);
      });

      angular.mock.inject(function($compile) {
        var comment = $compile.$$createComment('foo', 'bar');
        expect(comment.data).toBe('');
      });
    });

    test('should create descriptive comments if `debugInfoEnabled` is true', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.debugInfoEnabled(true);
      });

      angular.mock.inject(function($compile) {
        var comment = $compile.$$createComment('foo', 'bar');
        expect(comment.data).toBe(' foo: bar ');
      });
    });
  });
});
