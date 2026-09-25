'use strict';
 describe('$controller', () => {
  var $controllerProvider;
  var $controller;

  beforeEach(angular.mock.module(function(_$controllerProvider_) {
    $controllerProvider = _$controllerProvider_;
  }));


  beforeEach(angular.mock.inject(function(_$controller_) {
    $controller = _$controller_;
  }));


  describe('provider', () => {

    test('should allow registration of controllers', () => {
      var FooCtrl = function($scope) { $scope.foo = 'bar'; };
      var scope = {};
      var ctrl;

      $controllerProvider.register('FooCtrl', FooCtrl);
      ctrl = $controller('FooCtrl', {$scope: scope});

      expect(scope.foo).toBe('bar');
      expect(ctrl instanceof FooCtrl).toBe(true);
    });

    test('should allow registration of bound controller functions', () => {
      var FooCtrl = function($scope) { $scope.foo = 'bar'; };
      var scope = {};
      var ctrl;

      var BoundFooCtrl = FooCtrl.bind(null);

      $controllerProvider.register('FooCtrl', ['$scope', BoundFooCtrl]);
      ctrl = $controller('FooCtrl', {$scope: scope});

      expect(scope.foo).toBe('bar');
    });

    test('should allow registration of map of controllers', () => {
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


    test('should allow registration of controllers annotated with arrays', () => {
      var FooCtrl = function($scope) { $scope.foo = 'bar'; };
      var scope = {};
      var ctrl;

      $controllerProvider.register('FooCtrl', ['$scope', FooCtrl]);
      ctrl = $controller('FooCtrl', {$scope: scope});

      expect(scope.foo).toBe('bar');
      expect(ctrl instanceof FooCtrl).toBe(true);
    });


    test('should throw an exception if a controller is called "hasOwnProperty"', () => {
      expect(function() {
        $controllerProvider.register('hasOwnProperty', function($scope) {});
      }).toThrowMinErr('ng', 'badname', 'hasOwnProperty is not a valid controller name');
    });


    test('should allow checking the availability of a controller', () => {
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


    test('should throw ctrlfmt if name contains spaces', () => {
      expect(function() {
        $controller('ctrl doom');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl doom\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });
  });


  test('should return instance of given controller class', () => {
    var MyClass = function() {};
    var ctrl = $controller(MyClass);

    expect(ctrl).toBeDefined();
    expect(ctrl instanceof MyClass).toBe(true);
  });

  test('should inject arguments', angular.mock.inject(function($http) {
    var MyClass = function($http) {
      this.$http = $http;
    };

    var ctrl = $controller(MyClass);
    expect(ctrl.$http).toBe($http);
  }));


  test('should inject given scope', () => {
    var MyClass = function($scope) {
      this.$scope = $scope;
    };

    var scope = {};
    var ctrl = $controller(MyClass, {$scope: scope});

    expect(ctrl.$scope).toBe(scope);
  });


  test('should not instantiate a controller defined on window', angular.mock.inject(function($window) {
    var scope = {};
    var Foo = function() {};

    $window.a = {Foo: Foo};

    expect(function() {
      $controller('a.Foo', {$scope: scope});
    }).toThrow();
  }));

  test('should throw ctrlreg when the controller name does not match a registered controller', () => {
    expect(function() {
      $controller('IDoNotExist', {$scope: {}});
    }).toThrowMinErr('$controller', 'ctrlreg', 'The controller with the name \'IDoNotExist\' is not registered.');
  });


  describe('ctrl as syntax', () => {

    test('should publish controller instance into scope', () => {
      var scope = {};

      $controllerProvider.register('FooCtrl', function() { this.mark = 'foo'; });

      var foo = $controller('FooCtrl as foo', {$scope: scope});
      expect(scope.foo).toBe(foo);
      expect(scope.foo.mark).toBe('foo');
    });


    test('should allow controllers with dots', () => {
      var scope = {};

      $controllerProvider.register('a.b.FooCtrl', function() { this.mark = 'foo'; });

      var foo = $controller('a.b.FooCtrl as foo', {$scope: scope});
      expect(scope.foo).toBe(foo);
      expect(scope.foo.mark).toBe('foo');
    });


    test('should throw an error if $scope is not provided', () => {
      $controllerProvider.register('a.b.FooCtrl', function() { this.mark = 'foo'; });

      expect(function() {
        $controller('a.b.FooCtrl as foo');
      }).toThrowMinErr('$controller', 'noscp', 'Cannot export controller \'a.b.FooCtrl\' as \'foo\'! No $scope object provided via `locals`.');

    });


    test('should throw ctrlfmt if identifier contains non-ident characters', () => {
      expect(function() {
        $controller('ctrl as foo<bar');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl as foo<bar\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });


    test('should throw ctrlfmt if identifier contains spaces', () => {
      expect(function() {
        $controller('ctrl as foo bar');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl as foo bar\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });


    test('should throw ctrlfmt if identifier missing after " as "', () => {
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

    test('should allow identifiers containing `$`', () => {
      var scope = {};

      $controllerProvider.register('FooCtrl', function() { this.mark = 'foo'; });

      var foo = $controller('FooCtrl as $foo', {$scope: scope});
      expect(scope.$foo).toBe(foo);
      expect(scope.$foo.mark).toBe('foo');
    });
  });
});
