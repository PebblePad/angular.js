'use strict';
 describe('$$cookieWriter', () => {
  var $$cookieWriter;
  var document;

  function deleteAllCookies() {
    var cookies = document.cookie.split(';');
    var path = window.location.pathname;

    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var eqPos = cookie.indexOf('=');
      var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      var parts = path.split('/');
      while (parts.length) {
        document.cookie = name + '=;path=' + (parts.join('/') || '/') + ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
        parts.pop();
      }
    }
  }

   beforeEach(() => {
    document = window.document;
    deleteAllCookies();
    expect(document.cookie).toEqual('');

    angular.mock.module('ngCookies');
    angular.mock.inject(function(_$$cookieWriter_) {
      $$cookieWriter = _$$cookieWriter_;
    });
  });


   afterEach(() => {
    deleteAllCookies();
    expect(document.cookie).toEqual('');
  });


  describe('remove via $$cookieWriter(cookieName, undefined)', () => {

    test('should remove a cookie when it is present', () => {
      document.cookie = 'foo=bar;path=/';

      $$cookieWriter('foo', undefined);

      expect(document.cookie).toEqual('');
    });


    test('should do nothing when an nonexisting cookie is being removed', () => {
      $$cookieWriter('doesntexist', undefined);
      expect(document.cookie).toEqual('');
    });
  });


  describe('put via $$cookieWriter(cookieName, string)', () => {

    test('should create and store a cookie', () => {
      $$cookieWriter('cookieName', 'cookie=Value');
      expect(document.cookie).toMatch(/cookieName=cookie%3DValue;? ?/);
    });


    test('should overwrite an existing unsynced cookie', () => {
      document.cookie = 'cookie=new;path=/';

      var oldVal = $$cookieWriter('cookie', 'newer');

      expect(document.cookie).toEqual('cookie=newer');
      expect(oldVal).not.toBeDefined();
    });

    test('should encode both name and value', () => {
      $$cookieWriter('cookie1=', 'val;ue');
      $$cookieWriter('cookie2=bar;baz', 'val=ue');

      var rawCookies = document.cookie.split('; '); //order is not guaranteed, so we need to parse
      expect(rawCookies.length).toEqual(2);
      expect(rawCookies).toContain('cookie1%3D=val%3Bue');
      expect(rawCookies).toContain('cookie2%3Dbar%3Bbaz=val%3Due');
    });

    test('should log warnings when 4kb per cookie storage limit is reached', angular.mock.inject(function($log) {
      var i;
      var longVal = '';
      var cookieStr;

      for (i = 0; i < 4083; i++) {
        longVal += 'x';
      }

      cookieStr = document.cookie;
      $$cookieWriter('x', longVal); //total size 4093-4096, so it should go through
      expect(document.cookie).not.toEqual(cookieStr);
      expect(document.cookie).toEqual('x=' + longVal);
      expect($log.warn.logs).toEqual([]);

      $$cookieWriter('x', longVal + 'xxxx'); //total size 4097-4099, a warning should be logged
      expect($log.warn.logs).toEqual(
        [['Cookie \'x\' possibly not set or overflowed because it was too large (4097 > 4096 ' +
           'bytes)!']]);

      //force browser to dropped a cookie and make sure that the cache is not out of sync
      $$cookieWriter('x', 'shortVal');
      expect(document.cookie).toEqual('x=shortVal');
      $log.reset();
    }));
  });

  describe('put via $$cookieWriter(cookieName, string), if no <base href> ', () => {
    beforeEach(angular.mock.inject(function($browser) {
      $browser.$$baseHref = undefined;
    }));

    test('should default path in cookie to "" (empty string)', () => {
      $$cookieWriter('cookie', 'bender');
      // This only fails in Safari and IE when cookiePath returns undefined
      // Where it now succeeds since baseHref return '' instead of undefined
      expect(document.cookie).toEqual('cookie=bender');
    });
  });
});
 describe('cookie options', () => {
  var fakeDocument;
  var $$cookieWriter;
  var isUndefined = angular.isUndefined;

  function getLastCookieAssignment(key) {
    return fakeDocument[0].cookie
              .split(';')
              .reduce(function(prev, value) {
                var pair = value.split('=', 2);
                if (pair[0] === key) {
                  if (angular.isUndefined(prev)) {
                    return angular.isUndefined(pair[1]) ? true : pair[1];
                  } else {
                    throw new Error('duplicate key in cookie string');
                  }
                } else {
                  return prev;
                }
              }, undefined);
  }

   beforeEach(() => {
    fakeDocument = [{cookie: ''}];
    angular.mock.module('ngCookies', {$document: fakeDocument});
    angular.mock.inject(function($browser) {
      $browser.$$baseHref = '/a/b';
    });
    angular.mock.inject(function(_$$cookieWriter_) {
      $$cookieWriter = _$$cookieWriter_;
    });
  });

  test('should use baseHref as default path', () => {
    $$cookieWriter('name', 'value');
    expect(getLastCookieAssignment('path')).toBe('/a/b');
  });

  test('should accept path option', () => {
    $$cookieWriter('name', 'value', {path: '/c/d'});
    expect(getLastCookieAssignment('path')).toBe('/c/d');
  });

  test('should accept domain option', () => {
    $$cookieWriter('name', 'value', {domain: '.example.com'});
    expect(getLastCookieAssignment('domain')).toBe('.example.com');
  });

  test('should accept secure option', () => {
    $$cookieWriter('name', 'value', {secure: true});
    expect(getLastCookieAssignment('secure')).toBe(true);
  });

  test('should accept samesite option when value is lax', () => {
    $$cookieWriter('name', 'value', {samesite: 'lax'});
    expect(getLastCookieAssignment('samesite')).toBe('lax');
  });

  test('should accept samesite option when value is strict', () => {
    $$cookieWriter('name', 'value', {samesite: 'strict'});
    expect(getLastCookieAssignment('samesite')).toBe('strict');
  });

  test('should accept expires option on set', () => {
    $$cookieWriter('name', 'value', {expires: 'Fri, 19 Dec 2014 00:00:00 GMT'});
    expect(getLastCookieAssignment('expires')).toMatch(/^Fri, 19 Dec 2014 00:00:00 (UTC|GMT)$/);
  });

  test('should always use epoch time as expire time on remove', () => {
    $$cookieWriter('name', undefined, {expires: 'Fri, 19 Dec 2014 00:00:00 GMT'});
    expect(getLastCookieAssignment('expires')).toMatch(/^Thu, 0?1 Jan 1970 00:00:00 (UTC|GMT)$/);
  });

  test('should accept date object as expires option', () => {
    $$cookieWriter('name', 'value', {expires: new Date(Date.UTC(1981, 11, 27))});
    expect(getLastCookieAssignment('expires')).toMatch(/^Sun, 27 Dec 1981 00:00:00 (UTC|GMT)$/);
  });
});
