'use strict';

/**
 * Computes a hash of an 'obj'.
 * Hash of a:
 *  string is string
 *  number is number as string
 *  object is either result of calling $$hashKey function on the object or uniquely generated id,
 *         that is also assigned to the $$hashKey property of the object.
 *
 * @param obj
 * @returns {string} hash string such that the same input will have the same hash string.
 *         The resulting string key is in 'type:hashKey' format.
 */
function hashKey(obj, nextUidFn) {
  var key = obj && obj.$$hashKey;

  if (key) {
    if (typeof key === 'function') {
      key = obj.$$hashKey();
    }
    return key;
  }

  var objType = typeof obj;
  if (objType === 'function' || (objType === 'object' && obj !== null)) {
    key = obj.$$hashKey = objType + ':' + (nextUidFn || nextUid)();
  } else {
    key = objType + ':' + obj;
  }

  return key;
}

var NgMap = Map;
var $$MapProvider = [/** @this */function() {
  this.$get = [function() {
    return NgMap;
  }];
}];
