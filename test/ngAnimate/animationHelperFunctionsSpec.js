'use strict';
 describe('animation option helper functions', () => {
  beforeEach(angular.mock.module('ngAnimate'));

  var element;
  var applyAnimationClasses;
  beforeEach(angular.mock.inject(function($$jqLite) {
    applyAnimationClasses = ngInternals.applyAnimationClassesFactory($$jqLite);
    element = angular.element('<div></div>');
  }));

  describe('prepareAnimationOptions', () => {
    test('should construct an options wrapper from the provided options',
      angular.mock.inject(function() {

      var options = ngInternals.prepareAnimationOptions({
        value: 'hello'
      });

      expect(options.value).toBe('hello');
    }));

    test('should return the same instance it already instantiated as an options object with the given element',
      angular.mock.inject(function() {

      var options = ngInternals.prepareAnimationOptions({});
      expect(ngInternals.prepareAnimationOptions(options)).toBe(options);

      var options2 = {};
      expect(ngInternals.prepareAnimationOptions(options2)).not.toBe(options);
    }));
  });

  describe('applyAnimationStyles', () => {
    test('should apply the provided `from` styles', angular.mock.inject(function() {
      var options = ngInternals.prepareAnimationOptions({
        from: { color: 'maroon' },
        to: { color: 'blue' }
      });

      ngInternals.applyAnimationFromStyles(element, options);
      expect(element.attr('style')).toContain('maroon');
    }));

    test('should apply the provided `to` styles', angular.mock.inject(function() {
      var options = ngInternals.prepareAnimationOptions({
        from: { color: 'red' },
        to: { color: 'black' }
      });

      ngInternals.applyAnimationToStyles(element, options);
      expect(element.attr('style')).toContain('black');
    }));

    test('should apply the both provided `from` and `to` styles', angular.mock.inject(function() {
      var options = ngInternals.prepareAnimationOptions({
        from: { color: 'red', 'font-size':'50px' },
        to: { color: 'green' }
      });

      ngInternals.applyAnimationStyles(element, options);
      expect(element.attr('style')).toContain('green');
      expect(element.css('font-size')).toBe('50px');
    }));

    test('should only apply the options once', angular.mock.inject(function() {
      var options = ngInternals.prepareAnimationOptions({
        from: { color: 'red', 'font-size':'50px' },
        to: { color: 'blue' }
      });

      ngInternals.applyAnimationStyles(element, options);
      expect(element.attr('style')).toContain('blue');

      element.attr('style', '');

      ngInternals.applyAnimationStyles(element, options);
      expect(element.attr('style') || '').toBe('');
    }));
  });

  describe('applyAnimationClasses', () => {
    test('should add/remove the provided CSS classes', angular.mock.inject(function() {
      element.addClass('four six');
      var options = ngInternals.prepareAnimationOptions({
        addClass: 'one two three',
        removeClass: 'four'
      });

      applyAnimationClasses(element, options);
      expect(element).toHaveClass('one two three');
      expect(element).toHaveClass('six');
      expect(element).not.toHaveClass('four');
    }));

    test('should add/remove the provided CSS classes only once', angular.mock.inject(function() {
      element.attr('class', 'blue');
      var options = ngInternals.prepareAnimationOptions({
        addClass: 'black',
        removeClass: 'blue'
      });

      applyAnimationClasses(element, options);
      element.attr('class', 'blue');

      applyAnimationClasses(element, options);
      expect(element).toHaveClass('blue');
      expect(element).not.toHaveClass('black');
    }));
  });

  describe('mergeAnimationDetails', () => {
    test('should merge in new options', angular.mock.inject(function() {
      element.attr('class', 'blue');
      var options = ngInternals.prepareAnimationOptions({
        name: 'matias',
        age: 28,
        addClass: 'black',
        removeClass: 'blue gold'
      });

      var animation1 = { options: options };
      var animation2 = {
        options: {
          age: 29,
          addClass: 'gold brown',
          removeClass: 'orange'
        }
      };

      ngInternals.mergeAnimationDetails(element, animation1, animation2);

      expect(options.name).toBe('matias');
      expect(options.age).toBe(29);
      expect(options.addClass).toBe('black brown');
      expect(options.removeClass).toBe('blue');
    }));
  });
});
