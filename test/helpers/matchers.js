'use strict';

beforeEach(function() {

  function cssMatcher(presentClasses, absentClasses) {
    return function(actual) {
      var element = angular.element(actual);
      var present = true;
      var absent = false;

      angular.forEach(presentClasses.split(' '), function(className) {
        present = present && element.hasClass(className);
      });

      angular.forEach(absentClasses.split(' '), function(className) {
        absent = absent || element.hasClass(className);
      });

      const className = element[0].className;
      const passed = present && !absent;
      if (passed) {
        return {
          message: () => `Expected element not to have ${presentClasses}, but had ${className}`,
          pass: passed
        }
      }

      return {
        message: absentClasses
          ? () => `Expected element to have ${presentClasses} and not ${absentClasses}, but had ${className}`
          : () => `Expected element to have ${presentClasses}, but had ${className}`,
        pass: passed
      };
    };
  }

  function DOMTester(a, b) {
    if (a && b && a.nodeType > 0 && b.nodeType > 0) {
      return a === b;
    }
  }

  function isNgElementHidden(element) {
    // we need to check element.getAttribute for SVG nodes
    var hidden = true;
    angular.forEach(angular.element(element), function(element) {
      if ((' '  + (element.getAttribute('class') || '') + ' ').indexOf(' ng-hide ') === -1) {
        hidden = false;
      }
    });
    return hidden;
  }

  function MinErrMatcher(namespace, code, content, wording) {
    var codeRegex = new RegExp('^' + escapeRegexp('[' + namespace + ':' + code + ']'));
    var contentRegex = angular.isUndefined(content) || content instanceof RegExp ?
        content : new RegExp(escapeRegexp(content));

    this.test = test;

    function escapeRegexp(str) {
      // This function escapes all special regex characters.
      // We use it to create matching regex from arbitrary strings.
      // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
      return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
    }

    function test(exception) {
      var exceptionMessage = (exception && exception.message) || exception || '';

      var codeMatches = codeRegex.test(exceptionMessage);
      var contentMatches = angular.isUndefined(contentRegex) || contentRegex.test(exceptionMessage);
      const passed = codeMatches && contentMatches;
      const isNot = passed;

      const message = () => {
        return 'Expected ' + wording.inputType + (isNot ? ' not' : '') + ' to ' +
          wording.expectedAction + ' ' + namespace + 'MinErr(\'' + code + '\')' +
          (contentRegex ? ' matching ' + contentRegex.toString() : '') +
          (!exception ? '.' : ', but it ' + wording.actualAction + ': ' + exceptionMessage);
      };

      return {
        message: message,
        pass: passed
      };
    }
  }

  expect.extend({
    toBeEmpty: cssMatcher('ng-empty', 'ng-not-empty'),
    toBeNotEmpty: cssMatcher('ng-not-empty', 'ng-empty'),
    toBeInvalid: cssMatcher('ng-invalid', 'ng-valid'),
    toBeValid: cssMatcher('ng-valid', 'ng-invalid'),
    toBeDirty: cssMatcher('ng-dirty', 'ng-pristine'),
    toBePristine: cssMatcher('ng-pristine', 'ng-dirty'),
    toBeUntouched: cssMatcher('ng-untouched', 'ng-touched'),
    toBeTouched: cssMatcher('ng-touched', 'ng-untouched'),

    toBeAPromise(actual) {
      const passed = actual && typeof actual.then === 'function' && typeof actual.catch === 'function' && typeof actual.finally === 'function';
      return {
        message: passed
          ? () => "Expected object not to be a promise"
          : () => "Expected object to be a promise",
        pass: passed,
      };
    },

    toBeShown(actual) {
      const passed = !isNgElementHidden(actual);

      return {
        message: passed
          ? () => "Expected element to have the ng-hide class"
          : () => "Expected element not to have the ng-hide class",
        pass: passed
      };
    },

    toBeHidden(actual) {
      const passed = isNgElementHidden(actual);

      return {
        message: passed
          ? () => "Expected element not to have the ng-hide class"
          : () => "Expected element to have the ng-hide class",
        pass: passed
      };
    },

    toEqual(actual, expected) {
        if (actual && actual.$$log) {
          actual = (typeof expected === 'string')
              ? actual.toString()
              : actual.toArray();
        }
      const passed = this.equals(actual, expected, [DOMTester]);
      return {
          message: passed
            ? () => `Expected ${this.utils.stringify(actual)} not to equal ${this.utils.stringify(expected)}`
            : () => `Expected ${this.utils.stringify(actual)} to equal ${this.utils.stringify(expected)}`,
          pass: passed
      };
    },

    toEqualOneOf(actual, ...expectedArgs) {
      const passed = expectedArgs.some((expected) => this.equals(actual, expected, [DOMTester]));
      return {
        message: passed
          ? () =>`Expected ${this.utils.stringify(actual)} not  to equal an item within ${this.utils.stringify(expectedArgs)}`
          : () =>`Expected ${this.utils.stringify(actual)} to equal any items within ${this.utils.stringify(expectedArgs)}`,
        pass: passed
      };
    },

    toEqualData(actual, expected) {
      const passed = angular.equals(actual, expected);
      return {
        message: passed
          ? `Expected the data within ${this.utils.stringify(actual)} not to equal ${this.utils.stringify(expected)}`
          : `Expected the data within ${this.utils.stringify(actual)} to equal ${this.utils.stringify(expected)}`,
        pass: passed
      };
    },

    toHaveBeenCalledOnceWith(actual, ...expectedArgs) {
      if (!jest.isMockFunction(actual)) {
        throw new Error('Expected a spy, but got ' + this.utils.stringify(actual) + '.');
      }

      var actualCount = actual.mock.calls.length;
      var actualArgs = actualCount && actual.mock.calls[0];

      const passed = (actualCount === 1) && this.equals(actualArgs, expectedArgs);
      const isNot = passed;

      const message = () => {
        var msg = 'Expected spy' + (isNot ? ' not ' : ' ') +
          'to have been called once with ' + this.utils.stringify(expectedArgs) + ', but ';

        if (isNot) {
          msg += 'it was.';
        } else {
          switch (actualCount) {
            case 0:
              msg += 'it was never called.';
              break;
            case 1:
              msg += 'it was called with ' + this.utils.stringify(actualArgs) + '.';
              break;
            default:
              msg += 'it was called ' + actualCount + ' times.';
              break;
          }
        }

        return msg;
      };

      return {
        message: message,
        pass: passed,
      };
    },

    toBeOneOf(actual, ...expectedArgs) {
      const passed = expectedArgs.includes(actual);
      return {
        message: passed
          ? () =>`Expected ${this.utils.stringify(actual)} not to be an item within ${this.utils.stringify(expectedArgs)}`
          : () =>`Expected ${this.utils.stringify(actual)} to be within ${this.utils.stringify(expectedArgs)}`,
        pass: passed
      }
    },

    toHaveClass(actual, className) {
      const hasClass = (element, selector) => {
        if (!element.getAttribute) return false;
        return ((' ' + (element.getAttribute('class') || '') + ' ').replace(/[\n\t]/g, ' ').
            indexOf(' ' + selector + ' ') > -1);
      }

      let passed = false;
      const classes = className.trim().split(/\s+/);
      for (var i = 0; i < classes.length; ++i) {
        if (hasClass(actual[0], classes[i])) {
          passed = true;
        }
      }

      const isNot = passed;
      return {
        message: () => 'Expected \'' + angular.mock.dump(actual) + '\'' + (isNot ? ' not ' : '') + ' to have class \'' + className + '\'.',
        pass: passed
      };
    },

    toEqualMinErr(actual, namespace, code, content) {
      const matcher = new MinErrMatcher(namespace, code, content, {
        inputType: 'error',
        expectedAction: 'equal',
        actualAction: 'was'
      });

      return matcher.test(actual);
    },

    toThrowMinErr(actual, namespace, code, content) {
      var exception;

      if (!angular.isFunction(actual)) {
        throw new Error('Actual is not a function');
      }

      try {
        actual();
      } catch (e) {
        exception = e;
      }

      const matcher = new MinErrMatcher(namespace, code, content, {
        inputType: 'function',
        expectedAction: 'throw',
        actualAction: 'threw'
      });

      return matcher.test(exception);
    },

    toBeMarkedAsSelected(actual) {
      const isSelected = actual.selected;
      const hasAttribute = actual.hasAttribute('selected');
      const passed = isSelected && hasAttribute;

      return {
        message: passed
          ? () => isSelected ? "Expected option property selected to be falsy" : "Expected option to not have a 'selected' attribute applied"
          : () => !isSelected ? "Expected option property selected to be truthy" : "Expected option to have the 'selected' attribute applied",
        pass: passed
      }
    },
    toEqualSelect(actual, ...expectedValues) {
        var actualValues = [];

        angular.forEach(actual.find('option'), (option) => {
          actualValues.push(option.selected ? [option.value] : option.value);
        });

        const passed = angular.equals(expectedValues, actualValues);
        return {
          message: passed
            ? () => 'Expected ' + angular.toJson(actualValues) + ' not to equal ' + angular.toJson(expectedValues) + '.'
            : () => 'Expected ' + angular.toJson(actualValues) + ' to equal ' + angular.toJson(expectedValues) + '.',
          pass: passed
        };
    }
  });
});

