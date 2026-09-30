'use strict';
 describe('ngRef', () => {

  let element;
  afterEach(() => {
    dealoc(element);
  });

   beforeEach(() => {
    expect.extend({
      toEqualJq(actual, expected) {
        // Jquery <= 2.2 objects add a context property that is irrelevant for equality
        if (actual && actual.hasOwnProperty('context')) {
          delete actual.context;
        }

        if (expected && expected.hasOwnProperty('context')) {
          delete expected.context;
        }

        const pass = this.equals(actual, expected);

        return {
          pass: pass,
          message: () => 'Expected ' + this.utils.stringify(actual) + (pass ? ' not' : '') +
              ' to equal ' + this.utils.stringify(expected) + '.'
        };
      }
    });
  });

  describe('on a component', () => {
    var myComponentController;
    var attributeDirectiveController;
    var $rootScope;
    var $compile;

    beforeEach(angular.mock.module(function($compileProvider) {
      $compileProvider.component('myComponent', {
        template: 'foo',
        controller() {
          myComponentController = this;
        }
      });

      $compileProvider.directive('attributeDirective', function() {
        return {
          restrict: 'A',
          controller() {
            attributeDirectiveController = this;
          }
        };
      });

    }));

    beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    }));

    test('should bind in the current scope the controller of a component', () => {
      $rootScope.$ctrl = 'undamaged';

      element = $compile('<my-component ng-ref="myComponentRef"></my-component>')($rootScope);
      expect($rootScope.$ctrl).toBe('undamaged');
      expect($rootScope.myComponentRef).toBe(myComponentController);
    });

    test('should throw if the expression is not assignable', () => {
      expect(function() {
        $compile('<my-component ng-ref="\'hello\'"></my-component>')($rootScope);
      }).toThrowMinErr('ngRef', 'nonassign', 'Expression in ngRef="\'hello\'" is non-assignable!');
      clearJqLiteCache();
    });

    test('should work with non:normalized entity name', () => {
      element = $compile('<my:component ng-ref="myComponent1"></my:component>')($rootScope);
      expect($rootScope.myComponent1).toBe(myComponentController);
    });

    test('should work with data-non-normalized entity name', () => {
      element = $compile('<data-my-component ng-ref="myComponent2"></data-my-component>')($rootScope);
      expect($rootScope.myComponent2).toBe(myComponentController);
    });

    test('should work with x-non-normalized entity name', () => {
      element = $compile('<x-my-component ng-ref="myComponent3"></x-my-component>')($rootScope);
      expect($rootScope.myComponent3).toBe(myComponentController);
    });

    test('should work with data-non-normalized attribute name', () => {
      element = $compile('<my-component data-ng-ref="myComponent1"></my-component>')($rootScope);
      expect($rootScope.myComponent1).toBe(myComponentController);
    });

    test('should work with x-non-normalized attribute name', () => {
      element = $compile('<my-component x-ng-ref="myComponent2"></my-component>')($rootScope);
      expect($rootScope.myComponent2).toBe(myComponentController);
    });

    test('should not bind the controller of an attribute directive', () => {
      element = $compile('<my-component attribute-directive-1 ng-ref="myComponentRef"></my-component>')($rootScope);
      expect($rootScope.myComponentRef).toBe(myComponentController);
    });

    test('should not leak to parent scopes', () => {
      var template =
        '<div ng-if="true">' +
          '<my-component ng-ref="myComponent"></my-component>' +
        '</div>';
      element = $compile(template)($rootScope);
      expect($rootScope.myComponent).toBe(undefined);
    });

    test('should nullify the variable once the component is destroyed', () => {
      var template = '<div><my-component ng-ref="myComponent"></my-component></div>';

      element = $compile(template)($rootScope);
      expect($rootScope.myComponent).toBe(myComponentController);

      var componentElement = element.children();
      var isolateScope = componentElement.isolateScope();
      componentElement.remove();
      isolateScope.$destroy();
      expect($rootScope.myComponent).toBe(null);
    });

    test('should be compatible with entering/leaving components', angular.mock.inject(function($animate) {
      var template = '<my-component ng-ref="myComponent"></my-component>';
      $rootScope.$ctrl = {};
      var parent = $compile('<div></div>')($rootScope);

      var leaving = $compile(template)($rootScope);
      var leavingController = myComponentController;

      $animate.enter(leaving, parent);
      expect($rootScope.myComponent).toBe(leavingController);

      var entering = $compile(template)($rootScope);
      var enteringController = myComponentController;

      $animate.enter(entering, parent);
      $animate.leave(leaving, parent);
      expect($rootScope.myComponent).toBe(enteringController);
      dealoc(entering);
      dealoc(leaving);
      dealoc(parent);
    }));

    test('should allow binding to a nested property', () => {
      $rootScope.obj = {};

      element = $compile('<my-component ng-ref="obj.myComponent"></my-component>')($rootScope);
      expect($rootScope.obj.myComponent).toBe(myComponentController);
    });
  });

  test('should bind the jqlite wrapped DOM element if there is no component', angular.mock.inject(function($compile, $rootScope) {
    element = $compile('<span ng-ref="mySpan">my text</span>')($rootScope);

    expect($rootScope.mySpan).toEqualJq(element);
    expect($rootScope.mySpan[0].textContent).toBe('my text');
  }));

  test('should nullify the expression value if the DOM element is destroyed', angular.mock.inject(function($compile, $rootScope) {
    element = $compile('<div><span ng-ref="mySpan">my text</span></div>')($rootScope);
    element.children().remove();
    expect($rootScope.mySpan).toBe(null);
  }));

  test('should bind the controller of an element directive', () => {
    var myDirectiveController;

    angular.mock.module(function($compileProvider) {
      $compileProvider.directive('myDirective', function() {
        return {
          controller() {
            myDirectiveController = this;
          }
        };
      });
    });

    angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<my-directive ng-ref="myDirective"></my-directive>')($rootScope);

      expect($rootScope.myDirective).toBe(myDirectiveController);
    });
  });

  describe('ngRefRead', () => {

    test('should bind the element instead of the controller of a component if ngRefRead="$element" is set', () => {

      angular.mock.module(function($compileProvider) {

        $compileProvider.component('myComponent', {
          template: 'my text',
          controller() {}
        });
      });

      angular.mock.inject(function($compile, $rootScope) {

        element = $compile('<my-component ng-ref="myEl" ng-ref-read="$element"></my-component>')($rootScope);
        expect($rootScope.myEl).toEqualJq(element);
        expect($rootScope.myEl[0].textContent).toBe('my text');
      });
    });


    test('should bind the element instead an element-directive controller if ngRefRead="$element" is set', () => {

      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('myDirective', function() {
          return {
            restrict: 'E',
            template: 'my text',
            controller() {}
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<my-directive ng-ref="myEl" ng-ref-read="$element"></my-directive>')($rootScope);

        expect($rootScope.myEl).toEqualJq(element);
        expect($rootScope.myEl[0].textContent).toBe('my text');
      });
    });


    test('should bind an attribute-directive controller if ngRefRead="controllerName" is set', () => {
      var attrDirective1Controller;

      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('elementDirective', function() {
          return {
            restrict: 'E',
            template: 'my text',
            controller() {}
          };
        });

        $compileProvider.directive('attributeDirective1', function() {
          return {
            restrict: 'A',
            controller() {
              attrDirective1Controller = this;
            }
          };
        });

        $compileProvider.directive('attributeDirective2', function() {
          return {
            restrict: 'A',
            controller() {}
          };
        });

      });

      angular.mock.inject(function($compile, $rootScope) {
        element = $compile('<element-directive' +
          'attribute-directive-1' +
          'attribute-directive-2' +
          'ng-ref="myController"' +
          'ng-ref-read="$element"></element-directive>')($rootScope);

        expect($rootScope.myController).toBe(attrDirective1Controller);
      });
    });

    test('should throw if no controller is found for the ngRefRead value', () => {

      angular.mock.module(function($compileProvider) {
        $compileProvider.directive('elementDirective', function() {
          return {
            restrict: 'E',
            template: 'my text',
            controller() {}
          };
        });
      });

      angular.mock.inject(function($compile, $rootScope) {

        expect(function() {
            $compile('<element-directive ' +
              'ng-ref="myController"' +
              'ng-ref-read="attribute"></element-directive>')($rootScope);
        }).toThrowMinErr('ngRef', 'noctrl', 'The controller for ngRefRead="attribute" could not be found on ngRef="myController"');
        clearJqLiteCache();
      });
    });

  });


  test('should bind the jqlite element if the controller is on an attribute-directive', () => {
    var myDirectiveController;

    angular.mock.module(function($compileProvider) {
      $compileProvider.directive('myDirective', function() {
        return {
          restrict: 'A',
          template: 'my text',
          controller() {
            myDirectiveController = this;
          }
        };
      });
    });

    angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<div my-directive ng-ref="myEl"></div>')($rootScope);

      expect(myDirectiveController).toBeDefined();
      expect($rootScope.myEl).toEqualJq(element);
      expect($rootScope.myEl[0].textContent).toBe('my text');
    });
  });


  test('should bind the jqlite element if the controller is on an class-directive', () => {
    var myDirectiveController;

    angular.mock.module(function($compileProvider) {
      $compileProvider.directive('myDirective', function() {
        return {
          restrict: 'C',
          template: 'my text',
          controller() {
            myDirectiveController = this;
          }
        };
      });
    });

    angular.mock.inject(function($compile, $rootScope) {
      element = $compile('<div class="my-directive" ng-ref="myEl"></div>')($rootScope);

      expect(myDirectiveController).toBeDefined();
      expect($rootScope.myEl).toEqualJq(element);
      expect($rootScope.myEl[0].textContent).toBe('my text');
    });
  });

  describe('transclusion', () => {

    test('should work with simple transclusion', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider
          .component('myComponent', {
            transclude: true,
            template: '<ng-transclude></ng-transclude>',
            controller() {
              this.text = 'SUCCESS';
            }
          });
      });

      angular.mock.inject(function($compile, $rootScope) {
        var template = '<my-component ng-ref="myComponent">{{myComponent.text}}</my-component>';
        element = $compile(template)($rootScope);
        $rootScope.$apply();
        expect(element.text()).toBe('SUCCESS');
      });
    });

    test('should be compatible with element transclude components', () => {

      angular.mock.module(function($compileProvider) {
        $compileProvider
          .component('myComponent', {
            transclude: 'element',
            controller($animate, $element, $transclude) {
              this.text = 'SUCCESS';
              this.$postLink = function() {
                $transclude(function(clone, newScope) {
                  $animate.enter(clone, $element.parent(), $element);
                });
              };
            }
          });
      });

      angular.mock.inject(function($compile, $rootScope) {
        var template =
          '<div>' +
            '<my-component ng-ref="myComponent">' +
              '{{myComponent.text}}' +
            '</my-component>' +
          '</div>';
        element = $compile(template)($rootScope);
        $rootScope.$apply();
        expect(element.text()).toBe('SUCCESS');
      });
    });

    test('should be compatible with ngIf and transclusion on same element', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider.component('myComponent', {
          template: '<ng-transclude></ng-transclude>',
          transclude: true,
          controller($scope) {
            this.text = 'SUCCESS';
          }
        });
      });

      angular.mock.inject(function($compile, $rootScope) {
        var template =
          '<div>' +
            '<my-component ng-if="present" ng-ref="myComponent" >' +
                '{{myComponent.text}}' +
            '</my-component>' +
          '</div>';
        element = $compile(template)($rootScope);

        $rootScope.$apply('present = false');
        expect(element.text()).toBe('');
        $rootScope.$apply('present = true');
        expect(element.text()).toBe('SUCCESS');
        $rootScope.$apply('present = false');
        expect(element.text()).toBe('');
        $rootScope.$apply('present = true');
        expect(element.text()).toBe('SUCCESS');
      });
    });

    test('should be compatible with element transclude & destroy components', () => {
      var myComponentController;
      angular.mock.module(function($compileProvider) {
        $compileProvider
          .component('myTranscludingComponent', {
            transclude: 'element',
            controller($animate, $element, $transclude) {
              myComponentController = this;

              var currentClone;
              var currentScope;
              this.transclude = function(text) {
                this.text = text;
                $transclude(function(clone, newScope) {
                  currentClone = clone;
                  currentScope = newScope;
                  $animate.enter(clone, $element.parent(), $element);
                });
              };
              this.destroy = function() {
                currentClone.remove();
                currentScope.$destroy();
              };
            }
          });
      });

      angular.mock.inject(function($compile, $rootScope) {
        var template =
          '<div>' +
            '<my-transcluding-component ng-ref="myComponent">' +
              '{{myComponent.text}}' +
            '</my-transcluding-component>' +
          '</div>';
        element = $compile(template)($rootScope);
        $rootScope.$apply();
        expect(element.text()).toBe('');

        myComponentController.transclude('transcludedOk');
        $rootScope.$apply();
        expect(element.text()).toBe('transcludedOk');

        myComponentController.destroy();
        $rootScope.$apply();
        expect(element.text()).toBe('');
      });
    });

    test('should be compatible with element transclude directives', () => {
      angular.mock.module(function($compileProvider) {
        $compileProvider
          .directive('myDirective', function($animate) {
            return {
              transclude: 'element',
              controller() {
                this.text = 'SUCCESS';
              },
              link(scope, element, attrs, ctrl, $transclude) {
                $transclude(function(clone, newScope) {
                  $animate.enter(clone, element.parent(), element);
                });
              }
            };
          });
      });

      angular.mock.inject(function($compile, $rootScope) {
        var template =
          '<div>' +
            '<my-directive ng-ref="myDirective">' +
              '{{myDirective.text}}' +
            '</my-directive>' +
          '</div>';
        element = $compile(template)($rootScope);
        $rootScope.$apply();
        expect(element.text()).toBe('SUCCESS');
      });
    });

  });

  test('should work with components with templates via $http', () => {
    angular.mock.module(function($compileProvider) {
      $compileProvider.component('httpComponent', {
        templateUrl: 'template.html',
        controller() {
          this.me = true;
        }
      });
    });

    angular.mock.inject(function($compile, $httpBackend, $rootScope) {
      var template = '<div><http-component ng-ref="controller"></http-component></div>';
      element = $compile(template)($rootScope);
      $httpBackend.expect('GET', 'template.html').respond('ok');
      $rootScope.$apply();
      expect($rootScope.controller).toBeUndefined();
      $httpBackend.flush();
      expect($rootScope.controller.me).toBe(true);
    });
  });


  test('should work with ngRepeat-ed components', () => {
    var controllers = [];

    angular.mock.module(function($compileProvider) {
      $compileProvider.component('myComponent', {
        template: 'foo',
        controller() {
          controllers.push(this);
        }
      });
    });


    angular.mock.inject(function($compile, $rootScope) {
      $rootScope.elements = [0,1,2,3,4];
      $rootScope.controllers = []; // Initialize the array because ngRepeat creates a child scope

      var template = '<div><my-component ng-repeat="(key, el) in elements" ng-ref="controllers[key]"></my-component></div>';
      element = $compile(template)($rootScope);
      $rootScope.$apply();

      expect($rootScope.controllers).toEqual(controllers);

      $rootScope.$apply('elements = []');

      expect($rootScope.controllers).toEqual([null, null, null, null, null]);
    });
  });

});
