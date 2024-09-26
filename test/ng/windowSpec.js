'use strict';

describe('$window', function() {
  it('should inject $window', angular.mock.inject(function($window) {
    expect($window).toBe(window);
  }));

  it('should be able to mock $window without errors', function() {
    angular.mock.module({$window: {}});
    angular.mock.inject(['$sce', angular.noop]);
  });
});
