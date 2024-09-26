'use strict';

describe('$rootElement', function() {
  it('should publish the bootstrap element into $rootElement', function() {
    window.name = "";
    var element = angular.element('<div></div>');
    var injector = angular.bootstrap(element);

    expect(injector.get('$rootElement')[0]).toBe(element[0]);

    dealoc(element);
  });
});
