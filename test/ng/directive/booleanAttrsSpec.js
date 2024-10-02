'use strict';

describe('boolean attr directives', function() {
  var element;

  afterEach(function() {
    dealoc(element);
  });


  it('should properly evaluate 0 as false', angular.mock.inject(function($rootScope) {
    // jQuery does not treat 0 as false, when setting attr()
    element = compileForTest('<button ng-disabled="isDisabled">Button</button>');
    $rootScope.isDisabled = 0;
    $rootScope.$digest();
    expect(element.attr('disabled')).toBeFalsy();
    $rootScope.isDisabled = 1;
    $rootScope.$digest();
    expect(element.attr('disabled')).toBeTruthy();
  }));


  it('should bind disabled', angular.mock.inject(function($rootScope) {
    element = compileForTest('<button ng-disabled="isDisabled">Button</button>');
    $rootScope.isDisabled = false;
    $rootScope.$digest();
    expect(element.attr('disabled')).toBeFalsy();
    $rootScope.isDisabled = true;
    $rootScope.$digest();
    expect(element.attr('disabled')).toBeTruthy();
  }));


  it('should bind checked', angular.mock.inject(function($rootScope) {
    element = compileForTest('<input type="checkbox" ng-checked="isChecked" />');
    $rootScope.isChecked = false;
    $rootScope.$digest();
    expect(element.attr('checked')).toBeFalsy();
    $rootScope.isChecked = true;
    $rootScope.$digest();
    expect(element.attr('checked')).toBeTruthy();
  }));


  it('should not bind checked when ngModel is present', angular.mock.inject(function($rootScope) {
    // test for https://github.com/angular/angular.js/issues/10662
    element = compileForTest('<input type="checkbox" ng-model="value" ng-false-value="\'false\'" ' +
      'ng-true-value="\'true\'" ng-checked="value" />');
    $rootScope.value = 'true';
    $rootScope.$digest();
    expect(element[0].checked).toBe(true);
    browserTrigger(element, 'click');
    expect(element[0].checked).toBe(false);
    expect($rootScope.value).toBe('false');
    browserTrigger(element, 'click');
    expect(element[0].checked).toBe(true);
    expect($rootScope.value).toBe('true');
  }));


  it('should bind selected', angular.mock.inject(function($rootScope) {
    element = compileForTest('<select><option value=""></option><option ng-selected="isSelected">Greetings!</option></select>');
    angular.element(window.document.body).append(element);
    $rootScope.isSelected = false;
    $rootScope.$digest();
    expect(element.children()[1].selected).toBeFalsy();
    $rootScope.isSelected = true;
    $rootScope.$digest();
    expect(element.children()[1].selected).toBeTruthy();
  }));


  it('should bind readonly', angular.mock.inject(function($rootScope) {
    element = compileForTest('<input type="text" ng-readonly="isReadonly" />');
    $rootScope.isReadonly = false;
    $rootScope.$digest();
    expect(element.attr('readOnly')).toBeFalsy();
    $rootScope.isReadonly = true;
    $rootScope.$digest();
    expect(element.attr('readOnly')).toBeTruthy();
  }));


  it('should bind open', angular.mock.inject(function($rootScope) {
    element = compileForTest('<details ng-open="isOpen"></details>');
    $rootScope.isOpen = false;
    $rootScope.$digest();
    expect(element.attr('open')).toBeFalsy();
    $rootScope.isOpen = true;
    $rootScope.$digest();
    expect(element.attr('open')).toBeTruthy();
  }));


  describe('multiple', function() {
    it('should NOT bind to multiple via ngMultiple', angular.mock.inject(function($rootScope) {
      element = compileForTest('<select ng-multiple="isMultiple"></select>');
      $rootScope.isMultiple = false;
      $rootScope.$digest();
      expect(element.attr('multiple')).toBeFalsy();
      $rootScope.isMultiple = 'multiple';
      $rootScope.$digest();
      expect(element.attr('multiple')).toBeFalsy(); // ignore
    }));


    it('should throw an exception if binding to multiple attribute', angular.mock.inject(function($rootScope, $compile) {
      expect(function() {
        $compile('<select multiple="{{isMultiple}}"></select>');
      }).toThrowMinErr('$compile', 'selmulti', 'Binding to the \'multiple\' attribute is not supported. ' +
                 'Element: <select multiple="{{isMultiple}}">');

    }));
  });
});


