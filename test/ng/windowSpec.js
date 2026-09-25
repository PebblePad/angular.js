'use strict';
 describe('$window', () => {
  test('should inject $window', angular.mock.inject(function($window) {
    expect($window).toBe(window);
  }));

  test('should be able to mock $window without errors', () => {
    angular.mock.module({$window: {}});
    angular.mock.inject(['$sce', angular.noop]);
  });
});
