'use strict';

describe('style', function() {
  var element;


  afterEach(function() {
    dealoc(element);
  });


  it('should compile style element without binding', angular.mock.inject(function($compile, $rootScope) {
    element = angular.element('<style type="text/css">.header{font-size:1.5em; h3{font-size:1.5em}}</style>');
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe('.header{font-size:1.5em; h3{font-size:1.5em}}');
  }));


  it('should compile style element with one simple bind', angular.mock.inject(function($compile, $rootScope) {
    element = angular.element('<style type="text/css">.some-container{ width: {{elementWidth}}px; }</style>');
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe('.some-container{ width: px; }');

    $rootScope.$apply(function() {
      $rootScope.elementWidth = 200;
    });

    expect(element[0].innerHTML).toBe('.some-container{ width: 200px; }');
  }));


  it('should compile style element with one bind', angular.mock.inject(function($compile, $rootScope) {
    element = angular.element('<style type="text/css">.header{ h3 { font-size: {{fontSize}}em }}</style>');
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe('.header{ h3 { font-size: em }}');

    $rootScope.$apply(function() {
      $rootScope.fontSize = 1.5;
    });

    expect(element[0].innerHTML).toBe('.header{ h3 { font-size: 1.5em }}');
  }));


  it('should compile style element with two binds', angular.mock.inject(function($compile, $rootScope) {
    element = angular.element('<style type="text/css">.header{ h3 { font-size: {{fontSize}}{{unit}} }}</style>');
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe('.header{ h3 { font-size:  }}');

    $rootScope.$apply(function() {
      $rootScope.fontSize = 1.5;
      $rootScope.unit = 'em';
    });

    expect(element[0].innerHTML).toBe('.header{ h3 { font-size: 1.5em }}');
  }));


  it('should compile content of element with style attr', angular.mock.inject(function($compile, $rootScope) {
    element = angular.element('<div style="some">{{bind}}</div>');
    $compile(element)($rootScope);
    $rootScope.$apply(function() {
      $rootScope.bind = 'value';
    });

    expect(element.text()).toBe('value');
  }));
});
