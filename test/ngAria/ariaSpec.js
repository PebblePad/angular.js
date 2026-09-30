'use strict';

/* globals nativeAriaNodeNames false */
 describe('$aria', () => {
  var nativeAriaNodeNames = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'DETAILS', 'SUMMARY']
  var scope;
  var $compile;
  var element;

  beforeEach(angular.mock.module('ngAria'));

   afterEach(() => {
    dealoc(element);
  });

  describe('with `ngAriaDisable`', () => {
    beforeEach(injectScopeAndCompiler);
     beforeEach(() => {
      expect.extend({
        toHaveAttribute(element, attr) {
          var node = element[0];
          var pass = node.hasAttribute(attr);
          var message = function() {
            return 'Expected `' + node.outerHTML + '` ' + (pass ? 'not ' : '') +
                   'to have attribute `' + attr + '`.';
          };

          return {
            pass: pass,
            message: message
          };
        }
      });
    });

    // ariaChecked
    test('should not attach aria-checked to custom checkbox', () => {
      compileElement('<div role="checkbox" ng-model="val" ng-aria-disable></div>');

      scope.$apply('val = false');
      expect(element).not.toHaveAttribute('aria-checked');

      scope.$apply('val = true');
      expect(element).not.toHaveAttribute('aria-checked');
    });

    test('should not attach aria-checked to custom radio controls', () => {
      compileElement(
          '<div role="radio" ng-model="val" value="one" ng-aria-disable></div>' +
          '<div role="radio" ng-model="val" value="two" ng-aria-disable></div>');

      var radio1 = element.eq(0);
      var radio2 = element.eq(1);

      scope.$apply('val = "one"');
      expect(radio1).not.toHaveAttribute('aria-checked');
      expect(radio2).not.toHaveAttribute('aria-checked');

      scope.$apply('val = "two"');
      expect(radio1).not.toHaveAttribute('aria-checked');
      expect(radio2).not.toHaveAttribute('aria-checked');
    });

    // ariaDisabled
    test('should not attach aria-disabled to custom controls', () => {
      compileElement('<div ng-disabled="val" ng-aria-disable></div>');

      scope.$apply('val = false');
      expect(element).not.toHaveAttribute('aria-disabled');

      scope.$apply('val = true');
      expect(element).not.toHaveAttribute('aria-disabled');
    });

    // ariaHidden
    test('should not attach aria-hidden to `ngShow`', () => {
      compileElement('<div ng-show="val" ng-aria-disable></div>');

      scope.$apply('val = false');
      expect(element).not.toHaveAttribute('aria-hidden');

      scope.$apply('val = true');
      expect(element).not.toHaveAttribute('aria-hidden');
    });

    test('should not attach aria-hidden to `ngHide`', () => {
      compileElement('<div ng-hide="val" ng-aria-disable></div>');

      scope.$apply('val = false');
      expect(element).not.toHaveAttribute('aria-hidden');

      scope.$apply('val = true');
      expect(element).not.toHaveAttribute('aria-hidden');
    });

    // ariaInvalid
    test('should not attach aria-invalid to input', () => {
      compileElement('<input ng-model="val" ng-minlength="10" ng-aria-disable />');

      scope.$apply('val = "lt 10"');
      expect(element).not.toHaveAttribute('aria-invalid');

      scope.$apply('val = "gt 10 characters"');
      expect(element).not.toHaveAttribute('aria-invalid');
    });

    test('should not attach aria-invalid to custom controls', () => {
      compileElement('<div role="textbox" ng-model="val" ng-minlength="10" ng-aria-disable></div>');

      scope.$apply('val = "lt 10"');
      expect(element).not.toHaveAttribute('aria-invalid');

      scope.$apply('val = "gt 10 characters"');
      expect(element).not.toHaveAttribute('aria-invalid');
    });

    // ariaLive
    test('should not attach aria-live to `ngMessages`', () => {
      compileElement('<div ng-messages="val" ng-aria-disable>');
      expect(element).not.toHaveAttribute('aria-live');
    });

    // ariaReadonly
    test('should not attach aria-readonly to custom controls', () => {
      compileElement('<div ng-readonly="val" ng-aria-disable></div>');

      scope.$apply('val = false');
      expect(element).not.toHaveAttribute('aria-readonly');

      scope.$apply('val = true');
      expect(element).not.toHaveAttribute('aria-readonly');
    });

    // ariaRequired
    test('should not attach aria-required to custom controls with `required`', () => {
      compileElement('<div ng-model="val" required ng-aria-disable></div>');
      expect(element).not.toHaveAttribute('aria-required');
    });

    test('should not attach aria-required to custom controls with `ngRequired`', () => {
      compileElement('<div ng-model="val" ng-required="val" ng-aria-disable></div>');

      scope.$apply('val = false');
      expect(element).not.toHaveAttribute('aria-required');

      scope.$apply('val = true');
      expect(element).not.toHaveAttribute('aria-required');
    });

    // ariaValue
    test('should not attach aria-value* to input[range]', () => {
      compileElement('<input type="range" ng-model="val" min="0" max="100" ng-aria-disable />');

      expect(element).not.toHaveAttribute('aria-valuemax');
      expect(element).not.toHaveAttribute('aria-valuemin');
      expect(element).not.toHaveAttribute('aria-valuenow');

      scope.$apply('val = 50');
      expect(element).not.toHaveAttribute('aria-valuemax');
      expect(element).not.toHaveAttribute('aria-valuemin');
      expect(element).not.toHaveAttribute('aria-valuenow');

      scope.$apply('val = 150');
      expect(element).not.toHaveAttribute('aria-valuemax');
      expect(element).not.toHaveAttribute('aria-valuemin');
      expect(element).not.toHaveAttribute('aria-valuenow');
    });

    test('should not attach aria-value* to custom controls', () => {
      compileElement(
          '<div role="progressbar" ng-model="val" min="0" max="100" ng-aria-disable></div>' +
          '<div role="slider" ng-model="val" min="0" max="100" ng-aria-disable></div>');

      var progressbar = element.eq(0);
      var slider = element.eq(1);

      ['aria-valuemax', 'aria-valuemin', 'aria-valuenow'].forEach(function(attr) {
        expect(progressbar).not.toHaveAttribute(attr);
        expect(slider).not.toHaveAttribute(attr);
      });

      scope.$apply('val = 50');
      ['aria-valuemax', 'aria-valuemin', 'aria-valuenow'].forEach(function(attr) {
        expect(progressbar).not.toHaveAttribute(attr);
        expect(slider).not.toHaveAttribute(attr);
      });

      scope.$apply('val = 150');
      ['aria-valuemax', 'aria-valuemin', 'aria-valuenow'].forEach(function(attr) {
        expect(progressbar).not.toHaveAttribute(attr);
        expect(slider).not.toHaveAttribute(attr);
      });
    });

    // bindKeypress
    test('should not bind keypress to `ngClick`', () => {
      scope.onClick = jest.fn().mockName('onClick');
      compileElement(
          '<div ng-click="onClick()" tabindex="0" ng-aria-disable></div>' +
          '<ul><li ng-click="onClick()" tabindex="0" ng-aria-disable></li></ul>');

      var div = element.find('div');
      var li = element.find('li');

      div.triggerHandler({type: 'keypress', keyCode: 32});
      li.triggerHandler({type: 'keypress', keyCode: 32});

      expect(scope.onClick).not.toHaveBeenCalled();
    });

    // bindRoleForClick
    test('should not attach role to custom controls', () => {
      compileElement(
          '<div ng-click="onClick()" ng-aria-disable></div>' +
          '<div type="checkbox" ng-model="val" ng-aria-disable></div>' +
          '<div type="radio" ng-model="val" ng-aria-disable></div>' +
          '<div type="range" ng-model="val" ng-aria-disable></div>');

      expect(element.eq(0)).not.toHaveAttribute('role');
      expect(element.eq(1)).not.toHaveAttribute('role');
      expect(element.eq(2)).not.toHaveAttribute('role');
      expect(element.eq(3)).not.toHaveAttribute('role');
    });

    // tabindex
    test('should not attach tabindex to custom controls', () => {
      compileElement(
          '<div role="checkbox" ng-model="val" ng-aria-disable></div>' +
          '<div role="slider" ng-model="val" ng-aria-disable></div>');

      expect(element.eq(0)).not.toHaveAttribute('tabindex');
      expect(element.eq(1)).not.toHaveAttribute('tabindex');
    });

    test('should not attach tabindex to `ngClick` or `ngDblclick`', () => {
      compileElement(
          '<div ng-click="onClick()" ng-aria-disable></div>' +
          '<div ng-dblclick="onDblclick()" ng-aria-disable></div>');

      expect(element.eq(0)).not.toHaveAttribute('tabindex');
      expect(element.eq(1)).not.toHaveAttribute('tabindex');
    });
  });

  describe('aria-hidden', () => {
    beforeEach(injectScopeAndCompiler);

    test('should attach aria-hidden to ng-show', () => {
      compileElement('<div ng-show="val"></div>');
      scope.$apply('val = false');
      expect(element.attr('aria-hidden')).toBe('true');

      scope.$apply('val = true');
      expect(element.attr('aria-hidden')).toBe('false');
    });

    test('should attach aria-hidden to ng-hide', () => {
      compileElement('<div ng-hide="val"></div>');
      scope.$apply('val = false');
      expect(element.attr('aria-hidden')).toBe('false');

      scope.$apply('val = true');
      expect(element.attr('aria-hidden')).toBe('true');
    });

    test('should not change aria-hidden if it is already present on ng-show', () => {
      compileElement('<div ng-show="val" aria-hidden="userSetValue"></div>');
      expect(element.attr('aria-hidden')).toBe('userSetValue');

      scope.$apply('val = true');
      expect(element.attr('aria-hidden')).toBe('userSetValue');
    });

    test('should not change aria-hidden if it is already present on ng-hide', () => {
      compileElement('<div ng-hide="val" aria-hidden="userSetValue"></div>');
      expect(element.attr('aria-hidden')).toBe('userSetValue');

      scope.$apply('val = true');
      expect(element.attr('aria-hidden')).toBe('userSetValue');
    });

    test('should always set aria-hidden to a boolean value', () => {
      compileElement('<div ng-hide="val"></div>');

      scope.$apply('val = "test angular"');
      expect(element.attr('aria-hidden')).toBe('true');

      scope.$apply('val = null');
      expect(element.attr('aria-hidden')).toBe('false');

      scope.$apply('val = {}');
      expect(element.attr('aria-hidden')).toBe('true');


      compileElement('<div ng-show="val"></div>');

      scope.$apply('val = "test angular"');
      expect(element.attr('aria-hidden')).toBe('false');

      scope.$apply('val = null');
      expect(element.attr('aria-hidden')).toBe('true');

      scope.$apply('val = {}');
      expect(element.attr('aria-hidden')).toBe('false');
    });
  });

  describe('aria-hidden when disabled', () => {
    beforeEach(configAriaProvider({
      ariaHidden: false
    }));
    beforeEach(injectScopeAndCompiler);

    test('should not attach aria-hidden', () => {
      scope.$apply('val = false');
      compileElement('<div ng-show="val"></div>');
      expect(element.attr('aria-hidden')).toBeUndefined();

      compileElement('<div ng-hide="val"></div>');
      expect(element.attr('aria-hidden')).toBeUndefined();
    });
  });

  describe('aria-checked', () => {
    beforeEach(injectScopeAndCompiler);

    test('should not attach itself to native input type="checkbox"', () => {
      compileElement('<input type="checkbox" ng-model="val">');

      scope.$apply('val = true');
      expect(element.attr('aria-checked')).toBeUndefined();

      scope.$apply('val = false');
      expect(element.attr('aria-checked')).toBeUndefined();
    });

    test('should attach itself to custom checkbox', () => {
      compileElement('<div role="checkbox" ng-model="val"></div>');

      scope.$apply('val = "checked"');
      expect(element.attr('aria-checked')).toBe('true');

      scope.$apply('val = null');
      expect(element.attr('aria-checked')).toBe('false');
    });

    test('should use `$isEmpty()` to determine if the checkbox is checked',
      function() {
        compileElement('<div role="checkbox" ng-model="val"></div>');
        var ctrl = element.controller('ngModel');
        ctrl.$isEmpty = function(value) {
          return value === 'not-checked';
        };

        scope.$apply('val = true');
        expect(ctrl.$modelValue).toBe(true);
        expect(element.attr('aria-checked')).toBe('true');

        scope.$apply('val = false');
        expect(ctrl.$modelValue).toBe(false);
        expect(element.attr('aria-checked')).toBe('true');

        scope.$apply('val = "not-checked"');
        expect(ctrl.$modelValue).toBe('not-checked');
        expect(element.attr('aria-checked')).toBe('false');

        scope.$apply('val = "checked"');
        expect(ctrl.$modelValue).toBe('checked');
        expect(element.attr('aria-checked')).toBe('true');
      }
    );

    test('should not handle native checkbox with ngChecked', () => {
      var element = compileForTest('<input type="checkbox" ng-checked="val">', scope);

      scope.$apply('val = true');
      expect(element.attr('aria-checked')).toBeUndefined();

      scope.$apply('val = false');
      expect(element.attr('aria-checked')).toBeUndefined();
    });

    test('should handle custom checkbox with ngChecked', () => {
      var element = compileForTest('<div role="checkbox" ng-checked="val">', scope);

      scope.$apply('val = true');
      expect(element.eq(0).attr('aria-checked')).toBe('true');

      scope.$apply('val = false');
      expect(element.eq(0).attr('aria-checked')).toBe('false');
    });

    test('should not attach to native input type="radio"', () => {
      var element = compileForTest('<input type="radio" ng-model="val" value="one">' +
                             '<input type="radio" ng-model="val" value="two">', scope);

      scope.$apply('val=\'one\'');
      expect(element.eq(0).attr('aria-checked')).toBeUndefined();
      expect(element.eq(1).attr('aria-checked')).toBeUndefined();

      scope.$apply('val=\'two\'');
      expect(element.eq(0).attr('aria-checked')).toBeUndefined();
      expect(element.eq(1).attr('aria-checked')).toBeUndefined();
    });

    test('should attach to custom radio controls', () => {
      var element = compileForTest('<div role="radio" ng-model="val" value="one"></div>' +
          '<div role="radio" ng-model="val" value="two"></div>',scope);

      scope.$apply('val=\'one\'');
      expect(element.eq(0).attr('aria-checked')).toBe('true');
      expect(element.eq(1).attr('aria-checked')).toBe('false');

      scope.$apply('val=\'two\'');
      expect(element.eq(0).attr('aria-checked')).toBe('false');
      expect(element.eq(1).attr('aria-checked')).toBe('true');
    });

    test('should handle custom radios with integer model values', () => {
      var element = compileForTest('<div role="radio" ng-model="val" value="0"></div>' +
          '<div role="radio" ng-model="val" value="1"></div>', scope);

      scope.$apply('val=0');
      expect(element.eq(0).attr('aria-checked')).toBe('true');
      expect(element.eq(1).attr('aria-checked')).toBe('false');

      scope.$apply('val=1');
      expect(element.eq(0).attr('aria-checked')).toBe('false');
      expect(element.eq(1).attr('aria-checked')).toBe('true');
    });

    test('should handle radios with boolean model values using ngValue', () => {
      var element = compileForTest('<div role="radio" ng-model="val" ng-value="valExp"></div>' +
          '<div role="radio" ng-model="val" ng-value="valExp2"></div>', scope);

      scope.$apply(function() {
        scope.valExp = true;
        scope.valExp2 = false;
        scope.val = true;
      });
      expect(element.eq(0).attr('aria-checked')).toBe('true');
      expect(element.eq(1).attr('aria-checked')).toBe('false');

      scope.$apply('val = false');
      expect(element.eq(0).attr('aria-checked')).toBe('false');
      expect(element.eq(1).attr('aria-checked')).toBe('true');
    });

    test('should attach itself to role="menuitemradio"', () => {
      scope.val = 'one';
      compileElement('<div role="menuitemradio" ng-model="val" value="one"></div>');
      expect(element.attr('aria-checked')).toBe('true');

      scope.$apply('val = \'two\'');
      expect(element.attr('aria-checked')).toBe('false');
    });

    test('should attach itself to role="menuitemcheckbox"', () => {
      compileElement('<div role="menuitemcheckbox" ng-model="val"></div>');

      scope.$apply('val = "checked"');
      expect(element.attr('aria-checked')).toBe('true');

      scope.$apply('val = null');
      expect(element.attr('aria-checked')).toBe('false');
    });

    test('should not attach itself if an aria-checked value is already present', () => {
      var element = [
        $compile('<div role=\'radio\' ng-model=\'val\' value=\'{{val3}}\' aria-checked=\'userSetValue\'></div>')(scope),
        $compile('<div role=\'menuitemradio\' ng-model=\'val\' value=\'{{val3}}\' aria-checked=\'userSetValue\'></div>')(scope),
        $compile('<div role=\'checkbox\' checked=\'checked\' aria-checked=\'userSetValue\'></div>')(scope),
        $compile('<div role=\'menuitemcheckbox\' checked=\'checked\' aria-checked=\'userSetValue\'></div>')(scope)
      ];
      scope.$apply('val1=true;val2=\'one\';val3=\'1\'');
      expectAriaAttrOnEachElement(element, 'aria-checked', 'userSetValue');
      element.forEach((e) => dealoc(e))
    });
  });

  describe('roles for custom inputs', () => {
    beforeEach(injectScopeAndCompiler);

    test('should add missing role="button" to custom input', () => {
      compileElement('<div ng-click="someFunction()"></div>');
      expect(element.attr('role')).toBe('button');
    });

    test('should not add role="button" to anchor', () => {
      compileElement('<a ng-click="someFunction()"></a>');
      expect(element.attr('role')).not.toBe('button');
    });

    test('should add missing role="checkbox" to custom input', () => {
      compileElement('<div type="checkbox" ng-model="val"></div>');
      expect(element.attr('role')).toBe('checkbox');
    });

    test('should not add a role to a native checkbox', () => {
      compileElement('<input type="checkbox" ng-model="val"/>');
      expect(element.attr('role')).toBeUndefined();
    });

    test('should add missing role="radio" to custom input', () => {
      compileElement('<div type="radio" ng-model="val"></div>');
      expect(element.attr('role')).toBe('radio');
    });

    test('should not add a role to a native radio button', () => {
      compileElement('<input type="radio" ng-model="val"/>');
      expect(element.attr('role')).toBeUndefined();
    });

    test('should add missing role="slider" to custom input', () => {
      compileElement('<div type="range" ng-model="val"></div>');
      expect(element.attr('role')).toBe('slider');
    });

    test('should not add a role to a native range input', () => {
      compileElement('<input type="range" ng-model="val"/>');
      expect(element.attr('role')).toBeUndefined();
    });

    test.each(Object.entries({
      input: '<input type="text" ng-model="val">',
      select: '<select type="checkbox" ng-model="val"></select>',
      textarea: '<textarea type="checkbox" ng-model="val"></textarea>',
      button: '<button ng-click="doClick()"></button>',
      summary: '<summary ng-click="doClick()"></summary>',
      details: '<details ng-click="doClick()"></details>',
      a: '<a ng-click="doClick()"></a>'
    }).map(([prop, value]) => ({ prop, value })))(
        'should not add role to native $prop controls', function({ value: tmpl }) {
      var element = compileForTest(tmpl, scope);
      expect(element.attr('role')).toBeUndefined();
    });
  });

  describe('aria-checked when disabled', () => {
    beforeEach(configAriaProvider({
      ariaChecked: false
    }));
    beforeEach(injectScopeAndCompiler);

    test('should not attach aria-checked', () => {
      compileElement('<div role=\'radio\' ng-model=\'val\' value=\'{{val}}\'></div>');
      expect(element.attr('aria-checked')).toBeUndefined();

      compileElement('<div role=\'menuitemradio\' ng-model=\'val\' value=\'{{val}}\'></div>');
      expect(element.attr('aria-checked')).toBeUndefined();

      compileElement('<div role=\'checkbox\' checked=\'checked\'></div>');
      expect(element.attr('aria-checked')).toBeUndefined();

      compileElement('<div role=\'menuitemcheckbox\' checked=\'checked\'></div>');
      expect(element.attr('aria-checked')).toBeUndefined();
    });
  });

  describe('aria-disabled', () => {
    beforeEach(injectScopeAndCompiler);

    test.each(Object.entries({
      input: '<input ng-disabled="val">',
      textarea: '<textarea ng-disabled="val"></textarea>',
      select: '<select ng-disabled="val"></select>',
      button: '<button ng-disabled="val"></button>'
    }).map(([prop, value]) => ({ prop, value })))(
        'should not attach itself to native $prop controls', function({ value: tmpl }) {
      var element = compileForTest(tmpl, scope);
      scope.$apply('val = true');

      expect(element.attr('disabled')).toBeDefined();
      expect(element.attr('aria-disabled')).toBeUndefined();
    });

    test('should attach itself to custom controls', () => {
      compileElement('<div ng-disabled="val"></div>');
      expect(element.attr('aria-disabled')).toBe('false');

      scope.$apply('val = true');
      expect(element.attr('aria-disabled')).toBe('true');

    });

    test('should not attach itself if an aria-disabled attribute is already present', () => {
      compileElement('<div ng-disabled="val" aria-disabled="userSetValue"></div>');

      expect(element.attr('aria-disabled')).toBe('userSetValue');
    });


    test('should always set aria-disabled to a boolean value', () => {
      compileElement('<div ng-disabled="val"></div>');

      scope.$apply('val = "test angular"');
      expect(element.attr('aria-disabled')).toBe('true');

      scope.$apply('val = null');
      expect(element.attr('aria-disabled')).toBe('false');

      scope.$apply('val = {}');
      expect(element.attr('aria-disabled')).toBe('true');
    });
  });

  describe('aria-disabled when disabled', () => {
    beforeEach(configAriaProvider({
      ariaDisabled: false
    }));
    beforeEach(injectScopeAndCompiler);

    test('should not attach aria-disabled', () => {
      compileElement('<div ng-disabled="val"></div>');

      scope.$apply('val = true');
      expect(element.attr('aria-disabled')).toBeUndefined();
    });
  });

  describe('aria-invalid', () => {
    beforeEach(injectScopeAndCompiler);

    test('should attach aria-invalid to input', () => {
      compileElement('<input ng-model="txtInput" ng-minlength="10">');
      scope.$apply('txtInput=\'LTten\'');
      expect(element.attr('aria-invalid')).toBe('true');

      scope.$apply('txtInput=\'morethantencharacters\'');
      expect(element.attr('aria-invalid')).toBe('false');
    });

    test('should attach aria-invalid to custom controls', () => {
      compileElement('<div ng-model="txtInput" role="textbox" ng-minlength="10"></div>');
      scope.$apply('txtInput=\'LTten\'');
      expect(element.attr('aria-invalid')).toBe('true');

      scope.$apply('txtInput=\'morethantencharacters\'');
      expect(element.attr('aria-invalid')).toBe('false');
    });

    test('should not attach itself if aria-invalid is already present', () => {
      compileElement('<input ng-model="txtInput" ng-minlength="10" aria-invalid="userSetValue">');
      scope.$apply('txtInput=\'LTten\'');
      expect(element.attr('aria-invalid')).toBe('userSetValue');
    });

    test('should not attach if input is type="hidden"', () => {
      compileElement('<input type="hidden" ng-model="txtInput">');
      expect(element.attr('aria-invalid')).toBeUndefined();
    });


    test('should attach aria-invalid to custom control that is type="hidden"', () => {
      compileElement('<div ng-model="txtInput" type="hidden" role="textbox" ng-minlength="10"></div>');
      scope.$apply('txtInput=\'LTten\'');
      expect(element.attr('aria-invalid')).toBe('true');

      scope.$apply('txtInput=\'morethantencharacters\'');
      expect(element.attr('aria-invalid')).toBe('false');
    });
  });

  describe('aria-invalid when disabled', () => {
    beforeEach(configAriaProvider({
      ariaInvalid: false
    }));
    beforeEach(injectScopeAndCompiler);

    test('should not attach aria-invalid if the option is disabled', () => {
      scope.$apply('txtInput=\'LTten\'');
      compileElement('<input ng-model="txtInput" ng-minlength="10">');
      expect(element.attr('aria-invalid')).toBeUndefined();
    });
  });

  describe('aria-readonly', () => {
    beforeEach(injectScopeAndCompiler);

    test.each(Object.entries({
      input: '<input ng-readonly="val">',
      textarea: '<textarea ng-readonly="val"></textarea>',
      select: '<select ng-readonly="val"></select>',
      button: '<button ng-readonly="val"></button>'
    }).map(([prop, value]) => ({ prop, value })))(
        'should not attach itself to native $prop controls', function({ value: tmpl }) {
      var element = compileForTest(tmpl, scope);
      scope.$apply('val = true');

      expect(element.attr('readonly')).toBeDefined();
      expect(element.attr('aria-readonly')).toBeUndefined();
    });

    test('should attach itself to custom controls', () => {
      compileElement('<div ng-readonly="val"></div>');
      expect(element.attr('aria-readonly')).toBe('false');

      scope.$apply('val = true');
      expect(element.attr('aria-readonly')).toBe('true');

    });

    test('should not attach itself if an aria-readonly attribute is already present', () => {
      compileElement('<div ng-readonly="val" aria-readonly="userSetValue"></div>');

      expect(element.attr('aria-readonly')).toBe('userSetValue');
    });

    test('should always set aria-readonly to a boolean value', () => {
      compileElement('<div ng-readonly="val"></div>');

      scope.$apply('val = "test angular"');
      expect(element.attr('aria-readonly')).toBe('true');

      scope.$apply('val = null');
      expect(element.attr('aria-readonly')).toBe('false');

      scope.$apply('val = {}');
      expect(element.attr('aria-readonly')).toBe('true');
    });
  });

  describe('aria-readonly when disabled', () => {
    beforeEach(configAriaProvider({
      ariaReadonly: false
    }));
    beforeEach(injectScopeAndCompiler);

    test('should not add the aria-readonly attribute', () => {
      compileElement('<input ng-model=\'val\' readonly>');
      expect(element.attr('aria-readonly')).toBeUndefined();

      compileElement('<div ng-model=\'val\' ng-readonly=\'true\'></div>');
      expect(element.attr('aria-readonly')).toBeUndefined();
    });
  });

  describe('aria-required', () => {
    beforeEach(injectScopeAndCompiler);

    test('should not attach to input', () => {
      compileElement('<input ng-model="val" required>');
      expect(element.attr('aria-required')).toBeUndefined();
    });

    test('should attach to custom controls with ngModel and required', () => {
      compileElement('<div ng-model="val" role="checkbox" required></div>');
      expect(element.attr('aria-required')).toBe('true');
    });

    test('should set aria-required to false when ng-required is false', () => {
      compileElement('<div role=\'checkbox\' ng-required=\'false\' ng-model=\'val\'></div>');
      expect(element.attr('aria-required')).toBe('false');
    });

    test('should attach to custom controls with ngRequired', () => {
      compileElement('<div role="checkbox" ng-model="val" ng-required="true"></div>');
      expect(element.attr('aria-required')).toBe('true');
    });

    test('should not attach itself if aria-required is already present', () => {
      compileElement('<div role=\'checkbox\' ng-model=\'val\' ng-required=\'true\' aria-required=\'userSetValue\'></div>');
      expect(element.attr('aria-required')).toBe('userSetValue');
    });
  });

  describe('aria-required when disabled', () => {
    beforeEach(configAriaProvider({
      ariaRequired: false
    }));
    beforeEach(injectScopeAndCompiler);

    test('should not add the aria-required attribute', () => {
      compileElement('<input ng-model=\'val\' required>');
      expect(element.attr('aria-required')).toBeUndefined();

      compileElement('<div ng-model=\'val\' ng-required=\'true\'></div>');
      expect(element.attr('aria-required')).toBeUndefined();
    });
  });

  describe('aria-value', () => {
    beforeEach(injectScopeAndCompiler);

    test('should attach to input type="range"', () => {
      var element = [
        $compile('<input type="range" ng-model="val" min="0" max="100">')(scope),
        $compile('<div role="progressbar" min="0" max="100" ng-model="val">')(scope),
        $compile('<div role="slider" min="0" max="100" ng-model="val">')(scope)
      ];

      scope.$apply('val = 50');
      expectAriaAttrOnEachElement(element, 'aria-valuenow', '50');
      expectAriaAttrOnEachElement(element, 'aria-valuemin', '0');
      expectAriaAttrOnEachElement(element, 'aria-valuemax', '100');

      scope.$apply('val = 90');
      expectAriaAttrOnEachElement(element, 'aria-valuenow', '90');
      element.forEach((e) => dealoc(e));
    });

    test('should not attach if aria-value* is already present', () => {
      var element = [
        $compile('<input type="range" ng-model="val" min="0" max="100" aria-valuenow="userSetValue1" aria-valuemin="userSetValue2" aria-valuemax="userSetValue3">')(scope),
        $compile('<div role="progressbar" min="0" max="100" ng-model="val" aria-valuenow="userSetValue1" aria-valuemin="userSetValue2" aria-valuemax="userSetValue3">')(scope),
        $compile('<div role="slider" min="0" max="100" ng-model="val" aria-valuenow="userSetValue1" aria-valuemin="userSetValue2" aria-valuemax="userSetValue3">')(scope)
      ];

      scope.$apply('val = 50');
      expectAriaAttrOnEachElement(element, 'aria-valuenow', 'userSetValue1');
      expectAriaAttrOnEachElement(element, 'aria-valuemin', 'userSetValue2');
      expectAriaAttrOnEachElement(element, 'aria-valuemax', 'userSetValue3');
      element.forEach((e) => dealoc(e));
    });


    test('should update `aria-valuemin/max` when `min/max` changes dynamically', () => {
      scope.$apply('min = 25; max = 75');
      compileElement('<input type="range" ng-model="val" min="{{min}}" max="{{max}}" />');

      expect(element.attr('aria-valuemin')).toBe('25');
      expect(element.attr('aria-valuemax')).toBe('75');

      scope.$apply('min = 0');
      expect(element.attr('aria-valuemin')).toBe('0');

      scope.$apply('max = 100');
      expect(element.attr('aria-valuemax')).toBe('100');
    });


    test('should update `aria-valuemin/max` when `ng-min/ng-max` changes dynamically', () => {
      scope.$apply('min = 25; max = 75');
      compileElement('<input type="range" ng-model="val" ng-min="min" ng-max="max" />');

      expect(element.attr('aria-valuemin')).toBe('25');
      expect(element.attr('aria-valuemax')).toBe('75');

      scope.$apply('min = 0');
      expect(element.attr('aria-valuemin')).toBe('0');

      scope.$apply('max = 100');
      expect(element.attr('aria-valuemax')).toBe('100');
    });
  });

  describe('announcing ngMessages', () => {
    beforeEach(injectScopeAndCompiler);

    test('should attach aria-live', () => {
      var element = [
        $compile('<div ng-messages="myForm.myName.$error">')(scope)
      ];
      expectAriaAttrOnEachElement(element, 'aria-live', 'assertive');
      element.forEach((e) => dealoc(e));
    });
  });

  describe('aria-value when disabled', () => {
    beforeEach(configAriaProvider({
      ariaValue: false
    }));
    beforeEach(injectScopeAndCompiler);

    test('should not attach itself', () => {
      scope.$apply('val = 50');

      compileElement('<input type="range" ng-model="val" min="0" max="100">');
      expect(element.attr('aria-valuenow')).toBeUndefined();
      expect(element.attr('aria-valuemin')).toBeUndefined();
      expect(element.attr('aria-valuemax')).toBeUndefined();

      compileElement('<div role="progressbar" min="0" max="100" ng-model="val">');
      expect(element.attr('aria-valuenow')).toBeUndefined();
      expect(element.attr('aria-valuemin')).toBeUndefined();
      expect(element.attr('aria-valuemax')).toBeUndefined();
    });
  });

  describe('tabindex', () => {
    beforeEach(injectScopeAndCompiler);

    test.each(Object.entries({
      'button': '<button ng-click=\'something\'></button>',
      'a': '<a ng-href=\'#/something\'>',
      'input[text]': '<input type=\'text\' ng-model=\'val\'>',
      'input[radio]': '<input type=\'radio\' ng-model=\'val\'>',
      'input[checkbox]': '<input type=\'checkbox\' ng-model=\'val\'>',
      'textarea': '<textarea ng-model=\'val\'></textarea>',
      'select': '<select ng-model=\'val\'></select>',
      'details': '<details ng-model=\'val\'></details>'
    }).map(([prop, value]) => ({ prop, value })))(
        'should not attach to native control $prop', function({ value: html }) {
        compileElement(html);
        expect(element.attr('tabindex')).toBeUndefined();
    });

    test('should not attach to random ng-model elements', () => {
      compileElement('<div ng-model="val"></div>');
      expect(element.attr('tabindex')).toBeUndefined();
    });

    test('should attach tabindex to custom inputs', () => {
      compileElement('<div role="checkbox" ng-model="val"></div>');
      expect(element.attr('tabindex')).toBe('0');

      compileElement('<div role="slider" ng-model="val"></div>');
      expect(element.attr('tabindex')).toBe('0');
    });

    test('should attach to ng-click and ng-dblclick', () => {
      compileElement('<div ng-click="someAction()"></div>');
      expect(element.attr('tabindex')).toBe('0');

      compileElement('<div ng-dblclick="someAction()"></div>');
      expect(element.attr('tabindex')).toBe('0');
    });

    test('should not attach tabindex if it is already on an element', () => {
      compileElement('<div role="button" tabindex="userSetValue"></div>');
      expect(element.attr('tabindex')).toBe('userSetValue');

      compileElement('<div role="checkbox" tabindex="userSetValue"></div>');
      expect(element.attr('tabindex')).toBe('userSetValue');

      compileElement('<div ng-click="someAction()" tabindex="userSetValue"></div>');
      expect(element.attr('tabindex')).toBe('userSetValue');

      compileElement('<div ng-dblclick="someAction()" tabindex="userSetValue"></div>');
      expect(element.attr('tabindex')).toBe('userSetValue');
    });
  });

  describe('accessible actions', () => {
    var clickEvents;

    beforeEach(injectScopeAndCompiler);
     beforeEach(() => {
      clickEvents = [];
      scope.onClick = jest.fn().mockName('onClick').mockImplementation(function(evt) {
        var nodeName = evt ? evt.target.nodeName.toLowerCase() : '';
        var prevented = !!(evt && evt.isDefaultPrevented());
        clickEvents.push(nodeName + '(' + prevented + ')');
      });
    });

    test('should trigger a click from the keyboard (and prevent default action)', () => {
      compileElement(
        '<section>' +
          '<div ng-click="onClick($event)"></div>' +
          '<ul><li ng-click="onClick($event)"></li></ul>' +
        '</section>');

      var divElement = element.find('div');
      var liElement = element.find('li');

      divElement.triggerHandler({type: 'keydown', keyCode: 13});
      liElement.triggerHandler({type: 'keydown', keyCode: 13});
      divElement.triggerHandler({type: 'keydown', keyCode: 32});
      liElement.triggerHandler({type: 'keydown', keyCode: 32});

      expect(clickEvents).toEqual(['div(true)', 'li(true)', 'div(true)', 'li(true)']);
    });

    test('should trigger a click in browsers that provide `event.which` instead of `event.keyCode`',
      function() {
        compileElement(
          '<section>' +
            '<div ng-click="onClick($event)"></div>' +
            '<ul><li ng-click="onClick($event)"></li></ul>' +
          '</section>');

        var divElement = element.find('div');
        var liElement = element.find('li');

        divElement.triggerHandler({type: 'keydown', which: 13});
        liElement.triggerHandler({type: 'keydown', which: 13});
        divElement.triggerHandler({type: 'keydown', which: 32});
        liElement.triggerHandler({type: 'keydown', which: 32});

        expect(clickEvents).toEqual(['div(true)', 'li(true)', 'div(true)', 'li(true)']);
      }
    );

    test('should not prevent default keyboard action if the target element has editable content',
      angular.mock.inject(function() {
        // Note:
        // `contenteditable` is an enumarated (not a boolean) attribute (see
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable).
        // We need to check the following conditions:
        //   - No attribute.
        //   - Value: ""
        //   - Value: "true"
        //   - Value: "false"

        function eventFor(keyCode) {
          return {bubbles: true, cancelable: true, keyCode: keyCode};
        }

        compileElement(
          '<section>' +
            // No attribute.
            '<div id="no-attribute">' +
              '<div ng-click="onClick($event)"></div>' +
              '<ul ng-click="onClick($event)"><li></li></ul>' +
            '</div>' +

            // Value: ""
            '<div id="value-empty">' +
              '<div ng-click="onClick($event)" contenteditable=""></div>' +
              '<ul ng-click="onClick($event)"><li contenteditable=""></li></ul>' +
            '</div>' +

            // Value: "true"
            '<div id="value-true">' +
              '<div ng-click="onClick($event)" contenteditable="true"></div>' +
              '<ul ng-click="onClick($event)"><li contenteditable="true"></li></ul>' +
            '</div>' +

            // Value: "false"
            '<div id="value-false">' +
              '<div ng-click="onClick($event)" contenteditable="false"></div>' +
              '<ul ng-click="onClick($event)"><li contenteditable="false"></li></ul>' +
            '</div>' +
          '</section>');

        // Support: Safari 11-12+
        // Attach to DOM, because otherwise Safari will not update the `isContentEditable` property
        // based on the `contenteditable` attribute.
        document.body.append(element);

        var containers = element.children();
        var container;

        // Using `browserTrigger()`, because it supports event bubbling.

        // No attribute | Elements are not editable.
        container = containers.eq(0);
        browserTrigger(container.find('div'), 'keydown', eventFor(13));
        browserTrigger(container.find('ul'), 'keydown', eventFor(32));
        browserTrigger(container.find('li'), 'keydown', eventFor(13));

        expect(clickEvents).toEqual(expect.arrayContaining(['div(true)', 'ul(true)', 'li(true)']));

        // Value: "" | Elements are editable.
        clickEvents = [];
        container = containers.eq(1);
        browserTrigger(container.find('div'), 'keydown', eventFor(32));
        browserTrigger(container.find('ul'), 'keydown', eventFor(13));
        browserTrigger(container.find('li'), 'keydown', eventFor(32));

        expect(clickEvents).toEqual(expect.arrayContaining(['div(false)', 'ul(true)', 'li(false)']));

        // Value: "true" | Elements are editable.
        clickEvents = [];
        container = containers.eq(2);
        browserTrigger(container.find('div'), 'keydown', eventFor(13));
        browserTrigger(container.find('ul'), 'keydown', eventFor(32));
        browserTrigger(container.find('li'), 'keydown', eventFor(13));

        expect(clickEvents).toEqual(expect.arrayContaining(['div(false)', 'ul(true)', 'li(false)']));

        // Value: "false" | Elements are not editable.
        clickEvents = [];
        container = containers.eq(3);
        browserTrigger(container.find('div'), 'keydown', eventFor(32));
        browserTrigger(container.find('ul'), 'keydown', eventFor(13));
        browserTrigger(container.find('li'), 'keydown', eventFor(32));

        expect(clickEvents).toEqual(expect.arrayContaining(['div(true)', 'ul(true)', 'li(true)']));
      })
    );

    test.each(nativeAriaNodeNames.map((prop) => ({ prop })))(
        'should not prevent default keyboard action if an interactive $type element' +
      'is nested inside ng-click', function({ prop: elementType }) {
        function createHTML(type) {
          return '<' + type + '></' + type + '>';
        }

        compileElement(
          '<section>' +
            '<div ng-click="onClick($event)">' + createHTML(elementType) + '</div>' +
          '</section>');

        var divElement = element.find('div');
        var interactiveElement = element.find(elementType);

        // Use browserTrigger because it supports event bubbling
        // 13 Enter
        browserTrigger(interactiveElement, 'keydown', {cancelable: true, bubbles: true, keyCode: 13});
        expect(clickEvents).toEqual([elementType.toLowerCase() + '(false)']);

        clickEvents = [];

        // 32 Space
        browserTrigger(interactiveElement, 'keydown', {cancelable: true, bubbles: true, keyCode: 32});
        expect(clickEvents).toEqual([elementType.toLowerCase() + '(false)']);
      });

    test.each(['keydown', 'keypress', 'keyup'].map((prop) => ({ prop })))(
        'should not bind to key events if there is existing `ng-$prop`', function({ prop: eventName }) {
        scope.onKeyEvent = jest.fn().mockName('onKeyEvent');
        compileElement('<div ng-click="onClick()" ng-' + eventName + '="onKeyEvent()"></div>');

        element.triggerHandler({type: eventName, keyCode: 13});
        element.triggerHandler({type: eventName, keyCode: 32});

        expect(scope.onClick).not.toHaveBeenCalled();
        expect(scope.onKeyEvent).toHaveBeenCalledTimes(2);
      });

    test('should update bindings when keydown is handled', () => {
      scope.count = 0;
      compileElement('<div ng-click="count = count + 1">Count: {{ count }}</div>');

      expect(element.text()).toBe('Count: 0');

      element.triggerHandler({type: 'keydown', keyCode: 13});
      expect(element.text()).toBe('Count: 1');

      element.triggerHandler({type: 'keydown', keyCode: 32});
      expect(element.text()).toBe('Count: 2');
    });

    test('should pass `$event` to `ng-click` handler as local', () => {
      compileElement('<div ng-click="event = $event">{{ event.type }}{{ event.keyCode }}</div>');
      expect(element.text()).toBe('');

      element.triggerHandler({type: 'keydown', keyCode: 13});
      expect(element.text()).toBe('keydown13');

      element.triggerHandler({type: 'keydown', keyCode: 32});
      expect(element.text()).toBe('keydown32');
    });

    test('should not bind keydown to natively interactive elements', () => {
      compileElement('<button ng-click="onClick()">Click me</button>');

      element.triggerHandler({type: 'keydown', keyCode: 13});
      element.triggerHandler({type: 'keydown', keyCode: 32});

      expect(scope.onClick).not.toHaveBeenCalled();
    });
  });

  describe('actions when bindRoleForClick is set to false', () => {
    beforeEach(configAriaProvider({
      bindRoleForClick: false
    }));
    beforeEach(injectScopeAndCompiler);

    test('should not add a button role', () => {
      compileElement('<radio-group ng-click="something"></radio-group>');
      expect(element.attr('role')).toBeUndefined();
    });
  });

  describe('actions when bindKeydown is set to false', () => {
    beforeEach(configAriaProvider({
      bindKeydown: false
    }));
    beforeEach(injectScopeAndCompiler);

    test('should not trigger click', () => {
      scope.someAction = jest.fn().mockName('someAction');

      element = compileForTest('<div ng-click="someAction()" tabindex="0"></div>', scope);

      element.triggerHandler({type: 'keydown', keyCode: 13});
      element.triggerHandler({type: 'keydown', keyCode: 32});
      element.triggerHandler({type: 'keypress', keyCode: 13});
      element.triggerHandler({type: 'keypress', keyCode: 32});
      element.triggerHandler({type: 'keyup', keyCode: 13});
      element.triggerHandler({type: 'keyup', keyCode: 32});

      expect(scope.someAction).not.toHaveBeenCalled();

      element.triggerHandler({type: 'click', keyCode: 32});

      expect(scope.someAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('tabindex when disabled', () => {
    beforeEach(configAriaProvider({
      tabindex: false
    }));
    beforeEach(injectScopeAndCompiler);

    test('should not add a tabindex attribute', () => {
      compileElement('<div role="button"></div>');
      expect(element.attr('tabindex')).toBeUndefined();

      compileElement('<div role="checkbox"></div>');
      expect(element.attr('tabindex')).toBeUndefined();

      compileElement('<div ng-click="someAction()"></div>');
      expect(element.attr('tabindex')).toBeUndefined();

      compileElement('<div ng-dblclick="someAction()"></div>');
      expect(element.attr('tabindex')).toBeUndefined();
    });
  });

  describe('ngModel', () => {
    test('should not break when manually compiling', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('foo', function() {
          return {
            priority: 10,
            terminal: true,
            link(scope, elem) {
              $compile(elem, null, 10)(scope);
            }
          };
        });
      });

      injectScopeAndCompiler();
      compileElement('<div role="checkbox" ng-model="value" foo />');

      // Just check an arbitrary feature to make sure it worked
      expect(element.attr('tabindex')).toBe('0');
    });
  });

  // Helpers
  function compileElement(inputHtml) {
    element = compileForTest(inputHtml, scope);
    scope.$digest();
  }

  function configAriaProvider(config) {
    return function() {
      angular.mock.module(function($ariaProvider) {
        $ariaProvider.config(config);
      });
    };
  }

  function expectAriaAttrOnEachElement(elem, ariaAttr, expected) {
    angular.forEach(elem, function(val) {
      expect(angular.element(val).attr(ariaAttr)).toBe(expected);
    });
  }

  function injectScopeAndCompiler() {
    return angular.mock.inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      scope = _$rootScope_;
    });
  }
});
