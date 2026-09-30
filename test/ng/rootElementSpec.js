'use strict';
 describe('$rootElement', () => {
  test('should publish the bootstrap element into $rootElement', () => {
    window.name = "";
    var element = angular.element('<div></div>');
    var injector = angular.bootstrap(element);

    expect(injector.get('$rootElement')[0]).toBe(element[0]);
    dealoc(element)
  });
});
