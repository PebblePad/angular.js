'use strict';
 describe('ngKeyup and ngKeydown directives', () => {
  var element;

   afterEach(() => {
    dealoc(element);
  });

  test('should get called on a keyup', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<input ng-keyup="touched = true">')($rootScope);
    $rootScope.$digest();
    expect($rootScope.touched).toBeFalsy();

    browserTrigger(element, 'keyup');
    expect($rootScope.touched).toEqual(true);
  }));

  test('should get called on a keydown', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<input ng-keydown="touched = true">')($rootScope);
    $rootScope.$digest();
    expect($rootScope.touched).toBeFalsy();

    browserTrigger(element, 'keydown');
    expect($rootScope.touched).toEqual(true);
  }));

  test('should get called on a keypress', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<input ng-keypress="touched = true">')($rootScope);
    $rootScope.$digest();
    expect($rootScope.touched).toBeFalsy();

    browserTrigger(element, 'keypress');
    expect($rootScope.touched).toEqual(true);
  }));

});

