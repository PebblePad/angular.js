'use strict';

describe('$routeProvider', function() {
  var $routeProvider;

  beforeEach(angular.mock.module('ngRoute'));
  beforeEach(angular.mock.module(function(_$routeProvider_) {
    $routeProvider = _$routeProvider_;
    $routeProvider.when('/foo', {template: 'Hello, world!'});
  }));


  it('should support enabling/disabling automatic instantiation upon initial load',
    angular.mock.inject(function() {
      expect($routeProvider.eagerInstantiationEnabled(true)).toBe($routeProvider);
      expect($routeProvider.eagerInstantiationEnabled()).toBe(true);

      expect($routeProvider.eagerInstantiationEnabled(false)).toBe($routeProvider);
      expect($routeProvider.eagerInstantiationEnabled()).toBe(false);

      expect($routeProvider.eagerInstantiationEnabled(true)).toBe($routeProvider);
      expect($routeProvider.eagerInstantiationEnabled()).toBe(true);
    })
  );


  it('should automatically instantiate `$route` upon initial load', function() {
    angular.mock.inject(function($location, $rootScope) {
      $location.path('/foo');
      $rootScope.$digest();
    });

    angular.mock.inject(function($route) {
      expect($route.current).toBeDefined();
    });
  });


  it('should not automatically instantiate `$route` if disabled', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.eagerInstantiationEnabled(false);
    });

    angular.mock.inject(function($location, $rootScope) {
      $location.path('/foo');
      $rootScope.$digest();
    });

    angular.mock.inject(function($route) {
      expect($route.current).toBeUndefined();
    });
  });
});


