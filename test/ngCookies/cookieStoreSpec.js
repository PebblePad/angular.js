'use strict';

describe('$cookieStore', function() {

  beforeEach(angular.mock.module('ngCookies', {
    $cookies: {
      'getObject': jest.fn(),
      'putObject': jest.fn(),
      'remove': jest.fn()
    }
  }));


  it('should get cookie', angular.mock.inject(function($cookieStore, $cookies) {
    $cookies.getObject.mockReturnValue('value');
    expect($cookieStore.get('name')).toBe('value');
    expect($cookies.getObject).toHaveBeenCalledWith('name');
  }));


  it('should put cookie', angular.mock.inject(function($cookieStore, $cookies) {
    $cookieStore.put('name', 'value');
    expect($cookies.putObject).toHaveBeenCalledWith('name', 'value');
  }));


  it('should remove cookie', angular.mock.inject(function($cookieStore, $cookies) {
    $cookieStore.remove('name');
    expect($cookies.remove).toHaveBeenCalledWith('name');
  }));
 });
