'use strict';

describe('ngCloak', function() {
  var element;


  afterEach(function() {
    dealoc(element);
  });


  it('should get removed when an element is compiled', angular.mock.inject(function($rootScope, $compile) {
    element = angular.element('<div ng-cloak></div>');
    expect(element.attr('ng-cloak')).toBe('');
    $compile(element);
    expect(element.attr('ng-cloak')).toBeUndefined();
  }));


  it('should remove ngCloak class from a compiled element with attribute', angular.mock.inject(
      function($rootScope, $compile) {
    element = angular.element('<div ng-cloak class="foo ng-cloak bar"></div>');

    expect(element.hasClass('foo')).toBe(true);
    expect(element.hasClass('ng-cloak')).toBe(true);
    expect(element.hasClass('bar')).toBe(true);

    $compile(element);

    expect(element.hasClass('foo')).toBe(true);
    expect(element.hasClass('ng-cloak')).toBe(false);
    expect(element.hasClass('bar')).toBe(true);
  }));


  it('should remove ngCloak class from a compiled element', angular.mock.inject(function($rootScope, $compile) {
    element = angular.element('<div class="foo ng-cloak bar"></div>');

    expect(element.hasClass('foo')).toBe(true);
    expect(element.hasClass('ng-cloak')).toBe(true);
    expect(element.hasClass('bar')).toBe(true);

    $compile(element);

    expect(element.hasClass('foo')).toBe(true);
    expect(element.hasClass('ng-cloak')).toBe(false);
    expect(element.hasClass('bar')).toBe(true);
  }));
});
