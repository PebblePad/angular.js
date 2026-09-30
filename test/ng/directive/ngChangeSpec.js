'use strict';

/* globals generateInputCompilerHelper: false */
 describe('ngChange', () => {
  var helper = {};
  var $rootScope;

  generateInputCompilerHelper(helper);

  beforeEach(angular.mock.inject(function(_$rootScope_) {
    $rootScope = _$rootScope_;
  }));

  test('should $eval expression after new value is set in the model', () => {
    helper.compileInput('<input type="text" ng-model="value" ng-change="change()" />');

    $rootScope.change = jest.fn().mockName('change').mockImplementation(function() {
      expect($rootScope.value).toBe('new value');
    });

    helper.changeInputValueTo('new value');
    expect($rootScope.change).toHaveBeenCalledTimes(1);
  });


  test('should not $eval the expression if changed from model', () => {
    helper.compileInput('<input type="text" ng-model="value" ng-change="change()" />');

    $rootScope.change = jest.fn().mockName('change');
    $rootScope.$apply('value = true');

    expect($rootScope.change).not.toHaveBeenCalled();
  });


  test('should $eval ngChange expression on checkbox', () => {
    var inputElm = helper.compileInput('<input type="checkbox" ng-model="foo" ng-change="changeFn()">');

    $rootScope.changeFn = jest.fn().mockName('changeFn');
    expect($rootScope.changeFn).not.toHaveBeenCalled();

    browserTrigger(inputElm, 'click');
    expect($rootScope.changeFn).toHaveBeenCalledTimes(1);
  });


  test('should be able to change the model and via that also update the view', () => {
    var inputElm = helper.compileInput('<input type="text" ng-model="value" ng-change="value=\'b\'" />');

    helper.changeInputValueTo('a');
    expect(inputElm.val()).toBe('b');
  });
});
