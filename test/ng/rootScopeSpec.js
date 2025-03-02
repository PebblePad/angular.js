'use strict';

describe('Scope', function() {

  beforeEach(angular.mock.module(provideLog));


  describe('$root', function() {
    it('should point to itself', angular.mock.inject(function($rootScope) {
      expect($rootScope.$root).toEqual($rootScope);
      expect($rootScope.hasOwnProperty('$root')).toBeTruthy();
    }));


    it('should expose the constructor', angular.mock.inject(function($rootScope) {
      expect(Object.getPrototypeOf($rootScope)).toBe($rootScope.constructor.prototype);
    }));


    it('should not have $root on children, but should inherit', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new();
      expect(child.$root).toEqual($rootScope);
      expect(child.hasOwnProperty('$root')).toBeFalsy();
    }));

  });


  describe('$parent', function() {
    it('should point to itself in root', angular.mock.inject(function($rootScope) {
      expect($rootScope.$root).toEqual($rootScope);
    }));


    it('should point to parent', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new();
      expect($rootScope.$parent).toEqual(null);
      expect(child.$parent).toEqual($rootScope);
      expect(child.$new().$parent).toEqual(child);
    }));
  });


  describe('$id', function() {
    it('should have a unique id', angular.mock.inject(function($rootScope) {
      expect($rootScope.$id < $rootScope.$new().$id).toBeTruthy();
    }));
  });


  describe('this', function() {
    it('should evaluate \'this\' to be the scope', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new();
      expect($rootScope.$eval('this')).toEqual($rootScope);
      expect(child.$eval('this')).toEqual(child);
    }));

    it('\'this\' should not be recursive', angular.mock.inject(function($rootScope) {
      expect($rootScope.$eval('this.this')).toBeUndefined();
      expect($rootScope.$eval('$parent.this')).toBeUndefined();
    }));

    it('should not be able to overwrite the \'this\' keyword', angular.mock.inject(function($rootScope) {
      $rootScope['this'] = 123;
      expect($rootScope.$eval('this')).toEqual($rootScope);
    }));

    it('should be able to access a variable named \'this\'', angular.mock.inject(function($rootScope) {
      $rootScope['this'] = 42;
      expect($rootScope.$eval('this[\'this\']')).toBe(42);
    }));
  });


  describe('$new()', function() {
    it('should create a child scope', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new();
      $rootScope.a = 123;
      expect(child.a).toEqual(123);
    }));

    it('should create a non prototypically inherited child scope', angular.mock.inject(function($rootScope) {
      var child = $rootScope.$new(true);
      $rootScope.a = 123;
      expect(child.a).toBeUndefined();
      expect(child.$parent).toEqual($rootScope);
      expect(child.$new).toBe($rootScope.$new);
      expect(child.$root).toBe($rootScope);
    }));

    it('should attach the child scope to a specified parent', angular.mock.inject(function($rootScope) {
      var isolated = $rootScope.$new(true);
      var trans = $rootScope.$new(false, isolated);
      $rootScope.a = 123;
      expect(isolated.a).toBeUndefined();
      expect(trans.a).toEqual(123);
      expect(trans.$parent).toBe(isolated);
    }));
  });


  describe('$watch/$digest', function() {
    it('should watch and fire on simple property change', angular.mock.inject(function($rootScope) {
      var spy = jest.fn();
      $rootScope.$watch('name', spy);
      $rootScope.$digest();
      spy.mockReset();

      expect(spy).not.toHaveBeenCalled();
      $rootScope.$digest();
      expect(spy).not.toHaveBeenCalled();
      $rootScope.name = 'misko';
      $rootScope.$digest();
      expect(spy).toHaveBeenCalledWith('misko', undefined, $rootScope);
    }));


    it('should not expose the `inner working of watch', angular.mock.inject(function($rootScope) {
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


    it('should watch and fire on expression change', angular.mock.inject(function($rootScope) {
      var spy = jest.fn();
      $rootScope.$watch('name.first', spy);
      $rootScope.$digest();
      spy.mockReset();

      $rootScope.name = {};
      expect(spy).not.toHaveBeenCalled();
      $rootScope.$digest();
      expect(spy).not.toHaveBeenCalled();
      $rootScope.name.first = 'misko';
      $rootScope.$digest();
      expect(spy).toHaveBeenCalled();
    }));

    it('should not keep constant expressions on watch queue', angular.mock.inject(function($rootScope) {
      $rootScope.$watch('1 + 1', function() {});
      expect($rootScope.$$watchers.length).toEqual(1);
      expect($rootScope.$$watchersCount).toEqual(1);
      $rootScope.$digest();

      expect($rootScope.$$watchers.length).toEqual(0);
      expect($rootScope.$$watchersCount).toEqual(0);
    }));

    it('should decrement the watcherCount when destroying a child scope', angular.mock.inject(function($rootScope) {
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

    it('should decrement the watcherCount when calling the remove function', angular.mock.inject(function($rootScope) {
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

    it('should not keep constant literals on the watch queue', angular.mock.inject(function($rootScope) {
      $rootScope.$watch('[]', function() {});
      $rootScope.$watch('{}', function() {});
      expect($rootScope.$$watchers.length).toEqual(2);
      $rootScope.$digest();

      expect($rootScope.$$watchers.length).toEqual(0);
    }));

    it('should clean up stable watches on the watch queue', angular.mock.inject(function($rootScope) {
      $rootScope.$watch('::foo', function() {});
      expect($rootScope.$$watchers.length).toEqual(1);

      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toEqual(1);

      $rootScope.foo = 'foo';
      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toEqual(0);
    }));

    it('should clean up stable watches from $watchCollection', angular.mock.inject(function($rootScope) {
      $rootScope.$watchCollection('::foo', function() {});
      expect($rootScope.$$watchers.length).toEqual(1);

      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toEqual(1);

      $rootScope.foo = [];
      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toEqual(0);
    }));

    it('should clean up stable watches from $watchGroup', angular.mock.inject(function($rootScope) {
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

    it('should delegate exceptions', function() {
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


    it('should fire watches in order of addition', angular.mock.inject(function($rootScope) {
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


    it('should call child $watchers in addition order', angular.mock.inject(function($rootScope) {
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


    it('should allow $digest on a child scope with and without a right sibling', angular.mock.inject(
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


    it('should repeat watch cycle while model changes are identified', angular.mock.inject(function($rootScope) {
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


    it('should repeat watch cycle from the root element', angular.mock.inject(function($rootScope) {
      var log = '';
      var child = $rootScope.$new();
      $rootScope.$watch(function() { log += 'a'; });
      child.$watch(function() { log += 'b'; });
      $rootScope.$digest();
      expect(log).toEqual('abab');
    }));


    it('should prevent infinite recursion and print watcher expression',function() {
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


    it('should prevent infinite recursion and print watcher function name or body',
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


    it('should prevent infinite loop when creating and resolving a promise in a watched expression', function() {
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


    it('should not fire upon $watch registration on initial $digest', angular.mock.inject(function($rootScope) {
      var log = '';
      $rootScope.a = 1;
      $rootScope.$watch('a', function() { log += 'a'; });
      $rootScope.$watch('b', function() { log += 'b'; });
      $rootScope.$digest();
      log = '';
      $rootScope.$digest();
      expect(log).toEqual('');
    }));


    it('should watch objects', angular.mock.inject(function($rootScope) {
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


    it('should watch functions', function() {
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


    it('should prevent $digest recursion', angular.mock.inject(function($rootScope) {
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


    it('should allow a watch to be added while in a digest', angular.mock.inject(function($rootScope) {
      var watch1 = jest.fn();
      var watch2 = jest.fn();
      $rootScope.$watch('foo', function() {
        $rootScope.$watch('foo', watch1);
        $rootScope.$watch('foo', watch2);
      });
      $rootScope.$apply('foo = true');
      expect(watch1).toHaveBeenCalled();
      expect(watch2).toHaveBeenCalled();
    }));


    it('should not skip watchers when adding new watchers during digest',
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


    it('should not run the current watcher twice when removing a watcher during digest',
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


    it('should not skip watchers when removing itself during digest',
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


    it('should not infinitely digest when current value is NaN', angular.mock.inject(function($rootScope) {
      $rootScope.$watch(function() { return NaN;});

      expect(function() {
        $rootScope.$digest();
      }).not.toThrow();
    }));


    it('should always call the watcher with newVal and oldVal equal on the first run',
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
      expect(isNaN(log.shift())).toBe(true); //jasmine's toBe and toEqual don't work well with NaNs
      expect(log).toEqual([undefined, '', false, {}, 23]);
      log = [];
      $rootScope.$digest();
      expect(log).toEqual([]);
    }));


    describe('$watch deregistration', function() {

      it('should return a function that allows listeners to be deregistered', angular.mock.inject(
          function($rootScope) {
            var listener = jest.fn();
            var listenerRemove;

            listenerRemove = $rootScope.$watch('foo', listener);
            $rootScope.$digest(); //init
            expect(listener).toHaveBeenCalled();
            expect(listenerRemove).toBeDefined();

            listener.mockReset();
            $rootScope.foo = 'bar';
            $rootScope.$digest(); //trigger
            expect(listener).toHaveBeenCalledTimes(1);

            listener.mockReset();
            $rootScope.foo = 'baz';
            listenerRemove();
            $rootScope.$digest(); //trigger
            expect(listener).not.toHaveBeenCalled();
          }));


      it('should allow a watch to be deregistered while in a digest', angular.mock.inject(function($rootScope) {
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


      it('should not mess up the digest loop if deregistration happens during digest', angular.mock.inject(
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


    describe('$watchCollection', function() {
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


      it('should not trigger if nothing change', angular.mock.inject(function($rootScope) {
        $rootScope.$digest();
        expect(log).toEqual([{ newVal: undefined, oldVal: undefined, identical: true }]);
        log.reset();

        $rootScope.$digest();
        expect(log).toEqual([]);
      }));


      it('should allow deregistration', function() {
        $rootScope.obj = [];
        $rootScope.$digest();
        expect(log.toArray().length).toBe(1);
        log.reset();

        $rootScope.obj.push('a');
        deregister();

        $rootScope.$digest();
        expect(log).toEqual([]);
      });


      describe('array', function() {

        it('should return oldCollection === newCollection only on the first listener call',
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


        it('should trigger when property changes into array', function() {
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


        it('should not trigger change when object in collection changes', function() {
          $rootScope.obj = [{}];
          $rootScope.$digest();
          expect(log.empty()).toEqual([{newVal: [{}], oldVal: [{}], identical: true}]);

          $rootScope.obj[0].name = 'foo';
          $rootScope.$digest();
          expect(log).toEqual([]);
        });


        it('should watch array properties', function() {
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

        it('should not infinitely digest when current value is NaN', function() {
          $rootScope.obj = [NaN];
          expect(function() {
            $rootScope.$digest();
          }).not.toThrow();
        });

        it('should watch array-like objects like arrays', function() {
          var arrayLikelog = [];
          $rootScope.$watchCollection('arrayLikeObject', function logger(obj) {
            angular.forEach(obj, function(element) {
              arrayLikelog.push(element.name);
            });
          });
          window.document.body.innerHTML = '<p>' +
                                             '<a name=\'x\'>a</a>' +
                                             '<a name=\'y\'>b</a>' +
                                           '</p>';

          $rootScope.arrayLikeObject = window.document.getElementsByTagName('a');
          $rootScope.$digest();
          expect(arrayLikelog).toEqual(['x', 'y']);
        });
      });


      describe('object', function() {

        it('should return oldCollection === newCollection only on the first listener call',
            angular.mock.inject(function($rootScope, log) {

          $rootScope.obj = {'a': 'b'};
          // first time should be identical
          $rootScope.$digest();
          expect(log.empty()).toEqual([{newVal: {'a': 'b'}, oldVal: {'a': 'b'}, identical: true}]);

          // second time not identical
          $rootScope.obj.a = 'c';
          $rootScope.$digest();
          expect(log).toEqual([{newVal: {'a': 'c'}, oldVal: {'a': 'b'}}]);
        }));


        it('should trigger when property changes into object', function() {
          $rootScope.obj = 'test';
          $rootScope.$digest();
          expect(log.empty()).toEqual([{newVal: 'test', oldVal: 'test', identical: true}]);

          $rootScope.obj = {};
          $rootScope.$digest();
          expect(log.empty()).toEqual([{newVal: {}, oldVal: 'test'}]);
        });


        it('should not trigger change when object in collection changes', function() {
          $rootScope.obj = {name: {}};
          $rootScope.$digest();
          expect(log.empty()).toEqual([{newVal: {name: {}}, oldVal: {name: {}}, identical: true}]);

          $rootScope.obj.name.bar = 'foo';
          $rootScope.$digest();
          expect(log.empty()).toEqual([]);
        });


        it('should watch object properties', function() {
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


        it('should not infinitely digest when current value is NaN', function() {
          $rootScope.obj = {a: NaN};
          expect(function() {
            $rootScope.$digest();
          }).not.toThrow();
        });


        it('should handle objects created using `Object.create(null)`', function() {
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


    describe('$suspend/$resume/$isSuspended', function() {
      it('should suspend watchers on scope', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn();
        $rootScope.$watch(watchSpy);
        $rootScope.$suspend();
        $rootScope.$digest();
        expect(watchSpy).not.toHaveBeenCalled();
      }));

      it('should resume watchers on scope', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn();
        $rootScope.$watch(watchSpy);
        $rootScope.$suspend();
        $rootScope.$resume();
        $rootScope.$digest();
        expect(watchSpy).toHaveBeenCalled();
      }));

      it('should suspend watchers on child scope', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn();
        var scope = $rootScope.$new(true);
        scope.$watch(watchSpy);
        $rootScope.$suspend();
        $rootScope.$digest();
        expect(watchSpy).not.toHaveBeenCalled();
      }));

      it('should resume watchers on child scope', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn();
        var scope = $rootScope.$new(true);
        scope.$watch(watchSpy);
        $rootScope.$suspend();
        $rootScope.$resume();
        $rootScope.$digest();
        expect(watchSpy).toHaveBeenCalled();
      }));

      it('should resume digesting immediately if `$resume` is called from an ancestor scope watch handler', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn();
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

      it('should resume digesting immediately if `$resume` is called from a non-ancestor scope watch handler', angular.mock.inject(function($rootScope) {
        var watchSpy = jest.fn();
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
        watchSpy.mockReset();

        // Trigger a digest that should resume the scope from within the watch handler
        $rootScope.$apply('a = true');
        // The watch handler that resumes the scope marks the digest as dirty, so it will run an extra digest
        expect(watchSpy).toHaveBeenCalled();
      }));

      it('should not suspend watchers on parent or sibling scopes', angular.mock.inject(function($rootScope) {
        var watchSpyParent = jest.fn();
        var watchSpyChild = jest.fn();
        var watchSpySibling = jest.fn();

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

      it('should return true from `$isSuspended()` when a scope is suspended', angular.mock.inject(function($rootScope) {
        $rootScope.$suspend();
        expect($rootScope.$isSuspended()).toBe(true);
        $rootScope.$resume();
        expect($rootScope.$isSuspended()).toBe(false);
      }));

      it('should return false from `$isSuspended()` for a non-suspended scope that has a suspended ancestor', angular.mock.inject(function($rootScope) {
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


    describe('optimizations', function() {

      function setupWatches(scope, log) {
        scope.$watch(function() { log('w1'); return scope.w1; }, log.fn('w1action'));
        scope.$watch(function() { log('w2'); return scope.w2; }, log.fn('w2action'));
        scope.$watch(function() { log('w3'); return scope.w3; }, log.fn('w3action'));
        scope.$digest();
        log.reset();
      }


      it('should check watches only once during an empty digest', angular.mock.inject(function(log, $rootScope) {
        setupWatches($rootScope, log);
        $rootScope.$digest();
        expect(log).toEqual(['w1', 'w2', 'w3']);
      }));


      it('should quit digest early after we check the last watch that was previously dirty',
          angular.mock.inject(function(log, $rootScope) {
        setupWatches($rootScope, log);
        $rootScope.w1 = 'x';
        $rootScope.$digest();
        expect(log).toEqual(['w1', 'w1action', 'w2', 'w3', 'w1']);
      }));


      it('should not quit digest early if a new watch was added from an existing watch action',
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


      it('should not quit digest early if an evalAsync task was scheduled from a watch action',
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


      it('should quit digest early but not too early when various watches fire', angular.mock.inject(function(log, $rootScope) {
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

  describe('$watchGroup', function() {
    var scope;
    var log;

    beforeEach(angular.mock.inject(function($rootScope, _log_) {
      scope = $rootScope.$new();
      log = _log_;
    }));


    it('should detect a change to any one expression in the group', function() {
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


    it('should work for a group with just a single expression', function() {
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


    it('should call the listener once when the array of watchExpressions is empty', function() {
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


    it('should not call watch action fn when watchGroup was deregistered', function() {
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

  });

  describe('$destroy', function() {
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


    it('should broadcast $destroy on rootScope', angular.mock.inject(function($rootScope) {
      var spy = jest.fn();
      $rootScope.$on('$destroy', spy);
      $rootScope.$destroy();
      expect(spy).toHaveBeenCalled();
      expect($rootScope.$$destroyed).toBe(true);
    }));


    it('should remove all listeners after $destroy of rootScope', angular.mock.inject(function($rootScope) {
      var spy = jest.fn();
      $rootScope.$on('dummy', spy);
      $rootScope.$destroy();
      $rootScope.$broadcast('dummy');
      expect(spy).not.toHaveBeenCalled();
    }));


    it('should remove all watchers after $destroy of rootScope', angular.mock.inject(function($rootScope) {
      var spy = jest.fn();
      var digest = $rootScope.$digest;
      $rootScope.$watch(spy);
      $rootScope.$destroy();
      digest.call($rootScope);
      expect(spy).not.toHaveBeenCalled();
    }));


    it('should call $browser.$$applicationDestroyed when destroying rootScope', angular.mock.inject(function($rootScope, $browser) {
      jest.spyOn($browser, '$$applicationDestroyed').mockImplementation(() => {});
      $rootScope.$destroy();
      expect($browser.$$applicationDestroyed).toHaveBeenCalledTimes(1);
    }));


    it('should remove first', angular.mock.inject(function($rootScope) {
      first.$destroy();
      $rootScope.$digest();
      expect(log).toEqual('23');
    }));


    it('should remove middle', angular.mock.inject(function($rootScope) {
      middle.$destroy();
      $rootScope.$digest();
      expect(log).toEqual('13');
    }));


    it('should remove last', angular.mock.inject(function($rootScope) {
      last.$destroy();
      $rootScope.$digest();
      expect(log).toEqual('12');
    }));


    it('should broadcast the $destroy event', angular.mock.inject(function($rootScope, log) {
      first.$on('$destroy', log.fn('first'));
      first.$new().$on('$destroy', log.fn('first-child'));

      first.$destroy();
      expect(log).toEqual('first; first-child');
    }));


    it('should $destroy a scope only once and ignore any further destroy calls',
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

    it('should broadcast the $destroy only once', angular.mock.inject(function($rootScope, log) {
      var isolateScope = first.$new(true);
      isolateScope.$on('$destroy', log.fn('event'));
      first.$destroy();
      isolateScope.$destroy();
      expect(log).toEqual('event');
    }));

    it('should decrement ancestor $$listenerCount entries', angular.mock.inject(function($rootScope) {
      var EVENT = 'fooEvent';
      var spy = jest.fn();
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


    it('should do nothing when a child event listener is registered after parent\'s destruction',
        angular.mock.inject(function($rootScope) {
          var parent = $rootScope.$new();
          var child = parent.$new();

          parent.$destroy();
          var fn = child.$on('someEvent', function() {});
          expect(fn).toBe(angular.noop);
        }));


    it('should do nothing when a child watch is registered after parent\'s destruction',
        angular.mock.inject(function($rootScope) {
          var parent = $rootScope.$new();
          var child = parent.$new();

          parent.$destroy();
          var fn = child.$watch('somePath', function() {});
          expect(fn).toBe(angular.noop);
        }));

    it('should do nothing when $apply()ing after parent\'s destruction', angular.mock.inject(function($rootScope) {
      var parent = $rootScope.$new();
      var child = parent.$new();

      parent.$destroy();

      var called = false;
      function applyFunc() { called = true; }
      child.$apply(applyFunc);

      expect(called).toBe(false);
    }));

    it('should do nothing when $evalAsync()ing after parent\'s destruction', angular.mock.inject(function($rootScope, $timeout) {
      var parent = $rootScope.$new();
      var child = parent.$new();

      parent.$destroy();

      var called = false;
      function applyFunc() { called = true; }
      child.$evalAsync(applyFunc);

      $timeout.verifyNoPendingTasks();
      expect(called).toBe(false);
    }));


    it('should preserve all (own and inherited) model properties on a destroyed scope',
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


  describe('$eval', function() {
    it('should eval an expression', angular.mock.inject(function($rootScope) {
      expect($rootScope.$eval('a=1')).toEqual(1);
      expect($rootScope.a).toEqual(1);

      $rootScope.$eval(function(self) {self.b = 2;});
      expect($rootScope.b).toEqual(2);
    }));


    it('should allow passing locals to the expression', angular.mock.inject(function($rootScope) {
      expect($rootScope.$eval('a+1', {a: 2})).toBe(3);

      $rootScope.$eval(function(scope, locals) {
        scope.c = locals.b + 4;
      }, {b: 3});
      expect($rootScope.c).toBe(7);
    }));
  });


  describe('$evalAsync', function() {

    it('should run callback before $watch', angular.mock.inject(function($rootScope) {
      var log = '';
      var child = $rootScope.$new();
      $rootScope.$evalAsync(function() { log += 'parent.async;'; });
      $rootScope.$watch('value', function() { log += 'parent.$digest;'; });
      child.$evalAsync(function() { log += 'child.async;'; });
      child.$watch('value', function() { log += 'child.$digest;'; });
      $rootScope.$digest();
      expect(log).toEqual('parent.async;child.async;parent.$digest;child.$digest;');
    }));

    it('should not run another digest for an $$postDigest call', angular.mock.inject(function($rootScope) {
      var internalWatchCount = 0;
      var externalWatchCount = 0;

      $rootScope.internalCount = 0;
      $rootScope.externalCount = 0;

      $rootScope.$evalAsync(function() {
        $rootScope.internalCount++;
      });

      $rootScope.$$postDigest(function() {
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

    it('should cause a $digest rerun', angular.mock.inject(function($rootScope) {
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

    it('should run async in the same order as added', angular.mock.inject(function($rootScope) {
      $rootScope.log = '';
      $rootScope.$evalAsync('log = log + 1');
      $rootScope.$evalAsync('log = log + 2');
      $rootScope.$digest();
      expect($rootScope.log).toBe('12');
    }));

    it('should allow passing locals to the expression', angular.mock.inject(function($rootScope) {
      $rootScope.log = '';
      $rootScope.$evalAsync('log = log + a', {a: 1});
      $rootScope.$digest();
      expect($rootScope.log).toBe('1');
    }));

    it('should run async expressions in their proper context', angular.mock.inject(function($rootScope) {
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

    it('should operate only with a single queue across all child and isolate scopes', angular.mock.inject(function($rootScope, $parse) {
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


    describe('auto-flushing when queueing outside of an $apply', function() {
      var log;
      var $rootScope;
      var $browser;

      beforeEach(angular.mock.inject(function(_log_, _$rootScope_, _$browser_) {
        log = _log_;
        $rootScope = _$rootScope_;
        $browser = _$browser_;
      }));


      it('should auto-flush the queue asynchronously and trigger digest', function() {
        $rootScope.$evalAsync(log.fn('eval-ed!'));
        $rootScope.$watch(log.fn('digesting'));
        expect(log).toEqual([]);

        $browser.defer.flush(0);

        expect(log).toEqual(['eval-ed!', 'digesting', 'digesting']);
      });


      it('should not trigger digest asynchronously if the queue is empty in the next tick', function() {
        $rootScope.$evalAsync(log.fn('eval-ed!'));
        $rootScope.$watch(log.fn('digesting'));
        expect(log).toEqual([]);

        $rootScope.$digest();

        expect(log).toEqual(['eval-ed!', 'digesting', 'digesting']);
        log.reset();

        $browser.defer.flush(0);

        expect(log).toEqual([]);
      });


      it('should not schedule more than one auto-flush task', function() {
        $rootScope.$evalAsync(log.fn('eval-ed 1!'));
        $rootScope.$evalAsync(log.fn('eval-ed 2!'));

        $browser.defer.flush(0);
        expect(log).toEqual(['eval-ed 1!', 'eval-ed 2!']);

        $browser.defer.flush(100000);
        expect(log).toEqual(['eval-ed 1!', 'eval-ed 2!']);
      });
    });

    it('should not pass anything as `this` to scheduled functions', angular.mock.inject(function($rootScope) {
      var this1 = {};
      var this2 = (function() { return this; })();
      $rootScope.$evalAsync(function() { this1 = this; });
      $rootScope.$digest();
      expect(this1).toEqual(this2);
    }));
  });


  describe('$apply', function() {
    it('should apply expression with full lifecycle', angular.mock.inject(function($rootScope) {
      var log = '';
      var child = $rootScope.$new();
      $rootScope.$watch('a', function() { log += '1'; });
      child.$apply('$parent.a=0');
      expect(log).toEqual('1');
    }));


    it('should catch exceptions', function() {
      angular.mock.module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      });
      angular.mock.inject(function($rootScope, $exceptionHandler, $log) {
        var log = '';
        var child = $rootScope.$new();
        $rootScope.$watch('a', function() { log += '1'; });
        $rootScope.a = 0;
        child.$apply(function() { throw new Error('MyError'); });
        expect(log).toEqual('1');
        expect($exceptionHandler.errors[0].message).toEqual('MyError');
        $log.error.logs.shift();
      });
    });


    it('should log exceptions from $digest', function() {
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


    describe('exceptions', function() {
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


      it('should execute and return value and update', angular.mock.inject(
          function($rootScope, $exceptionHandler) {
        $rootScope.name = 'abc';
        expect($rootScope.$apply(function(scope) {
          return scope.name;
        })).toEqual('abc');
        expect(log).toEqual('$digest;');
        expect($exceptionHandler.errors).toEqual([]);
      }));


      it('should catch exception and update', angular.mock.inject(function($rootScope, $exceptionHandler) {
        var error = new Error('MyError');
        $rootScope.$apply(function() { throw error; });
        expect(log).toEqual('$digest;');
        expect($exceptionHandler.errors).toEqual([error]);
      }));
    });


    describe('recursive $apply protection', function() {
      it('should throw an exception if $apply is called while an $apply is in progress', angular.mock.inject(
          function($rootScope) {
        expect(function() {
          $rootScope.$apply(function() {
            $rootScope.$apply();
          });
        }).toThrowMinErr('$rootScope', 'inprog', '$apply already in progress');
      }));


      it('should not clear the state when calling $apply during an $apply', angular.mock.inject(
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


      it('should throw an exception if $apply is called while flushing evalAsync queue', angular.mock.inject(
          function($rootScope) {
        expect(function() {
          $rootScope.$apply(function() {
            $rootScope.$evalAsync(function() {
              $rootScope.$apply();
            });
          });
        }).toThrowMinErr('$rootScope', 'inprog', '$digest already in progress');
      }));


      it('should throw an exception if $apply is called while a watch is being initialized', angular.mock.inject(
          function($rootScope) {
        var childScope1 = $rootScope.$new();
        childScope1.$watch('x', function() {
          childScope1.$apply();
        });
        expect(function() { childScope1.$apply(); }).toThrowMinErr('$rootScope', 'inprog', '$digest already in progress');
      }));


      it('should thrown an exception if $apply in called from a watch fn (after init)', angular.mock.inject(
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


  describe('$applyAsync', function() {
    beforeEach(angular.mock.module(function($exceptionHandlerProvider) {
      $exceptionHandlerProvider.mode('log');
    }));


    it('should evaluate in the context of specific $scope', angular.mock.inject(function($rootScope, $browser) {
      var scope = $rootScope.$new();
      scope.$applyAsync('x = "CODE ORANGE"');

      $browser.defer.flush();
      expect(scope.x).toBe('CODE ORANGE');
      expect($rootScope.x).toBeUndefined();
    }));


    it('should evaluate queued expressions in order', angular.mock.inject(function($rootScope, $browser) {
      $rootScope.x = [];
      $rootScope.$applyAsync('x.push("expr1")');
      $rootScope.$applyAsync('x.push("expr2")');

      $browser.defer.flush();
      expect($rootScope.x).toEqual(['expr1', 'expr2']);
    }));


    it('should evaluate subsequently queued items in same turn', angular.mock.inject(function($rootScope, $browser) {
      $rootScope.x = [];
      $rootScope.$applyAsync(function() {
        $rootScope.x.push('expr1');
        $rootScope.$applyAsync('x.push("expr2")');
        expect($browser.deferredFns.length).toBe(0);
      });

      $browser.defer.flush();
      expect($rootScope.x).toEqual(['expr1', 'expr2']);
    }));


    it('should pass thrown exceptions to $exceptionHandler', angular.mock.inject(function($rootScope, $browser, $exceptionHandler) {
      $rootScope.$applyAsync(function() {
        throw 'OOPS';
      });

      $browser.defer.flush();
      expect($exceptionHandler.errors).toEqual([
        'OOPS'
      ]);
    }));


    it('should evaluate subsequent expressions after an exception is thrown', angular.mock.inject(function($rootScope, $browser) {
      $rootScope.$applyAsync(function() {
        throw 'OOPS';
      });
      $rootScope.$applyAsync('x = "All good!"');

      $browser.defer.flush();
      expect($rootScope.x).toBe('All good!');
    }));


    it('should be cancelled if a $rootScope digest occurs before the next tick', angular.mock.inject(function($rootScope, $browser) {
      jest.spyOn($rootScope, '$apply');
      var cancel = jest.spyOn($browser.defer, 'cancel');
      var expression = jest.fn();

      $rootScope.$applyAsync(expression);
      $rootScope.$digest();
      expect(expression).toHaveBeenCalledTimes(1);
      expect(cancel).toHaveBeenCalledTimes(1);
      expression.mockReset();
      cancel.mockReset();

      // assert that we no longer are waiting to execute
      expect($browser.deferredFns.length).toBe(0);

      // assert that another digest won't call the function again
      $rootScope.$digest();
      expect(expression).not.toHaveBeenCalled();
      expect(cancel).not.toHaveBeenCalled();
    }));
  });

  describe('$$postDigest', function() {
    it('should process callbacks as a queue (FIFO) when the scope is digested', angular.mock.inject(function($rootScope) {
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

    it('should support $apply calls nested in $$postDigest callbacks', angular.mock.inject(function($rootScope) {
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

    it('should run a $$postDigest call on all child scopes when a parent scope is digested', angular.mock.inject(function($rootScope) {
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

    it('should run a $$postDigest call even if the child scope is isolated', angular.mock.inject(function($rootScope) {
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

  describe('events', function() {

    describe('$on', function() {

      it('should add listener for both $emit and $broadcast events', angular.mock.inject(function($rootScope) {
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


      it('should increment ancestor $$listenerCount entries', angular.mock.inject(function($rootScope) {
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


      describe('deregistration', function() {

        it('should return a function that deregisters the listener', angular.mock.inject(function($rootScope) {
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
        it('should deallocate the listener array entry', angular.mock.inject(function($rootScope) {
          var remove1 = $rootScope.$on('abc', angular.noop);
          $rootScope.$on('abc', angular.noop);

          expect($rootScope.$$listeners['abc'].length).toBe(2);
          expect(0 in $rootScope.$$listeners['abc']).toBe(true);

          remove1();

          expect($rootScope.$$listeners['abc'].length).toBe(2);
          expect(0 in $rootScope.$$listeners['abc']).toBe(false);
        }));


        it('should call next listener after removing the current listener via its own handler', angular.mock.inject(function($rootScope) {
          var listener1 = jest.fn(function() { remove1(); });
          var remove1 = $rootScope.$on('abc', listener1);

          var listener2 = jest.fn();
          $rootScope.$on('abc', listener2);

          var listener3 = jest.fn();
          $rootScope.$on('abc', listener3);

          $rootScope.$broadcast('abc');
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).toHaveBeenCalled();

          listener1.mockReset();
          listener2.mockReset();
          listener3.mockReset();

          $rootScope.$broadcast('abc');
          expect(listener1).not.toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).toHaveBeenCalled();
        }));


        it('should call all subsequent listeners when a previous listener is removed via a handler', angular.mock.inject(function($rootScope) {
          var listener1 = jest.fn();
          var remove1 = $rootScope.$on('abc', listener1);

          var listener2 = jest.fn(remove1);
          $rootScope.$on('abc', listener2);

          var listener3 = jest.fn();
          $rootScope.$on('abc', listener3);

          $rootScope.$broadcast('abc');
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).toHaveBeenCalled();

          listener1.mockReset();
          listener2.mockReset();
          listener3.mockReset();

          $rootScope.$broadcast('abc');
          expect(listener1).not.toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).toHaveBeenCalled();
        }));


        it('should not call listener when removed by previous', angular.mock.inject(function($rootScope) {
          var listener1 = jest.fn();
          $rootScope.$on('abc', listener1);

          var listener2 = jest.fn(function() { remove3(); });
          $rootScope.$on('abc', listener2);

          var listener3 = jest.fn();
          var remove3 = $rootScope.$on('abc', listener3);

          var listener4 = jest.fn();
          $rootScope.$on('abc', listener4);

          $rootScope.$broadcast('abc');
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).not.toHaveBeenCalled();
          expect(listener4).toHaveBeenCalled();

          listener1.mockReset();
          listener2.mockReset();
          listener3.mockReset();
          listener4.mockReset();

          $rootScope.$broadcast('abc');
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          expect(listener3).not.toHaveBeenCalled();
          expect(listener4).toHaveBeenCalled();
        }));


        it('should decrement ancestor $$listenerCount entries', angular.mock.inject(function($rootScope) {
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


        it('should not decrement $$listenerCount when called second time', angular.mock.inject(function($rootScope) {
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


    describe('$emit', function() {
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

      it('should bubble event up to the root scope', function() {
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>1>0>');
      });

      it('should allow all events on the same scope to run even if stopPropagation is called', function() {
        child.$on('myEvent', logger);
        grandChild.$on('myEvent', function(e) { e.stopPropagation(); });
        grandChild.$on('myEvent', logger);
        grandChild.$on('myEvent', logger);
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>2>2>');
      });

      it('should dispatch exceptions to the $exceptionHandler',
          angular.mock.inject(function($exceptionHandler) {
        child.$on('myEvent', function() { throw 'bubbleException'; });
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>1>0>');
        expect($exceptionHandler.errors).toEqual(['bubbleException']);
      }));


      it('should allow stopping event propagation', function() {
        child.$on('myEvent', function(event) { event.stopPropagation(); });
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>1>');
      });


      it('should forward method arguments', function() {
        child.$on('abc', function(event, arg1, arg2) {
          expect(event.name).toBe('abc');
          expect(arg1).toBe('arg1');
          expect(arg2).toBe('arg2');
        });
        child.$emit('abc', 'arg1', 'arg2');
      });


      it('should allow removing event listener inside a listener on $emit', function() {
        var spy1 = jest.fn();
        var spy2 = jest.fn();
        var spy3 = jest.fn();

        var remove1 = child.$on('evt', spy1);
        child.$on('evt', spy2);
        var remove3 = child.$on('evt', spy3);

        spy1.mockImplementation(remove1);

        expect(child.$$listeners['evt'].length).toBe(3);

        // should call all listeners and remove 1st
        child.$emit('evt');
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).toHaveBeenCalledTimes(1);
        expect(child.$$listeners['evt'].length).toBe(3); // cleanup will happen on next $emit

        spy1.mockReset();
        spy2.mockReset();
        spy3.mockReset();

        // should call only 2nd because 1st was already removed and 2nd removes 3rd
        spy2.mockImplementation(remove3);
        child.$emit('evt');
        expect(spy1).not.toHaveBeenCalled();
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).not.toHaveBeenCalled();
        expect(child.$$listeners['evt'].length).toBe(1);
      });


      it('should allow removing event listener inside a listener on $broadcast', function() {
        var spy1 = jest.fn();
        var spy2 = jest.fn();
        var spy3 = jest.fn();

        var remove1 = child.$on('evt', spy1);
        child.$on('evt', spy2);
        var remove3 = child.$on('evt', spy3);

        spy1.mockImplementation(remove1);

        expect(child.$$listeners['evt'].length).toBe(3);

        // should call all listeners and remove 1st
        child.$broadcast('evt');
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).toHaveBeenCalledTimes(1);
        expect(child.$$listeners['evt'].length).toBe(3); //cleanup will happen on next $broadcast

        spy1.mockReset();
        spy2.mockReset();
        spy3.mockReset();

        // should call only 2nd because 1st was already removed and 2nd removes 3rd
        spy2.mockImplementation(remove3);
        child.$broadcast('evt');
        expect(spy1).not.toHaveBeenCalled();
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).not.toHaveBeenCalled();
        expect(child.$$listeners['evt'].length).toBe(1);
      });


      describe('event object', function() {
        it('should have methods/properties', function() {
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


        it('should have its `currentScope` property set to null after emit', function() {
          var event;

          child.$on('myEvent', function(e) {
            event = e;
          });
          grandChild.$emit('myEvent');

          expect(event.currentScope).toBe(null);
          expect(event.targetScope).toBe(grandChild);
          expect(event.name).toBe('myEvent');
        });


        it('should have preventDefault method and defaultPrevented property', function() {
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


    describe('$broadcast', function() {
      describe('event propagation', function() {
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


        it('should broadcast an event from the root scope', angular.mock.inject(function($rootScope) {
          $rootScope.$broadcast('myEvent');
          expect(log).toBe('0>1>11>2>21>211>22>23>3>');
        }));


        it('should broadcast an event from a child scope', function() {
          child2.$broadcast('myEvent');
          expect(log).toBe('2>21>211>22>23>');
        });


        it('should broadcast an event from a leaf scope with a sibling', function() {
          grandChild22.$broadcast('myEvent');
          expect(log).toBe('22>');
        });


        it('should broadcast an event from a leaf scope without a sibling', function() {
          grandChild23.$broadcast('myEvent');
          expect(log).toBe('23>');
        });


        it('should not not fire any listeners for other events', angular.mock.inject(function($rootScope) {
          $rootScope.$broadcast('fooEvent');
          expect(log).toBe('');
        }));


        it('should not descend past scopes with a $$listerCount of 0 or undefined',
            angular.mock.inject(function($rootScope) {
              var EVENT = 'fooEvent';
              var spy = jest.fn();

              // Precondition: There should be no listeners for fooEvent.
              expect($rootScope.$$listenerCount[EVENT]).toBeUndefined();

              // Add a spy listener to a child scope.
              $rootScope.$$childHead.$$listeners[EVENT] = [spy];

              // $rootScope's count for 'fooEvent' is undefined, so spy should not be called.
              $rootScope.$broadcast(EVENT);
              expect(spy).not.toHaveBeenCalled();
            }));


        it('should return event object', function() {
          var result = child1.$broadcast('some');

          expect(result).toBeDefined();
          expect(result.name).toBe('some');
          expect(result.targetScope).toBe(child1);
        });
      });


      describe('listener', function() {
        it('should receive event object', angular.mock.inject(function($rootScope) {
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


        it('should have the event\'s `currentScope` property set to null after broadcast',
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


        it('should support passing messages as varargs', angular.mock.inject(function($rootScope) {
          var scope = $rootScope;
          var child = scope.$new();
          var args;

          child.$on('fooEvent', function(...providedArgs) {
            args = providedArgs;
          });
          scope.$broadcast('fooEvent', 'do', 're', 'me', 'fa');

          expect(args.length).toBe(5);
          expect(args.slice(1)).toEqual(['do', 're', 'me', 'fa']);
        }));
      });
    });


    it('should allow recursive $emit/$broadcast', angular.mock.inject(function($rootScope) {
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


    it('should allow recursive $emit/$broadcast between parent/child', angular.mock.inject(function($rootScope) {
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

  describe('doc examples', function() {

    it('should properly fire off watch listeners upon scope changes', angular.mock.inject(function($rootScope) {
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
