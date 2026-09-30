'use strict';

/* globals generateInputCompilerHelper: false */
 describe('validators', () => {
  var helper = {};
  var $rootScope;

  generateInputCompilerHelper(helper);

  beforeEach(angular.mock.inject(function(_$rootScope_) {
    $rootScope = _$rootScope_;
  }));


  describe('pattern', () => {

    test('should validate in-lined pattern', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-pattern="/^\\d\\d\\d-\\d\\d-\\d\\d\\d\\d$/" />');

      helper.changeInputValueTo('x000-00-0000x');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('000-00-0000');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('000-00-0000x');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('123-45-6789');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('x');
      expect(inputElm).toBeInvalid();
    });


    test('should listen on ng-pattern when pattern is observed', () => {
      var value;
      var patternVal = /^\w+$/;
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-pattern="pat" attr-capture />');
      helper.attrs.$observe('pattern', function(v) {
        value = helper.attrs.pattern;
      });

      $rootScope.$apply(function() {
        $rootScope.pat = patternVal;
      });

      expect(value).toBe(patternVal);
    });


    test('should validate in-lined pattern with modifiers', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-pattern="/^abc?$/i" />');

      helper.changeInputValueTo('aB');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('xx');
      expect(inputElm).toBeInvalid();
    });


    test('should validate pattern from scope', () => {
      $rootScope.regexp = /^\d\d\d-\d\d-\d\d\d\d$/;
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-pattern="regexp" />');

      helper.changeInputValueTo('x000-00-0000x');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('000-00-0000');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('000-00-0000x');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('123-45-6789');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('x');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply(function() {
        $rootScope.regexp = /abc?/;
      });

      helper.changeInputValueTo('ab');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('xx');
      expect(inputElm).toBeInvalid();
    });


    test('should perform validations when the ngPattern scope value changes', () => {
      $rootScope.regexp = /^[a-z]+$/;
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-pattern="regexp" />');

      helper.changeInputValueTo('abcdef');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('123');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply(function() {
        $rootScope.regexp = /^\d+$/;
      });

      expect(inputElm).toBeValid();

      helper.changeInputValueTo('abcdef');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply(function() {
        $rootScope.regexp = '';
      });

      expect(inputElm).toBeValid();
    });


    test('should register "pattern" with the model validations when the pattern attribute is used', () => {
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" pattern="^\\d+$" />');

      helper.changeInputValueTo('abcd');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.input.$error.pattern).toBe(true);

      helper.changeInputValueTo('12345');
      expect(inputElm).toBeValid();
      expect($rootScope.form.input.$error.pattern).not.toBe(true);
    });


    test('should not throw an error when scope pattern can\'t be found', () => {
      expect(function() {
        var inputElm = helper.compileInput('<input type="text" ng-model="foo" ng-pattern="fooRegexp" />');
        $rootScope.$apply('foo = \'bar\'');
      }).not.toThrow();
    });


    test('should throw an error when the scope pattern is not a regular expression', () => {
      expect(function() {
        var inputElm = helper.compileInput('<input type="text" ng-model="foo" ng-pattern="fooRegexp" />');
        $rootScope.$apply(function() {
          $rootScope.fooRegexp = {};
          $rootScope.foo = 'bar';
        });
      }).toThrowMinErr('ngPattern', 'noregexp', 'Expected fooRegexp to be a RegExp but was');
    });


    test('should be invalid if entire string does not match pattern', () => {
      var inputElm = helper.compileInput('<input type="text" name="test" ng-model="value" pattern="\\d{4}">');
      helper.changeInputValueTo('1234');
      expect($rootScope.form.test.$error.pattern).not.toBe(true);
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('123');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();

      helper.changeInputValueTo('12345');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();
    });


    test('should be cope with patterns that start with ^', () => {
      var inputElm = helper.compileInput('<input type="text" name="test" ng-model="value" pattern="^\\d{4}">');
      helper.changeInputValueTo('1234');
      expect($rootScope.form.test.$error.pattern).not.toBe(true);
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('123');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();

      helper.changeInputValueTo('12345');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();
    });


    test('should be cope with patterns that end with $', () => {
      var inputElm = helper.compileInput('<input type="text" name="test" ng-model="value" pattern="\\d{4}$">');
      helper.changeInputValueTo('1234');
      expect($rootScope.form.test.$error.pattern).not.toBe(true);
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('123');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();

      helper.changeInputValueTo('12345');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();
    });


    test('should validate the viewValue and not the modelValue', () => {
      var inputElm = helper.compileInput('<input type="text" name="test" ng-model="value" pattern="\\d{4}">');
      var ctrl = inputElm.controller('ngModel');

      ctrl.$parsers.push(function(value) {
        return (value * 10) + '';
      });

      helper.changeInputValueTo('1234');
      expect($rootScope.form.test.$error.pattern).not.toBe(true);
      expect($rootScope.form.test.$modelValue).toBe('12340');
      expect(inputElm).toBeValid();
    });


    test('should validate on non-input elements', angular.mock.inject(function($compile) {
      $rootScope.pattern = '\\d{4}';
      var elm = $compile('<span ng-model="value" pattern="\\d{4}"></span>')($rootScope);
      var elmNg = $compile('<span ng-model="value" ng-pattern="pattern"></span>')($rootScope);
      var ctrl = elm.controller('ngModel');
      var ctrlNg = elmNg.controller('ngModel');

      expect(ctrl.$error.pattern).not.toBe(true);
      expect(ctrlNg.$error.pattern).not.toBe(true);

      ctrl.$setViewValue('12');
      ctrlNg.$setViewValue('12');

      expect(ctrl.$error.pattern).toBe(true);
      expect(ctrlNg.$error.pattern).toBe(true);
      dealoc(elm);
      dealoc(elmNg);
    }));

    test('should only validate once after compilation when inside ngRepeat', () => {

      $rootScope.pattern = /\d{4}/;

      helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" pattern="\\d{4}" validation-spy="pattern" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.pattern).toBe(1);

      helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" ng-pattern="pattern" validation-spy="pattern" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.pattern).toBe(1);
    });
  });


  describe('minlength', () => {

    test('should invalidate values that are shorter than the given minlength', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-minlength="3" />');

      helper.changeInputValueTo('aa');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('aaa');
      expect(inputElm).toBeValid();
    });


    test('should listen on ng-minlength when minlength is observed', () => {
      var value = 0;
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-minlength="min" attr-capture />');
      helper.attrs.$observe('minlength', function(v) {
        value = ngInternals.toInt(helper.attrs.minlength);
      });

      $rootScope.$apply('min = 5');

      expect(value).toBe(5);
    });


    test('should observe the standard minlength attribute and register it as a validator on the model', () => {
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" minlength="{{ min }}" />');
      $rootScope.$apply('min = 10');

      helper.changeInputValueTo('12345');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.input.$error.minlength).toBe(true);

      $rootScope.$apply('min = 5');

      expect(inputElm).toBeValid();
      expect($rootScope.form.input.$error.minlength).not.toBe(true);
    });


    test('should validate when the model is initialized as a number', () => {
      $rootScope.value = 12345;
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" minlength="3" />');
      expect($rootScope.value).toBe(12345);
      expect($rootScope.form.input.$error.minlength).toBeUndefined();
    });

    test('should validate emptiness against the viewValue', () => {
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" minlength="3" />');

      var ctrl = inputElm.controller('ngModel');
      jest.spyOn(ctrl, '$isEmpty');

      ctrl.$parsers.push(function(value) {
        return value + '678';
      });

      helper.changeInputValueTo('12345');
      expect(ctrl.$isEmpty).toHaveBeenCalledWith('12345');
    });


    test('should validate on non-input elements', angular.mock.inject(function($compile) {
      $rootScope.min = 3;
      var elm = $compile('<span ng-model="value" minlength="{{min}}"></span>')($rootScope);
      var elmNg = $compile('<span ng-model="value" ng-minlength="min"></span>')($rootScope);
      var ctrl = elm.controller('ngModel');
      var ctrlNg = elmNg.controller('ngModel');

      expect(ctrl.$error.minlength).not.toBe(true);
      expect(ctrlNg.$error.minlength).not.toBe(true);

      ctrl.$setViewValue('12');
      ctrlNg.$setViewValue('12');

      expect(ctrl.$error.minlength).toBe(true);
      expect(ctrlNg.$error.minlength).toBe(true);
      dealoc(elm);
      dealoc(elmNg);
    }));


    test('should only validate once after compilation when inside ngRepeat', () => {
      $rootScope.minlength = 5;

      var element = helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" minlength="{{minlength}}" validation-spy="minlength" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.minlength).toBe(1);

      element = helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" ng-minlength="minlength" validation-spy="minlength" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.minlength).toBe(1);
    });
  });

  describe('maxlength', () => {

    test('should invalidate values that are longer than the given maxlength', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-maxlength="5" />');

      helper.changeInputValueTo('aaaaaaaa');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('aaa');
      expect(inputElm).toBeValid();
    });


    test('should only accept empty values when maxlength is 0', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-maxlength="0" />');

      helper.changeInputValueTo('');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('a');
      expect(inputElm).toBeInvalid();
    });


    test('should accept values of any length when maxlength is negative', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-maxlength="-1" />');

      helper.changeInputValueTo('');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('aaaaaaaaaa');
      expect(inputElm).toBeValid();
    });


    test('should accept values of any length when maxlength is non-numeric', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-maxlength="maxlength" />');
      helper.changeInputValueTo('aaaaaaaaaa');

      $rootScope.$apply('maxlength = "5"');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply('maxlength = "abc"');
      expect(inputElm).toBeValid();

      $rootScope.$apply('maxlength = ""');
      expect(inputElm).toBeValid();

      $rootScope.$apply('maxlength = null');
      expect(inputElm).toBeValid();

      $rootScope.someObj = {};
      $rootScope.$apply('maxlength = someObj');
      expect(inputElm).toBeValid();
    });


    test('should listen on ng-maxlength when maxlength is observed', () => {
      var value = 0;
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-maxlength="max" attr-capture />');
      helper.attrs.$observe('maxlength', function(v) {
        value = ngInternals.toInt(helper.attrs.maxlength);
      });

      $rootScope.$apply('max = 10');

      expect(value).toBe(10);
    });


    test('should observe the standard maxlength attribute and register it as a validator on the model', () => {
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="{{ max }}" />');
      $rootScope.$apply('max = 1');

      helper.changeInputValueTo('12345');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.input.$error.maxlength).toBe(true);

      $rootScope.$apply('max = 6');

      expect(inputElm).toBeValid();
      expect($rootScope.form.input.$error.maxlength).not.toBe(true);
    });


    test('should assign the correct model after an observed validator became valid', () => {
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="{{ max }}" />');

      $rootScope.$apply('max = 1');
      helper.changeInputValueTo('12345');
      expect($rootScope.value).toBeUndefined();

      $rootScope.$apply('max = 6');
      expect($rootScope.value).toBe('12345');
    });


    test('should assign the correct model after an observed validator became invalid', () => {
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="{{ max }}" />');

      $rootScope.$apply('max = 6');
      helper.changeInputValueTo('12345');
      expect($rootScope.value).toBe('12345');

      $rootScope.$apply('max = 1');
      expect($rootScope.value).toBeUndefined();
    });


    test('should leave the value as invalid if observed maxlength changed, but is still invalid', () => {
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="{{ max }}" />');
      $rootScope.$apply('max = 1');

      helper.changeInputValueTo('12345');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.input.$error.maxlength).toBe(true);
      expect($rootScope.value).toBeUndefined();

      $rootScope.$apply('max = 3');

      expect(inputElm).toBeInvalid();
      expect($rootScope.form.input.$error.maxlength).toBe(true);
      expect($rootScope.value).toBeUndefined();
    });


    test('should not notify if observed maxlength changed, but is still invalid', () => {
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" ng-change="ngChangeSpy()" ' +
                   'maxlength="{{ max }}" />');

      $rootScope.$apply('max = 1');
      helper.changeInputValueTo('12345');

      $rootScope.ngChangeSpy = jest.fn();
      $rootScope.$apply('max = 3');

      expect($rootScope.ngChangeSpy).not.toHaveBeenCalled();
    });


    test('should leave the model untouched when validating before model initialization', () => {
      $rootScope.value = '12345';
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" minlength="3" />');
      expect($rootScope.value).toBe('12345');
    });


    test('should validate when the model is initialized as a number', () => {
      $rootScope.value = 12345;
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="10" />');
      expect($rootScope.value).toBe(12345);
      expect($rootScope.form.input.$error.maxlength).toBeUndefined();
    });

    test('should validate emptiness against the viewValue', () => {
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="10" />');

      var ctrl = inputElm.controller('ngModel');
      jest.spyOn(ctrl, '$isEmpty');

      ctrl.$parsers.push(function(value) {
        return value + '678';
      });

      helper.changeInputValueTo('12345');
      expect(ctrl.$isEmpty).toHaveBeenCalledWith('12345');
    });


    test('should validate on non-input elements', angular.mock.inject(function($compile) {
      $rootScope.max = 3;
      var elm = $compile('<span ng-model="value" maxlength="{{max}}"></span>')($rootScope);
      var elmNg = $compile('<span ng-model="value" ng-maxlength="max"></span>')($rootScope);
      var ctrl = elm.controller('ngModel');
      var ctrlNg = elmNg.controller('ngModel');

      expect(ctrl.$error.maxlength).not.toBe(true);
      expect(ctrlNg.$error.maxlength).not.toBe(true);

      ctrl.$setViewValue('1234');
      ctrlNg.$setViewValue('1234');

      expect(ctrl.$error.maxlength).toBe(true);
      expect(ctrlNg.$error.maxlength).toBe(true);
      dealoc(elm);
      dealoc(elmNg);
    }));


    test('should only validate once after compilation when inside ngRepeat', () => {
      $rootScope.maxlength = 5;

      var element = helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" maxlength="{{maxlength}}" validation-spy="maxlength" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.maxlength).toBe(1);

      element = helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" ng-maxlength="maxlength" validation-spy="maxlength" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.maxlength).toBe(1);
    });
  });


  describe('required', () => {

    test('should allow bindings via ngRequired', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-required="required" />');

      $rootScope.$apply('required = false');

      helper.changeInputValueTo('');
      expect(inputElm).toBeValid();


      $rootScope.$apply('required = true');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply('value = \'some\'');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply('required = false');
      expect(inputElm).toBeValid();
    });


    test('should invalid initial value with bound required', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="value" required="{{required}}" />');

      $rootScope.$apply('required = true');

      expect(inputElm).toBeInvalid();
    });


    test('should be $invalid but $pristine if not touched', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" required />');

      $rootScope.$apply('name = null');

      expect(inputElm).toBeInvalid();
      expect(inputElm).toBePristine();

      helper.changeInputValueTo('');
      expect(inputElm).toBeInvalid();
      expect(inputElm).toBeDirty();
    });


    test('should allow empty string if not required', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="foo" />');
      helper.changeInputValueTo('a');
      helper.changeInputValueTo('');
      expect($rootScope.foo).toBe('');
    });


    test('should set $invalid when model undefined', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="notDefined" required />');
      expect(inputElm).toBeInvalid();
    });


    test('should consider bad input as an error before any other errors are considered', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="value" required />', { badInput: true });
      var ctrl = inputElm.controller('ngModel');
      ctrl.$parsers.push(function() {
        return undefined;
      });

      helper.changeInputValueTo('abc123');

      expect(ctrl.$error.parse).toBe(true);
      expect(inputElm).toHaveClass('ng-invalid-parse');
      expect(inputElm).toBeInvalid(); // invalid because of the number validator
    });


    test('should allow `false` as a valid value when the input type is not "checkbox"', () => {
      var inputElm = helper.compileInput('<input type="radio" ng-value="true" ng-model="answer" required />' +
        '<input type="radio" ng-value="false" ng-model="answer" required />');

      $rootScope.$apply();
      expect(inputElm).toBeInvalid();

      $rootScope.$apply('answer = true');
      expect(inputElm).toBeValid();

      $rootScope.$apply('answer = false');
      expect(inputElm).toBeValid();
    });


    test('should validate emptiness against the viewValue', () => {
      var inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" required />');

      var ctrl = inputElm.controller('ngModel');
      jest.spyOn(ctrl, '$isEmpty');

      ctrl.$parsers.push(function(value) {
        return value + '678';
      });

      helper.changeInputValueTo('12345');
      expect(ctrl.$isEmpty).toHaveBeenCalledWith('12345');
    });


    test('should validate on non-input elements', angular.mock.inject(function($compile) {
      $rootScope.value = '12';
      var elm = $compile('<span ng-model="value" required></span>')($rootScope);
      var elmNg = $compile('<span ng-model="value" ng-required="true"></span>')($rootScope);
      var ctrl = elm.controller('ngModel');
      var ctrlNg = elmNg.controller('ngModel');

      expect(ctrl.$error.required).not.toBe(true);
      expect(ctrlNg.$error.required).not.toBe(true);

      ctrl.$setViewValue('');
      ctrlNg.$setViewValue('');

      expect(ctrl.$error.required).toBe(true);
      expect(ctrlNg.$error.required).toBe(true);
      dealoc(elm);
      dealoc(elmNg);
    }));


    test('should override "required" when ng-required="false" is set', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="notDefined" required ng-required="false" />');

      expect(inputElm).toBeValid();
    });


    test('should validate only once after compilation when inside ngRepeat', () => {
      helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" required validation-spy="required" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.required).toBe(1);
    });


    test('should validate only once after compilation when inside ngRepeat and ngRequired is true', () => {
      $rootScope.isRequired = true;

      helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" ng-required="isRequired" validation-spy="required" />' +
         '</div>');

      expect(helper.validationCounter.required).toBe(1);
    });


    test('should validate only once after compilation when inside ngRepeat and ngRequired is false', () => {
      $rootScope.isRequired = false;

      helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" ng-required="isRequired" validation-spy="required" />' +
         '</div>');

      expect(helper.validationCounter.required).toBe(1);
    });


    test('should validate once when inside ngRepeat, and set the "required" error when ngRequired is false by default', () => {
      $rootScope.isRequired = false;
      $rootScope.refs = {};

      var elm = helper.compileInput(
        '<div ng-repeat="input in [0]">' +
          '<input type="text" ng-ref="refs.input" ng-ref-read="ngModel" ng-model="value" ng-required="isRequired" validation-spy="required" />' +
        '</div>');

      expect(helper.validationCounter.required).toBe(1);
      expect($rootScope.refs.input.$error.required).toBeUndefined();
    });


    test('should validate only once when inside ngIf with required on non-input elements', angular.mock.inject(function($compile) {
      $rootScope.value = '12';
      $rootScope.refs = {};
      helper.compileInput('<div ng-if="true"><span ng-model="value" ng-ref="refs.ctrl" ng-ref-read="ngModel" required validation-spy="required"></span></div>');
      $rootScope.$digest();

      expect(helper.validationCounter.required).toBe(1);
      expect($rootScope.refs.ctrl.$error.required).not.toBe(true);
    }));
  });
});