/**
 * Create jest.Spy on given method, but ignore calls without arguments
 * This is helpful when need to spy only setter methods and ignore getters
 */
function spyOnlyCallsWithArgs(obj, method) {
  var originalFn = obj[method];
  var spy = jest.spyOn(obj, method);
  obj[method] = function() {
    if (arguments.length) return spy.apply(this, arguments);
    return originalFn.apply(this);
  };
  return spy;
}

// Minimal implementation to mock what was removed from Jasmine 1.x
function createAsync(doneFn) {
  function Job() {
    this.next = [];
  }
  Job.prototype.done = function() {
    return this.runs(doneFn);
  };
  Job.prototype.runs = function(fn) {
    var newJob = new Job();
    this.next.push(function() {
      fn();
      newJob.start();
    });
    return newJob;
  };
  Job.prototype.waitsFor = function(fn, error, timeout) {
    var newJob = new Job();
    timeout = timeout || 5000;
    this.next.push(function() {
      var counter = 0;

      var intervalId = window.setInterval(function() {
        if (fn()) {
          window.clearInterval(intervalId);
          newJob.start();
        }
        counter += 5;
        if (counter > timeout) {
          window.clearInterval(intervalId);
          throw new Error(error);
        }
      }, 5);
    });
    return newJob;
  };
  Job.prototype.waits = function(timeout) {
    return this.waitsFor(function() { return true; }, undefined, timeout);
  };
  Job.prototype.start = function() {
    var i;
    for (i = 0; i < this.next.length; i += 1) {
      this.next[i]();
    }
  };
  return new Job();
}

window.createAsync = createAsync;
window.spyOnlyCallsWithArgs = spyOnlyCallsWithArgs;
