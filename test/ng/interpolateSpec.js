'use strict';

/* eslint-disable no-script-url */
 describe('$interpolate', () => {

  test('should return the interpolation object when there are no bindings and textOnly is undefined',
      angular.mock.inject(function($interpolate) {
    var interpolateFn = $interpolate('some text');

    expect(interpolateFn.exp).toBe('some text');
    expect(interpolateFn.expressions).toEqual([]);

    expect(interpolateFn({})).toBe('some text');
  }));


  test('should return undefined when there are no bindings and textOnly is set to true',
      angular.mock.inject(function($interpolate) {
    expect($interpolate('some text', true)).toBeUndefined();
  }));

  test('should return undefined when there are bindings and strict is set to true',
      angular.mock.inject(function($interpolate) {
    expect($interpolate('test {{foo}}', false, null, true)({})).toBeUndefined();
  }));

  test('should suppress falsy objects', angular.mock.inject(function($interpolate) {
    expect($interpolate('{{undefined}}')({})).toEqual('');
    expect($interpolate('{{null}}')({})).toEqual('');
    expect($interpolate('{{a.b}}')({})).toEqual('');
  }));

  test('should jsonify objects', angular.mock.inject(function($interpolate) {
    expect($interpolate('{{ {} }}')({})).toEqual('{}');
    expect($interpolate('{{ true }}')({})).toEqual('true');
    expect($interpolate('{{ false }}')({})).toEqual('false');
  }));

  test('should use custom toString when present', angular.mock.inject(function($interpolate, $rootScope) {
    var context = {
      a: {
        toString() {
          return 'foo';
        }
      }
    };

    expect($interpolate('{{ a }}')(context)).toEqual('foo');
  }));

  test('should NOT use toString on array objects', angular.mock.inject(function($interpolate) {
    expect($interpolate('{{a}}')({ a: [] })).toEqual('[]');
  }));


  test('should NOT use toString on Date objects', angular.mock.inject(function($interpolate) {
    var date = new Date(2014, 10, 10);
    expect($interpolate('{{a}}')({ a: date })).toBe(JSON.stringify(date));
    expect($interpolate('{{a}}')({ a: date })).not.toEqual(date.toString());
  }));


  test('should return interpolation function', angular.mock.inject(function($interpolate, $rootScope) {
    var interpolateFn = $interpolate('Hello {{name}}!');

    expect(interpolateFn.exp).toBe('Hello {{name}}!');
    expect(interpolateFn.expressions).toEqual(['name']);

    var scope = $rootScope.$new();
    scope.name = 'Bubu';

    expect(interpolateFn(scope)).toBe('Hello Bubu!');
  }));


  test('should ignore undefined model', angular.mock.inject(function($interpolate) {
    expect($interpolate('Hello {{\'World\'}}{{foo}}')({})).toBe('Hello World');
  }));


  test('should interpolate with undefined context', angular.mock.inject(function($interpolate) {
    expect($interpolate('Hello, world!{{bloop}}')()).toBe('Hello, world!');
  }));

  describe('watching', () => {
    test('should be watchable with any input types', angular.mock.inject(function($interpolate, $rootScope) {
      var lastVal;
      $rootScope.$watch($interpolate('{{i}}'), function(val) {
        lastVal = val;
      });
      $rootScope.$apply();
      expect(lastVal).toBe('');

      $rootScope.i = null;
      $rootScope.$apply();
      expect(lastVal).toBe('');

      $rootScope.i = '';
      $rootScope.$apply();
      expect(lastVal).toBe('');

      $rootScope.i = 0;
      $rootScope.$apply();
      expect(lastVal).toBe('0');

      $rootScope.i = [0];
      $rootScope.$apply();
      expect(lastVal).toBe('[0]');

      $rootScope.i = {a: 1, b: 2};
      $rootScope.$apply();
      expect(lastVal).toBe('{"a":1,"b":2}');
    }));

    test('should be watchable with literal values', angular.mock.inject(function($interpolate, $rootScope) {
      var lastVal;
      $rootScope.$watch($interpolate('{{1}}{{"2"}}{{true}}{{[false]}}{{ {a: 2} }}'), function(val) {
        lastVal = val;
      });
      $rootScope.$apply();
      expect(lastVal).toBe('12true[false]{"a":2}');

      expect($rootScope.$countWatchers()).toBe(0);
    }));

    test('should respect one-time bindings for each individual expression', angular.mock.inject(function($interpolate, $rootScope) {
      var calls = [];
      $rootScope.$watch($interpolate('{{::a | limitTo:1}} {{::s}} {{::i | number}}'), function(val) {
        calls.push(val);
      });

      $rootScope.$apply();
      expect(calls.length).toBe(1);

      $rootScope.a = [1];
      $rootScope.$apply();
      expect(calls.length).toBe(2);
      expect(calls[1]).toBe('[1]  ');

      $rootScope.a = [0];
      $rootScope.$apply();
      expect(calls.length).toBe(2);

      $rootScope.i = $rootScope.a = 123;
      $rootScope.s = 'str!';
      $rootScope.$apply();
      expect(calls.length).toBe(3);
      expect(calls[2]).toBe('[1] str! 123');

      expect($rootScope.$countWatchers()).toBe(0);
    }));

    test('should respect one-time bindings for literals', angular.mock.inject(function($interpolate, $rootScope) {
      var calls = [];
      $rootScope.$watch($interpolate('{{ ::{x: x} }}'), function(val) {
        calls.push(val);
      });

      $rootScope.$apply();
      expect(calls.pop()).toBe('{}');

      $rootScope.$apply('x = 1');
      expect(calls.pop()).toBe('{"x":1}');

      $rootScope.$apply('x = 2');
      expect(calls.pop()).toBeUndefined();
    }));

    test('should stop watching strings with no expressions after first execution',
      angular.mock.inject(function($interpolate, $rootScope) {
        var spy = jest.fn();
        $rootScope.$watch($interpolate('foo'), spy);
        $rootScope.$digest();
        expect($rootScope.$countWatchers()).toBe(0);
        expect(spy).toHaveBeenCalledWith('foo', 'foo', $rootScope);
        expect(spy).toHaveBeenCalledTimes(1);
      })
    );

    test('should stop watching strings with only constant expressions after first execution',
      angular.mock.inject(function($interpolate, $rootScope) {
        var spy = jest.fn();
        $rootScope.$watch($interpolate('foo {{42}}'), spy);
        $rootScope.$digest();
        expect($rootScope.$countWatchers()).toBe(0);
        expect(spy).toHaveBeenCalledWith('foo 42', 'foo 42', $rootScope);
        expect(spy).toHaveBeenCalledTimes(1);
      })
    );
  });

  describe('interpolation escaping', () => {
    var obj;
     beforeEach(() => {
      obj = {foo: 'Hello', bar: 'World'};
    });


    test('should support escaping interpolation signs', angular.mock.inject(function($interpolate) {
      expect($interpolate('\\{\\{')(obj)).toBe('{{');
      expect($interpolate('{{foo}} \\{\\{bar\\}\\}')(obj)).toBe('Hello {{bar}}');
      expect($interpolate('\\{\\{foo\\}\\} {{bar}}')(obj)).toBe('{{foo}} World');
    }));


    test('should unescape multiple expressions', angular.mock.inject(function($interpolate) {
      expect($interpolate('\\{\\{foo\\}\\}\\{\\{bar\\}\\} {{foo}}')(obj)).toBe('{{foo}}{{bar}} Hello');
      expect($interpolate('{{foo}}\\{\\{foo\\}\\}\\{\\{bar\\}\\}')(obj)).toBe('Hello{{foo}}{{bar}}');
      expect($interpolate('\\{\\{foo\\}\\}{{foo}}\\{\\{bar\\}\\}')(obj)).toBe('{{foo}}Hello{{bar}}');
      expect($interpolate('{{foo}}\\{\\{foo\\}\\}{{bar}}\\{\\{bar\\}\\}{{foo}}')(obj)).toBe('Hello{{foo}}World{{bar}}Hello');
    }));


    test('should support escaping custom interpolation start/end symbols', () => {
      angular.mock.module(function($interpolateProvider) {
        $interpolateProvider.startSymbol('[[');
        $interpolateProvider.endSymbol(']]');
      });
      angular.mock.inject(function($interpolate) {
        expect($interpolate('[[foo]] \\[\\[bar\\]\\]')(obj)).toBe('Hello [[bar]]');
      });
    });


    test('should unescape incomplete escaped expressions', angular.mock.inject(function($interpolate) {
      expect($interpolate('\\{\\{foo{{foo}}')(obj)).toBe('{{fooHello');
      expect($interpolate('\\}\\}foo{{foo}}')(obj)).toBe('}}fooHello');
      expect($interpolate('foo{{foo}}\\{\\{')(obj)).toBe('fooHello{{');
      expect($interpolate('foo{{foo}}\\}\\}')(obj)).toBe('fooHello}}');
    }));


    test('should not unescape markers within expressions', angular.mock.inject(function($interpolate) {
      expect($interpolate('{{"\\\\{\\\\{Hello, world!\\\\}\\\\}"}}')(obj)).toBe('\\{\\{Hello, world!\\}\\}');
      expect($interpolate('{{"\\{\\{Hello, world!\\}\\}"}}')(obj)).toBe('{{Hello, world!}}');
      expect(function() {
        $interpolate('{{\\{\\{foo\\}\\}}}')(obj);
      }).toThrowMinErr('$parse', 'lexerr',
        'Lexer Error: Unexpected next character  at columns 0-0 [\\] in expression [\\{\\{foo\\}\\]');
    }));


    // This test demonstrates that the web-server is responsible for escaping every single instance
    // of interpolation start/end markers in an expression which they do not wish to evaluate,
    // because AngularJS will not protect them from being evaluated (due to the added complexity
    // and maintenance burden of context-sensitive escaping)
    test('should evaluate expressions between escaped start/end symbols', angular.mock.inject(function($interpolate) {
      expect($interpolate('\\{\\{Hello, {{bar}}!\\}\\}')(obj)).toBe('{{Hello, World!}}');
    }));
  });


  describe('interpolating in a trusted context', () => {
    var sce;
     beforeEach(() => {
      function log() {}
      var fakeLog = {log: log, warn: log, info: log, error: log};
      angular.mock.module(function($provide, $sceProvider) {
        $provide.value('$log', fakeLog);
        $sceProvider.enabled(true);
      });
      angular.mock.inject(['$sce', function($sce) { sce = $sce; }]);
    });

    test('should NOT interpolate non-trusted expressions', angular.mock.inject(function($interpolate, $rootScope) {
      var scope = $rootScope.$new();
      scope.foo = 'foo';

      expect(function() {
        $interpolate('{{foo}}', true, sce.CSS)(scope);
      }).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{foo}}\nError: [$sce:unsafe] ' +
          'Attempting to use an unsafe value in a safe context.');
    }));

    test('should NOT interpolate mistyped expressions', angular.mock.inject(function($interpolate, $rootScope) {
      var scope = $rootScope.$new();
      scope.foo = sce.trustAsCss('foo');

      expect(function() {
        $interpolate('{{foo}}', true, sce.HTML)(scope);
      }).toThrowMinErr(
          '$interpolate', 'interr', 'Can\'t interpolate: {{foo}}\nError: [$sce:unsafe] ' +
          'Attempting to use an unsafe value in a safe context.');
    }));

    test('should interpolate trusted expressions in a regular context', angular.mock.inject(function($interpolate) {
      var foo = sce.trustAsCss('foo');
      expect($interpolate('{{foo}}', true)({foo: foo})).toBe('foo');
    }));

    test('should interpolate trusted expressions in a specific trustedContext', angular.mock.inject(function($interpolate) {
      var foo = sce.trustAsCss('foo');
      expect($interpolate('{{foo}}', true, sce.CSS)({foo: foo})).toBe('foo');
    }));

    // The concatenation of trusted values does not necessarily result in a trusted value.  (For
    // instance, you can construct evil JS code by putting together pieces of JS strings that are by
    // themselves safe to execute in isolation). Therefore, some contexts disable it, such as CSS.
    test('should NOT interpolate trusted expressions with multiple parts', angular.mock.inject(function($interpolate) {
      var foo = sce.trustAsCss('foo');
      var bar = sce.trustAsCss('bar');
      expect(function() {
        return $interpolate('{{foo}}{{bar}}', true, sce.CSS)({foo: foo, bar: bar});
      }).toThrowMinErr(
                '$interpolate', 'interr', 'Error while interpolating: {{foo}}{{bar}}\n' +
                'Strict Contextual Escaping disallows interpolations that concatenate multiple ' +
                'expressions when a trusted value is required.  See http://docs.angularjs.org/api/ng.$sce');
    }));
  });


  describe('provider', () => {
    beforeEach(angular.mock.module(function($interpolateProvider) {
      $interpolateProvider.startSymbol('--');
      $interpolateProvider.endSymbol('--');
    }));

    test('should not get confused with same markers', angular.mock.inject(function($interpolate) {
      expect($interpolate('---').expressions).toEqual([]);
      expect($interpolate('----')({})).toEqual('');
      expect($interpolate('--1--')({})).toEqual('1');
    }));
  });

  describe('parseBindings', () => {
    test('should Parse Text With No Bindings', angular.mock.inject(function($interpolate) {
      expect($interpolate('a').expressions).toEqual([]);
    }));

    test('should Parse Empty Text', angular.mock.inject(function($interpolate) {
      expect($interpolate('').expressions).toEqual([]);
    }));

    test('should Parse Inner Binding', angular.mock.inject(function($interpolate) {
      var interpolateFn = $interpolate('a{{b}}C');
      var expressions = interpolateFn.expressions;
      expect(expressions).toEqual(['b']);
      expect(interpolateFn({b: 123})).toEqual('a123C');
    }));

    test('should Parse Ending Binding', angular.mock.inject(function($interpolate) {
      var interpolateFn = $interpolate('a{{b}}');
      var expressions = interpolateFn.expressions;
      expect(expressions).toEqual(['b']);
      expect(interpolateFn({b: 123})).toEqual('a123');
    }));

    test('should Parse Begging Binding', angular.mock.inject(function($interpolate) {
      var interpolateFn = $interpolate('{{b}}c');
      var expressions = interpolateFn.expressions;
      expect(expressions).toEqual(['b']);
      expect(interpolateFn({b: 123})).toEqual('123c');
    }));

    test('should Parse Loan Binding', angular.mock.inject(function($interpolate) {
      var interpolateFn = $interpolate('{{b}}');
      var expressions = interpolateFn.expressions;
      expect(expressions).toEqual(['b']);
      expect(interpolateFn({b: 123})).toEqual('123');
    }));

    test('should Parse Two Bindings', angular.mock.inject(function($interpolate) {
      var interpolateFn = $interpolate('{{b}}{{c}}');
      var expressions = interpolateFn.expressions;
      expect(expressions).toEqual(['b', 'c']);
      expect(interpolateFn({b: 111, c: 222})).toEqual('111222');
    }));

    test('should Parse Two Bindings With Text In Middle', angular.mock.inject(function($interpolate) {
      var interpolateFn = $interpolate('{{b}}x{{c}}');
      var expressions = interpolateFn.expressions;
      expect(expressions).toEqual(['b', 'c']);
      expect(interpolateFn({b: 111, c: 222})).toEqual('111x222');
    }));

    test('should Parse Multiline', angular.mock.inject(function($interpolate) {
      var interpolateFn = $interpolate('"X\nY{{A\n+B}}C\nD"');
      var expressions = interpolateFn.expressions;
      expect(expressions).toEqual(['A\n+B']);
      expect(interpolateFn({'A': 'aa', 'B': 'bb'})).toEqual('"X\nYaabbC\nD"');
    }));
  });


  describe('isTrustedContext', () => {
    test('should NOT interpolate a multi-part expression when isTrustedContext is RESOURCE_URL', angular.mock.inject(function($sce, $interpolate) {
      var isTrustedContext = $sce.RESOURCE_URL;
      expect(function() {
          $interpolate('constant/{{var}}', true, isTrustedContext)('val');
        }).toThrowMinErr(
            '$interpolate', 'interr',
            'Can\'t interpolate: constant/{{var}}\nError: [$interpolate:noconcat] Error while ' +
            'interpolating: constant/{{var}}\nStrict Contextual Escaping disallows interpolations ' +
            'that concatenate multiple expressions when a trusted value is required.  ' +
            'See http://docs.angularjs.org/api/ng.$sce');
      expect(function() {
        $interpolate('{{var}}/constant', true, isTrustedContext)('val');
      }).toThrowMinErr(
          '$interpolate', 'interr',
            'Can\'t interpolate: {{var}}/constant\nError: [$interpolate:noconcat] Error while ' +
            'interpolating: {{var}}/constant\nStrict Contextual Escaping disallows interpolations ' +
            'that concatenate multiple expressions when a trusted value is required.  ' +
            'See http://docs.angularjs.org/api/ng.$sce');
            expect(function() {
          $interpolate('{{foo}}{{bar}}', true, isTrustedContext)('val');
        }).toThrowMinErr(
            '$interpolate', 'interr',
              'Can\'t interpolate: {{foo}}{{bar}}\nError: [$interpolate:noconcat] Error while ' +
              'interpolating: {{foo}}{{bar}}\nStrict Contextual Escaping disallows interpolations ' +
              'that concatenate multiple expressions when a trusted value is required.  ' +
              'See http://docs.angularjs.org/api/ng.$sce');
    }));

    test('should interpolate a multi-part expression when isTrustedContext is false', angular.mock.inject(function($interpolate) {
      expect($interpolate('some/{{id}}')({})).toEqual('some/');
      expect($interpolate('some/{{id}}')({id: 1})).toEqual('some/1');
      expect($interpolate('{{foo}}{{bar}}')({foo: 1, bar: 2})).toEqual('12');
    }));


    test('should interpolate a multi-part expression when isTrustedContext is URL', angular.mock.inject(function($sce, $interpolate) {
      expect($interpolate('some/{{id}}', true, $sce.URL)({})).toEqual('some/');
      expect($interpolate('some/{{id}}', true, $sce.URL)({id: 1})).toEqual('some/1');
      expect($interpolate('{{foo}}{{bar}}', true, $sce.URL)({foo: 1, bar: 2})).toEqual('12');
    }));


    test('should interpolate and sanitize a multi-part expression when isTrustedContext is URL', angular.mock.inject(function($sce, $interpolate) {
      expect($interpolate('some/{{id}}', true, $sce.URL)({})).toEqual('some/');
      expect($interpolate('some/{{id}}', true, $sce.URL)({id: 'javascript:'})).toEqual('some/javascript:');
      expect($interpolate('{{foo}}{{bar}}', true, $sce.URL)({foo: 'javascript:', bar: 'javascript:'})).toEqual('unsafe:javascript:javascript:');
    }));



  });


  describe('startSymbol', () => {

    beforeEach(angular.mock.module(function($interpolateProvider) {
      expect($interpolateProvider.startSymbol()).toBe('{{');
      $interpolateProvider.startSymbol('((');
    }));


    test('should expose the startSymbol in config phase', angular.mock.module(function($interpolateProvider) {
      expect($interpolateProvider.startSymbol()).toBe('((');
    }));


    test('should expose the startSymbol in run phase', angular.mock.inject(function($interpolate) {
      expect($interpolate.startSymbol()).toBe('((');
    }));


    test('should not get confused by matching start and end symbols', () => {
      angular.mock.module(function($interpolateProvider) {
        $interpolateProvider.startSymbol('--');
        $interpolateProvider.endSymbol('--');
      });

      angular.mock.inject(function($interpolate) {
        expect($interpolate('---').expressions).toEqual([]);
        expect($interpolate('----')({})).toEqual('');
        expect($interpolate('--1--')({})).toEqual('1');
      });
    });
  });


  describe('endSymbol', () => {

    beforeEach(angular.mock.module(function($interpolateProvider) {
      expect($interpolateProvider.endSymbol()).toBe('}}');
      $interpolateProvider.endSymbol('))');
    }));


    test('should expose the endSymbol in config phase', angular.mock.module(function($interpolateProvider) {
      expect($interpolateProvider.endSymbol()).toBe('))');
    }));


    test('should expose the endSymbol in run phase', angular.mock.inject(function($interpolate) {
      expect($interpolate.endSymbol()).toBe('))');
    }));
  });

});
