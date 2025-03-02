'use strict';

describe('injector.modules', function() {
    it('should expose the loaded module info on the instance injector', function() {
      angular.module('test1', ['test2']).info({ version: '1.1' });
      angular.module('test2', []).info({ version: '1.2' });

      angular.mock.module('test1');
      angular.mock.inject(['$injector', function($injector) {
        expect(Object.keys($injector.modules)).toEqual(['ng', 'ngLocale', 'ngMock', 'test1', 'test2']);
        expect($injector.modules['test1'].info()).toEqual({ version: '1.1' });
        expect($injector.modules['test2'].info()).toEqual({ version: '1.2' });
      }]);
    });

    it('should expose the loaded module info on the provider injector', function() {
      var providerInjector;
      angular.module('test1', ['test2']).info({ version: '1.1' });

      angular.module('test2', [])
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

describe('injector', function() {
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


  it('should return same instance from calling provider', function() {
    var instance = {};
    var original = instance;
    providers('instance', function() { return instance; });
    expect(injector.get('instance')).toEqual(instance);
    instance = 'deleted';
    expect(injector.get('instance')).toEqual(original);
  });


  it('should inject providers', function() {
    providers('a', function() {return 'Mi';});
    providers('b', function(mi) {return mi + 'sko';}, {$inject:['a']});
    expect(injector.get('b')).toEqual('Misko');
  });


  it('should check its modulesToLoad argument', function() {
    expect(function() { angular.injector('test'); })
        .toThrowMinErr('ng', 'areq');
  });


  it('should resolve dependency graph and instantiate all services just once', function() {
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


  it('should allow query names', function() {
    providers('abc', function() { return ''; });

    expect(injector.has('abc')).toBe(true);
    expect(injector.has('xyz')).toBe(false);
    expect(injector.has('$injector')).toBe(true);
  });


  it('should provide useful message if no provider', function() {
    expect(function() {
      injector.get('idontexist');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist');
  });


  it('should provide the caller name if given', function() {
    expect(function() {
      injector.get('idontexist', 'callerName');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist <- callerName');
  });


  it('should provide the caller name for controllers', function() {
    controllerProvider.register('myCtrl', function(idontexist) {});
    var $controller = injector.get('$controller');
    expect(function() {
      $controller('myCtrl', {$scope: {}});
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist <- myCtrl');
  });


  it('should not corrupt the cache when an object fails to get instantiated', function() {
    expect(function() {
      injector.get('idontexist');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist');

    expect(function() {
      injector.get('idontexist');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist');
  });


  it('should provide path to the missing provider', function() {
    providers('a', function(idontexist) {return 1;});
    providers('b', function(a) {return 2;});
    expect(function() {
      injector.get('b');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist <- a <- b');
  });


  it('should create a new $injector for the run phase', angular.mock.inject(function($injector) {
    expect($injector).not.toBe(providerInjector);
  }));


  describe('loadNewModules', function() {
    it('should be defined on $injector', function() {
      var injector = angular.injector([]);
      expect(injector.loadNewModules).toEqual(expect.any(Function));
    });

    it('should allow new modules to be added after injector creation', function() {
      angular.module('initial', []);
      var injector = angular.injector(['initial']);
      expect(injector.modules['initial']).toBeDefined();
      expect(injector.modules['lazy']).toBeUndefined();
      angular.module('lazy', []);
      injector.loadNewModules(['lazy']);
      expect(injector.modules['lazy']).toBeDefined();
    });

    it('should execute runBlocks of new modules', function() {
      var log = [];
      angular.module('initial', []).run(function() { log.push('initial'); });
      var injector = angular.injector(['initial']);
      log.push('created');

      angular.module('a', []).run(function() { log.push('a'); });
      injector.loadNewModules(['a']);
      expect(log).toEqual(['initial', 'created', 'a']);
    });

    it('should execute configBlocks of new modules', function() {
      var log = [];
      angular.module('initial', []).config(function() { log.push('initial'); });
      var injector = angular.injector(['initial']);
      log.push('created');

      angular.module('a', [], function() { log.push('config1'); }).config(function() { log.push('config2'); });
      injector.loadNewModules(['a']);
      expect(log).toEqual(['initial', 'created', 'config1', 'config2']);
    });

    it('should execute runBlocks and configBlocks in the correct order', function() {
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

    it('should load dependent modules', function() {
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

    it('should execute blocks of new modules in the correct order', function() {
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

    it('should not reload a module that is already loaded', function() {
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

    it('should be able to register a service from a new module', function() {
      var injector = angular.injector([]);
      angular.module('a', []).factory('aService', function() {
        return {sayHello() { return 'Hello'; }};
      });
      injector.loadNewModules(['a']);
      injector.invoke(function(aService) {
        expect(aService.sayHello()).toEqual('Hello');
      });
    });


    it('should be able to register a controller from a new module', function() {
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


    it('should be able to register a filter from a new module', function() {
      var injector = angular.injector(['ng']);
      angular.module('a', []).filter('aFilter', function() {
        return function(input) { return input + ' filtered'; };
      });
      injector.loadNewModules(['a']);
      injector.invoke(function(aFilterFilter) {
        expect(aFilterFilter('test')).toEqual('test filtered');
      });
    });


    it('should be able to register a directive from a new module', function() {
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

  it('should have a false strictDi property', angular.mock.inject(function($injector) {
    expect($injector.strictDi).toBe(false);
  }));


  describe('invoke', function() {
    var args;

    beforeEach(function() {
      args = null;
      providers('a', function() {return 1;});
      providers('b', function() {return 2;});
    });


    function Fn(a, b, c, d) {
      args = [this, a, b, c, d];
      return a + b + c + d;
    }


    it('should call function', function() {
      Fn.$inject = ['a', 'b', 'c', 'd'];
      injector.invoke(Fn, {name:'this'},  {c:3, d:4});
      expect(args).toEqual([{name:'this'}, 1, 2, 3, 4]);
    });


    it('should treat array as annotations', function() {
      injector.invoke(['a', 'b', 'c', 'd', Fn], {name:'this'}, {c:3, d:4});
      expect(args).toEqual([{name:'this'}, 1, 2, 3, 4]);
    });


    it('should invoke the passed-in fn with all of the dependencies as arguments', function() {
      providers('c', function() {return 3;});
      providers('d', function() {return 4;});
      expect(injector.invoke(['a', 'b', 'c', 'd', Fn])).toEqual(10);
    });


    it('should fail with errors if not function or array', function() {
      expect(function() {
        injector.invoke({});
      }).toThrowMinErr('ng', 'areq', 'Argument \'fn\' is not a function, got Object');
      expect(function() {
        injector.invoke(['a', 123], {});
      }).toThrowMinErr('ng', 'areq', 'Argument \'fn\' is not a function, got number');
    });
  });


  describe('annotation', function() {
    const annotate = angular.injector.$$annotate;

    it('should return $inject', function() {
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


    it('should create $inject', function() {
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


    it('should strip leading and trailing underscores from arg name during inference', function() {
      function beforeEachFn(_foo_) { /* foo = _foo_ */ }
      expect(annotate(beforeEachFn)).toEqual(['foo']);
    });

    it('should not strip service names with a single underscore', function() {
      function beforeEachFn(_) { /* _ = _ */ }
      expect(annotate(beforeEachFn)).toEqual(['_']);
    });

    it('should handle no arg functions', function() {
      function $f_n0() {}
      expect(annotate($f_n0)).toEqual([]);
      expect($f_n0.$inject).toEqual([]);
    });


    it('should handle no arg functions with spaces in the arguments list', function() {
      function fn() {}
      expect(annotate(fn)).toEqual([]);
      expect(fn.$inject).toEqual([]);
    });


    it('should handle args with both $ and _', function() {
      function $f_n0($a_) {}
      expect(annotate($f_n0)).toEqual(['$a_']);
      expect($f_n0.$inject).toEqual(['$a_']);
    });

    it('should handle functions with overridden toString', function() {
      function fn(a) {}
      fn.toString = function() { return 'fn'; };
      expect(annotate(fn)).toEqual(['a']);
      expect(fn.$inject).toEqual(['a']);
    });

    it('should throw on non function arg', function() {
      expect(function() {
        annotate({});
      }).toThrow();
    });


    describe('es6', function() {
      // The functions are generated using `eval` as just having the ES6 syntax can break some browsers.
      it('should be possible to annotate shorthand methods', function() {
        // eslint-disable-next-line no-eval
        expect(annotate(eval('({ fn(x) { return; } })').fn)).toEqual(['x']);
      });

      it('should create $inject for arrow functions', function() {
        // eslint-disable-next-line no-eval
        expect(annotate(eval('(a, b) => a'))).toEqual(['a', 'b']);
      });

      it('should create $inject for arrow functions with no parenthesis', function() {
        // eslint-disable-next-line no-eval
        expect(annotate(eval('a => a'))).toEqual(['a']);
      });

      it('should take args before first arrow', function() {
        // eslint-disable-next-line no-eval
        expect(annotate(eval('a => b => b'))).toEqual(['a']);
      });

      it('should be possible to instantiate ES6 classes', function() {
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
      ])('should detect ES6 classes regardless of whitespace/comments (%s)', function(classDefinition) {
        // eslint-disable-next-line no-eval
        var Clazz = eval('(' + classDefinition + ')');
        var instance = injector.invoke(Clazz);

        expect(instance).toEqual(expect.any(Clazz));
      });
    });
  });


  it('should have $injector', function() {
    var $injector = angular.injector();
    expect($injector.get('$injector')).toBe($injector);
  });


  it('should define module', function() {
    var log = '';
    angular.injector([function($provide) {
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


  describe('module', function() {
    it('should provide $injector even when no module is requested', function() {
      var $provide;

      var $injector = angular.injector([
        angular.extend(function(p) { $provide = p; }, {$inject: ['$provide']})
      ]);

      expect($injector.get('$injector')).toBe($injector);
    });


    it('should load multiple function modules and infer inject them', function() {
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


    it('should run symbolic modules', function() {
      angular.module('myModule', []).value('a', 'abc');
      var $injector = angular.injector(['myModule']);
      expect($injector.get('a')).toEqual('abc');
    });


    it('should error on invalid module name', function() {
      expect(function() {
        angular.injector(['IDontExist'], {});
      }).toThrowMinErr('$injector', 'modulerr',
        /\[\$injector:nomod] Module 'IDontExist' is not available! You either misspelled the module name or forgot to load it/);
    });


    it('should load dependant modules only once', function() {
      var log = '';
      angular.module('a', [], function() { log += 'a'; });
      angular.module('b', ['a'], function() { log += 'b'; });
      angular.module('c', ['a', 'b'], function() { log += 'c'; });
      angular.injector(['c', 'c']);
      expect(log).toEqual('abc');
    });

    it('should load different instances of dependent functions', function() {
      function  generateValueModule(name, value) {
        return function($provide) {
          $provide.value(name, value);
        };
      }
      var injector = angular.injector([generateValueModule('name1', 'value1'),
                                     generateValueModule('name2', 'value2')]);
      expect(injector.get('name2')).toBe('value2');
    });

    it('should load same instance of dependent function only once', function() {
      var count = 0;
      function valueModule($provide) {
        count++;
        $provide.value('name', 'value');
      }

      var injector = angular.injector([valueModule, valueModule]);
      expect(injector.get('name')).toBe('value');
      expect(count).toBe(1);
    });

    it('should execute runBlocks after injector creation', function() {
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

    it('should execute own config blocks after all own providers are invoked', function() {
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

    describe('$provide', function() {

      it('should throw an exception if we try to register a service called "hasOwnProperty"', function() {
        angular.injector([function($provide) {
          expect(function() {
            $provide.provider('hasOwnProperty', function() {  });
          }).toThrowMinErr('ng', 'badname');
        }]);
      });

      it('should throw an exception if we try to register a constant called "hasOwnProperty"', function() {
        angular.injector([function($provide) {
          expect(function() {
            $provide.constant('hasOwnProperty', {});
          }).toThrowMinErr('ng', 'badname');
        }]);
      });


      describe('constant', function() {
        it('should create configuration injectable constants', function() {
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


      describe('value', function() {
        it('should configure $provide values', function() {
          expect(angular.injector([function($provide) {
            $provide.value('value', 'abc');
          }]).get('value')).toEqual('abc');
        });


        it('should configure a set of values', function() {
          expect(angular.injector([function($provide) {
            $provide.value({value: Array});
          }]).get('value')).toEqual(Array);
        });
      });


      describe('factory', function() {
        it('should configure $provide factory function', function() {
          expect(angular.injector([function($provide) {
            $provide.factory('value', ngInternals.valueFn('abc'));
          }]).get('value')).toEqual('abc');
        });


        it('should configure a set of factories', function() {
          expect(angular.injector([function($provide) {
            $provide.factory({value: Array});
          }]).get('value')).toEqual([]);
        });
      });


      describe('service', function() {
        it('should register a class', function() {
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


        it('should register a set of classes', function() {
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


      describe('provider', function() {
        it('should configure $provide provider object', function() {
          expect(angular.injector([function($provide) {
            $provide.provider('value', {
              $get: ngInternals.valueFn('abc')
            });
          }]).get('value')).toEqual('abc');
        });


        it('should configure $provide provider type', function() {
          function Type() {}
          Type.prototype.$get = function() {
            expect(this instanceof Type).toBe(true);
            return 'abc';
          };
          expect(angular.injector([function($provide) {
            $provide.provider('value', Type);
          }]).get('value')).toEqual('abc');
        });


        it('should configure $provide using an array', function() {
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


        it('should configure a set of providers', function() {
          expect(angular.injector([function($provide) {
            $provide.provider({value: ngInternals.valueFn({$get:Array})});
          }]).get('value')).toEqual([]);
        });
      });


      describe('decorator', function() {
        var log;
        var injector;

        beforeEach(function() {
          log = [];
        });


        it('should be called with the original instance', function() {
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


        it('should allow multiple decorators to be applied to a service', function() {
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


        it('should decorate services with dependencies', function() {
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


        it('should allow for decorators to be injectable', function() {
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


        it('should allow for decorators to $injector', function() {
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


    describe('error handling', function() {
      it('should handle wrong argument type', function() {
        expect(function() {
          angular.injector([
            {}
          ], {});
        }).toThrowMinErr('$injector', 'modulerr', /Failed to instantiate module \{\} due to:\n.*\[ng:areq] Argument 'module' is not a function, got Object/);
      });


      it('should handle exceptions', function() {
        expect(function() {
          angular.injector([function() {
            throw new Error('MyError');
          }], {});
        }).toThrowMinErr('$injector', 'modulerr', /Failed to instantiate module .+ due to:\n.*MyError/);
      });


      it('should decorate the missing service error with module name', function() {
        angular.module('TestModule', [], function(xyzzy) {});
        expect(function() {
          angular.injector(['TestModule']);
        }).toThrowMinErr(
          '$injector', 'modulerr', /Failed to instantiate module TestModule due to:\n.*\[\$injector:unpr] Unknown provider: xyzzy/
        );
      });


      it('should decorate the missing service error with module function', function() {
        function myModule(xyzzy) {}
        expect(function() {
          angular.injector([myModule]);
        }).toThrowMinErr(
          '$injector', 'modulerr', /Failed to instantiate module function myModule\(xyzzy\) due to:\n.*\[\$injector:unpr] Unknown provider: xyzzy/
        );
      });


      it('should decorate the missing service error with module array function', function() {
        function myModule(xyzzy) {}
        expect(function() {
          angular.injector([['xyzzy', myModule]]);
        }).toThrowMinErr(
          '$injector', 'modulerr', /Failed to instantiate module function myModule\(xyzzy\) due to:\n.*\[\$injector:unpr] Unknown provider: xyzzy/
        );
      });


      it('should throw error when trying to inject oneself', function() {
        expect(function() {
          angular.injector([function($provide) {
            $provide.factory('service', function(service) {});
            return function(service) {};
          }]);
        }).toThrowMinErr('$injector', 'cdep', 'Circular dependency found: service <- service');
      });


      it('should throw error when trying to inject circular dependency', function() {
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


  describe('retrieval', function() {
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


    it('should retrieve by name', function() {
      var $injector = createInjectorWithValue('instance', instance);
      var retrievedInstance = $injector.get('instance');
      expect(retrievedInstance).toBe(instance);
    });


    it('should cache instance', function() {
      var $injector = createInjectorWithFactory('instance', function() { return new Instance(); });
      var instance = $injector.get('instance');
      expect($injector.get('instance')).toBe(instance);
      expect($injector.get('instance')).toBe(instance);
    });


    it('should call functions and infer arguments', function() {
      var $injector = createInjectorWithValue('instance', instance);
      expect($injector.invoke(function(instance) { return instance; })).toBe(instance);
    });

  });


  describe('method invoking', function() {
    var $injector;

    beforeEach(function() {
      $injector = angular.injector([function($provide) {
        $provide.value('book', 'moby');
        $provide.value('author', 'melville');
      }]);
    });


    it('should invoke method', function() {
      expect($injector.invoke(function(book, author) {
        return author + ':' + book;
      })).toEqual('melville:moby');
      expect($injector.invoke(function(book, author) {
        expect(this).toEqual($injector);
        return author + ':' + book;
      }, $injector)).toEqual('melville:moby');
    });


    it('should invoke method with locals', function() {
      expect($injector.invoke(function(book, author) {
        return author + ':' + book;
      })).toEqual('melville:moby');
      expect($injector.invoke(
        function(book, author, chapter) {
          expect(this).toEqual($injector);
          return author + ':' + book + '-' + chapter;
        }, $injector, {author:'m', chapter:'ch1'})).toEqual('m:moby-ch1');
    });


    it('should invoke method which is annotated', function() {
      expect($injector.invoke(angular.extend(function(b, a) {
        return a + ':' + b;
      }, {$inject:['book', 'author']}))).toEqual('melville:moby');
      expect($injector.invoke(angular.extend(function(b, a) {
        expect(this).toEqual($injector);
        return a + ':' + b;
      }, {$inject:['book', 'author']}), $injector)).toEqual('melville:moby');
    });


    it('should invoke method which is an array of annotation', function() {
      expect($injector.invoke(function(book, author) {
        return author + ':' + book;
      })).toEqual('melville:moby');
      expect($injector.invoke(function(book, author) {
        expect(this).toEqual($injector);
        return author + ':' + book;
      }, $injector)).toEqual('melville:moby');
    });


    it('should throw useful error on wrong argument type]', function() {
      expect(function() {
        $injector.invoke({});
      }).toThrowMinErr('ng', 'areq', 'Argument \'fn\' is not a function, got Object');
    });
  });


  describe('service instantiation', function() {
    var $injector;

    beforeEach(function() {
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


    it('should instantiate object and preserve constructor property and be instanceof', function() {
      var t = $injector.instantiate(Type);
      expect(t.book).toEqual('moby');
      expect(t.author).toEqual('melville');
      expect(t.title()).toEqual('melville: moby');
      expect(t instanceof Type).toBe(true);
    });


    it('should instantiate object and preserve constructor property and be instanceof ' +
        'with the array annotated type', function() {
      var t = $injector.instantiate(['book', 'author', Type]);
      expect(t.book).toEqual('moby');
      expect(t.author).toEqual('melville');
      expect(t.title()).toEqual('melville: moby');
      expect(t instanceof Type).toBe(true);
    });


    it('should allow constructor to return different object', function() {
      var obj = {};
      var Class = function() {
        return obj;
      };

      expect($injector.instantiate(Class)).toBe(obj);
    });


    it('should allow constructor to return a function', function() {
      var fn = function() {};
      var Class = function() {
        return fn;
      };

      expect($injector.instantiate(Class)).toBe(fn);
    });


    it('should handle constructor exception', function() {
      expect(function() {
        $injector.instantiate(function() { throw 'MyError'; });
      }).toThrow('MyError');
    });


    it('should return instance if constructor returns non-object value', function() {
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

  describe('protection modes', function() {
    it('should prevent provider lookup in app', function() {
      var  $injector = angular.injector([function($provide) {
        $provide.value('name', 'angular');
      }]);
      expect(function() {
        $injector.get('nameProvider');
      }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: nameProviderProvider <- nameProvider');
    });


    it('should prevent provider configuration in app', function() {
      var  $injector = angular.injector([]);
      expect(function() {
        $injector.get('$provide').value('a', 'b');
      }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: $provideProvider <- $provide');
    });


    it('should prevent instance lookup in module', function() {
      function instanceLookupInModule(name) { throw new Error('FAIL'); }
      expect(function() {
        angular.injector([function($provide) {
          $provide.value('name', 'angular');
        }, instanceLookupInModule]);
      }).toThrowMinErr('$injector', 'modulerr', '[$injector:unpr] Unknown provider: name');
    });
  });
});

describe('strict-di injector', function() {
  beforeEach(inject.strictDi(true));

  describe('with ngMock', function() {
    it('should not throw when calling mock.module() with "magic" annotations', function() {
      expect(function() {
        angular.mock.module(function($provide, $httpProvider, $compileProvider) {
          // Don't throw!
        });
      }).not.toThrow();
    });


    it('should not throw when calling mock.inject() with "magic" annotations', function() {
      expect(function() {
        angular.mock.inject(function($rootScope, $compile, $http) {
          // Don't throw!
        });
      }).not.toThrow();
    });
  });


  it('should throw if magic annotation is used by service', function() {
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


  it('should throw if magic annotation is used by provider', function() {
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


  it('should throw if magic annotation is used by factory', function() {
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


  it('should throw if factory does not return a value', function() {
    angular.mock.module(function($provide) {
      $provide.factory('$test', function() {});
    });
    expect(function() {
      angular.mock.inject(function($test) {});
    }).toThrowMinErr('$injector', 'undef');
  });


  it('should always use provider as `this` when invoking a factory', function() {
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

  it('should set strictDi property to true on the injector instance', angular.mock.inject(function($injector) {
    expect($injector.strictDi).toBe(true);
  }));
});
