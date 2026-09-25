'use strict';
 describe('ngHref', () => {
  var element;

   afterEach(() => {
    dealoc(element);
  });


  test('should interpolate the expression and bind to href', angular.mock.inject(function($compile, $rootScope) {
    element = $compile('<a ng-href="some/{{id}}"></div>')($rootScope);
    $rootScope.$digest();
    expect(element.attr('href')).toEqual('some/');

    $rootScope.$apply(function() {
      $rootScope.id = 1;
    });
    expect(element.attr('href')).toEqual('some/1');
  }));


  test('should bind href and merge with other attrs', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<a ng-href="{{url}}" rel="{{rel}}"></a>')($rootScope);
    $rootScope.url = 'http://server';
    $rootScope.rel = 'REL';
    $rootScope.$digest();
    expect(element.attr('href')).toEqual('http://server');
    expect(element.attr('rel')).toEqual('REL');
  }));


  test('should bind href even if no interpolation', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<a ng-href="http://server"></a>')($rootScope);
    $rootScope.$digest();
    expect(element.attr('href')).toEqual('http://server');
  }));

  test('should not set the href if ng-href is empty', angular.mock.inject(function($rootScope, $compile) {
    $rootScope.url = null;
    element = $compile('<a ng-href="{{url}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('href')).toEqual(undefined);
  }));

  test('should remove the href if ng-href changes to empty', angular.mock.inject(function($rootScope, $compile) {
    $rootScope.url = 'http://www.google.com/';
    element = $compile('<a ng-href="{{url}}">')($rootScope);
    $rootScope.$digest();

    $rootScope.url = null;
    $rootScope.$digest();
    expect(element.attr('href')).toEqual(undefined);
  }));

  test('should sanitize interpolated url', angular.mock.inject(function($rootScope, $compile) {
    /* eslint no-script-url: "off" */
    $rootScope.imageUrl = 'javascript:alert(1);';
    element = $compile('<a ng-href="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('href')).toBe('unsafe:javascript:alert(1);');
  }));

  test('should sanitize non-interpolated url', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<a ng-href="javascript:alert(1);">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('href')).toBe('unsafe:javascript:alert(1);');
  }));


  // Support: Edge 12-17
  if (/\bEdge\/1[2-7]\.[\d.]+\b/.test(window.navigator.userAgent)) {
    // Edge fails when setting a href to a URL containing a % that isn't a valid escape sequence
    // See https://github.com/angular/angular.js/issues/13388
    test('should throw error if ng-href contains a non-escaped percent symbol', angular.mock.inject(function($rootScope, $compile) {
      expect(function() {
        element = $compile('<a ng-href="http://www.google.com/{{\'a%link\'}}">')($rootScope);
      }).toThrow();
    }));
  }


  test('should bind numbers', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<a ng-href="{{1234}}"></a>')($rootScope);
    $rootScope.$digest();
    expect(element.attr('href')).toEqual('1234');
  }));


  test('should bind and sanitize the result of a (custom) toString() function', angular.mock.inject(function($rootScope, $compile) {
    $rootScope.value = {};
    element = $compile('<a ng-href="{{value}}"></a>')($rootScope);
    $rootScope.$digest();
    expect(element.attr('href')).toEqual('[object Object]');

    function SafeClass() {}

    SafeClass.prototype.toString = function() {
      return 'custom value';
    };

    $rootScope.value = new SafeClass();
    $rootScope.$digest();
    expect(element.attr('href')).toEqual('custom value');

    function UnsafeClass() {}

    UnsafeClass.prototype.toString = function() {
      return 'javascript:alert(1);';
    };

    $rootScope.value = new UnsafeClass();
    $rootScope.$digest();
    expect(element.attr('href')).toEqual('unsafe:javascript:alert(1);');
  }));


  if (angular.isDefined(window.SVGElement)) {
    describe('SVGAElement', () => {
      test('should interpolate the expression and bind to xlink:href', angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<svg><a ng-href="some/{{id}}"></a></svg>')($rootScope);
        var child = element.children('a');
        $rootScope.$digest();
        expect(child.attr('xlink:href')).toEqual('some/');

        $rootScope.$apply(function() {
          $rootScope.id = 1;
        });
        expect(child.attr('xlink:href')).toEqual('some/1');
      }));


      test('should bind xlink:href even if no interpolation', angular.mock.inject(function($rootScope, $compile) {
        element = $compile('<svg><a ng-href="http://server"></a></svg>')($rootScope);
        var child = element.children('a');
        $rootScope.$digest();
        expect(child.attr('xlink:href')).toEqual('http://server');
      }));
    });
  }
});