describe('$route', function() {
  var $httpBackend;
  var element;

  beforeEach(angular.mock.module('ngRoute'));

  beforeEach(angular.mock.module(function() {
    return function(_$httpBackend_) {
      $httpBackend = _$httpBackend_;
      $httpBackend.when('GET', 'Chapter.html').respond('chapter');
      $httpBackend.when('GET', 'test.html').respond('test');
      $httpBackend.when('GET', 'foo.html').respond('foo');
      $httpBackend.when('GET', 'baz.html').respond('baz');
      $httpBackend.when('GET', 'bar.html').respond('bar');
      $httpBackend.when('GET', 'http://example.com/trusted-template.html').respond('cross domain trusted template');
      $httpBackend.when('GET', '404.html').respond('not found');
    };
  }));

  afterEach(function() {
    dealoc(element);
  });

  it('should allow cancellation via $locationChangeStart via $routeChangeStart', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/Edit', {
        id: 'edit', template: 'Some edit functionality'
      });
      $routeProvider.when('/Home', {
        id: 'home'
      });
    });
    angular.mock.module(provideLog);
    angular.mock.inject(function($route, $location, $rootScope, $compile, log) {
      $rootScope.$on('$routeChangeStart', function(event, next, current) {
        if (next.id === 'home' && current.scope.unsavedChanges) {
          event.preventDefault();
        }
      });
      element = compileForTest('<div><div ng-view></div></div>');
      $rootScope.$apply(function() {
        $location.path('/Edit');
      });
      $rootScope.$on('$routeChangeSuccess', log.fn('routeChangeSuccess'));
      $rootScope.$on('$locationChangeSuccess', log.fn('locationChangeSuccess'));

      // aborted route change
      $rootScope.$apply(function() {
        $route.current.scope.unsavedChanges = true;
      });
      $rootScope.$apply(function() {
        $location.path('/Home');
      });
      expect($route.current.id).toBe('edit');
      expect($location.path()).toBe('/Edit');
      expect(log).toEqual([]);

      // successful route change
      $rootScope.$apply(function() {
        $route.current.scope.unsavedChanges = false;
      });
      $rootScope.$apply(function() {
        $location.path('/Home');
      });
      expect($route.current.id).toBe('home');
      expect($location.path()).toBe('/Home');
      expect(log).toEqual(['locationChangeSuccess', 'routeChangeSuccess']);
    });
  });

  it('should allow redirects while handling $routeChangeStart', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/some', {
        id: 'some', template: 'Some functionality'
      });
      $routeProvider.when('/redirect', {
        id: 'redirect'
      });
    });
    angular.mock.module(provideLog);
    angular.mock.inject(function($route, $location, $rootScope, $compile, log) {
      $rootScope.$on('$routeChangeStart', function(event, next) {
        if (next.id === 'some') {
          $location.path('/redirect');
        }
      });
      compileForTest('<div><div ng-view></div></div>');
      $rootScope.$on('$routeChangeStart', log.fn('routeChangeStart'));
      $rootScope.$on('$routeChangeError', log.fn('routeChangeError'));
      $rootScope.$on('$routeChangeSuccess', log.fn('routeChangeSuccess'));
      $rootScope.$apply(function() {
        $location.path('/some');
      });

      expect($route.current.id).toBe('redirect');
      expect($location.path()).toBe('/redirect');
      expect(log).toEqual(['routeChangeStart', 'routeChangeStart', 'routeChangeSuccess']);
    });
  });

  it('should route and fire change event', function() {
    var log = '';
    var lastRoute;
    var nextRoute;

    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/Book/:book/Chapter/:chapter',
          {controller: angular.noop, templateUrl: 'Chapter.html'});
      $routeProvider.when('/Blank', {});
    });
    angular.mock.inject(function($route, $location, $rootScope) {
      $rootScope.$on('$routeChangeStart', function(event, next, current) {
        log += 'before();';
        expect(current).toBe($route.current);
        lastRoute = current;
        nextRoute = next;
      });
      $rootScope.$on('$routeChangeSuccess', function(event, current, last) {
        log += 'after();';
        expect(current).toBe($route.current);
        expect(lastRoute).toBe(last);
        expect(nextRoute).toBe(current);
      });

      $location.path('/Book/Moby/Chapter/Intro').search('p=123');
      $rootScope.$digest();
      $httpBackend.flush();
      expect(log).toEqual('before();after();');
      expect($route.current.params).toEqual({book:'Moby', chapter:'Intro', p:'123'});

      log = '';
      $location.path('/Blank').search('ignore');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current.params).toEqual({ignore:true});

      log = '';
      $location.path('/NONE');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current).toEqual(undefined);
    });
  });

  it('should route and fire change event when catch-all params are used', function() {
    var log = '';
    var lastRoute;
    var nextRoute;

    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/Book1/:book/Chapter/:chapter/:highlight*/edit',
          {controller: angular.noop, templateUrl: 'Chapter.html'});
      $routeProvider.when('/Book2/:book/:highlight*/Chapter/:chapter',
          {controller: angular.noop, templateUrl: 'Chapter.html'});
      $routeProvider.when('/Blank', {});
    });
    angular.mock.inject(function($route, $location, $rootScope) {
      $rootScope.$on('$routeChangeStart', function(event, next, current) {
        log += 'before();';
        expect(current).toBe($route.current);
        lastRoute = current;
        nextRoute = next;
      });
      $rootScope.$on('$routeChangeSuccess', function(event, current, last) {
        log += 'after();';
        expect(current).toBe($route.current);
        expect(lastRoute).toBe(last);
        expect(nextRoute).toBe(current);
      });

      $location.path('/Book1/Moby/Chapter/Intro/one/edit').search('p=123');
      $rootScope.$digest();
      $httpBackend.flush();
      expect(log).toEqual('before();after();');
      expect($route.current.params).toEqual({book:'Moby', chapter:'Intro', highlight:'one', p:'123'});

      log = '';
      $location.path('/Blank').search('ignore');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current.params).toEqual({ignore:true});

      log = '';
      $location.path('/Book1/Moby/Chapter/Intro/one/two/edit').search('p=123');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current.params).toEqual({book:'Moby', chapter:'Intro', highlight:'one/two', p:'123'});

      log = '';
      $location.path('/Book2/Moby/one/two/Chapter/Intro').search('p=123');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current.params).toEqual({book:'Moby', chapter:'Intro', highlight:'one/two', p:'123'});

      log = '';
      $location.path('/NONE');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current).toEqual(undefined);
    });
  });


  it('should route and fire change event correctly whenever the case insensitive flag is utilized', function() {
    var log = '';
    var lastRoute;
    var nextRoute;

    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/Book1/:book/Chapter/:chapter/:highlight*/edit',
          {controller: angular.noop, templateUrl: 'Chapter.html', caseInsensitiveMatch: true});
      $routeProvider.when('/Book2/:book/:highlight*/Chapter/:chapter',
          {controller: angular.noop, templateUrl: 'Chapter.html'});
      $routeProvider.when('/Blank', {});
    });
    angular.mock.inject(function($route, $location, $rootScope) {
      $rootScope.$on('$routeChangeStart', function(event, next, current) {
        log += 'before();';
        expect(current).toBe($route.current);
        lastRoute = current;
        nextRoute = next;
      });
      $rootScope.$on('$routeChangeSuccess', function(event, current, last) {
        log += 'after();';
        expect(current).toBe($route.current);
        expect(lastRoute).toBe(last);
        expect(nextRoute).toBe(current);
      });

      $location.path('/Book1/Moby/Chapter/Intro/one/edit').search('p=123');
      $rootScope.$digest();
      $httpBackend.flush();
      expect(log).toEqual('before();after();');
      expect($route.current.params).toEqual({book:'Moby', chapter:'Intro', highlight:'one', p:'123'});

      log = '';
      $location.path('/BOOK1/Moby/CHAPTER/Intro/one/EDIT').search('p=123');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current.params).toEqual({book:'Moby', chapter:'Intro', highlight:'one', p:'123'});

      log = '';
      $location.path('/Blank').search('ignore');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current.params).toEqual({ignore:true});

      log = '';
      $location.path('/BLANK');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current).toEqual(undefined);

      log = '';
      $location.path('/Book2/Moby/one/two/Chapter/Intro').search('p=123');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current.params).toEqual({book:'Moby', chapter:'Intro', highlight:'one/two', p:'123'});

      log = '';
      $location.path('/BOOK2/Moby/one/two/CHAPTER/Intro').search('p=123');
      $rootScope.$digest();
      expect(log).toEqual('before();after();');
      expect($route.current).toEqual(undefined);
    });
  });

  it('should allow configuring caseInsensitiveMatch on the route provider level', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.caseInsensitiveMatch = true;
      $routeProvider.when('/Blank', {template: 'blank'});
      $routeProvider.otherwise({template: 'other'});
    });
    angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('/bLaNk');
      $rootScope.$digest();
      expect($route.current.template).toBe('blank');
    });
  });

  it('should allow overriding provider\'s caseInsensitiveMatch setting on the route level', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.caseInsensitiveMatch = true;
      $routeProvider.when('/Blank', {template: 'blank', caseInsensitiveMatch: false});
      $routeProvider.otherwise({template: 'other'});
    });
    angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('/bLaNk');
      $rootScope.$digest();
      expect($route.current.template).toBe('other');
    });
  });

  it('should not change route when location is canceled', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/somePath', {template: 'some path'});
    });
    angular.mock.inject(function($route, $location, $rootScope, $log) {
      $rootScope.$on('$locationChangeStart', function(event) {
        $log.info('$locationChangeStart');
        event.preventDefault();
      });

      $rootScope.$on('$routeChangeSuccess', function() {
        throw new Error('Should not get here');
      });

      $location.path('/somePath');
      $rootScope.$digest();

      expect($log.info.logs.shift()).toEqual(['$locationChangeStart']);
    });
  });


  describe('should match a route that contains special chars in the path', function() {
    beforeEach(angular.mock.module(function($routeProvider) {
      $routeProvider.when('/$test.23/foo*(bar)/:baz', {templateUrl: 'test.html'});
    }));

    it('matches the full path', angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('/test');
      $rootScope.$digest();
      expect($route.current).toBeUndefined();
    }));

    it('matches literal .', angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('/$testX23/foo*(bar)/222');
      $rootScope.$digest();
      expect($route.current).toBeUndefined();
    }));

    it('matches literal *', angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('/$test.23/foooo(bar)/222');
      $rootScope.$digest();
      expect($route.current).toBeUndefined();
    }));

    it('treats backslashes normally', angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('/$test.23/foo*\\(bar)/222');
      $rootScope.$digest();
      expect($route.current).toBeUndefined();
    }));

    it('matches a URL with special chars', angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('/$test.23/foo*(bar)/~!@#$%^&*()_+=-`');
      $rootScope.$digest();
      expect($route.current).toBeDefined();
    }));

    it('should use route params inherited from prototype chain', function() {
      function BaseRoute() {}
      BaseRoute.prototype.templateUrl = 'foo.html';

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', new BaseRoute());
      });

      angular.mock.inject(function($route, $location, $rootScope) {
        $location.path('/foo');
        $rootScope.$digest();
        expect($route.current.templateUrl).toBe('foo.html');
      });
    });
  });


  describe('should match a route that contains optional params in the path', function() {
    beforeEach(angular.mock.module(function($routeProvider) {
      $routeProvider.when('/test/:opt?/:baz/edit', {templateUrl: 'test.html'});
    }));

    it('matches a URL with optional params', angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('/test/optValue/bazValue/edit');
      $rootScope.$digest();
      expect($route.current).toBeDefined();
    }));

    it('matches a URL without optional param', angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('/test//bazValue/edit');
      $rootScope.$digest();
      expect($route.current).toBeDefined();
    }));

    it('not match a URL with a required param', angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('///edit');
      $rootScope.$digest();
      expect($route.current).not.toBeDefined();
    }));
  });


  it('should change route even when only search param changes', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/test', {templateUrl: 'test.html'});
    });

    angular.mock.inject(function($route, $location, $rootScope) {
      var callback = jest.fn();

      $rootScope.$on('$routeChangeStart', callback);
      $location.path('/test');
      $rootScope.$digest();
      callback.mockReset();

      $location.search({any: true});
      $rootScope.$digest();

      expect(callback).toHaveBeenCalled();
    });
  });


  it('should allow routes to be defined with just templates without controllers', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/foo', {templateUrl: 'foo.html'});
    });

    angular.mock.inject(function($route, $location, $rootScope) {
      var onChangeSpy = jest.fn();

      $rootScope.$on('$routeChangeStart', onChangeSpy);
      expect($route.current).toBeUndefined();
      expect(onChangeSpy).not.toHaveBeenCalled();

      $location.path('/foo');
      $rootScope.$digest();

      expect($route.current.templateUrl).toEqual('foo.html');
      expect($route.current.controller).toBeUndefined();
      expect(onChangeSpy).toHaveBeenCalled();
    });
  });


  it('should chain whens and otherwise', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/foo', {templateUrl: 'foo.html'}).
          otherwise({templateUrl: 'bar.html'}).
          when('/baz', {templateUrl: 'baz.html'});
    });

    angular.mock.inject(function($route, $location, $rootScope) {
      $rootScope.$digest();
      expect($route.current.templateUrl).toBe('bar.html');

      $location.url('/baz');
      $rootScope.$digest();
      expect($route.current.templateUrl).toBe('baz.html');
    });
  });


  it('should skip routes with incomplete params', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider
        .otherwise({template: 'other'})
        .when('/pages/:page/:comment*', {template: 'comment'})
        .when('/pages/:page', {template: 'page'})
        .when('/pages', {template: 'index'})
        .when('/foo/', {template: 'foo'})
        .when('/foo/:bar', {template: 'bar'})
        .when('/foo/:bar*/:baz', {template: 'baz'});
    });

    angular.mock.inject(function($route, $location, $rootScope) {
      $location.url('/pages/');
      $rootScope.$digest();
      expect($route.current.template).toBe('index');

      $location.url('/pages/page/');
      $rootScope.$digest();
      expect($route.current.template).toBe('page');

      $location.url('/pages/page/1/');
      $rootScope.$digest();
      expect($route.current.template).toBe('comment');

      $location.url('/foo/');
      $rootScope.$digest();
      expect($route.current.template).toBe('foo');

      $location.url('/foo/bar/');
      $rootScope.$digest();
      expect($route.current.template).toBe('bar');

      $location.url('/foo/bar/baz/');
      $rootScope.$digest();
      expect($route.current.template).toBe('baz');

      $location.url('/something/');
      $rootScope.$digest();
      expect($route.current.template).toBe('other');
    });
  });


  describe('otherwise', function() {

    it('should handle unknown routes with "otherwise" route definition', function() {
      function NotFoundCtrl() {}

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'foo.html'});
        $routeProvider.otherwise({templateUrl: '404.html', controller: NotFoundCtrl});
      });

      angular.mock.inject(function($route, $location, $rootScope) {
        var onChangeSpy = jest.fn();

        $rootScope.$on('$routeChangeStart', onChangeSpy);
        expect($route.current).toBeUndefined();
        expect(onChangeSpy).not.toHaveBeenCalled();

        $location.path('/unknownRoute');
        $rootScope.$digest();

        expect($route.current.templateUrl).toBe('404.html');
        expect($route.current.controller).toBe(NotFoundCtrl);
        expect(onChangeSpy).toHaveBeenCalled();

        onChangeSpy.mockReset();
        $location.path('/foo');
        $rootScope.$digest();

        expect($route.current.templateUrl).toEqual('foo.html');
        expect($route.current.controller).toBeUndefined();
        expect(onChangeSpy).toHaveBeenCalled();
      });
    });


    it('should update $route.current and $route.next when default route is matched', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'foo.html'});
        $routeProvider.otherwise({templateUrl: '404.html'});
      });

      angular.mock.inject(function($route, $location, $rootScope) {
        var currentRoute;
        var nextRoute;

        var onChangeSpy = jest.fn(function(e, next) {
      currentRoute = $route.current;
      nextRoute = next;
    });


        // init
        $rootScope.$on('$routeChangeStart', onChangeSpy);
        expect($route.current).toBeUndefined();
        expect(onChangeSpy).not.toHaveBeenCalled();


        // match otherwise route
        $location.path('/unknownRoute');
        $rootScope.$digest();

        expect(currentRoute).toBeUndefined();
        expect(nextRoute.templateUrl).toBe('404.html');
        expect($route.current.templateUrl).toBe('404.html');
        expect(onChangeSpy).toHaveBeenCalled();
        onChangeSpy.mockClear();

        // match regular route
        $location.path('/foo');
        $rootScope.$digest();

        expect(currentRoute.templateUrl).toBe('404.html');
        expect(nextRoute.templateUrl).toBe('foo.html');
        expect($route.current.templateUrl).toEqual('foo.html');
        expect(onChangeSpy).toHaveBeenCalled();
        onChangeSpy.mockClear();

        // match otherwise route again
        $location.path('/anotherUnknownRoute');
        $rootScope.$digest();

        expect(currentRoute.templateUrl).toBe('foo.html');
        expect(nextRoute.templateUrl).toBe('404.html');
        expect($route.current.templateUrl).toEqual('404.html');
        expect(onChangeSpy).toHaveBeenCalled();
      });
    });


    it('should interpret a string as a redirect route', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {templateUrl: 'foo.html'});
        $routeProvider.when('/baz', {templateUrl: 'baz.html'});
        $routeProvider.otherwise('/foo');
      });

      angular.mock.inject(function($route, $location, $rootScope) {
        $location.path('/unknownRoute');
        $rootScope.$digest();

        expect($location.path()).toBe('/foo');
        expect($route.current.templateUrl).toBe('foo.html');
      });
    });
  });


  describe('events', function() {
    it('should not fire $routeChangeStart/Success during bootstrap (if no route)', function() {
      var routeChangeSpy = jest.fn();

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/one', {}); // no otherwise defined
      });

      angular.mock.inject(function($rootScope, $route, $location) {
        $rootScope.$on('$routeChangeStart', routeChangeSpy);
        $rootScope.$on('$routeChangeSuccess', routeChangeSpy);

        $rootScope.$digest();
        expect(routeChangeSpy).not.toHaveBeenCalled();

        $location.path('/no-route-here');
        $rootScope.$digest();
        expect(routeChangeSpy).not.toHaveBeenCalled();

        $location.path('/one');
        $rootScope.$digest();
        expect(routeChangeSpy).toHaveBeenCalled();
      });
    });

    it('should fire $routeChangeStart and resolve promises', function() {
      var deferA;
      var deferB;

      angular.mock.module(function($provide, $routeProvider) {
        $provide.factory('b', function($q) {
          deferB = $q.defer();
          return deferB.promise;
        });
        $routeProvider.when('/path', { templateUrl: 'foo.html', resolve: {
          a: ['$q', function($q) {
            deferA = $q.defer();
            return deferA.promise;
          }],
          b: 'b'
        } });
      });

      angular.mock.inject(function($location, $route, $rootScope, $httpBackend) {
        var log = '';

        $httpBackend.expectGET('foo.html').respond('FOO');

        $location.path('/path');
        $rootScope.$digest();
        expect(log).toEqual('');
        $httpBackend.flush();
        expect(log).toEqual('');
        deferA.resolve();
        $rootScope.$digest();
        expect(log).toEqual('');
        deferB.resolve();
        $rootScope.$digest();
        expect($route.current.locals.$template).toEqual('FOO');
      });
    });


    it('should fire $routeChangeError event on resolution error', function() {
      var deferA;

      angular.mock.module(function($provide, $routeProvider) {
        $routeProvider.when('/path', { template: 'foo', resolve: {
          a($q) {
            deferA = $q.defer();
            return deferA.promise;
          }
        } });
      });

      angular.mock.inject(function($location, $route, $rootScope) {
        var log = '';

        $rootScope.$on('$routeChangeStart', function() { log += 'before();'; });
        $rootScope.$on('$routeChangeError', function(e, n, l, reason) { log += 'failed(' + reason + ');'; });

        $location.path('/path');
        $rootScope.$digest();
        expect(log).toEqual('before();');

        deferA.reject('MyError');
        $rootScope.$digest();
        expect(log).toEqual('before();failed(MyError);');
      });
    });


    it('should fetch templates', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.
          when('/r1', { templateUrl: 'r1.html' }).
          when('/r2', { templateUrl: 'r2.html' });
      });

      angular.mock.inject(function($route, $httpBackend, $location, $rootScope) {
        var log = '';
        $rootScope.$on('$routeChangeStart', function(e, next) { log += '$before(' + next.templateUrl + ');'; });
        $rootScope.$on('$routeChangeSuccess', function(e, next) { log += '$after(' + next.templateUrl + ');'; });

        $httpBackend.expectGET('r1.html').respond('R1');
        $httpBackend.expectGET('r2.html').respond('R2');

        $location.path('/r1');
        $rootScope.$digest();
        expect(log).toBe('$before(r1.html);');

        $location.path('/r2');
        $rootScope.$digest();
        expect(log).toBe('$before(r1.html);$before(r2.html);');

        $httpBackend.flush();
        expect(log).toBe('$before(r1.html);$before(r2.html);$after(r2.html);');
        expect(log).not.toContain('$after(r1.html);');
      });
    });

    it('should NOT load cross domain templates by default', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', { templateUrl: 'http://example.com/foo.html' });
      });

      angular.mock.inject(function($route, $location, $rootScope) {
        var onError = jest.fn();
        var onSuccess = jest.fn();

        $rootScope.$on('$routeChangeError', onError);
        $rootScope.$on('$routeChangeSuccess', onSuccess);

        $location.path('/foo');
        $rootScope.$digest();

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalled();
        expect(onError.mock.calls[onError.mock.calls.length - 1][3]).toEqualMinErr('$sce', 'insecurl',
            'Blocked loading resource from url not allowed by $sceDelegate policy.  ' +
            'URL: http://example.com/foo.html');
      });
    });

    it('should load cross domain templates that are trusted', function() {
      angular.mock.module(function($routeProvider, $sceDelegateProvider) {
        $routeProvider.when('/foo', { templateUrl: 'http://example.com/foo.html' });
        $sceDelegateProvider.resourceUrlWhitelist([/^http:\/\/example\.com\/foo\.html$/]);
      });

      angular.mock.inject(function($route, $location, $rootScope) {
        $httpBackend.whenGET('http://example.com/foo.html').respond('FOO BODY');
        $location.path('/foo');
        $rootScope.$digest();
        $httpBackend.flush();
        expect($route.current.locals.$template).toEqual('FOO BODY');
      });
    });

    it('should not update $routeParams until $routeChangeSuccess', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.
          when('/r1/:id', { templateUrl: 'r1.html' }).
          when('/r2/:id', { templateUrl: 'r2.html' });
      });

      angular.mock.inject(function($route, $httpBackend, $location, $rootScope, $routeParams) {
        var log = '';
        $rootScope.$on('$routeChangeStart', function() { log += '$before' + angular.toJson($routeParams) + ';'; });
        $rootScope.$on('$routeChangeSuccess', function() { log += '$after' + angular.toJson($routeParams) + ';'; });

        $httpBackend.whenGET('r1.html').respond('R1');
        $httpBackend.whenGET('r2.html').respond('R2');

        $location.path('/r1/1');
        $rootScope.$digest();
        expect(log).toBe('$before{};');
        $httpBackend.flush();
        expect(log).toBe('$before{};$after{"id":"1"};');

        log = '';

        $location.path('/r2/2');
        $rootScope.$digest();
        expect(log).toBe('$before{"id":"1"};');
        $httpBackend.flush();
        expect(log).toBe('$before{"id":"1"};$after{"id":"2"};');
      });
    });


    it('should drop in progress route change when new route change occurs', function() {
      angular.mock.module(function($routeProvider) {
        $routeProvider.
          when('/r1', { templateUrl: 'r1.html' }).
          when('/r2', { templateUrl: 'r2.html' });
      });

      angular.mock.inject(function($route, $httpBackend, $location, $rootScope) {
        var log = '';
        $rootScope.$on('$routeChangeStart', function(e, next) { log += '$before(' + next.templateUrl + ');'; });
        $rootScope.$on('$routeChangeSuccess', function(e, next) { log += '$after(' + next.templateUrl + ');'; });

        $httpBackend.expectGET('r1.html').respond('R1');
        $httpBackend.expectGET('r2.html').respond('R2');

        $location.path('/r1');
        $rootScope.$digest();
        expect(log).toBe('$before(r1.html);');

        $location.path('/r2');
        $rootScope.$digest();
        expect(log).toBe('$before(r1.html);$before(r2.html);');

        $httpBackend.flush();
        expect(log).toBe('$before(r1.html);$before(r2.html);$after(r2.html);');
        expect(log).not.toContain('$after(r1.html);');
      });
    });


    it('should throw an error when a template is not found', function() {
      angular.mock.module(function($routeProvider, $exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
        $routeProvider.
          when('/r1', { templateUrl: 'r1.html' }).
          when('/r2', { templateUrl: 'r2.html' }).
          when('/r3', { templateUrl: 'r3.html' });
      });

      angular.mock.inject(function($route, $httpBackend, $location, $rootScope, $exceptionHandler) {
        $httpBackend.expectGET('r1.html').respond(404, 'R1');
        $location.path('/r1');
        $rootScope.$digest();

        $httpBackend.flush();
        expect($exceptionHandler.errors.pop()).
            toEqualMinErr('$compile', 'tpload', 'Failed to load template: r1.html');

        $httpBackend.expectGET('r2.html').respond('');
        $location.path('/r2');
        $rootScope.$digest();

        $httpBackend.flush();
        expect($exceptionHandler.errors.length).toBe(0);

        $httpBackend.expectGET('r3.html').respond('abc');
        $location.path('/r3');
        $rootScope.$digest();

        $httpBackend.flush();
        expect($exceptionHandler.errors.length).toBe(0);
      });
    });


    it('should catch local factory errors', function() {
      var myError = new Error('MyError');
      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/locals', {
          resolve: {
            a($q) {
              throw myError;
            }
          }
        });
      });

      angular.mock.inject(function($location, $route, $rootScope) {
        jest.spyOn($rootScope, '$broadcast');

        $location.path('/locals');
        $rootScope.$digest();

        expect($rootScope.$broadcast).toHaveBeenCalledWith(
            '$routeChangeError', expect.any(Object), undefined, myError);
      });
    });
  });


  it('should match route with and without trailing slash', function() {
    angular.mock.module(function($routeProvider) {
      $routeProvider.when('/foo', {templateUrl: 'foo.html'});
      $routeProvider.when('/bar/', {templateUrl: 'bar.html'});
    });

    angular.mock.inject(function($route, $location, $rootScope) {
      $location.path('/foo');
      $rootScope.$digest();
      expect($location.path()).toBe('/foo');
      expect($route.current.templateUrl).toBe('foo.html');

      $location.path('/foo/');
      $rootScope.$digest();
      expect($location.path()).toBe('/foo');
      expect($route.current.templateUrl).toBe('foo.html');

      $location.path('/bar');
      $rootScope.$digest();
      expect($location.path()).toBe('/bar/');
      expect($route.current.templateUrl).toBe('bar.html');

      $location.path('/bar/');
      $rootScope.$digest();
      expect($location.path()).toBe('/bar/');
      expect($route.current.templateUrl).toBe('bar.html');
    });
  });


  it('should not get affected by modifying the route definition object after route registration',
    function() {
      angular.mock.module(function($routeProvider) {
        var rdo = {};

        rdo.templateUrl = 'foo.html';
        $routeProvider.when('/foo', rdo);

        rdo.templateUrl = 'bar.html';
        $routeProvider.when('/bar', rdo);
      });

      angular.mock.inject(function($location, $rootScope, $route) {
        $location.path('/bar');
        $rootScope.$digest();
        expect($location.path()).toBe('/bar');
        expect($route.current.templateUrl).toBe('bar.html');

        $location.path('/foo');
        $rootScope.$digest();
        expect($location.path()).toBe('/foo');
        expect($route.current.templateUrl).toBe('foo.html');
      });
    }
  );


  it('should use the property values of the passed in route definition object directly',
    function() {
      var $routeProvider;

      angular.mock.module(function(_$routeProvider_) {
        $routeProvider = _$routeProvider_;
      });

      angular.mock.inject(function($location, $rootScope, $route, $sce) {
        var sceWrappedUrl = $sce.trustAsResourceUrl('foo.html');
        $routeProvider.when('/foo', {templateUrl: sceWrappedUrl});

        $location.path('/foo');
        $rootScope.$digest();
        expect($location.path()).toBe('/foo');
        expect($route.current.templateUrl).toBe(sceWrappedUrl);
      });
    }
  );


  it('should support custom `$sce` implementations', function() {
    function MySafeResourceUrl(val) {
      var self = this;
      this._val = val;
      this.getVal = function() {
        return (this !== self) ? null : this._val;
      };
    }

    var $routeProvider;

    angular.mock.module(function($provide, _$routeProvider_) {
      $routeProvider = _$routeProvider_;

      $provide.decorator('$sce', function($delegate) {
        function getVal(v) { return v.getVal ? v.getVal() : v; }
        $delegate.trustAsResourceUrl = function(url) { return new MySafeResourceUrl(url); };
        $delegate.getTrustedResourceUrl = function(v) { return getVal(v); };
        $delegate.valueOf = function(v) { return getVal(v); };
        return $delegate;
      });
    });

    angular.mock.inject(function($location, $rootScope, $route, $sce) {
      $routeProvider.when('/foo', {templateUrl: $sce.trustAsResourceUrl('foo.html')});

      $location.path('/foo');
      $rootScope.$digest();
      expect($location.path()).toBe('/foo');
      expect($sce.valueOf($route.current.templateUrl)).toBe('foo.html');
    });
  });


  describe('redirection', function() {
    describe('via `redirectTo`', function() {
      it('should support redirection via redirectTo property by updating $location', function() {
        angular.mock.module(function($routeProvider) {
          $routeProvider.when('/', {redirectTo: '/foo'});
          $routeProvider.when('/foo', {templateUrl: 'foo.html'});
          $routeProvider.when('/bar', {templateUrl: 'bar.html'});
          $routeProvider.when('/baz', {redirectTo: '/bar'});
          $routeProvider.otherwise({templateUrl: '404.html'});
        });

        angular.mock.inject(function($route, $location, $rootScope) {
          var onChangeSpy = jest.fn();

          $rootScope.$on('$routeChangeStart', onChangeSpy);
          expect($route.current).toBeUndefined();
          expect(onChangeSpy).not.toHaveBeenCalled();

          $location.path('/');
          $rootScope.$digest();
          expect($location.path()).toBe('/foo');
          expect($route.current.templateUrl).toBe('foo.html');
          expect(onChangeSpy).toHaveBeenCalledTimes(2);

          onChangeSpy.mockReset();
          $location.path('/baz');
          $rootScope.$digest();
          expect($location.path()).toBe('/bar');
          expect($route.current.templateUrl).toBe('bar.html');
          expect(onChangeSpy).toHaveBeenCalledTimes(2);
        });
      });


      it('should interpolate route vars in the redirected path from original path', function() {
        angular.mock.module(function($routeProvider) {
          $routeProvider.when('/foo/:id/foo/:subid/:extraId', {redirectTo: '/bar/:id/:subid/23'});
          $routeProvider.when('/bar/:id/:subid/:subsubid', {templateUrl: 'bar.html'});
          $routeProvider.when('/baz/:id/:path*', {redirectTo: '/path/:path/:id'});
          $routeProvider.when('/path/:path*/:id', {templateUrl: 'foo.html'});
        });

        angular.mock.inject(function($route, $location, $rootScope) {
          $location.path('/foo/id1/foo/subid3/gah');
          $rootScope.$digest();

          expect($location.path()).toEqual('/bar/id1/subid3/23');
          expect($location.search()).toEqual({extraId: 'gah'});
          expect($route.current.templateUrl).toEqual('bar.html');

          $location.path('/baz/1/foovalue/barvalue');
          $rootScope.$digest();
          expect($location.path()).toEqual('/path/foovalue/barvalue/1');
          expect($route.current.templateUrl).toEqual('foo.html');
        });
      });


      it('should interpolate route vars in the redirected path from original search', function() {
        angular.mock.module(function($routeProvider) {
          $routeProvider.when('/bar/:id/:subid/:subsubid', {templateUrl: 'bar.html'});
          $routeProvider.when('/foo/:id/:extra', {redirectTo: '/bar/:id/:subid/99'});
        });

        angular.mock.inject(function($route, $location, $rootScope) {
          $location.path('/foo/id3/eId').search('subid=sid1&appended=true');
          $rootScope.$digest();

          expect($location.path()).toEqual('/bar/id3/sid1/99');
          expect($location.search()).toEqual({appended: 'true', extra: 'eId'});
          expect($route.current.templateUrl).toEqual('bar.html');
        });
      });


      it('should properly process route params which are both eager and optional', function() {
        angular.mock.module(function($routeProvider) {
          $routeProvider.when('/foo/:param1*?/:param2', {templateUrl: 'foo.html'});
        });

        angular.mock.inject(function($location, $rootScope, $route) {
          $location.path('/foo/bar1/bar2/bar3/baz');
          $rootScope.$digest();

          expect($location.path()).toEqual('/foo/bar1/bar2/bar3/baz');
          expect($route.current.params.param1).toEqual('bar1/bar2/bar3');
          expect($route.current.params.param2).toEqual('baz');
          expect($route.current.templateUrl).toEqual('foo.html');

          $location.path('/foo/baz');
          $rootScope.$digest();

          expect($location.path()).toEqual('/foo/baz');
          expect($route.current.params.param1).toEqual(undefined);
          expect($route.current.params.param2).toEqual('baz');
          expect($route.current.templateUrl).toEqual('foo.html');

        });
      });


      it('should properly interpolate optional and eager route vars ' +
         'when redirecting from path with trailing slash', function() {
        angular.mock.module(function($routeProvider) {
          $routeProvider.when('/foo/:id?/:subid?', {templateUrl: 'foo.html'});
          $routeProvider.when('/bar/:id*/:subid', {templateUrl: 'bar.html'});
        });

        angular.mock.inject(function($location, $rootScope, $route) {
          $location.path('/foo/id1/subid2/');
          $rootScope.$digest();

          expect($location.path()).toEqual('/foo/id1/subid2');
          expect($route.current.templateUrl).toEqual('foo.html');

          $location.path('/bar/id1/extra/subid2/');
          $rootScope.$digest();

          expect($location.path()).toEqual('/bar/id1/extra/subid2');
          expect($route.current.templateUrl).toEqual('bar.html');
        });
      });


      it('should allow custom redirectTo function to be used', function() {
        function customRedirectFn(routePathParams, path, search) {
          expect(routePathParams).toEqual({id: 'id3'});
          expect(path).toEqual('/foo/id3');
          expect(search).toEqual({subid: 'sid1', appended: 'true'});
          return '/custom';
        }

        angular.mock.module(function($routeProvider) {
          $routeProvider.when('/foo/:id', {redirectTo: customRedirectFn});
        });

        angular.mock.inject(function($route, $location, $rootScope) {
          $location.path('/foo/id3').search('subid=sid1&appended=true');
          $rootScope.$digest();

          expect($location.path()).toEqual('/custom');
        });
      });


      it('should broadcast `$routeChangeError` when redirectTo throws', function() {
        var error = new Error('Test');

        angular.mock.module(function($routeProvider) {
          $routeProvider.when('/foo', {redirectTo() { throw error; }});
        });

        angular.mock.inject(function($exceptionHandler, $location, $rootScope) {
          jest.spyOn($rootScope, '$broadcast');

          $location.path('/foo');
          $rootScope.$digest();

          var lastCallArgs = $rootScope.$broadcast.mock.calls[$rootScope.$broadcast.mock.calls.length - 1];
          expect(lastCallArgs[0]).toBe('$routeChangeError');
          expect(lastCallArgs[3]).toBe(error);
        });
      });


      it('should replace the url when redirecting',  function() {
        angular.mock.module(function($routeProvider) {
          $routeProvider.when('/bar/:id', {templateUrl: 'bar.html'});
          $routeProvider.when('/foo/:id/:extra', {redirectTo: '/bar/:id'});
        });
        angular.mock.inject(function($browser, $route, $location, $rootScope) {
          var $browserUrl = spyOnlyCallsWithArgs($browser, 'url');

          $location.path('/foo/id3/eId');
          $rootScope.$digest();

          expect($location.path()).toEqual('/bar/id3');
          expect($browserUrl.mock.calls[$browserUrl.mock.calls.length - 1])
              .toEqual(expect.arrayContaining(['http://server/#!/bar/id3?extra=eId', true, null]));
        });
      });


      it('should not process route bits', function() {
        var firstController = jest.fn();
        var firstTemplate = jest.fn(() => 'redirected view');
        var firstResolve = jest.fn();
        var secondController = jest.fn();
        var secondTemplate = jest.fn(() => 'redirected view');
        var secondResolve = jest.fn();
        angular.mock.module(function($routeProvider) {
          $routeProvider.when('/redirect', {
            template: firstTemplate,
            redirectTo: '/redirected',
            resolve: { value: firstResolve },
            controller: firstController
          });
          $routeProvider.when('/redirected', {
            template: secondTemplate,
            resolve: { value: secondResolve },
            controller: secondController
          });
        });
        angular.mock.inject(function($route, $location, $rootScope) {
          var element = compileForTest('<div><ng-view></ng-view></div>');
          $location.path('/redirect');
          $rootScope.$digest();

          expect(firstController).not.toHaveBeenCalled();
          expect(firstTemplate).not.toHaveBeenCalled();
          expect(firstResolve).not.toHaveBeenCalled();

          expect(secondController).toHaveBeenCalled();
          expect(secondTemplate).toHaveBeenCalled();
          expect(secondResolve).toHaveBeenCalled();

          dealoc(element);
        });
      });


      it('should not redirect transition if `redirectTo` returns `undefined`', function() {
        var controller = jest.fn();
        var templateFn = jest.fn(() => 'redirected view');
        angular.mock.module(function($routeProvider) {
          $routeProvider.when('/redirect/to/undefined', {
            template: templateFn,
            redirectTo() {},
            controller: controller
          });
        });
        angular.mock.inject(function($route, $location, $rootScope) {
          var element = compileForTest('<div><ng-view></ng-view></div>');
          $location.path('/redirect/to/undefined');
          $rootScope.$digest();
          expect(controller).toHaveBeenCalled();
          expect(templateFn).toHaveBeenCalled();
          expect($location.path()).toEqual('/redirect/to/undefined');
          dealoc(element);
        });
      });
    });

    describe('via `resolveRedirectTo`', function() {
      var $compile;
      var $location;
      var $rootScope;
      var $route;

      beforeEach(angular.mock.module(function() {
        return function(_$compile_, _$location_, _$rootScope_, _$route_) {
          $compile = _$compile_;
          $location = _$location_;
          $rootScope = _$rootScope_;
          $route = _$route_;
        };
      }));


      it('should be ignored if `redirectTo` is also present', function() {
        var newUrl;
        var getNewUrl = function() { return newUrl; };

        var resolveRedirectToSpy = jest.fn(() => '/bar');
        var redirectToSpy = jest.fn(getNewUrl);
        var templateSpy = jest.fn(() => 'Foo');

        angular.mock.module(function($routeProvider) {
          $routeProvider.
            when('/foo', {
              resolveRedirectTo: resolveRedirectToSpy,
              redirectTo: redirectToSpy,
              template: templateSpy
            }).
            when('/bar', {template: 'Bar'}).
            when('/baz', {template: 'Baz'});
        });

        angular.mock.inject(function() {
          newUrl = '/baz';
          $location.path('/foo');
          $rootScope.$digest();

          expect($location.path()).toBe('/baz');
          expect($route.current.template).toBe('Baz');
          expect(resolveRedirectToSpy).not.toHaveBeenCalled();
          expect(redirectToSpy).toHaveBeenCalled();
          expect(templateSpy).not.toHaveBeenCalled();

          redirectToSpy.mockReset();

          newUrl = undefined;
          $location.path('/foo');
          $rootScope.$digest();

          expect($location.path()).toBe('/foo');
          expect($route.current.template).toBe(templateSpy);
          expect(resolveRedirectToSpy).not.toHaveBeenCalled();
          expect(redirectToSpy).toHaveBeenCalled();
          expect(templateSpy).toHaveBeenCalled();
        });
      });


      it('should redirect to the returned url', function() {
        angular.mock.module(function($routeProvider) {
          $routeProvider.
            when('/foo', {resolveRedirectTo() { return '/bar?baz=qux'; }}).
            when('/bar', {template: 'Bar'});
        });

        angular.mock.inject(function() {
          $location.path('/foo');
          $rootScope.$digest();

          expect($location.path()).toBe('/bar');
          expect($location.search()).toEqual({baz: 'qux'});
          expect($route.current.template).toBe('Bar');
        });
      });


      it('should support returning a promise', function() {
        angular.mock.module(function($routeProvider) {
          $routeProvider.
            when('/foo', {resolveRedirectTo($q) { return $q.resolve('/bar'); }}).
            when('/bar', {template: 'Bar'});
        });

        angular.mock.inject(function() {
          $location.path('/foo');
          $rootScope.$digest();

          expect($location.path()).toBe('/bar');
          expect($route.current.template).toBe('Bar');
        });
      });


      it('should support dependency injection', function() {
        angular.mock.module(function($provide, $routeProvider) {
          $provide.value('nextRoute', '/bar');

          $routeProvider.
            when('/foo', {
              resolveRedirectTo(nextRoute) {
                return nextRoute;
              }
            });
        });

        angular.mock.inject(function() {
          $location.path('/foo');
          $rootScope.$digest();

          expect($location.path()).toBe('/bar');
        });
      });


      it('should have access to the current routeParams via `$route.current.params`', function() {
        angular.mock.module(function($routeProvider) {
          $routeProvider.
            when('/foo/:bar/baz/:qux', {
              resolveRedirectTo($route) {
                expect($route.current.params).toEqual(expect.objectContaining({
                  bar: '1',
                  qux: '2'
                }));

                return '/passed';
              }
            });
        });

        angular.mock.inject(function() {
          $location.path('/foo/1/baz/2').search({bar: 'qux'});
          $rootScope.$digest();

          expect($location.path()).toBe('/passed');
        });
      });


      it('should not process route bits until the promise is resolved', function() {
        var spies = createSpies();
        var called = false;
        var deferred;

        angular.mock.module(function($routeProvider) {
          setupRoutes($routeProvider, spies, function($q) {
            called = true;
            deferred = $q.defer();
            return deferred.promise;
          });
        });

        angular.mock.inject(function() {
          var element = compileForTest('<div><ng-view></ng-view></div>');

          $location.path('/foo');
          $rootScope.$digest();

          expect($location.path()).toBe('/foo');
          expect(called).toBe(true);
          expect(spies.fooResolveSpy).not.toHaveBeenCalled();
          expect(spies.fooTemplateSpy).not.toHaveBeenCalled();
          expect(spies.fooControllerSpy).not.toHaveBeenCalled();
          expect(spies.barResolveSpy).not.toHaveBeenCalled();
          expect(spies.barTemplateSpy).not.toHaveBeenCalled();
          expect(spies.barControllerSpy).not.toHaveBeenCalled();

          deferred.resolve('/bar');
          $rootScope.$digest();
          expect($location.path()).toBe('/bar');
          expect(spies.fooResolveSpy).not.toHaveBeenCalled();
          expect(spies.fooTemplateSpy).not.toHaveBeenCalled();
          expect(spies.fooControllerSpy).not.toHaveBeenCalled();
          expect(spies.barResolveSpy).toHaveBeenCalled();
          expect(spies.barTemplateSpy).toHaveBeenCalled();
          expect(spies.barControllerSpy).toHaveBeenCalled();

          dealoc(element);
        });
      });


      it('should not redirect if `undefined` is returned', function() {
        var spies = createSpies();
        var called = false;

        angular.mock.module(function($routeProvider) {
          setupRoutes($routeProvider, spies, function() {
            called = true;
            return undefined;
          });
        });

        angular.mock.inject(function() {
          var element = compileForTest('<div><ng-view></ng-view></div>');

          $location.path('/foo');
          $rootScope.$digest();

          expect($location.path()).toBe('/foo');
          expect(called).toBe(true);
          expect(spies.fooResolveSpy).toHaveBeenCalled();
          expect(spies.fooTemplateSpy).toHaveBeenCalled();
          expect(spies.fooControllerSpy).toHaveBeenCalled();
          expect(spies.barResolveSpy).not.toHaveBeenCalled();
          expect(spies.barTemplateSpy).not.toHaveBeenCalled();
          expect(spies.barControllerSpy).not.toHaveBeenCalled();

          dealoc(element);
        });
      });


      it('should not redirect if the returned promise resolves to `undefined`', function() {
        var spies = createSpies();
        var called = false;

        angular.mock.module(function($routeProvider) {
          setupRoutes($routeProvider, spies, function($q) {
            called = true;
            return $q.resolve(undefined);
          });
        });

        angular.mock.inject(function() {
          var element = compileForTest('<div><ng-view></ng-view></div>');

          $location.path('/foo');
          $rootScope.$digest();

          expect($location.path()).toBe('/foo');
          expect(called).toBe(true);
          expect(spies.fooResolveSpy).toHaveBeenCalled();
          expect(spies.fooTemplateSpy).toHaveBeenCalled();
          expect(spies.fooControllerSpy).toHaveBeenCalled();
          expect(spies.barResolveSpy).not.toHaveBeenCalled();
          expect(spies.barTemplateSpy).not.toHaveBeenCalled();
          expect(spies.barControllerSpy).not.toHaveBeenCalled();

          dealoc(element);
        });
      });


      it('should not redirect if the returned promise gets rejected', function() {
        var spies = createSpies();
        var called = false;

        angular.mock.module(function($routeProvider) {
          setupRoutes($routeProvider, spies, function($q) {
            called = true;
            return $q.reject('');
          });
        });

        angular.mock.inject(function() {
          jest.spyOn($rootScope, '$broadcast');

          var element = compileForTest('<div><ng-view></ng-view></div>');

          $location.path('/foo');
          $rootScope.$digest();

          expect($location.path()).toBe('/foo');
          expect(called).toBe(true);
          expect(spies.fooResolveSpy).not.toHaveBeenCalled();
          expect(spies.fooTemplateSpy).not.toHaveBeenCalled();
          expect(spies.fooControllerSpy).not.toHaveBeenCalled();
          expect(spies.barResolveSpy).not.toHaveBeenCalled();
          expect(spies.barTemplateSpy).not.toHaveBeenCalled();
          expect(spies.barControllerSpy).not.toHaveBeenCalled();

          var lastCallArgs = $rootScope.$broadcast.mock.calls[$rootScope.$broadcast.mock.calls.length - 1];
          expect(lastCallArgs[0]).toBe('$routeChangeError');

          dealoc(element);
        });
      });


      it('should ignore previous redirection if newer transition happened', function() {
        var spies = createSpies();
        var called = false;
        var deferred;

        angular.mock.module(function($routeProvider) {
          setupRoutes($routeProvider, spies, function($q) {
            called = true;
            deferred = $q.defer();
            return deferred.promise;
          });
        });

        angular.mock.inject(function() {
          jest.spyOn($location, 'url');

          var element = compileForTest('<div><ng-view></ng-view></div>');

          $location.path('/foo');
          $rootScope.$digest();

          expect($location.path()).toBe('/foo');
          expect(called).toBe(true);
          expect(spies.fooResolveSpy).not.toHaveBeenCalled();
          expect(spies.fooTemplateSpy).not.toHaveBeenCalled();
          expect(spies.fooControllerSpy).not.toHaveBeenCalled();
          expect(spies.barResolveSpy).not.toHaveBeenCalled();
          expect(spies.barTemplateSpy).not.toHaveBeenCalled();
          expect(spies.barControllerSpy).not.toHaveBeenCalled();
          expect(spies.bazResolveSpy).not.toHaveBeenCalled();
          expect(spies.bazTemplateSpy).not.toHaveBeenCalled();
          expect(spies.bazControllerSpy).not.toHaveBeenCalled();

          $location.path('/baz');
          $rootScope.$digest();

          expect($location.path()).toBe('/baz');
          expect(spies.fooResolveSpy).not.toHaveBeenCalled();
          expect(spies.fooTemplateSpy).not.toHaveBeenCalled();
          expect(spies.fooControllerSpy).not.toHaveBeenCalled();
          expect(spies.barResolveSpy).not.toHaveBeenCalled();
          expect(spies.barTemplateSpy).not.toHaveBeenCalled();
          expect(spies.barControllerSpy).not.toHaveBeenCalled();
          expect(spies.bazResolveSpy).toHaveBeenCalledTimes(1);
          expect(spies.bazTemplateSpy).toHaveBeenCalledTimes(1);
          expect(spies.bazControllerSpy).toHaveBeenCalledTimes(1);

          deferred.resolve();
          $rootScope.$digest();

          expect($location.path()).toBe('/baz');
          expect(spies.fooResolveSpy).not.toHaveBeenCalled();
          expect(spies.fooTemplateSpy).not.toHaveBeenCalled();
          expect(spies.fooControllerSpy).not.toHaveBeenCalled();
          expect(spies.barResolveSpy).not.toHaveBeenCalled();
          expect(spies.barTemplateSpy).not.toHaveBeenCalled();
          expect(spies.barControllerSpy).not.toHaveBeenCalled();
          expect(spies.bazResolveSpy).toHaveBeenCalledTimes(1);
          expect(spies.bazTemplateSpy).toHaveBeenCalledTimes(1);
          expect(spies.bazControllerSpy).toHaveBeenCalledTimes(1);

          dealoc(element);
        });
      });


      // Helpers
      function createSpies() {
        return {
          fooResolveSpy: jest.fn(),
          fooTemplateSpy: jest.fn(() => 'Foo'),
          fooControllerSpy: jest.fn(),
          barResolveSpy: jest.fn(),
          barTemplateSpy: jest.fn(() => 'Bar'),
          barControllerSpy: jest.fn(),
          bazResolveSpy: jest.fn(),
          bazTemplateSpy: jest.fn(() => 'Baz'),
          bazControllerSpy: jest.fn()
        };
      }

      function setupRoutes(routeProvider, spies, resolveRedirectToFn) {
        routeProvider.
          when('/foo', {
            resolveRedirectTo: resolveRedirectToFn,
            resolve: {_: spies.fooResolveSpy},
            template: spies.fooTemplateSpy,
            controller: spies.fooControllerSpy
          }).
          when('/bar', {
            resolve: {_: spies.barResolveSpy},
            template: spies.barTemplateSpy,
            controller: spies.barControllerSpy
          }).
          when('/baz', {
            resolve: {_: spies.bazResolveSpy},
            template: spies.bazTemplateSpy,
            controller: spies.bazControllerSpy
          });
      }
    });
  });


  describe('reloadOnSearch', function() {
    it('should reload a route when reloadOnSearch is enabled and .search() changes', function() {
      var reloaded = jest.fn();

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {controller: angular.noop});
      });

      angular.mock.inject(function($route, $location, $rootScope, $routeParams) {
        $rootScope.$on('$routeChangeStart', reloaded);
        $location.path('/foo');
        $rootScope.$digest();
        expect(reloaded).toHaveBeenCalled();
        expect($routeParams).toEqual({});
        reloaded.mockReset();

        // trigger reload
        $location.search({foo: 'bar'});
        $rootScope.$digest();
        expect(reloaded).toHaveBeenCalled();
        expect($routeParams).toEqual({foo:'bar'});
      });
    });


    it('should not reload a route when reloadOnSearch is disabled and only .search() changes', function() {
      var routeChange = jest.fn();
      var routeUpdate = jest.fn();

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {controller: angular.noop, reloadOnSearch: false});
      });

      angular.mock.inject(function($route, $location, $rootScope) {
        $rootScope.$on('$routeChangeStart', routeChange);
        $rootScope.$on('$routeChangeSuccess', routeChange);
        $rootScope.$on('$routeUpdate', routeUpdate);

        expect(routeChange).not.toHaveBeenCalled();

        $location.path('/foo');
        $rootScope.$digest();
        expect(routeChange).toHaveBeenCalled();
        expect(routeChange).toHaveBeenCalledTimes(2);
        expect(routeUpdate).not.toHaveBeenCalled();
        routeChange.mockReset();

        // don't trigger reload
        $location.search({foo: 'bar'});
        $rootScope.$digest();
        expect(routeChange).not.toHaveBeenCalled();
        expect(routeUpdate).toHaveBeenCalled();
      });
    });


    it('should reload reloadOnSearch route when url differs only in route path param', function() {
      var routeChange = jest.fn();

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo/:fooId', {controller: angular.noop, reloadOnSearch: false});
      });

      angular.mock.inject(function($route, $location, $rootScope) {
        $rootScope.$on('$routeChangeStart', routeChange);
        $rootScope.$on('$routeChangeSuccess', routeChange);

        expect(routeChange).not.toHaveBeenCalled();

        $location.path('/foo/aaa');
        $rootScope.$digest();
        expect(routeChange).toHaveBeenCalled();
        expect(routeChange).toHaveBeenCalledTimes(2);
        routeChange.mockReset();

        $location.path('/foo/bbb');
        $rootScope.$digest();
        expect(routeChange).toHaveBeenCalled();
        expect(routeChange).toHaveBeenCalledTimes(2);
        routeChange.mockReset();

        $location.search({foo: 'bar'});
        $rootScope.$digest();
        expect(routeChange).not.toHaveBeenCalled();
      });
    });


    it('should update params when reloadOnSearch is disabled and .search() changes', function() {
      var routeParamsWatcher = jest.fn();

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/foo', {controller: angular.noop});
        $routeProvider.when('/bar/:barId', {controller: angular.noop, reloadOnSearch: false});
      });

      angular.mock.inject(function($route, $location, $rootScope, $routeParams) {
        $rootScope.$watch(function() {
          return $routeParams;
        }, function(value) {
          routeParamsWatcher(value);
        }, true);

        expect(routeParamsWatcher).not.toHaveBeenCalled();

        $location.path('/foo');
        $rootScope.$digest();
        expect(routeParamsWatcher).toHaveBeenCalledWith({});
        routeParamsWatcher.mockReset();

        // trigger reload
        $location.search({foo: 'bar'});
        $rootScope.$digest();
        expect(routeParamsWatcher).toHaveBeenCalledWith({foo: 'bar'});
        routeParamsWatcher.mockReset();

        $location.path('/bar/123').search({});
        $rootScope.$digest();
        expect(routeParamsWatcher).toHaveBeenCalledWith({barId: '123'});
        routeParamsWatcher.mockReset();

        // don't trigger reload
        $location.search({foo: 'bar'});
        $rootScope.$digest();
        expect(routeParamsWatcher).toHaveBeenCalledWith({barId: '123', foo: 'bar'});
      });
    });


    it('should allow using a function as a template', function() {
      var customTemplateWatcher = jest.fn();

      function customTemplateFn(routePathParams) {
        customTemplateWatcher(routePathParams);
        expect(routePathParams).toEqual({id: 'id3'});
        return '<h1>' + routePathParams.id + '</h1>';
      }

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/bar/:id/:subid/:subsubid', {templateUrl: 'bar.html'});
        $routeProvider.when('/foo/:id', {template: customTemplateFn});
      });

      angular.mock.inject(function($route, $location, $rootScope) {
        $location.path('/foo/id3');
        $rootScope.$digest();

        expect(customTemplateWatcher).toHaveBeenCalledWith({id: 'id3'});
      });
    });


    it('should allow using a function as a templateUrl', function() {
      var customTemplateUrlWatcher = jest.fn();

      function customTemplateUrlFn(routePathParams) {
        customTemplateUrlWatcher(routePathParams);
        expect(routePathParams).toEqual({id: 'id3'});
        return 'foo.html';
      }

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/bar/:id/:subid/:subsubid', {templateUrl: 'bar.html'});
        $routeProvider.when('/foo/:id', {templateUrl: customTemplateUrlFn});
      });

      angular.mock.inject(function($route, $location, $rootScope) {
        $location.path('/foo/id3');
        $rootScope.$digest();

        expect(customTemplateUrlWatcher).toHaveBeenCalledWith({id: 'id3'});
        expect($route.current.loadedTemplateUrl).toEqual('foo.html');
      });
    });

    describe('reload', function() {
      var $location;
      var $log;
      var $rootScope;
      var $route;
      var routeChangeStartSpy;
      var routeChangeSuccessSpy;

      beforeEach(angular.mock.module(function($routeProvider) {
        $routeProvider.when('/bar/:barId', {
          template: '',
          controller: controller,
          reloadOnSearch: false
        });

        function controller($log) {
          $log.debug('initialized');
        }
      }));
      beforeEach(angular.mock.inject(function($compile, _$location_, _$log_, _$rootScope_, _$route_) {
        $location = _$location_;
        $log = _$log_;
        $rootScope = _$rootScope_;
        $route = _$route_;

        routeChangeStartSpy = jest.fn();
        routeChangeSuccessSpy = jest.fn();

        $rootScope.$on('$routeChangeStart', routeChangeStartSpy);
        $rootScope.$on('$routeChangeSuccess', routeChangeSuccessSpy);

        element = compileForTest('<div><div ng-view></div></div>');
      }));

      it('should reload the current route', function() {
        $location.path('/bar/123');
        $rootScope.$digest();
        expect($location.path()).toBe('/bar/123');
        expect(routeChangeStartSpy).toHaveBeenCalledTimes(1);
        expect(routeChangeSuccessSpy).toHaveBeenCalledTimes(1);
        expect($log.debug.logs).toEqual([['initialized']]);

        routeChangeStartSpy.mockReset();
        routeChangeSuccessSpy.mockReset();
        $log.reset();

        $route.reload();
        $rootScope.$digest();
        expect($location.path()).toBe('/bar/123');
        expect(routeChangeStartSpy).toHaveBeenCalledTimes(1);
        expect(routeChangeSuccessSpy).toHaveBeenCalledTimes(1);
        expect($log.debug.logs).toEqual([['initialized']]);

        $log.reset();
      });

      it('should support preventing a route reload', function() {
        $location.path('/bar/123');
        $rootScope.$digest();
        expect($location.path()).toBe('/bar/123');
        expect(routeChangeStartSpy).toHaveBeenCalledTimes(1);
        expect(routeChangeSuccessSpy).toHaveBeenCalledTimes(1);
        expect($log.debug.logs).toEqual([['initialized']]);

        routeChangeStartSpy.mockReset();
        routeChangeSuccessSpy.mockReset();
        $log.reset();

        routeChangeStartSpy.mockImplementation(function(evt) { evt.preventDefault(); });

        $route.reload();
        $rootScope.$digest();
        expect($location.path()).toBe('/bar/123');
        expect(routeChangeStartSpy).toHaveBeenCalledTimes(1);
        expect(routeChangeSuccessSpy).not.toHaveBeenCalled();
        expect($log.debug.logs).toEqual([]);
      });

      it('should reload even if reloadOnSearch is false', angular.mock.inject(function($routeParams) {
        $location.path('/bar/123');
        $rootScope.$digest();
        expect($routeParams).toEqual({barId: '123'});
        expect(routeChangeSuccessSpy).toHaveBeenCalledTimes(1);
        expect($log.debug.logs).toEqual([['initialized']]);

        routeChangeSuccessSpy.mockReset();
        $log.reset();

        $location.search('a=b');
        $rootScope.$digest();
        expect($routeParams).toEqual({barId: '123', a: 'b'});
        expect(routeChangeSuccessSpy).not.toHaveBeenCalled();
        expect($log.debug.logs).toEqual([]);

        $route.reload();
        $rootScope.$digest();
        expect($routeParams).toEqual({barId: '123', a: 'b'});
        expect(routeChangeSuccessSpy).toHaveBeenCalledTimes(1);
        expect($log.debug.logs).toEqual([['initialized']]);

        $log.reset();
      }));
    });
  });

  describe('update', function() {
    it('should support single-parameter route updating', function() {
      var routeChangeSpy = jest.fn();

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/bar/:barId', {controller: angular.noop});
      });

      angular.mock.inject(function($route, $routeParams, $location, $rootScope) {
        $rootScope.$on('$routeChangeSuccess', routeChangeSpy);

        $location.path('/bar/1');
        $rootScope.$digest();
        routeChangeSpy.mockReset();

        $route.updateParams({barId: '2'});
        $rootScope.$digest();

        expect($routeParams).toEqual({barId: '2'});
        expect(routeChangeSpy).toHaveBeenCalledTimes(1);
        expect($location.path()).toEqual('/bar/2');
      });
    });

    it('should support total multi-parameter route updating', function() {
      var routeChangeSpy = jest.fn();

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/bar/:barId/:fooId/:spamId/:eggId', {controller: angular.noop});
      });

      angular.mock.inject(function($route, $routeParams, $location, $rootScope) {
        $rootScope.$on('$routeChangeSuccess', routeChangeSpy);

        $location.path('/bar/1/2/3/4');
        $rootScope.$digest();
        routeChangeSpy.mockReset();

        $route.updateParams({barId: '5', fooId: '6', spamId: '7', eggId: '8'});
        $rootScope.$digest();

        expect($routeParams).toEqual({barId: '5', fooId: '6', spamId: '7', eggId: '8'});
        expect(routeChangeSpy).toHaveBeenCalledTimes(1);
        expect($location.path()).toEqual('/bar/5/6/7/8');
      });
    });

    it('should support partial multi-parameter route updating', function() {
      var routeChangeSpy = jest.fn();

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/bar/:barId/:fooId/:spamId/:eggId', {controller: angular.noop});
      });

      angular.mock.inject(function($route, $routeParams, $location, $rootScope) {
        $rootScope.$on('$routeChangeSuccess', routeChangeSpy);

        $location.path('/bar/1/2/3/4');
        $rootScope.$digest();
        routeChangeSpy.mockReset();

        $route.updateParams({barId: '5', fooId: '6'});
        $rootScope.$digest();

        expect($routeParams).toEqual({barId: '5', fooId: '6', spamId: '3', eggId: '4'});
        expect(routeChangeSpy).toHaveBeenCalledTimes(1);
        expect($location.path()).toEqual('/bar/5/6/3/4');
      });
    });


    it('should update query params when new properties are not in path', function() {
      var routeChangeSpy = jest.fn();

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/bar/:barId/:fooId/:spamId/', {controller: angular.noop});
      });

      angular.mock.inject(function($route, $routeParams, $location, $rootScope) {
        $rootScope.$on('$routeChangeSuccess', routeChangeSpy);

        $location.path('/bar/1/2/3');
        $location.search({initial: 'true'});
        $rootScope.$digest();
        routeChangeSpy.mockReset();

        $route.updateParams({barId: '5', fooId: '6', eggId: '4'});
        $rootScope.$digest();

        expect($routeParams).toEqual({barId: '5', fooId: '6', spamId: '3', eggId: '4', initial: 'true'});
        expect(routeChangeSpy).toHaveBeenCalledTimes(1);
        expect($location.path()).toEqual('/bar/5/6/3/');
        expect($location.search()).toEqual({eggId: '4', initial: 'true'});
      });
    });

    it('should not update query params when an optional property was previously not in path', function() {
      var routeChangeSpy = jest.fn();

      angular.mock.module(function($routeProvider) {
        $routeProvider.when('/bar/:barId/:fooId/:spamId/:eggId?', {controller: angular.noop});
      });

      angular.mock.inject(function($route, $routeParams, $location, $rootScope) {
        $rootScope.$on('$routeChangeSuccess', routeChangeSpy);

        $location.path('/bar/1/2/3');
        $location.search({initial: 'true'});
        $rootScope.$digest();
        routeChangeSpy.mockReset();

        $route.updateParams({barId: '5', fooId: '6', eggId: '4'});
        $rootScope.$digest();

        expect($routeParams).toEqual({barId: '5', fooId: '6', spamId: '3', eggId: '4', initial: 'true'});
        expect(routeChangeSpy).toHaveBeenCalledTimes(1);
        expect($location.path()).toEqual('/bar/5/6/3/4');
        expect($location.search()).toEqual({initial: 'true'});
      });
    });

    it('should complain if called without an existing route', angular.mock.inject(function($route) {
      expect(function() { $route.updateParams(); }).toThrowMinErr('ngRoute', 'norout');
    }));
  });

  describe('testability', function() {
    it('should wait for $resolve promises before calling callbacks', function() {
      var deferred;

      angular.mock.module(function($provide, $routeProvider) {
        $routeProvider.when('/path', {
          template: '',
          resolve: {
            a($q) {
              deferred = $q.defer();
              return deferred.promise;
            }
          }
        });
      });

      angular.mock.inject(function($location, $route, $rootScope, $httpBackend, $$testability) {
        $location.path('/path');
        $rootScope.$digest();

        var callback = jest.fn();
        $$testability.whenStable(callback);
        expect(callback).not.toHaveBeenCalled();

        deferred.resolve();
        $rootScope.$digest();
        expect(callback).toHaveBeenCalled();
      });
    });

    it('should call callback after $resolve promises are rejected', function() {
      var deferred;

      angular.mock.module(function($provide, $routeProvider) {
        $routeProvider.when('/path', {
          template: '',
          resolve: {
            a($q) {
              deferred = $q.defer();
              return deferred.promise;
            }
          }
        });
      });

      angular.mock.inject(function($location, $route, $rootScope, $httpBackend, $$testability) {
        $location.path('/path');
        $rootScope.$digest();

        var callback = jest.fn();
        $$testability.whenStable(callback);
        expect(callback).not.toHaveBeenCalled();

        deferred.reject();
        $rootScope.$digest();
        expect(callback).toHaveBeenCalled();
      });
    });

    it('should wait for resolveRedirectTo promises before calling callbacks', function() {
      var deferred;

      angular.mock.module(function($provide, $routeProvider) {
        $routeProvider.when('/path', {
          resolveRedirectTo($q) {
            deferred = $q.defer();
            return deferred.promise;
          }
        });
      });

      angular.mock.inject(function($location, $route, $rootScope, $httpBackend, $$testability) {
        $location.path('/path');
        $rootScope.$digest();

        var callback = jest.fn();
        $$testability.whenStable(callback);
        expect(callback).not.toHaveBeenCalled();

        deferred.resolve();
        $rootScope.$digest();
        expect(callback).toHaveBeenCalled();
      });
    });

    it('should call callback after resolveRedirectTo promises are rejected', function() {
      var deferred;

      angular.mock.module(function($provide, $routeProvider) {
        $routeProvider.when('/path', {
          resolveRedirectTo($q) {
            deferred = $q.defer();
            return deferred.promise;
          }
        });
      });

      angular.mock.inject(function($location, $route, $rootScope, $httpBackend, $$testability) {
        $location.path('/path');
        $rootScope.$digest();

        var callback = jest.fn();
        $$testability.whenStable(callback);
        expect(callback).not.toHaveBeenCalled();

        deferred.reject();
        $rootScope.$digest();
        expect(callback).toHaveBeenCalled();
      });
    });

    it('should wait for all route promises before calling callbacks', function() {
      var deferreds = {};

      angular.mock.module(function($provide, $routeProvider) {
        // While normally `$browser.defer()` modifies the `outstandingRequestCount`, the mocked
        // version (provided by `ngMock`) does not. This doesn't matter in most tests, but in this
        // case we need the `outstandingRequestCount` logic to ensure that we don't call the
        // `$$testability.whenStable()` callbacks part way through a `$rootScope.$evalAsync` block.
        // See ngRoute's commitRoute()'s finally() block for details.
        $provide.decorator('$browser', function($delegate) {
          var oldDefer = $delegate.defer;
          var newDefer = function(fn, delay) {
            var requestCountAwareFn = function() { $delegate.$$completeOutstandingRequest(fn); };
            $delegate.$$incOutstandingRequestCount();
            return oldDefer.call($delegate, requestCountAwareFn, delay);
          };

          $delegate.defer = angular.extend(newDefer, oldDefer);

          return $delegate;
        });

        addRouteWithAsyncRedirect('/foo', '/bar');
        addRouteWithAsyncRedirect('/bar', '/baz');
        addRouteWithAsyncRedirect('/baz', '/qux');
        $routeProvider.when('/qux', {
          template: '',
          resolve: {
            a($q) {
              var deferred = deferreds['/qux'] = $q.defer();
              return deferred.promise;
            }
          }
        });

        // Helpers
        function addRouteWithAsyncRedirect(fromPath, toPath) {
          $routeProvider.when(fromPath, {
            resolveRedirectTo($q) {
              var deferred = deferreds[fromPath] = $q.defer();
              return deferred.promise.then(function() { return toPath; });
            }
          });
        }
      });

      angular.mock.inject(function($browser, $location, $rootScope, $route, $$testability) {
        $location.path('/foo');
        $rootScope.$digest();

        var callback = jest.fn();
        $$testability.whenStable(callback);
        expect(callback).not.toHaveBeenCalled();

        deferreds['/foo'].resolve();
        $browser.defer.flush();
        expect(callback).not.toHaveBeenCalled();

        deferreds['/bar'].resolve();
        $browser.defer.flush();
        expect(callback).not.toHaveBeenCalled();

        deferreds['/baz'].resolve();
        $browser.defer.flush();
        expect(callback).not.toHaveBeenCalled();

        deferreds['/qux'].resolve();
        $browser.defer.flush();
        expect(callback).toHaveBeenCalled();
      });
    });
  });
});
