'use strict';

describe('ngView', function() {

  describe('basics', function() {
    var element;

    beforeEach(angular.mock.module('ngRoute'));

    beforeEach(angular.mock.module(function() {
      return function($rootScope, $compile) {
        element = $compile('<div><ng:view onload="load()"></ng:view></div>')($rootScope);
      };
    }));


    afterEach(function() {
      dealoc(element);
    });


    it('should do nothing when no routes are defined',
        angular.mock.inject(function($rootScope, $compile, $location) {
      $location.path('/unknown');
      $rootScope.$digest();
      expect(element.text()).toEqual('');
    }));


    it('should instantiate controller after compiling the content', function() {
      var log = [];
      var controllerScope;

      var Ctrl = function($scope) {
        controllerScope = $scope;
        log.push('ctrl-init');
      };

      angular.mock.module(function($compileProvider, $routeProvider) {
        $compileProvider.directive('compileLog', function() {
          return {
            compile() {
              log.push('compile');
            }
          };
        });

        $routeProvider.when('/some', {templateUrl: '/tpl.html', controller: Ctrl});
      });

      angular.mock.inject(function($route, $rootScope, $templateCache, $location) {
        $templateCache.put('/tpl.html', [200, '<div compile-log>partial</div>', {}]);
        $location.path('/some');
        $rootScope.$digest();

        expect(controllerScope.$parent).toBe($rootScope);
        expect(controllerScope).toBe($route.current.scope);
        expect(log).toEqual(['compile', 'ctrl-init']);
      });
    });


    it('should instantiate the associated controller when an empty template is downloaded', function() {
      var log = [];
      var controllerScope;

      var Ctrl = function($scope) {
        controllerScope = $scope;
        log.push('ctrl-init');
      };

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/some', {templateUrl: '/tpl.html', controller: Ctrl});
      });

      angular.mock.inject(function($route, $rootScope, $templateCache, $location) {
        $templateCache.put('/tpl.html', [200, '', {}]);
        $location.path('/some');

        expect(function() {
          $rootScope.$digest();
        }).not.toThrow();

        expect(controllerScope).toBeDefined();
      });
    });


    it('should instantiate controller with an alias', function() {
      var controllerScope;

      function Ctrl($scope) {
        this.name = 'alias';
        controllerScope = $scope;
      }

      angular.mock.module(function($compileProvider, $routeProvider) {
        $routeProvider.when('/some', {templateUrl: '/tpl.html', controller: Ctrl, controllerAs: 'ctrl'});
      });

      angular.mock.inject(function($route, $rootScope, $templateCache, $location) {
        $templateCache.put('/tpl.html', [200, '<div></div>', {}]);
        $location.path('/some');
        $rootScope.$digest();

        expect(controllerScope.ctrl.name).toBe('alias');
      });
    });


    it('should support string controller declaration', function() {
      var MyCtrl = jest.fn();

      angular.mock.module(function($controllerProvider, $routeProvider) {
        $controllerProvider.register('MyCtrl', ['$scope', MyCtrl]);
        $routeProvider.when('/foo', {controller: 'MyCtrl', templateUrl: '/tpl.html'});
      });

      angular.mock.inject(function($route, $location, $rootScope, $templateCache) {
        $templateCache.put('/tpl.html', [200, '<div></div>', {}]);
        $location.path('/foo');
        $rootScope.$digest();

        expect($route.current.controller).toBe('MyCtrl');
        expect(MyCtrl).toHaveBeenCalledWith(element.children().scope());
      });
    });


    it('should reference resolved locals in scope', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {
          resolve: {
            name() {
              return 'shahar';
            }
          },
          template: '<div>{{$resolve.name}}</div>'
        });
      });

      angular.mock.inject(function($location, $rootScope) {
        $location.path('/foo');
        $rootScope.$digest();
        expect(element.text()).toEqual('shahar');
      });
    });


    it('should allow to provide an alias for resolved locals using resolveAs', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {
          resolveAs: 'myResolve',
          resolve: {
            name() {
              return 'shahar';
            }
          },
          template: '<div>{{myResolve.name}}</div>'
        });
      });

      angular.mock.inject(function($location, $rootScope) {
        $location.path('/foo');
        $rootScope.$digest();
        expect(element.text()).toEqual('shahar');
      });
    });


    it('should load content via xhr when route changes', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'myUrl1'});
        $routeProvider.when('/bar', {templateUrl: 'myUrl2'});
      });

      angular.mock.inject(function($rootScope, $httpBackend, $location) {
        expect(element.text()).toEqual('');

        $location.path('/foo');
        $httpBackend.expect('GET', 'myUrl1').respond('<div>{{1+3}}</div>');
        $rootScope.$digest();
        $httpBackend.flush();
        expect(element.text()).toEqual('4');

        $location.path('/bar');
        $httpBackend.expect('GET', 'myUrl2').respond('angular is da best');
        $rootScope.$digest();
        $httpBackend.flush();
        expect(element.text()).toEqual('angular is da best');
      });
    });


    it('should use inline content route changes', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {template: '<div>{{1+3}}</div>'});
        $routeProvider.when('/bar', {template: 'AngularJS is da best'});
        $routeProvider.when('/blank', {template: ''});
      });

      angular.mock.inject(function($rootScope, $location) {
        expect(element.text()).toEqual('');

        $location.path('/foo');
        $rootScope.$digest();
        expect(element.text()).toEqual('4');

        $location.path('/bar');
        $rootScope.$digest();
        expect(element.text()).toEqual('AngularJS is da best');

        $location.path('/blank');
        $rootScope.$digest();
        expect(element.text()).toEqual('');
      });
    });


    it('should remove all content when location changes to an unknown route', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'myUrl1'});
      });

      angular.mock.inject(function($rootScope, $location, $httpBackend) {
        $location.path('/foo');
        $httpBackend.expect('GET', 'myUrl1').respond('<div>{{1+3}}</div>');
        $rootScope.$digest();
        $httpBackend.flush();
        expect(element.text()).toEqual('4');

        $location.path('/unknown');
        $rootScope.$digest();
        expect(element.text()).toEqual('');
      });
    });


    it('should chain scopes and propagate evals to the child scope', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'myUrl1'});
      });

      angular.mock.inject(function($rootScope, $location, $httpBackend) {
        $rootScope.parentVar = 'parent';

        $location.path('/foo');
        $httpBackend.expect('GET', 'myUrl1').respond('<div>{{parentVar}}</div>');
        $rootScope.$digest();
        $httpBackend.flush();
        expect(element.text()).toEqual('parent');

        $rootScope.parentVar = 'new parent';
        $rootScope.$digest();
        expect(element.text()).toEqual('new parent');
      });
    });


    it('should be possible to nest ngView in ngInclude', function() {

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'viewPartial.html'});
      });

      angular.mock.inject(function($httpBackend, $location, $route, $compile, $rootScope) {
        $httpBackend.whenGET('includePartial.html').respond('view: <ng:view></ng:view>');
        $httpBackend.whenGET('viewPartial.html').respond('content');
        $location.path('/foo');

        var elm = $compile(
          '<div>' +
            'include: <ng:include src="\'includePartial.html\'"> </ng:include>' +
          '</div>')($rootScope);
        $rootScope.$digest();
        $httpBackend.flush();

        expect(elm.text()).toEqual('include: view: content');
        expect($route.current.templateUrl).toEqual('viewPartial.html');
        dealoc(elm);
      });
    });


    it('should initialize view template after the view controller was initialized even when ' +
      'templates were cached', function() {
      //this is a test for a regression that was introduced by making the ng-view cache sync
      function ParentCtrl($scope) {
        $scope.log.push('parent');
      }

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {controller: ParentCtrl, templateUrl: 'viewPartial.html'});
      });


      angular.mock.inject(function($rootScope, $location, $httpBackend) {
        $rootScope.log = [];

        $rootScope.ChildCtrl = function($scope) {
          $scope.log.push('child');
        };

        $location.path('/foo');
        $httpBackend.expect('GET', 'viewPartial.html').
            respond('<div ng-init="log.push(\'init\')">' +
                      '<div ng-controller="ChildCtrl"></div>' +
                    '</div>');
        $rootScope.$apply();
        $httpBackend.flush();

        expect($rootScope.log).toEqual(['parent', 'init', 'child']);

        $location.path('/');
        $rootScope.$apply();
        expect($rootScope.log).toEqual(['parent', 'init', 'child']);

        $rootScope.log = [];
        $location.path('/foo');
        $rootScope.$apply();

        expect($rootScope.log).toEqual(['parent', 'init', 'child']);
      });
    });


    it('should discard pending xhr callbacks if a new route is requested before the current ' +
        'finished loading',  function() {
      // this is a test for a bad race condition that affected feedback

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'myUrl1'});
        $routeProvider.when('/bar', {templateUrl: 'myUrl2'});
      });

      angular.mock.inject(function($route, $rootScope, $location, $httpBackend) {
        expect(element.text()).toEqual('');

        $location.path('/foo');
        $httpBackend.expect('GET', 'myUrl1').respond('<div>{{1+3}}</div>');
        $rootScope.$digest();
        $location.path('/bar');
        $httpBackend.expect('GET', 'myUrl2').respond('<div>{{1+1}}</div>');
        $rootScope.$digest();
        $httpBackend.flush(); // now that we have two requests pending, flush!

        expect(element.text()).toEqual('2');
      });
    });


    it('should be async even if served from cache', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {controller: angular.noop, templateUrl: 'myUrl1'});
      });

      angular.mock.inject(function($route, $rootScope, $location, $templateCache) {
        $templateCache.put('myUrl1', [200, 'my partial', {}]);
        $location.path('/foo');

        var called = 0;
        // we want to assert only during first watch
        $rootScope.$watch(function() {
          if (!called) expect(element.text()).toBe('');
          called++;
        });

        $rootScope.$digest();
        expect(element.text()).toBe('my partial');
      });
    });

    it('should fire $contentLoaded event when content compiled and linked', function() {
      var log = [];
      var logger = function(name) {
        return function() {
          log.push(name);
        };
      };
      var Ctrl = function($scope) {
        $scope.value = 'bound-value';
        log.push('init-ctrl');
      };

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'tpl.html', controller: Ctrl});
      });

      angular.mock.inject(function($templateCache, $rootScope, $location) {
        $rootScope.$on('$routeChangeStart', logger('$routeChangeStart'));
        $rootScope.$on('$routeChangeSuccess', logger('$routeChangeSuccess'));
        $rootScope.$on('$viewContentLoaded', logger('$viewContentLoaded'));

        $templateCache.put('tpl.html', [200, '{{value}}', {}]);
        $location.path('/foo');
        $rootScope.$digest();

        expect(element.text()).toBe('bound-value');
        expect(log).toEqual([
          '$routeChangeStart', 'init-ctrl', '$viewContentLoaded', '$routeChangeSuccess'
        ]);
      });
    });

    it('should destroy previous scope', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'tpl.html'});
      });

      angular.mock.inject(function($templateCache, $rootScope, $location) {
        $templateCache.put('tpl.html', [200, 'partial', {}]);

        expect($rootScope.$$childHead).toBeNull();
        expect($rootScope.$$childTail).toBeNull();

        $location.path('/foo');
        $rootScope.$digest();

        expect(element.text()).toBe('partial');
        expect($rootScope.$$childHead).not.toBeNull();
        expect($rootScope.$$childTail).not.toBeNull();

        $location.path('/non/existing/route');
        $rootScope.$digest();

        expect(element.text()).toBe('');
        expect($rootScope.$$childHead).toBeNull();
        expect($rootScope.$$childTail).toBeNull();
      });
    });


    it('should destroy previous scope if multiple route changes occur before server responds',
        function() {
      var log = [];
      var createCtrl = function(name) {
        return function($scope) {
          log.push('init-' + name);
          $scope.$on('$destroy', function() {log.push('destroy-' + name);});
        };
      };

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/one', {templateUrl: 'one.html', controller: createCtrl('ctrl1')});
        $routeProvider.when('/two', {templateUrl: 'two.html', controller: createCtrl('ctrl2')});
      });

      angular.mock.inject(function($httpBackend, $rootScope, $location) {
        $httpBackend.whenGET('one.html').respond('content 1');
        $httpBackend.whenGET('two.html').respond('content 2');

        $location.path('/one');
        $rootScope.$digest();
        $location.path('/two');
        $rootScope.$digest();

        $httpBackend.flush();
        expect(element.text()).toBe('content 2');
        expect(log).toEqual(['init-ctrl2']);

        $location.path('/non-existing');
        $rootScope.$digest();

        expect(element.text()).toBe('');
        expect(log).toEqual(['init-ctrl2', 'destroy-ctrl2']);

        expect($rootScope.$$childHead).toBeNull();
        expect($rootScope.$$childTail).toBeNull();
      });
    });


    it('should $destroy scope after update and reload',  function() {
      // this is a regression of bug, where $route doesn't copy scope when only updating

      var log = [];

      function logger(msg) {
        return function() {
          log.push(msg);
        };
      }

      function createController(name) {
        return function($scope) {
          log.push('init-' + name);
          $scope.$on('$destroy', logger('destroy-' + name));
          $scope.$on('$routeUpdate', logger('route-update'));
        };
      }

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/bar', {templateUrl: 'tpl.html', controller: createController('bar')});
        $routeProvider.when('/foo', {
          templateUrl: 'tpl.html',
          controller: createController('foo'),
          reloadOnSearch: false
        });
      });

      angular.mock.inject(function($templateCache, $location, $rootScope) {
        $templateCache.put('tpl.html', [200, 'partial', {}]);

        $location.url('/foo');
        $rootScope.$digest();
        expect(log).toEqual(['init-foo']);

        $location.search({q: 'some'});
        $rootScope.$digest();
        expect(log).toEqual(['init-foo', 'route-update']);

        $location.url('/bar');
        $rootScope.$digest();
        expect(log).toEqual(['init-foo', 'route-update', 'destroy-foo', 'init-bar']);
      });
    });


    it('should evaluate onload expression after linking the content', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'tpl.html'});
      });

      angular.mock.inject(function($templateCache, $location, $rootScope) {
        $templateCache.put('tpl.html', [200, '{{1+1}}', {}]);
        $rootScope.load = jest.fn();

        $location.url('/foo');
        $rootScope.$digest();
        expect($rootScope.load).toHaveBeenCalledTimes(1);
      });
    });


    it('should set $scope and $controllerController on the view elements (except for non-element nodes)', function() {
      function MyCtrl($scope) {
        $scope.state = 'WORKS';
        $scope.ctrl = this;
      }

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'tpl.html', controller: MyCtrl});
      });

      angular.mock.inject(function($templateCache, $location, $rootScope, $route) {
        // in the template the white-space before the div is an intentional non-element node,
        // a text might get wrapped into span so it's safer to just use white space
        $templateCache.put('tpl.html', [200, '   \n   <div>{{state}}</div>', {}]);

        $location.url('/foo');
        $rootScope.$digest();
        expect(element.text()).toEqual('   \n   WORKS');

        var div = element.find('div');
        expect(div.parent()[0].nodeName.toUpperCase()).toBeOneOf('NG:VIEW', 'VIEW');

        expect(div.scope()).toBe($route.current.scope);
        expect(div.scope().hasOwnProperty('state')).toBe(true);
        expect(div.scope().state).toEqual('WORKS');

        expect(div.controller()).toBe($route.current.scope.ctrl);
      });
    });

    it('should not set $scope or $controllerController on top level text elements in the view', function() {
      function MyCtrl($scope) {}

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'tpl.html', controller: MyCtrl});
      });

      angular.mock.inject(function($templateCache, $location, $rootScope, $route) {
        $templateCache.put('tpl.html', '<div></div>  ');
        $location.url('/foo');
        $rootScope.$digest();

        angular.forEach(element.contents(), function(node) {
          if (node.nodeType === 3 /* text node */) {
            expect(angular.element(node).scope()).not.toBe($route.current.scope);
            expect(angular.element(node).controller()).not.toBeDefined();
          } else if (node.nodeType === 8 /* comment node */) {
            expect(angular.element(node).scope()).toBe(element.scope());
            expect(angular.element(node).controller()).toBe(element.controller());
          } else {
            expect(angular.element(node).scope()).toBe($route.current.scope);
            expect(angular.element(node).controller()).toBeDefined();
          }
        });
      });
    });


    it('should not trigger a digest when the view is changed', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'myUrl1'});
        $routeProvider.when('/bar', {templateUrl: 'myUrl2'});
      });

      angular.mock.inject(function($$rAF, $templateCache, $rootScope, $compile, $timeout, $location) {
        var spy = jest.spyOn($rootScope, '$digest');

        $templateCache.put('myUrl1', 'my template content');
        $templateCache.put('myUrl2', 'my other template content');

        $location.path('/foo');
        $rootScope.$digest();

        // The animation completion is async even without actual animations
        $$rAF.flush();
        expect(element.text()).toEqual('my template content');

        $location.path('/bar');
        $rootScope.$digest();
        spy.mockReset();

        $$rAF.flush();
        expect(element.text()).toEqual('my other template content');

        expect(spy).not.toHaveBeenCalled();
        // A digest may have been triggered asynchronously, so check the queue
        $timeout.verifyNoPendingTasks();
      });
    });

  });

  describe('and transcludes', function() {
    var element;
    var directive;

    beforeEach(angular.mock.module('ngRoute', function($compileProvider) {
      element = null;
      directive = $compileProvider.directive;
    }));

    afterEach(function() {
      if (element) {
        dealoc(element);
      }
    });

    it('should allow access to directive controller from children when used in a replace template', function() {
      var controller;
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/view', {templateUrl: 'view.html'});
        directive('template', function() {
          return {
            template: '<div ng-view></div>',
            replace: true,
            controller() {
              this.flag = true;
            }
          };
        });

        directive('test', function() {
          return {
            require: '^template',
            link(scope, el, attr, ctrl) {
              controller = ctrl;
            }
          };
        });
      });
      angular.mock.inject(function($compile, $rootScope, $httpBackend, $location) {
        $httpBackend.expectGET('view.html').respond('<div><div test></div></div>');
        element = $compile('<div><div template></div></div>')($rootScope);
        $location.url('/view');
        $rootScope.$apply();
        $httpBackend.flush();
        expect(controller.flag).toBe(true);
      });
    });

    it('should compile its content correctly (although we remove it later)', function() {
      var testElement;
      angular.mock.module(function($compileProvider, $routeProvider) {
        $routeProvider.when('/view', {template: ' '});
        var directive = $compileProvider.directive;
        directive('test', function() {
          return {
            link(scope, element) {
              testElement = element;
            }
          };
        });
      });
      angular.mock.inject(function($compile, $rootScope, $location) {
        element = $compile('<div><div ng-view><div test someAttr></div></div></div>')($rootScope);
        $location.url('/view');
        $rootScope.$apply();
        expect(testElement[0].nodeName).toBe('DIV');
      });

    });

    it('should link directives on the same element after the content has been loaded', function() {
      var contentOnLink;
      angular.mock.module(function($compileProvider, $routeProvider) {
        $routeProvider.when('/view', {template: 'someContent'});
        $compileProvider.directive('test', function() {
          return {
            link(scope, element) {
              contentOnLink = element.text();
            }
          };
        });
      });
      angular.mock.inject(function($compile, $rootScope, $location) {
        element = $compile('<div><div ng-view test></div>')($rootScope);
        $location.url('/view');
        $rootScope.$apply();
        expect(contentOnLink).toBe('someContent');
      });
    });

    it('should add the content to the element before compiling it', function() {
      var root;
      angular.mock.module(function($compileProvider, $routeProvider) {
        $routeProvider.when('/view', {template: '<span test></span>'});
        $compileProvider.directive('test', function() {
          return {
            link(scope, element) {
              root = element.parent().parent();
            }
          };
        });
      });
      angular.mock.inject(function($compile, $rootScope, $location) {
        element = $compile('<div><div ng-view></div>')($rootScope);
        $location.url('/view');
        $rootScope.$apply();
        expect(root[0]).toBe(element[0]);
      });
    });
  });

  describe('animations', function() {
    var body;
    var element;
    var $rootElement;

    beforeEach(angular.mock.module('ngRoute'));

    function html(content) {
      $rootElement.html(content);
      body.append($rootElement);
      element = $rootElement.children().eq(0);
      return element;
    }

    beforeEach(angular.mock.module(function() {
      // we need to run animation on attached elements;
      return function(_$rootElement_) {
        $rootElement = _$rootElement_;
        body = angular.element(window.document.body);
      };
    }));

    afterEach(function() {
      dealoc(body);
      dealoc(element);
      dealoc($rootElement)
    });


    beforeEach(angular.mock.module(function($provide, $routeProvider) {
      $routeProvider.when('/foo', {controller: angular.noop, templateUrl: '/foo.html'});
      $routeProvider.when('/bar', {controller: angular.noop, templateUrl: '/bar.html'});
      return function($templateCache) {
        $templateCache.put('/foo.html', [200, '<div>data</div>', {}]);
        $templateCache.put('/bar.html', [200, '<div>data2</div>', {}]);
      };
    }));

    describe('hooks', function() {
      beforeEach(angular.mock.module('ngAnimate'));
      beforeEach(angular.mock.module('ngAnimateMock'));

      it('should fire off the enter animation',
          angular.mock.inject(function($compile, $rootScope, $location, $timeout, $animate) {
            element = $compile(html('<div ng-view></div>'))($rootScope);

            $location.path('/foo');
            $rootScope.$digest();

            var animation = $animate.queue.pop();
            expect(animation.event).toBe('enter');
          }));

      it('should fire off the leave animation', angular.mock.inject(function($compile, $rootScope, $location, $templateCache, $timeout, $animate) {

        $templateCache.put('/foo.html', [200, '<div>foo</div>', {}]);
        element = $compile(html('<div ng-view></div>'))($rootScope);

        $location.path('/foo');
        $rootScope.$digest();


        $location.path('/');
        $rootScope.$digest();

        var animation = $animate.queue.pop();
        expect(animation.event).toBe('leave');
      }));

      it('should animate two separate ngView elements',
        angular.mock.inject(function($rootScope, $templateCache, $location, $animate) {
          $rootScope.tpl = 'one';
          element = compileForTest(html('<div ng-view></div>'));
          $rootScope.$digest();

          $location.path('/foo');
          $rootScope.$digest();

          //we don't care about the enter animation for the first element
          $animate.queue.pop();

          $location.path('/bar');
          $rootScope.$digest();

          var animationB = $animate.queue.pop();
          expect(animationB.event).toBe('leave');
          var itemB = animationB.args[0];

          var animationA = $animate.queue.pop();
          expect(animationA.event).toBe('enter');
          var itemA = animationA.args[0];

          expect(itemA).not.toEqual(itemB);
        })
      );

      it('should render ngClass on ngView',
        angular.mock.inject(function($compile, $rootScope, $templateCache, $animate, $location) {

          var item;
          $rootScope.tpl = 'one';
          $rootScope.klass = 'classy';
          element = $compile(html('<div><div ng-view ng-class="klass"></div></div>'))($rootScope);
          $rootScope.$digest();

          $location.path('/foo');
          $rootScope.$digest();
          $animate.flush();

          //we don't care about the enter animation
          $animate.queue.shift();

          var animation = $animate.queue.shift();
          expect(animation.event).toBe('addClass');

          item = animation.element;
          expect(item.hasClass('classy')).toBe(true);

          $rootScope.klass = 'boring';
          $rootScope.$digest();

          expect($animate.queue.shift().event).toBe('addClass');
          expect($animate.queue.shift().event).toBe('removeClass');

          $animate.flush();

          expect(item.hasClass('classy')).toBe(false);
          expect(item.hasClass('boring')).toBe(true);

          $location.path('/bar');
          $rootScope.$digest();

          //we don't care about the enter animation
          $animate.queue.shift();

          animation = $animate.queue.shift();
          item = animation.element;
          expect(animation.event).toBe('leave');

          expect($animate.queue.shift().event).toBe('addClass');

          expect(item.hasClass('boring')).toBe(true);
        })
      );

      it('should not double compile when the route changes', function() {
        angular.mock.module(function($routeProvider, $animateProvider) {
          $routeProvider.when('/foo', {template: '<div ng-repeat="i in [1,2]">{{i}}</div>'});
          $routeProvider.when('/bar', {template: '<div ng-repeat="i in [3,4]">{{i}}</div>'});
          $animateProvider.register('.my-animation', function() {
            return {
              leave(element, done) {
                done();
              }
            };
          });
        });

        angular.mock.inject(function($rootScope, $compile, $location, $route, $timeout, $rootElement, $sniffer, $animate) {
          element = $compile(html('<div><ng:view onload="load()" class="my-animation"></ng:view></div>'))($rootScope);
          $animate.enabled(true);

          $location.path('/foo');
          $rootScope.$digest();

          expect($animate.queue.shift().event).toBe('enter'); //ngView
          expect($animate.queue.shift().event).toBe('enter'); //repeat 1
          expect($animate.queue.shift().event).toBe('enter'); //repeat 2

          expect(element.text()).toEqual('12');

          $location.path('/bar');
          $rootScope.$digest();

          expect($animate.queue.shift().event).toBe('enter'); //ngView new
          expect($animate.queue.shift().event).toBe('leave'); //ngView old

          $rootScope.$digest();

          expect($animate.queue.shift().event).toBe('enter'); //ngRepeat 3
          expect($animate.queue.shift().event).toBe('enter'); //ngRepeat 4

          $animate.flush();

          expect(element.text()).toEqual('34');
        });
      });

      it('should destroy the previous leave animation if a new one takes place',
        angular.mock.inject(function($compile, $rootScope, $animate, $location) {
          var $scope = $rootScope.$new();
          element = $compile(html(
            '<div>' +
              '<div ng-view></div>' +
            '</div>'
          ))($scope);

          $scope.$apply('value = true');

          $location.path('/bar');
          $rootScope.$digest();

          var destroyed;
          var inner = element.children(0);
          inner.on('$destroy', function() {
            destroyed = true;
          });

          $location.path('/foo');
          $rootScope.$digest();

          $location.path('/bar');
          $rootScope.$digest();

          $location.path('/bar');
          $rootScope.$digest();

          expect(destroyed).toBe(true);
        })
      );
    });


    describe('autoscroll', function() {
      var autoScrollSpy;

      function spyOnAnchorScroll() {
        return function($provide, $routeProvider) {
          autoScrollSpy = jest.fn();
          $provide.value('$anchorScroll', autoScrollSpy);
          $routeProvider.when('/foo', {
            controller: angular.noop,
            template: '<div></div>'
          });
        };
      }

      function spyOnAnimateEnter() {
        return function($animate) {
          jest.spyOn($animate, 'enter');
        };
      }

      function compileAndLink(tpl) {
        return function($compile, $rootScope) {
          element = $compile(tpl)($rootScope);
        };
      }

      beforeEach(angular.mock.module(spyOnAnchorScroll(), 'ngAnimateMock'));
      beforeEach(angular.mock.inject(spyOnAnimateEnter()));

      it('should call $anchorScroll if autoscroll attribute is present', angular.mock.inject(compileAndLink('<div><ng:view autoscroll></ng:view></div>'), function($rootScope, $animate, $timeout, $location) {
        $location.path('/foo');
        $rootScope.$digest();

        $animate.flush();
        $rootScope.$digest();

        expect($animate.queue.shift().event).toBe('enter');
        expect(autoScrollSpy).toHaveBeenCalledTimes(1);
      }));


      it('should call $anchorScroll if autoscroll evaluates to true', angular.mock.inject(
          compileAndLink('<div><ng:view src="tpl" autoscroll="value"></ng:view></div>'),
          function($rootScope, $animate, $timeout, $location) {

        $rootScope.value = true;
        $location.path('/foo');
        $rootScope.$digest();

        $animate.flush();
        $rootScope.$digest();

        expect($animate.queue.shift().event).toBe('enter');
        expect(autoScrollSpy).toHaveBeenCalledTimes(1);
      }));


      it('should not call $anchorScroll if autoscroll attribute is not present', angular.mock.inject(compileAndLink('<div><ng:view></ng:view></div>'), function($rootScope, $location, $animate) {
        $location.path('/foo');
        $rootScope.$digest();
        expect($animate.queue.shift().event).toBe('enter');

        expect(autoScrollSpy).not.toHaveBeenCalled();
      }));


      it('should not call $anchorScroll if autoscroll evaluates to false', angular.mock.inject(compileAndLink('<div><ng:view autoscroll="value"></ng:view></div>'), function($rootScope, $location, $animate) {
        $rootScope.value = false;
        $location.path('/foo');
        $rootScope.$digest();
        expect($animate.queue.shift().event).toBe('enter');

        expect(autoScrollSpy).not.toHaveBeenCalled();
      }));


      it('should only call $anchorScroll after the "enter" animation completes', angular.mock.inject(compileAndLink('<div><ng:view autoscroll></ng:view></div>'), function($rootScope, $location, $animate) {
          $location.path('/foo');

          expect($animate.enter).not.toHaveBeenCalled();
          $rootScope.$digest();

          expect(autoScrollSpy).not.toHaveBeenCalled();

          expect($animate.queue.shift().event).toBe('enter');

          $animate.flush();
          $rootScope.$digest();

          expect($animate.enter).toHaveBeenCalledTimes(1);
          expect(autoScrollSpy).toHaveBeenCalledTimes(1);
        }
      ));
    });
  });

  describe('in async template', function() {
    beforeEach(angular.mock.module('ngRoute'));
    beforeEach(angular.mock.module(function($compileProvider, $provide, $routeProvider) {
      $compileProvider.directive('asyncView', function() {
        return {templateUrl: 'async-view.html'};
      });

      $provide.decorator('$templateRequest', function($timeout) {
        return function() {
          return $timeout(angular.identity, 500, false, '<ng-view></ng-view>');
        };
      });

      $routeProvider.when('/', {template: 'Hello, world!'});
    }));


    it('should work correctly upon initial page load',
      // Injecting `$location` here is necessary, so that it gets instantiated early
      angular.mock.inject(function($compile, $location, $rootScope, $timeout) {
        var elem = $compile('<async-view></async-view>')($rootScope);
        $rootScope.$digest();
        $timeout.flush(500);

        expect(elem.text()).toBe('Hello, world!');

        dealoc(elem);
      })
    );
  });
});
