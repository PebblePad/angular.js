'use strict';
 describe('$$cookieReader', () => {
  var $$cookieReader;
  var document;


  describe('with access to `document.cookie`', () => {

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

      angular.mock.inject(function(_$$cookieReader_) {
        $$cookieReader = _$$cookieReader_;
      });
    });

     afterEach(() => {
      deleteAllCookies();
      expect(document.cookie).toEqual('');
    });


    describe('get via $$cookieReader()[cookieName]', () => {

      test('should return undefined for nonexistent cookie', () => {
        expect($$cookieReader().nonexistent).not.toBeDefined();
      });


      test('should return a value for an existing cookie', () => {
        document.cookie = 'foo=bar=baz;path=/';
        expect($$cookieReader().foo).toEqual('bar=baz');
      });


      test('should return the the first value provided for a cookie', () => {
        // For a cookie that has different values that differ by path, the
        // value for the most specific path appears first.  $$cookieReader()
        // should provide that value for the cookie.
        document.cookie = 'foo="first"; foo="second"';
        expect($$cookieReader()['foo']).toBe('"first"');
      });


      test('should decode cookie values that were encoded by puts', () => {
        document.cookie = 'cookie2%3Dbar%3Bbaz=val%3Due;path=/';
        expect($$cookieReader()['cookie2=bar;baz']).toEqual('val=ue');
      });


      test('should preserve leading & trailing spaces in names and values', () => {
        document.cookie = '%20cookie%20name%20=%20cookie%20value%20';
        expect($$cookieReader()[' cookie name ']).toEqual(' cookie value ');
        expect($$cookieReader()['cookie name']).not.toBeDefined();
      });


      test('should decode special characters in cookie values', () => {
        document.cookie = 'cookie_name=cookie_value_%E2%82%AC';
        expect($$cookieReader()['cookie_name']).toEqual('cookie_value_€');
      });


      test('should not decode cookie values that do not appear to be encoded', () => {
        // see #9211 - sometimes cookies contain a value that causes decodeURIComponent to throw
        document.cookie = 'cookie_name=cookie_value_%XX';
        expect($$cookieReader()['cookie_name']).toEqual('cookie_value_%XX');
      });

    });


    describe('getAll via $$cookieReader()', () => {

      test('should return cookies as hash', () => {
        document.cookie = 'foo1=bar1;path=/';
        document.cookie = 'foo2=bar2;path=/';
        expect($$cookieReader()).toEqual({'foo1':'bar1', 'foo2':'bar2'});
      });


      test('should return empty hash if no cookies exist', () => {
        expect($$cookieReader()).toEqual({});
      });

    });


    test('should initialize cookie cache with existing cookies', () => {
      document.cookie = 'existingCookie=existingValue;path=/';
      expect($$cookieReader()).toEqual({'existingCookie':'existingValue'});
    });

  });


  describe('without access to `document.cookie`', () => {
    var cookieSpy;

    beforeEach(angular.mock.module(function($provide) {
      cookieSpy = jest.fn().mockName('cookie').mockImplementation(() => { throw new Error('Can\'t touch this!'); });
      document = Object.create({}, {'cookie': {get: cookieSpy}});

      $provide.value('$document', [document]);
    }));

    beforeEach(angular.mock.inject(function(_$$cookieReader_) {
      $$cookieReader = _$$cookieReader_;
    }));


    test('should return an empty object', () => {
      expect($$cookieReader()).toEqual({});
      expect(cookieSpy).toHaveBeenCalled();
    });

  });
});
