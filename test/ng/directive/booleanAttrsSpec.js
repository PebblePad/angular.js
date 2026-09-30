'use strict';
 describe('boolean attr directives', () => {
  var element;

   afterEach(() => {
    dealoc(element);
  });


  test('should properly evaluate 0 as false', angular.mock.inject(function($rootScope, $compile) {
    // jQuery does not treat 0 as false, when setting attr()
    element = $compile('<button ng-disabled="isDisabled">Button</button>')($rootScope);
    $rootScope.isDisabled = 0;
    $rootScope.$digest();
    expect(element.attr('disabled')).toBeFalsy();
    $rootScope.isDisabled = 1;
    $rootScope.$digest();
    expect(element.attr('disabled')).toBeTruthy();
  }));


  test('should bind disabled', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<button ng-disabled="isDisabled">Button</button>')($rootScope);
    $rootScope.isDisabled = false;
    $rootScope.$digest();
    expect(element.attr('disabled')).toBeFalsy();
    $rootScope.isDisabled = true;
    $rootScope.$digest();
    expect(element.attr('disabled')).toBeTruthy();
  }));


  test('should bind checked', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<input type="checkbox" ng-checked="isChecked" />')($rootScope);
    $rootScope.isChecked = false;
    $rootScope.$digest();
    expect(element.attr('checked')).toBeFalsy();
    $rootScope.isChecked = true;
    $rootScope.$digest();
    expect(element.attr('checked')).toBeTruthy();
  }));


  test('should not bind checked when ngModel is present', angular.mock.inject(function($rootScope, $compile, $document, $rootElement) {
    // test for https://github.com/angular/angular.js/issues/10662
    element = $compile('<input type="checkbox" ng-model="value" ng-false-value="\'false\'" ' +
      'ng-true-value="\'true\'" ng-checked="value" />')($rootScope);

    // Append the app to the document so that "click" triggers "change"
    // Support: Chrome, Safari 8, 9
    angular.element($document[0].body).append($rootElement.append(element));

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


  test('should bind selected', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<select><option value=""></option><option ng-selected="isSelected">Greetings!</option></select>')($rootScope);
    angular.element(window.document.body).append(element);
    $rootScope.isSelected = false;
    $rootScope.$digest();
    expect(element.children()[1].selected).toBeFalsy();
    $rootScope.isSelected = true;
    $rootScope.$digest();
    expect(element.children()[1].selected).toBeTruthy();
  }));


  test('should bind readonly', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<input type="text" ng-readonly="isReadonly" />')($rootScope);
    $rootScope.isReadonly = false;
    $rootScope.$digest();
    expect(element.attr('readOnly')).toBeFalsy();
    $rootScope.isReadonly = true;
    $rootScope.$digest();
    expect(element.attr('readOnly')).toBeTruthy();
  }));


  test('should bind open', angular.mock.inject(function($rootScope, $compile) {
    element = $compile('<details ng-open="isOpen"></details>')($rootScope);
    $rootScope.isOpen = false;
    $rootScope.$digest();
    expect(element.attr('open')).toBeFalsy();
    $rootScope.isOpen = true;
    $rootScope.$digest();
    expect(element.attr('open')).toBeTruthy();
  }));


  describe('multiple', () => {
    test('should NOT bind to multiple via ngMultiple', angular.mock.inject(function($rootScope, $compile) {
      element = $compile('<select ng-multiple="isMultiple"></select>')($rootScope);
      $rootScope.isMultiple = false;
      $rootScope.$digest();
      expect(element.attr('multiple')).toBeFalsy();
      $rootScope.isMultiple = 'multiple';
      $rootScope.$digest();
      expect(element.attr('multiple')).toBeFalsy(); // ignore
    }));


    test('should throw an exception if binding to multiple attribute', angular.mock.inject(function($rootScope, $compile) {
      expect(function() {
        $compile('<select multiple="{{isMultiple}}"></select>');
      }).toThrowMinErr('$compile', 'selmulti', 'Binding to the \'multiple\' attribute is not supported. ' +
                 'Element: <select multiple="{{isMultiple}}">');

    }));
  });
});
