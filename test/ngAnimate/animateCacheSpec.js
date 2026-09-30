'use strict';
 describe('ngAnimate $$animateCache', () => {
  const getDomNode = (e) => (e instanceof angular.element) ? e[0] : e;

  beforeEach(angular.mock.module('ngAnimate'));

  test('should store the details in a lookup', angular.mock.inject(function($$animateCache) {
    var data = { 'hello': 'there' };
    $$animateCache.put('key', data, true);
    expect($$animateCache.get('key')).toBe(data);
  }));

  test('should update existing stored details in a lookup', angular.mock.inject(function($$animateCache) {
    var data = { 'hello': 'there' };
    $$animateCache.put('key', data, true);

    var otherData = { 'hi': 'you' };
    $$animateCache.put('key', otherData, true);
    expect($$animateCache.get('key')).toBe(otherData);
  }));

  test('should create a special cacheKey based on the element/parent and className relationship', angular.mock.inject(function($$animateCache) {
    var cacheKey;
    var elm = angular.element('<div></div>');
    elm.addClass('one two');

    var parent1 = angular.element('<div></div>');
    parent1.append(elm);

    cacheKey = $$animateCache.cacheKey(getDomNode(elm), 'event');
    expect(cacheKey).toBe('1 event one two');

    cacheKey = $$animateCache.cacheKey(getDomNode(elm), 'event', 'add');
    expect(cacheKey).toBe('1 event one two add');

    cacheKey = $$animateCache.cacheKey(getDomNode(elm), 'event', 'add', 'remove');
    expect(cacheKey).toBe('1 event one two add remove');

    var parent2 = angular.element('<div></div>');
    parent2.append(elm);

    cacheKey = $$animateCache.cacheKey(getDomNode(elm), 'event');
    expect(cacheKey).toBe('2 event one two');

    cacheKey = $$animateCache.cacheKey(getDomNode(elm), 'event', 'three', 'four');
    expect(cacheKey).toBe('2 event one two three four');
  }));

  test('should keep a count of how many times a cache key has been updated', angular.mock.inject(function($$animateCache) {
    var data = { 'hello': 'there' };
    var key = 'key';
    expect($$animateCache.count(key)).toBe(0);

    $$animateCache.put(key, data, true);
    expect($$animateCache.count(key)).toBe(1);

    var otherData = { 'other': 'data' };
    $$animateCache.put(key, otherData, true);
    expect($$animateCache.count(key)).toBe(2);
  }));

  test('should flush the cache and the counters', angular.mock.inject(function($$animateCache) {
    $$animateCache.put('key1', { data: 'value' }, true);
    $$animateCache.put('key2', { data: 'value' }, true);

    expect($$animateCache.count('key1')).toBe(1);
    expect($$animateCache.count('key2')).toBe(1);

    $$animateCache.flush();

    expect($$animateCache.get('key1')).toBeFalsy();
    expect($$animateCache.get('key2')).toBeFalsy();

    expect($$animateCache.count('key1')).toBe(0);
    expect($$animateCache.count('key2')).toBe(0);
  }));

  describe('containsCachedAnimationWithoutDuration', () => {
    test('should return false if the validity of a key is false', angular.mock.inject(function($$animateCache) {
      var validEntry = { someEssentialProperty: true };
      var invalidEntry = { someEssentialProperty: false };

      $$animateCache.put('key1', validEntry, true);
      $$animateCache.put('key2', invalidEntry, false);

      expect($$animateCache.containsCachedAnimationWithoutDuration('key1')).toBe(false);
      expect($$animateCache.containsCachedAnimationWithoutDuration('key2')).toBe(true);
    }));

    test('should return false if the key does not exist in the cache', angular.mock.inject(function($$animateCache) {
      expect($$animateCache.containsCachedAnimationWithoutDuration('key2')).toBe(false);

      $$animateCache.put('key2', {}, false);
      expect($$animateCache.containsCachedAnimationWithoutDuration('key2')).toBe(true);

      $$animateCache.flush();
      expect($$animateCache.containsCachedAnimationWithoutDuration('key2')).toBe(false);
    }));
  });

});
