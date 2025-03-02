'use strict';

// Lots of typed array globals are used in this file and ESLint is
// not smart enough to understand the `typeof !== 'undefined'` guards.
/* globals Blob, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array,
Float32Array, Float64Array,  */

describe('angular', function() {
  var element;
  var document;

  beforeEach(function() {
    document = window.document;
  });

  afterEach(function() {
    dealoc(element);
  });

  describe('case', function() {
    it('should change case', function() {
      expect(angular.lowercase('ABC90')).toEqual('abc90');
      expect(angular.uppercase('abc90')).toEqual('ABC90');
    });
  });

  describe('copy', function() {
    it('should return same object', function() {
      var obj = {};
      var arr = [];
      expect(angular.copy({}, obj)).toBe(obj);
      expect(angular.copy([], arr)).toBe(arr);
    });

    it('should preserve prototype chaining', function() {
      var GrandParentProto = {};
      var ParentProto = Object.create(GrandParentProto);
      var obj = Object.create(ParentProto);
      expect(ParentProto.isPrototypeOf(angular.copy(obj))).toBe(true);
      expect(GrandParentProto.isPrototypeOf(angular.copy(obj))).toBe(true);
      var Foo = function() {};
      expect(angular.copy(new Foo()) instanceof Foo).toBe(true);
    });

    it('should copy Date', function() {
      var date = new Date(123);
      expect(angular.copy(date) instanceof Date).toBeTruthy();
      expect(angular.copy(date).getTime()).toEqual(123);
      expect(angular.copy(date) === date).toBeFalsy();
    });

    it('should copy RegExp', function() {
      var re = new RegExp('.*');
      expect(angular.copy(re) instanceof RegExp).toBeTruthy();
      expect(angular.copy(re).source).toBe('.*');
      expect(angular.copy(re) === re).toBe(false);
    });

    it('should copy literal RegExp', function() {
      var re = /.*/;
      expect(angular.copy(re) instanceof RegExp).toBeTruthy();
      expect(angular.copy(re).source).toEqual('.*');
      expect(angular.copy(re) === re).toBeFalsy();
    });

    it('should copy RegExp with flags', function() {
      var re = new RegExp('.*', 'gim');
      expect(angular.copy(re).global).toBe(true);
      expect(angular.copy(re).ignoreCase).toBe(true);
      expect(angular.copy(re).multiline).toBe(true);
    });

    it('should copy RegExp with lastIndex', function() {
      var re = /a+b+/g;
      var str = 'ab aabb';
      expect(re.exec(str)[0]).toEqual('ab');
      expect(angular.copy(re).exec(str)[0]).toEqual('aabb');
    });

    it('should deeply copy literal RegExp', function() {
      var objWithRegExp = {
        re: /.*/
      };
      expect(angular.copy(objWithRegExp).re instanceof RegExp).toBeTruthy();
      expect(angular.copy(objWithRegExp).re.source).toEqual('.*');
      expect(angular.copy(objWithRegExp.re) === objWithRegExp.re).toBeFalsy();
    });

    it('should copy a Uint8Array with no destination', function() {
      if (typeof Uint8Array !== 'undefined') {
        var src = new Uint8Array(2);
        src[1] = 1;
        var dst = angular.copy(src);
        expect(angular.copy(src) instanceof Uint8Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Uint8ClampedArray with no destination', function() {
      if (typeof Uint8ClampedArray !== 'undefined') {
        var src = new Uint8ClampedArray(2);
        src[1] = 1;
        var dst = angular.copy(src);
        expect(angular.copy(src) instanceof Uint8ClampedArray).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Uint16Array with no destination', function() {
      if (typeof Uint16Array !== 'undefined') {
        var src = new Uint16Array(2);
        src[1] = 1;
        var dst = angular.copy(src);
        expect(angular.copy(src) instanceof Uint16Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Uint32Array with no destination', function() {
      if (typeof Uint32Array !== 'undefined') {
        var src = new Uint32Array(2);
        src[1] = 1;
        var dst = angular.copy(src);
        expect(angular.copy(src) instanceof Uint32Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Int8Array with no destination', function() {
      if (typeof Int8Array !== 'undefined') {
        var src = new Int8Array(2);
        src[1] = 1;
        var dst = angular.copy(src);
        expect(angular.copy(src) instanceof Int8Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Int16Array with no destination', function() {
      if (typeof Int16Array !== 'undefined') {
        var src = new Int16Array(2);
        src[1] = 1;
        var dst = angular.copy(src);
        expect(angular.copy(src) instanceof Int16Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Int32Array with no destination', function() {
      if (typeof Int32Array !== 'undefined') {
        var src = new Int32Array(2);
        src[1] = 1;
        var dst = angular.copy(src);
        expect(angular.copy(src) instanceof Int32Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Float32Array with no destination', function() {
      if (typeof Float32Array !== 'undefined') {
        var src = new Float32Array(2);
        src[1] = 1;
        var dst = angular.copy(src);
        expect(angular.copy(src) instanceof Float32Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Float64Array with no destination', function() {
      if (typeof Float64Array !== 'undefined') {
        var src = new Float64Array(2);
        src[1] = 1;
        var dst = angular.copy(src);
        expect(angular.copy(src) instanceof Float64Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy an ArrayBuffer with no destination', function() {
      if (typeof ArrayBuffer !== 'undefined') {
        var src = new ArrayBuffer(8);
        new Int32Array(src).set([1, 2]);

        var dst = angular.copy(src);
        expect(dst instanceof ArrayBuffer).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
      }
    });

    it('should handle ArrayBuffer objects with multiple references', function() {
      if (typeof ArrayBuffer !== 'undefined') {
        var buffer = new ArrayBuffer(8);
        var src = [new Int32Array(buffer), new Float32Array(buffer)];
        src[0].set([1, 2]);

        var dst = angular.copy(src);
        expect(dst).toEqual(src);
        expect(dst[0]).not.toBe(src[0]);
        expect(dst[1]).not.toBe(src[1]);
        expect(dst[0].buffer).toBe(dst[1].buffer);
        expect(dst[0].buffer).not.toBe(buffer);
      }
    });

    it('should handle Int32Array objects with multiple references', function() {
      if (typeof Int32Array !== 'undefined') {
        var arr = new Int32Array(2);
        var src = [arr, arr];
        arr.set([1, 2]);

        var dst = angular.copy(src);
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst[0]).not.toBe(src[0]);
        expect(dst[0]).toBe(dst[1]);
        expect(dst[0].buffer).toBe(dst[1].buffer);
      }
    });

    it('should handle Blob objects', function() {
      if (typeof Blob !== 'undefined') {
        var src = new Blob(['foo'], {type: 'bar'});
        var dst = angular.copy(src);

        expect(dst).not.toBe(src);
        expect(dst.size).toBe(3);
        expect(dst.type).toBe('bar');
        expect(dst instanceof Blob).toBe(true);
      }
    });

    it('should handle Uint16Array subarray', function() {
      if (typeof Uint16Array !== 'undefined') {
        var arr = new Uint16Array(4);
        arr[1] = 1;
        var src = arr.subarray(1, 2);
        var dst = angular.copy(src);
        expect(dst instanceof Uint16Array).toBeTruthy();
        expect(dst.length).toEqual(1);
        expect(dst[0]).toEqual(1);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should throw an exception if a Uint8Array is the destination', function() {
      if (typeof Uint8Array !== 'undefined') {
        var src = new Uint8Array();
        var dst = new Uint8Array(5);
        expect(function() { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Uint8ClampedArray is the destination', function() {
      if (typeof Uint8ClampedArray !== 'undefined') {
        var src = new Uint8ClampedArray();
        var dst = new Uint8ClampedArray(5);
        expect(function() { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Uint16Array is the destination', function() {
      if (typeof Uint16Array !== 'undefined') {
        var src = new Uint16Array();
        var dst = new Uint16Array(5);
        expect(function() { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Uint32Array is the destination', function() {
      if (typeof Uint32Array !== 'undefined') {
        var src = new Uint32Array();
        var dst = new Uint32Array(5);
        expect(function() { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Int8Array is the destination', function() {
      if (typeof Int8Array !== 'undefined') {
        var src = new Int8Array();
        var dst = new Int8Array(5);
        expect(function() { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Int16Array is the destination', function() {
      if (typeof Int16Array !== 'undefined') {
        var src = new Int16Array();
        var dst = new Int16Array(5);
        expect(function() { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Int32Array is the destination', function() {
      if (typeof Int32Array !== 'undefined') {
        var src = new Int32Array();
        var dst = new Int32Array(5);
        expect(function() { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Float32Array is the destination', function() {
      if (typeof Float32Array !== 'undefined') {
        var src = new Float32Array();
        var dst = new Float32Array(5);
        expect(function() { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Float64Array is the destination', function() {
      if (typeof Float64Array !== 'undefined') {
        var src = new Float64Array();
        var dst = new Float64Array(5);
        expect(function() { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if an ArrayBuffer is the destination', function() {
      if (typeof ArrayBuffer !== 'undefined') {
        var src = new ArrayBuffer(5);
        var dst = new ArrayBuffer(5);
        expect(function() { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should deeply copy an array into an existing array', function() {
      var src = [1, {name:'value'}];
      var dst = [{key:'v'}];
      expect(angular.copy(src, dst)).toBe(dst);
      expect(dst).toEqual([1, {name:'value'}]);
      expect(dst[1]).toEqual({name:'value'});
      expect(dst[1]).not.toBe(src[1]);
    });

    it('should deeply copy an array into a new array', function() {
      var src = [1, {name:'value'}];
      var dst = angular.copy(src);
      expect(src).toEqual([1, {name:'value'}]);
      expect(dst).toEqual(src);
      expect(dst).not.toBe(src);
      expect(dst[1]).not.toBe(src[1]);
    });

    it('should copy empty array', function() {
      var src = [];
      var dst = [{key: 'v'}];
      expect(angular.copy(src, dst)).toEqual([]);
      expect(dst).toEqual([]);
    });

    it('should deeply copy an object into an existing object', function() {
      var src = {a:{name:'value'}};
      var dst = {b:{key:'v'}};
      expect(angular.copy(src, dst)).toBe(dst);
      expect(dst).toEqual({a:{name:'value'}});
      expect(dst.a).toEqual(src.a);
      expect(dst.a).not.toBe(src.a);
    });

    it('should deeply copy an object into a non-existing object', function() {
      var src = {a:{name:'value'}};
      var dst = angular.copy(src, undefined);
      expect(src).toEqual({a:{name:'value'}});
      expect(dst).toEqual(src);
      expect(dst).not.toBe(src);
      expect(dst.a).toEqual(src.a);
      expect(dst.a).not.toBe(src.a);
    });

    it('should copy primitives', function() {
      expect(angular.copy(null)).toEqual(null);
      expect(angular.copy('')).toBe('');
      expect(angular.copy('lala')).toBe('lala');
      expect(angular.copy(123)).toEqual(123);
      expect(angular.copy([{key:null}])).toEqual([{key:null}]);
    });

    it('should throw an exception if a Scope is being copied', angular.mock.inject(function($rootScope) {
      expect(function() { angular.copy($rootScope.$new()); }).
          toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
      expect(function() { angular.copy({child: $rootScope.$new()}, {}); }).
          toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
      expect(function() { angular.copy([$rootScope.$new()]); }).
          toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
    }));

    it('should throw an exception if a Window is being copied', function() {
      expect(function() { angular.copy(window); }).
          toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
      expect(function() { angular.copy({child: window}); }).
          toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
      expect(function() { angular.copy([window], []); }).
          toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
    });

    it('should throw an exception when source and destination are equivalent', function() {
      var src;
      var dst;
      src = dst = {key: 'value'};
      expect(function() { angular.copy(src, dst); }).toThrowMinErr('ng', 'cpi', 'Can\'t copy! Source and destination are identical.');
      src = dst = [2, 4];
      expect(function() { angular.copy(src, dst); }).toThrowMinErr('ng', 'cpi', 'Can\'t copy! Source and destination are identical.');
    });

    it('should not copy the private $$hashKey', function() {
      var src;
      var dst;
      src = {};
      ngInternals.hashKey(src);
      dst = angular.copy(src);
      expect(ngInternals.hashKey(dst)).not.toEqual(ngInternals.hashKey(src));

      src = {foo: {}};
      ngInternals.hashKey(src.foo);
      dst = angular.copy(src);
      expect(ngInternals.hashKey(src.foo)).not.toEqual(ngInternals.hashKey(dst.foo));
    });

    it('should retain the previous $$hashKey when copying object with hashKey', function() {
      var src;
      var dst;
      var h;
      src = {};
      dst = {};
      // force creation of a hashkey
      h = ngInternals.hashKey(dst);
      ngInternals.hashKey(src);
      dst = angular.copy(src,dst);

      // make sure we don't copy the key
      expect(ngInternals.hashKey(dst)).not.toEqual(ngInternals.hashKey(src));
      // make sure we retain the old key
      expect(ngInternals.hashKey(dst)).toEqual(h);
    });

    it('should retain the previous $$hashKey when copying non-object', function() {
      var dst = {};
      var h = ngInternals.hashKey(dst);

      angular.copy(null, dst);
      expect(ngInternals.hashKey(dst)).toEqual(h);

      angular.copy(42, dst);
      expect(ngInternals.hashKey(dst)).toEqual(h);

      angular.copy(new Date(), dst);
      expect(ngInternals.hashKey(dst)).toEqual(h);
    });

    it('should handle circular references', function() {
      var a = {b: {a: null}, self: null, selfs: [null, null, [null]]};
      a.b.a = a;
      a.self = a;
      a.selfs = [a, a.b, [a]];

      var aCopy = angular.copy(a, null);
      expect(aCopy).toEqual(a);

      expect(aCopy).not.toBe(a);
      expect(aCopy).toBe(aCopy.self);
      expect(aCopy).toBe(aCopy.selfs[2][0]);
      expect(aCopy.selfs[2]).not.toBe(a.selfs[2]);

      var copyTo = [];
      aCopy = angular.copy(a, copyTo);
      expect(aCopy).toBe(copyTo);
      expect(aCopy).not.toBe(a);
      expect(aCopy).toBe(aCopy.self);
    });

    it('should deeply copy XML nodes', function() {
      var anElement = document.createElement('foo');
      anElement.appendChild(document.createElement('bar'));
      var theCopy = anElement.cloneNode(true);
      expect(angular.copy(anElement).outerHTML).toEqual(theCopy.outerHTML);
      expect(angular.copy(anElement)).not.toBe(anElement);
    });

    it('should not try to call a non-function called `cloneNode`', function() {
      expect(angular.copy.bind(null, { cloneNode: 100 })).not.toThrow();
    });

    it('should handle objects with multiple references', function() {
      var b = {};
      var a = [b, -1, b];

      var aCopy = angular.copy(a);
      expect(aCopy[0]).not.toBe(a[0]);
      expect(aCopy[0]).toBe(aCopy[2]);

      var copyTo = [];
      aCopy = angular.copy(a, copyTo);
      expect(aCopy).toBe(copyTo);
      expect(aCopy[0]).not.toBe(a[0]);
      expect(aCopy[0]).toBe(aCopy[2]);
    });

    it('should handle date/regex objects with multiple references', function() {
      var re = /foo/;
      var d = new Date();
      var o = {re: re, re2: re, d: d, d2: d};

      var oCopy = angular.copy(o);
      expect(oCopy.re).toBe(oCopy.re2);
      expect(oCopy.d).toBe(oCopy.d2);

      oCopy = angular.copy(o, {});
      expect(oCopy.re).toBe(oCopy.re2);
      expect(oCopy.d).toBe(oCopy.d2);
    });

    it('should clear destination arrays correctly when source is non-array', function() {
      expect(angular.copy(null, [1,2,3])).toEqual([]);
      expect(angular.copy(undefined, [1,2,3])).toEqual([]);
      expect(angular.copy({0: 1, 1: 2}, [1,2,3])).toEqual([1,2]);
      expect(angular.copy(new Date(), [1,2,3])).toEqual([]);
      expect(angular.copy(/a/, [1,2,3])).toEqual([]);
      expect(angular.copy(true, [1,2,3])).toEqual([]);
    });

    it('should clear destination objects correctly when source is non-array', function() {
      expect(angular.copy(null, {0:1,1:2,2:3})).toEqual({});
      expect(angular.copy(undefined, {0:1,1:2,2:3})).toEqual({});
      expect(angular.copy(new Date(), {0:1,1:2,2:3})).toEqual({});
      expect(angular.copy(/a/, {0:1,1:2,2:3})).toEqual({});
      expect(angular.copy(true, {0:1,1:2,2:3})).toEqual({});
    });

    it('should copy objects with no prototype parent', function() {
      var obj = angular.extend(Object.create(null), {
        a: 1,
        b: 2,
        c: 3
      });
      var dest = angular.copy(obj);

      expect(Object.getPrototypeOf(dest)).toBe(null);
      expect(dest.a).toBe(1);
      expect(dest.b).toBe(2);
      expect(dest.c).toBe(3);
      expect(Object.keys(dest)).toEqual(['a', 'b', 'c']);
    });

    it('should copy String() objects', function() {
      // eslint-disable-next-line no-new-wrappers
      var obj = new String('foo');
      var dest = angular.copy(obj);
      expect(dest).not.toBe(obj);
      expect(angular.isObject(dest)).toBe(true);
      expect(dest.valueOf()).toBe(obj.valueOf());
    });

    it('should copy Boolean() objects', function() {
      // eslint-disable-next-line no-new-wrappers
      var obj = new Boolean(true);
      var dest = angular.copy(obj);
      expect(dest).not.toBe(obj);
      expect(angular.isObject(dest)).toBe(true);
      expect(dest.valueOf()).toBe(obj.valueOf());
    });

    it('should copy Number() objects', function() {
      // eslint-disable-next-line no-new-wrappers
      var obj = new Number(42);
      var dest = angular.copy(obj);
      expect(dest).not.toBe(obj);
      expect(angular.isObject(dest)).toBe(true);
      expect(dest.valueOf()).toBe(obj.valueOf());
    });

    it('should copy falsy String/Boolean/Number objects', function() {
      /* eslint-disable no-new-wrappers */
      expect(angular.copy(new String('')).valueOf()).toBe('');
      expect(angular.copy(new Boolean(false)).valueOf()).toBe(false);
      expect(angular.copy(new Number(0)).valueOf()).toBe(0);
      expect(angular.copy(new Number(NaN)).valueOf()).toBeNaN();
      /* eslint-enable */
    });

    it('should copy source until reaching a given max depth', function() {
      var source = {a1: 1, b1: {b2: {b3: 1}}, c1: [1, {c2: 1}], d1: {d2: 1}};
      var dest;

      dest =  angular.copy(source, {}, 1);
      expect(dest).toEqual({a1:1, b1:'...', c1:'...', d1:'...'});

      dest =  angular.copy(source, {}, 2);
      expect(dest).toEqual({a1:1, b1:{b2:'...'}, c1:[1,'...'], d1:{d2:1}});

      dest =  angular.copy(source, {}, 3);
      expect(dest).toEqual({a1: 1, b1: {b2: {b3: 1}}, c1: [1, {c2: 1}], d1: {d2: 1}});

      dest =  angular.copy(source, {}, 4);
      expect(dest).toEqual({a1: 1, b1: {b2: {b3: 1}}, c1: [1, {c2: 1}], d1: {d2: 1}});
    });

    it.each([NaN, null, undefined, true, false, -1, 0])('should copy source and ignore max depth when maxDepth = $prop', function(maxDepth) {
        var source = {a1: 1, b1: {b2: {b3: 1}}, c1: [1, {c2: 1}], d1: {d2: 1}};
        var dest =  angular.copy(source, {}, maxDepth);
        expect(dest).toEqual({a1: 1, b1: {b2: {b3: 1}}, c1: [1, {c2: 1}], d1: {d2: 1}});
      }
    );
  });

  describe('extend', function() {

    it('should not copy the private $$hashKey', function() {
      var src;
      var dst;
      src = {};
      dst = {};
      ngInternals.hashKey(src);
      dst = angular.extend(dst,src);
      expect(ngInternals.hashKey(dst)).not.toEqual(ngInternals.hashKey(src));
    });


    it('should copy the properties of the source object onto the destination object', function() {
      var destination;
      var source;
      destination = {};
      source = {foo: true};
      destination = angular.extend(destination, source);
      expect(angular.isDefined(destination.foo)).toBe(true);
    });


    it('ISSUE #4751 - should copy the length property of an object source to the destination object', function() {
      var destination;
      var source;
      destination = {};
      source = {radius: 30, length: 0};
      destination = angular.extend(destination, source);
      expect(angular.isDefined(destination.length)).toBe(true);
      expect(angular.isDefined(destination.radius)).toBe(true);
    });

    it('should retain the previous $$hashKey', function() {
      var src;
      var dst;
      var h;
      src = {};
      dst = {};
      h = ngInternals.hashKey(dst);
      ngInternals.hashKey(src);
      dst = angular.extend(dst,src);
      // make sure we don't copy the key
      expect(ngInternals.hashKey(dst)).not.toEqual(ngInternals.hashKey(src));
      // make sure we retain the old key
      expect(ngInternals.hashKey(dst)).toEqual(h);
    });


    it('should work when extending with itself', function() {
      var src;
      var dst;
      var h;
      dst = src = {};
      h = ngInternals.hashKey(dst);
      dst = angular.extend(dst,src);
      // make sure we retain the old key
      expect(ngInternals.hashKey(dst)).toEqual(h);
    });


    it('should copy dates by reference', function() {
      var src = { date: new Date() };
      var dst = {};

      angular.extend(dst, src);

      expect(dst.date).toBe(src.date);
    });

    it('should copy elements by reference', function() {
      var src = { element: document.createElement('div'),
        jqObject: angular.element('<p><span>s1</span><span>s2</span></p>').find('span') };
      var dst = {};

      angular.extend(dst, src);

      expect(dst.element).toBe(src.element);
      expect(dst.jqObject).toBe(src.jqObject);
    });
  });


  describe('merge', function() {
    it('should recursively copy objects into dst from left to right', function() {
      var dst = { foo: { bar: 'foobar' }};
      var src1 = { foo: { bazz: 'foobazz' }};
      var src2 = { foo: { bozz: 'foobozz' }};
      angular.merge(dst, src1, src2);
      expect(dst).toEqual({
        foo: {
          bar: 'foobar',
          bazz: 'foobazz',
          bozz: 'foobozz'
        }
      });
    });


    it('should replace primitives with objects', function() {
      var dst = { foo: 'bloop' };
      var src = { foo: { bar: { baz: 'bloop' }}};
      angular.merge(dst, src);
      expect(dst).toEqual({
        foo: {
          bar: {
            baz: 'bloop'
          }
        }
      });
    });


    it('should replace null values in destination with objects', function() {
      var dst = { foo: null };
      var src = { foo: { bar: { baz: 'bloop' }}};
      angular.merge(dst, src);
      expect(dst).toEqual({
        foo: {
          bar: {
            baz: 'bloop'
          }
        }
      });
    });


    it('should copy references to functions by value rather than merging', function() {
      function fn() {}
      var dst = { foo: 1 };
      var src = { foo: fn };
      angular.merge(dst, src);
      expect(dst).toEqual({
        foo: fn
      });
    });


    it('should create a new array if destination property is a non-object and source property is an array', function() {
      var dst = { foo: NaN };
      var src = { foo: [1,2,3] };
      angular.merge(dst, src);
      expect(dst).toEqual({
        foo: [1,2,3]
      });
      expect(dst.foo).not.toBe(src.foo);
    });


    it('should copy dates by value', function() {
      var src = { date: new Date() };
      var dst = {};

      angular.merge(dst, src);

      expect(dst.date).not.toBe(src.date);
      expect(angular.isDate(dst.date)).toBeTruthy();
      expect(dst.date.valueOf()).toEqual(src.date.valueOf());
    });

    it('should copy regexp by value', function() {
      var src = { regexp: /blah/ };
      var dst = {};

      angular.merge(dst, src);

      expect(dst.regexp).not.toBe(src.regexp);
      expect(angular.isRegExp(dst.regexp)).toBe(true);
      expect(dst.regexp.toString()).toBe(src.regexp.toString());
    });


    it('should angular.copy(clone) elements', function() {
      var src = {
        element: document.createElement('div'),
        jqObject: angular.element('<p><span>s1</span><span>s2</span></p>').find('span')
      };
      var dst = {};

      angular.merge(dst, src);

      expect(dst.element).not.toBe(src.element);
      expect(dst.jqObject).not.toBe(src.jqObject);

      expect(angular.isElement(dst.element)).toBeTruthy();
      expect(dst.element.nodeName).toBeDefined(); // i.e it is a DOM element
      expect(angular.isElement(dst.jqObject)).toBeTruthy();
      expect(dst.jqObject.nodeName).toBeUndefined(); // i.e it is a jqLite/jQuery object
    });

    it('should not merge the __proto__ property', function() {
      var src = JSON.parse('{ "__proto__": { "xxx": "polluted" } }');
      var dst = {};

      angular.merge(dst, src);

      if (typeof dst.__proto__ !== 'undefined') { // eslint-disable-line
        // Should not overwrite the __proto__ property or pollute the Object prototype
        expect(dst.__proto__).toBe(Object.prototype); // eslint-disable-line
      }
      expect(({}).xxx).toBeUndefined();
    });
  });


  describe('shallow copy', function() {
    it('should make a copy', function() {
      var original = {key:{}};
      var copy = angular.shallowCopy(original);
      expect(copy).toEqual(original);
      expect(copy.key).toBe(original.key);
    });

    it('should omit "$$"-prefixed properties', function() {
      var original = {$$some: true, $$: true};
      var clone = {};

      expect(angular.shallowCopy(original, clone)).toBe(clone);
      expect(clone.$$some).toBeUndefined();
      expect(clone.$$).toBeUndefined();
    });

    it('should copy "$"-prefixed properties from copy', function() {
      var original = {$some: true};
      var clone = {};

      expect(angular.shallowCopy(original, clone)).toBe(clone);
      expect(clone.$some).toBe(original.$some);
    });

    it('should handle arrays', function() {
      var original = [{}, 1];
      var clone = [];

      var aCopy = angular.shallowCopy(original);
      expect(aCopy).not.toBe(original);
      expect(aCopy).toEqual(original);
      expect(aCopy[0]).toBe(original[0]);

      expect(angular.shallowCopy(original, clone)).toBe(clone);
      expect(clone).toEqual(original);
    });

    it('should handle primitives', function() {
      expect(angular.shallowCopy('test')).toBe('test');
      expect(angular.shallowCopy(3)).toBe(3);
      expect(angular.shallowCopy(true)).toBe(true);
    });
  });


  describe('equals', function() {
    it('should return true if same object', function() {
      var o = {};
      expect(angular.equals(o, o)).toEqual(true);
      expect(angular.equals(o, {})).toEqual(true);
      expect(angular.equals(1, '1')).toEqual(false);
      expect(angular.equals(1, '2')).toEqual(false);
    });

    it('should recurse into object', function() {
      expect(angular.equals({}, {})).toEqual(true);
      expect(angular.equals({name:'misko'}, {name:'misko'})).toEqual(true);
      expect(angular.equals({name:'misko', age:1}, {name:'misko'})).toEqual(false);
      expect(angular.equals({name:'misko'}, {name:'misko', age:1})).toEqual(false);
      expect(angular.equals({name:'misko'}, {name:'adam'})).toEqual(false);
      expect(angular.equals(['misko'], ['misko'])).toEqual(true);
      expect(angular.equals(['misko'], ['adam'])).toEqual(false);
      expect(angular.equals(['misko'], ['misko', 'adam'])).toEqual(false);
    });

    it('should ignore undefined member variables during comparison', function() {
      var obj1 = {name: 'misko'};
      var obj2 = {name: 'misko', undefinedvar: undefined};

      expect(angular.equals(obj1, obj2)).toBe(true);
      expect(angular.equals(obj2, obj1)).toBe(true);
    });

    it('should ignore $ member variables', function() {
      expect(angular.equals({name:'misko', $id:1}, {name:'misko', $id:2})).toEqual(true);
      expect(angular.equals({name:'misko'}, {name:'misko', $id:2})).toEqual(true);
      expect(angular.equals({name:'misko', $id:1}, {name:'misko'})).toEqual(true);
    });

    it('should ignore functions', function() {
      expect(angular.equals({func() {}}, {bar() {}})).toEqual(true);
    });

    it('should work well with nulls', function() {
      expect(angular.equals(null, '123')).toBe(false);
      expect(angular.equals('123', null)).toBe(false);

      var obj = {foo:'bar'};
      expect(angular.equals(null, obj)).toBe(false);
      expect(angular.equals(obj, null)).toBe(false);

      expect(angular.equals(null, null)).toBe(true);
    });

    it('should work well with undefined', function() {
      expect(angular.equals(undefined, '123')).toBe(false);
      expect(angular.equals('123', undefined)).toBe(false);

      var obj = {foo:'bar'};
      expect(angular.equals(undefined, obj)).toBe(false);
      expect(angular.equals(obj, undefined)).toBe(false);

      expect(angular.equals(undefined, undefined)).toBe(true);
    });

    it('should treat two NaNs as equal', function() {
      expect(angular.equals(NaN, NaN)).toBe(true);
    });

    it('should compare Scope instances only by identity', angular.mock.inject(function($rootScope) {
      var scope1 = $rootScope.$new();
      var scope2 = $rootScope.$new();

      expect(angular.equals(scope1, scope1)).toBe(true);
      expect(angular.equals(scope1, scope2)).toBe(false);
      expect(angular.equals($rootScope, scope1)).toBe(false);
      expect(angular.equals(undefined, scope1)).toBe(false);
    }));

    it('should compare Window instances only by identity', function() {
      expect(angular.equals(window, window)).toBe(true);
      expect(angular.equals(window, window.parent)).toBe(true);
      expect(angular.equals(window, undefined)).toBe(false);
    });

    it('should compare dates', function() {
      expect(angular.equals(new Date(0), new Date(0))).toBe(true);
      expect(angular.equals(new Date(0), new Date(1))).toBe(false);
      expect(angular.equals(new Date(0), 0)).toBe(false);
      expect(angular.equals(0, new Date(0))).toBe(false);

      expect(angular.equals(new Date(undefined), new Date(undefined))).toBe(true);
      expect(angular.equals(new Date(undefined), new Date(0))).toBe(false);
      expect(angular.equals(new Date(undefined), new Date(null))).toBe(false);
      expect(angular.equals(new Date(undefined), new Date('wrong'))).toBe(true);
      expect(angular.equals(new Date(), /abc/)).toBe(false);
    });

    it('should correctly test for keys that are present on Object.prototype', function() {
      expect(angular.equals({}, {hasOwnProperty: 1})).toBe(false);
      expect(angular.equals({}, {toString: null})).toBe(false);
    });

    it('should compare regular expressions', function() {
      expect(angular.equals(/abc/, /abc/)).toBe(true);
      expect(angular.equals(/abc/i, new RegExp('abc', 'i'))).toBe(true);
      expect(angular.equals(new RegExp('abc', 'i'), new RegExp('abc', 'i'))).toBe(true);
      expect(angular.equals(new RegExp('abc', 'i'), new RegExp('abc'))).toBe(false);
      expect(angular.equals(/abc/i, /abc/)).toBe(false);
      expect(angular.equals(/abc/, /def/)).toBe(false);
      expect(angular.equals(/^abc/, /abc/)).toBe(false);
      expect(angular.equals(/^abc/, '/^abc/')).toBe(false);
      expect(angular.equals(/abc/, new Date())).toBe(false);
    });

    it('should return false when comparing an object and an array', function() {
      expect(angular.equals({}, [])).toBe(false);
      expect(angular.equals([], {})).toBe(false);
    });

    it('should return false when comparing an object and a RegExp', function() {
      expect(angular.equals({}, /abc/)).toBe(false);
      expect(angular.equals({}, new RegExp('abc', 'i'))).toBe(false);
    });

    it('should return false when comparing an object and a Date', function() {
      expect(angular.equals({}, new Date())).toBe(false);
    });

    it('should safely compare objects with no prototype parent', function() {
      var o1 = angular.extend(Object.create(null), {
        a: 1, b: 2, c: 3
      });
      var o2 = angular.extend(Object.create(null), {
        a: 1, b: 2, c: 3
      });
      expect(angular.equals(o1, o2)).toBe(true);
      o2.c = 2;
      expect(angular.equals(o1, o2)).toBe(false);
    });


    it('should safely compare objects which shadow Object.prototype.hasOwnProperty', function() {
      var o1 = {
        hasOwnProperty: true,
        a: 1,
        b: 2,
        c: 3
      };
      var o2 = {
        hasOwnProperty: true,
        a: 1,
        b: 2,
        c: 3
      };
      expect(angular.equals(o1, o2)).toBe(true);
      o1.hasOwnProperty = function() {};
      expect(angular.equals(o1, o2)).toBe(false);
    });
  });


  describe('csp', function() {

    function mockCspElement(cspAttrName, cspAttrValue) {
      return jest.spyOn(document, 'querySelector').mockImplementation(function(selector) {
        if (selector === '[' + cspAttrName + ']') {
          var html = '<div ' + cspAttrName + (cspAttrValue ? ('="' + cspAttrValue + '" ') : '') + '></div>';
          return angular.element(html)[0];
        }
      });

    }

    var originalPrototype = window.Function.prototype;

    beforeEach(function() {
      jest.spyOn(window, 'Function').mockImplementation(() => {});
      // Jasmine 2.7+ doesn't support spying on Function, so we have restore the prototype
      // as Jasmine will use Function internally
      window.Function.prototype = originalPrototype;
    });

    afterEach(function() {
      jest.restoreAllMocks();
      delete angular.$$csp.rules;
    });


    it('should return the false for all rules when CSP is not enabled (the default)', function() {
      expect(angular.$$csp()).toEqual({ noUnsafeEval: false });
    });


    it('should return true for noUnsafeEval if eval causes a CSP security policy error', function() {
      window.Function.mockImplementation(function() { throw new Error('CSP test'); });
      expect(angular.$$csp()).toEqual({ noUnsafeEval: true });
      expect(window.Function).toHaveBeenCalledWith('');
    });


    it('should return true for all rules when CSP is enabled manually via empty `ng-csp` attribute', function() {
      var spy = mockCspElement('ng-csp');
      expect(angular.$$csp()).toEqual({ noUnsafeEval: true });
      expect(spy).toHaveBeenCalledWith('[ng-csp]');
      expect(window.Function).not.toHaveBeenCalled();
    });


    it('should return true when CSP is enabled manually via [data-ng-csp]', function() {
      var spy = mockCspElement('data-ng-csp');
      expect(angular.$$csp()).toEqual({ noUnsafeEval: true });
      expect(spy).toHaveBeenCalledWith('[data-ng-csp]');
      expect(window.Function).not.toHaveBeenCalled();
    });


    it('should return true for noUnsafeEval if it is specified in the `ng-csp` attribute value', function() {
      var spy = mockCspElement('ng-csp', 'no-unsafe-eval');
      expect(angular.$$csp()).toEqual({ noUnsafeEval: true });
      expect(spy).toHaveBeenCalledWith('[ng-csp]');
      expect(window.Function).not.toHaveBeenCalled();
    });

    it('should return true for all styles if they are all specified in the `ng-csp` attribute value', function() {
      var spy = mockCspElement('ng-csp', 'no-inline-style;no-unsafe-eval');
      expect(angular.$$csp()).toEqual({ noUnsafeEval: true });
      expect(spy).toHaveBeenCalledWith('[ng-csp]');
      expect(window.Function).not.toHaveBeenCalled();
    });
  });

  describe('parseKeyValue', function() {
    it('should parse a string into key-value pairs', function() {
      expect(ngInternals.parseKeyValue('')).toEqual({});
      expect(ngInternals.parseKeyValue('simple=pair')).toEqual({simple: 'pair'});
      expect(ngInternals.parseKeyValue('first=1&second=2')).toEqual({first: '1', second: '2'});
      expect(ngInternals.parseKeyValue('escaped%20key=escaped%20value')).
      toEqual({'escaped key': 'escaped value'});
      expect(ngInternals.parseKeyValue('emptyKey=')).toEqual({emptyKey: ''});
      expect(ngInternals.parseKeyValue('flag1&key=value&flag2')).
      toEqual({flag1: true, key: 'value', flag2: true});
    });
    it('should ignore key values that are not valid URI components', function() {
      expect(function() { ngInternals.parseKeyValue('%'); }).not.toThrow();
      expect(ngInternals.parseKeyValue('%')).toEqual({});
      expect(ngInternals.parseKeyValue('invalid=%')).toEqual({ invalid: undefined });
      expect(ngInternals.parseKeyValue('invalid=%&valid=good')).toEqual({ invalid: undefined, valid: 'good' });
    });
    it('should parse a string into key-value pairs with duplicates grouped in an array', function() {
      expect(ngInternals.parseKeyValue('')).toEqual({});
      expect(ngInternals.parseKeyValue('duplicate=pair')).toEqual({duplicate: 'pair'});
      expect(ngInternals.parseKeyValue('first=1&first=2')).toEqual({first: ['1','2']});
      expect(ngInternals.parseKeyValue('escaped%20key=escaped%20value&&escaped%20key=escaped%20value2')).
      toEqual({'escaped key': ['escaped value','escaped value2']});
      expect(ngInternals.parseKeyValue('flag1&key=value&flag1')).
      toEqual({flag1: [true,true], key: 'value'});
      expect(ngInternals.parseKeyValue('flag1&flag1=value&flag1=value2&flag1')).
      toEqual({flag1: [true,'value','value2',true]});
    });


    it('should ignore properties higher in the prototype chain', function() {
      expect(ngInternals.parseKeyValue('toString=123')).toEqual({
        'toString': '123'
      });
    });

    it('should ignore badly escaped = characters', function() {
      expect(ngInternals.parseKeyValue('test=a=b')).toEqual({
          'test': 'a=b'
      });
    });
  });

  describe('toKeyValue', function() {
    it('should serialize key-value pairs into string', function() {
      expect(ngInternals.toKeyValue({})).toEqual('');
      expect(ngInternals.toKeyValue({simple: 'pair'})).toEqual('simple=pair');
      expect(ngInternals.toKeyValue({first: '1', second: '2'})).toEqual('first=1&second=2');
      expect(ngInternals.toKeyValue({'escaped key': 'escaped value'})).
      toEqual('escaped%20key=escaped%20value');
      expect(ngInternals.toKeyValue({emptyKey: ''})).toEqual('emptyKey=');
    });

    it('should serialize true values into flags', function() {
      expect(ngInternals.toKeyValue({flag1: true, key: 'value', flag2: true})).toEqual('flag1&key=value&flag2');
    });

    it('should serialize duplicates into duplicate param strings', function() {
      expect(ngInternals.toKeyValue({key: [323,'value',true]})).toEqual('key=323&key=value&key');
      expect(ngInternals.toKeyValue({key: [323,'value',true, 1234]})).
      toEqual('key=323&key=value&key&key=1234');
    });
  });

  describe('isArrayLike', function() {

    it('should return false if passed a number', function() {
      expect(ngInternals.isArrayLike(10)).toBe(false);
    });

    it('should return true if passed an array', function() {
      expect(ngInternals.isArrayLike([1,2,3,4])).toBe(true);
    });

    it('should return true if passed an object', function() {
      expect(ngInternals.isArrayLike({0:'test', 1:'bob', 2:'tree', length:3})).toBe(true);
    });

    it('should return true if passed arguments object', function() {
      function test(a,b,c) {
        expect(ngInternals.isArrayLike(arguments)).toBe(true);
      }
      test(1,2,3);
    });

    it('should return true if passed a nodelist', function() {
      var nodes1 = document.body.childNodes;
      expect(ngInternals.isArrayLike(nodes1)).toBe(true);

      var nodes2 = document.getElementsByTagName('nonExistingTagName');
      expect(ngInternals.isArrayLike(nodes2)).toBe(true);
    });

    it('should return false for objects with `length` but no matching indexable items', function() {
      var obj1 = {
        a: 'a',
        b:'b',
        length: 10
      };
      expect(ngInternals.isArrayLike(obj1)).toBe(false);

      var obj2 = {
        length: 0
      };
      expect(ngInternals.isArrayLike(obj2)).toBe(false);
    });

    it('should return true for empty instances of an Array subclass', function() {
      function ArrayLike() {}
      ArrayLike.prototype = Array.prototype;

      var arrLike = new ArrayLike();
      expect(arrLike.length).toBe(0);
      expect(ngInternals.isArrayLike(arrLike)).toBe(true);

      arrLike.push(1, 2, 3);
      expect(arrLike.length).toBe(3);
      expect(ngInternals.isArrayLike(arrLike)).toBe(true);
    });
  });


  describe('forEach', function() {
    it('should iterate over *own* object properties', function() {
      function MyObj() {
        this.bar = 'barVal';
        this.baz = 'bazVal';
      }
      MyObj.prototype.foo = 'fooVal';

      var obj = new MyObj();
      var log = [];

      angular.forEach(obj, function(value, key) { log.push(key + ':' + value); });

      expect(log).toEqual(['bar:barVal', 'baz:bazVal']);
    });


    it('should not break if obj is an array we override hasOwnProperty', function() {
      var obj = [];
      obj[0] = 1;
      obj[1] = 2;
      obj.hasOwnProperty = null;
      var log = [];
      angular.forEach(obj, function(value, key) {
        log.push(key + ':' + value);
      });
      expect(log).toEqual(['0:1', '1:2']);
    });



    it('should handle JQLite and jQuery objects like arrays', function() {
      var jqObject = angular.element('<p><span>s1</span><span>s2</span></p>').find('span');
      var log = [];

      angular.forEach(jqObject, function(value, key) { log.push(key + ':' + value.innerHTML); });
      expect(log).toEqual(['0:s1', '1:s2']);

      log = [];
      jqObject = angular.element('<pane></pane>');
      angular.forEach(jqObject.children(), function(value, key) { log.push(key + ':' + value.innerHTML); });
      expect(log).toEqual([]);
    });


    it('should handle NodeList objects like arrays', function() {
      var nodeList = angular.element('<p><span>a</span><span>b</span><span>c</span></p>')[0].childNodes;
      var log = [];


      angular.forEach(nodeList, function(value, key) { log.push(key + ':' + value.innerHTML); });
      expect(log).toEqual(['0:a', '1:b', '2:c']);
    });


    it('should handle HTMLCollection objects like arrays', function() {
      document.body.innerHTML = '<p>' +
                                  '<a name=\'x\'>a</a>' +
                                  '<a name=\'y\'>b</a>' +
                                  '<a name=\'x\'>c</a>' +
                                '</p>';

      var htmlCollection = document.getElementsByName('x');
      var log = [];

      angular.forEach(htmlCollection, function(value, key) { log.push(key + ':' + value.innerHTML); });
      expect(log).toEqual(['0:a', '1:c']);
    });

    it('should handle arguments objects like arrays', function() {
      var args;
      var log = [];

      (function() { args = arguments; })('a', 'b', 'c');

      angular.forEach(args, function(value, key) { log.push(key + ':' + value); });
      expect(log).toEqual(['0:a', '1:b', '2:c']);
    });

    it('should handle string values like arrays', function() {
      var log = [];

      angular.forEach('bar', function(value, key) { log.push(key + ':' + value); });
      expect(log).toEqual(['0:b', '1:a', '2:r']);
    });


    it('should handle objects with length property as objects', function() {
      var obj = {
          'foo': 'bar',
          'length': 2
        };

      var log = [];

      angular.forEach(obj, function(value, key) { log.push(key + ':' + value); });
      expect(log).toEqual(['foo:bar', 'length:2']);
    });


    it('should handle objects of custom types with length property as objects', function() {
      function CustomType() {
        this.length = 2;
        this.foo = 'bar';
      }

      var obj = new CustomType();
      var log = [];

      angular.forEach(obj, function(value, key) { log.push(key + ':' + value); });
      expect(log).toEqual(['length:2', 'foo:bar']);
    });


    it('should not invoke the iterator for indexed properties which are not present in the collection', function() {
      var log = [];
      var collection = [];
      collection[5] = 'SPARSE';
      angular.forEach(collection, function(item, index) {
        log.push(item + index);
      });
      expect(log.length).toBe(1);
      expect(log[0]).toBe('SPARSE5');
    });


    it('should safely iterate through objects with no prototype parent', function() {
      var obj = angular.extend(Object.create(null), {
        a: 1, b: 2, c: 3
      });
      var log = [];
      var self = {};
      angular.forEach(obj, function(val, key, collection) {
        expect(this).toBe(self);
        expect(collection).toBe(obj);
        log.push(key + '=' + val);
      }, self);
      expect(log.length).toBe(3);
      expect(log).toEqual(['a=1', 'b=2', 'c=3']);
    });


    it('should safely iterate through objects which shadow Object.prototype.hasOwnProperty', function() {
      var obj = {
        hasOwnProperty: true,
        a: 1,
        b: 2,
        c: 3
      };
      var log = [];
      var self = {};
      angular.forEach(obj, function(val, key, collection) {
        expect(this).toBe(self);
        expect(collection).toBe(obj);
        log.push(key + '=' + val);
      }, self);
      expect(log.length).toBe(4);
      expect(log).toEqual(['hasOwnProperty=true', 'a=1', 'b=2', 'c=3']);
    });


    describe('ES spec api compliance', function() {

      function testForEachSpec(expectedSize, collection) {
        var that = {};

        angular.forEach(collection, function(value, key, collectionArg) {
          expect(collectionArg).toBe(collection);
          expect(collectionArg[key]).toBe(value);

          expect(this).toBe(that);

          expectedSize--;
        }, that);

        expect(expectedSize).toBe(0);
      }


      it('should follow the ES spec when called with array', function() {
        testForEachSpec(2, [1,2]);
      });


      it('should follow the ES spec when called with arguments', function() {
        testForEachSpec(2, (function() { return arguments; })(1,2));
      });


      it('should follow the ES spec when called with string', function() {
        testForEachSpec(2, '12');
      });


      it('should follow the ES spec when called with jQuery/jqLite', function() {
        testForEachSpec(2, angular.element('<span>a</span><span>b</span>'));
      });


      it('should follow the ES spec when called with childNodes NodeList', function() {
        testForEachSpec(2, angular.element('<p><span>a</span><span>b</span></p>')[0].childNodes);
      });


      it('should follow the ES spec when called with getElementsByTagName HTMLCollection', function() {
        testForEachSpec(2, angular.element('<p><span>a</span><span>b</span></p>')[0].getElementsByTagName('*'));
      });


      it('should follow the ES spec when called with querySelectorAll HTMLCollection', function() {
        testForEachSpec(2, angular.element('<p><span>a</span><span>b</span></p>')[0].querySelectorAll('*'));
      });


      it('should follow the ES spec when called with JSON', function() {
        testForEachSpec(2, {a: 1, b: 2});
      });


      it('should follow the ES spec when called with function', function() {
        function f() {}
        f.a = 1;
        f.b = 2;
        testForEachSpec(2, f);
      });
    });
  });


  describe('encodeUriSegment', function() {
    it('should correctly encode uri segment and not encode chars defined as pchar set in rfc3986',
        function() {
      //don't encode alphanum
      expect(angular.$$encodeUriSegment('asdf1234asdf')).
        toEqual('asdf1234asdf');

      //don't encode unreserved'
      expect(angular.$$encodeUriSegment('-_.!~*\'(); -_.!~*\'();')).
        toEqual('-_.!~*\'();%20-_.!~*\'();');

      //don't encode the rest of pchar'
      expect(angular.$$encodeUriSegment(':@&=+$, :@&=+$,')).
        toEqual(':@&=+$,%20:@&=+$,');

      //encode '/' and ' ''
      expect(angular.$$encodeUriSegment('/; /;')).
        toEqual('%2F;%20%2F;');
    });
  });


  describe('encodeUriQuery', function() {
    it('should correctly encode uri query and not encode chars defined as pchar set in rfc3986',
        function() {
      //don't encode alphanum
      expect(angular.$$encodeUriQuery('asdf1234asdf')).
        toEqual('asdf1234asdf');

      //don't encode unreserved
      expect(angular.$$encodeUriQuery('-_.!~*\'() -_.!~*\'()')).
        toEqual('-_.!~*\'()+-_.!~*\'()');

      //don't encode the rest of pchar
      expect(angular.$$encodeUriQuery(':@$, :@$,')).
        toEqual(':@$,+:@$,');

      //encode '&', ';', '=', '+', and '#'
      expect(angular.$$encodeUriQuery('&;=+# &;=+#')).
        toEqual('%26;%3D%2B%23+%26;%3D%2B%23');

      //encode ' ' as '+'
      expect(angular.$$encodeUriQuery('  ')).
        toEqual('++');

      //encode ' ' as '%20' when a flag is used
      expect(angular.$$encodeUriQuery('  ', true)).
        toEqual('%20%20');

      //do not encode `null` as '+' when flag is used
      expect(angular.$$encodeUriQuery('null', true)).
        toEqual('null');

      //do not encode `null` with no flag
      expect(angular.$$encodeUriQuery('null')).
        toEqual('null');
    });
  });


  describe('AngularJS service', function() {
    it('should override services', function() {
      angular.mock.module(function($provide) {
        $provide.value('fake', 'old');
        $provide.value('fake', 'new');
      });
      angular.mock.inject(function(fake) {
        expect(fake).toEqual('new');
      });
    });

    it('should inject dependencies specified by $inject and ignore function argument name', function() {
      expect(angular.injector([function($provide) {
        $provide.factory('svc1', function() { return 'svc1'; });
        $provide.factory('svc2', ['svc1', function(s) { return 'svc2-' + s; }]);
      }]).get('svc2')).toEqual('svc2-svc1');
    });

  });


  describe('isDate', function() {
    it('should return true for Date object', function() {
      expect(angular.isDate(new Date())).toBe(true);
    });

    it('should return false for non Date objects', function() {
      expect(angular.isDate([])).toBe(false);
      expect(angular.isDate('')).toBe(false);
      expect(angular.isDate(23)).toBe(false);
      expect(angular.isDate({})).toBe(false);
    });
  });

  describe('isError', function() {
    function testErrorFromDifferentContext(createError) {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      try {
        var error = createError(iframe.contentWindow);
        expect(ngInternals.isError(error)).toBe(true);
      } finally {
        iframe.parentElement.removeChild(iframe);
      }
    }

    it('should not assume objects are errors', function() {
      var fakeError = { message: 'A fake error', stack: 'no stack here'};
      expect(ngInternals.isError(fakeError)).toBe(false);
    });

    it('should detect simple error instances', function() {
      expect(ngInternals.isError(new Error())).toBe(true);
    });

    it('should detect errors from another context', function() {
      testErrorFromDifferentContext(function(win) {
        return new win.Error();
      });
    });

    it('should detect DOMException errors from another context', function() {
      testErrorFromDifferentContext(function(win) {
        try {
          win.document.querySelectorAll('');
        } catch (e) {
          return e;
        }
      });
    });
  });

  describe('isRegExp', function() {
    it('should return true for RegExp object', function() {
      expect(angular.isRegExp(/^foobar$/)).toBe(true);
      expect(angular.isRegExp(new RegExp('^foobar$/'))).toBe(true);
    });

    it('should return false for non RegExp objects', function() {
      expect(angular.isRegExp([])).toBe(false);
      expect(angular.isRegExp('')).toBe(false);
      expect(angular.isRegExp(23)).toBe(false);
      expect(angular.isRegExp({})).toBe(false);
      expect(angular.isRegExp(new Date())).toBe(false);
    });
  });


  describe('isWindow', function() {
    it('should return true for the Window object', function() {
      expect(ngInternals.isWindow(window)).toBe(true);
    });

    it('should return false for any object that is not a Window', function() {
      expect(ngInternals.isWindow([])).toBe(false);
      expect(ngInternals.isWindow('')).toBeFalsy();
      expect(ngInternals.isWindow(23)).toBe(false);
      expect(ngInternals.isWindow({})).toBe(false);
      expect(ngInternals.isWindow(new Date())).toBe(false);
      expect(ngInternals.isWindow(document)).toBe(false);
    });
  });


  describe('compile', function() {
    it('should link to existing node and create scope', angular.mock.inject(function($rootScope, $compile) {
      var template = angular.element('<div>{{greeting = "hello world"}}</div>');
      element = $compile(template)($rootScope);
      $rootScope.$digest();
      expect(template.text()).toEqual('hello world');
      expect($rootScope.greeting).toEqual('hello world');
    }));

    it('should link to existing node and given scope', angular.mock.inject(function($rootScope, $compile) {
      var template = angular.element('<div>{{greeting = "hello world"}}</div>');
      element = $compile(template)($rootScope);
      $rootScope.$digest();
      expect(template.text()).toEqual('hello world');
    }));

    it('should link to new node and given scope', angular.mock.inject(function($rootScope, $compile) {
      var template = angular.element('<div>{{greeting = "hello world"}}</div>');

      var compile = $compile(template);
      var templateClone = template.clone();

      element = compile($rootScope, function(clone) {
        templateClone = clone;
      });
      $rootScope.$digest();

      expect(template.text()).toEqual('{{greeting = "hello world"}}');
      expect(element.text()).toEqual('hello world');
      expect(element).toEqual(templateClone);
      expect($rootScope.greeting).toEqual('hello world');
    }));

    it('should link to cloned node and create scope', angular.mock.inject(function($rootScope, $compile) {
      var template = angular.element('<div>{{greeting = "hello world"}}</div>');
      element = $compile(template)($rootScope, angular.noop);
      $rootScope.$digest();
      expect(template.text()).toEqual('{{greeting = "hello world"}}');
      expect(element.text()).toEqual('hello world');
      expect($rootScope.greeting).toEqual('hello world');
    }));
  });


  describe('nodeName_', function() {
    it('should correctly detect node name with "namespace" when xmlns is defined', function() {
      var div = angular.element('<div xmlns:ngtest="http://angularjs.org/">' +
                         '<ngtest:foo ngtest:attr="bar"></ngtest:foo>' +
                       '</div>')[0];
      expect(ngInternals.nodeName_(div.childNodes[0])).toBe('ngtest:foo');
      expect(div.childNodes[0].getAttribute('ngtest:attr')).toBe('bar');
    });

    it('should correctly detect node name with "namespace" when xmlns is NOT defined', function() {
      var div = angular.element('<div xmlns:ngtest="http://angularjs.org/">' +
                         '<ngtest:foo ngtest:attr="bar"></ng-test>' +
                       '</div>')[0];
      expect(ngInternals.nodeName_(div.childNodes[0])).toBe('ngtest:foo');
      expect(div.childNodes[0].getAttribute('ngtest:attr')).toBe('bar');
    });

    it('should return undefined for elements without the .nodeName property', function() {
      //some elements, like SVGElementInstance don't have .nodeName property
      expect(ngInternals.nodeName_({})).toBeUndefined();
    });
  });


  describe('nextUid()', function() {
    it('should return new id per call', function() {
      var seen = {};
      var count = 100;

      while (count--) {
        var current = ngInternals.nextUid();
        expect(typeof current).toBe('number');
        expect(seen[current]).toBeFalsy();
        seen[current] = true;
      }
    });
  });

  describe('bootstrap', function() {
    beforeEach(() => {
      window.name = "";
    });

    it('should bootstrap app', function() {
      var element = angular.element('<div>{{1+2}}</div>');
      var injector = angular.bootstrap(element);

      expect(injector).toBeDefined();
      expect(element.injector()).toBe(injector);
      dealoc(element);
    });

    it('should complain if app module can\'t be found', function() {
      var element = angular.element('<div>{{1+2}}</div>');

      expect(function() {
        angular.bootstrap(element, ['doesntexist']);
      }).toThrowMinErr('$injector', 'modulerr',
          new RegExp('Failed to instantiate module doesntexist due to:\\n' +
                     '.*\\[\\$injector:nomod\\] Module \'doesntexist\' is not available! You either ' +
                     'misspelled the module name or forgot to load it\\.'));

      expect(element.html()).toBe('{{1+2}}');
      dealoc(element);
    });


    describe('deferred bootstrap', function() {
      var originalName = window.name;
      var element;

      beforeEach(function() {
        window.name = '';
        element = angular.element('<div>{{1+2}}</div>');
      });

      afterEach(function() {
        dealoc(element);
        window.name = originalName;
      });

      it('should provide injector for deferred bootstrap', function() {
        var injector;
        window.name = 'NG_DEFER_BOOTSTRAP!';

        injector = angular.bootstrap(element);
        expect(injector).toBeUndefined();

        injector = angular.resumeBootstrap();
        expect(injector).toBeDefined();
      });

      it('should resume deferred bootstrap, if defined', function() {
        window.name = 'NG_DEFER_BOOTSTRAP!';

        angular.resumeDeferredBootstrap = angular.noop;
        var spy = jest.spyOn(angular, 'resumeDeferredBootstrap');
        angular.bootstrap(element);
        expect(spy).toHaveBeenCalled();
      });

      it('should wait for extra modules', function() {
        window.name = 'NG_DEFER_BOOTSTRAP!';
        angular.bootstrap(element);

        expect(element.html()).toBe('{{1+2}}');

        angular.resumeBootstrap();

        expect(element.html()).toBe('3');
        expect(window.name).toEqual('');
      });


      it('should load extra modules', function() {
        element = angular.element('<div>{{1+2}}</div>');
        window.name = 'NG_DEFER_BOOTSTRAP!';

        var bootstrapping = jest.fn();
        angular.bootstrap(element, [bootstrapping]);

        expect(bootstrapping).not.toHaveBeenCalled();
        expect(element.injector()).toBeUndefined();

        angular.module('addedModule', []).value('foo', 'bar');
        angular.resumeBootstrap(['addedModule']);

        expect(bootstrapping).toHaveBeenCalledTimes(1);
        expect(element.injector().get('foo')).toEqual('bar');
      });


      it('should not defer bootstrap without window.name cue', function() {
        angular.bootstrap(element, []);
        angular.module('addedModule', []).value('foo', 'bar');

        expect(function() {
          element.injector().get('foo');
        }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: fooProvider <- foo');

        expect(element.injector().get('$http')).toBeDefined();
      });


      it('should restore the original window.name after bootstrap', function() {
        window.name = 'NG_DEFER_BOOTSTRAP!my custom name';
        angular.bootstrap(element);

        expect(element.html()).toBe('{{1+2}}');

        angular.resumeBootstrap();

        expect(element.html()).toBe('3');
        expect(window.name).toEqual('my custom name');
      });
    });
  });


  describe('snake_case', function() {
    it('should convert to snake_case', function() {
      expect(ngInternals.snake_case('ABC')).toEqual('a_b_c');
      expect(ngInternals.snake_case('alanBobCharles')).toEqual('alan_bob_charles');
    });


    it('should allow separator to be overridden', function() {
      expect(ngInternals.snake_case('ABC', '&')).toEqual('a&b&c');
      expect(ngInternals.snake_case('alanBobCharles', '&')).toEqual('alan&bob&charles');
    });
  });


  describe('fromJson', function() {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should delegate to JSON.parse', function() {
      var spy = jest.spyOn(JSON, 'parse');

      expect(angular.fromJson('{}')).toEqual({});
      expect(spy).toHaveBeenCalled();
    });
  });


  describe('toJson', function() {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should delegate to JSON.stringify', function() {
      var spy = jest.spyOn(JSON, 'stringify');

      expect(angular.toJson({})).toEqual('{}');
      expect(spy).toHaveBeenCalled();
    });


    it('should format objects pretty', function() {
      expect(angular.toJson({a: 1, b: 2}, true)).
          toBe('{\n  "a": 1,\n  "b": 2\n}');
      expect(angular.toJson({a: {b: 2}}, true)).
          toBe('{\n  "a": {\n    "b": 2\n  }\n}');
      expect(angular.toJson({a: 1, b: 2}, false)).
          toBe('{"a":1,"b":2}');
      expect(angular.toJson({a: 1, b: 2}, 0)).
          toBe('{"a":1,"b":2}');
      expect(angular.toJson({a: 1, b: 2}, 1)).
          toBe('{\n "a": 1,\n "b": 2\n}');
      expect(angular.toJson({a: 1, b: 2}, {})).
          toBe('{\n  "a": 1,\n  "b": 2\n}');
    });


    it('should not serialize properties starting with $$', function() {
      expect(angular.toJson({$$some:'value'}, false)).toEqual('{}');
    });


    it('should serialize properties starting with $', function() {
      expect(angular.toJson({$few: 'v'}, false)).toEqual('{"$few":"v"}');
    });


    it('should not serialize $window object', function() {
      expect(angular.toJson(window)).toEqual('"$WINDOW"');
    });


    it('should not serialize $document object', function() {
      expect(angular.toJson(document)).toEqual('"$DOCUMENT"');
    });


    it('should not serialize scope instances', angular.mock.inject(function($rootScope) {
      expect(angular.toJson({key: $rootScope})).toEqual('{"key":"$SCOPE"}');
    }));

    it('should serialize undefined as undefined', function() {
      expect(angular.toJson(undefined)).toEqual(undefined);
    });
  });

  describe('isElement', function() {
    it('should return a boolean value', angular.mock.inject(function($rootElement, $compile, $document, $rootScope) {
      element = $compile('<p>Hello, world!</p>')($rootScope);
      var body = $document.find('body')[0];
      var expected = [false, false, false, false, false, false, false, true, true];
      var tests = [null, undefined, 'string', 1001, {}, 0, false, body, element];

      angular.forEach(tests, function(value, idx) {
        var result = angular.isElement(value);
        expect(typeof result).toEqual('boolean');
        expect(result).toEqual(expected[idx]);
      });
    }));

    // Issue #4805
    it('should return false for objects resembling a Backbone Collection', function() {
      // Backbone stuff is sort of hard to mock, if you have a better way of doing this,
      // please fix this.
      var fakeBackboneCollection = {
        children: [{}, {}, {}],
        find() {},
        on() {},
        off() {},
        bind() {}
      };
      expect(angular.isElement(fakeBackboneCollection)).toBe(false);
    });

    it('should return false for arrays with node-like properties', function() {
      var array = [1,2,3];
      array.on = true;
      expect(angular.isElement(array)).toBe(false);
    });
  });
});
