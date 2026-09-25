'use strict';
 describe('$$testability', () => {
  describe('finding elements', () => {
    var $$testability;
    var $compile;
    var scope;
    var element;

    beforeEach(angular.mock.inject(function(_$$testability_, _$compile_, $rootScope) {
      $$testability = _$$testability_;
      $compile = _$compile_;
      scope = $rootScope.$new();
    }));

     afterEach(() => {
      dealoc(element);
    });

    test('should find partial bindings', () => {
      element =
          '<div>' +
          '  <span>{{name}}</span>' +
          '  <span>{{username}}</span>' +
          '</div>';
      element = $compile(element)(scope);
      var names = $$testability.findBindings(element[0], 'name');
      expect(names.length).toBe(2);
      expect(names[0]).toBe(element.find('span')[0]);
      expect(names[1]).toBe(element.find('span')[1]);
    });

    test('should find exact bindings', () => {
      element =
          '<div>' +
          '  <span>{{name}}</span>' +
          '  <span>{{username}}</span>' +
          '</div>';
      element = $compile(element)(scope);
      var users = $$testability.findBindings(element[0], 'name', true);
      expect(users.length).toBe(1);
      expect(users[0]).toBe(element.find('span')[0]);
    });

    test('should ignore filters for exact bindings', () => {
      element =
          '<div>' +
          '  <span>{{name | uppercase}}</span>' +
          '  <span>{{username}}</span>' +
          '</div>';
      element = $compile(element)(scope);
      var users = $$testability.findBindings(element[0], 'name', true);
      expect(users.length).toBe(1);
      expect(users[0]).toBe(element.find('span')[0]);
    });

    test('should ignore whitespace for exact bindings', () => {
      element =
          '<div>' +
          '  <span>{{ name }}</span>' +
          '  <span>{{username}}</span>' +
          '</div>';
      element = $compile(element)(scope);
      var users = $$testability.findBindings(element[0], 'name', true);
      expect(users.length).toBe(1);
      expect(users[0]).toBe(element.find('span')[0]);
    });

    test('should find bindings by class', () => {
      element =
          '<div>' +
          '  <span ng-bind="name"></span>' +
          '  <span>{{username}}</span>' +
          '</div>';
      element = $compile(element)(scope);
      var names = $$testability.findBindings(element[0], 'name');
      expect(names.length).toBe(2);
      expect(names[0]).toBe(element.find('span')[0]);
      expect(names[1]).toBe(element.find('span')[1]);
    });

    test('should only search within the context element', () => {
      element =
          '<div>' +
          '  <ul><li>{{name}}</li></ul>' +
          '  <ul><li>{{name}}</li></ul>' +
          '</div>';
      element = $compile(element)(scope);
      var names = $$testability.findBindings(element.find('ul')[0], 'name');
      expect(names.length).toBe(1);
      expect(names[0]).toBe(element.find('li')[0]);
    });

    test('should find bindings with allowed special characters', () => {
      element =
          '<div>' +
          '  <span>{{$index}}</span>' +
          '  <span>{{foo.bar}}</span>' +
          '  <span>{{foonbar}}</span>' +
          '  <span>{{foo | uppercase}}</span>' +
          '</div>';
      element = $compile(element)(scope);
      var indexes = $$testability.findBindings(element[0], '$index', true);
      expect(indexes.length).toBe(1);
      expect(indexes[0]).toBe(element.find('span')[0]);

      var foobars = $$testability.findBindings(element[0], 'foo.bar', true);
      expect(foobars.length).toBe(1); // it should not match {{foonbar}}
      expect(foobars[0]).toBe(element.find('span')[1]);

      var foo = $$testability.findBindings(element[0], 'foo', true);
      expect(foo.length).toBe(1); // it should match {{foo | uppercase}}
      var uppercase = $$testability.findBindings(element[0], 'uppercase', true);
      expect(uppercase.length).toBe(1); // it should match {{foo | uppercase}}
      var filteredFoo = $$testability.findBindings(element[0], 'foo | uppercase', true);
      expect(filteredFoo.length).toBe(1); // it should match {{foo | uppercase}}
      expect(filteredFoo[0]).toBe(element.find('span')[3]);
    });

    test('should find partial models', () => {
      element =
          '<div>' +
          '  <input type="text" ng-model="name"/>' +
          '  <input type="text" ng-model="username"/>' +
          '</div>';
      element = $compile(element)(scope);
      var names = $$testability.findModels(element[0], 'name');
      expect(names.length).toBe(2);
      expect(names[0]).toBe(element.find('input')[0]);
      expect(names[1]).toBe(element.find('input')[1]);
    });

    test('should find exact models', () => {
      element =
          '<div>' +
          '  <input type="text" ng-model="name"/>' +
          '  <input type="text" ng-model="username"/>' +
          '</div>';
      element = $compile(element)(scope);
      var users = $$testability.findModels(element[0], 'name', true);
      expect(users.length).toBe(1);
      expect(users[0]).toBe(element.find('input')[0]);
    });

    test('should find models in different input types', () => {
      element =
          '<div>' +
          '  <input type="text" ng-model="name"/>' +
          '  <textarea ng-model="username"/>' +
          '</div>';
      element = $compile(element)(scope);
      var names = $$testability.findModels(element[0], 'name');
      expect(names.length).toBe(2);
      expect(names[0]).toBe(element.find('input')[0]);
      expect(names[1]).toBe(element.find('textarea')[0]);
    });

    test('should only search for models within the context element', () => {
      element =
          '<div>' +
          '  <ul><li><input type="text" ng-model="name"/></li></ul>' +
          '  <ul><li><input type="text" ng-model="name"/></li></ul>' +
          '</div>';
      element = $compile(element)(scope);
      var names = $$testability.findModels(element.find('ul')[0], 'name');
      expect(names.length).toBe(1);
      expect(names[0]).toBe(angular.element(element.find('li')[0]).find('input')[0]);
    });
  });

  describe('location', () => {
    beforeEach(angular.mock.module(function() {
      return function($httpBackend) {
        $httpBackend.when('GET', 'foo.html').respond('foo');
        $httpBackend.when('GET', 'baz.html').respond('baz');
        $httpBackend.when('GET', 'bar.html').respond('bar');
        $httpBackend.when('GET', '404.html').respond('not found');
      };
    }));

    test('should return the current URL', angular.mock.inject(function($location, $$testability) {
      $location.path('/bar.html');
      expect($$testability.getLocation()).toMatch(/bar.html$/);
    }));

    test('should change the URL', angular.mock.inject(function($location, $$testability) {
      $location.path('/bar.html');
      $$testability.setLocation('foo.html');
      expect($location.path()).toEqual('/foo.html');
    }));
  });

  describe('waiting for stability', () => {
    test('should process callbacks immediately with no outstanding requests',
      angular.mock.inject(function($$testability) {
        var callback = jest.fn().mockName('callback');
        $$testability.whenStable(callback);
        expect(callback).toHaveBeenCalled();
      }));

    test('should delegate to `$browser.notifyWhenNoOutstandingRequests()`',
      angular.mock.inject(function($$testability, $browser) {
        var spy = jest.spyOn($browser, 'notifyWhenNoOutstandingRequests').mockImplementation(() => {});
        var callback = angular.noop;

        $$testability.whenStable(callback);
        expect(spy).toHaveBeenCalledWith(callback);
      }));
  });
});
