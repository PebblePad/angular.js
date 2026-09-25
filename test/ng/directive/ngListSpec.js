'use strict';

/* globals generateInputCompilerHelper: false */
 describe('ngList', () => {
  var helper = {};
  var $rootScope;

  generateInputCompilerHelper(helper);

  beforeEach(angular.mock.inject(function(_$rootScope_) {
    $rootScope = _$rootScope_;
  }));

  test('should parse text into an array', () => {
    var inputElm = helper.compileInput('<input type="text" ng-model="list" ng-list />');

    // model -> view
    $rootScope.$apply('list = [\'x\', \'y\', \'z\']');
    expect(inputElm.val()).toBe('x, y, z');

    // view -> model
    helper.changeInputValueTo('1, 2, 3');
    expect($rootScope.list).toEqual(['1', '2', '3']);
  });


  test('should not clobber text if model changes due to itself', () => {
    // When the user types 'a,b' the 'a,' stage parses to ['a'] but if the
    // $parseModel function runs it will change to 'a', in essence preventing
    // the user from ever typing ','.
    var inputElm = helper.compileInput('<input type="text" ng-model="list" ng-list />');

    helper.changeInputValueTo('a ');
    expect(inputElm.val()).toEqual('a ');
    expect($rootScope.list).toEqual(['a']);

    helper.changeInputValueTo('a ,');
    expect(inputElm.val()).toEqual('a ,');
    expect($rootScope.list).toEqual(['a']);

    helper.changeInputValueTo('a , ');
    expect(inputElm.val()).toEqual('a , ');
    expect($rootScope.list).toEqual(['a']);

    helper.changeInputValueTo('a , b');
    expect(inputElm.val()).toEqual('a , b');
    expect($rootScope.list).toEqual(['a', 'b']);
  });


  test('should convert empty string to an empty array', () => {
    helper.compileInput('<input type="text" ng-model="list" ng-list />');

    helper.changeInputValueTo('');
    expect($rootScope.list).toEqual([]);
  });


  test('should be invalid if required and empty', () => {
    var inputElm = helper.compileInput('<input type="text" ng-list ng-model="list" required>');
    helper.changeInputValueTo('');
    expect($rootScope.list).toBeUndefined();
    expect(inputElm).toBeInvalid();
    helper.changeInputValueTo('a,b');
    expect($rootScope.list).toEqual(['a','b']);
    expect(inputElm).toBeValid();
  });

  describe('with a custom separator', () => {
    test('should split on the custom separator', () => {
      helper.compileInput('<input type="text" ng-model="list" ng-list=":" />');

      helper.changeInputValueTo('a,a');
      expect($rootScope.list).toEqual(['a,a']);

      helper.changeInputValueTo('a:b');
      expect($rootScope.list).toEqual(['a', 'b']);
    });


    test('should join the list back together with the custom separator', () => {
      var inputElm = helper.compileInput('<input type="text" ng-model="list" ng-list=" : " />');

      $rootScope.$apply(function() {
        $rootScope.list = ['x', 'y', 'z'];
      });
      expect(inputElm.val()).toBe('x : y : z');
    });
  });

  describe('(with ngTrim undefined or true)', () => {

    test('should ignore separator whitespace when splitting', () => {
      helper.compileInput('<input type="text" ng-model="list" ng-list="  |  " />');

      helper.changeInputValueTo('a|b');
      expect($rootScope.list).toEqual(['a', 'b']);
    });

    test('should trim whitespace from each list item', () => {
      helper.compileInput('<input type="text" ng-model="list" ng-list="|" />');

      helper.changeInputValueTo('a | b');
      expect($rootScope.list).toEqual(['a', 'b']);
    });
  });

  describe('(with ngTrim set to false)', () => {

    test('should use separator whitespace when splitting', () => {
      helper.compileInput('<input type="text" ng-model="list" ng-trim="false" ng-list="  |  " />');

      helper.changeInputValueTo('a|b');
      expect($rootScope.list).toEqual(['a|b']);

      helper.changeInputValueTo('a  |  b');
      expect($rootScope.list).toEqual(['a','b']);

    });

    test('should not trim whitespace from each list item', () => {
      helper.compileInput('<input type="text" ng-model="list" ng-trim="false" ng-list="|" />');
      helper.changeInputValueTo('a  |  b');
      expect($rootScope.list).toEqual(['a  ','  b']);
    });

    test('should support splitting on newlines', () => {
      helper.compileInput('<textarea type="text" ng-model="list" ng-trim="false" ng-list="&#10;"></textarea>');
      helper.changeInputValueTo('a\nb');
      expect($rootScope.list).toEqual(['a','b']);
    });

    test('should support splitting on whitespace', () => {
      helper.compileInput('<textarea type="text" ng-model="list" ng-trim="false" ng-list=" "></textarea>');
      helper.changeInputValueTo('a b');
      expect($rootScope.list).toEqual(['a','b']);
    });
  });
});

