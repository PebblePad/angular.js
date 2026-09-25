'use strict';
 describe('errors', () => {
  var originalObjectMaxDepthInErrorMessage = ngInternals.minErrConfig.objectMaxDepth;
  var originalUrlErrorParamsEnabled =  ngInternals.minErrConfig.urlErrorParamsEnabled;

   afterEach(() => {
    ngInternals.minErrConfig.objectMaxDepth = originalObjectMaxDepthInErrorMessage;
    ngInternals.minErrConfig.urlErrorParamsEnabled = originalUrlErrorParamsEnabled;
  });

  describe('errorHandlingConfig', () => {
    describe('objectMaxDepth',function() {
      test('should get default objectMaxDepth', () => {
        expect(angular.errorHandlingConfig().objectMaxDepth).toBe(5);
      });

      test('should set objectMaxDepth', () => {
        angular.errorHandlingConfig({objectMaxDepth: 3});
        expect(angular.errorHandlingConfig().objectMaxDepth).toBe(3);
      });

      test('should not change objectMaxDepth when undefined is supplied', () => {
        angular.errorHandlingConfig({objectMaxDepth: undefined});
        expect(angular.errorHandlingConfig().objectMaxDepth).toBe(originalObjectMaxDepthInErrorMessage);
      });

      test.each([NaN, null, true, false, -1, 0].map((prop) => ({ prop })))(
          'should set objectMaxDepth to NaN when $prop is supplied', function({ prop: maxDepth }) {
            angular.errorHandlingConfig({objectMaxDepth: maxDepth});
            expect(angular.errorHandlingConfig().objectMaxDepth).toBeNaN();
          });
    });


    describe('urlErrorParamsEnabled',function() {

      test('should get default urlErrorParamsEnabled', () => {
        expect(angular.errorHandlingConfig().urlErrorParamsEnabled).toBe(true);
      });

      test('should set urlErrorParamsEnabled', () => {
        angular.errorHandlingConfig({urlErrorParamsEnabled: false});
        expect(angular.errorHandlingConfig().urlErrorParamsEnabled).toBe(false);
        angular.errorHandlingConfig({urlErrorParamsEnabled: true});
        expect(angular.errorHandlingConfig().urlErrorParamsEnabled).toBe(true);
      });

      test('should not change its value when non-boolean is supplied', () => {
        angular.errorHandlingConfig({urlErrorParamsEnabled: 123});
        expect(angular.errorHandlingConfig().urlErrorParamsEnabled).toBe(originalUrlErrorParamsEnabled);
      });
    });

  });

  describe('minErr', () => {
    var supportStackTraces = function() {
      var e = new Error();
      return angular.isDefined(e.stack);
    };
    var emptyTestError = angular.$$minErr();
    var testError = angular.$$minErr('test');

    test('should return an Error factory', () => {
      var myError = testError('test', 'Oops');
      expect(myError instanceof Error).toBe(true);
    });

    test('should generate stack trace at the frame where the angular.$$minErr instance was called', () => {
      var myError;

      function someFn() {
        function nestedFn() {
          myError = testError('fail', 'I fail!');
        }
        nestedFn();
      }

      someFn();

      // only Chrome, Firefox have stack
      if (!supportStackTraces()) return;

      expect(myError.stack).toMatch(/^[.\s\S]+nestedFn[.\s\S]+someFn.+/);
    });

    test('should interpolate string arguments without quotes', () => {
      var myError = testError('1', 'This {0} is "{1}"', 'foo', 'bar');
      expect(myError.message).toMatch(/^\[test:1] This foo is "bar"/);
    });

    test('should interpolate non-string arguments', () => {
      var arr = [1, 2, 3];
      var obj = {a: 123, b: 'baar'};
      var anonFn = function(something) { return something; };
      var namedFn = function foo(something) { return something; };
      var myError;

      myError = testError('26', 'arr: {0}; obj: {1}; anonFn: {2}; namedFn: {3}',
                                arr,      obj,      anonFn,      namedFn);

      expect(myError.message).toContain('[test:26] arr: [1,2,3]; obj: {"a":123,"b":"baar"};');
      // Support: IE 9-11 only
      // IE does not add space after "function"
      expect(myError.message).toMatch(/anonFn: function\s?\(something\);/);
      expect(myError.message).toContain('namedFn: function foo(something)');
    });

    test('should not suppress falsy objects', () => {
      var myError = testError('26', 'false: {0}; zero: {1}; null: {2}; undefined: {3}; emptyStr: {4}',
                                    false,      0,         null,      undefined,      '');
      expect(myError.message).
          toMatch(/^\[test:26] false: false; zero: 0; null: null; undefined: undefined; emptyStr: /);
    });

    test('should handle arguments that are objects with cyclic references', () => {
      var a = { b: { } };
      a.b.a = a;

      var myError = testError('26', 'a is {0}', a);
      expect(myError.message).toMatch(/a is {"b":{"a":"..."}}/);
    });

    test('should handle arguments that are objects with max depth', () => {
      var a = {b: {c: {d: {e: {f: {g: 1}}}}}};

      var myError = testError('26', 'a when objectMaxDepth is default=5 is {0}', a);
      expect(myError.message).toMatch(/a when objectMaxDepth is default=5 is {"b":{"c":{"d":{"e":{"f":"..."}}}}}/);

      angular.errorHandlingConfig({objectMaxDepth: 1});
      myError = testError('26', 'a when objectMaxDepth is set to 1 is {0}', a);
      expect(myError.message).toMatch(/a when objectMaxDepth is set to 1 is {"b":"..."}/);

      angular.errorHandlingConfig({objectMaxDepth: 2});
      myError = testError('26', 'a when objectMaxDepth is set to 2 is {0}', a);
      expect(myError.message).toMatch(/a when objectMaxDepth is set to 2 is {"b":{"c":"..."}}/);

      angular.errorHandlingConfig({objectMaxDepth: undefined});
      myError = testError('26', 'a when objectMaxDepth is set to undefined is {0}', a);
      expect(myError.message).toMatch(/a when objectMaxDepth is set to undefined is {"b":{"c":"..."}}/);
    });

    test.each([NaN, null, true, false, -1, 0].map((prop) => ({ prop })))(
        'should handle arguments that are objects and ignore max depth when objectMaxDepth = $prop', function({ prop: maxDepth }) {
        var a = {b: {c: {d: {e: {f: {g: 1}}}}}};

        angular.errorHandlingConfig({objectMaxDepth: maxDepth});
        var myError = testError('26', 'a is {0}', a);
        expect(myError.message).toMatch(/a is {"b":{"c":{"d":{"e":{"f":{"g":1}}}}}}/);
      });

    test('should preserve interpolation markers when fewer arguments than needed are provided', () => {
      // this way we can easily see if we are passing fewer args than needed

      var foo = 'Fooooo';

      var myError = testError('26', 'This {0} is {1} on {2}', foo);

      expect(myError.message).toMatch(/^\[test:26] This Fooooo is \{1\} on \{2\}/);
    });


    test('should pass through the message if no interpolation is needed', () => {
      var myError = testError('26', 'Something horrible happened!');
      expect(myError.message).toMatch(/^\[test:26] Something horrible happened!/);
    });

    test('should include a namespace in the message only if it is namespaced', () => {
      var myError = emptyTestError('26', 'This is a {0}', 'Foo');
      var myNamespacedError = testError('26', 'That is a {0}', 'Bar');
      expect(myError.message).toMatch(/^\[26] This is a Foo/);
      expect(myNamespacedError.message).toMatch(/^\[test:26] That is a Bar/);
    });


    test('should accept an optional 2nd argument to construct custom errors', () => {
      var normalMinErr = angular.$$minErr('normal');
      expect(normalMinErr('acode', 'aproblem') instanceof TypeError).toBe(false);
      var typeMinErr = angular.$$minErr('type', TypeError);
      expect(typeMinErr('acode', 'aproblem') instanceof TypeError).toBe(true);
    });


    test('should include a properly formatted error reference URL in the message', () => {
      // to avoid maintaining the root URL in two locations, we only validate the parameters
      expect(testError('acode', 'aproblem', 'a', 'b', 'value with space').message)
        .toMatch(/^[\s\S]*\?p0=a&p1=b&p2=value%20with%20space$/);
    });

    test('should strip error reference urls from the error message parameters', () => {
      var firstError = testError('firstcode', 'longer string and so on');

      var error = testError('secondcode', 'description {0}, and {1}', 'a', firstError.message);

      expect(error.message).toBe(('[test:secondcode] description a, and [test:firstcode] longer ' +
        'string and so on\n\nhttps://errors.angularjs.org/"NG_VERSION_FULL"/test/' +
        'secondcode?p0=a&p1=%5Btest%3Afirstcode%5D%20longer%20string%20and%20so%20on%0Ahttps' +
        '%3A%2F%2Ferrors.angularjs.org%2F%22NG_VERSION_FULL%22%2Ftest%2Ffirstcode').replaceAll("NG_VERSION_FULL", angular.version.full));
    });

    test('should not generate URL query parameters when urlErrorParamsEnabled is  false', () => {

      angular.errorHandlingConfig({urlErrorParamsEnabled: false});

      expect(testError('acode', 'aproblem', 'a', 'b', 'c').message).toBe(('[test:acode] aproblem\n' +
        'https://errors.angularjs.org/"NG_VERSION_FULL"/test/acode').replaceAll("NG_VERSION_FULL", angular.version.full));
    });
  });
});
