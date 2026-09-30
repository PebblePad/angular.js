'use strict';
 describe('injector.modules', () => {
    test('should expose the loaded module info on the instance injector', () => {
      var test1 = angular.module('test1', ['test2']).info({ version: '1.1' });
      var test2 = angular.module('test2', []).info({ version: '1.2' });
      angular.mock.module('test1');
      angular.mock.inject(['$injector', function($injector) {
        expect(Object.keys($injector.modules)).toEqual(['ng', 'ngLocale', 'ngMock', 'test1', 'test2']);
        expect($injector.modules['test1'].info()).toEqual({ version: '1.1' });
        expect($injector.modules['test2'].info()).toEqual({ version: '1.2' });
      }]);
    });

    test('should expose the loaded module info on the provider injector', () => {
      var providerInjector;
      var test1 = angular.module('test1', ['test2']).info({ version: '1.1' });
      var test2 = angular.module('test2', [])
        .info({ version: '1.2' })
        .provider('test', ['$injector', function($injector) {
          providerInjector = $injector;
          return {$get() {}};
        }]);
      angular.mock.module('test1');
      // needed to ensure that the provider blocks are executed
      angular.mock.inject();

      expect(Object.keys(providerInjector.modules)).toEqual(['ng', 'ngLocale', 'ngMock', 'test1', 'test2']);
      expect(providerInjector.modules['test1'].info()).toEqual({ version: '1.1' });
      expect(providerInjector.modules['test2'].info()).toEqual({ version: '1.2' });
    });
});
 describe('injector', () => {
  var providers;
  var injector;
  var providerInjector;
  var controllerProvider;

  beforeEach(angular.mock.module(function($provide, $injector, $controllerProvider) {
    providers = function(name, factory, annotations) {
      $provide.factory(name, angular.extend(factory, annotations || {}));
    };
    providerInjector = $injector;
    controllerProvider = $controllerProvider;
  }));
  beforeEach(angular.mock.inject(function($injector) {
    injector = $injector;
  }));


  test('should return same instance from calling provider', () => {
    var instance = {};
    var original = instance;
    providers('instance', function() { return instance; });
    expect(injector.get('instance')).toEqual(instance);
    instance = 'deleted';
    expect(injector.get('instance')).toEqual(original);
  });


  test('should inject providers', () => {
    providers('a', function() {return 'Mi';});
    providers('b', function(mi) {return mi + 'sko';}, {$inject:['a']});
    expect(injector.get('b')).toEqual('Misko');
  });


  test('should check its modulesToLoad argument', () => {
    expect(function() { angular.injector('test'); })
        .toThrowMinErr('ng', 'areq');
  });


  test('should resolve dependency graph and instantiate all services just once', () => {
    var log = [];

    //          s1
    //        /  | \
    //       /  s2  \
    //      /  / | \ \
    //     /s3 < s4 > s5
    //    //
    //   s6

    providers('s1', function() { log.push('s1'); return {}; }, {$inject: ['s2', 's5', 's6']});
    providers('s2', function() { log.push('s2'); return {}; }, {$inject: ['s3', 's4', 's5']});
    providers('s3', function() { log.push('s3'); return {}; }, {$inject: ['s6']});
    providers('s4', function() { log.push('s4'); return {}; }, {$inject: ['s3', 's5']});
    providers('s5', function() { log.push('s5'); return {}; });
    providers('s6', function() { log.push('s6'); return {}; });

    injector.get('s1');

    expect(log).toEqual(['s6', 's3', 's5', 's4', 's2', 's1']);
  });


  test('should allow query names', () => {
    providers('abc', function() { return ''; });

    expect(injector.has('abc')).toBe(true);
    expect(injector.has('xyz')).toBe(false);
    expect(injector.has('$injector')).toBe(true);
  });


  test('should provide useful message if no provider', () => {
    expect(function() {
      injector.get('idontexist');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist');
  });


  test('should provide the caller name if given', () => {
    expect(function() {
      injector.get('idontexist', 'callerName');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist <- callerName');
  });


  test('should provide the caller name for controllers', () => {
    controllerProvider.register('myCtrl', function(idontexist) {});
    var $controller = injector.get('$controller');
    expect(function() {
      $controller('myCtrl', {$scope: {}});
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist <- myCtrl');
  });


  test('should not corrupt the cache when an object fails to get instantiated', () => {
    expect(function() {
      injector.get('idontexist');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist');

    expect(function() {
      injector.get('idontexist');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist');
  });


  test('should provide path to the missing provider', () => {
    providers('a', function(idontexist) {return 1;});
    providers('b', function(a) {return 2;});
    expect(function() {
      injector.get('b');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist <- a <- b');
  });


  test('should create a new $injector for the run phase', angular.mock.inject(function($injector) {
    expect($injector).not.toBe(providerInjector);
  }));


  describe('loadNewModules', () => {
    test('should be defined on $injector', () => {
      var injector = angular.injector([]);
      expect(injector.loadNewModules).toEqual(expect.any(Function));
    });

    test('should allow new modules to be added after injector creation', () => {
      angular.module('initial', []);
      var injector = angular.injector(['initial']);
      expect(injector.modules['initial']).toBeDefined();
      expect(injector.modules['lazy']).toBeUndefined();
      angular.module('lazy', []);
      injector.loadNewModules(['lazy']);
      expect(injector.modules['lazy']).toBeDefined();
    });

    test('should execute runBlocks of new modules', () => {
      var log = [];
      angular.module('initial', []).run(function() { log.push('initial'); });
      var injector = angular.injector(['initial']);
      log.push('created');

      angular.module('a', []).run(function() { log.push('a'); });
      injector.loadNewModules(['a']);
      expect(log).toEqual(['initial', 'created', 'a']);
    });

    test('should execute configBlocks of new modules', () => {
      var log = [];
      angular.module('initial', []).config(function() { log.push('initial'); });
      var injector = angular.injector(['initial']);
      log.push('created');

      angular.module('a', [], function() { log.push('config1'); }).config(function() { log.push('config2'); });
      injector.loadNewModules(['a']);
      expect(log).toEqual(['initial', 'created', 'config1', 'config2']);
    });

    test('should execute runBlocks and configBlocks in the correct order', () => {
      var log = [];
      angular.module('initial', [], function() { log.push(1); })
        .config(function() { log.push(2); })
        .run(function() { log.push(3); });
      var injector = angular.injector(['initial']);
      log.push('created');

      angular.module('a', [], function() { log.push(4); })
        .config(function() { log.push(5); })
        .run(function() { log.push(6); });
      injector.loadNewModules(['a']);
      expect(log).toEqual([1, 2, 3, 'created', 4, 5, 6]);
    });

    test('should load dependent modules', () => {
      angular.module('initial', []);
      var injector = angular.injector(['initial']);
      expect(injector.modules['initial']).toBeDefined();
      expect(injector.modules['lazy1']).toBeUndefined();
      expect(injector.modules['lazy2']).toBeUndefined();
      angular.module('lazy1', ['lazy2']);
      angular.module('lazy2', []);
      injector.loadNewModules(['lazy1']);
      expect(injector.modules['lazy1']).toBeDefined();
      expect(injector.modules['lazy2']).toBeDefined();
    });

    test('should execute blocks of new modules in the correct order', () => {
      var log = [];
      angular.module('initial', []);
      var injector = angular.injector(['initial']);

      angular.module('lazy1', ['lazy2'], function() { log.push('lazy1-1'); })
        .config(function() { log.push('lazy1-2'); })
        .run(function() { log.push('lazy1-3'); });
      angular.module('lazy2', [], function() { log.push('lazy2-1'); })
        .config(function() { log.push('lazy2-2'); })
        .run(function() { log.push('lazy2-3'); });

      injector.loadNewModules(['lazy1']);
      expect(log).toEqual(['lazy2-1', 'lazy2-2', 'lazy1-1', 'lazy1-2', 'lazy2-3', 'lazy1-3']);
    });

    test('should not reload a module that is already loaded', () => {
      var log = [];
      angular.module('initial', []).run(function() { log.push('initial'); });
      var injector = angular.injector(['initial']);
      expect(log).toEqual(['initial']);

      injector.loadNewModules(['initial']);
      expect(log).toEqual(['initial']);

      angular.module('a', []).run(function() { log.push('a'); });
      injector.loadNewModules(['a']);
      expect(log).toEqual(['initial', 'a']);
      injector.loadNewModules(['a']);
      expect(log).toEqual(['initial', 'a']);

      angular.module('b', ['a']).run(function() { log.push('b'); });
      angular.module('c', []).run(function() { log.push('c'); });
      angular.module('d', ['b', 'c']).run(function() { log.push('d'); });
      injector.loadNewModules(['d']);
      expect(log).toEqual(['initial', 'a', 'b', 'c', 'd']);
    });

    test('should be able to register a service from a new module', () => {
      var injector = angular.injector([]);
      angular.module('a', []).factory('aService', function() {
        return {sayHello() { return 'Hello'; }};
      });
      injector.loadNewModules(['a']);
      injector.invoke(function(aService) {
        expect(aService.sayHello()).toEqual('Hello');
      });
    });


    test('should be able to register a controller from a new module', () => {
      var injector = angular.injector(['ng']);
      angular.module('a', []).controller('aController', function($scope) {
        $scope.test = 'b';
      });
      injector.loadNewModules(['a']);
      injector.invoke(function($controller) {
        var scope = {};
        $controller('aController', {$scope: scope});
        expect(scope.test).toEqual('b');
      });
    });


    test('should be able to register a filter from a new module', () => {
      var injector = angular.injector(['ng']);
      angular.module('a', []).filter('aFilter', function() {
        return function(input) { return input + ' filtered'; };
      });
      injector.loadNewModules(['a']);
      injector.invoke(function(aFilterFilter) {
        expect(aFilterFilter('test')).toEqual('test filtered');
      });
    });


    test('should be able to register a directive from a new module', () => {
      var injector = angular.injector(['ng']);
      angular.module('a', []).directive('aDirective', function() {
        return {template: 'test directive'};
      });
      injector.loadNewModules(['a']);
      injector.invoke(function($compile, $rootScope) {
        var elem = $compile('<div a-directive></div>')($rootScope);  // compile and link
        $rootScope.$digest();
        expect(elem.text()).toEqual('test directive');
        elem.remove();
      });
    });
  });

  test('should have a false strictDi property', angular.mock.inject(function($injector) {
    expect($injector.strictDi).toBe(false);
  }));


  describe('invoke', () => {
    var args;

     beforeEach(() => {
      args = null;
      providers('a', function() {return 1;});
      providers('b', function() {return 2;});
    });


    function Fn(a, b, c, d) {
      args = [this, a, b, c, d];
      return a + b + c + d;
    }


    test('should call function', () => {
      Fn.$inject = ['a', 'b', 'c', 'd'];
      injector.invoke(Fn, {name:'this'},  {c:3, d:4});
      expect(args).toEqual([{name:'this'}, 1, 2, 3, 4]);
    });


    test('should treat array as annotations', () => {
      injector.invoke(['a', 'b', 'c', 'd', Fn], {name:'this'}, {c:3, d:4});
      expect(args).toEqual([{name:'this'}, 1, 2, 3, 4]);
    });


    test('should invoke the passed-in fn with all of the dependencies as arguments', () => {
      providers('c', function() {return 3;});
      providers('d', function() {return 4;});
      expect(injector.invoke(['a', 'b', 'c', 'd', Fn])).toEqual(10);
    });


    test('should fail with errors if not function or array', () => {
      expect(function() {
        injector.invoke({});
      }).toThrowMinErr('ng', 'areq', 'Argument \'fn\' is not a function, got Object');
      expect(function() {
        injector.invoke(['a', 123], {});
      }).toThrowMinErr('ng', 'areq', 'Argument \'fn\' is not a function, got number');
    });
  });


  describe('annotation', () => {
    const annotate = angular.injector.$$annotate;
    /* global annotate: false */
    test('should return $inject', () => {
      function fn() {}
      fn.$inject = ['a'];
      expect(annotate(fn)).toBe(fn.$inject);
      expect(annotate(function() {})).toEqual([]);
      expect(annotate(function() {})).toEqual([]);
      /* eslint-disable space-before-function-paren, no-multi-spaces */
      expect(annotate(function  () {})).toEqual([]);
      expect(annotate(function /* */ () {})).toEqual([]);
      /* eslint-enable */
    });


    test('should create $inject', () => {
      var extraParams = angular.noop;
      /* eslint-disable space-before-function-paren */
      // keep the multi-line to make sure we can handle it
      function $f_n0 /*
          */(
          $a, // x, <-- looks like an arg but it is a comment
          b_, /* z, <-- looks like an arg but it is a
                 multi-line comment
                 function(a, b) {}
                 */
          _c,
          /* {some type} */ d) { extraParams(); }
      /* eslint-enable */
      expect(annotate($f_n0)).toEqual(['$a', 'b_', '_c',  'd']);
      expect($f_n0.$inject).toEqual(['$a', 'b_', '_c',  'd']);
    });


    test('should strip leading and trailing underscores from arg name during inference', () => {
      function beforeEachFn(_foo_) { /* foo = _foo_ */ }
      expect(annotate(beforeEachFn)).toEqual(['foo']);
    });

    test('should not strip service names with a single underscore', () => {
      function beforeEachFn(_) { /* _ = _ */ }
      expect(annotate(beforeEachFn)).toEqual(['_']);
    });

    test('should handle no arg functions', () => {
      function $f_n0() {}
      expect(annotate($f_n0)).toEqual([]);
      expect($f_n0.$inject).toEqual([]);
    });


    test('should handle no arg functions with spaces in the arguments list', () => {
      function fn() {}
      expect(annotate(fn)).toEqual([]);
      expect(fn.$inject).toEqual([]);
    });


    test('should handle args with both $ and _', () => {
      function $f_n0($a_) {}
      expect(annotate($f_n0)).toEqual(['$a_']);
      expect($f_n0.$inject).toEqual(['$a_']);
    });

    test('should handle functions with overridden toString', () => {
      function fn(a) {}
      fn.toString = function() { return 'fn'; };
      expect(annotate(fn)).toEqual(['a']);
      expect(fn.$inject).toEqual(['a']);
    });

    test('should throw on non function arg', () => {
      expect(function() {
        annotate({});
      }).toThrow();
    });


    describe('es6', () => {
      if (support.shorthandMethods) {
        // The functions are generated using `eval` as just having the ES6 syntax can break some browsers.
        test('should be possible to annotate shorthand methods', () => {
          // eslint-disable-next-line no-eval
          expect(annotate(eval('({ fn(x) { return; } })').fn)).toEqual(['x']);
        });
      }


      if (support.fatArrows) {
        test('should create $inject for arrow functions', () => {
          // eslint-disable-next-line no-eval
          expect(annotate(eval('(a, b) => a'))).toEqual(['a', 'b']);
        });
      }


      if (support.fatArrows) {
        test('should create $inject for arrow functions with no parenthesis', () => {
          // eslint-disable-next-line no-eval
          expect(annotate(eval('a => a'))).toEqual(['a']);
        });
      }


      if (support.fatArrows) {
        test('should take args before first arrow', () => {
          // eslint-disable-next-line no-eval
          expect(annotate(eval('a => b => b'))).toEqual(['a']);
        });
      }

      if (support.classes) {
        test('should be possible to instantiate ES6 classes', () => {
          providers('a', function() { return 'a-value'; });
          // eslint-disable-next-line no-eval
          var Clazz = eval('(class { constructor(a) { this.a = a; } aVal() { return this.a; } })');
          var instance = injector.instantiate(Clazz);
          expect(instance).toEqual(new Clazz('a-value'));
          expect(instance.aVal()).toEqual('a-value');
        });

        test.each([
          'class Test {}',
          'class Test{}',
          'class //<--ES6 stuff\nTest {}',
          'class//<--ES6 stuff\nTest {}',
          'class {}',
          'class{}',
          'class //<--ES6 stuff\n {}',
          'class//<--ES6 stuff\n {}',
          'class/* Test */{}',
          'class /* Test */ {}'
        ].map((prop) => ({ prop })))(
            'should detect ES6 classes regardless of whitespace/comments ($prop)', function({ prop: classDefinition }) {
          // eslint-disable-next-line no-eval
          var Clazz = eval('(' + classDefinition + ')');
          var instance = injector.invoke(Clazz);

          expect(instance).toEqual(expect.any(Clazz));
        });
      }
    });
  });


  test('should have $injector', () => {
    var $injector = angular.injector();
    expect($injector.get('$injector')).toBe($injector);
  });


  test('should define module', () => {
    var log = '';
    var injector = angular.injector([function($provide) {
      $provide.value('value', 'value;');
      $provide.factory('fn', ngInternals.valueFn('function;'));
      $provide.provider('service', function Provider() {
        this.$get = ngInternals.valueFn('service;');
      });
    }, function(valueProvider, fnProvider, serviceProvider) {
      log += valueProvider.$get() + fnProvider.$get() + serviceProvider.$get();
    }]).invoke(function(value, fn, service) {
      log += '->' + value + fn + service;
    });
    expect(log).toEqual('value;function;service;->value;function;service;');
  });


  describe('module', () => {
    test('should provide $injector even when no module is requested', () => {
      var $provide;

      var $injector = angular.injector([
        angular.extend(function(p) { $provide = p; }, {$inject: ['$provide']})
      ]);

      expect($injector.get('$injector')).toBe($injector);
    });


    test('should load multiple function modules and infer inject them', () => {
      var a = 'junk';
      var $injector = angular.injector([
        function() {
          a = 'A'; // reset to prove we ran
        },
        function($provide) {
          $provide.value('a', a);
        },
        angular.extend(function(p, serviceA) {
          p.value('b', serviceA.$get() + 'B');
        }, {$inject:['$provide', 'aProvider']}),
        ['$provide', 'bProvider', function(p, serviceB) {
          p.value('c', serviceB.$get() + 'C');
        }]
      ]);
      expect($injector.get('a')).toEqual('A');
      expect($injector.get('b')).toEqual('AB');
      expect($injector.get('c')).toEqual('ABC');
    });


    test('should run symbolic modules', () => {
      angular.module('myModule', []).value('a', 'abc');
      var $injector = angular.injector(['myModule']);
      expect($injector.get('a')).toEqual('abc');
    });


    test('should error on invalid module name', () => {
      expect(function() {
        angular.injector(['IDontExist'], {});
      }).toThrowMinErr('$injector', 'modulerr',
        /\[\$injector:nomod] Module 'IDontExist' is not available! You either misspelled the module name or forgot to load it/);
    });


    test('should load dependant modules only once', () => {
      var log = '';
      angular.module('a', [], function() { log += 'a'; });
      angular.module('b', ['a'], function() { log += 'b'; });
      angular.module('c', ['a', 'b'], function() { log += 'c'; });
      angular.injector(['c', 'c']);
      expect(log).toEqual('abc');
    });

    test('should load different instances of dependent functions', () => {
      function  generateValueModule(name, value) {
        return function($provide) {
          $provide.value(name, value);
        };
      }
      var injector = angular.injector([generateValueModule('name1', 'value1'),
                                     generateValueModule('name2', 'value2')]);
      expect(injector.get('name2')).toBe('value2');
    });

    test('should load same instance of dependent function only once', () => {
      var count = 0;
      function valueModule($provide) {
        count++;
        $provide.value('name', 'value');
      }

      var injector = angular.injector([valueModule, valueModule]);
      expect(injector.get('name')).toBe('value');
      expect(count).toBe(1);
    });

    test('should execute runBlocks after injector creation', () => {
      var log = '';
      angular.module('a', [], function() { log += 'a'; }).run(function() { log += 'A'; });
      angular.module('b', ['a'], function() { log += 'b'; }).run(function() { log += 'B'; });
      angular.injector([
        'b',
        ngInternals.valueFn(function() { log += 'C'; }),
        [ngInternals.valueFn(function() { log += 'D'; })]
      ]);
      expect(log).toEqual('abABCD');
    });

    test('should execute own config blocks after all own providers are invoked', () => {
      var log = '';
      angular.module('a', ['b'])
      .config(function($aProvider) {
        log += 'aConfig;';
      })
      .provider('$a', function Provider$a() {
        log += '$aProvider;';
        this.$get = function() {};
      });
      angular.module('b', [])
      .config(function($bProvider) {
        log += 'bConfig;';
      })
      .provider('$b', function Provider$b() {
        log += '$bProvider;';
        this.$get = function() {};
      });

      angular.injector(['a']);
      expect(log).toBe('$bProvider;bConfig;$aProvider;aConfig;');
    });

    describe('$provide', () => {

      test('should throw an exception if we try to register a service called "hasOwnProperty"', () => {
        angular.injector([function($provide) {
          expect(function() {
            $provide.provider('hasOwnProperty', function() {  });
          }).toThrowMinErr('ng', 'badname');
        }]);
      });

      test('should throw an exception if we try to register a constant called "hasOwnProperty"', () => {
        angular.injector([function($provide) {
          expect(function() {
            $provide.constant('hasOwnProperty', {});
          }).toThrowMinErr('ng', 'badname');
        }]);
      });


      describe('constant', () => {
        test('should create configuration injectable constants', () => {
          var log = [];
          angular.injector([
            function($provide) {
              $provide.constant('abc', 123);
              $provide.constant({a: 'A', b:'B'});
              return function(a) {
                log.push(a);
              };
            },
            function(abc) {
              log.push(abc);
              return function(b) {
                log.push(b);
              };
            }
          ]).get('abc');
          expect(log).toEqual([123, 'A', 'B']);
        });
      });


      describe('value', () => {
        test('should configure $provide values', () => {
          expect(angular.injector([function($provide) {
            $provide.value('value', 'abc');
          }]).get('value')).toEqual('abc');
        });


        test('should configure a set of values', () => {
          expect(angular.injector([function($provide) {
            $provide.value({value: Array});
          }]).get('value')).toEqual(Array);
        });
      });


      describe('factory', () => {
        test('should configure $provide factory function', () => {
          expect(angular.injector([function($provide) {
            $provide.factory('value', ngInternals.valueFn('abc'));
          }]).get('value')).toEqual('abc');
        });


        test('should configure a set of factories', () => {
          expect(angular.injector([function($provide) {
            $provide.factory({value: Array});
          }]).get('value')).toEqual([]);
        });
      });


      describe('service', () => {
        test('should register a class', () => {
          function Type(value) {
            this.value = value;
          }

          var instance = angular.injector([function($provide) {
            $provide.value('value', 123);
            $provide.service('foo', Type);
          }]).get('foo');

          expect(instance instanceof Type).toBe(true);
          expect(instance.value).toBe(123);
        });


        test('should register a set of classes', () => {
          var Type = function() {};

          var injector = angular.injector([function($provide) {
            $provide.service({
              foo: Type,
              bar: Type
            });
          }]);

          expect(injector.get('foo') instanceof Type).toBe(true);
          expect(injector.get('bar') instanceof Type).toBe(true);
        });
      });


      describe('provider', () => {
        test('should configure $provide provider object', () => {
          expect(angular.injector([function($provide) {
            $provide.provider('value', {
              $get: ngInternals.valueFn('abc')
            });
          }]).get('value')).toEqual('abc');
        });


        test('should configure $provide provider type', () => {
          function Type() {}
          Type.prototype.$get = function() {
            expect(this instanceof Type).toBe(true);
            return 'abc';
          };
          expect(angular.injector([function($provide) {
            $provide.provider('value', Type);
          }]).get('value')).toEqual('abc');
        });


        test('should configure $provide using an array', () => {
          function Type(PREFIX) {
            this.prefix = PREFIX;
          }
          Type.prototype.$get = function() {
            return this.prefix + 'def';
          };
          expect(angular.injector([function($provide) {
            $provide.constant('PREFIX', 'abc');
            $provide.provider('value', ['PREFIX', Type]);
          }]).get('value')).toEqual('abcdef');
        });


        test('should configure a set of providers', () => {
          expect(angular.injector([function($provide) {
            $provide.provider({value: ngInternals.valueFn({$get:Array})});
          }]).get('value')).toEqual([]);
        });
      });


      describe('decorator', () => {
        var log;
        var injector;

         beforeEach(() => {
          log = [];
        });


        test('should be called with the original instance', () => {
          injector = angular.injector([function($provide) {
            $provide.value('myService', function(val) {
              log.push('myService:' + val);
              return 'origReturn';
            });

            $provide.decorator('myService', function($delegate) {
              return function(val) {
                log.push('myDecoratedService:' + val);
                var origVal = $delegate('decInput');
                return 'dec+' + origVal;
              };
            });
          }]);

          var out = injector.get('myService')('input');
          log.push(out);
          expect(log.join('; ')).
            toBe('myDecoratedService:input; myService:decInput; dec+origReturn');
        });


        test('should allow multiple decorators to be applied to a service', () => {
          injector = angular.injector([function($provide) {
            $provide.value('myService', function(val) {
              log.push('myService:' + val);
              return 'origReturn';
            });

            $provide.decorator('myService', function($delegate) {
              return function(val) {
                log.push('myDecoratedService1:' + val);
                var origVal = $delegate('decInput1');
                return 'dec1+' + origVal;
              };
            });

            $provide.decorator('myService', function($delegate) {
              return function(val) {
                log.push('myDecoratedService2:' + val);
                var origVal = $delegate('decInput2');
                return 'dec2+' + origVal;
              };
            });
          }]);

          var out = injector.get('myService')('input');
          log.push(out);
          expect(log).toEqual(['myDecoratedService2:input',
                               'myDecoratedService1:decInput2',
                               'myService:decInput1',
                               'dec2+dec1+origReturn']);
        });


        test('should decorate services with dependencies', () => {
          injector = angular.injector([function($provide) {
            $provide.value('dep1', 'dependency1');

            $provide.factory('myService', ['dep1', function(dep1) {
              return function(val) {
                log.push('myService:' + val + ',' + dep1);
                return 'origReturn';
              };
            }]);

            $provide.decorator('myService', function($delegate) {
              return function(val) {
                log.push('myDecoratedService:' + val);
                var origVal = $delegate('decInput');
                return 'dec+' + origVal;
              };
            });
          }]);

          var out = injector.get('myService')('input');
          log.push(out);
          expect(log.join('; ')).
            toBe('myDecoratedService:input; myService:decInput,dependency1; dec+origReturn');
        });


        test('should allow for decorators to be injectable', () => {
          injector = angular.injector([function($provide) {
            $provide.value('dep1', 'dependency1');

            $provide.factory('myService', function() {
              return function(val) {
                log.push('myService:' + val);
                return 'origReturn';
              };
            });

            $provide.decorator('myService', function($delegate, dep1) {
              return function(val) {
                log.push('myDecoratedService:' + val + ',' + dep1);
                var origVal = $delegate('decInput');
                return 'dec+' + origVal;
              };
            });
          }]);

          var out = injector.get('myService')('input');
          log.push(out);
          expect(log.join('; ')).
            toBe('myDecoratedService:input,dependency1; myService:decInput; dec+origReturn');
        });


        test('should allow for decorators to $injector', () => {
          injector = angular.injector(['ng', function($provide) {
            $provide.decorator('$injector', function($delegate) {
              return angular.extend({}, $delegate, {get(val) {
                if (val === 'key') {
                  return 'value';
                }
                return $delegate.get(val);
              }});
            });
          }]);

          expect(injector.get('key')).toBe('value');
          expect(injector.get('$http')).not.toBeUndefined();
        });
      });
    });


    describe('error handling', () => {
      test('should handle wrong argument type', () => {
        expect(function() {
          angular.injector([
            {}
          ], {});
        }).toThrowMinErr('$injector', 'modulerr', /Failed to instantiate module \{\} due to:\n.*\[ng:areq] Argument 'module' is not a function, got Object/);
      });


      test('should handle exceptions', () => {
        expect(function() {
          angular.injector([function() {
            throw new Error('MyError');
          }], {});
        }).toThrowMinErr('$injector', 'modulerr', /Failed to instantiate module .+ due to:\n.*MyError/);
      });


      test('should decorate the missing service error with module name', () => {
        angular.module('TestModule', [], function(xyzzy) {});
        expect(function() {
          angular.injector(['TestModule']);
        }).toThrowMinErr(
          '$injector', 'modulerr', /Failed to instantiate module TestModule due to:\n.*\[\$injector:unpr] Unknown provider: xyzzy/
        );
      });


      test('should decorate the missing service error with module function', () => {
        function myModule(xyzzy) {}
        expect(function() {
          angular.injector([myModule]);
        }).toThrowMinErr(
          '$injector', 'modulerr', /Failed to instantiate module function myModule\(xyzzy\) due to:\n.*\[\$injector:unpr] Unknown provider: xyzzy/
        );
      });


      test('should decorate the missing service error with module array function', () => {
        function myModule(xyzzy) {}
        expect(function() {
          angular.injector([['xyzzy', myModule]]);
        }).toThrowMinErr(
          '$injector', 'modulerr', /Failed to instantiate module function myModule\(xyzzy\) due to:\n.*\[\$injector:unpr] Unknown provider: xyzzy/
        );
      });


      test('should throw error when trying to inject oneself', () => {
        expect(function() {
          angular.injector([function($provide) {
            $provide.factory('service', function(service) {});
            return function(service) {};
          }]);
        }).toThrowMinErr('$injector', 'cdep', 'Circular dependency found: service <- service');
      });


      test('should throw error when trying to inject circular dependency', () => {
        expect(function() {
          angular.injector([function($provide) {
            $provide.factory('a', function(b) {});
            $provide.factory('b', function(a) {});
            return function(a) {};
          }]);
        }).toThrowMinErr('$injector', 'cdep', 'Circular dependency found: a <- b <- a');
      });

    });
  });


  describe('retrieval', () => {
    var instance = {name:'angular'};
    function Instance() { this.name = 'angular'; }

    function createInjectorWithValue(instanceName, instance) {
      return angular.injector([['$provide', function(provide) {
        provide.value(instanceName, instance);
      }]]);
    }
    function createInjectorWithFactory(serviceName, serviceDef) {
      return angular.injector([['$provide', function(provide) {
        provide.factory(serviceName, serviceDef);
      }]]);
    }


    test('should retrieve by name', () => {
      var $injector = createInjectorWithValue('instance', instance);
      var retrievedInstance = $injector.get('instance');
      expect(retrievedInstance).toBe(instance);
    });


    test('should cache instance', () => {
      var $injector = createInjectorWithFactory('instance', function() { return new Instance(); });
      var instance = $injector.get('instance');
      expect($injector.get('instance')).toBe(instance);
      expect($injector.get('instance')).toBe(instance);
    });


    test('should call functions and infer arguments', () => {
      var $injector = createInjectorWithValue('instance', instance);
      expect($injector.invoke(function(instance) { return instance; })).toBe(instance);
    });

  });


  describe('method invoking', () => {
    var $injector;

     beforeEach(() => {
      $injector = angular.injector([function($provide) {
        $provide.value('book', 'moby');
        $provide.value('author', 'melville');
      }]);
    });


    test('should invoke method', () => {
      expect($injector.invoke(function(book, author) {
        return author + ':' + book;
      })).toEqual('melville:moby');
      expect($injector.invoke(function(book, author) {
        expect(this).toEqual($injector);
        return author + ':' + book;
      }, $injector)).toEqual('melville:moby');
    });


    test('should invoke method with locals', () => {
      expect($injector.invoke(function(book, author) {
        return author + ':' + book;
      })).toEqual('melville:moby');
      expect($injector.invoke(
        function(book, author, chapter) {
          expect(this).toEqual($injector);
          return author + ':' + book + '-' + chapter;
        }, $injector, {author:'m', chapter:'ch1'})).toEqual('m:moby-ch1');
    });


    test('should invoke method which is annotated', () => {
      expect($injector.invoke(angular.extend(function(b, a) {
        return a + ':' + b;
      }, {$inject:['book', 'author']}))).toEqual('melville:moby');
      expect($injector.invoke(angular.extend(function(b, a) {
        expect(this).toEqual($injector);
        return a + ':' + b;
      }, {$inject:['book', 'author']}), $injector)).toEqual('melville:moby');
    });


    test('should invoke method which is an array of annotation', () => {
      expect($injector.invoke(function(book, author) {
        return author + ':' + book;
      })).toEqual('melville:moby');
      expect($injector.invoke(function(book, author) {
        expect(this).toEqual($injector);
        return author + ':' + book;
      }, $injector)).toEqual('melville:moby');
    });


    test('should throw useful error on wrong argument type]', () => {
      expect(function() {
        $injector.invoke({});
      }).toThrowMinErr('ng', 'areq', 'Argument \'fn\' is not a function, got Object');
    });
  });


  describe('service instantiation', () => {
    var $injector;

     beforeEach(() => {
      $injector = angular.injector([function($provide) {
        $provide.value('book', 'moby');
        $provide.value('author', 'melville');
      }]);
    });


    function Type(book, author) {
      this.book = book;
      this.author = author;
    }
    Type.prototype.title = function() {
      return this.author + ': ' + this.book;
    };


    test('should instantiate object and preserve constructor property and be instanceof', () => {
      var t = $injector.instantiate(Type);
      expect(t.book).toEqual('moby');
      expect(t.author).toEqual('melville');
      expect(t.title()).toEqual('melville: moby');
      expect(t instanceof Type).toBe(true);
    });


    test('should instantiate object and preserve constructor property and be instanceof ' +
        'with the array annotated type', function() {
      var t = $injector.instantiate(['book', 'author', Type]);
      expect(t.book).toEqual('moby');
      expect(t.author).toEqual('melville');
      expect(t.title()).toEqual('melville: moby');
      expect(t instanceof Type).toBe(true);
    });


    test('should allow constructor to return different object', () => {
      var obj = {};
      var Class = function() {
        return obj;
      };

      expect($injector.instantiate(Class)).toBe(obj);
    });


    test('should allow constructor to return a function', () => {
      var fn = function() {};
      var Class = function() {
        return fn;
      };

      expect($injector.instantiate(Class)).toBe(fn);
    });


    test('should handle constructor exception', () => {
      expect(function() {
        $injector.instantiate(function() { throw 'MyError'; });
      }).toThrow('MyError');
    });


    test('should return instance if constructor returns non-object value', () => {
      var A = function() {
        return 10;
      };

      var B = function() {
        return 'some-string';
      };

      var C = function() {
        return undefined;
      };

      expect($injector.instantiate(A) instanceof A).toBe(true);
      expect($injector.instantiate(B) instanceof B).toBe(true);
      expect($injector.instantiate(C) instanceof C).toBe(true);
    });
  });

  describe('protection modes', () => {
    test('should prevent provider lookup in app', () => {
      var  $injector = angular.injector([function($provide) {
        $provide.value('name', 'angular');
      }]);
      expect(function() {
        $injector.get('nameProvider');
      }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: nameProviderProvider <- nameProvider');
    });


    test('should prevent provider configuration in app', () => {
      var  $injector = angular.injector([]);
      expect(function() {
        $injector.get('$provide').value('a', 'b');
      }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: $provideProvider <- $provide');
    });


    test('should prevent instance lookup in module', () => {
      function instanceLookupInModule(name) { throw new Error('FAIL'); }
      expect(function() {
        angular.injector([function($provide) {
          $provide.value('name', 'angular');
        }, instanceLookupInModule]);
      }).toThrowMinErr('$injector', 'modulerr', '[$injector:unpr] Unknown provider: name');
    });
  });
});
 describe('strict-di injector', () => {
  beforeEach(inject.strictDi(true));

  describe('with ngMock', () => {
    test('should not throw when calling mock.module() with "magic" annotations', () => {
      expect(function() {
        angular.mock.module(function($provide, $httpProvider, $compileProvider) {
          // Don't throw!
        });
      }).not.toThrow();
    });


    test('should not throw when calling mock.inject() with "magic" annotations', () => {
      expect(function() {
        angular.mock.inject(function($rootScope, $compile, $http) {
          // Don't throw!
        });
      }).not.toThrow();
    });
  });


  test('should throw if magic annotation is used by service', () => {
    angular.mock.module(function($provide) {
      $provide.service({
        '$test': function() { return this; },
        '$test2': function($test) { return this; }
      });
    });
    angular.mock.inject(function($injector) {
      expect(function() {
        $injector.invoke(function($test2) {});
      }).toThrowMinErr('$injector', 'strictdi');
    });
  });


  test('should throw if magic annotation is used by provider', () => {
    angular.mock.module(function($provide) {
      $provide.provider({
        '$test': function() { this.$get = function($rootScope) { return $rootScope; }; }
      });
    });
    angular.mock.inject(function($injector) {
      expect(function() {
        $injector.invoke(['$test', function($test) {}]);
      }).toThrowMinErr('$injector', 'strictdi');
    });
  });


  test('should throw if magic annotation is used by factory', () => {
    angular.mock.module(function($provide) {
      $provide.factory({
        '$test': function($rootScope) { return function() {}; }
      });
    });
    angular.mock.inject(function($injector) {
      expect(function() {
        $injector.invoke(['$test', function(test) {}]);
      }).toThrowMinErr('$injector', 'strictdi');
    });
  });


  test('should throw if factory does not return a value', () => {
    angular.mock.module(function($provide) {
      $provide.factory('$test', function() {});
    });
    expect(function() {
      angular.mock.inject(function($test) {});
    }).toThrowMinErr('$injector', 'undef');
  });


  test('should always use provider as `this` when invoking a factory', () => {
    var called = false;

    function factoryFn() {
      called = true;
      expect(typeof this.$get).toBe('function');
      return this;
    }
    angular.mock.module(function($provide) {
      $provide.factory('$test', factoryFn);
    });
    angular.mock.inject(function($test) {});
    expect(called).toBe(true);
  });

  test('should set strictDi property to true on the injector instance', angular.mock.inject(function($injector) {
    expect($injector.strictDi).toBe(true);
  }));
});
