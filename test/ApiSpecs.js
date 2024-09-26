'use strict';

describe('api', function() {
  describe('hashKey', function() {
    it('should use an existing `$$hashKey`', function() {
      var obj = {$$hashKey: 'foo'};
      expect(ngInternals.hashKey(obj)).toBe('foo');
    });

    it('should support a function as `$$hashKey` (and call it)', function() {
      var obj = {$$hashKey: ngInternals.valueFn('foo')};
      expect(ngInternals.hashKey(obj)).toBe('foo');
    });

    it('should create a new `$$hashKey` if none exists (and return it)', function() {
      var obj = {};
      expect(ngInternals.hashKey(obj)).toBe(obj.$$hashKey);
      expect(obj.$$hashKey).toBeDefined();
    });

    it('should create appropriate `$$hashKey`s for primitive values', function() {
      expect(ngInternals.hashKey(undefined)).toBe(ngInternals.hashKey(undefined));
      expect(ngInternals.hashKey(null)).toBe(ngInternals.hashKey(null));
      expect(ngInternals.hashKey(null)).not.toBe(ngInternals.hashKey(undefined));
      expect(ngInternals.hashKey(true)).toBe(ngInternals.hashKey(true));
      expect(ngInternals.hashKey(false)).toBe(ngInternals.hashKey(false));
      expect(ngInternals.hashKey(false)).not.toBe(ngInternals.hashKey(true));
      expect(ngInternals.hashKey(42)).toBe(ngInternals.hashKey(42));
      expect(ngInternals.hashKey(1337)).toBe(ngInternals.hashKey(1337));
      expect(ngInternals.hashKey(1337)).not.toBe(ngInternals.hashKey(42));
      expect(ngInternals.hashKey('foo')).toBe(ngInternals.hashKey('foo'));
      expect(ngInternals.hashKey('foo')).not.toBe(ngInternals.hashKey('bar'));
    });

    it('should create appropriate `$$hashKey`s for non-primitive values', function() {
      var fn = function() {};
      var arr = [];
      var obj = {};
      var date = new Date();

      expect(ngInternals.hashKey(fn)).toBe(ngInternals.hashKey(fn));
      expect(ngInternals.hashKey(fn)).not.toBe(ngInternals.hashKey(function() {}));
      expect(ngInternals.hashKey(arr)).toBe(ngInternals.hashKey(arr));
      expect(ngInternals.hashKey(arr)).not.toBe(ngInternals.hashKey([]));
      expect(ngInternals.hashKey(obj)).toBe(ngInternals.hashKey(obj));
      expect(ngInternals.hashKey(obj)).not.toBe(ngInternals.hashKey({}));
      expect(ngInternals.hashKey(date)).toBe(ngInternals.hashKey(date));
      expect(ngInternals.hashKey(date)).not.toBe(ngInternals.hashKey(new Date()));
    });

    it('should support a custom `nextUidFn`', function() {
      var nextUidFn = jest.fn()
        .mockReturnValueOnce('foo')
        .mockReturnValueOnce('bar')
        .mockReturnValueOnce('baz')
        .mockReturnValueOnce('qux');


      var fn = function() {};
      var arr = [];
      var obj = {};
      var date = new Date();

      ngInternals.hashKey(fn, nextUidFn);
      ngInternals.hashKey(arr, nextUidFn);
      ngInternals.hashKey(obj, nextUidFn);
      ngInternals.hashKey(date, nextUidFn);

      expect(fn.$$hashKey).toBe('function:foo');
      expect(arr.$$hashKey).toBe('object:bar');
      expect(obj.$$hashKey).toBe('object:baz');
      expect(date.$$hashKey).toBe('object:qux');
    });
  });
});

