'use strict';

/* eslint-disable no-script-url */

describe('$compile', function () {
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

  function getChildScopes(scope) {
    var children = [];
    if (!scope.$$childHead) {
      return children;
    }
    var childScope = scope.$$childHead;
    do {
      children.push(childScope);
      children = children.concat(getChildScopes(childScope));
    } while ((childScope = childScope.$$nextSibling));
    return children;
  }

  var element, directive, $compile, $rootScope;

  beforeEach(angular.mock.module(provideLog, function ($provide, $compileProvider) {
    element = null;
    directive = $compileProvider.directive;

    directive('log', function (log) {
      return {
        restrict: 'CAM',
        priority: 0,
        compile: ngInternals.valueFn(function (scope, element, attrs) {
          log(attrs.log || 'LOG');
        })
      };
    });

    directive('highLog', function (log) {
      return {
        restrict: 'CAM', priority: 3, compile: ngInternals.valueFn(function (scope, element, attrs) {
          log(attrs.highLog || 'HIGH');
        })
      };
    });

    directive('mediumLog', function (log) {
      return {
        restrict: 'CAM', priority: 2, compile: ngInternals.valueFn(function (scope, element, attrs) {
          log(attrs.mediumLog || 'MEDIUM');
        })
      };
    });

    directive('greet', function () {
      return {
        restrict: 'CAM', priority: 10, compile: ngInternals.valueFn(function (scope, element, attrs) {
          element.text('Hello ' + attrs.greet);
        })
      };
    });

    directive('set', function () {
      return function (scope, element, attrs) {
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

    directive('svgContainer', function () {
      return {
        template: '<svg width="400" height="400" ng-transclude></svg>',
        replace: true,
        transclude: true
      };
    });

    directive('svgCustomTranscludeContainer', function () {
      return {
        template: '<svg width="400" height="400"></svg>',
        transclude: true,
        link: function (scope, element, attr, ctrls, $transclude) {
          var futureParent = element.children().eq(0);
          $transclude(function (clone) {
            futureParent.append(clone);
          }, futureParent);
        }
      };
    });

    directive('svgCircle', function () {
      return {
        template: '<circle cx="2" cy="2" r="1"></circle>',
        templateNamespace: 'svg',
        replace: true
      };
    });

    directive('myForeignObject', function () {
      return {
        template: '<foreignObject width="100" height="100" ng-transclude></foreignObject>',
        templateNamespace: 'svg',
        replace: true,
        transclude: true
      };
    });


    return function (_$compile_, _$rootScope_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    };
  }));

  function compile(html) {
    element = angular.element(html);
    toDealoc.push(element);
    compileForTest(element);
  }

  afterEach(function () {
    dealoc(element);
  });


  describe('configuration', function () {

    it('should allow aHrefSanitizationWhitelist to be configured', function () {
      angular.mock.module(function ($compileProvider) {
        expect($compileProvider.aHrefSanitizationWhitelist()).toEqual(/^\s*(https?|s?ftp|mailto|tel|file):/); // the default
        $compileProvider.aHrefSanitizationWhitelist(/other/);
        expect($compileProvider.aHrefSanitizationWhitelist()).toEqual(/other/);
      });
      angular.mock.inject();
    });

    it('should allow debugInfoEnabled to be configured', function () {
      angular.mock.module(function ($compileProvider) {
        expect($compileProvider.debugInfoEnabled()).toBe(true); // the default
        $compileProvider.debugInfoEnabled(false);
        expect($compileProvider.debugInfoEnabled()).toBe(false);
      });
      angular.mock.inject();
    });

    it('should allow preAssignBindingsEnabled to be configured', function () {
      angular.mock.module(function ($compileProvider) {
        expect($compileProvider.preAssignBindingsEnabled()).toBe(false); // the default
        $compileProvider.preAssignBindingsEnabled(true);
        expect($compileProvider.preAssignBindingsEnabled()).toBe(true);
        $compileProvider.preAssignBindingsEnabled(false);
        expect($compileProvider.preAssignBindingsEnabled()).toBe(false);
      });
      angular.mock.inject();
    });

    it('should allow strictComponentBindingsEnabled to be configured', function () {
      angular.mock.module(function ($compileProvider) {
        expect($compileProvider.strictComponentBindingsEnabled()).toBe(false); // the default
        $compileProvider.strictComponentBindingsEnabled(true);
        expect($compileProvider.strictComponentBindingsEnabled()).toBe(true);
      });
      angular.mock.inject();
    });

    it('should allow onChangesTtl to be configured', function () {
      angular.mock.module(function ($compileProvider) {
        expect($compileProvider.onChangesTtl()).toBe(10); // the default
        $compileProvider.onChangesTtl(2);
        expect($compileProvider.onChangesTtl()).toBe(2);
      });
      angular.mock.inject();
    });

    it('should allow commentDirectivesEnabled to be configured', function () {
      angular.mock.module(function ($compileProvider) {
        expect($compileProvider.commentDirectivesEnabled()).toBe(true); // the default
        $compileProvider.commentDirectivesEnabled(false);
        expect($compileProvider.commentDirectivesEnabled()).toBe(false);
      });
      angular.mock.inject();
    });

    it('should allow cssClassDirectivesEnabled to be configured', function () {
      angular.mock.module(function ($compileProvider) {
        expect($compileProvider.cssClassDirectivesEnabled()).toBe(true); // the default
        $compileProvider.cssClassDirectivesEnabled(false);
        expect($compileProvider.cssClassDirectivesEnabled()).toBe(false);
      });
      angular.mock.inject();
    });

    it('should register a directive', function () {
      angular.mock.module(function () {
        directive('div', function (log) {
          return {
            restrict: 'ECA',
            link: function (scope, element) {
              log('OK');
              element.text('SUCCESS');
            }
          };
        });
      });
      angular.mock.inject(function ($compile, $rootScope, log) {
        element = compileForTest('<div></div>');
        expect(element.text()).toEqual('SUCCESS');
        expect(log).toEqual('OK');
      });
    });

    it('should allow registration of multiple directives with same name', function () {
      angular.mock.module(function () {
        directive('div', function (log) {
          return {
            restrict: 'ECA',
            link: {
              pre: log.fn('pre1'),
              post: log.fn('post1')
            }
          };
        });
        directive('div', function (log) {
          return {
            restrict: 'ECA',
            link: {
              pre: log.fn('pre2'),
              post: log.fn('post2')
            }
          };
        });
      });
      angular.mock.inject(function ($compile, $rootScope, log) {
        element = compileForTest('<div></div>');
        expect(log).toEqual('pre1; pre2; post2; post1');
      });
    });

    it('should throw an exception if a directive is called "hasOwnProperty"', function () {
      angular.mock.module(function () {
        expect(function () {
          directive('hasOwnProperty', function () {
          });
        }).toThrowMinErr('ng', 'badname', 'hasOwnProperty is not a valid directive name');
      });
      angular.mock.inject(function ($compile) {
      });
    });

    it('should throw an exception if a directive name starts with a non-lowercase letter', function () {
      angular.mock.module(function () {
        expect(function () {
          directive('BadDirectiveName', function () {
          });
        }).toThrowMinErr('$compile', 'baddir', 'Directive/Component name \'BadDirectiveName\' is invalid. The first character must be a lowercase letter');
      });
      angular.mock.inject(function ($compile) {
      });
    });

    it('should throw an exception if a directive name has leading or trailing whitespace', function () {
      angular.mock.module(function () {
        function assertLeadingOrTrailingWhitespaceInDirectiveName(name) {
          expect(function () {
            directive(name, function () {
            });
          }).toThrowMinErr(
            '$compile', 'baddir', 'Directive/Component name \'' + name + '\' is invalid. ' +
            'The name should not contain leading or trailing whitespaces');
        }

        assertLeadingOrTrailingWhitespaceInDirectiveName(' leadingWhitespaceDirectiveName');
        assertLeadingOrTrailingWhitespaceInDirectiveName('trailingWhitespaceDirectiveName ');
        assertLeadingOrTrailingWhitespaceInDirectiveName(' leadingAndTrailingWhitespaceDirectiveName ');
      });
      angular.mock.inject(function ($compile) {
      });
    });

    it('should throw an exception if the directive name is not defined', function () {
      angular.mock.module(function () {
        expect(function () {
          directive();
        }).toThrowMinErr('ng', 'areq');
      });
      angular.mock.inject(function ($compile) {
      });
    });

    it('should ignore special chars before processing attribute directive name', function () {
      // a regression https://github.com/angular/angular.js/issues/16278
      angular.mock.module(function () {
        directive('t', function (log) {
          return {
            restrict: 'A',
            link: {
              pre: log.fn('pre'),
              post: log.fn('post')
            }
          };
        });
      });
      angular.mock.inject(function (log) {
        compileForTest('<div _t></div>');
        compileForTest('<div -t></div>');
        compileForTest('<div :t></div>');
        expect(log).toEqual('pre; post; pre; post; pre; post');
      });
    });

    it('should throw an exception if the directive factory is not defined', function () {
      angular.mock.module(function () {
        expect(function () {
          directive('myDir');
        }).toThrowMinErr('ng', 'areq');
      });
      angular.mock.inject(function ($compile) {
      });
    });

    it('should preserve context within declaration', function () {
      angular.mock.module(function () {
        directive('ff', function (log) {
          var declaration = {
            restrict: 'E',
            template: function () {
              log('ff template: ' + (this === declaration));
            },
            compile: function () {
              log('ff compile: ' + (this === declaration));
              return function () {
                log('ff post: ' + (this === declaration));
              };
            }
          };
          return declaration;
        });

        directive('fff', function (log) {
          var declaration = {
            restrict: 'E',
            link: {
              pre: function () {
                log('fff pre: ' + (this === declaration));
              },
              post: function () {
                log('fff post: ' + (this === declaration));
              }
            }
          };
          return declaration;
        });

        directive('ffff', function (log) {
          var declaration = {
            restrict: 'E',
            compile: function () {
              return {
                pre: function () {
                  log('ffff pre: ' + (this === declaration));
                },
                post: function () {
                  log('ffff post: ' + (this === declaration));
                }
              };
            }
          };
          return declaration;
        });

        directive('fffff', function (log) {
          var declaration = {
            restrict: 'E',
            templateUrl: function () {
              log('fffff templateUrl: ' + (this === declaration));
              return 'fffff.html';
            },
            link: function () {
              log('fffff post: ' + (this === declaration));
            }
          };
          return declaration;
        });
      });

      angular.mock.inject(function ($rootScope, $templateCache, log) {
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


  describe('svg namespace transcludes', function () {
    var ua = window.navigator.userAgent;
    var isEdge = /Edge/.test(ua);

    // this method assumes some sort of sized SVG element is being inspected.
    function assertIsValidSvgCircle(elem) {
      expect(isUnknownElement(elem)).toBe(false);
      expect(isSVGElement(elem)).toBe(true);
    }

    it('should handle transcluded svg elements', function () {
      element = angular.element('<div><svg-container>' +
        '<circle cx="4" cy="4" r="2"></circle>' +
        '</svg-container></div>');
      toDealoc.push(element);
      element = compileForTest(element.contents())
      document.body.appendChild(element[0]);

      var circle = element.find('circle');

      assertIsValidSvgCircle(circle[0]);
    });

    it('should handle custom svg elements inside svg tag', angular.mock.inject(function () {
      element = angular.element('<div><svg width="300" height="300">' +
        '<svg-circle></svg-circle>' +
        '</svg></div>');
      toDealoc.push(element);
      element = compileForTest(element.contents());
      document.body.appendChild(element[0]);

      var circle = element.find('circle');
      assertIsValidSvgCircle(circle[0]);
    }));

    it('should handle transcluded custom svg elements', angular.mock.inject(function () {
      element = angular.element('<div><svg-container>' +
        '<svg-circle></svg-circle>' +
        '</svg-container></div>');
      toDealoc.push(element);
      element = compileForTest(element.contents());
      document.body.appendChild(element[0]);

      var circle = element.find('circle');
      assertIsValidSvgCircle(circle[0]);
    }));

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

    it('should handle foreignObject', angular.mock.inject(function () {
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
      toDealoc.push(element);
      compileForTest(element.contents());
      document.body.appendChild(element[0]);

      var referenceElem = element.find('div')[0];
      var testElem = element.find('div')[1];
      var referenceBounds = referenceElem.getBoundingClientRect();
      var testBounds = testElem.getBoundingClientRect();

      expect(isHTMLElement(testElem)).toBe(true);
      expect(testBounds.width).toBe(referenceBounds.width);
      expect(testBounds.height).toBe(referenceBounds.height);
    }));

    it('should handle custom svg containers that transclude to foreignObject that transclude html', angular.mock.inject(function () {
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
      toDealoc.push(element);
      compileForTest(element.contents());
      document.body.appendChild(element[0]);

      var referenceElem = element.find('div')[0];
      var testElem = element.find('div')[1];
      var referenceBounds = referenceElem.getBoundingClientRect();
      var testBounds = testElem.getBoundingClientRect();

      expect(isHTMLElement(testElem)).toBe(true);
      expect(testBounds.width).toBe(referenceBounds.width);
      expect(testBounds.height).toBe(referenceBounds.height);
    }));

    // NOTE: This test may be redundant.
    // Support: Edge 14-15+
    // An `<svg>` element inside a `<foreignObject>` element on MS Edge has no
    // size, causing the included `<circle>` element to also have no size and thus fails an
    // assertion (relying on the element having a non-zero size).
    if (!isEdge) {
      it('should handle custom svg containers that transclude to foreignObject' +
        ' that transclude to custom svg containers that transclude to custom elements', angular.mock.inject(function () {
        element = angular.element('<div><svg-container>' +
          '<my-foreign-object><svg-container><svg-circle></svg-circle></svg-container></my-foreign-object>' +
          '</svg-container></div>');
        toDealoc.push(element);
        compileForTest(element.contents());
        document.body.appendChild(element[0]);

        var circle = element.find('circle');
        assertIsValidSvgCircle(circle[0]);
      }));
    }

    it('should handle directives with templates that manually add the transclude further down', angular.mock.inject(function () {
      element = angular.element('<div><svg-custom-transclude-container>' +
        '<circle cx="2" cy="2" r="1"></circle></svg-custom-transclude-container>' +
        '</div>');
      toDealoc.push(element);
      compileForTest(element.contents());
      document.body.appendChild(element[0]);

      var circle = element.find('circle');
      assertIsValidSvgCircle(circle[0]);

    }));

    it('should support directives with SVG templates and a slow url ' +
      'that are stamped out later by a transcluding directive', function () {
      angular.mock.module(function () {
        directive('svgCircleUrl', ngInternals.valueFn({
          replace: true,
          templateUrl: 'template.html',
          templateNamespace: 'SVG'
        }));
      });
      angular.mock.inject(function ($compile, $rootScope, $httpBackend) {
        $httpBackend.expect('GET', 'template.html').respond('<circle></circle>');
        element = compileForTest('<svg><g ng-repeat="l in list"><svg-circle-url></svg-circle-url></g></svg>');

        // initially the template is not yet loaded
        $rootScope.$apply(function () {
          $rootScope.list = [1];
        });
        expect(element.find('svg-circle-url').length).toBe(1);
        expect(element.find('circle').length).toBe(0);

        // template is loaded and replaces the existing nodes
        $httpBackend.flush();
        expect(element.find('svg-circle-url').length).toBe(0);
        expect(element.find('circle').length).toBe(1);

        // new entry should immediately use the loaded template
        $rootScope.$apply(function () {
          $rootScope.list.push(2);
        });
        expect(element.find('svg-circle-url').length).toBe(0);
        expect(element.find('circle').length).toBe(2);
      });
    });
  });

  describe('compile phase', function () {

    it('should attach scope to the document node when it is compiled explicitly', angular.mock.inject(function ($document) {
      compileForTest($document);
      expect($document.scope()).toBe;
    }));


    it('should not wrap root text nodes in spans', function () {
      element = angular.element(
        '<div>   <div>A</div>\n  ' +
        '<div>B</div>C\t\n  ' +
        '</div>');
      toDealoc.push(element);
      element = compileForTest(element.contents());
      var spans = element.find('span');
      expect(spans.length).toEqual(0);
    });


    it('should be able to compile text nodes at the root', angular.mock.inject(function () {
      element = angular.element('<div>Name: {{name}}<br />\nColor: {{color}}</div>');
      toDealoc.push(element);
      $rootScope.name = 'Lucas';
      $rootScope.color = 'blue';
      element = compileForTest(element.contents());
      $rootScope.$digest();
      expect(element.text()).toEqual('Name: Lucas\nColor: blue');
    }));


    it('should not leak memory when there are top level empty text nodes', angular.mock.inject(function () {
      // We compile the contents of element (i.e. not element itself)
      // Then delete these contents and check the cache has been reset to zero

      const originalCacheSize = jqLiteCacheSize();
      // First with only elements at the top level
      element = angular.element('<div><div></div></div>');
      toDealoc.push(element);
      compileForTest(element.contents());
      element.empty();
      expect(jqLiteCacheSize()).toEqual(originalCacheSize);

      // Next with non-empty text nodes at the top level
      // (in this case the compiler will wrap them in a <span>)
      element = angular.element('<div>xxx</div>');
      toDealoc.push(element);
      compileForTest(element.contents());
      element.empty();
      expect(jqLiteCacheSize()).toEqual(originalCacheSize);

      // Next with comment nodes at the top level
      element = angular.element('<div><!-- comment --></div>');
      toDealoc.push(element);
      compileForTest(element.contents());
      element.empty();
      expect(jqLiteCacheSize()).toEqual(originalCacheSize);

      // Finally with empty text nodes at the top level
      element = angular.element('<div>   \n<div></div>   </div>');
      toDealoc.push(element);
      compileForTest(element.contents());
      element.empty();
      expect(jqLiteCacheSize()).toEqual(originalCacheSize);
    }));


    it('should not blow up when elements with no childNodes property are compiled', angular.mock.inject(
      function ($compile, $rootScope) {
        // it turns out that when a browser plugin is bound to a DOM element (typically <object>),
        // the plugin's context rather than the usual DOM apis are exposed on this element, so
        // childNodes might not exist.

        element = angular.element('<div>{{1+2}}</div>');
        toDealoc.push(element);

        try {
          element[0].childNodes[1] = { nodeType: 3, nodeName: 'OBJECT', textContent: 'fake node' };
        } catch (e) { /* empty */
        }
        if (!element[0].childNodes[1]) return; // browser doesn't support this kind of mocking

        expect(element[0].childNodes[1].textContent).toBe('fake node');

        element = compileForTest(element);
        $rootScope.$apply();

        // object's children can't be compiled in this case, so we expect them to be raw
        expect(element.html()).toBe('3');
      }));

    it('should detect anchor elements with the string "SVG" in the `href` attribute as an anchor', angular.mock.inject(function ($compile, $rootScope) {
      element = angular.element('<div><a href="/ID_SVG_ID">' +
        '<span ng-if="true">Should render</span>' +
        '</a></div>');
      toDealoc.push(element);
      element = compileForTest(element.contents());
      $rootScope.$digest();
      document.body.appendChild(element[0]);
      expect(element.find('span').text()).toContain('Should render');
    }));

    describe('multiple directives per element', function () {
      it('should allow multiple directives per element', angular.mock.inject(function ($compile, $rootScope, log) {
        element = compileForTest('<span greet="angular" log="L" x-high-log="H" data-medium-log="M"></span>');
        expect(element.text()).toEqual('Hello angular');
        expect(log).toEqual('L; M; H');
      }));


      it('should recurse to children', angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest('<div>0<a set="hello">1</a>2<b set="angular">3</b>4</div>');
        expect(element.text()).toEqual('0hello2angular4');
      }));


      it('should allow directives in classes', angular.mock.inject(function ($compile, $rootScope, log) {
        element = compileForTest('<div class="greet: angular; log:123;"></div>');
        expect(element.html()).toEqual('Hello angular');
        expect(log).toEqual('123');
      }));


      it('should allow directives in SVG element classes', angular.mock.inject(function ($compile, $rootScope, log) {
        if (!window.SVGElement) return;
        element = compileForTest('<svg><text class="greet: angular; log:123;"></text></svg>');
        var text = element.children().eq(0);
        // In old Safari, SVG elements don't have innerHTML, so element.html() won't work
        // (https://bugs.webkit.org/show_bug.cgi?id=136903)
        expect(text.text()).toEqual('Hello angular');
        expect(log).toEqual('123');
      }));


      it('should ignore not set CSS classes on SVG elements', angular.mock.inject(function ($compile, $rootScope, log) {
        if (!window.SVGElement) return;
        // According to spec SVG element className property is readonly, but only FF
        // implements it this way which causes compile exceptions.
        element = compileForTest('<svg><text>{{1}}</text></svg>');
        $rootScope.$digest();
        expect(element.text()).toEqual('1');
      }));


      it('should receive scope, element, and attributes', function () {
        var injector;
        angular.mock.module(function () {
          directive('log', function ($injector, $rootScope) {
            injector = $injector;
            return {
              restrict: 'CA',
              compile: function (element, templateAttr) {
                expect(typeof templateAttr.$normalize).toBe('function');
                expect(typeof templateAttr.$set).toBe('function');
                expect(angular.isElement(templateAttr.$$element)).toBeTruthy();
                expect(element.text()).toEqual('unlinked');
                expect(templateAttr.exp).toEqual('abc');
                expect(templateAttr.aa).toEqual('A');
                expect(templateAttr.bb).toEqual('B');
                expect(templateAttr.cc).toEqual('C');
                return function (scope, element, attr) {
                  expect(element.text()).toEqual('unlinked');
                  expect(attr).toBe(templateAttr);
                  expect(scope).toEqual;
                  element.text('worked');
                };
              }
            };
          });
        });
        angular.mock.inject(function ($rootScope, $compile, $injector) {
          element = compileForTest(
            '<div class="log" exp="abc" aa="A" x-Bb="B" daTa-cC="C">unlinked</div>');
          expect(element.text()).toEqual('worked');
          expect(injector).toBe($injector); // verify that directive is injectable
        });
      });
    });

    describe('error handling', function () {

      it('should handle exceptions', function () {
        angular.mock.module(function ($exceptionHandlerProvider) {
          $exceptionHandlerProvider.mode('log');
          directive('factoryError', function () {
            throw 'FactoryError';
          });
          directive('templateError',
            ngInternals.valueFn({
              compile: function () {
                throw 'TemplateError';
              }
            }));
          directive('linkingError',
            ngInternals.valueFn(function () {
              throw 'LinkingError';
            }));
        });
        angular.mock.inject(function ($rootScope, $compile, $exceptionHandler) {
          element = compileForTest('<div factory-error template-error linking-error></div>');
          expect($exceptionHandler.errors[0]).toEqual('FactoryError');
          expect($exceptionHandler.errors[1][0]).toEqual('TemplateError');
          expect(sortTag($exceptionHandler.errors[1][1])).toEqual('<div factory-error="" linking-error="" template-error="">');
          expect($exceptionHandler.errors[2][0]).toEqual('LinkingError');
          expect(sortTag($exceptionHandler.errors[2][1])).toEqual('<div class="ng-scope" factory-error="" linking-error="" template-error="">');

          // Support: Edge 15+
          // Edge sort attributes in a different order.
          function sortTag(text) {
            var parts, elementName;

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


      it('should allow changing the template structure after the current node', function () {
        angular.mock.module(function () {
          directive('after', ngInternals.valueFn({
            compile: function (element) {
              element.after('<span log>B</span>');
            }
          }));
        });
        angular.mock.inject(function ($compile, $rootScope, log) {
          element = angular.element('<div><div after>A</div></div>');
          toDealoc.push(element);
          compileForTest(element);
          expect(element.text()).toBe('AB');
          expect(log).toEqual('LOG');
        });
      });


      it('should allow changing the template structure after the current node inside ngRepeat', function () {
        angular.mock.module(function () {
          directive('after', ngInternals.valueFn({
            compile: function (element) {
              element.after('<span log>B</span>');
            }
          }));
        });
        angular.mock.inject(function ($compile, $rootScope, log) {
          element = angular.element('<div><div ng-repeat="i in [1,2]"><div after>A</div></div></div>');
          toDealoc.push(element);
          compileForTest(element);
          $rootScope.$digest();
          expect(element.text()).toBe('ABAB');
          expect(log).toEqual('LOG; LOG');
        });
      });


      it('should allow modifying the DOM structure in post link fn', function () {
        angular.mock.module(function () {
          directive('removeNode', ngInternals.valueFn({
            link: function ($scope, $element) {
              $element.remove();
            }
          }));
        });
        angular.mock.inject(function ($compile, $rootScope) {
          element = angular.element('<div><div remove-node></div><div>{{test}}</div></div>');
          toDealoc.push(element);
          $rootScope.test = 'Hello';
          compileForTest(element);
          $rootScope.$digest();
          expect(element.children().length).toBe(1);
          expect(element.text()).toBe('Hello');
        });
      });
    });

    describe('compiler control', function () {
      describe('priority', function () {
        it('should honor priority', angular.mock.inject(function ($compile, $rootScope, log) {
          element = compileForTest(
            '<span log="L" x-high-log="H" data-medium-log="M"></span>');
          expect(log).toEqual('L; M; H');
        }));
      });


      describe('terminal', function () {

        it('should prevent further directives from running', angular.mock.inject(function ($rootScope, $compile) {
            element = compileForTest('<div negative-stop><a set="FAIL">OK</a></div>');
            expect(element.text()).toEqual('OK');
          }
        ));


        it('should prevent further directives from running, but finish current priority level',
          angular.mock.inject(function ($rootScope, $compile, log) {
            // class is processed after attrs, so putting log in class will put it after
            // the stop in the current level. This proves that the log runs after stop
            element = compileForTest(
              '<div high-log medium-stop log class="medium-log"><a set="FAIL">OK</a></div>');
            expect(element.text()).toEqual('OK');
            expect(log.toArray().sort()).toEqual(['HIGH', 'MEDIUM']);
          })
        );
      });


      describe('restrict', function () {

        it('should allow restriction of availability', function () {
          angular.mock.module(function () {
            angular.forEach({ div: 'E', attr: 'A', clazz: 'C', comment: 'M', all: 'EACM' },
              function (restrict, name) {
                directive(name, function (log) {
                  return {
                    restrict: restrict,
                    compile: ngInternals.valueFn(function (scope, element, attr) {
                      log(name);
                    })
                  };
                });
              });
          });
          angular.mock.inject(function ($rootScope, $compile, log) {
            dealoc(compileForTest('<span div class="div"></span>'));
            expect(log).toEqual('');
            log.reset();

            dealoc(compileForTest('<div></div>'));
            expect(log).toEqual('div');
            log.reset();

            dealoc(compileForTest('<attr class="attr"></attr>'));
            expect(log).toEqual('');
            log.reset();

            dealoc(compileForTest('<span attr></span>'));
            expect(log).toEqual('attr');
            log.reset();

            dealoc(compileForTest('<clazz clazz></clazz>'));
            expect(log).toEqual('');
            log.reset();

            dealoc(compileForTest('<span class="clazz"></span>'));
            expect(log).toEqual('clazz');
            log.reset();

            dealoc(compileForTest('<!-- directive: comment -->'));
            expect(log).toEqual('comment');
            log.reset();

            dealoc(compileForTest('<all class="all" all><!-- directive: all --></all>'));
            expect(log).toEqual('all; all; all; all');
          });
        });


        it('should use EA rule as the default', function () {
          angular.mock.module(function () {
            directive('defaultDir', function (log) {
              return {
                compile: function () {
                  log('defaultDir');
                }
              };
            });
          });
          angular.mock.inject(function ($rootScope, $compile, log) {
            dealoc(compileForTest('<span default-dir ></span>'));
            expect(log).toEqual('defaultDir');
            log.reset();

            dealoc(compileForTest('<default-dir></default-dir>'));
            expect(log).toEqual('defaultDir');
            log.reset();

            dealoc(compileForTest('<span class="default-dir"></span>'));
            expect(log).toEqual('');
            log.reset();
          });
        });
      });


      describe('template', function () {

        beforeEach(angular.mock.module(function () {
          directive('replace', ngInternals.valueFn({
            restrict: 'CAM',
            replace: true,
            template: '<div class="log" style="width: 10px" high-log>Replace!</div>',
            compile: function (element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('nomerge', ngInternals.valueFn({
            restrict: 'CAM',
            replace: true,
            template: '<div class="log" id="myid" high-log>No Merge!</div>',
            compile: function (element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('append', ngInternals.valueFn({
            restrict: 'CAM',
            template: '<div class="log" style="width: 10px" high-log>Append!</div>',
            compile: function (element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('replaceWithInterpolatedClass', ngInternals.valueFn({
            replace: true,
            template: '<div class="class_{{1+1}}">Replace with interpolated class!</div>',
            compile: function (element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('replaceWithInterpolatedStyle', ngInternals.valueFn({
            replace: true,
            template: '<div style="width:{{1+1}}px">Replace with interpolated style!</div>',
            compile: function (element, attr) {
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


        it('should replace element with template', angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest('<div><div replace>ignore</div><div>');
          expect(element.text()).toEqual('Replace!');
          expect(element.find('div').attr('compiled')).toEqual('COMPILED');
        }));


        it('should append element with template', angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest('<div><div append>ignore</div><div>');
          expect(element.text()).toEqual('Append!');
          expect(element.find('div').attr('compiled')).toEqual('COMPILED');
        }));


        it('should compile template when replacing', angular.mock.inject(function ($compile, $rootScope, log) {
          element = compileForTest('<div><div replace medium-log>ignore</div><div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('Replace!');
          expect(log).toEqual('LOG; HIGH; MEDIUM');
        }));


        it('should compile template when appending', angular.mock.inject(function ($compile, $rootScope, log) {
          element = compileForTest('<div><div append medium-log>ignore</div><div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('Append!');
          expect(log).toEqual('LOG; HIGH; MEDIUM');
        }));


        it('should merge attributes including style attr', angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest(
            '<div><div replace class="medium-log" style="height: 20px" ></div><div>');
          var div = element.find('div');
          expect(div.hasClass('medium-log')).toBe(true);
          expect(div.hasClass('log')).toBe(true);
          expect(div.css('width')).toBe('10px');
          expect(div.css('height')).toBe('20px');
          expect(div.attr('replace')).toEqual('');
          expect(div.attr('high-log')).toEqual('');
        }));

        it('should not merge attributes if they are the same', angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest(
            '<div><div nomerge class="medium-log" id="myid"></div><div>');
          var div = element.find('div');
          expect(div.hasClass('medium-log')).toBe(true);
          expect(div.hasClass('log')).toBe(true);
          expect(div.attr('id')).toEqual('myid');
        }));


        it('should correctly merge attributes that contain special characters', angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest(
            '<div><div replace (click)="doSomething()" [value]="someExpression" ω="omega"></div><div>');
          var div = element.find('div');
          expect(div.attr('(click)')).toEqual('doSomething()');
          expect(div.attr('[value]')).toEqual('someExpression');
          expect(div.attr('ω')).toEqual('omega');
        }));


        it('should not add white-space when merging an attribute that is "" in the replaced element',
          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest(
              '<div><div replace class=""></div><div>');
            var div = element.find('div');
            expect(div.hasClass('log')).toBe(true);
            expect(div.attr('class')).toBe('log');
          })
        );


        it('should not set merged attributes twice in $attrs', function () {
          var attrs;

          angular.mock.module(function () {
            directive('logAttrs', function () {
              return {
                link: function ($scope, $element, $attrs) {
                  attrs = $attrs;
                }
              };
            });
          });

          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest(
              '<div><div log-attrs replace class="myLog"></div><div>');
            var div = element.find('div');
            expect(div.attr('class')).toBe('myLog log');
            expect(attrs.class).toBe('myLog log');
          });
        });


        it('should prevent multiple templates per element', angular.mock.inject(function ($compile) {
          try {
            compileForTest('<div><span replace class="replace"></span></div>');
            this.fail(new Error('should have thrown Multiple directives error'));
          } catch (e) {
            expect(e.message).toMatch(/Multiple directives .* asking for template/);
          }
        }));

        it('should play nice with repeater when replacing', angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest(
            '<div>' +
            '<div ng-repeat="i in [1,2]" replace></div>' +
            '</div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('Replace!Replace!');
        }));


        it('should play nice with repeater when appending', angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest(
            '<div>' +
            '<div ng-repeat="i in [1,2]" append></div>' +
            '</div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('Append!Append!');
        }));


        it('should handle interpolated css class from replacing directive', angular.mock.inject(
          function ($compile, $rootScope) {
            element = compileForTest('<div replace-with-interpolated-class></div>');
            $rootScope.$digest();
            expect(element).toHaveClass('class_2');
          }));

        it('should handle interpolated css style from replacing directive', angular.mock.inject(
          function ($compile, $rootScope) {
            element = compileForTest('<div replace-with-interpolated-style></div>');
            $rootScope.$digest();
            expect(element.css('width')).toBe('2px');
          }
        ));

        it('should merge interpolated css class', angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest('<div class="one {{cls}} three" replace></div>');

          $rootScope.$apply(function () {
            $rootScope.cls = 'two';
          });

          expect(element).toHaveClass('one');
          expect(element).toHaveClass('two'); // interpolated
          expect(element).toHaveClass('three');
          expect(element).toHaveClass('log'); // merged from replace directive template
        }));


        it('should merge interpolated css class with ngRepeat',
          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest(
              '<div>' +
              '<div ng-repeat="i in [1]" class="one {{cls}} three" replace></div>' +
              '</div>');

            $rootScope.$apply(function () {
              $rootScope.cls = 'two';
            });

            var child = element.find('div').eq(0);
            expect(child).toHaveClass('one');
            expect(child).toHaveClass('two'); // interpolated
            expect(child).toHaveClass('three');
            expect(child).toHaveClass('log'); // merged from replace directive template
          }));

        it('should interpolate the values once per digest',
          angular.mock.inject(function ($compile, $rootScope, log) {
            element = compileForTest('<div>{{log("A")}} foo {{::log("B")}}</div>');
            $rootScope.log = log;
            $rootScope.$digest();
            expect(log).toEqual('A; B; A; B');
          }));

        it('should update references to replaced jQuery context', function () {
          angular.mock.module(function ($compileProvider) {
            $compileProvider.directive('foo', function () {
              return {
                replace: true,
                template: '<div></div>'
              };
            });
          });

          angular.mock.inject(function ($compile, $rootScope) {
            element = angular.element(document.createElement('span')).attr('foo', '');
            toDealoc.push(element);
            expect(ngInternals.nodeName_(element)).toBe('span');

            var preCompiledNode = element[0];

            var linked = compileForTest(element);
            expect(linked).toBe(element);
            expect(ngInternals.nodeName_(element)).toBe('div');
            if (element.context) {
              expect(element.context).toBe(element[0]);
            }
          });
        });

        describe('replace and not exactly one root element', function () {
          var templateVar;

          beforeEach(angular.mock.module(function () {
            directive('template', function () {
              return {
                replace: true,
                template: function () {
                  return templateVar;
                }
              };
            });
          }));

          test.each([
            ['no root element', 'dada'],
            ['multiple root elements', '<div></div><div></div>'],
          ])('should throw if: %s', function (_, directiveTemplate) {

            angular.mock.inject(function ($compile) {
              templateVar = directiveTemplate;
              expect(function () {
                compileForTest('<p template></p>');
              }).toThrowMinErr('$compile', 'tplrt',
                'Template for directive \'template\' must have exactly one root element.'
              );
            });
          });

          test.each([
            ['whitespace', '  <div>Hello World!</div> \n'],
            ['comments', '<!-- oh hi --><div>Hello World!</div> \n'],
            ['comments + whitespace', '  <!-- oh hi -->  <div>Hello World!</div>  <!-- oh hi -->\n']
          ])('should not throw if the root element is accompanied by: %s', function (_, directiveTemplate) {

            angular.mock.inject(function ($compile, $rootScope) {
              templateVar = directiveTemplate;
              var element;
              expect(function () {
                element = compileForTest('<p template></p>');
              }).not.toThrow();
              expect(element.length).toBe(1);
              expect(element.text()).toBe('Hello World!');
            });
          });
        });

        it('should support templates with root <tr> tags', angular.mock.inject(function ($compile, $rootScope) {
          expect(function () {
            element = compileForTest('<div replace-with-tr></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/tr/i);
        }));

        it('should support templates with root <td> tags', angular.mock.inject(function ($compile, $rootScope) {
          expect(function () {
            element = compileForTest('<div replace-with-td></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/td/i);
        }));

        it('should support templates with root <th> tags', angular.mock.inject(function ($compile, $rootScope) {
          expect(function () {
            element = compileForTest('<div replace-with-th></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/th/i);
        }));

        it('should support templates with root <thead> tags', angular.mock.inject(function ($compile, $rootScope) {
          expect(function () {
            element = compileForTest('<div replace-with-thead></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/thead/i);
        }));

        it('should support templates with root <tbody> tags', angular.mock.inject(function ($compile, $rootScope) {
          expect(function () {
            element = compileForTest('<div replace-with-tbody></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/tbody/i);
        }));

        it('should support templates with root <tfoot> tags', angular.mock.inject(function ($compile, $rootScope) {
          expect(function () {
            element = compileForTest('<div replace-with-tfoot></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/tfoot/i);
        }));

        it('should support templates with root <option> tags', angular.mock.inject(function ($compile, $rootScope) {
          expect(function () {
            element = compileForTest('<div replace-with-option></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/option/i);
        }));

        it('should support templates with root <optgroup> tags', angular.mock.inject(function ($compile, $rootScope) {
          expect(function () {
            element = compileForTest('<div replace-with-optgroup></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/optgroup/i);
        }));

        it('should support SVG templates using directive.templateNamespace=svg', function () {
          angular.mock.module(function () {
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
          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest('<svg><g svg-anchor="/foo/bar" text="foo/bar!"></g></svg>');
            var child = element.children().eq(0);
            $rootScope.$digest();
            expect(ngInternals.nodeName_(child)).toMatch(/a/i);
            expect(isSVGElement(child[0])).toBe(true);
            expect(child[0].getAttribute('xlink:href')).toBe('/foo/bar');
          });
        });

        if (supportsMathML()) {
          // MathML is only natively supported in Firefox at the time of this test's writing,
          // and even there, the browser does not export MathML element constructors globally.
          it('should support MathML templates using directive.templateNamespace=math', function () {
            angular.mock.module(function () {
              directive('pow', ngInternals.valueFn({
                replace: true,
                transclude: true,
                template: '<msup><mn>{{pow}}</mn></msup>',
                templateNamespace: 'MATH',
                scope: {
                  pow: '@pow'
                },
                link: function (scope, elm, attr, ctrl, transclude) {
                  transclude(function (node) {
                    elm.prepend(node[0]);
                  });
                }
              }));
            });
            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<math><mn pow="2"><mn>8</mn></mn></math>');
              $rootScope.$digest();
              var child = element.children().eq(0);
              expect(ngInternals.nodeName_(child)).toMatch(/msup/i);
              expect(isUnknownElement(child[0])).toBe(false);
              expect(isHTMLElement(child[0])).toBe(false);
            });
          });
        }

        it('should keep prototype properties on directive', function () {
          angular.mock.module(function () {
            function DirectiveClass() {
              this.restrict = 'E';
              this.template = '<p>{{value}}</p>';
            }

            DirectiveClass.prototype.compile = function () {
              return function (scope, element, attrs) {
                scope.value = 'Test Value';
              };
            };

            directive('templateUrlWithPrototype', ngInternals.valueFn(new DirectiveClass()));
          });

          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest('<template-url-with-prototype><template-url-with-prototype>');
            $rootScope.$digest();
            expect(element.find('p')[0].innerHTML).toEqual('Test Value');
          });
        });
      });


      describe('template as function', function () {

        beforeEach(angular.mock.module(function () {
          directive('myDirective', ngInternals.valueFn({
            replace: true,
            template: function ($element, $attrs) {
              expect($element.text()).toBe('original content');
              expect($attrs.myDirective).toBe('some value');
              return '<div id="templateContent">template content</div>';
            },
            compile: function ($element, $attrs) {
              expect($element.text()).toBe('template content');
              expect($attrs.id).toBe('templateContent');
            }
          }));
        }));


        it('should evaluate `template` when defined as fn and use returned string as template', angular.mock.inject(
          function ($compile, $rootScope) {
            element = compileForTest('<div my-directive="some value">original content<div>');
            expect(element.text()).toEqual('template content');
          }));
      });


      describe('templateUrl', function () {

        beforeEach(angular.mock.module(
          function () {
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
            directive('trustedTemplate', function ($sce) {
              return {
                restrict: 'CAM',
                templateUrl: function () {
                  return $sce.trustAsResourceUrl('http://example.com/trusted-template.html');
                }
              };
            });
            directive('cError', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'error.html',
              compile: function () {
                throw new Error('cError');
              }
            }));
            directive('lError', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'error.html',
              compile: function () {
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
              templateUrl: 'cau.html'
            }));

            directive('iCError', ngInternals.valueFn({
              restrict: 'CAM',
              replace: true,
              templateUrl: 'error.html',
              compile: function () {
                throw new Error('cError');
              }
            }));
            directive('iLError', ngInternals.valueFn({
              restrict: 'CAM',
              replace: true,
              templateUrl: 'error.html',
              compile: function () {
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

        it('should not load cross domain templates by default', angular.mock.inject(
          function ($compile, $rootScope) {
            expect(function () {
              compileForTest('<div class="crossDomainTemplate"></div>');
            }).toThrowMinErr('$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example.com/should-not-load.html');
          }
        ));

        it('should trust what is already in the template cache', angular.mock.inject(
          function ($compile, $httpBackend, $rootScope, $templateCache) {
            $httpBackend.expect('GET', 'http://example.com/should-not-load.html').respond('<span>example.com/remote-version</span>');
            $templateCache.put('http://example.com/should-not-load.html', '<span>example.com/cached-version</span>');
            element = compileForTest('<div class="crossDomainTemplate"></div>');
            expect(sortedHtml(element)).toEqual('<div class="crossDomainTemplate"></div>');
            $rootScope.$digest();
            expect(sortedHtml(element)).toEqual('<div class="crossDomainTemplate"><span>example.com/cached-version</span></div>');
          }
        ));

        it('should load cross domain templates when trusted', angular.mock.inject(
          function ($compile, $httpBackend, $rootScope, $sce) {
            $httpBackend.expect('GET', 'http://example.com/trusted-template.html').respond('<span>example.com/trusted_template_contents</span>');
            element = compileForTest('<div class="trustedTemplate"></div>');
            expect(sortedHtml(element)).toEqual('<div class="trustedTemplate"></div>');
            $httpBackend.flush();
            expect(sortedHtml(element)).toEqual('<div class="trustedTemplate"><span>example.com/trusted_template_contents</span></div>');
          }
        ));

        it('should append template via $http and cache it in $templateCache', angular.mock.inject(
          function ($compile, $httpBackend, $templateCache, $rootScope, $browser) {
            $httpBackend.expect('GET', 'hello.html').respond('<span>Hello!</span> World!');
            $templateCache.put('cau.html', '<span>Cau!</span>');
            element = compileForTest('<div><b class="hello">ignore</b><b class="cau">ignore</b></div>');
            expect(sortedHtml(element)).toEqual('<div><b class="hello"></b><b class="cau"></b></div>');

            $rootScope.$digest();


            expect(sortedHtml(element)).toEqual('<div><b class="hello"></b><b class="cau"><span>Cau!</span></b></div>');

            $httpBackend.flush();
            expect(sortedHtml(element)).toEqual(
              '<div>' +
              '<b class="hello"><span>Hello!</span> World!</b>' +
              '<b class="cau"><span>Cau!</span></b>' +
              '</div>');
          }
        ));


        it('should inline template via $http and cache it in $templateCache', angular.mock.inject(
          function ($compile, $httpBackend, $templateCache, $rootScope) {
            $httpBackend.expect('GET', 'hello.html').respond('<span>Hello!</span>');
            $templateCache.put('cau.html', '<span>Cau!</span>');
            element = compileForTest('<div><b class=i-hello>ignore</b><b class=i-cau>ignore</b></div>');
            expect(sortedHtml(element)).toEqual('<div><b class="i-hello"></b><b class="i-cau"></b></div>');

            $rootScope.$digest();


            expect(sortedHtml(element)).toBe('<div><b class="i-hello"></b><span class="i-cau">Cau!</span></div>');

            $httpBackend.flush();
            expect(sortedHtml(element)).toBe('<div><span class="i-hello">Hello!</span><span class="i-cau">Cau!</span></div>');
          }
        ));


        it('should compile, link and flush the template append', angular.mock.inject(
          function ($compile, $templateCache, $rootScope, $browser) {
            $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
            $rootScope.name = 'Elvis';
            element = compileForTest('<div><b class="hello"></b></div>');

            $rootScope.$digest();

            expect(sortedHtml(element)).toEqual('<div><b class="hello"><span>Hello, Elvis!</span></b></div>');
          }
        ));


        it('should compile, link and flush the template inline', angular.mock.inject(
          function ($compile, $templateCache, $rootScope) {
            $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
            $rootScope.name = 'Elvis';
            element = compileForTest('<div><b class=i-hello></b></div>');

            $rootScope.$digest();

            expect(sortedHtml(element)).toBe('<div><span class="i-hello">Hello, Elvis!</span></div>');
          }
        ));


        it('should compile, flush and link the template append', angular.mock.inject(
          function ($compile, $templateCache, $rootScope) {
            $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
            $rootScope.name = 'Elvis';
            element = compileForTest('<div><b class="hello"></b></div>');
            $rootScope.$digest();

            expect(sortedHtml(element)).toEqual('<div><b class="hello"><span>Hello, Elvis!</span></b></div>');
          }
        ));


        it('should compile, flush and link the template inline', angular.mock.inject(
          function ($compile, $templateCache, $rootScope) {
            $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
            $rootScope.name = 'Elvis';
            element = compileForTest('<div><b class=i-hello></b></div>');
            $rootScope.$digest();

            expect(sortedHtml(element)).toBe('<div><span class="i-hello">Hello, Elvis!</span></div>');
          }
        ));


        it('should compile template when replacing element in another template',
          angular.mock.inject(function ($compile, $templateCache, $rootScope) {
            $templateCache.put('hello.html', '<div replace></div>');
            $rootScope.name = 'Elvis';
            element = compileForTest('<div><b class="hello"></b></div>');

            $rootScope.$digest();

            expect(sortedHtml(element)).toEqual('<div><b class="hello"><span replace="">Hello, Elvis!</span></b></div>');
          }));


        it('should compile template when replacing root element',
          angular.mock.inject(function ($compile, $templateCache, $rootScope) {
            $rootScope.name = 'Elvis';
            element = compileForTest('<div replace></div>');

            $rootScope.$digest();

            expect(sortedHtml(element)).toEqual('<span replace="">Hello, Elvis!</span>');
          }));


        it('should resolve widgets after cloning in append mode', function () {
          angular.mock.module(function ($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject(function ($compile, $templateCache, $rootScope, $httpBackend, $browser,
                                        $exceptionHandler) {
            $httpBackend.expect('GET', 'hello.html').respond('<span>{{greeting}} </span>');
            $httpBackend.expect('GET', 'error.html').respond('<div></div>');
            $templateCache.put('cau.html', '<span>{{name}}</span>');
            $rootScope.greeting = 'Hello';
            $rootScope.name = 'Elvis';
            var template = generateTestCompiler(
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

        it('should resolve widgets after cloning in append mode without $templateCache', function () {
          angular.mock.module(function ($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject(function ($compile, $templateCache, $rootScope, $httpBackend, $browser,
                                        $exceptionHandler) {
            $httpBackend.expect('GET', 'cau.html').respond('<span>{{name}}</span>');
            $rootScope.name = 'Elvis';
            var template = generateTestCompiler('<div class="cau"></div>');
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

        it('should resolve widgets after cloning in inline mode', function () {
          angular.mock.module(function ($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject(function ($compile, $templateCache, $rootScope, $httpBackend, $browser,
                                        $exceptionHandler) {
            $httpBackend.expect('GET', 'hello.html').respond('<span>{{greeting}} </span>');
            $httpBackend.expect('GET', 'error.html').respond('<div></div>');
            $templateCache.put('cau.html', '<span>{{name}}</span>');
            $rootScope.greeting = 'Hello';
            $rootScope.name = 'Elvis';
            var template = generateTestCompiler(
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

        it('should resolve widgets after cloning in inline mode without $templateCache', function () {
          angular.mock.module(function ($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject(function ($compile, $templateCache, $rootScope, $httpBackend, $browser,
                                        $exceptionHandler) {
            $httpBackend.expect('GET', 'cau.html').respond('<span>{{name}}</span>');
            $rootScope.name = 'Elvis';
            var template = generateTestCompiler('<div class="i-cau"></div>');
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


        it('should be implicitly terminal and not compile placeholder content in append', angular.mock.inject(
          function ($compile, $templateCache, $rootScope, log) {
            // we can't compile the contents because that would result in a memory leak

            $templateCache.put('hello.html', 'Hello!');
            element = compileForTest('<div><b class="hello"><div log></div></b></div>');

            expect(log).toEqual('');
          }
        ));


        it('should be implicitly terminal and not compile placeholder content in inline', angular.mock.inject(
          function ($compile, $templateCache, $rootScope, log) {
            // we can't compile the contents because that would result in a memory leak

            $templateCache.put('hello.html', 'Hello!');
            element = compileForTest('<div><b class=i-hello><div log></div></b></div>');

            expect(log).toEqual('');
          }
        ));


        it('should throw an error and clear element content if the template fails to load',
          angular.mock.inject(function ($compile, $httpBackend, $rootScope) {
            $httpBackend.expect('GET', 'hello.html').respond(404, 'Not Found!');
            element = compileForTest('<div><b class="hello">content</b></div>');

            expect(function () {
              $httpBackend.flush();
            }).toThrowMinErr('$compile', 'tpload', 'Failed to load template: hello.html');
            expect(sortedHtml(element)).toBe('<div><b class="hello"></b></div>');
          })
        );


        it('should prevent multiple templates per element', function () {
          angular.mock.module(function () {
            directive('sync', ngInternals.valueFn({
              restrict: 'C',
              template: '<span></span>'
            }));
            directive('async', ngInternals.valueFn({
              restrict: 'C',
              templateUrl: 'template.html'
            }));
          });
          angular.mock.inject(function ($compile, $httpBackend) {
            $httpBackend.whenGET('template.html').respond('<p>template.html</p>');

            expect(function () {
              compileForTest('<div><div class="sync async"></div></div>');
              $httpBackend.flush();
            }).toThrowMinErr('$compile', 'multidir',
              'Multiple directives [async, sync] asking for template on: ' +
              '<div class="sync async">');
          });
        });


        it('should copy classes from pre-template node into linked element', function () {
          angular.mock.module(function () {
            directive('test', ngInternals.valueFn({
              templateUrl: 'test.html',
              replace: true
            }));
          });
          angular.mock.inject(function ($compile, $templateCache, $rootScope) {
            var child;
            $templateCache.put('test.html', '<p class="template-class">Hello</p>');
            element = generateTestCompiler('<div test></div>')($rootScope, function (node) {
              node.addClass('clonefn-class');
            });
            $rootScope.$digest();
            expect(element).toHaveClass('template-class');
            expect(element).toHaveClass('clonefn-class');
          });
        });


        describe('delay compile / linking functions until after template is resolved', function () {
          var template;
          beforeEach(angular.mock.module(function () {
            function logDirective(name, priority, options) {
              directive(name, function (log) {
                return (angular.extend({
                  priority: priority,
                  compile: function () {
                    log(name + '-C');
                    return {
                      pre: function () {
                        log(name + '-PreL');
                      },
                      post: function () {
                        log(name + '-PostL');
                      }
                    };
                  }
                }, options || {}));
              });
            }

            logDirective('first', 10);
            logDirective('second', 5, { templateUrl: 'second.html' });
            logDirective('third', 3);
            logDirective('last', 0);

            logDirective('iFirst', 10, { replace: true });
            logDirective('iSecond', 5, { replace: true, templateUrl: 'second.html' });
            logDirective('iThird', 3, { replace: true });
            logDirective('iLast', 0, { replace: true });
          }));

          it('should flush after link append', angular.mock.inject(
            function ($compile, $rootScope, $httpBackend, log) {
              $httpBackend.expect('GET', 'second.html').respond('<div third>{{1+2}}</div>');
              element = compileForTest('<div><span first second last></span></div>');
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


          it('should flush after link inline', angular.mock.inject(
            function ($compile, $rootScope, $httpBackend, log) {
              $httpBackend.expect('GET', 'second.html').respond('<div i-third>{{1+2}}</div>');
              element = compileForTest('<div><span i-first i-second i-last></span></div>');
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


          it('should flush before link append', angular.mock.inject(
            function ($compile, $rootScope, $httpBackend, log) {
              $httpBackend.expect('GET', 'second.html').respond('<div third>{{1+2}}</div>');
              template = generateTestCompiler('<div><span first second last></span></div>');
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


          it('should flush before link inline', angular.mock.inject(
            function ($compile, $rootScope, $httpBackend, log) {
              $httpBackend.expect('GET', 'second.html').respond('<div i-third>{{1+2}}</div>');
              template = generateTestCompiler('<div><span i-first i-second i-last></span></div>');
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


        it('should allow multiple elements in template', angular.mock.inject(function ($compile, $httpBackend) {
          $httpBackend.expect('GET', 'hello.html').respond('before <b>mid</b> after');
          element = angular.element('<div hello></div>');
          toDealoc.push(element);
          compileForTest(element);
          $httpBackend.flush();
          expect(element.text()).toEqual('before mid after');
        }));


        it('should work when directive is on the root element', angular.mock.inject(
          function ($compile, $httpBackend, $rootScope) {
            $httpBackend.expect('GET', 'hello.html').respond('<span>3==<span ng-transclude></span></span>');
            element = angular.element('<b class="hello">{{1+2}}</b>');
            toDealoc.push(element);
            compileForTest(element);

            $httpBackend.flush();
            expect(element.text()).toEqual('3==3');
          }
        ));


        describe('when directive is in a repeater', function () {
          var is;
          beforeEach(function () {
            is = [1, 2];
          });

          function runTest() {
            angular.mock.inject(function ($compile, $httpBackend, $rootScope) {
              $httpBackend.expect('GET', 'hello.html').respond('<span>i=<span ng-transclude></span>;</span>');
              element = angular.element('<div><b class=hello ng-repeat="i in [' + is + ']">{{i}}</b></div>');
              toDealoc.push(element);
              compileForTest(element);

              $httpBackend.flush();
              expect(element.text()).toEqual('i=' + is.join(';i=') + ';');
            });
          }

          it('should work in jqLite and jQuery with jQuery.cleanData last patched by Angular', runTest);

          it('should work with another library patching jqLite/jQuery.cleanData after Angular', function () {
            var cleanedCount = 0;
            var currentCleanData = angular.element.cleanData;
            angular.element.cleanData = function (elems) {
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

        describe('replace and not exactly one root element', function () {

          beforeEach(angular.mock.module(function () {

            directive('template', function () {
              return {
                replace: true,
                templateUrl: 'template.html'
              };
            });
          }));

          test.each([
            ['no root element', 'dada'],
            ['multiple root elements', '<div></div><div></div>']
          ])('should throw if: %s', function (_, directiveTemplate) {

            angular.mock.inject(function ($compile, $templateCache, $rootScope) {
              $templateCache.put('template.html', directiveTemplate);

              expect(function () {
                compileForTest('<p template></p>');
                $rootScope.$digest();
              }).toThrowMinErr('$compile', 'tplrt',
                'Template for directive \'template\' must have exactly one root element. ' +
                'template.html');
            });
          });

          test.each([
            ['whitespace', '  <div>Hello World!</div> \n'],
            ['comments', '<!-- oh hi --><div>Hello World!</div> \n'],
            ['comments + whitespace', '  <!-- oh hi -->  <div>Hello World!</div>  <!-- oh hi -->\n']
          ])('should not throw if the root element is accompanied by: %s', function (_, directiveTemplate) {

            angular.mock.inject(function ($compile, $templateCache, $rootScope) {
              $templateCache.put('template.html', directiveTemplate);
              element = compileForTest('<p template></p>');
              expect(function () {
                $rootScope.$digest();
              }).not.toThrow();
              expect(element.length).toBe(1);
              expect(element.text()).toBe('Hello World!');
            });
          });
        });

        it('should resume delayed compilation without duplicates when in a repeater', function () {
          // this is a test for a regression
          // scope creation, isolate watcher setup, controller instantiation, etc should happen
          // only once even if we are dealing with delayed compilation of a node due to templateUrl
          // and the template node is in a repeater

          var controllerSpy = jest.fn();

          angular.mock.module(function ($compileProvider) {
            $compileProvider.directive('delayed', ngInternals.valueFn({
              controller: controllerSpy,
              templateUrl: 'delayed.html',
              scope: {
                title: '@'
              }
            }));
          });

          angular.mock.inject(function ($templateCache, $compile, $rootScope) {
            $rootScope.coolTitle = 'boom!';
            $templateCache.put('delayed.html', '<div>{{title}}</div>');
            element = compileForTest(
              '<div><div ng-repeat="i in [1,2]"><div delayed title="{{coolTitle + i}}"></div>|</div></div>'
            );

            $rootScope.$apply();

            expect(controllerSpy).toHaveBeenCalledTimes(2);
            expect(element.text()).toBe('boom!1|boom!2|');
          });
        });


        it('should support templateUrl with replace', function () {
          // a regression https://github.com/angular/angular.js/issues/3792
          angular.mock.module(function ($compileProvider) {
            $compileProvider.directive('simple', function () {
              return {
                templateUrl: '/some.html',
                replace: true
              };
            });
          });

          angular.mock.inject(function ($templateCache, $rootScope, $compile) {
            $templateCache.put('/some.html',
              '<div ng-switch="i">' +
              '<div ng-switch-when="1">i = 1</div>' +
              '<div ng-switch-default>I dont know what `i` is.</div>' +
              '</div>');

            element = compileForTest('<div simple></div>');

            $rootScope.$apply(function () {
              $rootScope.i = 1;
            });

            expect(element.html()).toContain('i = 1');
          });
        });

        it('should support templates with root <tr> tags', angular.mock.inject(function ($compile, $rootScope, $templateCache) {
          $templateCache.put('tr.html', '<tr><td>TR</td></tr>');
          expect(function () {
            element = compileForTest('<div replace-with-tr></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/tr/i);
        }));

        it('should support templates with root <td> tags', angular.mock.inject(function ($compile, $rootScope, $templateCache) {
          $templateCache.put('td.html', '<td>TD</td>');
          expect(function () {
            element = compileForTest('<div replace-with-td></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/td/i);
        }));

        it('should support templates with root <th> tags', angular.mock.inject(function ($compile, $rootScope, $templateCache) {
          $templateCache.put('th.html', '<th>TH</th>');
          expect(function () {
            element = compileForTest('<div replace-with-th></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/th/i);
        }));

        it('should support templates with root <thead> tags', angular.mock.inject(function ($compile, $rootScope, $templateCache) {
          $templateCache.put('thead.html', '<thead><tr><td>TD</td></tr></thead>');
          expect(function () {
            element = compileForTest('<div replace-with-thead></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/thead/i);
        }));

        it('should support templates with root <tbody> tags', angular.mock.inject(function ($compile, $rootScope, $templateCache) {
          $templateCache.put('tbody.html', '<tbody><tr><td>TD</td></tr></tbody>');
          expect(function () {
            element = compileForTest('<div replace-with-tbody></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/tbody/i);
        }));

        it('should support templates with root <tfoot> tags', angular.mock.inject(function ($compile, $rootScope, $templateCache) {
          $templateCache.put('tfoot.html', '<tfoot><tr><td>TD</td></tr></tfoot>');
          expect(function () {
            element = compileForTest('<div replace-with-tfoot></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/tfoot/i);
        }));

        it('should support templates with root <option> tags', angular.mock.inject(function ($compile, $rootScope, $templateCache) {
          $templateCache.put('option.html', '<option>OPTION</option>');
          expect(function () {
            element = compileForTest('<div replace-with-option></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/option/i);
        }));

        it('should support templates with root <optgroup> tags', angular.mock.inject(function ($compile, $rootScope, $templateCache) {
          $templateCache.put('optgroup.html', '<optgroup>OPTGROUP</optgroup>');
          expect(function () {
            element = compileForTest('<div replace-with-optgroup></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/optgroup/i);
        }));

        it('should support SVG templates using directive.templateNamespace=svg', function () {
          angular.mock.module(function () {
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
          angular.mock.inject(function ($compile, $rootScope, $templateCache) {
            $templateCache.put('template.html', '<a xlink:href="{{linkurl}}">{{text}}</a>');
            element = compileForTest('<svg><g svg-anchor="/foo/bar" text="foo/bar!"></g></svg>');
            $rootScope.$digest();
            var child = element.children().eq(0);
            expect(ngInternals.nodeName_(child)).toMatch(/a/i);
            expect(isSVGElement(child[0])).toBe(true);
            expect(child[0].getAttribute('xlink:href')).toBe('/foo/bar');
          });
        });

        if (supportsMathML()) {
          // MathML is only natively supported in Firefox at the time of this test's writing,
          // and even there, the browser does not export MathML element constructors globally.
          it('should support MathML templates using directive.templateNamespace=math', function () {
            angular.mock.module(function () {
              directive('pow', ngInternals.valueFn({
                replace: true,
                transclude: true,
                templateUrl: 'template.html',
                templateNamespace: 'math',
                scope: {
                  pow: '@pow'
                },
                link: function (scope, elm, attr, ctrl, transclude) {
                  transclude(function (node) {
                    elm.prepend(node[0]);
                  });
                }
              }));
            });
            angular.mock.inject(function ($compile, $rootScope, $templateCache) {
              $templateCache.put('template.html', '<msup><mn>{{pow}}</mn></msup>');
              element = compileForTest('<math><mn pow="2"><mn>8</mn></mn></math>');
              $rootScope.$digest();
              var child = element.children().eq(0);
              expect(ngInternals.nodeName_(child)).toMatch(/msup/i);
              expect(isUnknownElement(child[0])).toBe(false);
              expect(isHTMLElement(child[0])).toBe(false);
            });
          });
        }

        it('should keep prototype properties on sync version of async directive', function () {
          angular.mock.module(function () {
            function DirectiveClass() {
              this.restrict = 'E';
              this.templateUrl = 'test.html';
            }

            DirectiveClass.prototype.compile = function () {
              return function (scope, element, attrs) {
                scope.value = 'Test Value';
              };
            };

            directive('templateUrlWithPrototype', ngInternals.valueFn(new DirectiveClass()));
          });

          angular.mock.inject(function ($compile, $rootScope, $httpBackend) {
            $httpBackend.whenGET('test.html').respond('<p>{{value}}</p>');
            element = compileForTest('<template-url-with-prototype><template-url-with-prototype>');
            $httpBackend.flush();
            $rootScope.$digest();
            expect(element.find('p')[0].innerHTML).toEqual('Test Value');
          });
        });

      });


      describe('templateUrl as function', function () {

        beforeEach(angular.mock.module(function () {
          directive('myDirective', ngInternals.valueFn({
            replace: true,
            templateUrl: function ($element, $attrs) {
              expect($element.text()).toBe('original content');
              expect($attrs.myDirective).toBe('some value');
              return 'my-directive.html';
            },
            compile: function ($element, $attrs) {
              expect($element.text()).toBe('template content');
              expect($attrs.id).toBe('templateContent');
            }
          }));
        }));


        it('should evaluate `templateUrl` when defined as fn and use returned value as url', angular.mock.inject(
          function ($compile, $rootScope, $templateCache) {
            $templateCache.put('my-directive.html', '<div id="templateContent">template content</span>');
            element = compileForTest('<div my-directive="some value">original content<div>');
            expect(element.text()).toEqual('');

            $rootScope.$digest();

            expect(element.text()).toEqual('template content');
          }));
      });


      describe('scope', function () {
        var iscope;

        beforeEach(angular.mock.module(function () {
          angular.forEach(['', 'a', 'b'], function (name) {
            directive('scope' + angular.uppercase(name), function (log) {
              return {
                scope: true,
                restrict: 'CA',
                compile: function () {
                  return {
                    pre: function (scope, element) {
                      log(scope.$id);
                      expect(element.data('$scope')).toBe(scope);
                    }
                  };
                }
              };
            });
            directive('iscope' + angular.uppercase(name), function (log) {
              return {
                scope: {},
                restrict: 'CA',
                compile: function () {
                  return function (scope, element) {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScopeNoTemplate')).toBe(scope);
                  };
                }
              };
            });
            directive('tscope' + angular.uppercase(name), function (log) {
              return {
                scope: true,
                restrict: 'CA',
                templateUrl: 'tscope.html',
                compile: function () {
                  return function (scope, element) {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  };
                }
              };
            });
            directive('stscope' + angular.uppercase(name), function (log) {
              return {
                scope: true,
                restrict: 'CA',
                template: '<span></span>',
                compile: function () {
                  return function (scope, element) {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  };
                }
              };
            });
            directive('trscope' + angular.uppercase(name), function (log) {
              return {
                scope: true,
                replace: true,
                restrict: 'CA',
                templateUrl: 'trscope.html',
                compile: function () {
                  return function (scope, element) {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  };
                }
              };
            });
            directive('tiscope' + angular.uppercase(name), function (log) {
              return {
                scope: {},
                restrict: 'CA',
                templateUrl: 'tiscope.html',
                compile: function () {
                  return function (scope, element) {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScope')).toBe(scope);
                  };
                }
              };
            });
            directive('stiscope' + angular.uppercase(name), function (log) {
              return {
                scope: {},
                restrict: 'CA',
                template: '<span></span>',
                compile: function () {
                  return function (scope, element) {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScope')).toBe(scope);
                  };
                }
              };
            });
          });
          directive('log', function (log) {
            return {
              restrict: 'CA',
              link: {
                pre: function (scope) {
                  log('log-' + scope.$id + '-' + (scope.$parent && scope.$parent.$id || 'no-parent'));
                }
              }
            };
          });
          directive('prototypeMethodNameAsScopeVarA', function () {
            return {
              scope: {
                'constructor': '=?',
                'valueOf': '='
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('prototypeMethodNameAsScopeVarB', function () {
            return {
              scope: {
                'constructor': '@?',
                'valueOf': '@'
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('prototypeMethodNameAsScopeVarC', function () {
            return {
              scope: {
                'constructor': '&?',
                'valueOf': '&'
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('prototypeMethodNameAsScopeVarD', function () {
            return {
              scope: {
                'constructor': '<?',
                'valueOf': '<'
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('watchAsScopeVar', function () {
            return {
              scope: {
                'watch': '='
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
        }));


        it('should allow creation of new scopes', angular.mock.inject(function ($rootScope, $compile, log) {
          element = compileForTest('<div><span scope><a log></a></span></div>');
          expect(log).toEqual('2; log-2-1; LOG');
          expect(element.find('span').hasClass('ng-scope')).toBe(true);
        }));


        it('should allow creation of new isolated scopes for directives', angular.mock.inject(
          function ($rootScope, $compile, log) {
            element = compileForTest('<div><span iscope><a log></a></span></div>');
            expect(log).toEqual('log-1-no-parent; LOG; 2');
            $rootScope.name = 'abc';
            expect(iscope.$parent).toBe;
            expect(iscope.name).toBeUndefined();
          }));


        it('should allow creation of new scopes for directives with templates', angular.mock.inject(
          function ($rootScope, $compile, log, $httpBackend) {
            $httpBackend.expect('GET', 'tscope.html').respond('<a log>{{name}}; scopeId: {{$id}}</a>');
            element = compileForTest('<div><span tscope></span></div>');
            $httpBackend.flush();
            expect(log).toEqual('log-2-1; LOG; 2');
            $rootScope.name = 'Jozo';
            $rootScope.$apply();
            expect(element.text()).toBe('Jozo; scopeId: 2');
            expect(element.find('span').scope().$id).toBe(2);
          }));


        it('should allow creation of new scopes for replace directives with templates', angular.mock.inject(
          function ($rootScope, $compile, log, $httpBackend) {
            $httpBackend.expect('GET', 'trscope.html').respond('<p><a log>{{name}}; scopeId: {{$id}}</a></p>');
            element = compileForTest('<div><span trscope></span></div>');
            $httpBackend.flush();
            expect(log).toEqual('log-2-1; LOG; 2');
            $rootScope.name = 'Jozo';
            $rootScope.$apply();
            expect(element.text()).toBe('Jozo; scopeId: 2');
            expect(element.find('a').scope().$id).toBe(2);
          }));


        it('should allow creation of new scopes for replace directives with templates in a repeater',
          angular.mock.inject(function ($rootScope, $compile, log, $httpBackend) {
            $httpBackend.expect('GET', 'trscope.html').respond('<p><a log>{{name}}; scopeId: {{$id}} |</a></p>');
            element = compileForTest('<div><span ng-repeat="i in [1,2,3]" trscope></span></div>');
            $httpBackend.flush();
            expect(log).toEqual('log-3-2; LOG; 3; log-5-4; LOG; 5; log-7-6; LOG; 7');
            $rootScope.name = 'Jozo';
            $rootScope.$apply();
            expect(element.text()).toBe('Jozo; scopeId: 3 |Jozo; scopeId: 5 |Jozo; scopeId: 7 |');
            expect(element.find('p').scope().$id).toBe(3);
            expect(element.find('a').scope().$id).toBe(3);
          }));


        it('should allow creation of new isolated scopes for directives with templates', angular.mock.inject(
          function ($rootScope, $compile, log, $httpBackend) {
            $httpBackend.expect('GET', 'tiscope.html').respond('<a log></a>');
            element = compileForTest('<div><span tiscope></span></div>');
            $httpBackend.flush();
            expect(log).toEqual('log-2-1; LOG; 2');
            $rootScope.name = 'abc';
            expect(iscope.$parent).toBe;
            expect(iscope.name).toBeUndefined();
          }));


        it('should correctly create the scope hierarchy', angular.mock.inject(
          function ($rootScope, $compile, log) {
            element = compileForTest(
              '<div>' + //1
              '<b class=scope>' + //2
              '<b class=scope><b class=log></b></b>' + //3
              '<b class=log></b>' +
              '</b>' +
              '<b class=scope>' + //4
              '<b class=log></b>' +
              '</b>' +
              '</div>'
            );
            expect(log).toEqual('2; 3; log-3-2; LOG; log-2-1; LOG; 4; log-4-1; LOG');
          })
        );


        it('should allow more than one new scope directives per element, but directives should share' +
          'the scope', angular.mock.inject(
          function ($rootScope, $compile, log) {
            element = compileForTest('<div class="scope-a; scope-b"></div>');
            expect(log).toEqual('2; 2');
          })
        );

        it('should not allow more than one isolate scope creation per element', angular.mock.inject(
          function ($rootScope, $compile) {
            expect(function () {
              compileForTest('<div class="iscope-a; scope-b"></div>');
            }).toThrowMinErr('$compile', 'multidir', 'Multiple directives [iscopeA, scopeB] asking for new/isolated scope on: ' +
              '<div class="iscope-a; scope-b">');
          })
        );

        it('should not allow more than one isolate/new scope creation per element regardless of `templateUrl`',
          angular.mock.inject(function ($httpBackend) {
            $httpBackend.expect('GET', 'tiscope.html').respond('<div>Hello, world !</div>');

            expect(function () {
              compile('<div class="tiscope-a; scope-b"></div>');
              $httpBackend.flush();
            }).toThrowMinErr('$compile', 'multidir',
              'Multiple directives [scopeB, tiscopeA] asking for new/isolated scope on: ' +
              '<div class="tiscope-a; scope-b ng-scope">');
          })
        );

        it('should not allow more than one isolate scope creation per element regardless of directive priority', function () {
          angular.mock.module(function ($compileProvider) {
            $compileProvider.directive('highPriorityScope', function () {
              return {
                restrict: 'C',
                priority: 1,
                scope: true,
                link: function () {
                }
              };
            });
          });
          angular.mock.inject(function ($compile) {
            expect(function () {
              compileForTest('<div class="iscope-a; high-priority-scope"></div>');
            }).toThrowMinErr('$compile', 'multidir', 'Multiple directives [highPriorityScope, iscopeA] asking for new/isolated scope on: ' +
              '<div class="iscope-a; high-priority-scope">');
          });
        });


        it('should create new scope even at the root of the template', angular.mock.inject(
          function ($rootScope, $compile, log) {
            element = compileForTest('<div scope-a></div>');
            expect(log).toEqual('2');
          })
        );


        it('should create isolate scope even at the root of the template', angular.mock.inject(
          function ($rootScope, $compile, log) {
            element = compileForTest('<div iscope></div>');
            expect(log).toEqual('2');
          })
        );


        describe('scope()/isolate() scope getters', function () {

          describe('with no directives', function () {

            it('should return the scope of the parent node', angular.mock.inject(
              function ($rootScope, $compile) {
                element = compileForTest('<div></div>');
                expect(element.scope()).toBe;
              })
            );
          });


          describe('with new scope directives', function () {

            it('should return the new scope at the directive element', angular.mock.inject(
              function ($rootScope, $compile) {
                element = compileForTest('<div scope></div>');
                expect(element.scope().$parent).toBe;
              })
            );


            it('should return the new scope for children in the original template', angular.mock.inject(
              function ($rootScope, $compile) {
                element = compileForTest('<div scope><a></a></div>');
                expect(element.find('a').scope().$parent).toBe;
              })
            );


            it('should return the new scope for children in the directive template', angular.mock.inject(
              function ($rootScope, $compile, $httpBackend) {
                $httpBackend.expect('GET', 'tscope.html').respond('<a></a>');
                element = compileForTest('<div tscope></div>');
                $httpBackend.flush();
                expect(element.find('a').scope().$parent).toBe;
              })
            );

            it('should return the new scope for children in the directive sync template', angular.mock.inject(
              function ($rootScope, $compile) {
                element = compileForTest('<div stscope></div>');
                expect(element.find('span').scope().$parent).toBe;
              })
            );
          });


          describe('with isolate scope directives', function () {

            it('should return the root scope for directives at the root element', angular.mock.inject(
              function ($rootScope, $compile) {
                element = compileForTest('<div iscope></div>');
                expect(element.scope()).toBe;
              })
            );


            it('should return the non-isolate scope at the directive element', angular.mock.inject(
              function ($rootScope, $compile) {
                var directiveElement;
                element = compileForTest('<div><div iscope></div></div>');
                directiveElement = element.children();
                expect(directiveElement.scope()).toBe;
                expect(directiveElement.isolateScope().$parent).toBe;
              })
            );


            it('should return the isolate scope for children in the original template', angular.mock.inject(
              function ($rootScope, $compile) {
                element = compileForTest('<div iscope><a></a></div>');
                expect(element.find('a').scope()).toBe; //xx
              })
            );


            it('should return the isolate scope for children in directive template', angular.mock.inject(
              function ($rootScope, $compile, $httpBackend) {
                $httpBackend.expect('GET', 'tiscope.html').respond('<a></a>');
                element = compileForTest('<div tiscope></div>');
                expect(element.isolateScope()).toBeUndefined(); // this is the current behavior, not desired feature
                $httpBackend.flush();
                expect(element.find('a').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe;
              })
            );

            it('should return the isolate scope for children in directive sync template', angular.mock.inject(
              function ($rootScope, $compile) {
                element = compileForTest('<div stiscope></div>');
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe;
              })
            );

            it('should handle "=" bindings with same method names in Object.prototype correctly when not present', angular.mock.inject(
              function ($rootScope, $compile) {
                var func = function () {
                  element = compileForTest(
                    '<div prototype-method-name-as-scope-var-a></div>'
                  );
                };

                expect(func).not.toThrow();
                var scope = element.isolateScope();
                expect(element.find('span').scope()).toBe(scope);
                expect(scope).not.toBe;

                // Not shadowed because optional
                expect(scope.constructor).toBe($rootScope.constructor);
                expect(scope.hasOwnProperty('constructor')).toBe(false);

                // Shadowed with undefined because not optional
                expect(scope.valueOf).toBeUndefined();
                expect(scope.hasOwnProperty('valueOf')).toBe(true);
              })
            );

            it('should handle "=" bindings with same method names in Object.prototype correctly when present', angular.mock.inject(
              function ($rootScope, $compile) {
                $rootScope.constructor = 'constructor';
                $rootScope.valueOf = 'valueOf';
                var func = function () {
                  element = compileForTest(
                    '<div prototype-method-name-as-scope-var-a constructor="constructor" value-of="valueOf"></div>'
                  );
                };

                expect(func).not.toThrow();
                var scope = element.isolateScope();
                expect(element.find('span').scope()).toBe(scope);
                expect(scope).not.toBe;
                expect(scope.constructor).toBe('constructor');
                expect(scope.hasOwnProperty('constructor')).toBe(true);
                expect(scope.valueOf).toBe('valueOf');
                expect(scope.hasOwnProperty('valueOf')).toBe(true);
              })
            );

            it('should throw an error for undefined non-optional "=" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              window.disableCacheLeakCheck = true;
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });

              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
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

            it('should not throw an error for set non-optional "=" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-a constructor="constructor" value-of="valueOf"></div>'
                    );
                  };
                  expect(func).not.toThrow();
                });
            });

            it('should not throw an error for undefined optional "=" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-a value-of="valueOf"></div>'
                    );
                  };
                  expect(func).not.toThrow();
                });
            });

            it('should handle "@" bindings with same method names in Object.prototype correctly when not present', angular.mock.inject(
              function ($rootScope, $compile) {
                var func = function () {
                  element = compileForTest('<div prototype-method-name-as-scope-var-b></div>');
                };

                expect(func).not.toThrow();
                var scope = element.isolateScope();
                expect(element.find('span').scope()).toBe(scope);
                expect(scope).not.toBe;

                // Does not shadow value because optional
                expect(scope.constructor).toBe($rootScope.constructor);
                expect(scope.hasOwnProperty('constructor')).toBe(false);

                // Shadows value because not optional
                expect(scope.valueOf).toBeUndefined();
                expect(scope.hasOwnProperty('valueOf')).toBe(true);
              })
            );

            it('should handle "@" bindings with same method names in Object.prototype correctly when present', angular.mock.inject(
              function ($rootScope, $compile) {
                var func = function () {
                  element = compileForTest(
                    '<div prototype-method-name-as-scope-var-b constructor="constructor" value-of="valueOf"></div>'
                  );
                };

                expect(func).not.toThrow();
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe;
                expect(element.isolateScope()['constructor']).toBe('constructor');
                expect(element.isolateScope()['valueOf']).toBe('valueOf');
              })
            );

            it('should throw an error for undefined non-optional "@" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
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

            it('should not throw an error for set non-optional "@" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-b constructor="constructor" value-of="valueOf"></div>'
                    );
                  };
                  expect(func).not.toThrow();
                });
            });

            it('should not throw an error for undefined optional "@" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-b value-of="valueOf"></div>'
                    );
                  };
                  expect(func).not.toThrow();
                });
            });

            it('should handle "&" bindings with same method names in Object.prototype correctly when not present', angular.mock.inject(
              function ($rootScope, $compile) {
                var func = function () {
                  element = compileForTest('<div prototype-method-name-as-scope-var-c></div>');
                };

                expect(func).not.toThrow();
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe;
                expect(element.isolateScope()['constructor']).toBe($rootScope.constructor);
                expect(element.isolateScope()['valueOf']()).toBeUndefined();
              })
            );

            it('should handle "&" bindings with same method names in Object.prototype correctly when present', angular.mock.inject(
              function ($rootScope, $compile) {
                $rootScope.constructor = function () {
                  return 'constructor';
                };
                $rootScope.valueOf = function () {
                  return 'valueOf';
                };
                var func = function () {
                  element = compileForTest(
                    '<div prototype-method-name-as-scope-var-c constructor="constructor()" value-of="valueOf()"></div>'
                  );
                };

                expect(func).not.toThrow();
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe;
                expect(element.isolateScope()['constructor']()).toBe('constructor');
                expect(element.isolateScope()['valueOf']()).toBe('valueOf');
              })
            );

            it('should throw an error for undefined non-optional "&" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
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

            it('should not throw an error for set non-optional "&" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-c constructor="constructor" value-of="valueOf"></div>'
                    );
                  };
                  expect(func).not.toThrow();
                });
            });

            it('should not throw an error for undefined optional "&" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-c value-of="valueOf"></div>'
                    );
                  };
                  expect(func).not.toThrow();
                });
            });

            it('should throw an error for undefined non-optional "<" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
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

            it('should not throw an error for set non-optional "<" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-d constructor="constructor" value-of="valueOf"></div>'
                    );
                  };
                  expect(func).not.toThrow();
                });
            });

            it('should not throw an error for undefined optional "<" bindings when ' +
              'strictComponentBindingsEnabled is true', function () {
              angular.mock.module(function ($compileProvider) {
                $compileProvider.strictComponentBindingsEnabled(true);
              });
              angular.mock.inject(
                function ($rootScope, $compile) {
                  var func = function () {
                    element = compileForTest(
                      '<div prototype-method-name-as-scope-var-d value-of="valueOf"></div>'
                    );
                  };
                  expect(func).not.toThrow();
                });
            });

            it('should not throw exception when using "watch" as binding in Firefox', angular.mock.inject(
              function ($rootScope, $compile) {
                $rootScope.watch = 'watch';
                var func = function () {
                  element = compileForTest(
                    '<div watch-as-scope-var watch="watch"></div>'
                  );
                };

                expect(func).not.toThrow();
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe;
                expect(element.isolateScope()['watch']).toBe('watch');
              })
            );

            it('should handle @ bindings on BOOLEAN attributes', function () {
              var checkedVal;
              angular.mock.module(function ($compileProvider) {
                $compileProvider.directive('test', function () {
                  return {
                    scope: { checked: '@' },
                    link: function (scope, element, attrs) {
                      checkedVal = scope.checked;
                    }
                  };
                });
              });
              angular.mock.inject(function ($compile, $rootScope) {
                compileForTest('<input test checked="checked">');
                expect(checkedVal).toEqual(true);
              });
            });

            it('should handle updates to @ bindings on BOOLEAN attributes', function () {
              var componentScope;
              angular.mock.module(function ($compileProvider) {
                $compileProvider.directive('test', function () {
                  return {
                    scope: { checked: '@' },
                    link: function (scope, element, attrs) {
                      componentScope = scope;
                      attrs.$set('checked', true);
                    }
                  };
                });
              });
              angular.mock.inject(function ($compile, $rootScope) {
                compileForTest('<test></test>');
                expect(componentScope.checked).toBe(true);
              });
            });
          });


          describe('with isolate scope directives and directives that manually create a new scope', function () {

            it('should return the new scope at the directive element', angular.mock.inject(
              function ($rootScope, $compile) {
                var directiveElement;
                element = compileForTest('<div><a ng-if="true" iscope></a></div>');
                $rootScope.$apply();
                directiveElement = element.find('a');
                expect(directiveElement.scope().$parent).toBe;
                expect(directiveElement.scope()).not.toBe(directiveElement.isolateScope());
              })
            );


            it('should return the isolate scope for child elements', angular.mock.inject(
              function ($rootScope, $compile, $httpBackend) {
                var directiveElement, child;
                $httpBackend.expect('GET', 'tiscope.html').respond('<span></span>');
                element = compileForTest('<div><a ng-if="true" tiscope></a></div>');
                $rootScope.$apply();
                $httpBackend.flush();
                directiveElement = element.find('a');
                child = directiveElement.find('span');
                expect(child.scope()).toBe(directiveElement.isolateScope());
              })
            );

            it('should return the isolate scope for child elements in directive sync template', angular.mock.inject(
              function ($rootScope, $compile) {
                var directiveElement, child;
                element = compileForTest('<div><a ng-if="true" stiscope></a></div>');
                $rootScope.$apply();
                directiveElement = element.find('a');
                child = directiveElement.find('span');
                expect(child.scope()).toBe(directiveElement.isolateScope());
              })
            );
          });
        });

        describe('multidir isolated scope error messages', function () {
          angular.module('fakeIsoledScopeModule', [])
            .directive('fakeScope', function (log) {
              return {
                scope: true,
                restrict: 'CA',
                compile: function () {
                  return {
                    pre: function (scope, element) {
                      log(scope.$id);
                      expect(element.data('$scope')).toBe(scope);
                    }
                  };
                }
              };
            })
            .directive('fakeIScope', function (log) {
              return {
                scope: {},
                restrict: 'CA',
                compile: function () {
                  return function (scope, element) {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScopeNoTemplate')).toBe(scope);
                  };
                }
              };
            });

          beforeEach(angular.mock.module('fakeIsoledScopeModule', function () {
            directive('anonymModuleScopeDirective', function (log) {
              return {
                scope: true,
                restrict: 'CA',
                compile: function () {
                  return {
                    pre: function (scope, element) {
                      log(scope.$id);
                      expect(element.data('$scope')).toBe(scope);
                    }
                  };
                }
              };
            });
          }));

          it('should add module name to multidir isolated scope message if directive defined through module', angular.mock.inject(
            function ($rootScope, $compile) {
              expect(function () {
                compileForTest('<div class="fake-scope; fake-i-scope"></div>');
              }).toThrowMinErr('$compile', 'multidir',
                'Multiple directives [fakeIScope (module: fakeIsoledScopeModule), fakeScope (module: fakeIsoledScopeModule)] ' +
                'asking for new/isolated scope on: <div class="fake-scope; fake-i-scope">');
            })
          );

          it('shouldn\'t add module name to multidir isolated scope message if directive is defined directly with $compileProvider', angular.mock.inject(
            function ($rootScope, $compile) {
              expect(function () {
                compileForTest('<div class="anonym-module-scope-directive; fake-i-scope"></div>');
              }).toThrowMinErr('$compile', 'multidir',
                'Multiple directives [anonymModuleScopeDirective, fakeIScope (module: fakeIsoledScopeModule)] ' +
                'asking for new/isolated scope on: <div class="anonym-module-scope-directive; fake-i-scope">');
            })
          );
        });
      });
    });
  });


  describe('interpolation', function () {
    var observeSpy, directiveAttrs, deregisterObserver;

    beforeEach(angular.mock.module(function () {
      directive('observer', function () {
        return function (scope, elm, attr) {
          directiveAttrs = attr;
          observeSpy = jest.fn();
          deregisterObserver = attr.$observe('someAttr', observeSpy);
        };
      });
      directive('replaceSomeAttr', ngInternals.valueFn({
        compile: function (element, attr) {
          attr.$set('someAttr', 'bar-{{1+1}}');
          expect(element).toBe(attr.$$element);
        }
      }));
    }));


    it('should compile and link both attribute and text bindings', angular.mock.inject(
      function ($rootScope, $compile) {
        $rootScope.name = 'angular';
        element = compileForTest('<div name="attr: {{name}}">text: {{name}}</div>');
        $rootScope.$digest();
        expect(element.text()).toEqual('text: angular');
        expect(element.attr('name')).toEqual('attr: angular');
      })
    );


    it('should one-time bind if the expression starts with two colons', angular.mock.inject(
      function ($rootScope, $compile) {
        $rootScope.name = 'angular';
        element = compileForTest('<div name="attr: {{::name}}">text: {{::name}}</div>');
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

    it('should one-time bind if the expression starts with a space and two colons', angular.mock.inject(
      function ($rootScope, $compile) {
        $rootScope.name = 'angular';
        element = compileForTest('<div name="attr: {{::name}}">text: {{ ::name }}</div>');
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


    it('should process attribute interpolation in pre-linking phase at priority 100', function () {
      angular.mock.module(function () {
        directive('attrLog', function (log) {
          return {
            compile: function ($element, $attrs) {
              log('compile=' + $attrs.myName);

              return {
                pre: function ($scope, $element, $attrs) {
                  log('preLinkP0=' + $attrs.myName);
                },
                post: function ($scope, $element, $attrs) {
                  log('postLink=' + $attrs.myName);
                }
              };
            }
          };
        });
      });
      angular.mock.module(function () {
        directive('attrLogHighPriority', function (log) {
          return {
            priority: 101,
            compile: function () {
              return {
                pre: function ($scope, $element, $attrs) {
                  log('preLinkP101=' + $attrs.myName);
                }
              };
            }
          };
        });
      });
      angular.mock.inject(function ($rootScope, $compile, log) {
        element = compileForTest('<div attr-log-high-priority attr-log my-name="{{name}}"></div>');
        $rootScope.name = 'angular';
        $rootScope.$apply();
        log('digest=' + element.attr('my-name'));
        expect(log).toEqual('compile={{name}}; preLinkP101={{name}}; preLinkP0=; postLink=; digest=angular');
      });
    });

    it('should allow the attribute to be removed before the attribute interpolation', function () {
      angular.mock.module(function () {
        directive('removeAttr', function () {
          return {
            restrict: 'A',
            compile: function (tElement, tAttr) {
              tAttr.$set('removeAttr', null);
            }
          };
        });
      });
      angular.mock.inject(function ($rootScope, $compile) {
        expect(function () {
          element = compileForTest('<div remove-attr="{{ toBeRemoved }}"></div>');
        }).not.toThrow();
        expect(element.attr('remove-attr')).toBeUndefined();
      });
    });

    describe('SCE values', function () {
      it('should resolve compile and link both attribute and text bindings', angular.mock.inject(
        function ($rootScope, $compile, $sce) {
          $rootScope.name = $sce.trustAsHtml('angular');
          element = compileForTest('<div name="attr: {{name}}">text: {{name}}</div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('text: angular');
          expect(element.attr('name')).toEqual('attr: angular');
        }));
    });

    describe('decorating with binding info', function () {

      it('should not occur if `debugInfoEnabled` is false', function () {
        angular.mock.module(function ($compileProvider) {
          $compileProvider.debugInfoEnabled(false);
        });

        angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest('<div>{{1+2}}</div>');
          expect(element.hasClass('ng-binding')).toBe(false);
          expect(element.data('$binding')).toBeUndefined();
        });
      });


      it('should occur if `debugInfoEnabled` is true', function () {
        angular.mock.module(function ($compileProvider) {
          $compileProvider.debugInfoEnabled(true);
        });

        angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest('<div>{{1+2}}</div>');
          expect(element.hasClass('ng-binding')).toBe(true);
          expect(element.data('$binding')).toEqual(['1+2']);
        });
      });
    });

    it('should observe interpolated attrs', angular.mock.inject(function ($rootScope, $compile) {
      compileForTest('<div some-attr="{{value}}" observer></div>');

      // should be async
      expect(observeSpy).not.toHaveBeenCalled();

      $rootScope.$apply(function () {
        $rootScope.value = 'bound-value';
      });
      expect(observeSpy).toHaveBeenCalledOnceWith('bound-value');
    }));


    it('should return a deregistration function while observing an attribute', angular.mock.inject(function ($rootScope, $compile) {
      compileForTest('<div some-attr="{{value}}" observer></div>');

      $rootScope.$apply('value = "first-value"');
      expect(observeSpy).toHaveBeenCalledWith('first-value');

      deregisterObserver();
      $rootScope.$apply('value = "new-value"');
      expect(observeSpy).not.toHaveBeenCalledWith('new-value');
    }));


    it('should set interpolated attrs to initial interpolation value', angular.mock.inject(function ($rootScope, $compile) {
      // we need the interpolated attributes to be initialized so that linking fn in a component
      // can access the value during link
      $rootScope.whatever = 'test value';
      compileForTest('<div some-attr="{{whatever}}" observer></div>');
      expect(directiveAttrs.someAttr).toBe($rootScope.whatever);
    }));


    it('should allow directive to replace interpolated attributes before attr interpolation compilation', angular.mock.inject(
      function ($compile, $rootScope) {
        element = compileForTest('<div some-attr="foo-{{1+1}}" replace-some-attr></div>');
        $rootScope.$digest();
        expect(element.attr('some-attr')).toEqual('bar-2');
      }));


    it('should call observer of non-interpolated attr through $evalAsync',
      angular.mock.inject(function ($rootScope, $compile) {
        compileForTest('<div some-attr="nonBound" observer></div>');
        expect(directiveAttrs.someAttr).toBe('nonBound');

        expect(observeSpy).not.toHaveBeenCalled();
        $rootScope.$digest();
        expect(observeSpy).toHaveBeenCalled();
      })
    );


    it('should call observer only when the attribute value changes', function () {
      angular.mock.module(function () {
        directive('observingDirective', function () {
          return {
            restrict: 'E',
            scope: { someAttr: '@' }
          };
        });
      });
      angular.mock.inject(function ($rootScope, $compile) {
        compileForTest('<observing-directive observer></observing-directive>');
        $rootScope.$digest();
        expect(observeSpy).not.toHaveBeenCalledWith(undefined);
      });
    });


    it('should delegate exceptions to $exceptionHandler', function () {
      observeSpy = jest.fn().mockImplementation(() => {
        throw new Error('ERROR')
      });
      angular.mock.module(function ($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
        directive('error', function () {
          return function (scope, elm, attr) {
            attr.$observe('someAttr', observeSpy);
            attr.$observe('someAttr', observeSpy);
          };
        });
      });

      angular.mock.inject(function ($compile, $rootScope, $exceptionHandler) {
        compileForTest('<div some-attr="{{value}}" error></div>');
        $rootScope.$digest();

        expect(observeSpy).toHaveBeenCalled();
        expect(observeSpy).toHaveBeenCalledTimes(2);
        expect($exceptionHandler.errors).toEqual([new Error('ERROR'), new Error('ERROR')]);
      });
    });


    it('should translate {{}} in terminal nodes', angular.mock.inject(function ($rootScope, $compile) {
      element = compileForTest('<select ng:model="x"><option value="">Greet {{name}}!</option></select>');
      $rootScope.$digest();
      expect(sortedHtml(element).replace(' selected="selected"', '')).toEqual('<select ng:model="x">' +
        '<option value="">Greet !</option>' +
        '</select>');
      $rootScope.name = 'Misko';
      $rootScope.$digest();
      expect(sortedHtml(element).replace(' selected="selected"', '')).toEqual('<select ng:model="x">' +
        '<option value="">Greet Misko!</option>' +
        '</select>');
    }));


    it('should handle consecutive text elements as a single text element', angular.mock.inject(function ($rootScope, $compile) {
      // No point it running the test, if there is no MutationObserver
      if (!window.MutationObserver) return;

      // Create and register the MutationObserver
      var observer = new window.MutationObserver(angular.noop);
      observer.observe(document.body, { childList: true, subtree: true });

      // Run the actual test
      var base = angular.element('<div>&mdash; {{ "This doesn\'t." }}</div>');
      element = compileForTest(base);
      $rootScope.$digest();
      expect(element.text()).toBe('— This doesn\'t.');

      // Unregister the MutationObserver (and hope it doesn't mess up with subsequent tests)
      observer.disconnect();
    }));


    it('should not process text nodes merged into their sibling', angular.mock.inject(function ($compile, $rootScope) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode('1{{ value }}'));
      div.appendChild(document.createTextNode('2{{ value }}'));
      div.appendChild(document.createTextNode('3{{ value }}'));

      element = angular.element(div.childNodes);
      toDealoc.push(element);

      var initialWatcherCount = $rootScope.$countWatchers();
      compileForTest(element);
      $rootScope.$apply('value = 0');
      var newWatcherCount = $rootScope.$countWatchers() - initialWatcherCount;

      expect(element.text()).toBe('102030');
      expect(newWatcherCount).toBe(3);

      dealoc(div);
    }));


    it('should support custom start/end interpolation symbols in template and directive template',
      function () {
        angular.mock.module(function ($interpolateProvider, $compileProvider) {
          $interpolateProvider.startSymbol('##').endSymbol(']]');
          $compileProvider.directive('myDirective', function () {
            return {
              template: '<span>{{hello}}|{{hello|uppercase}}</span>'
            };
          });
        });

        angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest('<div>##hello|uppercase]]|<div my-directive></div></div>');
          $rootScope.hello = 'ahoj';
          $rootScope.$digest();
          expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
        });
      });


    it('should support custom start interpolation symbol, even when `endSymbol` doesn\'t change',
      function () {
        angular.mock.module(function ($compileProvider, $interpolateProvider) {
          $interpolateProvider.startSymbol('[[');
          $compileProvider.directive('myDirective', function () {
            return {
              template: '<span>{{ hello }}|{{ hello | uppercase }}</span>'
            };
          });
        });

        angular.mock.inject(function ($compile, $rootScope) {
          var tmpl = '<div>[[ hello | uppercase }}|<div my-directive></div></div>';
          element = compileForTest(tmpl);

          $rootScope.hello = 'ahoj';
          $rootScope.$digest();

          expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
        });
      }
    );


    it('should support custom end interpolation symbol, even when `startSymbol` doesn\'t change',
      function () {
        angular.mock.module(function ($compileProvider, $interpolateProvider) {
          $interpolateProvider.endSymbol(']]');
          $compileProvider.directive('myDirective', function () {
            return {
              template: '<span>{{ hello }}|{{ hello | uppercase }}</span>'
            };
          });
        });

        angular.mock.inject(function ($compile, $rootScope) {
          var tmpl = '<div>{{ hello | uppercase ]]|<div my-directive></div></div>';
          element = compileForTest(tmpl);

          $rootScope.hello = 'ahoj';
          $rootScope.$digest();

          expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
        });
      }
    );


    it('should support custom start/end interpolation symbols in async directive template',
      function () {
        angular.mock.module(function ($interpolateProvider, $compileProvider) {
          $interpolateProvider.startSymbol('##').endSymbol(']]');
          $compileProvider.directive('myDirective', function () {
            return {
              templateUrl: 'myDirective.html'
            };
          });
        });

        angular.mock.inject(function ($compile, $rootScope, $templateCache) {
          $templateCache.put('myDirective.html', '<span>{{hello}}|{{hello|uppercase}}</span>');
          element = compileForTest('<div>##hello|uppercase]]|<div my-directive></div></div>');
          $rootScope.hello = 'ahoj';
          $rootScope.$digest();
          expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
        });
      });


    it('should make attributes observable for terminal directives', function () {
      angular.mock.module(function () {
        directive('myAttr', function (log) {
          return {
            terminal: true,
            link: function (scope, element, attrs) {
              attrs.$observe('myAttr', function (val) {
                log(val);
              });
            }
          };
        });
      });

      angular.mock.inject(function ($compile, $rootScope, log) {
        element = compileForTest('<div my-attr="{{myVal}}"></div>');
        expect(log).toEqual([]);

        $rootScope.myVal = 'carrot';
        $rootScope.$digest();

        expect(log).toEqual(['carrot']);
      });
    });
  });

  describe('collector', function () {

    var collected;
    beforeEach(angular.mock.module(function ($compileProvider) {
      collected = false;
      $compileProvider.directive('testCollect', function () {
        return {
          restrict: 'EACM',
          link: function () {
            collected = true;
          }
        };
      });
    }));

    it('should collect comment directives by default', angular.mock.inject(function () {
      var html = '<!-- directive: test-collect -->';
      element = compileForTest('<div>' + html + '</div>');
      expect(collected).toBe(true);
    }));

    it('should collect css class directives by default', angular.mock.inject(function () {
      element = compileForTest('<div class="test-collect"></div>');
      expect(collected).toBe(true);
    }));

    angular.forEach([
      { commentEnabled: true, cssEnabled: true },
      { commentEnabled: true, cssEnabled: false },
      { commentEnabled: false, cssEnabled: true },
      { commentEnabled: false, cssEnabled: false }
    ], function (config) {
      describe('commentDirectivesEnabled(' + config.commentEnabled + ') ' +
        'cssClassDirectivesEnabled(' + config.cssEnabled + ')', function () {

        beforeEach(angular.mock.module(function ($compileProvider) {
          $compileProvider.commentDirectivesEnabled(config.commentEnabled);
          $compileProvider.cssClassDirectivesEnabled(config.cssEnabled);
        }));

        var $compile, $rootScope;
        beforeEach(angular.mock.inject(function (_$compile_, _$rootScope_) {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
        }));

        it('should handle comment directives appropriately', function () {
          var html = '<!-- directive: test-collect -->';
          element = compileForTest('<div>' + html + '</div>');
          expect(collected).toBe(config.commentEnabled);
        });

        it('should handle css directives appropriately', function () {
          element = compileForTest('<div class="test-collect"></div>');
          expect(collected).toBe(config.cssEnabled);
        });

        it('should not prevent to compile entity directives', function () {
          element = compileForTest('<test-collect></test-collect>');
          expect(collected).toBe(true);
        });

        it('should not prevent to compile attribute directives', function () {
          element = compileForTest('<span test-collect></span>');
          expect(collected).toBe(true);
        });

        it('should not prevent to compile interpolated expressions', function () {
          element = compileForTest('<span>{{"text "+"interpolated"}}</span>');
          $rootScope.$apply();
          expect(element.text()).toBe('text interpolated');
        });

        it('should interpolate expressions inside class attribute', function () {
          $rootScope.interpolateMe = 'interpolated';
          var html = '<div class="{{interpolateMe}}"></div>';
          element = compileForTest(html);
          $rootScope.$apply();
          expect(element).toHaveClass('interpolated');
        });
      });
    });

    it('should configure comment directives true by default',
      angular.mock.module(function ($compileProvider) {
        var commentDirectivesEnabled = $compileProvider.commentDirectivesEnabled();
        expect(commentDirectivesEnabled).toBe(true);
      })
    );

    it('should return self when setting commentDirectivesEnabled',
      angular.mock.module(function ($compileProvider) {
        var self = $compileProvider.commentDirectivesEnabled(true);
        expect(self).toBe($compileProvider);
      })
    );

    it('should cache commentDirectivesEnabled value when configure ends', function () {
      var $compileProvider;
      angular.mock.module(function (_$compileProvider_) {
        $compileProvider = _$compileProvider_;
        $compileProvider.commentDirectivesEnabled(false);
      });

      angular.mock.inject(function ($compile, $rootScope) {
        $compileProvider.commentDirectivesEnabled(true);
        var html = '<!-- directive: test-collect -->';
        element = compileForTest('<div>' + html + '</div>');
        expect(collected).toBe(false);
      });
    });

    it('should configure css class directives true by default',
      angular.mock.module(function ($compileProvider) {
        var cssClassDirectivesEnabled = $compileProvider.cssClassDirectivesEnabled();
        expect(cssClassDirectivesEnabled).toBe(true);
      })
    );

    it('should return self when setting cssClassDirectivesEnabled',
      angular.mock.module(function ($compileProvider) {
        var self = $compileProvider.cssClassDirectivesEnabled(true);
        expect(self).toBe($compileProvider);
      })
    );

    it('should cache cssClassDirectivesEnabled value when configure ends', function () {
      var $compileProvider;
      angular.mock.module(function (_$compileProvider_) {
        $compileProvider = _$compileProvider_;
        $compileProvider.cssClassDirectivesEnabled(false);
      });

      angular.mock.inject(function ($compile, $rootScope) {
        $compileProvider.cssClassDirectivesEnabled(true);
        element = compileForTest('<div class="test-collect"></div>');
        expect(collected).toBe(false);
      });
    });
  });

  describe('link phase', function () {

    beforeEach(angular.mock.module(function () {

      angular.forEach(['a', 'b', 'c'], function (name) {
        directive(name, function (log) {
          return {
            restrict: 'ECA',
            compile: function () {
              log('t' + angular.uppercase(name));
              return {
                pre: function () {
                  log('pre' + angular.uppercase(name));
                },
                post: function linkFn() {
                  log('post' + angular.uppercase(name));
                }
              };
            }
          };
        });
      });
    }));


    it('should not store linkingFns for noop branches', angular.mock.inject(function ($rootScope, $compile) {
      element = angular.element('<div name="{{a}}"><span>ignore</span></div>');
      toDealoc.push(element);
      var linkingFn = compileForTest(element);
      // Now prune the branches with no directives
      element.find('span').remove();
      expect(element.find('span').length).toBe(0);
      // and we should still be able to compile without errors
      linkingFn;
    }));


    it('should compile from top to bottom but link from bottom up', angular.mock.inject(
      function ($compile, $rootScope, log) {
        element = compileForTest('<a b><c></c></a>');
        expect(log).toEqual('tA; tB; tC; preA; preB; preC; postC; postB; postA');
      }
    ));


    it('should support link function on directive object', function () {
      angular.mock.module(function () {
        directive('abc', ngInternals.valueFn({
          link: function (scope, element, attrs) {
            element.text(attrs.abc);
          }
        }));
      });
      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest('<div abc="WORKS">FAIL</div>');
        expect(element.text()).toEqual('WORKS');
      });
    });

    it('should support $observe inside link function on directive object', function () {
      angular.mock.module(function () {
        directive('testLink', ngInternals.valueFn({
          templateUrl: 'test-link.html',
          link: function (scope, element, attrs) {
            attrs.$observe('testLink', function (val) {
              scope.testAttr = val;
            });
          }
        }));
      });
      angular.mock.inject(function ($compile, $rootScope, $templateCache) {
        $templateCache.put('test-link.html', '{{testAttr}}');
        element = compileForTest('<div test-link="{{1+2}}"></div>');
        $rootScope.$apply();
        expect(element.text()).toBe('3');
      });
    });

    it('should throw multilink error when linking the same element more then once', function () {
      angular.mock.inject(($rootScope) => {
        var linker = generateTestCompiler('<div>');
        linker($rootScope).remove();
        expect(function () {
          linker($rootScope);
        }).toThrowMinErr('$compile', 'multilink', 'This element has already been linked.');
      });
    });
  });


  describe('attrs', function () {

    it('should allow setting of attributes', function () {
      angular.mock.module(function () {
        directive({
          setter: ngInternals.valueFn(function (scope, element, attr) {
            attr.$set('name', 'abc');
            attr.$set('disabled', true);
            expect(attr.name).toBe('abc');
            expect(attr.disabled).toBe(true);
          })
        });
      });
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest('<div setter></div>');
        expect(element.attr('name')).toEqual('abc');
        expect(element.attr('disabled')).toEqual('disabled');
      });
    });


    it('should read boolean attributes as boolean only on control elements', function () {
      var value;
      angular.mock.module(function () {
        directive({
          input: ngInternals.valueFn({
            restrict: 'ECA',
            link: function (scope, element, attr) {
              value = attr.required;
            }
          })
        });
      });
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest('<input required></input>');
        expect(value).toEqual(true);
      });
    });

    it('should read boolean attributes as text on non-controll elements', function () {
      var value;
      angular.mock.module(function () {
        directive({
          div: ngInternals.valueFn({
            restrict: 'ECA',
            link: function (scope, element, attr) {
              value = attr.required;
            }
          })
        });
      });
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest('<div required="some text"></div>');
        expect(value).toEqual('some text');
      });
    });


    it('should create new instance of attr for each template stamping', function () {
      angular.mock.module(function ($provide) {
        var state = { first: [], second: [] };
        $provide.value('state', state);
        directive({
          first: ngInternals.valueFn({
            priority: 1,
            compile: function (templateElement, templateAttr) {
              return function (scope, element, attr) {
                state.first.push({
                  template: { element: templateElement, attr: templateAttr },
                  link: { element: element, attr: attr }
                });
              };
            }
          }),
          second: ngInternals.valueFn({
            priority: 2,
            compile: function (templateElement, templateAttr) {
              return function (scope, element, attr) {
                state.second.push({
                  template: { element: templateElement, attr: templateAttr },
                  link: { element: element, attr: attr }
                });
              };
            }
          })
        });
      });
      angular.mock.inject(function ($rootScope, $compile, state) {
        var template = generateTestCompiler('<div first second>');
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


    it('should properly $observe inside ng-repeat', function () {
      var spies = [];

      angular.mock.module(function () {
        directive('observer', function () {
          return function (scope, elm, attr) {
            spies.push(jest.fn());
            attr.$observe('some', spies[spies.length - 1]);
          };
        });
      });

      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest('<div><div ng-repeat="i in items">' +
          '<span some="id_{{i.id}}" observer></span>' +
          '</div></div>');

        $rootScope.$apply(function () {
          $rootScope.items = [{ id: 1 }, { id: 2 }];
        });

        expect(spies[0]).toHaveBeenCalledOnceWith('id_1');
        expect(spies[1]).toHaveBeenCalledOnceWith('id_2');
        spies[0].mockReset();
        spies[1].mockReset();

        $rootScope.$apply(function () {
          $rootScope.items[0].id = 5;
        });

        expect(spies[0]).toHaveBeenCalledOnceWith('id_5');
      });
    });


    describe('$set', function () {
      var attr;
      beforeEach(function () {
        angular.mock.module(function () {
          directive('input', ngInternals.valueFn({
            restrict: 'ECA',
            link: function (scope, element, attr) {
              scope.attr = attr;
            }
          }));
        });
        angular.mock.inject(function ($compile, $rootScope) {
          element = compileForTest('<input></input>');
          attr = $rootScope.attr;
          expect(attr).toBeDefined();
        });
      });


      it('should set attributes', function () {
        attr.$set('ngMyAttr', 'value');
        expect(element.attr('ng-my-attr')).toEqual('value');
        expect(attr.ngMyAttr).toEqual('value');
      });


      it('should allow overriding of attribute name and remember the name', function () {
        attr.$set('ngOther', '123', true, 'other');
        expect(element.attr('other')).toEqual('123');
        expect(attr.ngOther).toEqual('123');

        attr.$set('ngOther', '246');
        expect(element.attr('other')).toEqual('246');
        expect(attr.ngOther).toEqual('246');
      });


      it('should remove attribute', function () {
        attr.$set('ngMyAttr', 'value');
        expect(element.attr('ng-my-attr')).toEqual('value');

        attr.$set('ngMyAttr', undefined);
        expect(element.attr('ng-my-attr')).toBeUndefined();

        attr.$set('ngMyAttr', 'value');
        attr.$set('ngMyAttr', null);
        expect(element.attr('ng-my-attr')).toBeUndefined();
      });


      it('should not set DOM element attr if writeAttr false', function () {
        attr.$set('test', 'value', false);

        expect(element.attr('test')).toBeUndefined();
        expect(attr.test).toBe('value');
      });
    });
  });

  angular.forEach([true, false], function (preAssignBindingsEnabled) {
    describe((preAssignBindingsEnabled ? 'with' : 'without') + ' pre-assigned bindings', function () {
      beforeEach(angular.mock.module(function ($compileProvider) {
        $compileProvider.preAssignBindingsEnabled(preAssignBindingsEnabled);
      }));

      describe('controller lifecycle hooks', function () {

        describe('$onInit', function () {

          it('should call `$onInit`, if provided, after all the controllers on the element have been initialized', function () {

            function check() {
              expect(this.element.controller('d1').id).toEqual(1);
              expect(this.element.controller('d2').id).toEqual(2);
            }

            function Controller1($element) {
              this.id = 1;
              this.element = $element;
            }

            Controller1.prototype.$onInit = jest.fn(check);

            function Controller2($element) {
              this.id = 2;
              this.element = $element;
            }

            Controller2.prototype.$onInit = jest.fn(check);

            angular.module('my', [])
              .directive('d1', ngInternals.valueFn({ controller: Controller1 }))
              .directive('d2', ngInternals.valueFn({ controller: Controller2 }));

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<div d1 d2></div>');
              expect(Controller1.prototype.$onInit).toHaveBeenCalledTimes(1);
              expect(Controller2.prototype.$onInit).toHaveBeenCalledTimes(1);
            });
          });

          it('should continue to trigger other `$onInit` hooks if one throws an error', function () {
            function ThrowingController() {
              this.$onInit = function () {
                throw new Error('bad hook');
              };
            }

            function LoggingController($log) {
              this.$onInit = function () {
                $log.info('onInit');
              };
            }

            angular.module('my', [])
              .component('c1', {
                controller: ThrowingController,
                bindings: { 'prop': '<' }
              })
              .component('c2', {
                controller: LoggingController,
                bindings: { 'prop': '<' }
              })
              .config(function ($exceptionHandlerProvider) {
                // We need to test with the exceptionHandler not rethrowing...
                $exceptionHandlerProvider.mode('log');
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope, $exceptionHandler, $log) {

              // Setup the directive with bindings that will keep updating the bound value forever
              element = compileForTest('<div><c1 prop="a"></c1><c2 prop="a"></c2>');

              // The first component's error should be logged
              expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook'));

              // The second component's hook should still be called
              expect($log.info.logs.pop()).toEqual(['onInit']);
            });
          });
        });


        describe('$onDestroy', function () {

          it('should call `$onDestroy`, if provided, on the controller when its scope is destroyed', function () {

            function TestController() {
              this.count = 0;
            }

            TestController.prototype.$onDestroy = function () {
              this.count++;
            };

            angular.module('my', [])
              .directive('d1', ngInternals.valueFn({ scope: true, controller: TestController }))
              .directive('d2', ngInternals.valueFn({ scope: {}, controller: TestController }))
              .directive('d3', ngInternals.valueFn({ controller: TestController }));

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {

              element = compileForTest('<div><d1 ng-if="show[0]"></d1><d2 ng-if="show[1]"></d2><div ng-if="show[2]"><d3></d3></div></div>');

              $rootScope.$apply('show = [true, true, true]');
              var d1Controller = element.find('d1').controller('d1');
              var d2Controller = element.find('d2').controller('d2');
              var d3Controller = element.find('d3').controller('d3');

              expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([0, 0, 0]);
              $rootScope.$apply('show = [false, true, true]');
              expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([1, 0, 0]);
              $rootScope.$apply('show = [false, false, true]');
              expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([1, 1, 0]);
              $rootScope.$apply('show = [false, false, false]');
              expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([1, 1, 1]);
            });
          });


          it('should call `$onDestroy` top-down (the same as `scope.$broadcast`)', function () {
            var log = [];

            function ParentController() {
              log.push('parent created');
            }

            ParentController.prototype.$onDestroy = function () {
              log.push('parent destroyed');
            };

            function ChildController() {
              log.push('child created');
            }

            ChildController.prototype.$onDestroy = function () {
              log.push('child destroyed');
            };

            function GrandChildController() {
              log.push('grand child created');
            }

            GrandChildController.prototype.$onDestroy = function () {
              log.push('grand child destroyed');
            };

            angular.module('my', [])
              .directive('parent', ngInternals.valueFn({ scope: true, controller: ParentController }))
              .directive('child', ngInternals.valueFn({ scope: true, controller: ChildController }))
              .directive('grandChild', ngInternals.valueFn({ scope: true, controller: GrandChildController }));

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {

              element = compileForTest('<parent ng-if="show"><child><grand-child></grand-child></child></parent>');
              $rootScope.$apply('show = true');
              expect(log).toEqual(['parent created', 'child created', 'grand child created']);
              log = [];
              $rootScope.$apply('show = false');
              expect(log).toEqual(['parent destroyed', 'child destroyed', 'grand child destroyed']);
            });
          });
        });


        describe('$postLink', function () {

          it('should call `$postLink`, if provided, after the element has completed linking (i.e. post-link)', function () {

            var log = [];

            function Controller1() {
            }

            Controller1.prototype.$postLink = function () {
              log.push('d1 view init');
            };

            function Controller2() {
            }

            Controller2.prototype.$postLink = function () {
              log.push('d2 view init');
            };

            angular.module('my', [])
              .directive('d1', ngInternals.valueFn({
                controller: Controller1,
                link: {
                  pre: function (s, e) {
                    log.push('d1 pre: ' + e.text());
                  }, post: function (s, e) {
                    log.push('d1 post: ' + e.text());
                  }
                },
                template: '<d2></d2>'
              }))
              .directive('d2', ngInternals.valueFn({
                controller: Controller2,
                link: {
                  pre: function (s, e) {
                    log.push('d2 pre: ' + e.text());
                  }, post: function (s, e) {
                    log.push('d2 post: ' + e.text());
                  }
                },
                template: 'loaded'
              }));

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<d1></d1>');
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

        describe('$doCheck', function () {
          it('should call `$doCheck`, if provided, for each digest cycle, after $onChanges and $onInit', function () {
            var log = [];

            function TestController() {
            }

            TestController.prototype.$doCheck = function () {
              log.push('$doCheck');
            };
            TestController.prototype.$onChanges = function () {
              log.push('$onChanges');
            };
            TestController.prototype.$onInit = function () {
              log.push('$onInit');
            };

            angular.module('my', [])
              .component('dcc', {
                controller: TestController,
                bindings: { 'prop1': '<' }
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<dcc prop1="val"></dcc>');
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

          it('should work if $doCheck is provided in the constructor', function () {
            var log = [];

            function TestController() {
              this.$doCheck = function () {
                log.push('$doCheck');
              };
              this.$onChanges = function () {
                log.push('$onChanges');
              };
              this.$onInit = function () {
                log.push('$onInit');
              };
            }

            angular.module('my', [])
              .component('dcc', {
                controller: TestController,
                bindings: { 'prop1': '<' }
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<dcc prop1="val"></dcc>');
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

        describe('$onChanges', function () {

          it('should call `$onChanges`, if provided, when a one-way (`<`) or interpolation (`@`) bindings are updated', function () {
            var log = [];

            function TestController() {
            }

            TestController.prototype.$onChanges = function (change) {
              log.push(change);
            };

            angular.module('my', [])
              .component('c1', {
                controller: TestController,
                bindings: { 'prop1': '<', 'prop2': '<', 'other': '=', 'attr': '@' }
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {
              // Setup a watch to indicate some complicated updated logic
              $rootScope.$watch('val', function (val, oldVal) {
                $rootScope.val2 = val * 2;
              });
              // Setup the directive with two bindings
              element = compileForTest('<c1 prop1="val" prop2="val2" other="val3" attr="{{val4}}"></c1>');

              expect(log).toEqual([
                {
                  prop1: expect.objectContaining({ currentValue: undefined }),
                  prop2: expect.objectContaining({ currentValue: undefined }),
                  attr: expect.objectContaining({ currentValue: '' })
                }
              ]);

              // Clear the initial changes from the log
              log = [];

              // Update val to trigger the onChanges
              $rootScope.$apply('val = 42');

              // Now we should have a single changes entry in the log
              expect(log).toEqual([
                {
                  prop1: expect.objectContaining({ currentValue: 42 }),
                  prop2: expect.objectContaining({ currentValue: 84 })
                }
              ]);

              // Clear the log
              log = [];

              // Update val to trigger the onChanges
              $rootScope.$apply('val = 17');
              // Now we should have a single changes entry in the log
              expect(log).toEqual([
                {
                  prop1: expect.objectContaining({ previousValue: 42, currentValue: 17 }),
                  prop2: expect.objectContaining({ previousValue: 84, currentValue: 34 })
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
                  attr: expect.objectContaining({ previousValue: '', currentValue: '22' })
                }
              ]);
            });
          });


          it('should trigger `$onChanges` even if the inner value already equals the new outer value', function () {
            var log = [];

            function TestController() {
            }

            TestController.prototype.$onChanges = function (change) {
              log.push(change);
            };

            angular.module('my', [])
              .component('c1', {
                controller: TestController,
                bindings: { 'prop1': '<' }
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<c1 prop1="val"></c1>');

              $rootScope.$apply('val = 1');
              expect(log.pop()).toEqual({
                prop1: expect.objectContaining({
                  previousValue: undefined,
                  currentValue: 1
                })
              });

              element.isolateScope().$ctrl.prop1 = 2;
              $rootScope.$apply('val = 2');
              expect(log.pop()).toEqual({ prop1: expect.objectContaining({ previousValue: 1, currentValue: 2 }) });
            });
          });


          it('should pass the original value as `previousValue` even if there were multiple changes in a single digest', function () {
            var log = [];

            function TestController() {
            }

            TestController.prototype.$onChanges = function (change) {
              log.push(change);
            };

            angular.module('my', [])
              .component('c1', {
                controller: TestController,
                bindings: { 'prop': '<' }
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<c1 prop="a + b"></c1>');

              // We add this watch after the compilation to ensure that it will run after the binding watchers
              // therefore triggering the thing that this test is hoping to enforce
              $rootScope.$watch('a', function (val) {
                $rootScope.b = val * 2;
              });

              expect(log).toEqual([{ prop: expect.objectContaining({ currentValue: undefined }) }]);

              // Clear the initial values from the log
              log = [];

              // Update val to trigger the onChanges
              $rootScope.$apply('a = 42');
              // Now the change should have the real previous value (undefined), not the intermediate one (42)
              expect(log).toEqual([{ prop: expect.objectContaining({ currentValue: 126 }) }]);

              // Clear the log
              log = [];

              // Update val to trigger the onChanges
              $rootScope.$apply('a = 7');
              // Now the change should have the real previous value (126), not the intermediate one, (91)
              expect(log).toEqual([{ prop: expect.objectContaining({ previousValue: 126, currentValue: 21 }) }]);
            });
          });


          it('should trigger an initial onChanges call for each binding with the `isFirstChange()` returning true', function () {
            var log = [];

            function TestController() {
            }

            TestController.prototype.$onChanges = function (change) {
              log.push(change);
            };

            angular.module('my', [])
              .component('c1', {
                controller: TestController,
                bindings: { 'prop': '<', attr: '@' }
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {

              $rootScope.$apply('a = 7');
              element = compileForTest('<c1 prop="a" attr="{{a}}"></c1>');

              expect(log).toEqual([
                {
                  prop: expect.objectContaining({ currentValue: 7 }),
                  attr: expect.objectContaining({ currentValue: '7' })
                }
              ]);
              expect(log[0].prop.isFirstChange()).toEqual(true);
              expect(log[0].attr.isFirstChange()).toEqual(true);

              log = [];
              $rootScope.$apply('a = 9');
              expect(log).toEqual([
                {
                  prop: expect.objectContaining({ previousValue: 7, currentValue: 9 }),
                  attr: expect.objectContaining({ previousValue: '7', currentValue: '9' })
                }
              ]);
              expect(log[0].prop.isFirstChange()).toEqual(false);
              expect(log[0].attr.isFirstChange()).toEqual(false);
            });
          });


          it('should trigger an initial onChanges call for each binding even if the hook is defined in the constructor', function () {
            var log = [];

            function TestController() {
              this.$onChanges = function (change) {
                log.push(change);
              };
            }

            angular.module('my', [])
              .component('c1', {
                controller: TestController,
                bindings: { 'prop': '<', attr: '@' }
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {
              $rootScope.$apply('a = 7');
              element = compileForTest('<c1 prop="a" attr="{{a}}"></c1>');

              expect(log).toEqual([
                {
                  prop: expect.objectContaining({ currentValue: 7 }),
                  attr: expect.objectContaining({ currentValue: '7' })
                }
              ]);
              expect(log[0].prop.isFirstChange()).toEqual(true);
              expect(log[0].attr.isFirstChange()).toEqual(true);

              log = [];
              $rootScope.$apply('a = 10');
              expect(log).toEqual([
                {
                  prop: expect.objectContaining({ previousValue: 7, currentValue: 10 }),
                  attr: expect.objectContaining({ previousValue: '7', currentValue: '10' })
                }
              ]);
              expect(log[0].prop.isFirstChange()).toEqual(false);
              expect(log[0].attr.isFirstChange()).toEqual(false);
            });
          });

          it('should clean up `@`-binding observers when re-assigning bindings', function () {
            var constructorSpy = jest.fn();
            var prototypeSpy = jest.fn();

            function TestController() {
              return { $onChanges: constructorSpy };
            }

            TestController.prototype.$onChanges = prototypeSpy;

            angular.mock.module(function ($compileProvider) {
              $compileProvider.component('test', {
                bindings: { attr: '@' },
                controller: TestController
              });
            });

            angular.mock.inject(function ($compile, $rootScope) {
              var template = '<test attr="{{a}}"></test>';
              $rootScope.a = 'foo';

              element = compileForTest(template);
              $rootScope.$digest();
              expect(constructorSpy).toHaveBeenCalled();
              expect(prototypeSpy).not.toHaveBeenCalled();

              constructorSpy.mockReset();
              $rootScope.$apply('a = "bar"');
              expect(constructorSpy).toHaveBeenCalled();
              expect(prototypeSpy).not.toHaveBeenCalled();
            });
          });

          it('should not call `$onChanges` twice even when the initial value is `NaN`', function () {
            var onChangesSpy = jest.fn();

            angular.mock.module(function ($compileProvider) {
              $compileProvider.component('test', {
                bindings: { prop: '<', attr: '@' },
                controller: function TestController() {
                  this.$onChanges = onChangesSpy;
                }
              });
            });

            angular.mock.inject(function ($compile, $rootScope) {
              var template = '<test prop="a" attr="{{a}}"></test>' +
                '<test prop="b" attr="{{b}}"></test>';
              $rootScope.a = 'foo';
              $rootScope.b = NaN;

              element = compileForTest(template);
              $rootScope.$digest();

              expect(onChangesSpy).toHaveBeenCalledTimes(2);
              expect(onChangesSpy.mock.calls[0][0]).toEqual({
                prop: expect.objectContaining({ currentValue: 'foo' }),
                attr: expect.objectContaining({ currentValue: 'foo' })
              });
              expect(onChangesSpy.mock.calls[1][0]).toEqual({
                prop: expect.objectContaining({ currentValue: NaN }),
                attr: expect.objectContaining({ currentValue: 'NaN' })
              });

              onChangesSpy.mockReset();
              $rootScope.$apply('a = "bar"; b = 42');

              expect(onChangesSpy).toHaveBeenCalledTimes(2);
              expect(onChangesSpy.mock.calls[0][0]).toEqual({
                prop: expect.objectContaining({ previousValue: 'foo', currentValue: 'bar' }),
                attr: expect.objectContaining({ previousValue: 'foo', currentValue: 'bar' })
              });
              expect(onChangesSpy.mock.calls[1][0]).toEqual({
                prop: expect.objectContaining({ previousValue: NaN, currentValue: 42 }),
                attr: expect.objectContaining({ previousValue: 'NaN', currentValue: '42' })
              });
            });
          });


          it('should only trigger one extra digest however many controllers have changes', function () {
            var log = [];

            function TestController1() {
            }

            TestController1.prototype.$onChanges = function (change) {
              log.push(['TestController1', change]);
            };

            function TestController2() {
            }

            TestController2.prototype.$onChanges = function (change) {
              log.push(['TestController2', change]);
            };

            angular.module('my', [])
              .component('c1', {
                controller: TestController1,
                bindings: { 'prop': '<' }
              })
              .component('c2', {
                controller: TestController2,
                bindings: { 'prop': '<' }
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {

              // Create a watcher to count the number of digest cycles
              var watchCount = 0;
              $rootScope.$watch(function () {
                watchCount++;
              });

              // Setup two sibling components with bindings that will change
              element = compileForTest('<div><c1 prop="val1"></c1><c2 prop="val2"></c2></div>');

              // Clear out initial changes
              log = [];

              // Update val to trigger the onChanges
              $rootScope.$apply('val1 = 42; val2 = 17');

              expect(log).toEqual([
                ['TestController1', { prop: expect.objectContaining({ currentValue: 42 }) }],
                ['TestController2', { prop: expect.objectContaining({ currentValue: 17 }) }]
              ]);
              // A single apply should only trigger three turns of the digest loop
              expect(watchCount).toEqual(3);
            });
          });


          it('should cope with changes occurring inside `$onChanges()` hooks', function () {
            var log = [];

            function OuterController() {
            }

            OuterController.prototype.$onChanges = function (change) {
              log.push(['OuterController', change]);
              // Make a change to the inner component
              this.b = this.prop1 * 2;
            };

            function InnerController() {
            }

            InnerController.prototype.$onChanges = function (change) {
              log.push(['InnerController', change]);
            };

            angular.module('my', [])
              .component('outer', {
                controller: OuterController,
                bindings: { 'prop1': '<' },
                template: '<inner prop2="$ctrl.b"></inner>'
              })
              .component('inner', {
                controller: InnerController,
                bindings: { 'prop2': '<' }
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {

              // Setup the directive with two bindings
              element = compileForTest('<outer prop1="a"></outer>');

              // Clear out initial changes
              log = [];

              // Update val to trigger the onChanges
              $rootScope.$apply('a = 42');

              expect(log).toEqual([
                ['OuterController', { prop1: expect.objectContaining({ previousValue: undefined, currentValue: 42 }) }],
                ['InnerController', { prop2: expect.objectContaining({ previousValue: NaN, currentValue: 84 }) }]
              ]);
            });
          });


          it('should throw an error if `$onChanges()` hooks are not stable', function () {
            function TestController() {
            }

            TestController.prototype.$onChanges = function (change) {
              this.onChange();
            };

            angular.module('my', [])
              .component('c1', {
                controller: TestController,
                bindings: { 'prop': '<', onChange: '&' }
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope) {

              // Setup the directive with bindings that will keep updating the bound value forever
              element = compileForTest('<c1 prop="a" on-change="a = -a"></c1>');

              // Update val to trigger the unstable onChanges, which will result in an error
              expect(function () {
                $rootScope.$apply('a = 42');
              }).toThrowMinErr('$compile', 'infchng');

              dealoc(element);
              element = compileForTest('<c1 prop="b" on-change=""></c1>');
              $rootScope.$apply('b = 24');
              $rootScope.$apply('b = 48');
            });
          });


          it('should log an error if `$onChanges()` hooks are not stable', function () {
            function TestController() {
            }

            TestController.prototype.$onChanges = function (change) {
              this.onChange();
            };

            angular.module('my', [])
              .component('c1', {
                controller: TestController,
                bindings: { 'prop': '<', onChange: '&' }
              })
              .config(function ($exceptionHandlerProvider) {
                // We need to test with the exceptionHandler not rethrowing...
                $exceptionHandlerProvider.mode('log');
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope, $exceptionHandler) {

              // Setup the directive with bindings that will keep updating the bound value forever
              element = compileForTest('<c1 prop="a" on-change="a = -a"></c1>');

              // Update val to trigger the unstable onChanges, which will result in an error
              $rootScope.$apply('a = 42');
              expect($exceptionHandler.errors.length).toEqual(1);
              expect($exceptionHandler.errors[0]).toEqualMinErr('$compile', 'infchng', '10 $onChanges() iterations reached.');
            });
          });


          it('should continue to trigger other `$onChanges` hooks if one throws an error', function () {
            function ThrowingController() {
              this.$onChanges = function (change) {
                throw new Error('bad hook');
              };
            }

            function LoggingController($log) {
              this.$onChanges = function (change) {
                $log.info('onChange');
              };
            }

            angular.module('my', [])
              .component('c1', {
                controller: ThrowingController,
                bindings: { 'prop': '<' }
              })
              .component('c2', {
                controller: LoggingController,
                bindings: { 'prop': '<' }
              })
              .config(function ($exceptionHandlerProvider) {
                // We need to test with the exceptionHandler not rethrowing...
                $exceptionHandlerProvider.mode('log');
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope, $exceptionHandler, $log) {

              // Setup the directive with bindings that will keep updating the bound value forever
              element = compileForTest('<div><c1 prop="a"></c1><c2 prop="a"></c2>');

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


          it('should throw `$onChanges` errors immediately', function () {
            function ThrowingController() {
              this.$onChanges = function (change) {
                throw new Error('bad hook: ' + this.prop);
              };
            }

            angular.module('my', [])
              .component('c1', {
                controller: ThrowingController,
                bindings: { 'prop': '<' }
              })
              .config(function ($exceptionHandlerProvider) {
                // We need to test with the exceptionHandler not rethrowing...
                $exceptionHandlerProvider.mode('log');
              });

            angular.mock.module('my');
            angular.mock.inject(function ($compile, $rootScope, $exceptionHandler, $log) {

              // Setup the directive with bindings that will keep updating the bound value forever
              element = compileForTest('<div><c1 prop="a"></c1><c1 prop="a * 2"></c1>');

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


      describe('isolated locals', function () {
        var componentScope, regularScope;

        beforeEach(angular.mock.module(function () {
          directive('myComponent', function () {
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
                expr: '&',
                optExpr: '&?',
                exprAlias: '&expr',
                $exprAlias: '&$expr$',
                constructor: '&?'
              },
              link: function (scope) {
                componentScope = scope;
              }
            };
          });
          directive('badDeclaration', function () {
            return {
              scope: { attr: 'xxx' }
            };
          });
          directive('storeScope', function () {
            return {
              link: function (scope) {
                regularScope = scope;
              }
            };
          });
        }));


        it('should give other directives the parent scope', angular.mock.inject(function () {
          compile('<div><input type="text" my-component store-scope ng-model="value"></div>');
          $rootScope.$apply(function () {
            $rootScope.value = 'from-parent';
          });
          expect(element.find('input').val()).toBe('from-parent');
          expect(componentScope).not.toBe(regularScope);
          expect(componentScope.$parent).toBe(regularScope);
        }));


        it('should not give the isolate scope to other directive template', function () {
          angular.mock.module(function () {
            directive('otherTplDir', function () {
              return {
                template: 'value: {{value}}'
              };
            });
          });

          angular.mock.inject(function () {
            compile('<div my-component other-tpl-dir>');

            $rootScope.$apply(function () {
              $rootScope.value = 'from-parent';
            });

            expect(element.html()).toBe('value: from-parent');
          });
        });


        it('should not give the isolate scope to other directive template (with templateUrl)', function () {
          angular.mock.module(function () {
            directive('otherTplDir', function () {
              return {
                templateUrl: 'other.html'
              };
            });
          });

          angular.mock.inject(function ($rootScope, $templateCache) {
            $templateCache.put('other.html', 'value: {{value}}');
            compile('<div my-component other-tpl-dir>');

            $rootScope.$apply(function () {
              $rootScope.value = 'from-parent';
            });

            expect(element.html()).toBe('value: from-parent');
          });
        });


        it('should not give the isolate scope to regular child elements', function () {
          angular.mock.inject(function () {
            compile('<div my-component>value: {{value}}</div>');

            $rootScope.$apply(function () {
              $rootScope.value = 'from-parent';
            });

            expect(element.html()).toBe('value: from-parent');
          });
        });


        it('should update parent scope when "="-bound NaN changes', angular.mock.inject(function ($compile, $rootScope) {
          $rootScope.num = NaN;
          compile('<div my-component reference="num"></div>');
          var isolateScope = element.isolateScope();
          expect(isolateScope.reference).toBeNaN();

          isolateScope.$apply(function (scope) {
            scope.reference = 64;
          });
          expect($rootScope.num).toBe(64);
        }));


        it('should update isolate scope when "="-bound NaN changes', angular.mock.inject(function ($compile, $rootScope) {
          $rootScope.num = NaN;
          compile('<div my-component reference="num"></div>');
          var isolateScope = element.isolateScope();
          expect(isolateScope.reference).toBeNaN();

          $rootScope.$apply(function (scope) {
            scope.num = 64;
          });
          expect(isolateScope.reference).toBe(64);
        }));


        it('should be able to bind attribute names which are present in Object.prototype', function () {
          angular.mock.module(function () {
            directive('inProtoAttr', ngInternals.valueFn({
              scope: {
                'constructor': '@',
                'toString': '&',

                // Spidermonkey extension, may be obsolete in the future
                'watch': '='
              }
            }));
          });
          angular.mock.inject(function () {
            expect(function () {
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

        it('should be able to interpolate attribute names which are present in Object.prototype', function () {
          var attrs;
          angular.mock.module(function () {
            directive('attrExposer', ngInternals.valueFn({
              link: function ($scope, $element, $attrs) {
                attrs = $attrs;
              }
            }));
          });
          angular.mock.inject(function ($compile, $rootScope) {
            compileForTest('<div attr-exposer to-string="{{1 + 1}}">');
            $rootScope.$apply();
            expect(attrs.toString).toBe('2');
          });
        });


        it('should not initialize scope value if optional expression binding is not passed', angular.mock.inject(function ($compile) {
          compile('<div my-component></div>');
          var isolateScope = element.isolateScope();
          expect(isolateScope.optExpr).toBeUndefined();
        }));


        it('should not initialize scope value if optional expression binding with Object.prototype name is not passed', angular.mock.inject(function ($compile) {
          compile('<div my-component></div>');
          var isolateScope = element.isolateScope();
          expect(isolateScope.constructor).toBe($rootScope.constructor);
        }));


        it('should initialize scope value if optional expression binding is passed', angular.mock.inject(function ($compile) {
          compile('<div my-component opt-expr="value = \'did!\'"></div>');
          var isolateScope = element.isolateScope();
          expect(typeof isolateScope.optExpr).toBe('function');
          expect(isolateScope.optExpr()).toBe('did!');
          expect($rootScope.value).toBe('did!');
        }));


        it('should initialize scope value if optional expression binding with Object.prototype name is passed', angular.mock.inject(function ($compile) {
          compile('<div my-component constructor="value = \'did!\'"></div>');
          var isolateScope = element.isolateScope();
          expect(typeof isolateScope.constructor).toBe('function');
          expect(isolateScope.constructor()).toBe('did!');
          expect($rootScope.value).toBe('did!');
        }));


        it('should not overwrite @-bound property each digest when not present', function () {
          angular.mock.module(function ($compileProvider) {
            $compileProvider.directive('testDir', ngInternals.valueFn({
              scope: { prop: '@' },
              controller: function ($scope) {
                $scope.prop = $scope.prop || 'default';
                this.getProp = function () {
                  return $scope.prop;
                };
              },
              controllerAs: 'ctrl',
              template: '<p></p>'
            }));
          });
          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest('<div test-dir></div>');
            var scope = element.isolateScope();
            expect(scope.ctrl.getProp()).toBe('default');

            $rootScope.$digest();
            expect(scope.ctrl.getProp()).toBe('default');
          });
        });


        it('should ignore optional "="-bound property if value is the empty string', function () {
          angular.mock.module(function ($compileProvider) {
            $compileProvider.directive('testDir', ngInternals.valueFn({
              scope: { prop: '=?' },
              controller: function ($scope) {
                $scope.prop = $scope.prop || 'default';
                this.getProp = function () {
                  return $scope.prop;
                };
              },
              controllerAs: 'ctrl',
              template: '<p></p>'
            }));
          });
          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest('<div test-dir></div>');
            var scope = element.isolateScope();
            expect(scope.ctrl.getProp()).toBe('default');
            $rootScope.$digest();
            expect(scope.ctrl.getProp()).toBe('default');
            scope.prop = 'foop';
            $rootScope.$digest();
            expect(scope.ctrl.getProp()).toBe('foop');
          });
        });


        describe('bind-once', function () {

          function countWatches(scope) {
            var result = 0;
            while (scope !== null) {
              result += (scope.$$watchers && scope.$$watchers.length) || 0;
              result += countWatches(scope.$$childHead);
              scope = scope.$$nextSibling;
            }
            return result;
          }

          it('should be possible to one-time bind a parameter on a component with a template', function () {
            angular.mock.module(function () {
              directive('otherTplDir', function () {
                return {
                  scope: { param1: '=', param2: '=' },
                  template: '1:{{param1}};2:{{param2}};3:{{::param1}};4:{{::param2}}'
                };
              });
            });

            angular.mock.inject(function () {
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

          it('should be possible to one-time bind a parameter on a component with a template', function () {
            angular.mock.module(function () {
              directive('otherTplDir', function () {
                return {
                  scope: { param1: '@', param2: '@' },
                  template: '1:{{param1}};2:{{param2}};3:{{::param1}};4:{{::param2}}'
                };
              });
            });

            angular.mock.inject(function () {
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

          it('should be possible to one-time bind a parameter on a component with a template', function () {
            angular.mock.module(function () {
              directive('otherTplDir', function () {
                return {
                  scope: { param1: '=', param2: '=' },
                  templateUrl: 'other.html'
                };
              });
            });

            angular.mock.inject(function ($rootScope, $templateCache) {
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

          it('should be possible to one-time bind a parameter on a component with a template', function () {
            angular.mock.module(function () {
              directive('otherTplDir', function () {
                return {
                  scope: { param1: '@', param2: '@' },
                  templateUrl: 'other.html'
                };
              });
            });

            angular.mock.inject(function ($rootScope, $templateCache) {
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

          it('should continue with a digets cycle when there is a two-way binding from the child to the parent', function () {
            angular.mock.module(function () {
              directive('hello', function () {
                return {
                  restrict: 'E',
                  scope: { greeting: '=' },
                  template: '<button ng-click="setGreeting()">Say hi!</button>',
                  link: function (scope) {
                    scope.setGreeting = function () {
                      scope.greeting = 'Hello!';
                    };
                  }
                };
              });
            });

            angular.mock.inject(function () {
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


        describe('attribute', function () {
          it('should copy simple attribute', angular.mock.inject(function () {
            compile('<div><span my-component attr="some text" $attr$="some other text">');

            expect(componentScope.attr).toEqual('some text');
            expect(componentScope.attrAlias).toEqual('some text');
            expect(componentScope.$attrAlias).toEqual('some other text');
            expect(componentScope.attrAlias).toEqual(componentScope.attr);
          }));

          it('should copy an attribute with spaces', angular.mock.inject(function () {
            compile('<div><span my-component attr=" some text " $attr$=" some other text ">');

            expect(componentScope.attr).toEqual(' some text ');
            expect(componentScope.attrAlias).toEqual(' some text ');
            expect(componentScope.$attrAlias).toEqual(' some other text ');
            expect(componentScope.attrAlias).toEqual(componentScope.attr);
          }));

          it('should set up the interpolation before it reaches the link function', angular.mock.inject(function () {
            $rootScope.name = 'misko';
            compile('<div><span my-component attr="hello {{name}}" $attr$="hi {{name}}">');
            expect(componentScope.attr).toEqual('hello misko');
            expect(componentScope.attrAlias).toEqual('hello misko');
            expect(componentScope.$attrAlias).toEqual('hi misko');
          }));

          it('should update when interpolated attribute updates', angular.mock.inject(function () {
            compile('<div><span my-component attr="hello {{name}}" $attr$="hi {{name}}">');

            $rootScope.name = 'igor';
            $rootScope.$apply();

            expect(componentScope.attr).toEqual('hello igor');
            expect(componentScope.attrAlias).toEqual('hello igor');
            expect(componentScope.$attrAlias).toEqual('hi igor');
          }));
        });


        describe('object reference', function () {
          it('should update local when origin changes', angular.mock.inject(function () {
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


          it('should update local when both change', angular.mock.inject(function () {
            compile('<div><span my-component ref="name" $ref$="name">');
            $rootScope.name = { mark: 123 };
            componentScope.ref = 'misko';

            $rootScope.$apply();
            expect($rootScope.name).toEqual({ mark: 123 });
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

          it('should not break if local and origin both change to the same value', angular.mock.inject(function () {
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

          it('should complain on non assignable changes', angular.mock.inject(function () {
            compile('<div><span my-component ref="\'hello \' + name">');
            $rootScope.name = 'world';
            $rootScope.$apply();
            expect(componentScope.ref).toBe('hello world');

            componentScope.ref = 'ignore me';
            expect(function () {
              $rootScope.$apply();
            }).toThrowMinErr('$compile', 'nonassign', 'Expression \'\'hello \' + name\' in attribute \'ref\' used with directive \'myComponent\' is non-assignable!');
            expect(componentScope.ref).toBe('hello world');
            // reset since the exception was rethrown which prevented phase clearing
            $rootScope.$$phase = null;

            $rootScope.name = 'misko';
            $rootScope.$apply();
            expect(componentScope.ref).toBe('hello misko');
          }));

          it('should complain if assigning to undefined', angular.mock.inject(function () {
            compile('<div><span my-component>');
            $rootScope.$apply();
            expect(componentScope.ref).toBeUndefined();

            componentScope.ref = 'ignore me';
            expect(function () {
              $rootScope.$apply();
            }).toThrowMinErr('$compile', 'nonassign', 'Expression \'undefined\' in attribute \'ref\' used with directive \'myComponent\' is non-assignable!');
            expect(componentScope.ref).toBeUndefined();

            $rootScope.$$phase = null; // reset since the exception was rethrown which prevented phase clearing
            $rootScope.$apply();
            expect(componentScope.ref).toBeUndefined();
          }));

          // regression
          it('should stabilize model', angular.mock.inject(function () {
            compile('<div><span my-component reference="name">');

            var lastRefValueInParent;
            $rootScope.$watch('name', function (ref) {
              lastRefValueInParent = ref;
            });

            $rootScope.name = 'aaa';
            $rootScope.$apply();

            componentScope.reference = 'new';
            $rootScope.$apply();

            expect(lastRefValueInParent).toBe('new');
          }));

          describe('literal objects', function () {
            it('should copy parent changes', angular.mock.inject(function () {
              compile('<div><span my-component reference="{name: name}">');

              $rootScope.name = 'a';
              $rootScope.$apply();
              expect(componentScope.reference).toEqual({ name: 'a' });

              $rootScope.name = 'b';
              $rootScope.$apply();
              expect(componentScope.reference).toEqual({ name: 'b' });
            }));

            it('should not change the component when parent does not change', angular.mock.inject(function () {
              compile('<div><span my-component reference="{name: name}">');

              $rootScope.name = 'a';
              $rootScope.$apply();
              var lastComponentValue = componentScope.reference;
              $rootScope.$apply();
              expect(componentScope.reference).toBe(lastComponentValue);
            }));

            it('should complain when the component changes', angular.mock.inject(function () {
              compile('<div><span my-component reference="{name: name}">');

              $rootScope.name = 'a';
              $rootScope.$apply();
              componentScope.reference = { name: 'b' };
              expect(function () {
                $rootScope.$apply();
              }).toThrowMinErr('$compile', 'nonassign', 'Expression \'{name: name}\' in attribute \'reference\' used with directive \'myComponent\' is non-assignable!');

            }));

            it('should work for primitive literals', angular.mock.inject(function () {
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


        describe('optional object reference', function () {
          it('should update local when origin changes', angular.mock.inject(function () {
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

          it('should not throw exception when reference does not exist', angular.mock.inject(function () {
            compile('<div><span my-component>');

            expect(componentScope.optref).toBeUndefined();
            expect(componentScope.optrefAlias).toBeUndefined();
            expect(componentScope.$optrefAlias).toBeUndefined();
            expect(componentScope.optreference).toBeUndefined();
          }));
        });


        describe('collection object reference', function () {
          it('should update isolate scope when origin scope changes', angular.mock.inject(function () {
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

          it('should update origin scope when isolate scope changes', angular.mock.inject(function () {
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


        describe('one-way binding', function () {
          it('should update isolate when the identity of origin changes', angular.mock.inject(function () {
            compile('<div><span my-component ow-ref="obj" $ow-ref$="obj">');

            expect(componentScope.owRef).toBeUndefined();
            expect(componentScope.owRefAlias).toBe(componentScope.owRef);
            expect(componentScope.$owRefAlias).toBe(componentScope.owRef);

            $rootScope.obj = { value: 'initial' };
            $rootScope.$apply();

            expect($rootScope.obj).toEqual({ value: 'initial' });
            expect(componentScope.owRef).toEqual({ value: 'initial' });
            expect(componentScope.owRefAlias).toBe(componentScope.owRef);
            expect(componentScope.$owRefAlias).toBe(componentScope.owRef);

            // This changes in both scopes because of reference
            $rootScope.obj.value = 'origin1';
            $rootScope.$apply();
            expect(componentScope.owRef.value).toBe('origin1');
            expect(componentScope.owRefAlias.value).toBe('origin1');
            expect(componentScope.$owRefAlias.value).toBe('origin1');

            componentScope.owRef = { value: 'isolate1' };
            componentScope.$apply();
            expect($rootScope.obj.value).toBe('origin1');

            // Change does not propagate because object identity hasn't changed
            $rootScope.obj.value = 'origin2';
            $rootScope.$apply();
            expect(componentScope.owRef.value).toBe('isolate1');
            expect(componentScope.owRefAlias.value).toBe('origin2');
            expect(componentScope.$owRefAlias.value).toBe('origin2');

            // Change does propagate because object identity changes
            $rootScope.obj = { value: 'origin3' };
            $rootScope.$apply();
            expect(componentScope.owRef.value).toBe('origin3');
            expect(componentScope.owRef).toBe($rootScope.obj);
            expect(componentScope.owRefAlias).toBe($rootScope.obj);
            expect(componentScope.$owRefAlias).toBe($rootScope.obj);
          }));

          it('should update isolate when both change', angular.mock.inject(function () {
            compile('<div><span my-component ow-ref="name" $ow-ref$="name">');

            $rootScope.name = { mark: 123 };
            componentScope.owRef = 'misko';

            $rootScope.$apply();
            expect($rootScope.name).toEqual({ mark: 123 });
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

          describe('initialization', function () {
            var component, log;

            beforeEach(function () {
              log = [];
              angular.module('owComponentTest', [])
                .component('owComponent', {
                  bindings: { input: '<' },
                  controller: function () {
                    component = this;
                    this.input = 'constructor';
                    log.push('constructor');

                    this.$onInit = function () {
                      this.input = '$onInit';
                      log.push('$onInit');
                    };

                    this.$onChanges = function (changes) {
                      if (changes.input) {
                        log.push(['$onChanges', angular.copy(changes.input)]);
                      }
                    };
                  }
                });
            });

            it('should not update isolate again after $onInit if outer has not changed', function () {
              angular.mock.module('owComponentTest');
              angular.mock.inject(function () {
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

            it('should not update isolate again after $onInit if outer object reference has not changed', function () {
              angular.mock.module('owComponentTest');
              angular.mock.inject(function () {
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

            it('should update isolate again after $onInit if outer object reference changes even if equal', function () {
              angular.mock.module('owComponentTest');
              angular.mock.inject(function () {
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

            it('should not update isolate again after $onInit if outer is a literal', function () {
              angular.mock.module('owComponentTest');
              angular.mock.inject(function () {
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
                    expect.objectContaining({ currentValue: ['outer'] })
                  ],
                  '$onInit',
                  [
                    '$onChanges',
                    expect.objectContaining({ previousValue: ['outer'], currentValue: ['re-outer'] })
                  ]
                ]);
              });
            });

            it('should update isolate again after $onInit if outer has changed (before initial watchAction call)', function () {
              angular.mock.module('owComponentTest');
              angular.mock.inject(function () {
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

            it('should update isolate again after $onInit if outer has changed (before initial watchAction call)', function () {
              angular.module('owComponentTest')
                .directive('changeInput', function () {
                  return function (scope, elem, attrs) {
                    scope.name = 'outer2';
                  };
                });
              angular.mock.module('owComponentTest');
              angular.mock.inject(function () {
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

          it('should not break when isolate and origin both change to the same value', angular.mock.inject(function () {
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


          it('should not update origin when identity of isolate changes', angular.mock.inject(function () {
            $rootScope.name = { mark: 123 };
            compile('<div><span my-component ow-ref="name" $ow-ref$="name">');

            expect($rootScope.name).toEqual({ mark: 123 });
            expect(componentScope.owRef).toBe($rootScope.name);
            expect(componentScope.owRefAlias).toBe($rootScope.name);
            expect(componentScope.$owRefAlias).toBe($rootScope.name);

            componentScope.owRef = 'martin';
            $rootScope.$apply();
            expect($rootScope.name).toEqual({ mark: 123 });
            expect(componentScope.owRef).toBe('martin');
            expect(componentScope.owRefAlias).toEqual({ mark: 123 });
            expect(componentScope.$owRefAlias).toEqual({ mark: 123 });
          }));


          it('should update origin when property of isolate object reference changes', angular.mock.inject(function () {
            $rootScope.obj = { mark: 123 };
            compile('<div><span my-component ow-ref="obj">');

            expect($rootScope.obj).toEqual({ mark: 123 });
            expect(componentScope.owRef).toBe($rootScope.obj);

            componentScope.owRef.mark = 789;
            $rootScope.$apply();
            expect($rootScope.obj).toEqual({ mark: 789 });
            expect(componentScope.owRef).toBe($rootScope.obj);
          }));


          it('should not throw on non assignable expressions in the parent', angular.mock.inject(function () {
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


          it('should not throw when assigning to undefined', angular.mock.inject(function () {
            compile('<div><span my-component>');

            expect(componentScope.owRef).toBeUndefined();

            componentScope.owRef = 'ignore me';
            expect(componentScope.owRef).toBe('ignore me');

            $rootScope.$apply();
            expect(componentScope.owRef).toBe('ignore me');
          }));


          it('should update isolate scope when "<"-bound NaN changes', angular.mock.inject(function () {
            $rootScope.num = NaN;
            compile('<div my-component ow-ref="num"></div>');

            var isolateScope = element.isolateScope();
            expect(isolateScope.owRef).toBeNaN();

            $rootScope.num = 64;
            $rootScope.$apply();
            expect(isolateScope.owRef).toBe(64);
          }));


          describe('literal objects', function () {
            it('should copy parent changes', angular.mock.inject(function () {
              compile('<div><span my-component ow-ref="{name: name}">');

              $rootScope.name = 'a';
              $rootScope.$apply();
              expect(componentScope.owRef).toEqual({ name: 'a' });

              $rootScope.name = 'b';
              $rootScope.$apply();
              expect(componentScope.owRef).toEqual({ name: 'b' });
            }));


            it('should not change the isolated scope when origin does not change', angular.mock.inject(function () {
              compile('<div><span my-component ref="{name: name}">');

              $rootScope.name = 'a';
              $rootScope.$apply();
              var lastComponentValue = componentScope.owRef;
              $rootScope.$apply();
              expect(componentScope.owRef).toBe(lastComponentValue);
            }));


            it('should deep-watch array literals', angular.mock.inject(function () {
              $rootScope.name = 'georgios';
              $rootScope.obj = { name: 'pete' };
              compile('<div><span my-component ow-ref="[{name: name}, obj]">');

              expect(componentScope.owRef).toEqual([{ name: 'georgios' }, { name: 'pete' }]);

              $rootScope.name = 'lucas';
              $rootScope.obj = { name: 'martin' };
              $rootScope.$apply();
              expect(componentScope.owRef).toEqual([{ name: 'lucas' }, { name: 'martin' }]);
            }));


            it('should deep-watch object literals', angular.mock.inject(function () {
              $rootScope.name = 'georgios';
              $rootScope.obj = { name: 'pete' };
              compile('<div><span my-component ow-ref="{name: name, item: obj}">');

              expect(componentScope.owRef).toEqual({ name: 'georgios', item: { name: 'pete' } });

              $rootScope.name = 'lucas';
              $rootScope.obj = { name: 'martin' };
              $rootScope.$apply();
              expect(componentScope.owRef).toEqual({ name: 'lucas', item: { name: 'martin' } });
            }));

            // https://github.com/angular/angular.js/issues/15833
            it('should work with ng-model inputs', function () {
              var componentScope;

              angular.mock.module(function ($compileProvider) {
                $compileProvider.directive('undi', function () {
                  return {
                    restrict: 'A',
                    scope: {
                      undi: '<'
                    },
                    link: function ($scope) {
                      componentScope = $scope;
                    }
                  };
                });
              });

              angular.mock.inject(function ($compile, $rootScope) {
                element = compileForTest('<form name="f" undi="[f.i]"><input name="i" ng-model="a"/></form>');
                $rootScope.$apply();
                expect(componentScope.undi).toBeDefined();
              });
            });


            it('should not complain when the isolated scope changes', angular.mock.inject(function () {
              compile('<div><span my-component ow-ref="{name: name}">');

              $rootScope.name = 'a';
              $rootScope.$apply();
              componentScope.owRef = { name: 'b' };
              componentScope.$apply();

              expect(componentScope.owRef).toEqual({ name: 'b' });
              expect($rootScope.name).toBe('a');

              $rootScope.name = 'c';
              $rootScope.$apply();
              expect(componentScope.owRef).toEqual({ name: 'c' });
            }));

            it('should work for primitive literals', angular.mock.inject(function () {
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

            describe('optional one-way binding', function () {
              it('should update local when origin changes', angular.mock.inject(function () {
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

              it('should not throw exception when reference does not exist', angular.mock.inject(function () {
                compile('<div><span my-component>');

                expect(componentScope.owOptref).toBeUndefined();
                expect(componentScope.owOptrefAlias).toBeUndefined();
                expect(componentScope.$owOptrefAlias).toBeUndefined();
              }));
            });
          });
        });

        describe('executable expression', function () {
          it('should allow expression execution with locals', angular.mock.inject(function () {
            compile('<div><span my-component expr="count = count + offset" $expr$="count = count + offset">');
            $rootScope.count = 2;

            expect(typeof componentScope.expr).toBe('function');
            expect(typeof componentScope.exprAlias).toBe('function');
            expect(typeof componentScope.$exprAlias).toBe('function');

            expect(componentScope.expr({ offset: 1 })).toEqual(3);
            expect($rootScope.count).toEqual(3);

            expect(componentScope.exprAlias({ offset: 10 })).toEqual(13);
            expect(componentScope.$exprAlias({ offset: 10 })).toEqual(23);
            expect($rootScope.count).toEqual(23);
          }));
        });

        it('should throw on unknown definition', angular.mock.inject(function () {
          expect(function () {
            compile('<div><span bad-declaration>');
          }).toThrowMinErr('$compile', 'iscp', 'Invalid isolate scope definition for directive \'badDeclaration\'. Definition: {... attr: \'xxx\' ...}');
        }));

        it('should expose a $$isolateBindings property onto the scope', angular.mock.inject(function () {
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

          var firstComponentScope = componentScope,
            first$$isolateBindings = componentScope.$$isolateBindings;

          dealoc(element);
          compile('<div><span my-component>');
          expect(componentScope).not.toBe(firstComponentScope);
          expect(componentScope.$$isolateBindings).toBe(first$$isolateBindings);
        }));


        it('should expose isolate scope variables on controller with controllerAs when bindToController is true (template)', function () {
          var controllerCalled = false;
          angular.mock.module(function ($compileProvider) {
            $compileProvider.directive('fooDir', ngInternals.valueFn({
              template: '<p>isolate</p>',
              scope: {
                'data': '=dirData',
                'oneway': '<dirData',
                'str': '@dirStr',
                'fn': '&dirFn'
              },
              controller: function ($scope) {
                this.check = function () {
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
                if (preAssignBindingsEnabled) {
                  this.check();
                } else {
                  this.$onInit = this.check;
                }
                controllerCalled = true;
              },
              controllerAs: 'test',
              bindToController: true
            }));
          });
          angular.mock.inject(function ($compile, $rootScope) {
            $rootScope.fn = ngInternals.valueFn('called!');
            $rootScope.whom = 'world';
            $rootScope.remoteData = {
              'foo': 'bar',
              'baz': 'biz'
            };
            element = compileForTest('<div foo-dir dir-data="remoteData" ' +
              'dir-str="Hello, {{whom}}!" ' +
              'dir-fn="fn()"></div>');
            expect(controllerCalled).toBe(true);
          });
        });


        it('should not pre-assign bound properties to the controller if `preAssignBindingsEnabled` is disabled', function () {
          var controllerCalled = false, onInitCalled = false;
          angular.mock.module(function ($compileProvider) {
            $compileProvider.preAssignBindingsEnabled(false);
            $compileProvider.directive('fooDir', ngInternals.valueFn({
              template: '<p>isolate</p>',
              scope: {
                'data': '=dirData',
                'oneway': '<dirData',
                'str': '@dirStr',
                'fn': '&dirFn'
              },
              controller: function ($scope) {
                expect(this.data).toBeUndefined();
                expect(this.oneway).toBeUndefined();
                expect(this.str).toBeUndefined();
                expect(this.fn).toBeUndefined();
                controllerCalled = true;
                this.$onInit = function () {
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
          angular.mock.inject(function ($compile, $rootScope) {
            $rootScope.fn = ngInternals.valueFn('called!');
            $rootScope.whom = 'world';
            $rootScope.remoteData = {
              'foo': 'bar',
              'baz': 'biz'
            };
            element = compileForTest('<div foo-dir dir-data="remoteData" ' +
              'dir-str="Hello, {{whom}}!" ' +
              'dir-fn="fn()"></div>');
            expect(controllerCalled).toBe(true);
            expect(onInitCalled).toBe(true);
          });
        });

        it('should pre-assign bound properties to the controller if `preAssignBindingsEnabled` is enabled', function () {
          var controllerCalled = false, onInitCalled = false;
          angular.mock.module(function ($compileProvider) {
            $compileProvider.preAssignBindingsEnabled(true);
            $compileProvider.directive('fooDir', ngInternals.valueFn({
              template: '<p>isolate</p>',
              scope: {
                'data': '=dirData',
                'oneway': '<dirData',
                'str': '@dirStr',
                'fn': '&dirFn'
              },
              controller: function ($scope) {
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
                controllerCalled = true;
                this.$onInit = function () {
                  onInitCalled = true;
                };
              },
              controllerAs: 'test',
              bindToController: true
            }));
          });
          angular.mock.inject(function ($compile, $rootScope) {
            $rootScope.fn = ngInternals.valueFn('called!');
            $rootScope.whom = 'world';
            $rootScope.remoteData = {
              'foo': 'bar',
              'baz': 'biz'
            };
            element = compileForTest('<div foo-dir dir-data="remoteData" ' +
              'dir-str="Hello, {{whom}}!" ' +
              'dir-fn="fn()"></div>');
            expect(controllerCalled).toBe(true);
            expect(onInitCalled).toBe(true);
          });
        });

        it('should eventually expose isolate scope variables on ES6 class controller with controllerAs when bindToController is true', function () {
          var controllerCalled = false;
          // eslint-disable-next-line no-eval
          var Controller = eval('(\n' +
            'class Foo {\n' +
            '  constructor($scope) {}\n' +
            '  $onInit() { this.check(); }\n' +
            '  check() {\n' +
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

          angular.mock.module(function ($compileProvider) {
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
          angular.mock.inject(function ($compile, $rootScope) {
            $rootScope.fn = ngInternals.valueFn('called!');
            $rootScope.whom = 'world';
            $rootScope.remoteData = {
              'foo': 'bar',
              'baz': 'biz'
            };
            element = compileForTest('<div foo-dir dir-data="remoteData" ' +
              'dir-str="Hello, {{whom}}!" ' +
              'dir-fn="fn()"></div>');
            expect(Controller.prototype.$onInit).toHaveBeenCalled();
            expect(controllerCalled).toBe(true);
          });
        });


        it('should update @-bindings on controller when bindToController and attribute change observed', function () {
          angular.mock.module(function ($compileProvider) {
            $compileProvider.directive('atBinding', ngInternals.valueFn({
              template: '<p>{{At.text}}</p>',
              scope: {
                text: '@atBinding'
              },
              controller: function ($scope) {
              },
              bindToController: true,
              controllerAs: 'At'
            }));
          });

          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest('<div at-binding="Test: {{text}}"></div>');
            var p = element.find('p');
            $rootScope.$digest();
            expect(p.text()).toBe('Test: ');

            $rootScope.text = 'Kittens';
            $rootScope.$digest();
            expect(p.text()).toBe('Test: Kittens');
          });
        });


        it('should expose isolate scope variables on controller with controllerAs when bindToController is true (templateUrl)', function () {
          var controllerCalled = false;
          angular.mock.module(function ($compileProvider) {
            $compileProvider.directive('fooDir', ngInternals.valueFn({
              templateUrl: 'test.html',
              scope: {
                'data': '=dirData',
                'oneway': '<dirData',
                'str': '@dirStr',
                'fn': '&dirFn'
              },
              controller: function ($scope) {
                this.check = function () {
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
                if (preAssignBindingsEnabled) {
                  this.check();
                } else {
                  this.$onInit = this.check;
                }
                controllerCalled = true;
              },
              controllerAs: 'test',
              bindToController: true
            }));
          });
          angular.mock.inject(function ($compile, $rootScope, $templateCache) {
            $templateCache.put('test.html', '<p>isolate</p>');
            $rootScope.fn = ngInternals.valueFn('called!');
            $rootScope.whom = 'world';
            $rootScope.remoteData = {
              'foo': 'bar',
              'baz': 'biz'
            };
            element = compileForTest('<div foo-dir dir-data="remoteData" ' +
              'dir-str="Hello, {{whom}}!" ' +
              'dir-fn="fn()"></div>');
            $rootScope.$digest();
            expect(controllerCalled).toBe(true);
          });
        });


        it('should throw noctrl when missing controller', function () {
          angular.mock.module(function ($compileProvider) {
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
          angular.mock.inject(function ($compile, $rootScope) {
            expect(function () {
              compileForTest('<div no-ctrl>');
            }).toThrowMinErr('$compile', 'noctrl',
              'Cannot bind to controller without directive \'noCtrl\'s controller.');
          });
        });


        it('should throw badrestrict on first compilation when restrict is invalid', function () {
          angular.mock.module(function ($compileProvider, $exceptionHandlerProvider) {
            $compileProvider.directive('invalidRestrictBadString', ngInternals.valueFn({ restrict: '"' }));
            $compileProvider.directive('invalidRestrictTrue', ngInternals.valueFn({ restrict: true }));
            $compileProvider.directive('invalidRestrictObject', ngInternals.valueFn({ restrict: {} }));
            $compileProvider.directive('invalidRestrictNumber', ngInternals.valueFn({ restrict: 42 }));

            // We need to test with the exceptionHandler not rethrowing...
            $exceptionHandlerProvider.mode('log');
          });

          angular.mock.inject(function ($exceptionHandler, $compile, $rootScope) {
            compileForTest('<div invalid-restrict-true>');
            expect($exceptionHandler.errors.length).toBe(1);
            expect($exceptionHandler.errors[0].toString()).toMatch(/\$compile.*badrestrict.*'true'/);

            compileForTest('<div invalid-restrict-bad-string>');
            compileForTest('<div invalid-restrict-bad-string>');
            expect($exceptionHandler.errors.length).toBe(2);
            expect($exceptionHandler.errors[1].toString()).toMatch(/\$compile.*badrestrict.*'"'/);

            compileForTest('<div invalid-restrict-bad-string invalid-restrict-object>');
            expect($exceptionHandler.errors.length).toBe(3);
            expect($exceptionHandler.errors[2].toString()).toMatch(/\$compile.*badrestrict.*'{}'/);

            compileForTest('<div invalid-restrict-object invalid-restrict-number>');
            expect($exceptionHandler.errors.length).toBe(4);
            expect($exceptionHandler.errors[3].toString()).toMatch(/\$compile.*badrestrict.*'42'/);
          });
        });


        describe('should bind to controller via object notation', function () {
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
            }],

            scopeOptions = [{
              description: 'isolate scope',
              scope: {}
            }, {
              description: 'new scope',
              scope: true
            }, {
              description: 'no scope',
              scope: false
            }],

            templateOptions = [{
              description: 'inline template',
              template: '<p>template</p>'
            }, {
              description: 'templateUrl setting',
              templateUrl: 'test.html'
            }, {
              description: 'no template'
            }];

          angular.forEach(controllerOptions, function (controllerOption) {
            angular.forEach(scopeOptions, function (scopeOption) {
              angular.forEach(templateOptions, function (templateOption) {

                var description = [],
                  ddo = {
                    bindToController: {
                      'data': '=dirData',
                      'oneway': '<dirData',
                      'str': '@dirStr',
                      'fn': '&dirFn'
                    }
                  };

                angular.forEach([controllerOption, scopeOption, templateOption], function (option) {
                  description.push(option.description);
                  delete option.description;
                  angular.extend(ddo, option);
                });

                it('(' + description.join(', ') + ')', function () {
                  var controllerCalled = false;
                  angular.mock.module(function ($compileProvider, $controllerProvider) {
                    $controllerProvider.register('myCtrl', function () {
                      this.check = function () {
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
                      if (preAssignBindingsEnabled) {
                        this.check();
                      } else {
                        this.$onInit = this.check;
                      }
                    });
                    $compileProvider.directive('fooDir', ngInternals.valueFn(ddo));
                  });
                  angular.mock.inject(function ($compile, $rootScope, $templateCache) {
                    $templateCache.put('test.html', '<p>template</p>');
                    $rootScope.fn = ngInternals.valueFn('called!');
                    $rootScope.whom = 'world';
                    $rootScope.remoteData = {
                      'foo': 'bar',
                      'baz': 'biz'
                    };
                    element = compileForTest('<div foo-dir dir-data="remoteData" ' +
                      'dir-str="Hello, {{whom}}!" ' +
                      'dir-fn="fn()"></div>');
                    $rootScope.$digest();
                    expect(controllerCalled).toBe(true);
                    if (ddo.controllerAs || ddo.controller.indexOf(' as ') !== -1) {
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


        it('should bind to multiple directives controllers via object notation (no scope)', function () {
          var controller1Called = false;
          var controller2Called = false;
          angular.mock.module(function ($compileProvider, $controllerProvider) {
            $compileProvider.directive('foo', ngInternals.valueFn({
              bindToController: {
                'data': '=fooData',
                'oneway': '<fooData',
                'str': '@fooStr',
                'fn': '&fooFn'
              },
              controllerAs: 'fooCtrl',
              controller: function () {
                this.check = function () {
                  expect(this.data).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
                  expect(this.oneway).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
                  expect(this.str).toBe('Hello, world!');
                  expect(this.fn()).toBe('called!');
                };
                controller1Called = true;
                if (preAssignBindingsEnabled) {
                  this.check();
                } else {
                  this.$onInit = this.check;
                }
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
              controller: function () {
                this.check = function () {
                  expect(this.data).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
                  expect(this.oneway).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
                  expect(this.str).toBe('Hello, second world!');
                  expect(this.fn()).toBe('second called!');
                };
                controller2Called = true;
                if (preAssignBindingsEnabled) {
                  this.check();
                } else {
                  this.$onInit = this.check;
                }
              }
            }));
          });
          angular.mock.inject(function ($compile, $rootScope) {
            $rootScope.fn = ngInternals.valueFn('called!');
            $rootScope.string = 'world';
            $rootScope.data = { 'foo': 'bar', 'baz': 'biz' };
            $rootScope.fn2 = ngInternals.valueFn('second called!');
            $rootScope.string2 = 'second world';
            $rootScope.data2 = { 'foo2': 'bar2', 'baz2': 'biz2' };
            element = compileForTest(
              '<div ' +
              'foo ' +
              'foo-data="data" ' +
              'foo-str="Hello, {{string}}!" ' +
              'foo-fn="fn()" ' +
              'bar ' +
              'bar-data="data2" ' +
              'bar-str="Hello, {{string2}}!" ' +
              'bar-fn="fn2()" > ' +
              '</div>');
            $rootScope.$digest();
            expect(controller1Called).toBe(true);
            expect(controller2Called).toBe(true);
          });
        });


        it('should bind to multiple directives controllers via object notation (new iso scope)', function () {
          var controller1Called = false;
          var controller2Called = false;
          angular.mock.module(function ($compileProvider, $controllerProvider) {
            $compileProvider.directive('foo', ngInternals.valueFn({
              bindToController: {
                'data': '=fooData',
                'oneway': '<fooData',
                'str': '@fooStr',
                'fn': '&fooFn'
              },
              scope: {},
              controllerAs: 'fooCtrl',
              controller: function () {
                this.check = function () {
                  expect(this.data).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
                  expect(this.oneway).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
                  expect(this.str).toBe('Hello, world!');
                  expect(this.fn()).toBe('called!');
                };
                controller1Called = true;
                if (preAssignBindingsEnabled) {
                  this.check();
                } else {
                  this.$onInit = this.check;
                }
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
              controller: function () {
                this.check = function () {
                  expect(this.data).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
                  expect(this.oneway).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
                  expect(this.str).toBe('Hello, second world!');
                  expect(this.fn()).toBe('second called!');
                };
                controller2Called = true;
                if (preAssignBindingsEnabled) {
                  this.check();
                } else {
                  this.$onInit = this.check;
                }
              }
            }));
          });
          angular.mock.inject(function ($compile, $rootScope) {
            $rootScope.fn = ngInternals.valueFn('called!');
            $rootScope.string = 'world';
            $rootScope.data = { 'foo': 'bar', 'baz': 'biz' };
            $rootScope.fn2 = ngInternals.valueFn('second called!');
            $rootScope.string2 = 'second world';
            $rootScope.data2 = { 'foo2': 'bar2', 'baz2': 'biz2' };
            element = compileForTest(
              '<div ' +
              'foo ' +
              'foo-data="data" ' +
              'foo-str="Hello, {{string}}!" ' +
              'foo-fn="fn()" ' +
              'bar ' +
              'bar-data="data2" ' +
              'bar-str="Hello, {{string2}}!" ' +
              'bar-fn="fn2()" > ' +
              '</div>');
            $rootScope.$digest();
            expect(controller1Called).toBe(true);
            expect(controller2Called).toBe(true);
          });
        });


        it('should bind to multiple directives controllers via object notation (new scope)', function () {
          var controller1Called = false;
          var controller2Called = false;
          angular.mock.module(function ($compileProvider, $controllerProvider) {
            $compileProvider.directive('foo', ngInternals.valueFn({
              bindToController: {
                'data': '=fooData',
                'oneway': '<fooData',
                'str': '@fooStr',
                'fn': '&fooFn'
              },
              scope: true,
              controllerAs: 'fooCtrl',
              controller: function () {
                this.check = function () {
                  expect(this.data).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
                  expect(this.oneway).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
                  expect(this.str).toBe('Hello, world!');
                  expect(this.fn()).toBe('called!');
                };
                controller1Called = true;
                if (preAssignBindingsEnabled) {
                  this.check();
                } else {
                  this.$onInit = this.check;
                }
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
              controller: function () {
                this.check = function () {
                  expect(this.data).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
                  expect(this.oneway).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
                  expect(this.str).toBe('Hello, second world!');
                  expect(this.fn()).toBe('second called!');
                };
                controller2Called = true;
                if (preAssignBindingsEnabled) {
                  this.check();
                } else {
                  this.$onInit = this.check;
                }
              }
            }));
          });
          angular.mock.inject(function ($compile, $rootScope) {
            $rootScope.fn = ngInternals.valueFn('called!');
            $rootScope.string = 'world';
            $rootScope.data = { 'foo': 'bar', 'baz': 'biz' };
            $rootScope.fn2 = ngInternals.valueFn('second called!');
            $rootScope.string2 = 'second world';
            $rootScope.data2 = { 'foo2': 'bar2', 'baz2': 'biz2' };
            element = compileForTest(
              '<div ' +
              'foo ' +
              'foo-data="data" ' +
              'foo-str="Hello, {{string}}!" ' +
              'foo-fn="fn()" ' +
              'bar ' +
              'bar-data="data2" ' +
              'bar-str="Hello, {{string2}}!" ' +
              'bar-fn="fn2()" > ' +
              '</div>');
            $rootScope.$digest();
            expect(controller1Called).toBe(true);
            expect(controller2Called).toBe(true);
          });
        });


        it('should evaluate against the correct scope, when using `bindToController` (new scope)',
          function () {
            angular.mock.module(function ($compileProvider, $controllerProvider) {
              $controllerProvider.register({
                'ParentCtrl': function () {
                  this.value1 = 'parent1';
                  this.value2 = 'parent2';
                  this.value3 = function () {
                    return 'parent3';
                  };
                  this.value4 = 'parent4';
                },
                'ChildCtrl': function () {
                  this.value1 = 'child1';
                  this.value2 = 'child2';
                  this.value3 = function () {
                    return 'child3';
                  };
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

            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest(
                '<div ng-controller="ParentCtrl as ctrl">' +
                '<child ' +
                'from-parent-1="{{ ctrl.value1 }}" ' +
                'from-parent-2="ctrl.value2" ' +
                'from-parent-3="ctrl.value3" ' +
                'from-parent-4="ctrl.value4">' +
                '</child>' +
                '</div>');
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


        it('should evaluate against the correct scope, when using `bindToController` (new iso scope)',
          function () {
            angular.mock.module(function ($compileProvider, $controllerProvider) {
              $controllerProvider.register({
                'ParentCtrl': function () {
                  this.value1 = 'parent1';
                  this.value2 = 'parent2';
                  this.value3 = function () {
                    return 'parent3';
                  };
                  this.value4 = 'parent4';
                },
                'ChildCtrl': function () {
                  this.value1 = 'child1';
                  this.value2 = 'child2';
                  this.value3 = function () {
                    return 'child3';
                  };
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

            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest(
                '<div ng-controller="ParentCtrl as ctrl">' +
                '<child ' +
                'from-parent-1="{{ ctrl.value1 }}" ' +
                'from-parent-2="ctrl.value2" ' +
                'from-parent-3="ctrl.value3" ' +
                'from-parent-4="ctrl.value4">' +
                '</child>' +
                '</div>');
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


        it('should put controller in scope when controller identifier present but not using controllerAs', function () {
          var controllerCalled = false;
          var myCtrl;
          angular.mock.module(function ($compileProvider, $controllerProvider) {
            $controllerProvider.register('myCtrl', function () {
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
          angular.mock.inject(function ($compile, $rootScope, $templateCache) {
            $templateCache.put('test.html', '<p>isolate</p>');
            element = compileForTest('<div foo-dir>');
            $rootScope.$digest();
            expect(controllerCalled).toBe(true);
            var childScope = element.children().scope();
            expect(childScope).not.toBe;
            expect(childScope.theCtrl).toBe(myCtrl);
          });
        });


        it('should re-install controllerAs and bindings for returned value from controller (new scope)', function () {
          var controllerCalled = false;
          var myCtrl;

          function MyCtrl() {
          }

          MyCtrl.prototype.test = function () {
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

          angular.mock.module(function ($compileProvider, $controllerProvider) {
            $controllerProvider.register('myCtrl', function () {
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
          angular.mock.inject(function ($compile, $rootScope, $templateCache) {
            $templateCache.put('test.html', '<p>isolate</p>');
            $rootScope.fn = ngInternals.valueFn('called!');
            $rootScope.whom = 'world';
            $rootScope.remoteData = {
              'foo': 'bar',
              'baz': 'biz'
            };
            element = compileForTest('<div foo-dir dir-data="remoteData" ' +
              'dir-str="Hello, {{whom}}!" ' +
              'dir-fn="fn()"></div>');
            $rootScope.$digest();
            expect(controllerCalled).toBe(true);
            var childScope = element.children().scope();
            expect(childScope).not.toBe;
            expect(childScope.theCtrl).not.toBe(myCtrl);
            expect(childScope.theCtrl.constructor).toBe(MyCtrl);
            childScope.theCtrl.test();
          });
        });


        it('should re-install controllerAs and bindings for returned value from controller (isolate scope)', function () {
          var controllerCalled = false;
          var myCtrl;

          function MyCtrl() {
          }

          MyCtrl.prototype.test = function () {
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

          angular.mock.module(function ($compileProvider, $controllerProvider) {
            $controllerProvider.register('myCtrl', function () {
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
          angular.mock.inject(function ($compile, $rootScope, $templateCache) {
            $templateCache.put('test.html', '<p>isolate</p>');
            $rootScope.fn = ngInternals.valueFn('called!');
            $rootScope.whom = 'world';
            $rootScope.remoteData = {
              'foo': 'bar',
              'baz': 'biz'
            };
            element = compileForTest('<div foo-dir dir-data="remoteData" ' +
              'dir-str="Hello, {{whom}}!" ' +
              'dir-fn="fn()"></div>');
            $rootScope.$digest();
            expect(controllerCalled).toBe(true);
            var childScope = element.children().scope();
            expect(childScope).not.toBe;
            expect(childScope.theCtrl).not.toBe(myCtrl);
            expect(childScope.theCtrl.constructor).toBe(MyCtrl);
            childScope.theCtrl.test();
          });
        });

        describe('should not overwrite @-bound property each digest when not present', function () {
          it('when creating new scope', function () {
            angular.mock.module(function ($compileProvider) {
              $compileProvider.directive('testDir', ngInternals.valueFn({
                scope: true,
                bindToController: {
                  prop: '@'
                },
                controller: function () {
                  var self = this;
                  this.initProp = function () {
                    this.prop = this.prop || 'default';
                  };
                  if (preAssignBindingsEnabled) {
                    this.initProp();
                  } else {
                    this.$onInit = this.initProp;
                  }
                  this.getProp = function () {
                    return self.prop;
                  };
                },
                controllerAs: 'ctrl',
                template: '<p></p>'
              }));
            });
            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<div test-dir></div>');
              var scope = element.scope();
              expect(scope.ctrl.getProp()).toBe('default');

              $rootScope.$digest();
              expect(scope.ctrl.getProp()).toBe('default');
            });
          });

          it('when creating isolate scope', function () {
            angular.mock.module(function ($compileProvider) {
              $compileProvider.directive('testDir', ngInternals.valueFn({
                scope: {},
                bindToController: {
                  prop: '@'
                },
                controller: function () {
                  var self = this;
                  this.initProp = function () {
                    this.prop = this.prop || 'default';
                  };
                  this.getProp = function () {
                    return self.prop;
                  };
                  if (preAssignBindingsEnabled) {
                    this.initProp();
                  } else {
                    this.$onInit = this.initProp;
                  }
                },
                controllerAs: 'ctrl',
                template: '<p></p>'
              }));
            });
            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<div test-dir></div>');
              var scope = element.isolateScope();
              expect(scope.ctrl.getProp()).toBe('default');

              $rootScope.$digest();
              expect(scope.ctrl.getProp()).toBe('default');
            });
          });
        });

      });

      describe('require', function () {

        it('should get required controller', function () {
          angular.mock.module(function () {
            directive('main', function (log) {
              return {
                priority: 2,
                controller: function () {
                  this.name = 'main';
                },
                link: function (scope, element, attrs, controller) {
                  log(controller.name);
                }
              };
            });
            directive('dep', function (log) {
              return {
                priority: 1,
                require: 'main',
                link: function (scope, element, attrs, controller) {
                  log('dep:' + controller.name);
                }
              };
            });
            directive('other', function (log) {
              return {
                link: function (scope, element, attrs, controller) {
                  log(!!controller); // should be false
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<div main dep other></div>');
            expect(log).toEqual('false; dep:main; main');
          });
        });


        it('should respect explicit return value from controller', function () {
          var expectedController;
          angular.mock.module(function () {
            directive('logControllerProp', function (log) {
              return {
                controller: function ($scope) {
                  this.foo = 'baz'; // value should not be used.
                  expectedController = { foo: 'bar' };
                  return expectedController;
                },
                link: function (scope, element, attrs, controller) {
                  expect(expectedController).toBeDefined();
                  expect(controller).toBe(expectedController);
                  expect(controller.foo).toBe('bar');
                  log('done');
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<log-controller-prop></log-controller-prop>');
            expect(log).toEqual('done');
            expect(element.data('$logControllerPropController')).toBe(expectedController);
          });
        });


        it('should get explicit return value of required parent controller', function () {
          var expectedController;
          angular.mock.module(function () {
            directive('nested', function (log) {
              return {
                require: '^^?nested',
                controller: function () {
                  if (!expectedController) expectedController = { foo: 'bar' };
                  return expectedController;
                },
                link: function (scope, element, attrs, controller) {
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
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<div nested><div nested></div></div>');
            expect(log).toEqual('done');
            expect(element.data('$nestedController')).toBe(expectedController);
          });
        });


        it('should respect explicit controller return value when using controllerAs', function () {
          angular.mock.module(function () {
            directive('main', function () {
              return {
                templateUrl: 'main.html',
                scope: {},
                controller: function () {
                  this.name = 'lucas';
                  return { name: 'george' };
                },
                controllerAs: 'mainCtrl'
              };
            });
          });
          angular.mock.inject(function ($templateCache, $compile, $rootScope) {
            $templateCache.put('main.html', '<span>template:{{mainCtrl.name}}</span>');
            element = compileForTest('<main/>');
            $rootScope.$apply();
            expect(element.text()).toBe('template:george');
          });
        });


        it('transcluded children should receive explicit return value of parent controller', function () {
          var expectedController;
          angular.mock.module(function () {
            directive('nester', ngInternals.valueFn({
              transclude: true,
              controller: function ($transclude) {
                this.foo = 'baz';
                expectedController = { transclude: $transclude, foo: 'bar' };
                return expectedController;
              },
              link: function (scope, el, attr, ctrl) {
                ctrl.transclude(cloneAttach);

                function cloneAttach(clone) {
                  el.append(clone);
                }
              }
            }));
            directive('nested', function (log) {
              return {
                require: '^^nester',
                link: function (scope, element, attrs, controller) {
                  expect(controller).toBeDefined();
                  expect(controller).toBe(expectedController);
                  log('done');
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile) {
            element = compileForTest('<div nester><div nested></div></div>');
            $rootScope.$apply();
            expect(log.toString()).toBe('done');
            expect(element.data('$nesterController')).toBe(expectedController);
          });
        });


        it('explicit controller return values are ignored if they are primitives', function () {
          angular.mock.module(function () {
            directive('logControllerProp', function (log) {
              return {
                controller: function ($scope) {
                  this.foo = 'baz'; // value *will* be used.
                  return 'bar';
                },
                link: function (scope, element, attrs, controller) {
                  log(controller.foo);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<log-controller-prop></log-controller-prop>');
            expect(log).toEqual('baz');
            expect(element.data('$logControllerPropController').foo).toEqual('baz');
          });
        });


        it('should correctly assign controller return values for multiple directives', function () {
          var directiveController, otherDirectiveController;
          angular.mock.module(function () {

            directive('myDirective', function (log) {
              return {
                scope: true,
                controller: function ($scope) {
                  directiveController = {
                    foo: 'bar'
                  };
                  return directiveController;
                }
              };
            });

            directive('myOtherDirective', function (log) {
              return {
                controller: function ($scope) {
                  otherDirectiveController = {
                    baz: 'luh'
                  };
                  return otherDirectiveController;
                }
              };
            });

          });

          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<my-directive my-other-directive></my-directive>');
            expect(element.data('$myDirectiveController')).toBe(directiveController);
            expect(element.data('$myOtherDirectiveController')).toBe(otherDirectiveController);
          });
        });


        it('should get required parent controller', function () {
          angular.mock.module(function () {
            directive('nested', function (log) {
              return {
                require: '^^?nested',
                controller: function ($scope) {
                },
                link: function (scope, element, attrs, controller) {
                  log(!!controller);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<div nested><div nested></div></div>');
            expect(log).toEqual('true; false');
          });
        });


        it('should get required parent controller when the question mark precedes the ^^', function () {
          angular.mock.module(function () {
            directive('nested', function (log) {
              return {
                require: '?^^nested',
                controller: function ($scope) {
                },
                link: function (scope, element, attrs, controller) {
                  log(!!controller);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<div nested><div nested></div></div>');
            expect(log).toEqual('true; false');
          });
        });


        it('should throw if required parent is not found', function () {
          angular.mock.module(function () {
            directive('nested', function () {
              return {
                require: '^^nested',
                controller: function ($scope) {
                },
                link: function (scope, element, attrs, controller) {
                }
              };
            });
          });
          angular.mock.inject(function ($compile, $rootScope) {
            expect(function () {
              element = compileForTest('<div nested></div>');
            }).toThrowMinErr('$compile', 'ctreq', 'Controller \'nested\', required by directive \'nested\', can\'t be found!');
          });
        });


        it('should get required controller via linkingFn (template)', function () {
          angular.mock.module(function () {
            directive('dirA', function () {
              return {
                controller: function () {
                  this.name = 'dirA';
                }
              };
            });
            directive('dirB', function (log) {
              return {
                require: 'dirA',
                template: '<p>dirB</p>',
                link: function (scope, element, attrs, dirAController) {
                  log('dirAController.name: ' + dirAController.name);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<div dir-a dir-b></div>');
            expect(log).toEqual('dirAController.name: dirA');
          });
        });


        it('should get required controller via linkingFn (templateUrl)', function () {
          angular.mock.module(function () {
            directive('dirA', function () {
              return {
                controller: function () {
                  this.name = 'dirA';
                }
              };
            });
            directive('dirB', function (log) {
              return {
                require: 'dirA',
                templateUrl: 'dirB.html',
                link: function (scope, element, attrs, dirAController) {
                  log('dirAController.name: ' + dirAController.name);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope, $templateCache) {
            $templateCache.put('dirB.html', '<p>dirB</p>');
            element = compileForTest('<div dir-a dir-b></div>');
            $rootScope.$digest();
            expect(log).toEqual('dirAController.name: dirA');
          });
        });

        it('should bind the required controllers to the directive controller, if provided as an object and bindToController is truthy', function () {
          var parentController, siblingController;

          function ParentController() {
            this.name = 'Parent';
          }

          function SiblingController() {
            this.name = 'Sibling';
          }

          function MeController() {
            this.name = 'Me';
          }

          MeController.prototype.$onInit = function () {
            parentController = this.container;
            siblingController = this.friend;
          };
          jest.spyOn(MeController.prototype, '$onInit');

          angular.module('my', [])
            .directive('me', function () {
              return {
                restrict: 'E',
                scope: {},
                require: { container: '^parent', friend: 'sibling' },
                bindToController: true,
                controller: MeController,
                controllerAs: '$ctrl'
              };
            })
            .directive('parent', function () {
              return {
                restrict: 'E',
                scope: {},
                controller: ParentController
              };
            })
            .directive('sibling', function () {
              return {
                controller: SiblingController
              };
            });

          angular.mock.module('my');
          angular.mock.inject(function ($compile, $rootScope, meDirective) {
            element = compileForTest('<parent><me sibling></me></parent>');
            expect(MeController.prototype.$onInit).toHaveBeenCalled();
            expect(parentController).toEqual(expect.any(ParentController));
            expect(siblingController).toEqual(expect.any(SiblingController));
          });
        });

        it('should use the key if the name of a required controller is omitted', function () {
          function ParentController() {
            this.name = 'Parent';
          }

          function ParentOptController() {
            this.name = 'ParentOpt';
          }

          function ParentOrSiblingController() {
            this.name = 'ParentOrSibling';
          }

          function ParentOrSiblingOptController() {
            this.name = 'ParentOrSiblingOpt';
          }

          function SiblingController() {
            this.name = 'Sibling';
          }

          function SiblingOptController() {
            this.name = 'SiblingOpt';
          }

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
            .directive('parent', function () {
              return { controller: ParentController };
            })
            .directive('parentOpt', function () {
              return { controller: ParentOptController };
            })
            .directive('parentOrSibling1', function () {
              return { controller: ParentOrSiblingController };
            })
            .directive('parentOrSiblingOpt1', function () {
              return { controller: ParentOrSiblingOptController };
            })
            .directive('parentOrSibling2', function () {
              return { controller: ParentOrSiblingController };
            })
            .directive('parentOrSiblingOpt2', function () {
              return { controller: ParentOrSiblingOptController };
            })
            .directive('sibling', function () {
              return { controller: SiblingController };
            })
            .directive('siblingOpt', function () {
              return { controller: SiblingOptController };
            });

          angular.mock.module('my');
          angular.mock.inject(function ($compile, $rootScope) {
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
            element = compileForTest(template);

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


        it('should not bind required controllers if bindToController is falsy', function () {
          var parentController, siblingController;

          function ParentController() {
            this.name = 'Parent';
          }

          function SiblingController() {
            this.name = 'Sibling';
          }

          function MeController() {
            this.name = 'Me';
          }

          MeController.prototype.$onInit = function () {
            parentController = this.container;
            siblingController = this.friend;
          };
          jest.spyOn(MeController.prototype, '$onInit');

          angular.module('my', [])
            .directive('me', function () {
              return {
                restrict: 'E',
                scope: {},
                require: { container: '^parent', friend: 'sibling' },
                controller: MeController
              };
            })
            .directive('parent', function () {
              return {
                restrict: 'E',
                scope: {},
                controller: ParentController
              };
            })
            .directive('sibling', function () {
              return {
                controller: SiblingController
              };
            });

          angular.mock.module('my');
          angular.mock.inject(function ($compile, $rootScope, meDirective) {
            element = compileForTest('<parent><me sibling></me></parent>');
            expect(MeController.prototype.$onInit).toHaveBeenCalled();
            expect(parentController).toBeUndefined();
            expect(siblingController).toBeUndefined();
          });
        });

        it('should bind required controllers to controller that has an explicit constructor return value', function () {
          var parentController, siblingController, meController;

          function ParentController() {
            this.name = 'Parent';
          }

          function SiblingController() {
            this.name = 'Sibling';
          }

          function MeController() {
            meController = {
              name: 'Me',
              $onInit: function () {
                parentController = this.container;
                siblingController = this.friend;
              }
            };
            jest.spyOn(meController, '$onInit');
            return meController;
          }

          angular.module('my', [])
            .directive('me', function () {
              return {
                restrict: 'E',
                scope: {},
                require: { container: '^parent', friend: 'sibling' },
                bindToController: true,
                controller: MeController,
                controllerAs: '$ctrl'
              };
            })
            .directive('parent', function () {
              return {
                restrict: 'E',
                scope: {},
                controller: ParentController
              };
            })
            .directive('sibling', function () {
              return {
                controller: SiblingController
              };
            });

          angular.mock.module('my');
          angular.mock.inject(function ($compile, $rootScope, meDirective) {
            element = compileForTest('<parent><me sibling></me></parent>');
            expect(meController.$onInit).toHaveBeenCalled();
            expect(parentController).toEqual(expect.any(ParentController));
            expect(siblingController).toEqual(expect.any(SiblingController));
          });
        });


        it('should bind required controllers to controllers that return an explicit constructor return value', function () {
          var parentController, containerController, siblingController, friendController, meController;

          function MeController() {
            this.name = 'Me';
            this.$onInit = function () {
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
            .directive('me', function () {
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
            .directive('parent', function () {
              return {
                restrict: 'E',
                scope: {},
                controller: ParentController
              };
            })
            .directive('sibling', function () {
              return {
                controller: SiblingController
              };
            });

          angular.mock.module('my');
          angular.mock.inject(function ($compile, $rootScope, meDirective) {
            element = compileForTest('<parent><me sibling></me></parent>');
            expect(containerController).toEqual(parentController);
            expect(friendController).toEqual(siblingController);
          });
        });

        it('should require controller of an isolate directive from a non-isolate directive on the ' +
          'same element', function () {
          var IsolateController = function () {
          };
          var isolateDirControllerInNonIsolateDirective;

          angular.mock.module(function () {
            directive('isolate', function () {
              return {
                scope: {},
                controller: IsolateController
              };
            });
            directive('nonIsolate', function () {
              return {
                require: 'isolate',
                link: function (_, __, ___, isolateDirController) {
                  isolateDirControllerInNonIsolateDirective = isolateDirController;
                }
              };
            });
          });

          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest('<div isolate non-isolate></div>');

            expect(isolateDirControllerInNonIsolateDirective).toBeDefined();
            expect(isolateDirControllerInNonIsolateDirective instanceof IsolateController).toBe(true);
          });
        });


        it('should give the isolate scope to the controller of another replaced directives in the template', function () {
          angular.mock.module(function () {
            directive('testDirective', function () {
              return {
                replace: true,
                restrict: 'E',
                scope: {},
                template: '<input type="checkbox" ng-model="model">'
              };
            });
          });

          angular.mock.inject(function () {
            compile('<div><test-directive></test-directive></div>');

            element = element.children().eq(0);
            expect(element[0].checked).toBe(false);
            element.isolateScope().model = true;
            $rootScope.$digest();
            expect(element[0].checked).toBe(true);
          });
        });


        it('should share isolate scope with replaced directives (template)', function () {
          var normalScope;
          var isolateScope;

          angular.mock.module(function () {
            directive('isolate', function () {
              return {
                replace: true,
                scope: {},
                template: '<span ng-init="name=\'WORKS\'">{{name}}</span>',
                link: function (s) {
                  isolateScope = s;
                }
              };
            });
            directive('nonIsolate', function () {
              return {
                link: function (s) {
                  normalScope = s;
                }
              };
            });
          });

          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest('<div isolate non-isolate></div>');

            expect(normalScope).toBe;
            expect(normalScope.name).toEqual(undefined);
            expect(isolateScope.name).toEqual('WORKS');
            $rootScope.$digest();
            expect(element.text()).toEqual('WORKS');
          });
        });


        it('should share isolate scope with replaced directives (templateUrl)', function () {
          var normalScope;
          var isolateScope;

          angular.mock.module(function () {
            directive('isolate', function () {
              return {
                replace: true,
                scope: {},
                templateUrl: 'main.html',
                link: function (s) {
                  isolateScope = s;
                }
              };
            });
            directive('nonIsolate', function () {
              return {
                link: function (s) {
                  normalScope = s;
                }
              };
            });
          });

          angular.mock.inject(function ($compile, $rootScope, $templateCache) {
            $templateCache.put('main.html', '<span ng-init="name=\'WORKS\'">{{name}}</span>');
            element = compileForTest('<div isolate non-isolate></div>');
            $rootScope.$apply();

            expect(normalScope).toBe;
            expect(normalScope.name).toEqual(undefined);
            expect(isolateScope.name).toEqual('WORKS');
            expect(element.text()).toEqual('WORKS');
          });
        });


        it('should not get confused about where to use isolate scope when a replaced directive is used multiple times',
          function () {

            angular.mock.module(function () {
              directive('isolate', function () {
                return {
                  replace: true,
                  scope: {},
                  template: '<span scope-tester="replaced"><span scope-tester="inside"></span></span>'
                };
              });
              directive('scopeTester', function (log) {
                return {
                  link: function ($scope, $element) {
                    log($element.attr('scope-tester') + '=' + ($scope.$root === $scope ? 'non-isolate' : 'isolate'));
                  }
                };
              });
            });

            angular.mock.inject(function ($compile, $rootScope, log) {
              element = compileForTest('<div>' +
                '<div isolate scope-tester="outside"></div>' +
                '<span scope-tester="sibling"></span>' +
                '</div>');

              $rootScope.$digest();
              expect(log).toEqual('inside=isolate; ' +
                'outside replaced=non-isolate; ' + // outside
                'outside replaced=isolate; ' + // replaced
                'sibling=non-isolate');
            });
          });


        it('should require controller of a non-isolate directive from an isolate directive on the ' +
          'same element', function () {
          var NonIsolateController = function () {
          };
          var nonIsolateDirControllerInIsolateDirective;

          angular.mock.module(function () {
            directive('isolate', function () {
              return {
                scope: {},
                require: 'nonIsolate',
                link: function (_, __, ___, nonIsolateDirController) {
                  nonIsolateDirControllerInIsolateDirective = nonIsolateDirController;
                }
              };
            });
            directive('nonIsolate', function () {
              return {
                controller: NonIsolateController
              };
            });
          });

          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest('<div isolate non-isolate></div>');

            expect(nonIsolateDirControllerInIsolateDirective).toBeDefined();
            expect(nonIsolateDirControllerInIsolateDirective instanceof NonIsolateController).toBe(true);
          });
        });


        it('should support controllerAs', function () {
          angular.mock.module(function () {
            directive('main', function () {
              return {
                templateUrl: 'main.html',
                transclude: true,
                scope: {},
                controller: function () {
                  this.name = 'lucas';
                },
                controllerAs: 'mainCtrl'
              };
            });
          });
          angular.mock.inject(function ($templateCache, $compile, $rootScope) {
            $templateCache.put('main.html', '<span>template:{{mainCtrl.name}} <div ng-transclude></div></span>');
            element = compileForTest('<div main>transclude:{{mainCtrl.name}}</div>');
            $rootScope.$apply();
            expect(element.text()).toBe('template:lucas transclude:');
          });
        });


        it('should support controller alias', function () {
          angular.mock.module(function ($controllerProvider) {
            $controllerProvider.register('MainCtrl', function () {
              this.name = 'lucas';
            });
            directive('main', function () {
              return {
                templateUrl: 'main.html',
                scope: {},
                controller: 'MainCtrl as mainCtrl'
              };
            });
          });
          angular.mock.inject(function ($templateCache, $compile, $rootScope) {
            $templateCache.put('main.html', '<span>{{mainCtrl.name}}</span>');
            element = compileForTest('<div main></div>');
            $rootScope.$apply();
            expect(element.text()).toBe('lucas');
          });
        });


        it('should require controller on parent element', function () {
          angular.mock.module(function () {
            directive('main', function (log) {
              return {
                controller: function () {
                  this.name = 'main';
                }
              };
            });
            directive('dep', function (log) {
              return {
                require: '^main',
                link: function (scope, element, attrs, controller) {
                  log('dep:' + controller.name);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<div main><div dep></div></div>');
            expect(log).toEqual('dep:main');
          });
        });


        it('should throw an error if required controller can\'t be found', function () {
          angular.mock.module(function () {
            directive('dep', function (log) {
              return {
                require: '^main',
                link: function (scope, element, attrs, controller) {
                  log('dep:' + controller.name);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            expect(function () {
              compileForTest('<div main><div dep></div></div>');
            }).toThrowMinErr('$compile', 'ctreq', 'Controller \'main\', required by directive \'dep\', can\'t be found!');
          });
        });


        it('should pass null if required controller can\'t be found and is optional', function () {
          angular.mock.module(function () {
            directive('dep', function (log) {
              return {
                require: '?^main',
                link: function (scope, element, attrs, controller) {
                  log('dep:' + controller);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            compileForTest('<div main><div dep></div></div>');
            expect(log).toEqual('dep:null');
          });
        });


        it('should pass null if required controller can\'t be found and is optional with the question mark on the right', function () {
          angular.mock.module(function () {
            directive('dep', function (log) {
              return {
                require: '^?main',
                link: function (scope, element, attrs, controller) {
                  log('dep:' + controller);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            compileForTest('<div main><div dep></div></div>');
            expect(log).toEqual('dep:null');
          });
        });


        it('should have optional controller on current element', function () {
          angular.mock.module(function () {
            directive('dep', function (log) {
              return {
                require: '?main',
                link: function (scope, element, attrs, controller) {
                  log('dep:' + !!controller);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<div main><div dep></div></div>');
            expect(log).toEqual('dep:false');
          });
        });


        it('should support multiple controllers', function () {
          angular.mock.module(function () {
            directive('c1', ngInternals.valueFn({
              controller: function () {
                this.name = 'c1';
              }
            }));
            directive('c2', ngInternals.valueFn({
              controller: function () {
                this.name = 'c2';
              }
            }));
            directive('dep', function (log) {
              return {
                require: ['^c1', '^c2'],
                link: function (scope, element, attrs, controller) {
                  log('dep:' + controller[0].name + '-' + controller[1].name);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<div c1 c2><div dep></div></div>');
            expect(log).toEqual('dep:c1-c2');
          });
        });

        it('should support multiple controllers as an object hash', function () {
          angular.mock.module(function () {
            directive('c1', ngInternals.valueFn({
              controller: function () {
                this.name = 'c1';
              }
            }));
            directive('c2', ngInternals.valueFn({
              controller: function () {
                this.name = 'c2';
              }
            }));
            directive('dep', function (log) {
              return {
                require: { myC1: '^c1', myC2: '^c2' },
                link: function (scope, element, attrs, controllers) {
                  log('dep:' + controllers.myC1.name + '-' + controllers.myC2.name);
                }
              };
            });
          });
          angular.mock.inject(function (log, $compile, $rootScope) {
            element = compileForTest('<div c1 c2><div dep></div></div>');
            expect(log).toEqual('dep:c1-c2');
          });
        });

        it('should support omitting the name of the required controller if it is the same as the key',
          function () {
            angular.mock.module(function () {
              directive('myC1', ngInternals.valueFn({
                controller: function () {
                  this.name = 'c1';
                }
              }));
              directive('myC2', ngInternals.valueFn({
                controller: function () {
                  this.name = 'c2';
                }
              }));
              directive('dep', function (log) {
                return {
                  require: { myC1: '^', myC2: '^' },
                  link: function (scope, element, attrs, controllers) {
                    log('dep:' + controllers.myC1.name + '-' + controllers.myC2.name);
                  }
                };
              });
            });
            angular.mock.inject(function (log, $compile, $rootScope) {
              element = compileForTest('<div my-c1 my-c2><div dep></div></div>');
              expect(log).toEqual('dep:c1-c2');
            });
          }
        );

        it('should instantiate the controller just once when template/templateUrl', function () {
          var syncCtrlSpy = jest.fn(),
            asyncCtrlSpy = jest.fn();

          angular.mock.module(function () {
            directive('myDirectiveSync', ngInternals.valueFn({
              template: '<div>Hello!</div>',
              controller: syncCtrlSpy
            }));
            directive('myDirectiveAsync', ngInternals.valueFn({
              templateUrl: 'myDirectiveAsync.html',
              controller: asyncCtrlSpy,
              compile: function () {
                return function () {
                };
              }
            }));
          });

          angular.mock.inject(function ($templateCache, $compile, $rootScope) {
            expect(syncCtrlSpy).not.toHaveBeenCalled();
            expect(asyncCtrlSpy).not.toHaveBeenCalled();

            $templateCache.put('myDirectiveAsync.html', '<div>Hello!</div>');
            element = compileForTest('<div>' +
              '<span xmy-directive-sync></span>' +
              '<span my-directive-async></span>' +
              '</div>');
            expect(syncCtrlSpy).not.toHaveBeenCalled();
            expect(asyncCtrlSpy).not.toHaveBeenCalled();

            $rootScope.$apply();

            //expect(syncCtrlSpy).toHaveBeenCalledTimes(1);
            expect(asyncCtrlSpy).toHaveBeenCalledTimes(1);
          });
        });


        it('should instantiate controllers in the parent->child order when transclusion, templateUrl and replacement ' +
          'are in the mix', function () {
          // When a child controller is in the transclusion that replaces the parent element that has a directive with
          // a controller, we should ensure that we first instantiate the parent and only then stuff that comes from the
          // transclusion.
          //
          // The transclusion moves the child controller onto the same element as parent controller so both controllers are
          // on the same level.

          angular.mock.module(function () {
            directive('parentDirective', function () {
              return {
                transclude: true,
                replace: true,
                templateUrl: 'parentDirective.html',
                controller: function (log) {
                  log('parentController');
                }
              };
            });
            directive('childDirective', function () {
              return {
                require: '^parentDirective',
                templateUrl: 'childDirective.html',
                controller: function (log) {
                  log('childController');
                }
              };
            });
          });

          angular.mock.inject(function ($templateCache, log, $compile, $rootScope) {
            $templateCache.put('parentDirective.html', '<div ng-transclude>parentTemplateText;</div>');
            $templateCache.put('childDirective.html', '<span>childTemplateText;</span>');

            element = compileForTest('<div parent-directive><div child-directive></div>childContentText;</div>');
            $rootScope.$apply();
            expect(log).toEqual('parentController; childController');
            expect(element.text()).toBe('childTemplateText;childContentText;');
          });
        });


        it('should instantiate the controller after the isolate scope bindings are initialized (with template)', function () {
          angular.mock.module(function () {
            var Ctrl = function ($scope, log) {
              log('myFoo=' + $scope.myFoo);
            };

            directive('myDirective', function () {
              return {
                scope: {
                  myFoo: '='
                },
                template: '<p>Hello</p>',
                controller: Ctrl
              };
            });
          });

          angular.mock.inject(function ($templateCache, $compile, $rootScope, log) {
            $rootScope.foo = 'bar';

            element = compileForTest('<div my-directive my-foo="foo"></div>');
            $rootScope.$apply();
            expect(log).toEqual('myFoo=bar');
          });
        });


        it('should instantiate the controller after the isolate scope bindings are initialized (with templateUrl)', function () {
          angular.mock.module(function () {
            var Ctrl = function ($scope, log) {
              log('myFoo=' + $scope.myFoo);
            };

            directive('myDirective', function () {
              return {
                scope: {
                  myFoo: '='
                },
                templateUrl: 'hello.html',
                controller: Ctrl
              };
            });
          });

          angular.mock.inject(function ($templateCache, $compile, $rootScope, log) {
            $templateCache.put('hello.html', '<p>Hello</p>');
            $rootScope.foo = 'bar';

            element = compileForTest('<div my-directive my-foo="foo"></div>');
            $rootScope.$apply();
            expect(log).toEqual('myFoo=bar');
          });
        });


        it('should instantiate controllers in the parent->child->baby order when nested transclusion, templateUrl and ' +
          'replacement are in the mix', function () {
          // similar to the test above, except that we have one more layer of nesting and nested transclusion

          angular.mock.module(function () {
            directive('parentDirective', function () {
              return {
                transclude: true,
                replace: true,
                templateUrl: 'parentDirective.html',
                controller: function (log) {
                  log('parentController');
                }
              };
            });
            directive('childDirective', function () {
              return {
                require: '^parentDirective',
                transclude: true,
                replace: true,
                templateUrl: 'childDirective.html',
                controller: function (log) {
                  log('childController');
                }
              };
            });
            directive('babyDirective', function () {
              return {
                require: '^childDirective',
                templateUrl: 'babyDirective.html',
                controller: function (log) {
                  log('babyController');
                }
              };
            });
          });

          angular.mock.inject(function ($templateCache, log, $compile, $rootScope) {
            $templateCache.put('parentDirective.html', '<div ng-transclude>parentTemplateText;</div>');
            $templateCache.put('childDirective.html', '<span ng-transclude>childTemplateText;</span>');
            $templateCache.put('babyDirective.html', '<span>babyTemplateText;</span>');

            element = compileForTest('<div parent-directive>' +
              '<div child-directive>' +
              'childContentText;' +
              '<div baby-directive>babyContent;</div>' +
              '</div>' +
              '</div>');
            $rootScope.$apply();
            expect(log).toEqual('parentController; childController; babyController');
            expect(element.text()).toBe('childContentText;babyTemplateText;');
          });
        });


        it('should allow controller usage in pre-link directive functions with templateUrl', function () {
          angular.mock.module(function () {
            var Ctrl = function (log) {
              log('instance');
            };

            directive('myDirective', function () {
              return {
                scope: true,
                templateUrl: 'hello.html',
                controller: Ctrl,
                compile: function () {
                  return {
                    pre: function (scope, template, attr, ctrl) {
                    },
                    post: function () {
                    }
                  };
                }
              };
            });
          });

          angular.mock.inject(function ($templateCache, $compile, $rootScope, log) {
            $templateCache.put('hello.html', '<p>Hello</p>');

            element = compileForTest('<div my-directive></div>');
            $rootScope.$apply();

            expect(log).toEqual('instance');
            expect(element.text()).toBe('Hello');
          });
        });


        it('should allow controller usage in pre-link directive functions with a template', function () {
          angular.mock.module(function () {
            var Ctrl = function (log) {
              log('instance');
            };

            directive('myDirective', function () {
              return {
                scope: true,
                template: '<p>Hello</p>',
                controller: Ctrl,
                compile: function () {
                  return {
                    pre: function (scope, template, attr, ctrl) {
                    },
                    post: function () {
                    }
                  };
                }
              };
            });
          });

          angular.mock.inject(function ($templateCache, $compile, $rootScope, log) {
            element = compileForTest('<div my-directive></div>');
            $rootScope.$apply();

            expect(log).toEqual('instance');
            expect(element.text()).toBe('Hello');
          });
        });


        it('should throw ctreq with correct directive name, regardless of order', function () {
          angular.mock.module(function ($compileProvider) {
            $compileProvider.directive('aDir', ngInternals.valueFn({
              restrict: 'E',
              require: 'ngModel',
              link: angular.noop
            }));
          });
          angular.mock.inject(function ($compile, $rootScope) {
            expect(function () {
              // a-dir will cause a ctreq error to be thrown. Previously, the error would reference
              // the last directive in the chain (which in this case would be ngClick), based on
              // priority and alphabetical ordering. This test verifies that the ordering does not
              // affect which directive is referenced in the minErr message.
              element = compileForTest('<a-dir ng-click="foo=bar"></a-dir>');
            }).toThrowMinErr('$compile', 'ctreq',
              'Controller \'ngModel\', required by directive \'aDir\', can\'t be found!');
          });
        });
      });


      describe('transclude', function () {

        describe('content transclusion', function () {

          it('should support transclude directive', function () {
            angular.mock.module(function () {
              directive('trans', function () {
                return {
                  transclude: 'content',
                  replace: true,
                  scope: {},
                  link: function (scope) {
                    scope.x = 'iso';
                  },
                  template: '<ul><li>W:{{x}}-{{$parent.$id}}-{{$id}};</li><li ng-transclude></li></ul>'
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div><div trans>T:{{x}}-{{$parent.$id}}-{{$id}}<span>;</span></div></div>');
              $rootScope.x = 'root';
              $rootScope.$apply();
              expect(element.text()).toEqual('W:iso-1-2;T:root-2-3;');
              expect(angular.element(angular.element(element.find('li')[1]).contents()[0]).text()).toEqual('T:root-2-3');
              expect(angular.element(element.find('span')[0]).text()).toEqual(';');
            });
          });


          it('should transclude transcluded content', function () {
            angular.mock.module(function () {
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
              return function ($httpBackend) {
                $httpBackend.expect('GET', 'chapter.html').respond('<div>chapter-<div section>[<div ng-transclude></div>]</div></div>');
              };
            });
            angular.mock.inject(function (log, $rootScope, $compile, $httpBackend) {
              element = compileForTest('<div><div book>paragraph</div></div>');
              $rootScope.$apply();

              expect(element.text()).toEqual('book-');

              $httpBackend.flush();
              $rootScope.$apply();
              expect(element.text()).toEqual('book-chapter-section-![(paragraph)]!');
            });
          });


          it('should compile directives with lower priority than ngTransclude', function () {
            var ngTranscludePriority;
            var lowerPriority = -1;

            angular.mock.module(function ($provide) {
              $provide.decorator('ngTranscludeDirective', function ($delegate) {
                ngTranscludePriority = $delegate[0].priority;
                return $delegate;
              });

              directive('lower', function (log) {
                return {
                  priority: lowerPriority,
                  link: {
                    pre: function () {
                      log('pre');
                    },
                    post: function () {
                      log('post');
                    }
                  }
                };
              });
              directive('trans', function (log) {
                return {
                  transclude: true,
                  template: '<div lower ng-transclude></div>'
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div trans><span>transcluded content</span></div>');

              expect(lowerPriority).toBeLessThan(ngTranscludePriority);

              $rootScope.$apply();

              expect(element.text()).toEqual('transcluded content');
              expect(log).toEqual('pre; post');
            });
          });


          it('should not merge text elements from transcluded content', function () {
            angular.mock.module(function () {
              directive('foo', ngInternals.valueFn({
                transclude: 'content',
                template: '<div>This is before {{before}}. </div>',
                link: function (scope, element, attr, ctrls, $transclude) {
                  var futureParent = element.children().eq(0);
                  $transclude(function (clone) {
                    futureParent.append(clone);
                  }, futureParent);
                },
                scope: true
              }));
            });
            angular.mock.inject(function ($rootScope, $compile) {
              element = compileForTest('<div><div foo>This is after {{after}}</div></div>');
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


          it('should only allow one content transclusion per element', function () {
            angular.mock.module(function () {
              directive('first', ngInternals.valueFn({
                transclude: true
              }));
              directive('second', ngInternals.valueFn({
                transclude: true
              }));
            });
            angular.mock.inject(function ($compile) {
              expect(function () {
                compileForTest('<div first="" second=""></div>');
              }).toThrowMinErr('$compile', 'multidir', /Multiple directives \[first, second] asking for transclusion on: <div .+/);
            });
          });

          //see issue https://github.com/angular/angular.js/issues/12936
          it('should use the proper scope when it is on the root element of a replaced directive template', function () {
            angular.mock.module(function () {
              directive('isolate', ngInternals.valueFn({
                scope: {},
                replace: true,
                template: '<div trans>{{x}}</div>',
                link: function (scope, element, attr, ctrl) {
                  scope.x = 'iso';
                }
              }));
              directive('trans', ngInternals.valueFn({
                transclude: 'content',
                link: function (scope, element, attr, ctrl, $transclude) {
                  $transclude(function (clone) {
                    element.append(clone);
                  });
                }
              }));
            });
            angular.mock.inject(function ($rootScope, $compile) {
              element = compileForTest('<isolate></isolate>');
              $rootScope.x = 'root';
              $rootScope.$apply();
              expect(element.text()).toEqual('iso');
            });
          });


          //see issue https://github.com/angular/angular.js/issues/12936
          it('should use the proper scope when it is on the root element of a replaced directive template with child scope', function () {
            angular.mock.module(function () {
              directive('child', ngInternals.valueFn({
                scope: true,
                replace: true,
                template: '<div trans>{{x}}</div>',
                link: function (scope, element, attr, ctrl) {
                  scope.x = 'child';
                }
              }));
              directive('trans', ngInternals.valueFn({
                transclude: 'content',
                link: function (scope, element, attr, ctrl, $transclude) {
                  $transclude(function (clone) {
                    element.append(clone);
                  });
                }
              }));
            });
            angular.mock.inject(function ($rootScope, $compile) {
              element = compileForTest('<child></child>');
              $rootScope.x = 'root';
              $rootScope.$apply();
              expect(element.text()).toEqual('child');
            });
          });

          it('should throw if a transcluded node is transcluded again', function () {
            angular.mock.module(function () {
              directive('trans', ngInternals.valueFn({
                transclude: true,
                link: function (scope, element, attr, ctrl, $transclude) {
                  $transclude();
                  $transclude();
                }
              }));
            });
            angular.mock.inject(function ($rootScope, $compile) {
              expect(function () {
                compileForTest('<trans></trans>');
              }).toThrowMinErr('$compile', 'multilink', 'This element has already been linked.');
            });
          });

          it('should not leak if two "element" transclusions are on the same element (with debug info)', function () {
            angular.mock.module(function ($compileProvider) {
              $compileProvider.debugInfoEnabled(true);
            });

            angular.mock.inject(function ($compile, $rootScope) {
              var cacheSize = jqLiteCacheSize();
              element = compileForTest('<div><div ng-repeat="x in xs" ng-if="x==1">{{x}}</div></div>');
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


          it('should not leak if two "element" transclusions are on the same element (without debug info)', function () {
            angular.mock.module(function ($compileProvider) {
              $compileProvider.debugInfoEnabled(false);
            });

            angular.mock.inject(function ($compile, $rootScope) {
              var cacheSize = jqLiteCacheSize();

              element = compileForTest('<div><div ng-repeat="x in xs" ng-if="x==1">{{x}}</div></div>');
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


          it('should not leak if two "element" transclusions are on the same element (with debug info)', function () {
            angular.mock.module(function ($compileProvider) {
              $compileProvider.debugInfoEnabled(true);
            });

            angular.mock.inject(function ($compile, $rootScope) {
              var cacheSize = jqLiteCacheSize();
              element = compileForTest('<div><div ng-repeat="x in xs" ng-if="val">{{x}}</div></div>');

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

          it('should not leak when continuing the compilation of elements on a scope that was destroyed', function () {
            var linkFn = jest.fn();

            angular.mock.module(function ($controllerProvider, $compileProvider) {
              $controllerProvider.register('Leak', function ($scope, $timeout) {
                $scope.code = 'red';
                $timeout(function () {
                  $scope.code = 'blue';
                });
              });
              $compileProvider.directive('isolateRed', function () {
                return {
                  restrict: 'A',
                  scope: {},
                  template: '<div red></div>'
                };
              });
              $compileProvider.directive('red', function () {
                return {
                  restrict: 'A',
                  templateUrl: 'red.html',
                  scope: {},
                  link: linkFn
                };
              });
            });

            angular.mock.inject(function ($compile, $rootScope, $httpBackend, $timeout, $templateCache) {
              var cacheSize = jqLiteCacheSize();
              $httpBackend.whenGET('red.html').respond('<p>red.html</p>');
              var template = generateTestCompiler(
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


          describe('cleaning up after a replaced element', function () {
            var $compile, xs;
            beforeEach(angular.mock.inject(function (_$compile_) {
              $compile = _$compile_;
              xs = [0, 1];
            }));

            function testCleanup() {
              var privateData, firstRepeatedElem;

              element = compileForTest('<div><div ng-repeat="x in xs" ng-click="noop()">{{x}}</div></div>');

              $rootScope.$apply('xs = [' + xs + ']');
              firstRepeatedElem = element.children('.ng-scope').eq(0);

              expect(firstRepeatedElem.data('$scope')).toBeDefined();
              privateData = angular.element._data(firstRepeatedElem[0]);
              expect(privateData.events).toBeDefined();
              expect(privateData.events.click).toBeDefined();
              expect(privateData.events.click[0]).toBeDefined();

              //Ensure the AngularJS $destroy event is still sent
              var destroyCount = 0;
              element.find('div').on('$destroy', function () {
                destroyCount++;
              });

              $rootScope.$apply('xs = null');

              expect(destroyCount).toBe(2);
              expect(firstRepeatedElem.data('$scope')).not.toBeDefined();
              privateData = angular.element._data(firstRepeatedElem[0]);
              expect(privateData && privateData.events).not.toBeDefined();
            }

            it('should work without external libraries (except jQuery)', testCleanup);

            it('should work with another library patching jqLite/jQuery.cleanData after AngularJS', function () {
              var cleanedCount = 0;
              var currentCleanData = angular.element.cleanData;
              angular.element.cleanData = function (elems) {
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


          it('should add a $$transcluded property onto the transcluded scope', function () {
            angular.mock.module(function () {
              directive('trans', function () {
                return {
                  transclude: true,
                  replace: true,
                  scope: true,
                  template: '<div><span>I:{{$$transcluded}}</span><span ng-transclude></span></div>'
                };
              });
            });
            angular.mock.inject(function ($rootScope, $compile) {
              element = compileForTest('<div><div trans>T:{{$$transcluded}}</div></div>');
              $rootScope.$apply();
              expect(angular.element(element.find('span')[0]).text()).toEqual('I:');
              expect(angular.element(element.find('span')[1]).text()).toEqual('T:true');
            });
          });


          it('should clear contents of the ng-transclude element before appending transcluded content' +
            ' if transcluded content exists', function () {
            angular.mock.module(function () {
              directive('trans', function () {
                return {
                  transclude: true,
                  template: '<div ng-transclude>old stuff!</div>'
                };
              });
            });
            angular.mock.inject(function ($rootScope, $compile) {
              element = compileForTest('<div trans>unicorn!</div>');
              $rootScope.$apply();
              expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">unicorn!</div>');
            });
          });

          it('should NOT clear contents of the ng-transclude element before appending transcluded content' +
            ' if transcluded content does NOT exist', function () {
            angular.mock.module(function () {
              directive('trans', function () {
                return {
                  transclude: true,
                  template: '<div ng-transclude>old stuff!</div>'
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div trans></div>');
              $rootScope.$apply();
              expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">old stuff!</div>');
            });
          });


          it('should clear the fallback content from the element during compile and before linking', function () {
            angular.mock.module(function () {
              directive('trans', function () {
                return {
                  transclude: true,
                  template: '<div ng-transclude>fallback content</div>'
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = angular.element('<div trans></div>');
              toDealoc.push(element);
              var linkfn = generateTestCompiler(element);
              expect(element.html()).toEqual('<div ng-transclude=""></div>');
              linkfn($rootScope);
              $rootScope.$apply();
              expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">fallback content</div>');
            });
          });


          it('should allow cloning of the fallback via ngRepeat', function () {
            angular.mock.module(function () {
              directive('trans', function () {
                return {
                  transclude: true,
                  template: '<div ng-repeat="i in [0,1,2]"><div ng-transclude>{{i}}</div></div>'
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div trans></div>');
              $rootScope.$apply();
              expect(element.text()).toEqual('012');
            });
          });


          it('should not link the fallback content if transcluded content is provided', function () {
            var linkSpy = jest.fn();

            angular.mock.module(function () {
              directive('inner', function () {
                return {
                  restrict: 'E',
                  template: 'old stuff! ',
                  link: linkSpy
                };
              });

              directive('trans', function () {
                return {
                  transclude: true,
                  template: '<div ng-transclude><inner></inner></div>'
                };
              });
            });
            angular.mock.inject(function ($rootScope, $compile) {
              element = compileForTest('<div trans>unicorn!</div>');
              $rootScope.$apply();
              expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">unicorn!</div>');
              expect(linkSpy).not.toHaveBeenCalled();
            });
          });

          it('should compile and link the fallback content if no transcluded content is provided', function () {
            var linkSpy = jest.fn();

            angular.mock.module(function () {
              directive('inner', function () {
                return {
                  restrict: 'E',
                  template: 'old stuff! ',
                  link: linkSpy
                };
              });

              directive('trans', function () {
                return {
                  transclude: true,
                  template: '<div ng-transclude><inner></inner></div>'
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div trans></div>');
              $rootScope.$apply();
              expect(sortedHtml(element.html())).toEqual('<div ng-transclude=""><inner>old stuff! </inner></div>');
              expect(linkSpy).toHaveBeenCalled();
            });
          });

          it('should compile and link the fallback content if only whitespace transcluded content is provided', function () {
            var linkSpy = jest.fn();

            angular.mock.module(function () {
              directive('inner', function () {
                return {
                  restrict: 'E',
                  template: 'old stuff! ',
                  link: linkSpy
                };
              });

              directive('trans', function () {
                return {
                  transclude: true,
                  template: '<div ng-transclude><inner></inner></div>'
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div trans>\n  \n</div>');
              $rootScope.$apply();
              expect(sortedHtml(element.html())).toEqual('<div ng-transclude=""><inner>old stuff! </inner></div>');
              expect(linkSpy).toHaveBeenCalled();
            });
          });

          it('should not link the fallback content if only whitespace and comments are provided as transclude content', function () {
            var linkSpy = jest.fn();

            angular.mock.module(function () {
              directive('inner', function () {
                return {
                  restrict: 'E',
                  template: 'old stuff! ',
                  link: linkSpy
                };
              });

              directive('trans', function () {
                return {
                  transclude: true,
                  template: '<div ng-transclude><inner></inner></div>'
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div trans>\n<!-- some comment -->  \n</div>');
              $rootScope.$apply();
              expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">\n<!-- some comment -->  \n</div>');
              expect(linkSpy).not.toHaveBeenCalled();
            });
          });

          it('should compile and link the fallback content if an optional transclusion slot is not provided', function () {
            var linkSpy = jest.fn();

            angular.mock.module(function () {
              directive('inner', function () {
                return {
                  restrict: 'E',
                  template: 'old stuff! ',
                  link: linkSpy
                };
              });

              directive('trans', function () {
                return {
                  transclude: { optionalSlot: '?optional' },
                  template: '<div ng-transclude="optionalSlot"><inner></inner></div>'
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div trans></div>');
              $rootScope.$apply();
              expect(sortedHtml(element.html())).toEqual('<div ng-transclude="optionalSlot"><inner>old stuff! </inner></div>');
              expect(linkSpy).toHaveBeenCalled();
            });
          });

          it('should cope if there is neither transcluded content nor fallback content', function () {
            angular.mock.module(function () {
              directive('trans', function () {
                return {
                  transclude: true,
                  template: '<div ng-transclude></div>'
                };
              });
            });
            angular.mock.inject(function ($rootScope, $compile) {
              element = compileForTest('<div trans></div>');
              $rootScope.$apply();
              expect(sortedHtml(element.html())).toEqual('<div ng-transclude=""></div>');
            });
          });

          it('should throw on an ng-transclude element inside no transclusion directive', function () {
            angular.mock.inject(function ($rootScope, $compile) {
              var error;

              try {
                compileForTest('<div><div ng-transclude></div></div>');
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


          it('should not pass transclusion into a template directive when the directive didn\'t request transclusion', function () {

            angular.mock.module(function ($compileProvider) {

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

            angular.mock.inject(function ($compile, $rootScope) {
              expect(function () {
                compileForTest('<div trans-foo>content</div>');
              }).toThrowMinErr('ngTransclude', 'orphan',
                'Illegal use of ngTransclude directive in the template! No parent directive that requires a transclusion found. Element: <div class="bar" ng-transclude="">');
            });
          });


          it('should not pass transclusion into a templateUrl directive', function () {

            angular.mock.module(function ($compileProvider) {

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

            angular.mock.inject(function ($compile, $rootScope, $templateCache) {
              $templateCache.put('noTransBar.html',
                '<div>' +
                // This ng-transclude is invalid. It should throw an error.
                '<div class="bar" ng-transclude></div>' +
                '</div>');

              expect(function () {
                element = compileForTest('<div trans-foo>content</div>');
                $rootScope.$digest();
              }).toThrowMinErr('ngTransclude', 'orphan',
                'Illegal use of ngTransclude directive in the template! ' +
                'No parent directive that requires a transclusion found. ' +
                'Element: <div class="bar" ng-transclude="">');
            });
          });


          it('should expose transcludeFn in compile fn even for templateUrl', function () {
            angular.mock.module(function () {
              directive('transInCompile', ngInternals.valueFn({
                transclude: true,
                // template: '<div class="foo">whatever</div>',
                templateUrl: 'foo.html',
                compile: function (_, __, transclude) {
                  return function (scope, element) {
                    transclude(scope, function (clone, scope) {
                      element.html('');
                      element.append(clone);
                    });
                  };
                }
              }));
            });

            angular.mock.inject(function ($compile, $rootScope, $templateCache) {
              $templateCache.put('foo.html', '<div class="foo">whatever</div>');

              compile('<div trans-in-compile>transcluded content</div>');
              $rootScope.$apply();

              expect(ngInternals.trim(element.text())).toBe('transcluded content');
            });
          });


          it('should make the result of a transclusion available to the parent directive in post-linking phase' +
            '(template)', function () {
            angular.mock.module(function () {
              directive('trans', function (log) {
                return {
                  transclude: true,
                  template: '<div ng-transclude></div>',
                  link: {
                    pre: function ($scope, $element) {
                      log('pre(' + $element.text() + ')');
                    },
                    post: function ($scope, $element) {
                      log('post(' + $element.text() + ')');
                    }
                  }
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div trans><span>unicorn!</span></div>');
              $rootScope.$apply();
              expect(log).toEqual('pre(); post(unicorn!)');
            });
          });


          it('should make the result of a transclusion available to the parent directive in post-linking phase' +
            '(templateUrl)', function () {
            // when compiling an async directive the transclusion is always processed before the directive
            // this is different compared to sync directive. delaying the transclusion makes little sense.

            angular.mock.module(function () {
              directive('trans', function (log) {
                return {
                  transclude: true,
                  templateUrl: 'trans.html',
                  link: {
                    pre: function ($scope, $element) {
                      log('pre(' + $element.text() + ')');
                    },
                    post: function ($scope, $element) {
                      log('post(' + $element.text() + ')');
                    }
                  }
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile, $templateCache) {
              $templateCache.put('trans.html', '<div ng-transclude></div>');

              element = compileForTest('<div trans><span>unicorn!</span></div>');
              $rootScope.$apply();
              expect(log).toEqual('pre(); post(unicorn!)');
            });
          });


          it('should make the result of a transclusion available to the parent *replace* directive in post-linking phase' +
            '(template)', function () {
            angular.mock.module(function () {
              directive('replacedTrans', function (log) {
                return {
                  transclude: true,
                  replace: true,
                  template: '<div ng-transclude></div>',
                  link: {
                    pre: function ($scope, $element) {
                      log('pre(' + $element.text() + ')');
                    },
                    post: function ($scope, $element) {
                      log('post(' + $element.text() + ')');
                    }
                  }
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div replaced-trans><span>unicorn!</span></div>');
              $rootScope.$apply();
              expect(log).toEqual('pre(); post(unicorn!)');
            });
          });


          it('should make the result of a transclusion available to the parent *replace* directive in post-linking phase' +
            ' (templateUrl)', function () {
            angular.mock.module(function () {
              directive('replacedTrans', function (log) {
                return {
                  transclude: true,
                  replace: true,
                  templateUrl: 'trans.html',
                  link: {
                    pre: function ($scope, $element) {
                      log('pre(' + $element.text() + ')');
                    },
                    post: function ($scope, $element) {
                      log('post(' + $element.text() + ')');
                    }
                  }
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile, $templateCache) {
              $templateCache.put('trans.html', '<div ng-transclude></div>');

              element = compileForTest('<div replaced-trans><span>unicorn!</span></div>');
              $rootScope.$apply();
              expect(log).toEqual('pre(); post(unicorn!)');
            });
          });

          it('should copy the directive controller to all clones', function () {
            var transcludeCtrl, cloneCount = 2;
            angular.mock.module(function () {
              directive('transclude', ngInternals.valueFn({
                transclude: 'content',
                controller: function ($transclude) {
                  transcludeCtrl = this;
                },
                link: function (scope, el, attr, ctrl, $transclude) {
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
            angular.mock.inject(function ($compile) {
              element = compileForTest('<div transclude><span></span></div>');
              var children = element.children(), i;
              expect(transcludeCtrl).toBeDefined();

              expect(element.data('$transcludeController')).toBe(transcludeCtrl);
              for (i = 0; i < cloneCount; i++) {
                expect(children.eq(i).data('$transcludeController')).toBeUndefined();
              }
            });
          });

          it('should provide the $transclude controller local as 5th argument to the pre and post-link function', function () {
            var ctrlTransclude, preLinkTransclude, postLinkTransclude;
            angular.mock.module(function () {
              directive('transclude', ngInternals.valueFn({
                transclude: 'content',
                controller: function ($transclude) {
                  ctrlTransclude = $transclude;
                },
                compile: function () {
                  return {
                    pre: function (scope, el, attr, ctrl, $transclude) {
                      preLinkTransclude = $transclude;
                    },
                    post: function (scope, el, attr, ctrl, $transclude) {
                      postLinkTransclude = $transclude;
                    }
                  };
                }
              }));
            });
            angular.mock.inject(function ($compile) {
              element = compileForTest('<div transclude></div>');
              expect(ctrlTransclude).toBeDefined();
              expect(ctrlTransclude).toBe(preLinkTransclude);
              expect(ctrlTransclude).toBe(postLinkTransclude);
            });
          });

          it('should allow an optional scope argument in $transclude', function () {
            var capturedChildCtrl;
            angular.mock.module(function () {
              directive('transclude', ngInternals.valueFn({
                transclude: 'content',
                link: function (scope, element, attr, ctrl, $transclude) {
                  $transclude(scope, function (clone) {
                    element.append(clone);
                  });
                }
              }));
            });
            angular.mock.inject(function ($compile) {
              element = compileForTest('<div transclude>{{$id}}</div>');
              $rootScope.$apply();
              expect(element.text()).toBe('' + $rootScope.$id);
            });

          });

          it('should expose the directive controller to transcluded children', function () {
            var capturedChildCtrl;
            angular.mock.module(function () {
              directive('transclude', ngInternals.valueFn({
                transclude: 'content',
                controller: function () {
                },
                link: function (scope, element, attr, ctrl, $transclude) {
                  $transclude(function (clone) {
                    element.append(clone);
                  });
                }
              }));
              directive('child', ngInternals.valueFn({
                require: '^transclude',
                link: function (scope, element, attr, ctrl) {
                  capturedChildCtrl = ctrl;
                }
              }));
            });
            angular.mock.inject(function ($compile) {
              element = compileForTest('<div transclude><div child></div></div>');
              expect(capturedChildCtrl).toBeTruthy();
            });
          });


          // See issue https://github.com/angular/angular.js/issues/14924
          it('should not process top-level transcluded text nodes merged into their sibling',
            function () {
              angular.mock.module(function () {
                directive('transclude', ngInternals.valueFn({
                  template: '<ng-transclude></ng-transclude>',
                  transclude: true,
                  scope: {}
                }));
              });

              angular.mock.inject(function ($compile) {
                element = angular.element('<div transclude></div>');
                toDealoc.push(element);
                element[0].appendChild(document.createTextNode('1{{ value }}'));
                element[0].appendChild(document.createTextNode('2{{ value }}'));
                element[0].appendChild(document.createTextNode('3{{ value }}'));

                var initialWatcherCount = $rootScope.$countWatchers();
                compileForTest(element);
                $rootScope.$apply('value = 0');
                var newWatcherCount = $rootScope.$countWatchers() - initialWatcherCount;

                expect(element.text()).toBe('102030');
                expect(newWatcherCount).toBe(3);
              });
            }
          );


          // see issue https://github.com/angular/angular.js/issues/9413
          describe('passing a parent bound transclude function to the link ' +
            'function returned from `$compile`', function () {

            beforeEach(angular.mock.module(function () {
              directive('lazyCompile', function ($compile) {
                return {
                  compile: function (tElement, tAttrs) {
                    var content = tElement.contents();
                    tElement.empty();
                    return function (scope, element, attrs, ctrls, transcludeFn) {
                      element.append(content);
                      compileForTest(content, scope, undefined, {
                        parentBoundTranscludeFn: transcludeFn
                      });
                    };
                  }
                };
              });
              directive('toggle', ngInternals.valueFn({
                scope: { t: '=toggle' },
                transclude: true,
                template: '<div ng-if="t"><lazy-compile><div ng-transclude></div></lazy-compile></div>'
              }));
            }));

            it('should preserve the bound scope', function () {

              angular.mock.inject(function ($compile, $rootScope) {
                element = compileForTest(
                  '<div>' +
                  '<div ng-init="outer=true"></div>' +
                  '<div toggle="t">' +
                  '<span ng-if="outer">Success</span><span ng-if="!outer">Error</span>' +
                  '</div>' +
                  '</div>');

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


            it('should preserve the bound scope when using recursive transclusion', function () {

              directive('recursiveTransclude', ngInternals.valueFn({
                transclude: true,
                template: '<div><lazy-compile><div ng-transclude></div></lazy-compile></div>'
              }));

              angular.mock.inject(function ($compile, $rootScope) {
                element = compileForTest(
                  '<div>' +
                  '<div ng-init="outer=true"></div>' +
                  '<div toggle="t">' +
                  '<div recursive-transclude>' +
                  '<span ng-if="outer">Success</span><span ng-if="!outer">Error</span>' +
                  '</div>' +
                  '</div>' +
                  '</div>');

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
          describe('removing a transcluded element', function () {

            beforeEach(angular.mock.module(function () {
              directive('toggle', function () {
                return {
                  transclude: true,
                  template: '<div ng:if="t"><div ng:transclude></div></div>'
                };
              });
            }));


            it('should not leak the transclude scope when the transcluded content is an element transclusion directive',
              angular.mock.inject(function ($compile, $rootScope) {

                element = compileForTest(
                  '<div toggle>' +
                  '<div ng:repeat="msg in [\'msg-1\']">{{ msg }}</div>' +
                  '</div>'
                );

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


            it('should not leak the transclude scope when the transcluded content is an multi-element transclusion directive',
              angular.mock.inject(function ($compile, $rootScope) {

                element = compileForTest(
                  '<div toggle>' +
                  '<div ng:repeat-start="msg in [\'msg-1\']">{{ msg }}</div>' +
                  '<div ng:repeat-end>{{ msg }}</div>' +
                  '</div>'
                );

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


            it('should not leak the transclude scope if the transcluded contains only comments',
              angular.mock.inject(function ($compile, $rootScope) {

                element = compileForTest(
                  '<div toggle>' +
                  '<!-- some comment -->' +
                  '</div>'
                );

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

            it('should not leak the transclude scope if the transcluded contains only text nodes',
              angular.mock.inject(function ($compile, $rootScope) {

                element = compileForTest(
                  '<div toggle>' +
                  'some text' +
                  '</div>'
                );

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

            it('should mark as destroyed all sub scopes of the scope being destroyed',
              angular.mock.inject(function ($compile, $rootScope) {

                element = compileForTest(
                  '<div toggle>' +
                  '<div ng:repeat="msg in [\'msg-1\']">{{ msg }}</div>' +
                  '</div>'
                );

                $rootScope.$apply('t = true');
                var childScopes = getChildScopes($rootScope);

                $rootScope.$apply('t = false');
                for (var i = 0; i < childScopes.length; ++i) {
                  expect(childScopes[i].$$destroyed).toBe(true);
                }
              }));
          });


          describe('nested transcludes', function () {

            beforeEach(angular.mock.module(function ($compileProvider) {

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

            beforeEach(angular.mock.inject(function ($templateCache) {
              $templateCache.put('async', '<div ng-transclude></div>');
              $templateCache.put('asyncSync', '<div noop><div sync><div ng-transclude></div></div></div>');
              $templateCache.put('asyncAsync', '<div noop><div async><div ng-transclude></div></div></div>');
            }));


            it('should allow nested transclude directives with sync template containing sync template', angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<div sync-sync>transcluded content</div>');
              $rootScope.$digest();
              expect(element.text()).toEqual('transcluded content');
            }));

            it('should allow nested transclude directives with sync template containing async template', angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<div sync-async>transcluded content</div>');
              $rootScope.$digest();
              expect(element.text()).toEqual('transcluded content');
            }));

            it('should allow nested transclude directives with async template containing sync template', angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<div async-sync>transcluded content</div>');
              $rootScope.$digest();
              expect(element.text()).toEqual('transcluded content');
            }));

            it('should allow nested transclude directives with async template containing asynch template', angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<div async-async>transcluded content</div>');
              $rootScope.$digest();
              expect(element.text()).toEqual('transcluded content');
            }));


            it('should not leak memory with nested transclusion', function () {
              angular.mock.inject(function ($compile, $rootScope) {
                var size, initialSize = jqLiteCacheSize();

                element = angular.element('<div><ul><li ng-repeat="n in nums">{{n}} => <i ng-if="0 === n%2">Even</i><i ng-if="1 === n%2">Odd</i></li></ul></div>');
                toDealoc.push(element);
                compileForTest(element, $rootScope.$new());

                $rootScope.nums = [0, 1, 2];
                $rootScope.$apply();
                size = jqLiteCacheSize();

                $rootScope.nums = [3, 4, 5];
                $rootScope.$apply();
                expect(jqLiteCacheSize()).toEqual(size);

                element.remove();
                expect(jqLiteCacheSize()).toEqual(initialSize);
              });
            });
          });


          describe('nested isolated scope transcludes', function () {
            beforeEach(angular.mock.module(function ($compileProvider) {

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

            beforeEach(angular.mock.inject(function ($templateCache) {
              $templateCache.put('transAsync', '<div ng-transclude></div>');
              $templateCache.put('isoAsync', '<trans-async><span ng-transclude></span></trans-async>');
            }));


            it('should pass the outer scope to the transclude on the isolated template sync-sync', angular.mock.inject(function ($compile, $rootScope) {

              $rootScope.val = 'transcluded content';
              element = compileForTest('<iso><span ng-bind="val"></span></iso>');
              $rootScope.$digest();
              expect(element.text()).toEqual('transcluded content');
            }));

            it('should pass the outer scope to the transclude on the isolated template async-sync', angular.mock.inject(function ($compile, $rootScope) {

              $rootScope.val = 'transcluded content';
              element = compileForTest('<iso-async1><span ng-bind="val"></span></iso-async1>');
              $rootScope.$digest();
              expect(element.text()).toEqual('transcluded content');
            }));

            it('should pass the outer scope to the transclude on the isolated template async-async', angular.mock.inject(function ($compile, $rootScope) {

              $rootScope.val = 'transcluded content';
              element = compileForTest('<iso-async2><span ng-bind="val"></span></iso-async2>');
              $rootScope.$digest();
              expect(element.text()).toEqual('transcluded content');
            }));

          });

          describe('multiple siblings receiving transclusion', function () {

            it('should only receive transclude from parent', function () {

              angular.mock.module(function ($compileProvider) {

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

              angular.mock.inject(function ($compile, $rootScope) {
                var element = compileForTest('<div my-example></div>');
                $rootScope.$digest();
                expect(element.text()).toEqual('myExample 0!');
                dealoc(element);

                element = compileForTest('<div my-example><p></p></div>');
                $rootScope.$digest();
                expect(element.text()).toEqual('myExample 1!has children');
                dealoc(element);
              });
            });
          });
        });


        describe('element transclusion', function () {

          it('should support basic element transclusion', function () {
            angular.mock.module(function () {
              directive('trans', function (log) {
                return {
                  transclude: 'element',
                  priority: 2,
                  controller: function ($transclude) {
                    this.$transclude = $transclude;
                  },
                  compile: function (element, attrs, template) {
                    log('compile: ' + angular.mock.dump(element));
                    return function (scope, element, attrs, ctrl) {
                      log('link');
                      var cursor = element;
                      template(scope.$new(), function (clone) {
                        cursor.after(cursor = clone);
                      });
                      ctrl.$transclude(function (clone) {
                        cursor.after(clone);
                      });
                    };
                  }
                };
              });
            });
            angular.mock.inject(function (log, $rootScope, $compile) {
              element = compileForTest('<div><div high-log trans="text" log>{{$parent.$id}}-{{$id}};</div></div>');
              $rootScope.$apply();
              expect(log).toEqual('compile: <!-- trans: text -->; link; LOG; LOG; HIGH');
              expect(element.text()).toEqual('1-2;1-3;');
            });
          });

          it('should only allow one element transclusion per element', function () {
            angular.mock.module(function () {
              directive('first', ngInternals.valueFn({
                transclude: 'element'
              }));
              directive('second', ngInternals.valueFn({
                transclude: 'element'
              }));
            });
            angular.mock.inject(function ($compile) {
              expect(function () {
                compileForTest('<div first second></div>');
              }).toThrowMinErr('$compile', 'multidir', 'Multiple directives [first, second] asking for transclusion on: ' +
                '<!-- first: -->');
            });
          });


          it('should only allow one element transclusion per element when directives have different priorities', function () {
            // we restart compilation in this case and we need to remember the duplicates during the second compile
            // regression #3893
            angular.mock.module(function () {
              directive('first', ngInternals.valueFn({
                transclude: 'element',
                priority: 100
              }));
              directive('second', ngInternals.valueFn({
                transclude: 'element'
              }));
            });
            angular.mock.inject(function ($compile) {
              expect(function () {
                compileForTest('<div first second></div>');
              }).toThrowMinErr('$compile', 'multidir', /Multiple directives \[first, second] asking for transclusion on: <div .+/);
            });
          });


          it('should only allow one element transclusion per element when async replace directive is in the mix', function () {
            angular.mock.module(function () {
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
            angular.mock.inject(function ($compile, $httpBackend) {
              $httpBackend.expectGET('template.html').respond('<p second>template.html</p>');

              expect(function () {
                compileForTest('<div template first></div>');
                $httpBackend.flush();
              }).toThrowMinErr('$compile', 'multidir',
                'Multiple directives [first, second] asking for transclusion on: <p ');
            });
          });

          it('should only allow one element transclusion per element when replace directive is in the mix', function () {
            angular.mock.module(function () {
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
            angular.mock.inject(function ($compile) {
              expect(function () {
                compileForTest('<div template first></div>');
              }).toThrowMinErr('$compile', 'multidir', /Multiple directives \[first, second] asking for transclusion on: <p .+/);
            });
          });


          it('should support transcluded element on root content', function () {
            var comment;
            angular.mock.module(function () {
              directive('transclude', ngInternals.valueFn({
                transclude: 'element',
                compile: function (element, attr, linker) {
                  return function (scope, element, attr) {
                    comment = element;
                  };
                }
              }));
            });
            angular.mock.inject(function ($compile, $rootScope) {
              var element = angular.element('<div>before<div transclude></div>after</div>').contents();
              toDealoc.push(element);
              expect(element.length).toEqual(3);
              expect(ngInternals.nodeName_(element[1])).toBe('div');
              compileForTest(element);
              expect(ngInternals.nodeName_(element[1])).toBe('#comment');
              expect(ngInternals.nodeName_(comment)).toBe('#comment');
            });
          });


          it('should terminate compilation only for element transclusion', function () {
            angular.mock.module(function () {
              directive('elementTrans', function (log) {
                return {
                  transclude: 'element',
                  priority: 50,
                  compile: log.fn('compile:elementTrans')
                };
              });
              directive('regularTrans', function (log) {
                return {
                  transclude: true,
                  priority: 50,
                  compile: log.fn('compile:regularTrans')
                };
              });
            });
            angular.mock.inject(function (log, $compile, $rootScope) {
              compileForTest('<div><div element-trans log="elem"></div><div regular-trans log="regular"></div></div>');
              expect(log).toEqual('compile:elementTrans; compile:regularTrans; regular');
            });
          });


          it('should instantiate high priority controllers only once, but low priority ones each time we transclude',
            function () {
              angular.mock.module(function () {
                directive('elementTrans', function (log) {
                  return {
                    transclude: 'element',
                    priority: 50,
                    controller: function ($transclude, $element) {
                      log('controller:elementTrans');
                      $transclude(function (clone) {
                        $element.after(clone);
                      });
                      $transclude(function (clone) {
                        $element.after(clone);
                      });
                      $transclude(function (clone) {
                        $element.after(clone);
                      });
                    }
                  };
                });
                directive('normalDir', function (log) {
                  return {
                    controller: function () {
                      log('controller:normalDir');
                    }
                  };
                });
              });
              angular.mock.inject(function ($compile, $rootScope, log) {
                element = compileForTest('<div><div element-trans normal-dir></div></div>');
                expect(log).toEqual([
                  'controller:elementTrans',
                  'controller:normalDir',
                  'controller:normalDir',
                  'controller:normalDir'
                ]);
              });
            });

          it('should allow to access $transclude in the same directive', function () {
            var _$transclude;
            angular.mock.module(function () {
              directive('transclude', ngInternals.valueFn({
                transclude: 'element',
                controller: function ($transclude) {
                  _$transclude = $transclude;
                }
              }));
            });
            angular.mock.inject(function ($compile) {
              element = compileForTest('<div transclude></div>');
              expect(_$transclude).toBeDefined();
            });
          });

          it('should copy the directive controller to all clones', function () {
            var transcludeCtrl, cloneCount = 2;
            angular.mock.module(function () {
              directive('transclude', ngInternals.valueFn({
                transclude: 'element',
                controller: function () {
                  transcludeCtrl = this;
                },
                link: function (scope, el, attr, ctrl, $transclude) {
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
            angular.mock.inject(function ($compile) {
              element = compileForTest('<div><div transclude></div></div>');
              var children = element.children(), i;
              for (i = 0; i < cloneCount; i++) {
                expect(children.eq(i).data('$transcludeController')).toBe(transcludeCtrl);
              }
            });
          });

          it('should expose the directive controller to transcluded children', function () {
            var capturedTranscludeCtrl;
            angular.mock.module(function () {
              directive('transclude', ngInternals.valueFn({
                transclude: 'element',
                controller: function () {
                },
                link: function (scope, element, attr, ctrl, $transclude) {
                  $transclude(scope, function (clone) {
                    element.after(clone);
                  });
                }
              }));
              directive('child', ngInternals.valueFn({
                require: '^transclude',
                link: function (scope, element, attr, ctrl) {
                  capturedTranscludeCtrl = ctrl;
                }
              }));
            });
            angular.mock.inject(function ($compile) {
              // We need to wrap the transclude directive's element in a parent element so that the
              // cloned element gets deallocated/cleaned up correctly
              element = compileForTest('<div><div transclude><div child></div></div></div>');
              expect(capturedTranscludeCtrl).toBeTruthy();
            });
          });

          it('should allow access to $transclude in a templateUrl directive', function () {
            var transclude;
            angular.mock.module(function () {
              directive('template', ngInternals.valueFn({
                templateUrl: 'template.html',
                replace: true
              }));
              directive('transclude', ngInternals.valueFn({
                transclude: 'content',
                controller: function ($transclude) {
                  transclude = $transclude;
                }
              }));
            });
            angular.mock.inject(function ($compile, $httpBackend) {
              $httpBackend.expectGET('template.html').respond('<div transclude></div>');
              element = compileForTest('<div template></div>');
              $httpBackend.flush();
              expect(transclude).toBeDefined();
            });
          });

          // issue #6006
          it('should link directive with $element as a comment node', function () {
            angular.mock.module(function ($provide) {
              directive('innerAgain', function (log) {
                return {
                  transclude: 'element',
                  link: function (scope, element, attr, controllers, transclude) {
                    log('innerAgain:' + angular.lowercase(ngInternals.nodeName_(element)) + ':' + ngInternals.trim(element[0].data));
                    transclude(scope, function (clone) {
                      element.parent().append(clone);
                    });
                  }
                };
              });
              directive('inner', function (log) {
                return {
                  replace: true,
                  templateUrl: 'inner.html',
                  link: function (scope, element) {
                    log('inner:' + angular.lowercase(ngInternals.nodeName_(element)) + ':' + ngInternals.trim(element[0].data));
                  }
                };
              });
              directive('outer', function (log) {
                return {
                  transclude: 'element',
                  link: function (scope, element, attrs, controllers, transclude) {
                    log('outer:' + angular.lowercase(ngInternals.nodeName_(element)) + ':' + ngInternals.trim(element[0].data));
                    transclude(scope, function (clone) {
                      element.parent().append(clone);
                    });
                  }
                };
              });
            });
            angular.mock.inject(function (log, $compile, $rootScope, $templateCache) {
              $templateCache.put('inner.html', '<div inner-again><p>Content</p></div>');
              element = compileForTest('<div><div outer><div inner></div></div></div>');
              $rootScope.$digest();
              var child = element.children();

              expect(log.toArray()).toEqual([
                'outer:#comment:outer:',
                'innerAgain:#comment:innerAgain:',
                'inner:#comment:innerAgain:'
              ]);
              expect(child.length).toBe(1);
              expect(child.contents().length).toBe(2);
              expect(angular.lowercase(ngInternals.nodeName_(child.contents().eq(0)))).toBe('#comment');
              expect(angular.lowercase(ngInternals.nodeName_(child.contents().eq(1)))).toBe('div');
            });
          });
        });


        it('should be possible to change the scope of a directive using $provide', function () {
          angular.mock.module(function ($provide) {
            directive('foo', function () {
              return {
                scope: {},
                template: '<div></div>'
              };
            });
            $provide.decorator('fooDirective', function ($delegate) {
              var directive = $delegate[0];
              directive.scope.something = '=';
              directive.template = '<span>{{something}}</span>';
              return $delegate;
            });
          });
          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest('<div><div foo something="bar"></div></div>');
            $rootScope.bar = 'bar';
            $rootScope.$digest();
            expect(element.text()).toBe('bar');
          });
        });


        it('should distinguish different bindings with the same binding name', function () {
          angular.mock.module(function () {
            directive('foo', function () {
              return {
                scope: {
                  foo: '=',
                  bar: '='
                },
                template: '<div><div>{{foo}}</div><div>{{bar}}</div></div>'
              };
            });
          });
          angular.mock.inject(function ($compile, $rootScope) {
            element = compileForTest('<div><div foo="\'foo\'" bar="\'bar\'"></div></div>');
            $rootScope.$digest();
            expect(element.text()).toBe('foobar');
          });
        });


        it('should safely create transclude comment node and not break with "-->"',
          angular.mock.inject(function () {
            // see: https://github.com/angular/angular.js/issues/1740
            element = compileForTest('<ul><li ng-repeat="item in [\'-->\', \'x\']">{{item}}|</li></ul>');
            $rootScope.$digest();

            expect(element.text()).toBe('-->|x|');
          }));


        describe('lazy compilation', function () {
          // See https://github.com/angular/angular.js/issues/7183
          it('should pass transclusion through to template of a \'replace\' directive', function () {
            angular.mock.module(function () {
              directive('transSync', function () {
                return {
                  transclude: true,
                  link: function (scope, element, attr, ctrl, transclude) {

                    expect(transclude).toEqual(expect.any(Function));

                    transclude(function (child) {
                      element.append(child);
                    });
                  }
                };
              });

              directive('trans', function ($timeout) {
                return {
                  transclude: true,
                  link: function (scope, element, attrs, ctrl, transclude) {

                    // We use timeout here to simulate how ng-if works
                    $timeout(function () {
                      transclude(function (child) {
                        element.append(child);
                      });
                    });
                  }
                };
              });

              directive('replaceWithTemplate', function () {
                return {
                  templateUrl: 'template.html',
                  replace: true
                };
              });
            });

            angular.mock.inject(function ($compile, $rootScope, $templateCache, $timeout) {

              $templateCache.put('template.html', '<div trans-sync>Content To Be Transcluded</div>');

              expect(function () {
                element = compileForTest('<div><div trans><div replace-with-template></div></div></div>');
                $timeout.flush();
              }).not.toThrow();

              expect(element.text()).toEqual('Content To Be Transcluded');
            });

          });

          it('should lazily compile the contents of directives that are transcluded', function () {
            var innerCompilationCount = 0, transclude;

            angular.mock.module(function () {
              directive('trans', ngInternals.valueFn({
                transclude: true,
                controller: function ($transclude) {
                  transclude = $transclude;
                }
              }));

              directive('inner', ngInternals.valueFn({
                template: '<span>FooBar</span>',
                compile: function () {
                  innerCompilationCount += 1;
                }
              }));
            });

            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<trans><inner></inner></trans>');
              expect(innerCompilationCount).toBe(0);
              transclude(function (child) {
                element.append(child);
              });
              expect(innerCompilationCount).toBe(1);
              expect(element.text()).toBe('FooBar');
            });
          });

          it('should lazily compile the contents of directives that are transcluded with a template', function () {
            var innerCompilationCount = 0, transclude;

            angular.mock.module(function () {
              directive('trans', ngInternals.valueFn({
                transclude: true,
                template: '<div>Baz</div>',
                controller: function ($transclude) {
                  transclude = $transclude;
                }
              }));

              directive('inner', ngInternals.valueFn({
                template: '<span>FooBar</span>',
                compile: function () {
                  innerCompilationCount += 1;
                }
              }));
            });

            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<trans><inner></inner></trans>');
              expect(innerCompilationCount).toBe(0);
              transclude(function (child) {
                element.append(child);
              });
              expect(innerCompilationCount).toBe(1);
              expect(element.text()).toBe('BazFooBar');
            });
          });

          it('should lazily compile the contents of directives that are transcluded with a templateUrl', function () {
            var innerCompilationCount = 0, transclude;

            angular.mock.module(function () {
              directive('trans', ngInternals.valueFn({
                transclude: true,
                templateUrl: 'baz.html',
                controller: function ($transclude) {
                  transclude = $transclude;
                }
              }));

              directive('inner', ngInternals.valueFn({
                template: '<span>FooBar</span>',
                compile: function () {
                  innerCompilationCount += 1;
                }
              }));
            });

            angular.mock.inject(function ($compile, $rootScope, $httpBackend) {
              $httpBackend.expectGET('baz.html').respond('<div>Baz</div>');
              element = compileForTest('<trans><inner></inner></trans>');
              $httpBackend.flush();

              expect(innerCompilationCount).toBe(0);
              transclude(function (child) {
                element.append(child);
              });
              expect(innerCompilationCount).toBe(1);
              expect(element.text()).toBe('BazFooBar');
            });
          });

          it('should lazily compile the contents of directives that are transclude element', function () {
            var innerCompilationCount = 0, transclude;

            angular.mock.module(function () {
              directive('trans', ngInternals.valueFn({
                transclude: 'element',
                controller: function ($transclude) {
                  transclude = $transclude;
                }
              }));

              directive('inner', ngInternals.valueFn({
                template: '<span>FooBar</span>',
                compile: function () {
                  innerCompilationCount += 1;
                }
              }));
            });

            angular.mock.inject(function ($compile, $rootScope) {
              element = compileForTest('<div><trans><inner></inner></trans></div>');
              expect(innerCompilationCount).toBe(0);
              transclude(function (child) {
                element.append(child);
              });
              expect(innerCompilationCount).toBe(1);
              expect(element.text()).toBe('FooBar');
            });
          });

          it('should lazily compile transcluded directives with ngIf on them', function () {
            var innerCompilationCount = 0, outerCompilationCount = 0, transclude;

            angular.mock.module(function () {
              directive('outer', ngInternals.valueFn({
                transclude: true,
                compile: function () {
                  outerCompilationCount += 1;
                },
                controller: function ($transclude) {
                  transclude = $transclude;
                }
              }));

              directive('inner', ngInternals.valueFn({
                template: '<span>FooBar</span>',
                compile: function () {
                  innerCompilationCount += 1;
                }
              }));
            });

            angular.mock.inject(function ($compile, $rootScope) {
              $rootScope.shouldCompile = false;

              element = compileForTest('<div><outer ng-if="shouldCompile"><inner></inner></outer></div>');
              expect(outerCompilationCount).toBe(0);
              expect(innerCompilationCount).toBe(0);
              expect(transclude).toBeUndefined();
              $rootScope.$apply('shouldCompile=true');
              expect(outerCompilationCount).toBe(1);
              expect(innerCompilationCount).toBe(0);
              expect(transclude).toBeDefined();
              transclude(function (child) {
                element.append(child);
              });
              expect(outerCompilationCount).toBe(1);
              expect(innerCompilationCount).toBe(1);
              expect(element.text()).toBe('FooBar');
            });
          });

          it('should eagerly compile multiple directives with transclusion and templateUrl/replace', function () {
            var innerCompilationCount = 0;

            angular.mock.module(function () {
              directive('outer', ngInternals.valueFn({
                transclude: true
              }));

              directive('outer', ngInternals.valueFn({
                templateUrl: 'inner.html',
                replace: true
              }));

              directive('inner', ngInternals.valueFn({
                compile: function () {
                  innerCompilationCount += 1;
                }
              }));
            });

            angular.mock.inject(function ($compile, $rootScope, $httpBackend) {
              $httpBackend.expectGET('inner.html').respond('<inner></inner>');
              element = compileForTest('<outer></outer>');
              $httpBackend.flush();

              expect(innerCompilationCount).toBe(1);
            });
          });
        });

      });
    });
  });

  describe('multi-slot transclude', function () {
    it('should only include elements without a matching transclusion element in default transclusion slot', function () {
      angular.mock.module(function () {
        directive('minionComponent', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest(
          '<minion-component>' +
          '<span>stuart</span>' +
          '<span>bob</span>' +
          '<boss>gru</boss>' +
          '<span>kevin</span>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.text()).toEqual('stuartbobkevin');
      });
    });

    it('should use the default transclusion slot if the ng-transclude attribute has the same value as its key', function () {
      angular.mock.module(function () {
        directive('minionComponent', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest(
          '<minion-component>' +
          '<span>stuart</span>' +
          '<span>bob</span>' +
          '<span>kevin</span>' +
          '</minion-component>');
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


    it('should include non-element nodes in the default transclusion', function () {
      angular.mock.module(function () {
        directive('minionComponent', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest(
          '<minion-component>' +
          'text1' +
          '<span>stuart</span>' +
          '<span>bob</span>' +
          '<boss>gru</boss>' +
          'text2' +
          '<span>kevin</span>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.text()).toEqual('text1stuartbobtext2kevin');
      });
    });

    it('should transclude elements to an `ng-transclude` with a matching transclusion slot name', function () {
      angular.mock.module(function () {
        directive('minionComponent', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest(
          '<minion-component>' +
          '<minion>stuart</minion>' +
          '<span>dorothy</span>' +
          '<boss>gru</boss>' +
          '<minion>kevin</minion>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('gru');
        expect(element.children().eq(1).text()).toEqual('stuartkevin');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });


    it('should use the `ng-transclude-slot` attribute if ng-transclude is used as an element', function () {
      angular.mock.module(function () {
        directive('minionComponent', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest(
          '<minion-component>' +
          '<minion>stuart</minion>' +
          '<span>dorothy</span>' +
          '<boss>gru</boss>' +
          '<minion>kevin</minion>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('gru');
        expect(element.children().eq(1).text()).toEqual('stuartkevin');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });

    it('should error if a required transclude slot is not filled', function () {
      angular.mock.module(function () {
        directive('minionComponent', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        expect(function () {
          element = compileForTest(
            '<minion-component>' +
            '<minion>stuart</minion>' +
            '<span>dorothy</span>' +
            '</minion-component>');
        }).toThrowMinErr('$compile', 'reqslot', 'Required transclusion slot `bossSlot` was not filled.');
      });
    });


    it('should not error if an optional transclude slot is not filled', function () {
      angular.mock.module(function () {
        directive('minionComponent', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest(
          '<minion-component>' +
          '<minion>stuart</minion>' +
          '<span>dorothy</span>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.children().eq(1).text()).toEqual('stuart');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });


    it('should error if we try to transclude a slot that was not declared by the directive', function () {
      angular.mock.module(function () {
        directive('minionComponent', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        expect(function () {
          element = compileForTest(
            '<minion-component>' +
            '<minion>stuart</minion>' +
            '<span>dorothy</span>' +
            '</minion-component>');
        }).toThrowMinErr('$compile', 'noslot',
          'No parent directive that requires a transclusion with slot name "bossSlot". ' +
          'Element: <div class="boss" ng-transclude="bossSlot">');
      });
    });

    it('should allow the slot name to equal the element name', function () {

      angular.mock.module(function () {
        directive('foo', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest(
          '<foo>' +
          '<bar>baz</bar>' +
          '</foo>');
        $rootScope.$apply();
        expect(element.text()).toEqual('baz');
      });
    });


    it('should match the normalized form of the element name', function () {
      angular.mock.module(function () {
        directive('foo', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest(
          '<foo>' +
          '<foo-bar>bar1</foo-bar>' +
          '<foo:bar>bar2</foo:bar>' +
          '<moo-kar>baz1</moo-kar>' +
          '<data-moo-kar>baz2</data-moo-kar>' +
          '</foo>');
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('bar1bar2');
        expect(element.children().eq(1).text()).toEqual('baz1baz2');
      });
    });


    it('should return true from `isSlotFilled(slotName) for slots that have content in the transclusion', function () {
      var capturedTranscludeFn;
      angular.mock.module(function () {
        directive('minionComponent', function () {
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
            link: function (s, e, a, c, transcludeFn) {
              capturedTranscludeFn = transcludeFn;
            }
          };
        });
      });
      angular.mock.inject(function ($rootScope, $compile, log) {
        element = compileForTest(
          '<minion-component>' +
          '  <minion>stuart</minion>' +
          '  <minion>bob</minion>' +
          '  <span>dorothy</span>' +
          '</minion-component>');
        $rootScope.$apply();

        var hasMinions = capturedTranscludeFn.isSlotFilled('minionSlot');
        var hasBosses = capturedTranscludeFn.isSlotFilled('bossSlot');

        expect(hasMinions).toBe(true);
        expect(hasBosses).toBe(false);
      });
    });

    it('should not overwrite the contents of an `ng-transclude` element, if the matching optional slot is not filled', function () {
      angular.mock.module(function () {
        directive('minionComponent', function () {
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
      angular.mock.inject(function ($rootScope, $compile) {
        element = compileForTest(
          '<minion-component>' +
          '<minion>stuart</minion>' +
          '<span>dorothy</span>' +
          '<minion>kevin</minion>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('default boss content');
        expect(element.children().eq(1).text()).toEqual('stuartkevin');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });


    // See issue https://github.com/angular/angular.js/issues/14924
    it('should not process top-level transcluded text nodes merged into their sibling',
      function () {
        angular.mock.module(function () {
          directive('transclude', ngInternals.valueFn({
            template: '<ng-transclude></ng-transclude>',
            transclude: {},
            scope: {}
          }));
        });

        angular.mock.inject(function ($compile) {
          element = angular.element('<div transclude></div>');
          toDealoc.push(element);
          element[0].appendChild(document.createTextNode('1{{ value }}'));
          element[0].appendChild(document.createTextNode('2{{ value }}'));
          element[0].appendChild(document.createTextNode('3{{ value }}'));

          var initialWatcherCount = $rootScope.$countWatchers();
          compileForTest(element);
          $rootScope.$apply('value = 0');
          var newWatcherCount = $rootScope.$countWatchers() - initialWatcherCount;

          expect(element.text()).toBe('102030');
          expect(newWatcherCount).toBe(3);
        });
      }
    );
  });

  describe('*[src] context requirement', function () {

    it('should NOT require trusted values for img src', angular.mock.inject(function ($rootScope, $compile, $sce) {
      element = compileForTest('<img src="{{testUrl}}"></img>');
      $rootScope.testUrl = 'http://example.com/image.png';
      $rootScope.$digest();
      expect(element.attr('src')).toEqual('http://example.com/image.png');
      // But it should accept trusted values anyway.
      $rootScope.testUrl = $sce.trustAsUrl('http://example.com/image2.png');
      $rootScope.$digest();
      expect(element.attr('src')).toEqual('http://example.com/image2.png');
    }));
  });

  describe('img[src] sanitization', function () {

    it('should not sanitize attributes other than src', angular.mock.inject(function ($compile, $rootScope) {
      element = compileForTest('<img title="{{testUrl}}"></img>');
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.attr('title')).toBe('javascript:doEvilStuff()');
    }));

    it('should use $$sanitizeUriProvider for reconfiguration of the src whitelist', function () {
      angular.mock.module(function ($compileProvider, $$sanitizeUriProvider) {
        var newRe = /javascript:/,
          returnVal;
        expect($compileProvider.imgSrcSanitizationWhitelist()).toBe($$sanitizeUriProvider.imgSrcSanitizationWhitelist());

        returnVal = $compileProvider.imgSrcSanitizationWhitelist(newRe);
        expect(returnVal).toBe($compileProvider);
        expect($$sanitizeUriProvider.imgSrcSanitizationWhitelist()).toBe(newRe);
        expect($compileProvider.imgSrcSanitizationWhitelist()).toBe(newRe);
      });
      angular.mock.inject(function () {
        // needed to the module definition above is run...
      });
    });

    it('should use $$sanitizeUri', function () {
      var $$sanitizeUri = jest.fn();
      angular.mock.module(function ($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest('<img src="{{testUrl}}"></img>');
        $rootScope.testUrl = 'someUrl';

        $$sanitizeUri.mockReturnValue('someSanitizedUrl');
        $rootScope.$apply();
        expect(element.attr('src')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, true);
      });
    });
  });

  describe('img[srcset] sanitization', function () {

    it('should not error if undefined', function () {
      var linked = false;
      angular.mock.module(function () {
        directive('setter', ngInternals.valueFn(function (scope, elem, attrs) {
          attrs.$set('srcset', 'http://example.com/');
          expect(attrs.srcset).toBe('http://example.com/');

          attrs.$set('srcset', undefined);
          expect(attrs.srcset).toBeUndefined();

          linked = true;
        }));
      });
      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest('<img setter></img>');

        expect(linked).toBe(true);
        expect(element.attr('srcset')).toBeUndefined();
      });
    });

    it('should NOT require trusted values for img srcset', angular.mock.inject(function ($rootScope, $compile, $sce) {
      element = compileForTest('<img srcset="{{testUrl}}"></img>');
      $rootScope.testUrl = 'http://example.com/image.png';
      $rootScope.$digest();
      expect(element.attr('srcset')).toEqual('http://example.com/image.png');
      // But it should accept trusted values anyway.
      $rootScope.testUrl = $sce.trustAsUrl('http://example.com/image2.png');
      $rootScope.$digest();
      expect(element.attr('srcset')).toEqual('http://example.com/image2.png');
    }));

    it('should use $$sanitizeUri', function () {
      var $$sanitizeUri = jest.fn();
      angular.mock.module(function ($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest('<img srcset="{{testUrl}}"></img>');
        $rootScope.testUrl = 'someUrl';

        $$sanitizeUri.mockReturnValue('someSanitizedUrl');
        $rootScope.$apply();
        expect(element.attr('srcset')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, true);
      });
    });

    it('should sanitize all uris in srcset', angular.mock.inject(function ($rootScope, $compile) {
      element = compileForTest('<img srcset="{{testUrl}}"></img>');
      var testSet = {
        'http://example.com/image.png': 'http://example.com/image.png',
        ' http://example.com/image.png': 'http://example.com/image.png',
        'http://example.com/image.png ': 'http://example.com/image.png',
        'http://example.com/image.png 128w': 'http://example.com/image.png 128w',
        'http://example.com/image.png 2x': 'http://example.com/image.png 2x',
        'http://example.com/image.png 1.5x': 'http://example.com/image.png 1.5x',
        'http://example.com/image1.png 1x,http://example.com/image2.png 2x': 'http://example.com/image1.png 1x,http://example.com/image2.png 2x',
        'http://example.com/image1.png 1x ,http://example.com/image2.png 2x': 'http://example.com/image1.png 1x,http://example.com/image2.png 2x',
        'http://example.com/image1.png 1x, http://example.com/image2.png 2x': 'http://example.com/image1.png 1x,http://example.com/image2.png 2x',
        'http://example.com/image1.png 1x , http://example.com/image2.png 2x': 'http://example.com/image1.png 1x,http://example.com/image2.png 2x',
        'http://example.com/image1.png 48w,http://example.com/image2.png 64w': 'http://example.com/image1.png 48w,http://example.com/image2.png 64w',
        //Test regex to make sure doesn't mistake parts of url for width descriptors
        'http://example.com/image1.png?w=48w,http://example.com/image2.png 64w': 'http://example.com/image1.png?w=48w,http://example.com/image2.png 64w',
        'http://example.com/image1.png 1x,http://example.com/image2.png 64w': 'http://example.com/image1.png 1x,http://example.com/image2.png 64w',
        'http://example.com/image1.png,http://example.com/image2.png': 'http://example.com/image1.png,http://example.com/image2.png',
        'http://example.com/image1.png ,http://example.com/image2.png': 'http://example.com/image1.png,http://example.com/image2.png',
        'http://example.com/image1.png, http://example.com/image2.png': 'http://example.com/image1.png,http://example.com/image2.png',
        'http://example.com/image1.png , http://example.com/image2.png': 'http://example.com/image1.png,http://example.com/image2.png',
        'http://example.com/image1.png 1x, http://example.com/image2.png 2x, http://example.com/image3.png 3x':
          'http://example.com/image1.png 1x,http://example.com/image2.png 2x,http://example.com/image3.png 3x',
        'javascript:doEvilStuff() 2x': 'unsafe:javascript:doEvilStuff() 2x',
        'http://example.com/image1.png 1x,javascript:doEvilStuff() 2x': 'http://example.com/image1.png 1x,unsafe:javascript:doEvilStuff() 2x',
        'http://example.com/image1.jpg?x=a,b 1x,http://example.com/ima,ge2.jpg 2x': 'http://example.com/image1.jpg?x=a,b 1x,http://example.com/ima,ge2.jpg 2x',
        //Test regex to make sure doesn't mistake parts of url for pixel density descriptors
        'http://example.com/image1.jpg?x=a2x,b 1x,http://example.com/ima,ge2.jpg 2x': 'http://example.com/image1.jpg?x=a2x,b 1x,http://example.com/ima,ge2.jpg 2x'
      };

      angular.forEach(testSet, function (ref, url) {
        $rootScope.testUrl = url;
        $rootScope.$digest();
        expect(element.attr('srcset')).toEqual(ref);
      });

    }));
  });

  describe('a[href] sanitization', function () {

    it('should not sanitize href on elements other than anchor', angular.mock.inject(function ($compile, $rootScope) {
      element = compileForTest('<div href="{{testUrl}}"></div>');
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.attr('href')).toBe('javascript:doEvilStuff()');
    }));

    it('should not sanitize attributes other than href', angular.mock.inject(function ($compile, $rootScope) {
      element = compileForTest('<a title="{{testUrl}}"></a>');
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.attr('title')).toBe('javascript:doEvilStuff()');
    }));

    it('should use $$sanitizeUriProvider for reconfiguration of the href whitelist', function () {
      angular.mock.module(function ($compileProvider, $$sanitizeUriProvider) {
        var newRe = /javascript:/,
          returnVal;
        expect($compileProvider.aHrefSanitizationWhitelist()).toBe($$sanitizeUriProvider.aHrefSanitizationWhitelist());

        returnVal = $compileProvider.aHrefSanitizationWhitelist(newRe);
        expect(returnVal).toBe($compileProvider);
        expect($$sanitizeUriProvider.aHrefSanitizationWhitelist()).toBe(newRe);
        expect($compileProvider.aHrefSanitizationWhitelist()).toBe(newRe);
      });
      angular.mock.inject(function () {
        // needed to the module definition above is run...
      });
    });

    it('should use $$sanitizeUri', function () {
      var $$sanitizeUri = jest.fn();
      angular.mock.module(function ($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest('<a href="{{testUrl}}"></a>');
        $rootScope.testUrl = 'someUrl';

        $$sanitizeUri.mockReturnValue('someSanitizedUrl');
        $rootScope.$apply();
        expect(element.attr('href')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
      });
    });

    it('should use $$sanitizeUri when declared via ng-href', function () {
      var $$sanitizeUri = jest.fn();
      angular.mock.module(function ($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest('<a ng-href="{{testUrl}}"></a>');
        $rootScope.testUrl = 'someUrl';

        $$sanitizeUri.mockReturnValue('someSanitizedUrl');
        $rootScope.$apply();
        expect(element.attr('href')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
      });
    });

    it('should use $$sanitizeUri when working with svg and xlink:href', function () {
      var $$sanitizeUri = jest.fn();
      angular.mock.module(function ($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest('<svg><a xlink:href="" ng-href="{{ testUrl }}"></a></svg>');
        $rootScope.testUrl = 'evilUrl';

        $$sanitizeUri.mockReturnValue('someSanitizedUrl');
        $rootScope.$apply();
        expect(element.find('a')[0].getAttribute('href')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
      });
    });


    it('should use $$sanitizeUri when working with svg and xlink:href', function () {
      var $$sanitizeUri = jest.fn();
      angular.mock.module(function ($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest('<svg><a xlink:href="" ng-href="{{ testUrl }}"></a></svg>');
        $rootScope.testUrl = 'evilUrl';

        $$sanitizeUri.mockReturnValue('someSanitizedUrl');
        $rootScope.$apply();
        expect(element.find('a')[0].getAttribute('href')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
      });
    });
  });

  describe('interpolation on HTML DOM event handler attributes onclick, onXYZ, formaction', function () {
    it('should disallow interpolation on onclick', angular.mock.inject(function ($compile, $rootScope) {
      // All interpolations are disallowed.
      $rootScope.onClickJs = '';
      expect(function () {
        compileForTest('<button onclick="{{onClickJs}}"></script>');
      }).toThrowMinErr(
        '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed.  ' +
        'Please use the ng- versions (such as ng-click instead of onclick) instead.');
      expect(function () {
        compileForTest('<button ONCLICK="{{onClickJs}}"></script>');
      }).toThrowMinErr(
        '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed.  ' +
        'Please use the ng- versions (such as ng-click instead of onclick) instead.');
      expect(function () {
        compileForTest('<button ng-attr-onclick="{{onClickJs}}"></script>');
      }).toThrowMinErr(
        '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed.  ' +
        'Please use the ng- versions (such as ng-click instead of onclick) instead.');
    }));

    it('should pass through arbitrary values on onXYZ event attributes that contain a hyphen', angular.mock.inject(function ($compile, $rootScope) {
      element = compileForTest('<button on-click="{{onClickJs}}"></script>');
      $rootScope.onClickJs = 'javascript:doSomething()';
      $rootScope.$apply();
      expect(element.attr('on-click')).toEqual('javascript:doSomething()');
    }));

    it('should pass through arbitrary values on "on" and "data-on" attributes', angular.mock.inject(function ($compile, $rootScope) {
      element = compileForTest('<button data-on="{{dataOnVar}}"></script>');
      $rootScope.dataOnVar = 'data-on text';
      $rootScope.$apply();
      expect(element.attr('data-on')).toEqual('data-on text');

      element = compileForTest('<button on="{{onVar}}"></script>');
      $rootScope.onVar = 'on text';
      $rootScope.$apply();
      expect(element.attr('on')).toEqual('on text');
    }));
  });

  describe('iframe[src]', function () {
    it('should pass through src attributes for the same domain', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<iframe src="{{testUrl}}"></iframe>');
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.attr('src')).toEqual('different_page');
    }));

    it('should clear out src attributes for a different domain', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<iframe src="{{testUrl}}"></iframe>');
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(function () {
        $rootScope.$apply();
      }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
        'http://a.different.domain.example.com');
    }));

    it('should clear out JS src attributes', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<iframe src="{{testUrl}}"></iframe>');
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(function () {
        $rootScope.$apply();
      }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
        'javascript:alert(1);');
    }));

    it('should clear out non-resource_url src attributes', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<iframe src="{{testUrl}}"></iframe>');
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect($rootScope.$apply).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: javascript:doTrustedStuff()');
    }));

    it('should pass through $sce.trustAs() values in src attributes', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<iframe src="{{testUrl}}"></iframe>');
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.attr('src')).toEqual('javascript:doTrustedStuff()');
    }));
  });

  describe('form[action]', function () {
    it('should pass through action attribute for the same domain', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<form action="{{testUrl}}"></form>');
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.attr('action')).toEqual('different_page');
    }));

    it('should clear out action attribute for a different domain', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<form action="{{testUrl}}"></form>');
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(function () {
        $rootScope.$apply();
      }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
        'http://a.different.domain.example.com');
    }));

    it('should clear out JS action attribute', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<form action="{{testUrl}}"></form>');
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(function () {
        $rootScope.$apply();
      }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
        'javascript:alert(1);');
    }));

    it('should clear out non-resource_url action attribute', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<form action="{{testUrl}}"></form>');
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect($rootScope.$apply).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: javascript:doTrustedStuff()');
    }));


    it('should pass through $sce.trustAs() values in action attribute', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<form action="{{testUrl}}"></form>');
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.attr('action')).toEqual('javascript:doTrustedStuff()');
    }));
  });

  describe('link[href]', function () {
    it('should reject invalid RESOURCE_URLs', angular.mock.inject(function ($compile, $rootScope) {
      element = compileForTest('<link href="{{testUrl}}" rel="stylesheet" />');
      $rootScope.testUrl = 'https://evil.example.org/css.css';
      expect(function () {
        $rootScope.$apply();
      }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
        'https://evil.example.org/css.css');
    }));

    it('should accept valid RESOURCE_URLs', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<link href="{{testUrl}}" rel="stylesheet" />');

      $rootScope.testUrl = './css1.css';
      $rootScope.$apply();
      expect(element.attr('href')).toContain('css1.css');

      $rootScope.testUrl = $sce.trustAsResourceUrl('https://elsewhere.example.org/css2.css');
      $rootScope.$apply();
      expect(element.attr('href')).toContain('https://elsewhere.example.org/css2.css');
    }));

    it('should accept valid constants', angular.mock.inject(function ($compile, $rootScope) {
      element = compileForTest('<link href="https://elsewhere.example.org/css2.css" rel="stylesheet" />');

      $rootScope.$apply();
      expect(element.attr('href')).toContain('https://elsewhere.example.org/css2.css');
    }));
  });

  describe('iframe[srcdoc]', function () {
    it('should NOT set iframe contents for untrusted values', angular.mock.inject(function ($compile, $rootScope, $sce) {
      element = compileForTest('<iframe srcdoc="{{html}}"></iframe>');
      $rootScope.html = '<div onclick="">hello</div>';
      expect(function () {
        $rootScope.$digest();
      }).toThrowMinErr('$interpolate', 'interr', new RegExp(
        /Can't interpolate: {{html}}\n/.source +
        /[^[]*\[\$sce:unsafe] Attempting to use an unsafe value in a safe context./.source));
    }));

    it('should NOT set html for wrongly typed values', angular.mock.inject(function ($rootScope, $compile, $sce) {
      element = compileForTest('<iframe srcdoc="{{html}}"></iframe>');
      $rootScope.html = $sce.trustAsCss('<div onclick="">hello</div>');
      expect(function () {
        $rootScope.$digest();
      }).toThrowMinErr('$interpolate', 'interr', new RegExp(
        /Can't interpolate: \{\{html}}\n/.source +
        /[^[]*\[\$sce:unsafe] Attempting to use an unsafe value in a safe context./.source));
    }));

    it('should set html for trusted values', angular.mock.inject(function ($rootScope, $compile, $sce) {
      element = compileForTest('<iframe srcdoc="{{html}}"></iframe>');
      $rootScope.html = $sce.trustAsHtml('<div onclick="">hello</div>');
      $rootScope.$digest();
      expect(angular.lowercase(element.attr('srcdoc'))).toEqual('<div onclick="">hello</div>');
    }));
  });

  describe('ngAttr* attribute binding', function () {
    it('should bind after digest but not before', angular.mock.inject(function () {
      $rootScope.name = 'Misko';
      element = compileForTest('<span ng-attr-test="{{name}}"></span>');
      expect(element.attr('test')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
    }));

    it('should bind after digest but not before when after overridden attribute', angular.mock.inject(function () {
      $rootScope.name = 'Misko';
      element = compileForTest('<span test="123" ng-attr-test="{{name}}"></span>');
      expect(element.attr('test')).toBe('123');
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
    }));

    it('should bind after digest but not before when before overridden attribute', angular.mock.inject(function () {
      $rootScope.name = 'Misko';
      element = compileForTest('<span ng-attr-test="{{name}}" test="123"></span>');
      expect(element.attr('test')).toBe('123');
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
    }));

    it('should set the attribute (after digest) even if there is no interpolation', angular.mock.inject(function () {
      element = compileForTest('<span ng-attr-test="foo"></span>');
      expect(element.attr('test')).toBeUndefined();

      $rootScope.$digest();
      expect(element.attr('test')).toBe('foo');
    }));

    it('should remove attribute if any bindings are undefined', angular.mock.inject(function () {
      element = compileForTest('<span ng-attr-test="{{name}}{{emphasis}}"></span>');
      $rootScope.$digest();
      expect(element.attr('test')).toBeUndefined();
      $rootScope.name = 'caitp';
      $rootScope.$digest();
      expect(element.attr('test')).toBeUndefined();
      $rootScope.emphasis = '!!!';
      $rootScope.$digest();
      expect(element.attr('test')).toBe('caitp!!!');
    }));

    describe('in directive', function () {
      var log;

      beforeEach(angular.mock.module(function () {
        directive('syncTest', function (log) {
          return {
            link: {
              pre: function (s, e, attr) {
                log(attr.test);
              },
              post: function (s, e, attr) {
                log(attr.test);
              }
            }
          };
        });
        directive('asyncTest', function (log) {
          return {
            templateUrl: 'async.html',
            link: {
              pre: function (s, e, attr) {
                log(attr.test);
              },
              post: function (s, e, attr) {
                log(attr.test);
              }
            }
          };
        });
      }));

      beforeEach(angular.mock.inject(function ($templateCache, _log_) {
        log = _log_;
        $templateCache.put('async.html', '<h1>Test</h1>');
      }));

      it('should provide post-digest value in synchronous directive link functions when after overridden attribute',
        function () {
          $rootScope.test = 'TEST';
          element = compileForTest('<div sync-test test="123" ng-attr-test="{{test}}"></div>');
          expect(element.attr('test')).toBe('123');
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );

      it('should provide post-digest value in synchronous directive link functions when before overridden attribute',
        function () {
          $rootScope.test = 'TEST';
          element = compileForTest('<div sync-test ng-attr-test="{{test}}" test="123"></div>');
          expect(element.attr('test')).toBe('123');
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );


      it('should provide post-digest value in asynchronous directive link functions when after overridden attribute',
        function () {
          $rootScope.test = 'TEST';
          element = compileForTest('<div async-test test="123" ng-attr-test="{{test}}"></div>');
          expect(element.attr('test')).toBe('123');
          $rootScope.$digest();
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );

      it('should provide post-digest value in asynchronous directive link functions when before overridden attribute',
        function () {
          $rootScope.test = 'TEST';
          element = compileForTest('<div async-test ng-attr-test="{{test}}" test="123"></div>');
          expect(element.attr('test')).toBe('123');
          $rootScope.$digest();
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );
    });

    it('should work with different prefixes', angular.mock.inject(function () {
      $rootScope.name = 'Misko';
      element = compileForTest('<span ng:attr:test="{{name}}" ng-Attr-test2="{{name}}" ng_Attr_test3="{{name}}"></span>');
      expect(element.attr('test')).toBeUndefined();
      expect(element.attr('test2')).toBeUndefined();
      expect(element.attr('test3')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
      expect(element.attr('test2')).toBe('Misko');
      expect(element.attr('test3')).toBe('Misko');
    }));

    it('should work with the "href" attribute', angular.mock.inject(function () {
      $rootScope.value = 'test';
      element = compileForTest('<a ng-attr-href="test/{{value}}"></a>');
      $rootScope.$digest();
      expect(element.attr('href')).toBe('test/test');
    }));

    it('should work if they are prefixed with x- or data- and different prefixes', angular.mock.inject(function () {
      $rootScope.name = 'Misko';
      element = compileForTest('<span data-ng-attr-test2="{{name}}" x-ng-attr-test3="{{name}}" data-ng:attr-test4="{{name}}" ' +
        'x_ng-attr-test5="{{name}}" data:ng-attr-test6="{{name}}"></span>');
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

    describe('when an attribute has a dash-separated name', function () {
      it('should work with different prefixes', angular.mock.inject(function () {
        $rootScope.name = 'JamieMason';
        element = compileForTest('<span ng:attr:dash-test="{{name}}" ng-Attr-dash-test2="{{name}}" ng_Attr_dash-test3="{{name}}"></span>');
        expect(element.attr('dash-test')).toBeUndefined();
        expect(element.attr('dash-test2')).toBeUndefined();
        expect(element.attr('dash-test3')).toBeUndefined();
        $rootScope.$digest();
        expect(element.attr('dash-test')).toBe('JamieMason');
        expect(element.attr('dash-test2')).toBe('JamieMason');
        expect(element.attr('dash-test3')).toBe('JamieMason');
      }));

      it('should work if they are prefixed with x- or data-', angular.mock.inject(function () {
        $rootScope.name = 'JamieMason';
        element = compileForTest('<span data-ng-attr-dash-test2="{{name}}" x-ng-attr-dash-test3="{{name}}" data-ng:attr-dash-test4="{{name}}"></span>');
        expect(element.attr('dash-test2')).toBeUndefined();
        expect(element.attr('dash-test3')).toBeUndefined();
        expect(element.attr('dash-test4')).toBeUndefined();
        $rootScope.$digest();
        expect(element.attr('dash-test2')).toBe('JamieMason');
        expect(element.attr('dash-test3')).toBe('JamieMason');
        expect(element.attr('dash-test4')).toBe('JamieMason');
      }));

      it('should keep attributes ending with -start single-element directives', function () {
        angular.mock.module(function ($compileProvider) {
          $compileProvider.directive('dashStarter', function (log) {
            return {
              link: function (scope, element, attrs) {
                log(attrs.onDashStart);
              }
            };
          });
        });
        angular.mock.inject(function ($compile, $rootScope, log) {
          compileForTest('<span data-dash-starter data-on-dash-start="starter"></span>');
          $rootScope.$digest();
          expect(log).toEqual('starter');
        });
      });

      it('should keep attributes ending with -end single-element directives', function () {
        angular.mock.module(function ($compileProvider) {
          $compileProvider.directive('dashEnder', function (log) {
            return {
              link: function (scope, element, attrs) {
                log(attrs.onDashEnd);
              }
            };
          });
        });
        angular.mock.inject(function ($compile, $rootScope, log) {
          compileForTest('<span data-dash-ender data-on-dash-end="ender"></span>');
          $rootScope.$digest();
          expect(log).toEqual('ender');
        });
      });
    });
  });


  describe('when an attribute has an underscore-separated name', function () {

    it('should work with different prefixes', angular.mock.inject(function ($compile, $rootScope) {
      $rootScope.dimensions = '0 0 0 0';
      element = compileForTest('<svg ng:attr:view_box="{{dimensions}}"></svg>');
      expect(element.attr('viewBox')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('viewBox')).toBe('0 0 0 0');
    }));

    it('should work if they are prefixed with x- or data-', angular.mock.inject(function ($compile, $rootScope) {
      $rootScope.dimensions = '0 0 0 0';
      $rootScope.number = 0.42;
      $rootScope.scale = 1;
      element = compileForTest('<svg data-ng-attr-view_box="{{dimensions}}">' +
        '<filter x-ng-attr-filter_units="{{number}}">' +
        '<feDiffuseLighting data-ng:attr_surface_scale="{{scale}}">' +
        '</feDiffuseLighting>' +
        '<feSpecularLighting x-ng:attr_surface_scale="{{scale}}">' +
        '</feSpecularLighting></filter></svg>');
      expect(element.attr('viewBox')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('viewBox')).toBe('0 0 0 0');
      expect(element.find('filter').attr('filterUnits')).toBe('0.42');
      expect(element.find('feDiffuseLighting').attr('surfaceScale')).toBe('1');
      expect(element.find('feSpecularLighting').attr('surfaceScale')).toBe('1');
    }));
  });

  describe('multi-element directive', function () {
    it('should group on link function', angular.mock.inject(function ($compile, $rootScope) {
      $rootScope.show = false;
      element = compileForTest(
        '<div>' +
        '<span ng-show-start="show"></span>' +
        '<span ng-show-end></span>' +
        '</div>');
      $rootScope.$digest();
      var spans = element.find('span');
      expect(spans.eq(0)).toBeHidden();
      expect(spans.eq(1)).toBeHidden();
    }));


    it('should group on compile function', angular.mock.inject(function ($compile, $rootScope) {
      $rootScope.show = false;
      element = compileForTest(
        '<div>' +
        '<span ng-repeat-start="i in [1,2]">{{i}}A</span>' +
        '<span ng-repeat-end>{{i}}B;</span>' +
        '</div>');
      $rootScope.$digest();
      expect(element.text()).toEqual('1A1B;2A2B;');
    }));


    it('should support grouping over text nodes', angular.mock.inject(function ($compile, $rootScope) {
      $rootScope.show = false;
      element = compileForTest(
        '<div>' +
        '<span ng-repeat-start="i in [1,2]">{{i}}A</span>' +
        ':' + // Important: proves that we can iterate over non-elements
        '<span ng-repeat-end>{{i}}B;</span>' +
        '</div>');
      $rootScope.$digest();
      expect(element.text()).toEqual('1A:1B;2A:2B;');
    }));


    it('should group on $root compile function', angular.mock.inject(function ($compile, $rootScope) {
      $rootScope.show = false;
      element = compileForTest(
        '<div></div>' +
        '<span ng-repeat-start="i in [1,2]">{{i}}A</span>' +
        '<span ng-repeat-end>{{i}}B;</span>' +
        '<div></div>');
      $rootScope.$digest();
      element = angular.element(element[0].parentNode.childNodes); // reset because repeater is top level.
      toDealoc.push(element);
      expect(element.text()).toEqual('1A1B;2A2B;');
    }));


    it('should group on nested groups', function () {
      angular.mock.module(function ($compileProvider) {
        $compileProvider.directive('ngMultiBind', ngInternals.valueFn({
          multiElement: true,
          link: function (scope, element, attr) {
            element.text(scope.$eval(attr.ngMultiBind));
          }
        }));
      });
      angular.mock.inject(function ($compile, $rootScope) {
        $rootScope.show = false;
        element = compileForTest(
          '<div></div>' +
          '<div ng-repeat-start="i in [1,2]">{{i}}A</div>' +
          '<span ng-multi-bind-start="\'.\'"></span>' +
          '<span ng-multi-bind-end></span>' +
          '<div ng-repeat-end>{{i}}B;</div>' +
          '<div></div>');
        $rootScope.$digest();
        element = angular.element(element[0].parentNode.childNodes); // reset because repeater is top level.
        toDealoc.push(element);
        expect(element.text()).toEqual('1A..1B;2A..2B;');
      });
    });


    it('should group on nested groups of same directive', angular.mock.inject(function ($compile, $rootScope) {
      $rootScope.show = false;
      element = compileForTest(
        '<div></div>' +
        '<div ng-repeat-start="i in [1,2]">{{i}}(</div>' +
        '<span ng-repeat-start="j in [2,3]">{{j}}-</span>' +
        '<span ng-repeat-end>{{j}}</span>' +
        '<div ng-repeat-end>){{i}};</div>' +
        '<div></div>');
      $rootScope.$digest();
      element = angular.element(element[0].parentNode.childNodes); // reset because repeater is top level.
      toDealoc.push(element);
      expect(element.text()).toEqual('1(2-23-3)1;2(2-23-3)2;');
    }));


    it('should set up and destroy the transclusion scopes correctly',
      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest(
          '<div>' +
          '<div ng-if-start="val0"><span ng-if="val1"></span></div>' +
          '<div ng-if-end><span ng-if="val2"></span></div>' +
          '</div>'
        );
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


    it('should set up and destroy the transclusion scopes correctly',
      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest(
          '<div>' +
          '<div ng-repeat-start="val in val0" ng-if="val1"></div>' +
          '<div ng-repeat-end ng-if="val2"></div>' +
          '</div>'
        );

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

    it('should throw error if unterminated', function () {
      angular.mock.module(function ($compileProvider) {
        $compileProvider.directive('foo', function () {
          return {
            multiElement: true
          };
        });
      });
      angular.mock.inject(function ($compile, $rootScope) {
        expect(function () {
          element = compileForTest(
            '<div>' +
            '<span foo-start></span>' +
            '</div>');
        }).toThrowMinErr('$compile', 'uterdir', 'Unterminated attribute, found \'foo-start\' but no matching \'foo-end\' found.');
      });
    });


    it('should correctly collect ranges on multiple directives on a single element', function () {
      angular.mock.module(function ($compileProvider) {
        $compileProvider.directive('emptyDirective', function () {
          return {
            multiElement: true,
            link: function (scope, element) {
              element.data('x', 'abc');
            }
          };
        });
        $compileProvider.directive('rangeDirective', function () {
          return {
            multiElement: true,
            link: function (scope) {
              scope.x = 'X';
              scope.y = 'Y';
            }
          };
        });
      });

      angular.mock.inject(function ($compile, $rootScope) {
        element = compileForTest(
          '<div>' +
          '<div range-directive-start empty-directive>{{x}}</div>' +
          '<div range-directive-end>{{y}}</div>' +
          '</div>'
        );

        $rootScope.$digest();
        expect(element.text()).toBe('XY');
        expect(angular.element(element[0].firstChild).data('x')).toBe('abc');
      });
    });


    it('should throw error if unterminated (containing termination as a child)', function () {
      angular.mock.module(function ($compileProvider) {
        $compileProvider.directive('foo', function () {
          return {
            multiElement: true
          };
        });
      });
      angular.mock.inject(function ($compile) {
        expect(function () {
          element = compileForTest(
            '<div>' +
            '<span foo-start><span foo-end></span></span>' +
            '</div>');
        }).toThrowMinErr('$compile', 'uterdir', 'Unterminated attribute, found \'foo-start\' but no matching \'foo-end\' found.');
      });
    });


    it('should support data- and x- prefix', angular.mock.inject(function ($compile, $rootScope) {
      $rootScope.show = false;
      element = compileForTest(
        '<div>' +
        '<span data-ng-show-start="show"></span>' +
        '<span data-ng-show-end></span>' +
        '<span x-ng-show-start="show"></span>' +
        '<span x-ng-show-end></span>' +
        '</div>');
      $rootScope.$digest();
      var spans = element.find('span');
      expect(spans.eq(0)).toBeHidden();
      expect(spans.eq(1)).toBeHidden();
      expect(spans.eq(2)).toBeHidden();
      expect(spans.eq(3)).toBeHidden();
    }));
  });

  describe('$animate animation hooks', function () {

    beforeEach(angular.mock.module('ngAnimateMock'));

    it('should automatically fire the addClass and removeClass animation hooks',
      angular.mock.inject(function ($compile, $animate, $rootScope) {

        var data, element = angular.element('<div class="{{val1}} {{val2}} fire"></div>');
        toDealoc.push(element);
        compileForTest(element);

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

  describe('element replacement', function () {
    it('should broadcast $destroy only on removed elements, not replaced', function () {
      var linkCalls = [];
      var destroyCalls = [];

      angular.mock.module(function ($compileProvider) {
        $compileProvider.directive('replace', function () {
          return {
            multiElement: true,
            replace: true,
            templateUrl: 'template123'
          };
        });

        $compileProvider.directive('foo', function () {
          return {
            priority: 1, // before the replace directive
            link: function ($scope, $element, $attrs) {
              linkCalls.push($attrs.foo);
              $element.on('$destroy', function () {
                destroyCalls.push($attrs.foo);
              });
            }
          };
        });
      });

      angular.mock.inject(function ($compile, $templateCache, $rootScope) {
        $templateCache.put('template123', '<p></p>');

        compileForTest(
          '<div replace-start foo="1"><span foo="1.1"></span></div>' +
          '<div foo="2"><span foo="2.1"></span></div>' +
          '<div replace-end foo="3"><span foo="3.1"></span></div>'
        );

        expect(linkCalls).toEqual(['2', '3']);
        expect(destroyCalls).toEqual([]);
        $rootScope.$apply();
        expect(linkCalls).toEqual(['2', '3', '1']);
        expect(destroyCalls).toEqual(['2', '3']);
      });
    });

    function getAll($root) {
      // check for .querySelectorAll to support comment nodes
      return [$root[0]].concat($root[0].querySelectorAll ? Array.from($root[0].querySelectorAll('*')) : []);
    }

    function testCompileLinkDataCleanup(template) {
      angular.mock.inject(function ($compile, $rootScope) {
        var toCompile = angular.element(template);

        var preCompiledChildren = getAll(toCompile);
        angular.forEach(preCompiledChildren, function (element, i) {
          angular.element.data(element, 'foo', 'template#' + i);
        });

        var linkedElements = compileForTest(toCompile);
        $rootScope.$apply();
        linkedElements.remove();

        angular.forEach(preCompiledChildren, function (element, i) {
          expect(angular.element.hasData(element)).toBe(false, 'template#' + i);
        });
        angular.forEach(getAll(linkedElements), function (element, i) {
          expect(angular.element.hasData(element)).toBe(false, 'linked#' + i);
        });
      });
    }

    it('should clean data of element-transcluded link-cloned elements', function () {
      testCompileLinkDataCleanup('<div><div ng-repeat-start="i in [1,2]"><span></span></div><div ng-repeat-end></div></div>');
    });
    it('should clean data of element-transcluded elements', function () {
      testCompileLinkDataCleanup('<div ng-if-start="false"><span><span/></div><span></span><div ng-if-end><span></span></div>');
    });

    function testReplaceElementCleanup(dirOptions) {
      var template = '<div></div>';
      angular.mock.module(function ($compileProvider) {
        $compileProvider.directive('theDir', function () {
          return {
            multiElement: true,
            replace: dirOptions.replace,
            transclude: dirOptions.transclude,
            template: dirOptions.asyncTemplate ? undefined : template,
            templateUrl: dirOptions.asyncTemplate ? 'the-dir-template-url' : undefined
          };
        });
      });
      angular.mock.inject(function ($templateCache, $compile, $rootScope) {
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

    it('should clean data of elements removed for directive template', function () {
      testReplaceElementCleanup({});
    });
    it('should clean data of elements removed for directive templateUrl', function () {
      testReplaceElementCleanup({ asyncTemplate: true });
    });
    it('should clean data of elements transcluded into directive template', function () {
      testReplaceElementCleanup({ transclude: true });
    });
    it('should clean data of elements transcluded into directive templateUrl', function () {
      testReplaceElementCleanup({ transclude: true, asyncTemplate: true });
    });
    it('should clean data of elements replaced with directive template', function () {
      testReplaceElementCleanup({ replace: true });
    });
    it('should clean data of elements replaced with directive templateUrl', function () {
      testReplaceElementCleanup({ replace: true, asyncTemplate: true });
    });
  });

  describe('component helper', function () {
    it('should return the module', function () {
      var myModule = angular.module('my', []);
      expect(myModule.component('myComponent', {})).toBe(myModule);
      expect(myModule.component({})).toBe(myModule);
    });

    it('should register a directive', function () {
      angular.module('my', []).component('myComponent', {
        template: '<div>SUCCESS</div>',
        controller: function (log) {
          log('OK');
        }
      });
      angular.mock.module('my');

      angular.mock.inject(function ($compile, $rootScope, log) {
        element = compileForTest('<my-component></my-component>');
        expect(element.find('div').text()).toEqual('SUCCESS');
        expect(log).toEqual('OK');
      });
    });

    it('should register multiple directives when object passed as first parameter', function () {
      var log = '';
      angular.module('my', []).component({
        fooComponent: {
          template: '<div>FOO SUCCESS</div>',
          controller: function () {
            log += 'FOO:OK';
          }
        },
        barComponent: {
          template: '<div>BAR SUCCESS</div>',
          controller: function () {
            log += 'BAR:OK';
          }
        }
      });
      angular.mock.module('my');

      angular.mock.inject(function ($compile, $rootScope) {
        var fooElement = compileForTest('<foo-component></foo-component>');
        var barElement = compileForTest('<bar-component></bar-component>');

        expect(fooElement.find('div').text()).toEqual('FOO SUCCESS');
        expect(barElement.find('div').text()).toEqual('BAR SUCCESS');
        expect(log).toEqual('FOO:OKBAR:OK');
      });
    });

    it('should register a directive via $compileProvider.component()', function () {
      angular.mock.module(function ($compileProvider) {
        $compileProvider.component('myComponent', {
          template: '<div>SUCCESS</div>',
          controller: function (log) {
            log('OK');
          }
        });
      });

      angular.mock.inject(function ($compile, $rootScope, log) {
        element = compileForTest('<my-component></my-component>');
        expect(element.find('div').text()).toEqual('SUCCESS');
        expect(log).toEqual('OK');
      });
    });

    it('should add additional annotations to directive factory', function () {
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

    it('should expose additional annotations on the directive definition object', function () {
      angular.module('my', []).component('myComponent', {
        $canActivate: 'canActivate',
        $routeConfig: 'routeConfig',
        $customAnnotation: 'XXX'
      });
      angular.mock.module('my');
      angular.mock.inject(function (myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          $canActivate: 'canActivate',
          $routeConfig: 'routeConfig',
          $customAnnotation: 'XXX'
        }));
      });
    });

    it('should support custom annotations if the controller is named', function () {
      angular.module('my', []).component('myComponent', {
        $customAnnotation: 'XXX',
        controller: 'SomeNamedController'
      });
      angular.mock.module('my');
      angular.mock.inject(function (myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          $customAnnotation: 'XXX'
        }));
      });
    });

    it('should provide a new empty controller if none is specified', function () {
      angular.module('my', []).component('myComponent1', { $customAnnotation1: 'XXX' }).component('myComponent2', { $customAnnotation2: 'YYY' });

      angular.mock.module('my');

      angular.mock.inject(function (myComponent1Directive, myComponent2Directive) {
        var ctrl1 = myComponent1Directive[0].controller;
        var ctrl2 = myComponent2Directive[0].controller;

        expect(ctrl1).not.toBe(ctrl2);
        expect(ctrl1.$customAnnotation1).toBe('XXX');
        expect(ctrl1.$customAnnotation2).toBeUndefined();
        expect(ctrl2.$customAnnotation1).toBeUndefined();
        expect(ctrl2.$customAnnotation2).toBe('YYY');
      });
    });

    it('should return ddo with reasonable defaults', function () {
      angular.module('my', []).component('myComponent', {});
      angular.mock.module('my');
      angular.mock.inject(function (myComponentDirective) {
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

    it('should return ddo with assigned options', function () {
      function myCtrl() {
      }

      angular.module('my', []).component('myComponent', {
        controller: myCtrl,
        controllerAs: 'ctrl',
        template: 'abc',
        templateUrl: 'def.html',
        transclude: true,
        bindings: { abc: '=' }
      });
      angular.mock.module('my');
      angular.mock.inject(function (myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          controller: myCtrl,
          controllerAs: 'ctrl',
          template: 'abc',
          templateUrl: 'def.html',
          transclude: true,
          scope: {},
          bindToController: { abc: '=' },
          restrict: 'E'
        }));
      });
    });

    it('should allow passing injectable functions as template/templateUrl', function () {
      var log = '';
      angular.module('my', []).component('myComponent', {
        template: function ($element, $attrs, myValue) {
          log += 'template,' + $element + ',' + $attrs + ',' + myValue + '\n';
        },
        templateUrl: function ($element, $attrs, myValue) {
          log += 'templateUrl,' + $element + ',' + $attrs + ',' + myValue + '\n';
        }
      }).value('myValue', 'blah');
      angular.mock.module('my');
      angular.mock.inject(function (myComponentDirective) {
        myComponentDirective[0].template('a', 'b');
        myComponentDirective[0].templateUrl('c', 'd');
        expect(log).toEqual('template,a,b,blah\ntemplateUrl,c,d,blah\n');
      });
    });

    it('should allow passing injectable arrays as template/templateUrl', function () {
      var log = '';
      angular.module('my', []).component('myComponent', {
        template: ['$element', '$attrs', 'myValue', function ($element, $attrs, myValue) {
          log += 'template,' + $element + ',' + $attrs + ',' + myValue + '\n';
        }],
        templateUrl: ['$element', '$attrs', 'myValue', function ($element, $attrs, myValue) {
          log += 'templateUrl,' + $element + ',' + $attrs + ',' + myValue + '\n';
        }]
      }).value('myValue', 'blah');
      angular.mock.module('my');
      angular.mock.inject(function (myComponentDirective) {
        myComponentDirective[0].template('a', 'b');
        myComponentDirective[0].templateUrl('c', 'd');
        expect(log).toEqual('template,a,b,blah\ntemplateUrl,c,d,blah\n');
      });
    });

    it('should allow passing transclude as object', function () {
      angular.module('my', []).component('myComponent', {
        transclude: {}
      });
      angular.mock.module('my');
      angular.mock.inject(function (myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          transclude: {}
        }));
      });
    });

    it('should give ctrl as syntax priority over controllerAs', function () {
      angular.module('my', []).component('myComponent', {
        controller: 'MyCtrl as vm'
      });
      angular.mock.module('my');
      angular.mock.inject(function (myComponentDirective) {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          controllerAs: 'vm'
        }));
      });
    });
  });

  describe('$$createComment', function () {
    it('should create empty comments if `debugInfoEnabled` is false', function () {
      angular.mock.module(function ($compileProvider) {
        $compileProvider.debugInfoEnabled(false);
      });

      angular.mock.inject(function ($compile) {
        var comment = $compile.$$createComment('foo', 'bar');
        expect(comment.data).toBe('');
      });
    });

    it('should create descriptive comments if `debugInfoEnabled` is true', function () {
      angular.mock.module(function ($compileProvider) {
        $compileProvider.debugInfoEnabled(true);
      });

      angular.mock.inject(function ($compile) {
        var comment = $compile.$$createComment('foo', 'bar');
        expect(comment.data).toBe(' foo: bar ');
      });
    });
  });
});