describe('ngSrc', function() {
  it('should interpolate the expression and bind to src with raw same-domain value',
      angular.mock.inject(function($compile, $rootScope) {
        var element = compileForTest('<div ng-src="{{id}}"></div>');

        $rootScope.$digest();
        expect(element.attr('src')).toBeUndefined();

        $rootScope.$apply(function() {
          $rootScope.id = '/somewhere/here';
        });
        expect(element.attr('src')).toEqual('/somewhere/here');

        dealoc(element);
      }));


  it('should interpolate the expression and bind to src with a trusted value', angular.mock.inject(function($compile, $rootScope, $sce) {
    var element = compileForTest('<div ng-src="{{id}}"></div>');

    $rootScope.$digest();
    expect(element.attr('src')).toBeUndefined();

    $rootScope.$apply(function() {
      $rootScope.id = $sce.trustAsResourceUrl('http://somewhere');
    });
    expect(element.attr('src')).toEqual('http://somewhere');

    dealoc(element);
  }));


  it('should NOT interpolate a multi-part expression for non-img src attribute', angular.mock.inject(function() {
    expect(function() {
      var element = compileForTest('<div ng-src="some/{{id}}"></div>');
      dealoc(element);
    }).toThrowMinErr(
          '$interpolate', 'noconcat', 'Error while interpolating: some/{{id}}\nStrict ' +
          'Contextual Escaping disallows interpolations that concatenate multiple expressions ' +
          'when a trusted value is required.  See http://docs.angularjs.org/api/ng.$sce');
  }));


  it('should interpolate a multi-part expression for regular attributes', angular.mock.inject(function($compile, $rootScope) {
    var element = compileForTest('<div foo="some/{{id}}"></div>');
    $rootScope.$digest();
    expect(element.attr('foo')).toBe('some/');
    $rootScope.$apply(function() {
      $rootScope.id = 1;
    });
    expect(element.attr('foo')).toEqual('some/1');
  }));


  it('should NOT interpolate a wrongly typed expression', angular.mock.inject(function($compile, $rootScope, $sce) {
    expect(function() {
      var element = compileForTest('<div ng-src="{{id}}"></div>');
      $rootScope.$apply(function() {
        $rootScope.id = $sce.trustAsUrl('http://somewhere');
      });
      element.attr('src');
    }).toThrowMinErr(
            '$interpolate', 'interr', 'Can\'t interpolate: {{id}}\nError: [$sce:insecurl] Blocked ' +
                'loading resource from url not allowed by $sceDelegate policy.  URL: http://somewhere');
  }));
});


describe('ngSrcset', function() {
  it('should interpolate the expression and bind to srcset', angular.mock.inject(function($compile, $rootScope) {
    var element = compileForTest('<div ng-srcset="some/{{id}} 2x"></div>');

    $rootScope.$digest();
    expect(element.attr('srcset')).toBeUndefined();

    $rootScope.$apply(function() {
      $rootScope.id = 1;
    });
    expect(element.attr('srcset')).toEqual('some/1 2x');

    dealoc(element);
  }));
});


describe('ngHref', function() {
  var element;

  afterEach(function() {
    dealoc(element);
  });


  it('should interpolate the expression and bind to href', angular.mock.inject(function($compile, $rootScope) {
    element = compileForTest('<div ng-href="some/{{id}}"></div>');
    $rootScope.$digest();
    expect(element.attr('href')).toEqual('some/');

    $rootScope.$apply(function() {
      $rootScope.id = 1;
    });
    expect(element.attr('href')).toEqual('some/1');
  }));


  it('should bind href and merge with other attrs', angular.mock.inject(function($rootScope) {
    element = compileForTest('<a ng-href="{{url}}" rel="{{rel}}"></a>');
    $rootScope.url = 'http://server';
    $rootScope.rel = 'REL';
    $rootScope.$digest();
    expect(element.attr('href')).toEqual('http://server');
    expect(element.attr('rel')).toEqual('REL');
  }));


  it('should bind href even if no interpolation', angular.mock.inject(function($rootScope) {
    element = compileForTest('<a ng-href="http://server"></a>');
    $rootScope.$digest();
    expect(element.attr('href')).toEqual('http://server');
  }));

  it('should not set the href if ng-href is empty', angular.mock.inject(function($rootScope) {
    $rootScope.url = null;
    element = compileForTest('<a ng-href="{{url}}">');
    $rootScope.$digest();
    expect(element.attr('href')).toEqual(undefined);
  }));

  it('should remove the href if ng-href changes to empty', angular.mock.inject(function($rootScope) {
    $rootScope.url = 'http://www.google.com/';
    element = compileForTest('<a ng-href="{{url}}">');
    $rootScope.$digest();

    $rootScope.url = null;
    $rootScope.$digest();
    expect(element.attr('href')).toEqual(undefined);
  }));

  // Support: Edge 12-15+
  if (/\bEdge\/[\d.]+\b/.test(window.navigator.userAgent)) {
    // Edge fail when setting a href to a URL containing a % that isn't a valid escape sequence
    // See https://github.com/angular/angular.js/issues/13388
    it('should throw error if ng-href contains a non-escaped percent symbol', angular.mock.inject(function($rootScope) {
      element = compileForTest('<a ng-href="http://www.google.com/{{\'a%link\'}}">');

      expect(function() {
        $rootScope.$digest();
      }).toThrow();
    }));
  }

  describe('SVGAElement', function() {
    it('should interpolate the expression and bind to href', angular.mock.inject(function($compile, $rootScope) {
      element = compileForTest('<svg><a ng-href="some/{{id}}"></a></svg>');
      var child = element.children('a');
      $rootScope.$digest();
      expect(child.attr('href')).toEqual('some/');

      $rootScope.$apply(function() {
        $rootScope.id = 1;
      });
      expect(child.attr('href')).toEqual('some/1');
    }));


    it('should bind xlink:href even if no interpolation', angular.mock.inject(function($rootScope) {
      element = compileForTest('<svg><a ng-href="http://server"></a></svg>');
      var child = element.children('a');
      $rootScope.$digest();
      expect(child.attr('href')).toEqual('http://server');
    }));
  });
});
