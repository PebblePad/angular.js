'use strict';

describe('a', function() {
  var element;
  var $compile;
  var $rootScope;

  beforeEach(angular.mock.module(function($compileProvider) {
    $compileProvider.
      directive('linkTo', ngInternals.valueFn({
        restrict: 'A',
        template: '<div class="my-link"><a href="{{destination}}">{{destination}}</a></div>',
        replace: true,
        scope: {
          destination: '@linkTo'
        }
      })).
      directive('linkNot', ngInternals.valueFn({
        restrict: 'A',
        template: '<div class="my-link"><a href>{{destination}}</a></div>',
        replace: true,
        scope: {
          destination: '@linkNot'
        }
      }));
  }));

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));


  afterEach(function() {
    dealoc(element);
  });


  it('should prevent default action to be executed when href is empty', function() {
    var orgLocation = window.document.location.href;
    var preventDefaultCalled = false;
    var event;

    element = $compile('<a href="">empty link</a>')($rootScope);

    event = window.document.createEvent('MouseEvent');
    event.initMouseEvent(
      'click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

    event.preventDefaultOrg = event.preventDefault;
    event.preventDefault = function() {
      preventDefaultCalled = true;
      if (this.preventDefaultOrg) this.preventDefaultOrg();
    };

    element[0].dispatchEvent(event);

    expect(preventDefaultCalled).toEqual(true);

    expect(window.document.location.href).toEqual(orgLocation);
  });


  it('should prevent IE for changing text content when setting attribute', function() {
    // see issue #1949
    element = angular.element('<a href="">hello@you</a>');
    $compile(element);
    element.attr('href', 'bye@me');

    expect(element.text()).toBe('hello@you');
  });


  it('should not link and hookup an event if href is present at compile', function() {
    element = angular.element('<a href="//a.com">hello@you</a>');
    var linker = $compile(element);

    const spy = jest.spyOn(angular.element.prototype, 'on').mockImplementation(() => {});

    linker($rootScope);

    expect(angular.element.prototype.on).not.toHaveBeenCalled();
    spy.mockRestore();
  });


  it('should not preventDefault if anchor element is replaced with href-containing element', function() {
    const spy = jest.spyOn(angular.element.prototype, 'on');
    element = $compile('<a link-to="https://www.google.com">')($rootScope);
    $rootScope.$digest();

    var child = element.children('a');
    var preventDefault = jest.fn();

    child.triggerHandler({
      type: 'click',
      preventDefault: preventDefault
    });

    expect(preventDefault).not.toHaveBeenCalled();
    spy.mockRestore();
  });


  it('should preventDefault if anchor element is replaced with element without href attribute', function() {
    const spy = jest.spyOn(angular.element.prototype, 'on');
    element = $compile('<a link-not="https://www.google.com">')($rootScope);
    $rootScope.$digest();

    var child = element.children('a');
    var preventDefault = jest.fn();

    child.triggerHandler({
      type: 'click',
      preventDefault: preventDefault
    });

    expect(preventDefault).toHaveBeenCalled();
    spy.mockRestore();
  });


  if (angular.isDefined(window.SVGElement)) {
    describe('SVGAElement', function() {
      it('should prevent default action to be executed when href is empty', function() {
        var orgLocation = window.document.location.href;
        var preventDefaultCalled = false;
        var event;
        var child;

        element = $compile('<svg><a xlink:href="">empty link</a></svg>')($rootScope);
        child = element.children('a');

        event = window.document.createEvent('MouseEvent');
        event.initMouseEvent(
          'click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

        event.preventDefaultOrg = event.preventDefault;
        event.preventDefault = function() {
          preventDefaultCalled = true;
          if (this.preventDefaultOrg) this.preventDefaultOrg();
        };

        child[0].dispatchEvent(event);

        expect(preventDefaultCalled).toEqual(true);
        expect(window.document.location.href).toEqual(orgLocation);
      });


      it('should not link and hookup an event if xlink:href is present at compile', function() {
        const spy = jest.spyOn(angular.element.prototype, 'on').mockImplementation(() => {});
        element = angular.element('<svg><a xlink:href="bobby">hello@you</a></svg>');
        var linker = $compile(element);


        linker($rootScope);

        expect(angular.element.prototype.on).not.toHaveBeenCalled();
        spy.mockRestore();
      });
    });
  }
});
