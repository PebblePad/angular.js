'use strict';
 describe('ngOn* event binding', () => {
  var element;

   afterEach(() => {
    dealoc(element);
  })

  test('should add event listener of specified name', angular.mock.inject(function($compile, $rootScope) {
    $rootScope.name = 'Misko';
    element = $compile('<span ng-on-foo="name = name + 3"></span>')($rootScope);
    element.triggerHandler('foo');
    expect($rootScope.name).toBe('Misko3');
  }));

  test('should use angular.element(x).on() API to add listener', angular.mock.inject(function($compile, $rootScope) {
    const spy = jest.spyOn(angular.element.prototype, 'on').mockImplementation(() => {});

    element = $compile('<span ng-on-foo="name = name + 3"></span>')($rootScope);

    expect(angular.element.prototype.on).toHaveBeenCalledWith('foo', expect.any(Function));
    spy.mockRestore();
  }));

  test('should allow access to the $event object', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<span ng-on-foo="e = $event"></span>')($rootScope);
    element.triggerHandler('foo');
    expect($rootScope.e.target).toBe(element[0]);
  }));

  test('should call the listener synchronously', angular.mock.inject(function($compile, $rootScope) {
    element = $compile('<span ng-on-foo="fooEvent()"></span>')($rootScope);
    $rootScope.fooEvent = jest.fn().mockName('fooEvent');

    element.triggerHandler('foo');

    expect($rootScope.fooEvent).toHaveBeenCalledTimes(1);
  }));

  test('should support multiple events on a single element', angular.mock.inject(function($compile, $rootScope) {
    element = $compile('<span ng-on-foo="fooEvent()" ng-on-bar="barEvent()"></span>')($rootScope);
    $rootScope.fooEvent = jest.fn().mockName('fooEvent');
    $rootScope.barEvent = jest.fn().mockName('barEvent');

    element.triggerHandler('foo');
    expect($rootScope.fooEvent).toHaveBeenCalled();
    expect($rootScope.barEvent).not.toHaveBeenCalled();

    $rootScope.fooEvent.mockClear();
    $rootScope.barEvent.mockClear();

    element.triggerHandler('bar');
    expect($rootScope.fooEvent).not.toHaveBeenCalled();
    expect($rootScope.barEvent).toHaveBeenCalled();
  }));

  test('should work with different prefixes', angular.mock.inject(function($rootScope, $compile) {
    var cb = $rootScope.cb = jest.fn().mockName('ng-on cb');
    element = $compile('<span ng:on:test="cb(1)" ng-On-test2="cb(2)" ng_On_test3="cb(3)"></span>')($rootScope);

    element.triggerHandler('test');
    expect(cb).toHaveBeenCalledWith(1);

    element.triggerHandler('test2');
    expect(cb).toHaveBeenCalledWith(2);

    element.triggerHandler('test3');
    expect(cb).toHaveBeenCalledWith(3);
  }));

  test('should work if they are prefixed with x- or data- and different prefixes', angular.mock.inject(function($rootScope, $compile) {
    var cb = $rootScope.cb = jest.fn().mockName('ng-on cb');
    element = $compile('<span data-ng-on-test2="cb(2)" x-ng-on-test3="cb(3)" data-ng:on-test4="cb(4)" ' +
      'x_ng-on-test5="cb(5)" data:ng-on-test6="cb(6)"></span>')($rootScope);

    element.triggerHandler('test2');
    expect(cb).toHaveBeenCalledWith(2);

    element.triggerHandler('test3');
    expect(cb).toHaveBeenCalledWith(3);

    element.triggerHandler('test4');
    expect(cb).toHaveBeenCalledWith(4);

    element.triggerHandler('test5');
    expect(cb).toHaveBeenCalledWith(5);

    element.triggerHandler('test6');
    expect(cb).toHaveBeenCalledWith(6);
  }));

  test('should work independently of attributes with the same name', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<span ng-on-asdf="cb()" asdf="foo" />')($rootScope);
    var cb = $rootScope.cb = jest.fn().mockName('ng-on cb');
    $rootScope.$digest();
    element.triggerHandler('asdf');
    expect(cb).toHaveBeenCalled();
    expect(element.attr('asdf')).toBe('foo');
  }));

  test('should work independently of (ng-)attributes with the same name', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<span ng-on-asdf="cb()" ng-attr-asdf="foo" />')($rootScope);
    var cb = $rootScope.cb = jest.fn().mockName('ng-on cb');
    $rootScope.$digest();
    element.triggerHandler('asdf');
    expect(cb).toHaveBeenCalled();
    expect(element.attr('asdf')).toBe('foo');
  }));

  test('should work independently of properties with the same name', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<span ng-on-asdf="cb()" ng-prop-asdf="123" />')($rootScope);
    var cb = $rootScope.cb = jest.fn().mockName('ng-on cb');
    $rootScope.$digest();
    element.triggerHandler('asdf');
    expect(cb).toHaveBeenCalled();
    expect(element.prop('asdf')).toBe(123);
  }));

  test('should use the full ng-on-* attribute name in $attr mappings', () => {
    var attrs;
    angular.mock.module(function($compileProvider) {
      $compileProvider.directive('attrExposer', ngInternals.valueFn({
        link($scope, $element, $attrs) {
          attrs = $attrs;
        }
      }));
    });
    angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<div attr-exposer ng-on-title="cb(1)" ng-on-super-title="cb(2)" ng-on-my-camel_title="cb(3)">')($rootScope);

      expect(attrs.title).toBeUndefined();
      expect(attrs.$attr.title).toBeUndefined();
      expect(attrs.ngOnTitle).toBe('cb(1)');
      expect(attrs.$attr.ngOnTitle).toBe('ng-on-title');

      expect(attrs.superTitle).toBeUndefined();
      expect(attrs.$attr.superTitle).toBeUndefined();
      expect(attrs.ngOnSuperTitle).toBe('cb(2)');
      expect(attrs.$attr.ngOnSuperTitle).toBe('ng-on-super-title');

      expect(attrs.myCamelTitle).toBeUndefined();
      expect(attrs.$attr.myCamelTitle).toBeUndefined();
      expect(attrs.ngOnMyCamelTitle).toBe('cb(3)');
      expect(attrs.$attr.ngOnMyCamelTitle).toBe('ng-on-my-camel_title');
    });
  });

  test('should not conflict with (ng-attr-)attribute mappings of the same name', () => {
    var attrs;
    angular.mock.module(function($compileProvider) {
      $compileProvider.directive('attrExposer', ngInternals.valueFn({
        link($scope, $element, $attrs) {
          attrs = $attrs;
        }
      }));
    });
    angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<div attr-exposer ng-on-title="42" ng-attr-title="foo" title="bar">')($rootScope);
      expect(attrs.title).toBe('foo');
      expect(attrs.$attr.title).toBe('title');
      expect(attrs.$attr.ngOnTitle).toBe('ng-on-title');
    });
  });

  test('should correctly bind to kebab-cased event names', angular.mock.inject(function($compile, $rootScope) {
    element = $compile('<span ng-on-foo-bar="cb()"></span>')($rootScope);
    var cb = $rootScope.cb = jest.fn().mockName('ng-on cb');
    $rootScope.$digest();

    element.triggerHandler('foobar');
    element.triggerHandler('fooBar');
    element.triggerHandler('foo_bar');
    element.triggerHandler('foo:bar');
    expect(cb).not.toHaveBeenCalled();

    element.triggerHandler('foo-bar');
    expect(cb).toHaveBeenCalled();
  }));

  test('should correctly bind to camelCased event names', angular.mock.inject(function($compile, $rootScope) {
    element = $compile('<span ng-on-foo_bar="cb()"></span>')($rootScope);
    var cb = $rootScope.cb = jest.fn().mockName('ng-on cb');
    $rootScope.$digest();

    element.triggerHandler('foobar');
    element.triggerHandler('foo-bar');
    element.triggerHandler('foo_bar');
    element.triggerHandler('foo:bar');
    expect(cb).not.toHaveBeenCalled();

    element.triggerHandler('fooBar');
    expect(cb).toHaveBeenCalled();
  }));
});
