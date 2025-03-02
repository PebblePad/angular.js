'use strict';

describe('$controller', function() {
  var $controllerProvider;
  var $controller;

  beforeEach(angular.mock.module(function(_$controllerProvider_) {
    $controllerProvider = _$controllerProvider_;
  }));


  beforeEach(angular.mock.inject(function(_$controller_) {
    $controller = _$controller_;
  }));


  describe('provider', function() {

    it('should allow registration of controllers', function() {
      var FooCtrl = function($scope) { $scope.foo = 'bar'; };
      var scope = {};
      var ctrl;

      $controllerProvider.register('FooCtrl', FooCtrl);
      ctrl = $controller('FooCtrl', {$scope: scope});

      expect(scope.foo).toBe('bar');
      expect(ctrl instanceof FooCtrl).toBe(true);
    });

    it('should allow registration of bound controller functions', function() {
      var FooCtrl = function($scope) { $scope.foo = 'bar'; };
      var scope = {};

      var BoundFooCtrl = FooCtrl.bind(null);

      $controllerProvider.register('FooCtrl', ['$scope', BoundFooCtrl]);
      $controller('FooCtrl', {$scope: scope});

      expect(scope.foo).toBe('bar');
    });

    it('should allow registration of map of controllers', function() {
      var FooCtrl = function($scope) { $scope.foo = 'foo'; };
      var BarCtrl = function($scope) { $scope.bar = 'bar'; };
      var scope = {};
      var ctrl;

      $controllerProvider.register({FooCtrl: FooCtrl, BarCtrl: BarCtrl});

      ctrl = $controller('FooCtrl', {$scope: scope});
      expect(scope.foo).toBe('foo');
      expect(ctrl instanceof FooCtrl).toBe(true);

      ctrl = $controller('BarCtrl', {$scope: scope});
      expect(scope.bar).toBe('bar');
      expect(ctrl instanceof BarCtrl).toBe(true);
    });


    it('should allow registration of controllers annotated with arrays', function() {
      var FooCtrl = function($scope) { $scope.foo = 'bar'; };
      var scope = {};
      var ctrl;

      $controllerProvider.register('FooCtrl', ['$scope', FooCtrl]);
      ctrl = $controller('FooCtrl', {$scope: scope});

      expect(scope.foo).toBe('bar');
      expect(ctrl instanceof FooCtrl).toBe(true);
    });


    it('should throw an exception if a controller is called "hasOwnProperty"', function() {
      expect(function() {
        $controllerProvider.register('hasOwnProperty', function($scope) {});
      }).toThrowMinErr('ng', 'badname', 'hasOwnProperty is not a valid controller name');
    });


    it('should allow checking the availability of a controller', function() {
      $controllerProvider.register('FooCtrl', angular.noop);
      $controllerProvider.register('BarCtrl', ['dep1', 'dep2', angular.noop]);
      $controllerProvider.register({
        'BazCtrl': angular.noop,
        'QuxCtrl': ['dep1', 'dep2', angular.noop]
      });

      expect($controllerProvider.has('FooCtrl')).toBe(true);
      expect($controllerProvider.has('BarCtrl')).toBe(true);
      expect($controllerProvider.has('BazCtrl')).toBe(true);
      expect($controllerProvider.has('QuxCtrl')).toBe(true);

      expect($controllerProvider.has('UnknownCtrl')).toBe(false);
    });


    it('should instantiate a controller defined on window if allowGlobals is set',
      angular.mock.inject(function($window) {
        var scope = {};
        var Foo = function() {};

        $controllerProvider.allowGlobals();

        $window.a = {Foo: Foo};

        var foo = $controller('a.Foo', {$scope: scope});
        expect(foo).toBeDefined();
        expect(foo instanceof Foo).toBe(true);
    }));


    it('should throw ctrlfmt if name contains spaces', function() {
      expect(function() {
        $controller('ctrl doom');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl doom\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });
  });


  it('should return instance of given controller class', function() {
    var MyClass = function() {};
    var ctrl = $controller(MyClass);

    expect(ctrl).toBeDefined();
    expect(ctrl instanceof MyClass).toBe(true);
  });

  it('should inject arguments', angular.mock.inject(function($http) {
    var MyClass = function($http) {
      this.$http = $http;
    };

    var ctrl = $controller(MyClass);
    expect(ctrl.$http).toBe($http);
  }));


  it('should inject given scope', function() {
    var MyClass = function($scope) {
      this.$scope = $scope;
    };

    var scope = {};
    var ctrl = $controller(MyClass, {$scope: scope});

    expect(ctrl.$scope).toBe(scope);
  });


  it('should not instantiate a controller defined on window', angular.mock.inject(function($window) {
    var scope = {};
    var Foo = function() {};

    $window.a = {Foo: Foo};

    expect(function() {
      $controller('a.Foo', {$scope: scope});
    }).toThrow();
  }));

  it('should throw ctrlreg when the controller name does not match a registered controller', function() {
    expect(function() {
      $controller('IDoNotExist', {$scope: {}});
    }).toThrowMinErr('$controller', 'ctrlreg', 'The controller with the name \'IDoNotExist\' is not registered.');
  });


  describe('ctrl as syntax', function() {

    it('should publish controller instance into scope', function() {
      var scope = {};

      $controllerProvider.register('FooCtrl', function() { this.mark = 'foo'; });

      var foo = $controller('FooCtrl as foo', {$scope: scope});
      expect(scope.foo).toBe(foo);
      expect(scope.foo.mark).toBe('foo');
    });


    it('should allow controllers with dots', function() {
      var scope = {};

      $controllerProvider.register('a.b.FooCtrl', function() { this.mark = 'foo'; });

      var foo = $controller('a.b.FooCtrl as foo', {$scope: scope});
      expect(scope.foo).toBe(foo);
      expect(scope.foo.mark).toBe('foo');
    });


    it('should throw an error if $scope is not provided', function() {
      $controllerProvider.register('a.b.FooCtrl', function() { this.mark = 'foo'; });

      expect(function() {
        $controller('a.b.FooCtrl as foo');
      }).toThrowMinErr('$controller', 'noscp', 'Cannot export controller \'a.b.FooCtrl\' as \'foo\'! No $scope object provided via `locals`.');

    });


    it('should throw ctrlfmt if identifier contains non-ident characters', function() {
      expect(function() {
        $controller('ctrl as foo<bar');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl as foo<bar\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });


    it('should throw ctrlfmt if identifier contains spaces', function() {
      expect(function() {
        $controller('ctrl as foo bar');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl as foo bar\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });


    it('should throw ctrlfmt if identifier missing after " as "', function() {
      expect(function() {
        $controller('ctrl as ');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl as \'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
      expect(function() {
        $controller('ctrl as');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl as\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });

    it('should allow identifiers containing `$`', function() {
      var scope = {};

      $controllerProvider.register('FooCtrl', function() { this.mark = 'foo'; });

      var foo = $controller('FooCtrl as $foo', {$scope: scope});
      expect(scope.$foo).toBe(foo);
      expect(scope.$foo.mark).toBe('foo');
    });
  });
});
