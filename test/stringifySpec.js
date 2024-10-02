'use strict';

describe('toDebugString', function() {
  it('should convert its argument to a string', function() {
    expect(ngInternals.toDebugString('string')).toEqual('string');
    expect(ngInternals.toDebugString(123)).toEqual('123');
    expect(ngInternals.toDebugString({a:{b:'c'}})).toEqual('{"a":{"b":"c"}}');
    expect(ngInternals.toDebugString(function fn() { var a = 10; })).toEqual('function fn()');
    expect(ngInternals.toDebugString()).toEqual('undefined');
    var a = { };
    a.a = a;
    expect(ngInternals.toDebugString(a)).toEqual('{"a":"..."}');
    expect(ngInternals.toDebugString([a,a])).toEqual('[{"a":"..."},"..."]');
  });

  it('should convert its argument that are objects to string based on maxDepth', function() {
    var a = {b: {c: {d: 1}}};
    expect(ngInternals.toDebugString(a, 1)).toEqual('{"b":"..."}');
    expect(ngInternals.toDebugString(a, 2)).toEqual('{"b":{"c":"..."}}');
    expect(ngInternals.toDebugString(a, 3)).toEqual('{"b":{"c":{"d":1}}}');
  });

  test.each([NaN, null, undefined, true, false, -1, 0])('should convert its argument that object to string  and ignore max depth when maxDepth = %s', function(maxDepth) {
      var a = {b: {c: {d: 1}}};
      expect(ngInternals.toDebugString(a, maxDepth)).toEqual('{"b":{"c":{"d":1}}}');
    }
  );
});

describe('serializeObject', function() {
  it('should convert its argument to a string', function() {
    expect(ngInternals.serializeObject({a:{b:'c'}})).toEqual('{"a":{"b":"c"}}');

    var a = { };
    a.a = a;
    expect(ngInternals.serializeObject(a)).toEqual('{"a":"..."}');
    expect(ngInternals.serializeObject([a,a])).toEqual('[{"a":"..."},"..."]');
  });

  it('should convert its argument that are objects to string based on maxDepth', function() {
    var a = {b: {c: {d: 1}}};
    expect(ngInternals.serializeObject(a, 1)).toEqual('{"b":"..."}');
    expect(ngInternals.serializeObject(a, 2)).toEqual('{"b":{"c":"..."}}');
    expect(ngInternals.serializeObject(a, 3)).toEqual('{"b":{"c":{"d":1}}}');
  });

  test.each([NaN, null, undefined, true, false, -1, 0])('should convert its argument that object to string  and ignore max depth when maxDepth = %s', function(maxDepth) {
      var a = {b: {c: {d: 1}}};
      expect(ngInternals.serializeObject(a, maxDepth)).toEqual('{"b":{"c":{"d":1}}}');
    }
  );
});
