'use strict';
 describe('Scope', () => {

  beforeEach(angular.mock.module(provideLog));


  describe('$root', () => {
    test('should point to itself', angular.mock.inject(function($rootScope) {
      expect($rootScope.$root).toEqual($rootScope);
      expect($rootScope.hasOwnProperty('$root')).toBeTruthy();
    }));


    test('should expose the constructor', angular.mock.inject(function($rootScope) {
      expect(Object.getPrototypeOf($rootScope)).toBe($rootScope.constructor.prototype);
    }));


    test('should not have $root on children, but should inherit', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new();
      expect(child.$root).toEqual($rootScope);
      expect(child.hasOwnProperty('$root')).toBeFalsy();
    }));

  });


  describe('$parent', () => {
    test('should point to itself in root', angular.mock.inject(function($rootScope) {
      expect($rootScope.$root).toEqual($rootScope);
    }));


    test('should point to parent', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new();
      expect($rootScope.$parent).toEqual(null);
      expect(child.$parent).toEqual($rootScope);
      expect(child.$new().$parent).toEqual(child);
    }));
  });


  describe('$id', () => {
    test('should have a unique id', angular.mock.inject(function($rootScope) {
      expect($rootScope.$id < $rootScope.$new().$id).toBeTruthy();
    }));
  });


  describe('this', () => {
    test('should evaluate \'this\' to be the scope', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new();
      expect($rootScope.$eval('this')).toEqual($rootScope);
      expect(child.$eval('this')).toEqual(child);
    }));

    test('\'this\' should not be recursive', angular.mock.inject(function($rootScope) {
      expect($rootScope.$eval('this.this')).toBeUndefined();
      expect($rootScope.$eval('$parent.this')).toBeUndefined();
    }));

    test('should not be able to overwrite the \'this\' keyword', angular.mock.inject(function($rootScope) {
      $rootScope['this'] = 123;
      expect($rootScope.$eval('this')).toEqual($rootScope);
    }));

    test('should be able to access a variable named \'this\'', angular.mock.inject(function($rootScope) {
      $rootScope['this'] = 42;
      expect($rootScope.$eval('this[\'this\']')).toBe(42);
    }));
  });


  describe('$new()', () => {
    test('should create a child scope', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new();
      $rootScope.a = 123;
      expect(child.a).toEqual(123);
    }));

    test('should create a non prototypically inherited child scope', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new(true);
      $rootScope.a = 123;
      expect(child.a).toBeUndefined();
      expect(child.$parent).toEqual($rootScope);
      expect(child.$new).toBe($rootScope.$new);
      expect(child.$root).toBe($rootScope);
    }));

    test('should attach the child scope to a specified parent', angular.mock.inject(function($rootScope) {
      var isolated = $rootScope.$new(true);
      var trans = $rootScope.$new(false, isolated);
      $rootScope.a = 123;
      expect(isolated.a).toBeUndefined();
      expect(trans.a).toEqual(123);
      expect(trans.$parent).toBe(isolated);
    }));
  });


  describe('$watch/$digest', () => {
    test('should watch and fire on simple property change', angular.mock.inject(function($rootScope) {
      var spy = jest.fn();
      $rootScope.$watch('name', spy);
      $rootScope.$digest();
      spy.mockClear();

      expect(spy).not.toHaveBeenCalled();
      $rootScope.$digest();
      expect(spy).not.toHaveBeenCalled();
      $rootScope.name = 'misko';
      $rootScope.$digest();
      expect(spy).toHaveBeenCalledWith('misko', undefined, $rootScope);
    }));


    test('should not expose the `inner working of watch', angular.mock.inject(function($rootScope) {
      function Getter() {
        expect(this).toBeUndefined();
        return 'foo';
      }
      function Listener() {
        expect(this).toBeUndefined();
      }
      $rootScope.$watch(Getter, Listener);
      $rootScope.$digest();
    }));


    test('should watch and fire on expression change', angular.mock.inject(function($rootScope) {
      var spy = jest.fn();
      $rootScope.$watch('name.first', spy);
      $rootScope.$digest();
      spy.mockClear();

      $rootScope.name = {};
      expect(spy).not.toHaveBeenCalled();
      $rootScope.$digest();
      expect(spy).not.toHaveBeenCalled();
      $rootScope.name.first = 'misko';
      $rootScope.$digest();
      expect(spy).toHaveBeenCalled();
    }));

    test('should decrement the watcherCount when destroying a child scope', angular.mock.inject(function($rootScope) {
      var child1 = $rootScope.$new();
      var child2 = $rootScope.$new();
      var grandChild1 = child1.$new();
      var grandChild2 = child2.$new();

      child1.$watch('a', function() {});
      child2.$watch('a', function() {});
      grandChild1.$watch('a', function() {});
      grandChild2.$watch('a', function() {});

      expect($rootScope.$$watchersCount).toBe(4);
      expect(child1.$$watchersCount).toBe(2);
      expect(child2.$$watchersCount).toBe(2);
      expect(grandChild1.$$watchersCount).toBe(1);
      expect(grandChild2.$$watchersCount).toBe(1);

      grandChild2.$destroy();
      expect(child2.$$watchersCount).toBe(1);
      expect($rootScope.$$watchersCount).toBe(3);
      child1.$destroy();
      expect($rootScope.$$watchersCount).toBe(1);
    }));

    test('should decrement the watcherCount when calling the remove function', angular.mock.inject(function($rootScope) {
      var child1 = $rootScope.$new();
      var child2 = $rootScope.$new();
      var grandChild1 = child1.$new();
      var grandChild2 = child2.$new();
      var remove1;
      var remove2;

      remove1 = child1.$watch('a', function() {});
      child2.$watch('a', function() {});
      grandChild1.$watch('a', function() {});
      remove2 = grandChild2.$watch('a', function() {});

      remove2();
      expect(grandChild2.$$watchersCount).toBe(0);
      expect(child2.$$watchersCount).toBe(1);
      expect($rootScope.$$watchersCount).toBe(3);
      remove1();
      expect(grandChild1.$$watchersCount).toBe(1);
      expect(child1.$$watchersCount).toBe(1);
      expect($rootScope.$$watchersCount).toBe(2);

      // Execute everything a second time to be sure that calling the remove function
      // several times, it only decrements the counter once
      remove2();
      expect(child2.$$watchersCount).toBe(1);
      expect($rootScope.$$watchersCount).toBe(2);
      remove1();
      expect(child1.$$watchersCount).toBe(1);
      expect($rootScope.$$watchersCount).toBe(2);
    }));

    describe('constants cleanup', () => {
      test('should remove $watch of constant literals after initial digest', angular.mock.inject(function($rootScope) {
        $rootScope.$watch('[]', function() {});
        $rootScope.$watch('{}', function() {});
        $rootScope.$watch('1', function() {});
        $rootScope.$watch('"foo"', function() {});
        expect($rootScope.$$watchers.length).not.toEqual(0);
        $rootScope.$digest();

        expect($rootScope.$$watchers.length).toEqual(0);
      }));

      test('should remove $watchCollection of constant literals after initial digest', angular.mock.inject(function($rootScope) {
        $rootScope.$watchCollection('[]', function() {});
        $rootScope.$watchCollection('{}', function() {});
        $rootScope.$watchCollection('1', function() {});
        $rootScope.$watchCollection('"foo"', function() {});
        expect($rootScope.$$watchers.length).not.toEqual(0);
        $rootScope.$digest();

        expect($rootScope.$$watchers.length).toEqual(0);
      }));

      test('should remove $watchGroup of constant literals after initial digest', angular.mock.inject(function($rootScope) {
        $rootScope.$watchGroup(['[]', '{}', '1', '"foo"'], function() {});
        expect($rootScope.$$watchers.length).not.toEqual(0);
        $rootScope.$digest();

        expect($rootScope.$$watchers.length).toEqual(0);
      }));

      test('should remove $watch of filtered constant literals after initial digest', angular.mock.inject(function($rootScope) {
        $rootScope.$watch('[1] | filter:"x"', function() {});
        $rootScope.$watch('1 | number:2', function() {});
        expect($rootScope.$$watchers.length).not.toEqual(0);
        $rootScope.$digest();

        expect($rootScope.$$watchers.length).toEqual(0);
      }));

      test('should remove $watchCollection of filtered constant literals after initial digest', angular.mock.inject(function($rootScope) {
        $rootScope.$watchCollection('[1] | filter:"x"', function() {});
        expect($rootScope.$$watchers.length).not.toEqual(0);
        $rootScope.$digest();

        expect($rootScope.$$watchers.length).toEqual(0);
      }));

      test('should remove $watchGroup of filtered constant literals after initial digest', angular.mock.inject(function($rootScope) {
        $rootScope.$watchGroup(['[1] | filter:"x"', '1 | number:2'], function() {});
        expect($rootScope.$$watchers.length).not.toEqual(0);
        $rootScope.$digest();

        expect($rootScope.$$watchers.length).toEqual(0);
      }));

      test('should remove $watch of constant expressions after initial digest', angular.mock.inject(function($rootScope) {
        $rootScope.$watch('1 + 1', function() {});
        $rootScope.$watch('"a" + "b"', function() {});
        $rootScope.$watch('"ab".length', function() {});
        $rootScope.$watch('[].length', function() {});
        $rootScope.$watch('(1 + 1) | number:2', function() {});
        expect($rootScope.$$watchers.length).not.toEqual(0);
        $rootScope.$digest();

        expect($rootScope.$$watchers.length).toEqual(0);
      }));
    });

    describe('onetime cleanup', () => {
      test('should clean up stable watches on the watch queue', angular.mock.inject(function($rootScope) {
        $rootScope.$watch('::foo', function() {});
        expect($rootScope.$$watchers.length).toEqual(1);

        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(1);

        $rootScope.foo = 'foo';
        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(0);
      }));

      test('should clean up stable watches from $watchCollection', angular.mock.inject(function($rootScope) {
        $rootScope.$watchCollection('::foo', function() {});
        expect($rootScope.$$watchers.length).toEqual(1);

        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(1);

        $rootScope.foo = [];
        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(0);
      }));

      test('should clean up stable watches from $watchCollection literals', angular.mock.inject(function($rootScope) {
        $rootScope.$watchCollection('::[foo, bar]', function() {});
        expect($rootScope.$$watchers.length).toEqual(1);

        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(1);

        $rootScope.foo = 1;
        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(1);

        $rootScope.foo = 2;
        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(1);

        $rootScope.bar = 3;
        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(0);
      }));

      test('should clean up stable watches from $watchGroup', angular.mock.inject(function($rootScope) {
        $rootScope.$watchGroup(['::foo', '::bar'], function() {});
        expect($rootScope.$$watchers.length).toEqual(2);

        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(2);

        $rootScope.foo = 'foo';
        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(1);

        $rootScope.bar = 'bar';
        $rootScope.$digest();
        expect($rootScope.$$watchers.length).toEqual(0);
      }));
    });

    test('should delegate exceptions', () => {
      angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      });
      angular.mock.inject(function($rootScope, $exceptionHandler, $log) {
        $rootScope.$watch('a', function() {throw new Error('abc');});
        $rootScope.a = 1;
        $rootScope.$digest();
        expect($exceptionHandler.errors[0].message).toEqual('abc');
        $log.assertEmpty();
      });
    });


    test('should fire watches in order of addition', angular.mock.inject(function($rootScope) {
      // this is not an external guarantee, just our own sanity
      var log = '';
      $rootScope.$watch('a', function() { log += 'a'; });
      $rootScope.$watch('b', function() { log += 'b'; });
      // constant expressions have slightly different handling,
      // let's ensure they are kept in the same list as others
      $rootScope.$watch('1', function() { log += '1'; });
      $rootScope.$watch('c', function() { log += 'c'; });
      $rootScope.$watch('2', function() { log += '2'; });
      $rootScope.a = $rootScope.b = $rootScope.c = 1;
      $rootScope.$digest();
      expect(log).toEqual('ab1c2');
    }));


    test('should call child $watchers in addition order', angular.mock.inject(function($rootScope) {
      // this is not an external guarantee, just our own sanity
      var log = '';
      var childA = $rootScope.$new();
      var childB = $rootScope.$new();
      var childC = $rootScope.$new();
      childA.$watch('a', function() { log += 'a'; });
      childB.$watch('b', function() { log += 'b'; });
      childC.$watch('c', function() { log += 'c'; });
      childA.a = childB.b = childC.c = 1;
      $rootScope.$digest();
      expect(log).toEqual('abc');
    }));


    test('should allow $digest on a child scope with and without a right sibling', angular.mock.inject(
        function($rootScope) {
          // tests a traversal edge case which we originally missed
          var log = '';

          var childA = $rootScope.$new();
          var childB = $rootScope.$new();

          $rootScope.$watch(function() { log += 'r'; });
          childA.$watch(function() { log += 'a'; });
          childB.$watch(function() { log += 'b'; });

          // init
          $rootScope.$digest();
          expect(log).toBe('rabrab');

          log = '';
          childA.$digest();
          expect(log).toBe('a');

          log = '';
          childB.$digest();
          expect(log).toBe('b');
        }));


    test('should repeat watch cycle while model changes are identified', angular.mock.inject(function($rootScope) {
      var log = '';
      $rootScope.$watch('c', function(v) {$rootScope.d = v; log += 'c'; });
      $rootScope.$watch('b', function(v) {$rootScope.c = v; log += 'b'; });
      $rootScope.$watch('a', function(v) {$rootScope.b = v; log += 'a'; });
      $rootScope.$digest();
      log = '';
      $rootScope.a = 1;
      $rootScope.$digest();
      expect($rootScope.b).toEqual(1);
      expect($rootScope.c).toEqual(1);
      expect($rootScope.d).toEqual(1);
      expect(log).toEqual('abc');
    }));


    test('should repeat watch cycle from the root element', angular.mock.inject(function($rootScope) {
      var log = '';
      var child = $rootScope.$new();
      $rootScope.$watch(function() { log += 'a'; });
      child.$watch(function() { log += 'b'; });
      $rootScope.$digest();
      expect(log).toEqual('abab');
    }));


    test('should prevent infinite recursion and print watcher expression',function() {
      angular.mock.module(function($rootScopeProvider) {
        $rootScopeProvider.digestTtl(100);
      });
      angular.mock.inject(function($rootScope) {
        $rootScope.$watch('a', function() {$rootScope.b++;});
        $rootScope.$watch('b', function() {$rootScope.a++;});
        $rootScope.a = $rootScope.b = 0;

        expect(function() {
          $rootScope.$digest();
        }).toThrowMinErr('$rootScope', 'infdig', '100 $digest() iterations reached. Aborting!\n' +
            'Watchers fired in the last 5 iterations: ' +
            '[[{"msg":"a","newVal":96,"oldVal":95},{"msg":"b","newVal":97,"oldVal":96}],' +
            '[{"msg":"a","newVal":97,"oldVal":96},{"msg":"b","newVal":98,"oldVal":97}],' +
            '[{"msg":"a","newVal":98,"oldVal":97},{"msg":"b","newVal":99,"oldVal":98}],' +
            '[{"msg":"a","newVal":99,"oldVal":98},{"msg":"b","newVal":100,"oldVal":99}],' +
            '[{"msg":"a","newVal":100,"oldVal":99},{"msg":"b","newVal":101,"oldVal":100}]]');

        expect($rootScope.$$phase).toBeNull();
      });
    });


    test('should prevent infinite recursion and print watcher function name or body',
        angular.mock.inject(function($rootScope) {
      $rootScope.$watch(function watcherA() {return $rootScope.a;}, function() {$rootScope.b++;});
      $rootScope.$watch(function() {return $rootScope.b;}, function() {$rootScope.a++;});
      $rootScope.a = $rootScope.b = 0;

      try {
        $rootScope.$digest();
        throw new Error('Should have thrown exception');
      } catch (e) {
        expect(e.message.match(/"fn: (watcherA|function)/g).length).toBe(10);
      }
    }));


    test('should prevent infinite loop when creating and resolving a promise in a watched expression', () => {
      angular.mock.module(function($rootScopeProvider) {
        $rootScopeProvider.digestTtl(10);
      });
      angular.mock.inject(function($rootScope, $q) {
        var d = $q.defer();

        d.resolve('Hello, world.');
        $rootScope.$watch(function() {
          var $d2 = $q.defer();
          $d2.resolve('Goodbye.');
          $d2.promise.then(function() { });
          return d.promise;
        }, function() { return 0; });

        expect(function() {
          $rootScope.$digest();
        }).toThrowMinErr('$rootScope', 'infdig', '10 $digest() iterations reached. Aborting!\n' +
                'Watchers fired in the last 5 iterations: []');

        expect($rootScope.$$phase).toBeNull();
      });
    });


    test('should not fire upon $watch registration on initial $digest', angular.mock.inject(function($rootScope) {
      var log = '';
      $rootScope.a = 1;
      $rootScope.$watch('a', function() { log += 'a'; });
      $rootScope.$watch('b', function() { log += 'b'; });
      $rootScope.$digest();
      log = '';
      $rootScope.$digest();
      expect(log).toEqual('');
    }));


    test('should watch objects', angular.mock.inject(function($rootScope) {
      var log = '';
      $rootScope.a = [];
      $rootScope.b = {};
      $rootScope.$watch('a', function(value) {
        log += '.';
        expect(value).toBe($rootScope.a);
      }, true);
      $rootScope.$watch('b', function(value) {
        log += '!';
        expect(value).toBe($rootScope.b);
      }, true);
      $rootScope.$digest();
      log = '';

      $rootScope.a.push({});
      $rootScope.b.name = '';

      $rootScope.$digest();
      expect(log).toEqual('.!');
    }));


    test('should watch functions', () => {
      angular.mock.module(provideLog);
      angular.mock.inject(function($rootScope, log) {
        $rootScope.fn = function() {return 'a';};
        $rootScope.$watch('fn', function(fn) {
          log(fn());
        });
        $rootScope.$digest();
        expect(log).toEqual('a');
        $rootScope.fn = function() {return 'b';};
        $rootScope.$digest();
        expect(log).toEqual('a; b');
      });
    });


    test('should prevent $digest recursion', angular.mock.inject(function($rootScope) {
      var callCount = 0;
      $rootScope.$watch('name', function() {
        expect(function() {
          $rootScope.$digest();
        }).toThrowMinErr('$rootScope', 'inprog', '$digest already in progress');
        callCount++;
      });
      $rootScope.name = 'a';
      $rootScope.$digest();
      expect(callCount).toEqual(1);
    }));


    test('should allow a watch to be added while in a digest', angular.mock.inject(function($rootScope) {
      var watch1 = jest.fn().mockName('watch1');
      var watch2 = jest.fn().mockName('watch2');
      $rootScope.$watch('foo', function() {
        $rootScope.$watch('foo', watch1);
        $rootScope.$watch('foo', watch2);
      });
      $rootScope.$apply('foo = true');
      expect(watch1).toHaveBeenCalled();
      expect(watch2).toHaveBeenCalled();
    }));


    test('should not skip watchers when adding new watchers during digest',
      angular.mock.inject(function($rootScope) {
        var log = [];

        var watchFn1 = function() { log.push(1); };
        var watchFn2 = function() { log.push(2); };
        var watchFn3 = function() { log.push(3); };
        var addWatcherOnce = function(newValue, oldValue) {
          if (newValue === oldValue) {
            $rootScope.$watch(watchFn3);
          }
        };

        $rootScope.$watch(watchFn1, addWatcherOnce);
        $rootScope.$watch(watchFn2);

        $rootScope.$digest();

        expect(log).toEqual([1, 2, 3, 1, 2, 3]);
      })
    );


    test('should not run the current watcher twice when removing a watcher during digest',
      angular.mock.inject(function($rootScope) {
        var log = [];
        var removeWatcher3;

        var watchFn3 = function() { log.push(3); };
        var watchFn2 = function() { log.push(2); };
        var watchFn1 = function() { log.push(1); };
        var removeWatcherOnce = function(newValue, oldValue) {
          if (newValue === oldValue) {
            removeWatcher3();
          }
        };

        $rootScope.$watch(watchFn1, removeWatcherOnce);
        $rootScope.$watch(watchFn2);
        removeWatcher3 = $rootScope.$watch(watchFn3);

        $rootScope.$digest();

        expect(log).toEqual([1, 2, 1, 2]);
      })
    );


    test('should not skip watchers when removing itself during digest',
      angular.mock.inject(function($rootScope) {
        var log = [];
        var removeWatcher1;

        var watchFn3 = function() { log.push(3); };
        var watchFn2 = function() { log.push(2); };
        var watchFn1 = function() { log.push(1); };
        var removeItself = function() {
          removeWatcher1();
        };

        removeWatcher1 = $rootScope.$watch(watchFn1, removeItself);
        $rootScope.$watch(watchFn2);
        $rootScope.$watch(watchFn3);

        $rootScope.$digest();

        expect(log).toEqual([1, 2, 3, 2, 3]);
      })
    );


    test('should not infinitely digest when current value is NaN', angular.mock.inject(function($rootScope) {
      $rootScope.$watch(function() { return NaN;});

      expect(function() {
        $rootScope.$digest();
      }).not.toThrow();
    }));


    test('should always call the watcher with newVal and oldVal equal on the first run',
        angular.mock.inject(function($rootScope) {
      var log = [];
      function logger(scope, newVal, oldVal) {
        var val = (newVal === oldVal || (newVal !== oldVal && oldVal !== newVal)) ? newVal : 'xxx';
        log.push(val);
      }

      $rootScope.$watch(function() { return NaN;}, logger);
      $rootScope.$watch(function() { return undefined;}, logger);
      $rootScope.$watch(function() { return '';}, logger);
      $rootScope.$watch(function() { return false;}, logger);
      $rootScope.$watch(function() { return {};}, logger, true);
      $rootScope.$watch(function() { return 23;}, logger);

      $rootScope.$digest();
      expect(isNaN(log.shift())).toBe(true); //toBe and toEqual don't work well with NaNs
      expect(log).toEqual([undefined, '', false, {}, 23]);
      log = [];
      $rootScope.$digest();
      expect(log).toEqual([]);
    }));


    describe('$watch deregistration', () => {

      test('should return a function that allows listeners to be deregistered', angular.mock.inject(
          function($rootScope) {
            var listener = jest.fn().mockName('watch listener');
            var listenerRemove;

            listenerRemove = $rootScope.$watch('foo', listener);
            $rootScope.$digest(); //init
            expect(listener).toHaveBeenCalled();
            expect(listenerRemove).toBeDefined();

            listener.mockClear();
            $rootScope.foo = 'bar';
            $rootScope.$digest(); //trigger
            expect(listener).toHaveBeenCalledTimes(1);

            listener.mockClear();
            $rootScope.foo = 'baz';
            listenerRemove();
            $rootScope.$digest(); //trigger
            expect(listener).not.toHaveBeenCalled();
          }));


      test('should allow a watch to be deregistered while in a digest', angular.mock.inject(function($rootScope) {
        var remove1;
        var remove2;
        $rootScope.$watch('remove', function() {
          remove1();
          remove2();
        });
        remove1 = $rootScope.$watch('thing', function() {});
        remove2 = $rootScope.$watch('thing', function() {});
        expect(function() {
          $rootScope.$apply('remove = true');
        }).not.toThrow();
      }));


      test('should not mess up the digest loop if deregistration happens during digest', angular.mock.inject(
          function($rootScope, log) {

        // we are testing this due to regression #5525 which is related to how the digest loops lastDirtyWatch
        // short-circuiting optimization works

        // scenario: watch1 deregistering watch1
        var scope = $rootScope.$new();
        var deregWatch1 = scope.$watch(log.fn('watch1'), function() { deregWatch1(); log('watchAction1'); });
        scope.$watch(log.fn('watch2'), log.fn('watchAction2'));
        scope.$watch(log.fn('watch3'), log.fn('watchAction3'));

        $rootScope.$digest();

        expect(log).toEqual(['watch1', 'watchAction1', 'watch2', 'watchAction2', 'watch3', 'watchAction3',
                             'watch2', 'watch3']);
        scope.$destroy();
        log.reset();


        // scenario: watch1 deregistering watch2
        scope = $rootScope.$new();
        scope.$watch(log.fn('watch1'), function() { deregWatch2(); log('watchAction1'); });
        var deregWatch2 = scope.$watch(log.fn('watch2'), log.fn('watchAction2'));
        scope.$watch(log.fn('watch3'), log.fn('watchAction3'));

        $rootScope.$digest();

        expect(log).toEqual(['watch1', 'watchAction1', 'watch3', 'watchAction3',
                             'watch1', 'watch3']);
        scope.$destroy();
        log.reset();


        // scenario: watch2 deregistering watch1
        scope = $rootScope.$new();
        deregWatch1 = scope.$watch(log.fn('watch1'), log.fn('watchAction1'));
        scope.$watch(log.fn('watch2'), function() { deregWatch1(); log('watchAction2'); });
        scope.$watch(log.fn('watch3'), log.fn('watchAction3'));

        $rootScope.$digest();

        expect(log).toEqual(['watch1', 'watchAction1', 'watch2', 'watchAction2', 'watch3', 'watchAction3',
                             'watch2', 'watch3']);
      }));
    });

    describe('$watchCollection', () => {
      describe('variable', () => {
        var log;
        var $rootScope;
        var deregister;

        beforeEach(angular.mock.inject(function(_$rootScope_, _log_) {
          $rootScope = _$rootScope_;
          log = _log_;
          deregister = $rootScope.$watchCollection('obj', function logger(newVal, oldVal) {
            var msg = {newVal: newVal, oldVal: oldVal};

            if (newVal === oldVal) {
              msg.identical = true;
            }

            log(msg);
          });
        }));


        test('should not trigger if nothing change', () => {
          $rootScope.$digest();
          expect(log).toEqual([{ newVal: undefined, oldVal: undefined, identical: true }]);
          log.reset();

          $rootScope.$digest();
          expect(log).toEqual([]);
        });


        test('should allow deregistration', () => {
          $rootScope.obj = [];
          $rootScope.$digest();
          expect(log.toArray().length).toBe(1);
          log.reset();

          $rootScope.obj.push('a');
          deregister();

          $rootScope.$digest();
          expect(log).toEqual([]);
        });


        describe('array', () => {

          test('should return oldCollection === newCollection only on the first listener call',
              angular.mock.inject(function($rootScope, log) {

            // first time should be identical
            $rootScope.obj = ['a', 'b'];
            $rootScope.$digest();
            expect(log).toEqual([{newVal: ['a', 'b'], oldVal: ['a', 'b'], identical: true}]);
            log.reset();

            // second time should be different
            $rootScope.obj[1] = 'c';
            $rootScope.$digest();
            expect(log).toEqual([{newVal: ['a', 'c'], oldVal: ['a', 'b']}]);
          }));


          test('should trigger when property changes into array', () => {
            $rootScope.obj = 'test';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: 'test', oldVal: 'test', identical: true}]);

            $rootScope.obj = [];
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: [], oldVal: 'test'}]);

            $rootScope.obj = {};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {}, oldVal: []}]);

            $rootScope.obj = [];
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: [], oldVal: {}}]);

            $rootScope.obj = undefined;
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: undefined, oldVal: []}]);
          });


          test('should not trigger change when object in collection changes', () => {
            $rootScope.obj = [{}];
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: [{}], oldVal: [{}], identical: true}]);

            $rootScope.obj[0].name = 'foo';
            $rootScope.$digest();
            expect(log).toEqual([]);
          });


          test('should watch array properties', () => {
            $rootScope.obj = [];
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: [], oldVal: [], identical: true}]);

            $rootScope.obj.push('a');
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: ['a'], oldVal: []}]);

            $rootScope.obj[0] = 'b';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: ['b'], oldVal: ['a']}]);

            $rootScope.obj.push([]);
            $rootScope.obj.push({});
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: ['b', [], {}], oldVal: ['b']}]);

            var temp = $rootScope.obj[1];
            $rootScope.obj[1] = $rootScope.obj[2];
            $rootScope.obj[2] = temp;
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: ['b', {}, []], oldVal: ['b', [], {}]}]);

            $rootScope.obj.shift();
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: [{}, []], oldVal: ['b', {}, []]}]);
          });

          test('should not infinitely digest when current value is NaN', () => {
            $rootScope.obj = [NaN];
            expect(function() {
              $rootScope.$digest();
            }).not.toThrow();
          });

          test('should watch array-like objects like arrays', () => {
            window.document.body.innerHTML = '<p>' +
                                              '<a name=\'x\'>a</a>' +
                                              '<a name=\'y\'>b</a>' +
                                            '</p>';

            $rootScope.obj = window.document.getElementsByTagName('a');
            $rootScope.$digest();

            var arrayLikelog = [];
            angular.forEach(log.empty()[0].newVal, function(element) {
              arrayLikelog.push(element.name);
            });
            expect(arrayLikelog).toEqual(['x', 'y']);
          });
        });


        describe('object', () => {

          test('should return oldCollection === newCollection only on the first listener call', () => {

            $rootScope.obj = {'a': 'b'};
            // first time should be identical
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'a': 'b'}, oldVal: {'a': 'b'}, identical: true}]);

            // second time not identical
            $rootScope.obj.a = 'c';
            $rootScope.$digest();
            expect(log).toEqual([{newVal: {'a': 'c'}, oldVal: {'a': 'b'}}]);
          });


          test('should trigger when property changes into object', () => {
            $rootScope.obj = 'test';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: 'test', oldVal: 'test', identical: true}]);

            $rootScope.obj = {};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {}, oldVal: 'test'}]);
          });


          test('should not trigger change when object in collection changes', () => {
            $rootScope.obj = {name: {}};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {name: {}}, oldVal: {name: {}}, identical: true}]);

            $rootScope.obj.name.bar = 'foo';
            $rootScope.$digest();
            expect(log.empty()).toEqual([]);
          });


          test('should watch object properties', () => {
            $rootScope.obj = {};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {}, oldVal: {}, identical: true}]);

            $rootScope.obj.a = 'A';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {a: 'A'}, oldVal: {}}]);

            $rootScope.obj.a = 'B';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {a: 'B'}, oldVal: {a: 'A'}}]);

            $rootScope.obj.b = [];
            $rootScope.obj.c = {};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {a: 'B', b: [], c: {}}, oldVal: {a: 'B'}}]);

            var temp = $rootScope.obj.a;
            $rootScope.obj.a = $rootScope.obj.b;
            $rootScope.obj.c = temp;
            $rootScope.$digest();
            expect(log.empty()).
                toEqual([{newVal: {a: [], b: [], c: 'B'}, oldVal: {a: 'B', b: [], c: {}}}]);

            delete $rootScope.obj.a;
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {b: [], c: 'B'}, oldVal: {a: [], b: [], c: 'B'}}]);
          });


          test('should not infinitely digest when current value is NaN', () => {
            $rootScope.obj = {a: NaN};
            expect(function() {
              $rootScope.$digest();
            }).not.toThrow();
          });


          test('should handle objects created using `Object.create(null)`', () => {
            $rootScope.obj = Object.create(null);
            $rootScope.obj.a = 'a';
            $rootScope.obj.b = 'b';
            $rootScope.$digest();
            expect(log.empty()[0].newVal).toEqual(angular.extend(Object.create(null), {a: 'a', b: 'b'}));

            delete $rootScope.obj.b;
            $rootScope.$digest();
            expect(log.empty()[0].newVal).toEqual(angular.extend(Object.create(null), {a: 'a'}));
          });
        });
      });

      describe('literal', () => {
        describe('array', () => {
          var log;
          var $rootScope;

          beforeEach(angular.mock.inject(function(_$rootScope_, _log_) {
            $rootScope = _$rootScope_;
            log = _log_;
            $rootScope.$watchCollection('[obj]', function logger(newVal, oldVal) {
              var msg = {newVal: newVal, oldVal: oldVal};

              if (newVal === oldVal) {
                msg.identical = true;
              }

              log(msg);
            });
          }));


          test('should return oldCollection === newCollection only on the first listener call', () => {

            // first time should be identical
            $rootScope.obj = 'a';
            $rootScope.$digest();
            expect(log).toEqual([{newVal: ['a'], oldVal: ['a'], identical: true}]);
            log.reset();

            // second time should be different
            $rootScope.obj = 'b';
            $rootScope.$digest();
            expect(log).toEqual([{newVal: ['b'], oldVal: ['a']}]);
          });


          test('should trigger when property changes into array', () => {
            $rootScope.obj = 'test';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: ['test'], oldVal: ['test'], identical: true}]);

            $rootScope.obj = [];
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: [[]], oldVal: ['test']}]);

            $rootScope.obj = {};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: [{}], oldVal: [[]]}]);

            $rootScope.obj = [];
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: [[]], oldVal: [{}]}]);

            $rootScope.obj = undefined;
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: [undefined], oldVal: [[]]}]);
          });


          test('should not trigger change when object in collection changes', () => {
            $rootScope.obj = {};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: [{}], oldVal: [{}], identical: true}]);

            $rootScope.obj.name = 'foo';
            $rootScope.$digest();
            expect(log).toEqual([]);
          });


          test('should not infinitely digest when current value is NaN', () => {
            $rootScope.obj = NaN;
            expect(function() {
              $rootScope.$digest();
            }).not.toThrow();
          });
        });


        describe('object', () => {
          var log;
          var $rootScope;

          beforeEach(angular.mock.inject(function(_$rootScope_, _log_) {
            $rootScope = _$rootScope_;
            log = _log_;
            $rootScope.$watchCollection('{a: obj}', function logger(newVal, oldVal) {
              var msg = {newVal: newVal, oldVal: oldVal};

              if (newVal === oldVal) {
                msg.identical = true;
              }

              log(msg);
            });
          }));

          test('should return oldCollection === newCollection only on the first listener call', () => {

            $rootScope.obj = 'b';
            // first time should be identical
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'a': 'b'}, oldVal: {'a': 'b'}, identical: true}]);

            // second time not identical
            $rootScope.obj = 'c';
            $rootScope.$digest();
            expect(log).toEqual([{newVal: {'a': 'c'}, oldVal: {'a': 'b'}}]);
          });


          test('should trigger when property changes into object', () => {
            $rootScope.obj = 'test';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'a': 'test'}, oldVal: {'a': 'test'}, identical: true}]);

            $rootScope.obj = {};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'a': {}}, oldVal: {'a': 'test'}}]);
          });


          test('should not trigger change when object in collection changes', () => {
            $rootScope.obj = {name: 'foo'};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'a': {name: 'foo'}}, oldVal: {'a': {name: 'foo'}}, identical: true}]);

            $rootScope.obj.name = 'bar';
            $rootScope.$digest();
            expect(log.empty()).toEqual([]);
          });


          test('should watch object properties', () => {
            $rootScope.obj = {};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'a': {}}, oldVal: {'a': {}}, identical: true}]);

            $rootScope.obj = 'A';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'a': 'A'}, oldVal: {'a': {}}}]);

            $rootScope.obj = 'B';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {a: 'B'}, oldVal: {a: 'A'}}]);

            $rootScope.obj = [];
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {a: []}, oldVal: {a: 'B'}}]);

            delete $rootScope.obj;
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {a: undefined}, oldVal: {a: []}}]);
          });


          test('should not infinitely digest when current value is NaN', () => {
            $rootScope.obj = NaN;
            expect(function() {
              $rootScope.$digest();
            }).not.toThrow();
          });
        });


        describe('object computed property', () => {
          var log;
          var $rootScope;

          beforeEach(angular.mock.inject(function(_$rootScope_, _log_) {
            $rootScope = _$rootScope_;
            log = _log_;
            $rootScope.$watchCollection('{[key]: obj}', function logger(newVal, oldVal) {
              var msg = {newVal: newVal, oldVal: oldVal};

              if (newVal === oldVal) {
                msg.identical = true;
              }

              log(msg);
            });
          }));


          test('should default to "undefined" key', () => {
            $rootScope.obj = 'test';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'undefined': 'test'}, oldVal: {'undefined': 'test'}, identical: true}]);
          });


          test('should trigger when key changes', () => {
            $rootScope.key = 'a';
            $rootScope.obj = 'test';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'a': 'test'}, oldVal: {'a': 'test'}, identical: true}]);

            $rootScope.key = 'b';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'b': 'test'}, oldVal: {'a': 'test'}}]);

            $rootScope.key = true;
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'true': 'test'}, oldVal: {'b': 'test'}}]);
          });


          test('should not trigger when key changes but stringified key does not', () => {
            $rootScope.key = 1;
            $rootScope.obj = 'test';
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'1': 'test'}, oldVal: {'1': 'test'}, identical: true}]);

            $rootScope.key = '1';
            $rootScope.$digest();
            expect(log.empty()).toEqual([]);

            $rootScope.key = true;
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'true': 'test'}, oldVal: {'1': 'test'}}]);

            $rootScope.key = 'true';
            $rootScope.$digest();
            expect(log.empty()).toEqual([]);

            $rootScope.key = {};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'[object Object]': 'test'}, oldVal: {'true': 'test'}}]);

            $rootScope.key = {};
            $rootScope.$digest();
            expect(log.empty()).toEqual([]);
          });


          test('should not trigger change when object in collection changes', () => {
            $rootScope.key = 'a';
            $rootScope.obj = {name: 'foo'};
            $rootScope.$digest();
            expect(log.empty()).toEqual([{newVal: {'a': {name: 'foo'}}, oldVal: {'a': {name: 'foo'}}, identical: true}]);

            $rootScope.obj.name = 'bar';
            $rootScope.$digest();
            expect(log.empty()).toEqual([]);
          });


          test('should not infinitely digest when key value is NaN', () => {
            $rootScope.key = NaN;
            $rootScope.obj = NaN;
            expect(function() {
              $rootScope.$digest();
            }).not.toThrow();
          });
        });
      });
    });


    describe('$suspend/$resume/$isSuspended', () => {
      test('should suspend watchers on scope', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn().mockName('watchSpy');
        $rootScope.$watch(watchSpy);
        $rootScope.$suspend();
        $rootScope.$digest();
        expect(watchSpy).not.toHaveBeenCalled();
      }));

      test('should resume watchers on scope', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn().mockName('watchSpy');
        $rootScope.$watch(watchSpy);
        $rootScope.$suspend();
        $rootScope.$resume();
        $rootScope.$digest();
        expect(watchSpy).toHaveBeenCalled();
      }));

      test('should suspend watchers on child scope', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn().mockName('watchSpy');
        var scope = $rootScope.$new(true);
        scope.$watch(watchSpy);
        $rootScope.$suspend();
        $rootScope.$digest();
        expect(watchSpy).not.toHaveBeenCalled();
      }));

      test('should resume watchers on child scope', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn().mockName('watchSpy');
        var scope = $rootScope.$new(true);
        scope.$watch(watchSpy);
        $rootScope.$suspend();
        $rootScope.$resume();
        $rootScope.$digest();
        expect(watchSpy).toHaveBeenCalled();
      }));

      test('should resume digesting immediately if `$resume` is called from an ancestor scope watch handler', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn().mockName('watchSpy');
        var scope = $rootScope.$new();

        // Setup a handler that will toggle the scope suspension
        $rootScope.$watch('a', function(a) { if (a) scope.$resume(); else scope.$suspend(); });

        // Spy on the scope watches being called
        scope.$watch(watchSpy);

        // Trigger a digest that should suspend the scope from within the watch handler
        $rootScope.$apply('a = false');
        // The scope is suspended before it gets to do a digest
        expect(watchSpy).not.toHaveBeenCalled();

        // Trigger a digest that should resume the scope from within the watch handler
        $rootScope.$apply('a = true');
        // The watch handler that resumes the scope is in the parent, so the resumed scope will digest immediately
        expect(watchSpy).toHaveBeenCalled();
      }));

      test('should resume digesting immediately if `$resume` is called from a non-ancestor scope watch handler', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn().mockName('watchSpy');
        var scope = $rootScope.$new();
        var sibling = $rootScope.$new();

        // Setup a handler that will toggle the scope suspension
        sibling.$watch('a', function(a) { if (a) scope.$resume(); else scope.$suspend(); });

        // Spy on the scope watches being called
        scope.$watch(watchSpy);

        // Trigger a digest that should suspend the scope from within the watch handler
        $rootScope.$apply('a = false');
        // The scope is suspended by the sibling handler after the scope has already digested
        expect(watchSpy).toHaveBeenCalled();
        watchSpy.mockClear();

        // Trigger a digest that should resume the scope from within the watch handler
        $rootScope.$apply('a = true');
        // The watch handler that resumes the scope marks the digest as dirty, so it will run an extra digest
        expect(watchSpy).toHaveBeenCalled();
      }));

      test('should not suspend watchers on parent or sibling scopes', angular.mock.inject(function($rootScope) {
        var watchSpyParent = jest.fn().mockName('watchSpyParent');
        var watchSpyChild = jest.fn().mockName('watchSpyChild');
        var watchSpySibling = jest.fn().mockName('watchSpySibling');

        var parent = $rootScope.$new();
        parent.$watch(watchSpyParent);
        var child = parent.$new();
        child.$watch(watchSpyChild);
        var sibling = parent.$new();
        sibling.$watch(watchSpySibling);

        child.$suspend();
        $rootScope.$digest();
        expect(watchSpyParent).toHaveBeenCalled();
        expect(watchSpyChild).not.toHaveBeenCalled();
        expect(watchSpySibling).toHaveBeenCalled();
      }));

      test('should return true from `$isSuspended()` when a scope is suspended', angular.mock.inject(function($rootScope) {
        $rootScope.$suspend();
        expect($rootScope.$isSuspended()).toBe(true);
        $rootScope.$resume();
        expect($rootScope.$isSuspended()).toBe(false);
      }));

      test('should return false from `$isSuspended()` for a non-suspended scope that has a suspended ancestor', angular.mock.inject(function($rootScope) {
        var childScope = $rootScope.$new();
        $rootScope.$suspend();
        expect(childScope.$isSuspended()).toBe(false);
        childScope.$suspend();
        expect(childScope.$isSuspended()).toBe(true);
        childScope.$resume();
        expect(childScope.$isSuspended()).toBe(false);
        $rootScope.$resume();
        expect(childScope.$isSuspended()).toBe(false);
      }));
    });


    describe('optimizations', () => {

      function setupWatches(scope, log) {
        scope.$watch(function() { log('w1'); return scope.w1; }, log.fn('w1action'));
        scope.$watch(function() { log('w2'); return scope.w2; }, log.fn('w2action'));
        scope.$watch(function() { log('w3'); return scope.w3; }, log.fn('w3action'));
        scope.$digest();
        log.reset();
      }


      test('should check watches only once during an empty digest', angular.mock.inject(function(log, $rootScope) {
        setupWatches($rootScope, log);
        $rootScope.$digest();
        expect(log).toEqual(['w1', 'w2', 'w3']);
      }));


      test('should quit digest early after we check the last watch that was previously dirty',
          angular.mock.inject(function(log, $rootScope) {
        setupWatches($rootScope, log);
        $rootScope.w1 = 'x';
        $rootScope.$digest();
        expect(log).toEqual(['w1', 'w1action', 'w2', 'w3', 'w1']);
      }));


      test('should not quit digest early if a new watch was added from an existing watch action',
          angular.mock.inject(function(log, $rootScope) {
        setupWatches($rootScope, log);
        $rootScope.$watch(log.fn('w4'), function() {
          log('w4action');
          $rootScope.$watch(log.fn('w5'), log.fn('w5action'));
        });
        $rootScope.$digest();
        expect(log).toEqual(['w1', 'w2', 'w3', 'w4', 'w4action', 'w5', 'w5action',
                             'w1', 'w2', 'w3', 'w4', 'w5']);
      }));


      test('should not quit digest early if an evalAsync task was scheduled from a watch action',
          angular.mock.inject(function(log, $rootScope) {
        setupWatches($rootScope, log);
        $rootScope.$watch(log.fn('w4'), function() {
          log('w4action');
          $rootScope.$evalAsync(function() {
            log('evalAsync');
          });
        });
        $rootScope.$digest();
        expect(log).toEqual(['w1', 'w2', 'w3', 'w4', 'w4action', 'evalAsync',
                             'w1', 'w2', 'w3', 'w4']);
      }));


      test('should quit digest early but not too early when various watches fire', angular.mock.inject(function(log, $rootScope) {
        setupWatches($rootScope, log);
        $rootScope.$watch(function() { log('w4'); return $rootScope.w4; }, function(newVal) {
          log('w4action');
          $rootScope.w2 = newVal;
        });

        $rootScope.$digest();
        log.reset();

        $rootScope.w1 = 'x';
        $rootScope.w4 = 'x';
        $rootScope.$digest();
        expect(log).toEqual(['w1', 'w1action', 'w2', 'w3', 'w4', 'w4action',
                             'w1', 'w2', 'w2action', 'w3', 'w4',
                             'w1', 'w2']);
      }));
    });
  });

  describe('$watchGroup', () => {
    var scope;
    var log;

    beforeEach(angular.mock.inject(function($rootScope, _log_) {
      scope = $rootScope.$new();
      log = _log_;
    }));


    test('should pass same group instance on first call (no expressions)', () => {
      var newValues;
      var oldValues;
      scope.$watchGroup([], function(n, o) {
        newValues = n;
        oldValues = o;
      });

      scope.$apply();
      expect(newValues).toBe(oldValues);
    });


    test('should pass same group instance on first call (single expression)', () => {
      var newValues;
      var oldValues;
      scope.$watchGroup(['a'], function(n, o) {
        newValues = n;
        oldValues = o;
      });

      scope.$apply();
      expect(newValues).toBe(oldValues);

      scope.$apply('a = 1');
      expect(newValues).not.toBe(oldValues);
    });

    test('should pass same group instance on first call (multiple expressions)', () => {
      var newValues;
      var oldValues;
      scope.$watchGroup(['a', 'b'], function(n, o) {
        newValues = n;
        oldValues = o;
      });

      scope.$apply();
      expect(newValues).toBe(oldValues);

      scope.$apply('a = 1');
      expect(newValues).not.toBe(oldValues);
    });

    test('should detect a change to any one expression in the group', () => {
      scope.$watchGroup(['a', 'b'], function(values, oldValues, s) {
        expect(s).toBe(scope);
        log(oldValues + ' >>> ' + values);
      });

      scope.a = 'foo';
      scope.b = 'bar';
      scope.$digest();
      expect(log).toEqual('foo,bar >>> foo,bar');

      log.reset();
      scope.$digest();
      expect(log).toEqual('');

      scope.a = 'a';
      scope.$digest();
      expect(log).toEqual('foo,bar >>> a,bar');

      log.reset();
      scope.a = 'A';
      scope.b = 'B';
      scope.$digest();
      expect(log).toEqual('a,bar >>> A,B');
    });


    test('should work for a group with just a single expression', () => {
      scope.$watchGroup(['a'], function(values, oldValues, s) {
        expect(s).toBe(scope);
        log(oldValues + ' >>> ' + values);
      });

      scope.a = 'foo';
      scope.$digest();
      expect(log).toEqual('foo >>> foo');

      log.reset();
      scope.$digest();
      expect(log).toEqual('');

      scope.a = 'bar';
      scope.$digest();
      expect(log).toEqual('foo >>> bar');
    });


    test('should call the listener once when the array of watchExpressions is empty', () => {
      scope.$watchGroup([], function(values, oldValues) {
        log(oldValues + ' >>> ' + values);
      });

      expect(log).toEqual('');
      scope.$digest();
      expect(log).toEqual(' >>> ');

      log.reset();
      scope.$digest();
      expect(log).toEqual('');
    });


    test('should not call watch action fn when watchGroup was deregistered', () => {
      var deregisterMany = scope.$watchGroup(['a', 'b'], function(values, oldValues) {
        log(oldValues + ' >>> ' + values);
      });

      var deregisterOne = scope.$watchGroup(['a'], function(values, oldValues) {
        log(oldValues + ' >>> ' + values);
      });

      var deregisterNone = scope.$watchGroup([], function(values, oldValues) {
        log(oldValues + ' >>> ' + values);
      });

      deregisterMany();
      deregisterOne();
      deregisterNone();
      scope.a = 'xxx';
      scope.b = 'yyy';
      scope.$digest();
      expect(log).toEqual('');
    });

    test('should have each individual old value equal to new values of previous watcher invocation', () => {
      var newValues;
      var oldValues;
      scope.$watchGroup(['a', 'b'], function(n, o) {
        newValues = n.slice();
        oldValues = o.slice();
      });

      scope.$apply(); //skip the initial invocation

      scope.$apply('a = 1');
      expect(newValues).toEqual([1, undefined]);
      expect(oldValues).toEqual([undefined, undefined]);

      scope.$apply('a = 2');
      expect(newValues).toEqual([2, undefined]);
      expect(oldValues).toEqual([1, undefined]);

      scope.$apply('b = 3');
      expect(newValues).toEqual([2, 3]);
      expect(oldValues).toEqual([2, undefined]);

      scope.$apply('a = b = 4');
      expect(newValues).toEqual([4, 4]);
      expect(oldValues).toEqual([2, 3]);

      scope.$apply('a = 5');
      expect(newValues).toEqual([5, 4]);
      expect(oldValues).toEqual([4, 4]);

      scope.$apply('b = 6');
      expect(newValues).toEqual([5, 6]);
      expect(oldValues).toEqual([5, 4]);
    });


    test('should have each individual old value equal to new values of previous watcher invocation, with modifications from other watchers', () => {
      scope.$watch('a', function() { scope.b++; });
      scope.$watch('b', function() { scope.c++; });

      var newValues;
      var oldValues;
      scope.$watchGroup(['a', 'b', 'c'], function(n, o) {
        newValues = n.slice();
        oldValues = o.slice();
      });

      scope.$apply(); //skip the initial invocation

      scope.$apply('a = b = c = 1');
      expect(newValues).toEqual([1, 2, 2]);
      expect(oldValues).toEqual([undefined, NaN, NaN]);

      scope.$apply('a = 3');
      expect(newValues).toEqual([3, 3, 3]);
      expect(oldValues).toEqual([1, 2, 2]);

      scope.$apply('b = 5');
      expect(newValues).toEqual([3, 5, 4]);
      expect(oldValues).toEqual([3, 3, 3]);

      scope.$apply('c = 7');
      expect(newValues).toEqual([3, 5, 7]);
      expect(oldValues).toEqual([3, 5, 4]);
    });

    test('should remove all watchers once one-time/constant bindings are stable', () => {
      //empty
      scope.$watchGroup([], angular.noop);
      //single one-time
      scope.$watchGroup(['::a'], angular.noop);
      //multi one-time
      scope.$watchGroup(['::a', '::b'], angular.noop);
      //single constant
      scope.$watchGroup(['1'], angular.noop);
      //multi constant
      scope.$watchGroup(['1', '2'], angular.noop);
      //multi one-time/constant
      scope.$watchGroup(['::a', '1'], angular.noop);

      expect(scope.$$watchersCount).not.toBe(0);
      scope.$apply('a = b = 1');
      expect(scope.$$watchersCount).toBe(0);
    });

    test('should maintain correct new/old values with one time bindings', () => {
      var newValues;
      var oldValues;
      scope.$watchGroup(['a', '::b', 'b', '4'], function(n, o) {
        newValues = n.slice();
        oldValues = o.slice();
      });

      scope.$apply();
      expect(newValues).toEqual(oldValues);
      expect(oldValues).toEqual([undefined, undefined, undefined, 4]);

      scope.$apply('a = 1');
      expect(newValues).toEqual([1, undefined, undefined, 4]);
      expect(oldValues).toEqual([undefined, undefined, undefined, 4]);

      scope.$apply('b = 2');
      expect(newValues).toEqual([1, 2, 2, 4]);
      expect(oldValues).toEqual([1, undefined, undefined, 4]);

      scope.$apply('b = 3');
      expect(newValues).toEqual([1, 2, 3, 4]);
      expect(oldValues).toEqual([1, 2, 2, 4]);

      scope.$apply('b = 4');
      expect(newValues).toEqual([1, 2, 4, 4]);
      expect(oldValues).toEqual([1, 2, 3, 4]);
    });
  });

  describe('$watchGroup with logging $exceptionHandler', () => {
    test('should maintain correct new/old values even when listener throws', () => {
      angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      });

      angular.mock.inject(function($rootScope, $exceptionHandler) {
        var newValues;
        var oldValues;
        $rootScope.$watchGroup(['a', '::b', 'b', '4'], function(n, o) {
          newValues = n.slice();
          oldValues = o.slice();
          throw 'test';
        });

        $rootScope.$apply();
        expect(newValues).toEqual(oldValues);
        expect(oldValues).toEqual([undefined, undefined, undefined, 4]);
        expect($exceptionHandler.errors.length).toBe(1);

        $rootScope.$apply('a = 1');
        expect(newValues).toEqual([1, undefined, undefined, 4]);
        expect(oldValues).toEqual([undefined, undefined, undefined, 4]);
        expect($exceptionHandler.errors.length).toBe(2);

        $rootScope.$apply('b = 2');
        expect(newValues).toEqual([1, 2, 2, 4]);
        expect(oldValues).toEqual([1, undefined, undefined, 4]);
        expect($exceptionHandler.errors.length).toBe(3);

        $rootScope.$apply('b = 3');
        expect(newValues).toEqual([1, 2, 3, 4]);
        expect(oldValues).toEqual([1, 2, 2, 4]);
        expect($exceptionHandler.errors.length).toBe(4);

        $rootScope.$apply('b = 4');
        expect(newValues).toEqual([1, 2, 4, 4]);
        expect(oldValues).toEqual([1, 2, 3, 4]);
        expect($exceptionHandler.errors.length).toBe(5);
      });
    });
  });

  describe('$destroy', () => {
    var first = null;
    var middle = null;
    var last = null;
    var log = null;

    beforeEach(angular.mock.inject(function($rootScope) {
      log = '';

      first = $rootScope.$new();
      middle = $rootScope.$new();
      last = $rootScope.$new();

      first.$watch(function() { log += '1';});
      middle.$watch(function() { log += '2';});
      last.$watch(function() { log += '3';});

      $rootScope.$digest();
      log = '';
    }));


    test('should broadcast $destroy on rootScope', angular.mock.inject(function($rootScope) {
      var spy = jest.fn().mockName('$destroy handler');
      $rootScope.$on('$destroy', spy);
      $rootScope.$destroy();
      expect(spy).toHaveBeenCalled();
      expect($rootScope.$$destroyed).toBe(true);
    }));


    test('should remove all listeners after $destroy of rootScope', angular.mock.inject(function($rootScope) {
      var spy = jest.fn().mockName('$destroy handler');
      $rootScope.$on('dummy', spy);
      $rootScope.$destroy();
      $rootScope.$broadcast('dummy');
      expect(spy).not.toHaveBeenCalled();
    }));


    test('should remove all watchers after $destroy of rootScope', angular.mock.inject(function($rootScope) {
      var spy = jest.fn().mockName('$watch spy');
      var digest = $rootScope.$digest;
      $rootScope.$watch(spy);
      $rootScope.$destroy();
      digest.call($rootScope);
      expect(spy).not.toHaveBeenCalled();
    }));


    test('should call $browser.$$applicationDestroyed when destroying rootScope', angular.mock.inject(function($rootScope, $browser) {
      jest.spyOn($browser, '$$applicationDestroyed').mockImplementation(() => {});
      $rootScope.$destroy();
      expect($browser.$$applicationDestroyed).toHaveBeenCalledTimes(1);
    }));


    test('should remove first', angular.mock.inject(function($rootScope) {
      first.$destroy();
      $rootScope.$digest();
      expect(log).toEqual('23');
    }));


    test('should remove middle', angular.mock.inject(function($rootScope) {
      middle.$destroy();
      $rootScope.$digest();
      expect(log).toEqual('13');
    }));


    test('should remove last', angular.mock.inject(function($rootScope) {
      last.$destroy();
      $rootScope.$digest();
      expect(log).toEqual('12');
    }));


    test('should broadcast the $destroy event', angular.mock.inject(function($rootScope, log) {
      first.$on('$destroy', log.fn('first'));
      first.$new().$on('$destroy', log.fn('first-child'));

      first.$destroy();
      expect(log).toEqual('first; first-child');
    }));


    test('should $destroy a scope only once and ignore any further destroy calls',
        angular.mock.inject(function($rootScope) {
      $rootScope.$digest();
      expect(log).toBe('123');

      first.$destroy();

      // once a scope is destroyed apply should not do anything any more
      first.$apply();
      expect(log).toBe('123');

      first.$destroy();
      first.$destroy();
      first.$apply();
      expect(log).toBe('123');
    }));

    test('should broadcast the $destroy only once', angular.mock.inject(function($rootScope, log) {
      var isolateScope = first.$new(true);
      isolateScope.$on('$destroy', log.fn('event'));
      first.$destroy();
      isolateScope.$destroy();
      expect(log).toEqual('event');
    }));

    test('should decrement ancestor $$listenerCount entries', angular.mock.inject(function($rootScope) {
      var EVENT = 'fooEvent';
      var spy = jest.fn().mockName('listener');
      var firstSecond = first.$new();

      firstSecond.$on(EVENT, spy);
      firstSecond.$on(EVENT, spy);
      middle.$on(EVENT, spy);

      expect($rootScope.$$listenerCount[EVENT]).toBe(3);
      expect(first.$$listenerCount[EVENT]).toBe(2);

      firstSecond.$destroy();

      expect($rootScope.$$listenerCount[EVENT]).toBe(1);
      expect(first.$$listenerCount[EVENT]).toBeUndefined();

      $rootScope.$broadcast(EVENT);
      expect(spy).toHaveBeenCalledTimes(1);
    }));


    test('should do nothing when a child event listener is registered after parent\'s destruction',
        angular.mock.inject(function($rootScope) {
          var parent = $rootScope.$new();
          var child = parent.$new();

          parent.$destroy();
          var fn = child.$on('someEvent', function() {});
          expect(fn).toBe(angular.noop);
        }));


    test('should do nothing when a child watch is registered after parent\'s destruction',
        angular.mock.inject(function($rootScope) {
          var parent = $rootScope.$new();
          var child = parent.$new();

          parent.$destroy();
          var fn = child.$watch('somePath', function() {});
          expect(fn).toBe(angular.noop);
        }));

    test('should do nothing when $apply()ing after parent\'s destruction', angular.mock.inject(function($rootScope) {
      var parent = $rootScope.$new();
      var child = parent.$new();

      parent.$destroy();

      var called = false;
      function applyFunc() { called = true; }
      child.$apply(applyFunc);

      expect(called).toBe(false);
    }));

    test('should do nothing when $evalAsync()ing after parent\'s destruction', angular.mock.inject(function($rootScope, $timeout) {
      var parent = $rootScope.$new();
      var child = parent.$new();

      parent.$destroy();

      var called = false;
      function applyFunc() { called = true; }
      child.$evalAsync(applyFunc);

      $timeout.verifyNoPendingTasks();
      expect(called).toBe(false);
    }));


    test('should preserve all (own and inherited) model properties on a destroyed scope',
        angular.mock.inject(function($rootScope) {
          // This test simulates an async task (xhr response) interacting with the scope after the scope
          // was destroyed. Since we can't abort the request, we should ensure that the task doesn't
          // throw NPEs because the scope was cleaned up during destruction.

          var parent = $rootScope.$new();

          var child = parent.$new();

          parent.parentModel = 'parent';
          child.childModel = 'child';

          child.$destroy();

          expect(child.parentModel).toBe('parent');
          expect(child.childModel).toBe('child');
        }));
  });


  describe('$eval', () => {
    test('should eval an expression', angular.mock.inject(function($rootScope) {
      expect($rootScope.$eval('a=1')).toEqual(1);
      expect($rootScope.a).toEqual(1);

      $rootScope.$eval(function(self) {self.b = 2;});
      expect($rootScope.b).toEqual(2);
    }));


    test('should allow passing locals to the expression', angular.mock.inject(function($rootScope) {
      expect($rootScope.$eval('a+1', {a: 2})).toBe(3);

      $rootScope.$eval(function(scope, locals) {
        scope.c = locals.b + 4;
      }, {b: 3});
      expect($rootScope.c).toBe(7);
    }));
  });


  describe('$evalAsync', () => {

    test('should run callback before $watch', angular.mock.inject(function($rootScope) {
      var log = '';
      var child = $rootScope.$new();
      $rootScope.$evalAsync(function(scope) { log += 'parent.async;'; });
      $rootScope.$watch('value', function() { log += 'parent.$digest;'; });
      child.$evalAsync(function(scope) { log += 'child.async;'; });
      child.$watch('value', function() { log += 'child.$digest;'; });
      $rootScope.$digest();
      expect(log).toEqual('parent.async;child.async;parent.$digest;child.$digest;');
    }));

    test('should not run another digest for an $$postDigest call', angular.mock.inject(function($rootScope) {
      var internalWatchCount = 0;
      var externalWatchCount = 0;

      $rootScope.internalCount = 0;
      $rootScope.externalCount = 0;

      $rootScope.$evalAsync(function(scope) {
        $rootScope.internalCount++;
      });

      $rootScope.$$postDigest(function(scope) {
        $rootScope.externalCount++;
      });

      $rootScope.$watch('internalCount', function(value) {
        internalWatchCount = value;
      });
      $rootScope.$watch('externalCount', function(value) {
        externalWatchCount = value;
      });

      $rootScope.$digest();

      expect(internalWatchCount).toEqual(1);
      expect(externalWatchCount).toEqual(0);
    }));

    test('should cause a $digest rerun', angular.mock.inject(function($rootScope) {
      $rootScope.log = '';
      $rootScope.value = 0;
      $rootScope.$watch('value', function() {
        $rootScope.log = $rootScope.log + '.';
      });
      $rootScope.$watch('init', function() {
        $rootScope.$evalAsync('value = 123; log = log + "=" ');
        expect($rootScope.value).toEqual(0);
      });
      $rootScope.$digest();
      expect($rootScope.log).toEqual('.=.');
    }));

    test('should run async in the same order as added', angular.mock.inject(function($rootScope) {
      $rootScope.log = '';
      $rootScope.$evalAsync('log = log + 1');
      $rootScope.$evalAsync('log = log + 2');
      $rootScope.$digest();
      expect($rootScope.log).toBe('12');
    }));

    test('should allow passing locals to the expression', angular.mock.inject(function($rootScope) {
      $rootScope.log = '';
      $rootScope.$evalAsync('log = log + a', {a: 1});
      $rootScope.$digest();
      expect($rootScope.log).toBe('1');
    }));

    test('should run async expressions in their proper context', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new();
      $rootScope.ctx = 'root context';
      $rootScope.log = '';
      child.ctx = 'child context';
      child.log = '';
      child.$evalAsync('log=ctx');
      $rootScope.$digest();
      expect($rootScope.log).toBe('');
      expect(child.log).toBe('child context');
    }));

    test('should operate only with a single queue across all child and isolate scopes', angular.mock.inject(function($rootScope, $parse) {
      var childScope = $rootScope.$new();
      var isolateScope = $rootScope.$new(true);

      $rootScope.$evalAsync('rootExpression');
      childScope.$evalAsync('childExpression');
      isolateScope.$evalAsync('isolateExpression');

      expect(childScope.$$asyncQueue).toBe($rootScope.$$asyncQueue);
      expect(isolateScope.$$asyncQueue).toBeUndefined();
      expect($rootScope.$$asyncQueue).toEqual([
        {scope: $rootScope, fn: $parse('rootExpression'), locals: undefined},
        {scope: childScope, fn: $parse('childExpression'), locals: undefined},
        {scope: isolateScope, fn: $parse('isolateExpression'), locals: undefined}
      ]);
    }));


    describe('auto-flushing when queueing outside of an $apply', () => {
      var log;
      var $rootScope;
      var $browser;

      beforeEach(angular.mock.inject(function(_log_, _$rootScope_, _$browser_) {
        log = _log_;
        $rootScope = _$rootScope_;
        $browser = _$browser_;
      }));


      test('should auto-flush the queue asynchronously and trigger digest', () => {
        $rootScope.$evalAsync(log.fn('eval-ed!'));
        $rootScope.$watch(log.fn('digesting'));
        expect(log).toEqual([]);

        $browser.defer.flush(0);

        expect(log).toEqual(['eval-ed!', 'digesting', 'digesting']);
      });


      test('should not trigger digest asynchronously if the queue is empty in the next tick', () => {
        $rootScope.$evalAsync(log.fn('eval-ed!'));
        $rootScope.$watch(log.fn('digesting'));
        expect(log).toEqual([]);

        $rootScope.$digest();

        expect(log).toEqual(['eval-ed!', 'digesting', 'digesting']);
        log.reset();

        $browser.defer.flush(0);

        expect(log).toEqual([]);
      });


      test('should not schedule more than one auto-flush task', () => {
        $rootScope.$evalAsync(log.fn('eval-ed 1!'));
        $rootScope.$evalAsync(log.fn('eval-ed 2!'));

        $browser.defer.flush(0);
        expect(log).toEqual(['eval-ed 1!', 'eval-ed 2!']);

        $browser.defer.flush(100000);
        expect(log).toEqual(['eval-ed 1!', 'eval-ed 2!']);
      });

      test('should not have execution affected by an explicit $digest call', () => {
        var scope1 = $rootScope.$new();
        var scope2 = $rootScope.$new();

        scope1.$watch('value', function(value) {
          scope1.result = value;
        });

        scope1.$evalAsync(function() {
          scope1.value = 'bar';
        });

        scope2.$digest();

        $browser.defer.flush(0);

        expect(scope1.result).toBe('bar');
      });
    });

    test('should not pass anything as `this` to scheduled functions', angular.mock.inject(function($rootScope) {
      var this1 = {};
      var this2 = (function() { return this; })();
      $rootScope.$evalAsync(function() { this1 = this; });
      $rootScope.$digest();
      expect(this1).toEqual(this2);
    }));
  });


  describe('$apply', () => {
    test('should apply expression with full lifecycle', angular.mock.inject(function($rootScope) {
      var log = '';
      var child = $rootScope.$new();
      $rootScope.$watch('a', function(a) { log += '1'; });
      child.$apply('$parent.a=0');
      expect(log).toEqual('1');
    }));


    test('should catch exceptions', () => {
      angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      });
      angular.mock.inject(function($rootScope, $exceptionHandler, $log) {
        var log = '';
        var child = $rootScope.$new();
        $rootScope.$watch('a', function(a) { log += '1'; });
        $rootScope.a = 0;
        child.$apply(function() { throw new Error('MyError'); });
        expect(log).toEqual('1');
        expect($exceptionHandler.errors[0].message).toEqual('MyError');
        $log.error.logs.shift();
      });
    });


    test('should log exceptions from $digest', () => {
      angular.mock.module(function($rootScopeProvider, $exceptionHandlerProvider) {
        $rootScopeProvider.digestTtl(2);
        $exceptionHandlerProvider.mode('log');
      });
      angular.mock.inject(function($rootScope, $exceptionHandler) {
        $rootScope.$watch('a', function() {$rootScope.b++;});
        $rootScope.$watch('b', function() {$rootScope.a++;});
        $rootScope.a = $rootScope.b = 0;

        expect(function() {
          $rootScope.$apply();
        }).toThrow();

        expect($exceptionHandler.errors[0]).toBeDefined();

        expect($rootScope.$$phase).toBeNull();
      });
    });


    describe('exceptions', () => {
      var log;
      beforeEach(angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      }));
      beforeEach(angular.mock.inject(function($rootScope) {
        log = '';
        $rootScope.$watch(function() { log += '$digest;'; });
        $rootScope.$digest();
        log = '';
      }));


      test('should execute and return value and update', angular.mock.inject(
          function($rootScope, $exceptionHandler) {
        $rootScope.name = 'abc';
        expect($rootScope.$apply(function(scope) {
          return scope.name;
        })).toEqual('abc');
        expect(log).toEqual('$digest;');
        expect($exceptionHandler.errors).toEqual([]);
      }));


      test('should catch exception and update', angular.mock.inject(function($rootScope, $exceptionHandler) {
        var error = new Error('MyError');
        $rootScope.$apply(function() { throw error; });
        expect(log).toEqual('$digest;');
        expect($exceptionHandler.errors).toEqual([error]);
      }));
    });


    describe('recursive $apply protection', () => {
      test('should throw an exception if $apply is called while an $apply is in progress', angular.mock.inject(
          function($rootScope) {
        expect(function() {
          $rootScope.$apply(function() {
            $rootScope.$apply();
          });
        }).toThrowMinErr('$rootScope', 'inprog', '$apply already in progress');
      }));


      test('should not clear the state when calling $apply during an $apply', angular.mock.inject(
          function($rootScope) {
        $rootScope.$apply(function() {
          expect(function() {
            $rootScope.$apply();
          }).toThrowMinErr('$rootScope', 'inprog', '$apply already in progress');
          expect(function() {
            $rootScope.$apply();
          }).toThrowMinErr('$rootScope', 'inprog', '$apply already in progress');
        });
        expect(function() {
          $rootScope.$apply();
        }).not.toThrow();
      }));


      test('should throw an exception if $apply is called while flushing evalAsync queue', angular.mock.inject(
          function($rootScope) {
        expect(function() {
          $rootScope.$apply(function() {
            $rootScope.$evalAsync(function() {
              $rootScope.$apply();
            });
          });
        }).toThrowMinErr('$rootScope', 'inprog', '$digest already in progress');
      }));


      test('should throw an exception if $apply is called while a watch is being initialized', angular.mock.inject(
          function($rootScope) {
        var childScope1 = $rootScope.$new();
        childScope1.$watch('x', function() {
          childScope1.$apply();
        });
        expect(function() { childScope1.$apply(); }).toThrowMinErr('$rootScope', 'inprog', '$digest already in progress');
      }));


      test('should thrown an exception if $apply in called from a watch fn (after init)', angular.mock.inject(
          function($rootScope) {
        var childScope2 = $rootScope.$new();
        childScope2.$apply(function() {
          childScope2.$watch('x', function(newVal, oldVal) {
            if (newVal !== oldVal) {
              childScope2.$apply();
            }
          });
        });

        expect(function() {
          childScope2.$apply(function() {
            childScope2.x = 'something';
          });
        }).toThrowMinErr('$rootScope', 'inprog', '$digest already in progress');
      }));
    });
  });


  describe('$applyAsync', () => {
    beforeEach(angular.mock.module(function($exceptionHandlerProvider) {
      $exceptionHandlerProvider.mode('log');
    }));


    test('should evaluate in the context of specific $scope', angular.mock.inject(function($rootScope, $browser) {
      var scope = $rootScope.$new();
      scope.$applyAsync('x = "CODE ORANGE"');

      $browser.defer.flush();
      expect(scope.x).toBe('CODE ORANGE');
      expect($rootScope.x).toBeUndefined();
    }));


    test('should evaluate queued expressions in order', angular.mock.inject(function($rootScope, $browser) {
      $rootScope.x = [];
      $rootScope.$applyAsync('x.push("expr1")');
      $rootScope.$applyAsync('x.push("expr2")');

      $browser.defer.flush();
      expect($rootScope.x).toEqual(['expr1', 'expr2']);
    }));


    test('should evaluate subsequently queued items in same turn', angular.mock.inject(function($rootScope, $browser) {
      $rootScope.x = [];
      $rootScope.$applyAsync(function() {
        $rootScope.x.push('expr1');
        $rootScope.$applyAsync('x.push("expr2")');
        expect($browser.deferredFns.length).toBe(0);
      });

      $browser.defer.flush();
      expect($rootScope.x).toEqual(['expr1', 'expr2']);
    }));


    test('should pass thrown exceptions to $exceptionHandler', angular.mock.inject(function($rootScope, $browser, $exceptionHandler) {
      $rootScope.$applyAsync(function() {
        throw 'OOPS';
      });

      $browser.defer.flush();
      expect($exceptionHandler.errors).toEqual([
        'OOPS'
      ]);
    }));


    test('should evaluate subsequent expressions after an exception is thrown', angular.mock.inject(function($rootScope, $browser) {
      $rootScope.$applyAsync(function() {
        throw 'OOPS';
      });
      $rootScope.$applyAsync('x = "All good!"');

      $browser.defer.flush();
      expect($rootScope.x).toBe('All good!');
    }));


    test('should be cancelled if a $rootScope digest occurs before the next tick', angular.mock.inject(function($rootScope, $browser) {
      var cancel = jest.spyOn($browser.defer, 'cancel');
      var expression = jest.fn().mockName('expr');

      $rootScope.$applyAsync(expression);
      $rootScope.$digest();
      expect(expression).toHaveBeenCalledTimes(1);
      expect(cancel).toHaveBeenCalledTimes(1);
      expression.mockClear();
      cancel.mockClear();

      // assert that we no longer are waiting to execute
      expect($browser.deferredFns.length).toBe(0);

      // assert that another digest won't call the function again
      $rootScope.$digest();
      expect(expression).not.toHaveBeenCalled();
      expect(cancel).not.toHaveBeenCalled();
    }));
  });

  describe('$$postDigest', () => {
    test('should process callbacks as a queue (FIFO) when the scope is digested', angular.mock.inject(function($rootScope) {
      var signature = '';

      $rootScope.$$postDigest(function() {
        signature += 'A';
        $rootScope.$$postDigest(function() {
          signature += 'D';
        });
      });

      $rootScope.$$postDigest(function() {
        signature += 'B';
      });

      $rootScope.$$postDigest(function() {
        signature += 'C';
      });

      expect(signature).toBe('');
      $rootScope.$digest();
      expect(signature).toBe('ABCD');
    }));

    test('should support $apply calls nested in $$postDigest callbacks', angular.mock.inject(function($rootScope) {
      var signature = '';

      $rootScope.$$postDigest(function() {
        signature += 'A';
      });

      $rootScope.$$postDigest(function() {
        signature += 'B';
        $rootScope.$apply();
        signature += 'D';
      });

      $rootScope.$$postDigest(function() {
        signature += 'C';
      });

      expect(signature).toBe('');
      $rootScope.$digest();
      expect(signature).toBe('ABCD');
    }));

    test('should run a $$postDigest call on all child scopes when a parent scope is digested', angular.mock.inject(function($rootScope) {
      var parent = $rootScope.$new();
      var child = parent.$new();
      var count = 0;

      $rootScope.$$postDigest(function() {
        count++;
      });

      parent.$$postDigest(function() {
        count++;
      });

      child.$$postDigest(function() {
        count++;
      });

      expect(count).toBe(0);
      $rootScope.$digest();
      expect(count).toBe(3);
    }));

    test('should run a $$postDigest call even if the child scope is isolated', angular.mock.inject(function($rootScope) {
      var parent = $rootScope.$new();
      var child = parent.$new(true);
      var signature = '';

      parent.$$postDigest(function() {
        signature += 'A';
      });

      child.$$postDigest(function() {
        signature += 'B';
      });

      expect(signature).toBe('');
      $rootScope.$digest();
      expect(signature).toBe('AB');
    }));
  });

  describe('events', () => {

    describe('$on', () => {

      test('should add listener for both $emit and $broadcast events', angular.mock.inject(function($rootScope) {
        var log = '';
        var child = $rootScope.$new();

        function eventFn() {
          log += 'X';
        }

        child.$on('abc', eventFn);
        expect(log).toEqual('');

        child.$emit('abc');
        expect(log).toEqual('X');

        child.$broadcast('abc');
        expect(log).toEqual('XX');
      }));


      test('should increment ancestor $$listenerCount entries', angular.mock.inject(function($rootScope) {
        var child1 = $rootScope.$new();
        var child2 = child1.$new();
        var spy = jest.fn();

        $rootScope.$on('event1', spy);
        expect($rootScope.$$listenerCount).toEqual({event1: 1});

        child1.$on('event1', spy);
        expect($rootScope.$$listenerCount).toEqual({event1: 2});
        expect(child1.$$listenerCount).toEqual({event1: 1});

        child2.$on('event2', spy);
        expect($rootScope.$$listenerCount).toEqual({event1: 2, event2: 1});
        expect(child1.$$listenerCount).toEqual({event1: 1, event2: 1});
        expect(child2.$$listenerCount).toEqual({event2: 1});
      }));


      describe('deregistration', () => {

        test('should return a function that deregisters the listener', angular.mock.inject(function($rootScope) {
          var log = '';
          var child = $rootScope.$new();
          var listenerRemove;

          function eventFn() {
            log += 'X';
          }

          listenerRemove = child.$on('abc', eventFn);
          expect(log).toEqual('');
          expect(listenerRemove).toBeDefined();

          child.$emit('abc');
          child.$broadcast('abc');
          expect(log).toEqual('XX');
          expect($rootScope.$$listenerCount['abc']).toBe(1);

          log = '';
          listenerRemove();
          child.$emit('abc');
          child.$broadcast('abc');
          expect(log).toEqual('');
          expect($rootScope.$$listenerCount['abc']).toBeUndefined();
        }));


        // See issue https://github.com/angular/angular.js/issues/16135
        test('should deallocate the listener array entry', angular.mock.inject(function($rootScope) {
          var remove1 = $rootScope.$on('abc', angular.noop);
          $rootScope.$on('abc', angular.noop);

          expect($rootScope.$$listeners['abc'].length).toBe(2);
          expect(0 in $rootScope.$$listeners['abc']).toBe(true);

          remove1();

          expect($rootScope.$$listeners['abc'].length).toBe(2);
          expect(0 in $rootScope.$$listeners['abc']).toBe(false);
        }));


        test('should call next listener after removing the current listener via its own handler', angular.mock.inject(function($rootScope) {
          var listener1 = jest.fn().mockName('listener1').mockImplementation(function() { remove1(); });
          var remove1 = $rootScope.$on('abc', listener1);

          var listener2 = jest.fn().mockName('listener2');
          var remove2 = $rootScope.$on('abc', listener2);

          var listener3 = jest.fn().mockName('listener3');
          var remove3 = $rootScope.$on('abc', listener3);

          $rootScope.$broadcast('abc');
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).toHaveBeenCalled();

          listener1.mockClear();
          listener2.mockClear();
          listener3.mockClear();

          $rootScope.$broadcast('abc');
          expect(listener1).not.toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).toHaveBeenCalled();
        }));


        test('should call all subsequent listeners when a previous listener is removed via a handler', angular.mock.inject(function($rootScope) {
          var listener1 = jest.fn();
          var remove1 = $rootScope.$on('abc', listener1);

          var listener2 = jest.fn().mockImplementation(remove1);
          var remove2 = $rootScope.$on('abc', listener2);

          var listener3 = jest.fn();
          var remove3 = $rootScope.$on('abc', listener3);

          $rootScope.$broadcast('abc');
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).toHaveBeenCalled();

          listener1.mockClear();
          listener2.mockClear();
          listener3.mockClear();

          $rootScope.$broadcast('abc');
          expect(listener1).not.toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).toHaveBeenCalled();
        }));


        test('should not call listener when removed by previous', angular.mock.inject(function($rootScope) {
          var listener1 = jest.fn().mockName('listener1');
          var remove1 = $rootScope.$on('abc', listener1);

          var listener2 = jest.fn().mockName('listener2').mockImplementation(function() { remove3(); });
          var remove2 = $rootScope.$on('abc', listener2);

          var listener3 = jest.fn().mockName('listener3');
          var remove3 = $rootScope.$on('abc', listener3);

          var listener4 = jest.fn().mockName('listener4');
          var remove4 = $rootScope.$on('abc', listener4);

          $rootScope.$broadcast('abc');
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).not.toHaveBeenCalled();
          expect(listener4).toHaveBeenCalled();

          listener1.mockClear();
          listener2.mockClear();
          listener3.mockClear();
          listener4.mockClear();

          $rootScope.$broadcast('abc');
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).not.toHaveBeenCalled();
          expect(listener4).toHaveBeenCalled();
        }));


        test('should decrement ancestor $$listenerCount entries', angular.mock.inject(function($rootScope) {
          var child1 = $rootScope.$new();
          var child2 = child1.$new();
          var spy = jest.fn();

          $rootScope.$on('event1', spy);
          expect($rootScope.$$listenerCount).toEqual({event1: 1});

          child1.$on('event1', spy);
          expect($rootScope.$$listenerCount).toEqual({event1: 2});
          expect(child1.$$listenerCount).toEqual({event1: 1});

          var deregisterEvent2Listener = child2.$on('event2', spy);
          expect($rootScope.$$listenerCount).toEqual({event1: 2, event2: 1});
          expect(child1.$$listenerCount).toEqual({event1: 1, event2: 1});
          expect(child2.$$listenerCount).toEqual({event2: 1});

          deregisterEvent2Listener();

          expect($rootScope.$$listenerCount).toEqual({event1: 2});
          expect(child1.$$listenerCount).toEqual({event1: 1});
          expect(child2.$$listenerCount).toEqual({});
        }));


        test('should not decrement $$listenerCount when called second time', angular.mock.inject(function($rootScope) {
          var child = $rootScope.$new();
          var listener1Spy = jest.fn();
          var listener2Spy = jest.fn();

          child.$on('abc', listener1Spy);
          expect($rootScope.$$listenerCount).toEqual({abc: 1});
          expect(child.$$listenerCount).toEqual({abc: 1});

          var deregisterEventListener = child.$on('abc', listener2Spy);
          expect($rootScope.$$listenerCount).toEqual({abc: 2});
          expect(child.$$listenerCount).toEqual({abc: 2});

          deregisterEventListener();

          expect($rootScope.$$listenerCount).toEqual({abc: 1});
          expect(child.$$listenerCount).toEqual({abc: 1});

          deregisterEventListener();

          expect($rootScope.$$listenerCount).toEqual({abc: 1});
          expect(child.$$listenerCount).toEqual({abc: 1});
        }));
      });
    });


    describe('$emit', () => {
      var log;
      var child;
      var grandChild;
      var greatGrandChild;

      function logger(event) {
        log += event.currentScope.id + '>';
      }

      beforeEach(angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      }));
      beforeEach(angular.mock.inject(function($rootScope) {
        log = '';
        child = $rootScope.$new();
        grandChild = child.$new();
        greatGrandChild = grandChild.$new();

        $rootScope.id = 0;
        child.id = 1;
        grandChild.id = 2;
        greatGrandChild.id = 3;

        $rootScope.$on('myEvent', logger);
        child.$on('myEvent', logger);
        grandChild.$on('myEvent', logger);
        greatGrandChild.$on('myEvent', logger);
      }));

      test('should bubble event up to the root scope', () => {
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>1>0>');
      });

      test('should allow all events on the same scope to run even if stopPropagation is called', () => {
        child.$on('myEvent', logger);
        grandChild.$on('myEvent', function(e) { e.stopPropagation(); });
        grandChild.$on('myEvent', logger);
        grandChild.$on('myEvent', logger);
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>2>2>');
      });

      test('should dispatch exceptions to the $exceptionHandler',
          angular.mock.inject(function($exceptionHandler) {
        child.$on('myEvent', function() { throw 'bubbleException'; });
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>1>0>');
        expect($exceptionHandler.errors).toEqual(['bubbleException']);
      }));


      test('should allow stopping event propagation', () => {
        child.$on('myEvent', function(event) { event.stopPropagation(); });
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>1>');
      });


      test('should forward method arguments', () => {
        child.$on('abc', function(event, arg1, arg2) {
          expect(event.name).toBe('abc');
          expect(arg1).toBe('arg1');
          expect(arg2).toBe('arg2');
        });
        child.$emit('abc', 'arg1', 'arg2');
      });


      test('should allow removing event listener inside a listener on $emit', () => {
        var spy1 = jest.fn().mockName('1st listener');
        var spy2 = jest.fn().mockName('2nd listener');
        var spy3 = jest.fn().mockName('3rd listener');

        var remove1 = child.$on('evt', spy1);
        var remove2 = child.$on('evt', spy2);
        var remove3 = child.$on('evt', spy3);

        spy1.mockImplementation(remove1);

        expect(child.$$listeners['evt'].length).toBe(3);

        // should call all listeners and remove 1st
        child.$emit('evt');
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).toHaveBeenCalledTimes(1);
        expect(child.$$listeners['evt'].length).toBe(3); // cleanup will happen on next $emit

        spy1.mockClear();
        spy2.mockClear();
        spy3.mockClear();

        // should call only 2nd because 1st was already removed and 2nd removes 3rd
        spy2.mockImplementation(remove3);
        child.$emit('evt');
        expect(spy1).not.toHaveBeenCalled();
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).not.toHaveBeenCalled();
        expect(child.$$listeners['evt'].length).toBe(1);
      });


      test('should allow removing event listener inside a listener on $broadcast', () => {
        var spy1 = jest.fn().mockName('1st listener');
        var spy2 = jest.fn().mockName('2nd listener');
        var spy3 = jest.fn().mockName('3rd listener');

        var remove1 = child.$on('evt', spy1);
        var remove2 = child.$on('evt', spy2);
        var remove3 = child.$on('evt', spy3);

        spy1.mockImplementation(remove1);

        expect(child.$$listeners['evt'].length).toBe(3);

        // should call all listeners and remove 1st
        child.$broadcast('evt');
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).toHaveBeenCalledTimes(1);
        expect(child.$$listeners['evt'].length).toBe(3); //cleanup will happen on next $broadcast

        spy1.mockClear();
        spy2.mockClear();
        spy3.mockClear();

        // should call only 2nd because 1st was already removed and 2nd removes 3rd
        spy2.mockImplementation(remove3);
        child.$broadcast('evt');
        expect(spy1).not.toHaveBeenCalled();
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).not.toHaveBeenCalled();
        expect(child.$$listeners['evt'].length).toBe(1);
      });


      describe('event object', () => {
        test('should have methods/properties', () => {
          var eventFired = false;

          child.$on('myEvent', function(e) {
            expect(e.targetScope).toBe(grandChild);
            expect(e.currentScope).toBe(child);
            expect(e.name).toBe('myEvent');
            eventFired = true;
          });
          grandChild.$emit('myEvent');
          expect(eventFired).toBe(true);
        });


        test('should have its `currentScope` property set to null after emit', () => {
          var event;

          child.$on('myEvent', function(e) {
            event = e;
          });
          grandChild.$emit('myEvent');

          expect(event.currentScope).toBe(null);
          expect(event.targetScope).toBe(grandChild);
          expect(event.name).toBe('myEvent');
        });


        test('should have preventDefault method and defaultPrevented property', () => {
          var event = grandChild.$emit('myEvent');
          expect(event.defaultPrevented).toBe(false);

          child.$on('myEvent', function(event) {
            event.preventDefault();
          });
          event = grandChild.$emit('myEvent');
          expect(event.defaultPrevented).toBe(true);
          expect(event.currentScope).toBe(null);
        });
      });
    });


    describe('$broadcast', () => {
      describe('event propagation', () => {
        var log;
        var child1;
        var child2;
        var child3;
        var grandChild11;
        var grandChild21;
        var grandChild22;
        var grandChild23;
        var greatGrandChild211;

        function logger(event) {
          log += event.currentScope.id + '>';
        }

        beforeEach(angular.mock.inject(function($rootScope) {
          log = '';
          child1 = $rootScope.$new();
          child2 = $rootScope.$new();
          child3 = $rootScope.$new();
          grandChild11 = child1.$new();
          grandChild21 = child2.$new();
          grandChild22 = child2.$new();
          grandChild23 = child2.$new();
          greatGrandChild211 = grandChild21.$new();

          $rootScope.id = 0;
          child1.id = 1;
          child2.id = 2;
          child3.id = 3;
          grandChild11.id = 11;
          grandChild21.id = 21;
          grandChild22.id = 22;
          grandChild23.id = 23;
          greatGrandChild211.id = 211;

          $rootScope.$on('myEvent', logger);
          child1.$on('myEvent', logger);
          child2.$on('myEvent', logger);
          child3.$on('myEvent', logger);
          grandChild11.$on('myEvent', logger);
          grandChild21.$on('myEvent', logger);
          grandChild22.$on('myEvent', logger);
          grandChild23.$on('myEvent', logger);
          greatGrandChild211.$on('myEvent', logger);

          //          R
          //       /  |   \
          //     1    2    3
          //    /   / | \
          //   11  21 22 23
          //       |
          //      211
        }));


        test('should broadcast an event from the root scope', angular.mock.inject(function($rootScope) {
          $rootScope.$broadcast('myEvent');
          expect(log).toBe('0>1>11>2>21>211>22>23>3>');
        }));


        test('should broadcast an event from a child scope', () => {
          child2.$broadcast('myEvent');
          expect(log).toBe('2>21>211>22>23>');
        });


        test('should broadcast an event from a leaf scope with a sibling', () => {
          grandChild22.$broadcast('myEvent');
          expect(log).toBe('22>');
        });


        test('should broadcast an event from a leaf scope without a sibling', () => {
          grandChild23.$broadcast('myEvent');
          expect(log).toBe('23>');
        });


        test('should not not fire any listeners for other events', angular.mock.inject(function($rootScope) {
          $rootScope.$broadcast('fooEvent');
          expect(log).toBe('');
        }));


        test('should not descend past scopes with a $$listerCount of 0 or undefined',
            angular.mock.inject(function($rootScope) {
              var EVENT = 'fooEvent';
              var spy = jest.fn().mockName('listener');

              // Precondition: There should be no listeners for fooEvent.
              expect($rootScope.$$listenerCount[EVENT]).toBeUndefined();

              // Add a spy listener to a child scope.
              $rootScope.$$childHead.$$listeners[EVENT] = [spy];

              // $rootScope's count for 'fooEvent' is undefined, so spy should not be called.
              $rootScope.$broadcast(EVENT);
              expect(spy).not.toHaveBeenCalled();
            }));


        test('should return event object', () => {
          var result = child1.$broadcast('some');

          expect(result).toBeDefined();
          expect(result.name).toBe('some');
          expect(result.targetScope).toBe(child1);
        });
      });


      describe('listener', () => {
        test('should receive event object', angular.mock.inject(function($rootScope) {
          var scope = $rootScope;
          var child = scope.$new();
          var eventFired = false;

          child.$on('fooEvent', function(event) {
            eventFired = true;
            expect(event.name).toBe('fooEvent');
            expect(event.targetScope).toBe(scope);
            expect(event.currentScope).toBe(child);
          });
          scope.$broadcast('fooEvent');

          expect(eventFired).toBe(true);
        }));


        test('should have the event\'s `currentScope` property set to null after broadcast',
            angular.mock.inject(function($rootScope) {
              var scope = $rootScope;
              var child = scope.$new();
              var event;

              child.$on('fooEvent', function(e) {
                event = e;
              });
              scope.$broadcast('fooEvent');

              expect(event.name).toBe('fooEvent');
              expect(event.targetScope).toBe(scope);
              expect(event.currentScope).toBe(null);
            }));


        test('should support passing messages as varargs', angular.mock.inject(function($rootScope) {
          var scope = $rootScope;
          var child = scope.$new();
          var args;

          child.$on('fooEvent', function() {
            args = arguments;
          });
          scope.$broadcast('fooEvent', 'do', 're', 'me', 'fa');

          expect(args.length).toBe(5);
          expect(ngInternals.sliceArgs(args, 1)).toEqual(['do', 're', 'me', 'fa']);
        }));
      });
    });


    test('should allow recursive $emit/$broadcast', angular.mock.inject(function($rootScope) {
      var callCount = 0;
      $rootScope.$on('evt', function($event, arg0) {
        callCount++;
        if (arg0 !== 1234) {
          $rootScope.$emit('evt', 1234);
          $rootScope.$broadcast('evt', 1234);
        }
      });

      $rootScope.$emit('evt');
      $rootScope.$broadcast('evt');
      expect(callCount).toBe(6);
    }));


    test('should allow recursive $emit/$broadcast between parent/child', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new();
      var calls = '';

      $rootScope.$on('evt', function($event, arg0) {
        calls += 'r';  // For "root".
        if (arg0 === 'fromChild') {
          $rootScope.$broadcast('evt', 'fromRoot2');
        }
      });

      child.$on('evt', function($event, arg0) {
        calls += 'c';  // For "child".
        if (arg0 === 'fromRoot1') {
          child.$emit('evt', 'fromChild');
        }
      });

      $rootScope.$broadcast('evt', 'fromRoot1');
      expect(calls).toBe('rccrrc');
    }));
  });

  describe('doc examples', () => {

    test('should properly fire off watch listeners upon scope changes', angular.mock.inject(function($rootScope) {
//<docs tag="docs1">
      var scope = $rootScope.$new();
      scope.salutation = 'Hello';
      scope.name = 'World';

      expect(scope.greeting).toEqual(undefined);

      scope.$watch('name', function() {
        scope.greeting = scope.salutation + ' ' + scope.name + '!';
      }); // initialize the watch

      expect(scope.greeting).toEqual(undefined);
      scope.name = 'Misko';
      // still old value, since watches have not been called yet
      expect(scope.greeting).toEqual(undefined);

      scope.$digest(); // fire all  the watches
      expect(scope.greeting).toEqual('Hello Misko!');
//</docs>
    }));

  });
});
