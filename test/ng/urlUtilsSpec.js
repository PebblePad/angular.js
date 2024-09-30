'use strict';

describe('urlUtils', function() {
  describe('urlResolve', function() {
    it('should returned already parsed URLs unchanged', function() {
      var urlObj = ngInternals.urlResolve('/foo?bar=baz#qux');
      expect(ngInternals.urlResolve(urlObj)).toBe(urlObj);
      expect(ngInternals.urlResolve(true)).toBe(true);
      expect(ngInternals.urlResolve(null)).toBeNull();
      expect(ngInternals.urlResolve(undefined)).toBeUndefined();
    });


    it('should normalize a relative url', function() {
      expect(ngInternals.urlResolve('foo').href).toMatch(/^https?:\/\/[^/]+\/foo$/);
    });


    it('should parse relative URL into component pieces', function() {
      var parsed = ngInternals.urlResolve('foo');
      expect(parsed.href).toMatch(/https?:\/\//);
      expect(parsed.protocol).toMatch(/^https?/);
      expect(parsed.host).not.toBe('');
      expect(parsed.hostname).not.toBe('');
      expect(parsed.pathname).not.toBe('');
    });


    it('should return pathname as / if empty path provided', function() {
      // IE (all versions) counts / as empty, necessary to use / so that pathname is not context.html
      var parsed = ngInternals.urlResolve('/');
      expect(parsed.pathname).toBe('/');
    });
  });


  describe('urlIsSameOrigin', function() {
    it('should support various combinations of urls - both string and parsed',
      angular.mock.inject(function($document) {
        function expectIsSameOrigin(url, expectedValue) {
          expect(ngInternals.urlIsSameOrigin(url)).toBe(expectedValue);
          expect(ngInternals.urlIsSameOrigin(ngInternals.urlResolve(url))).toBe(expectedValue);
        }

        expectIsSameOrigin('path', true);

        var origin = ngInternals.urlResolve($document[0].location.href);
        expectIsSameOrigin('//' + origin.host + '/path', true);

        // Different domain.
        expectIsSameOrigin('http://example.com/path', false);

        // Auto fill protocol.
        expectIsSameOrigin('//example.com/path', false);

        // Should not match when the ports are different.
        // This assumes that the test is *not* running on port 22 (very unlikely).
        expectIsSameOrigin('//' + origin.hostname + ':22/path', false);
      })
    );
  });


  describe('urlIsAllowedOriginFactory', function() {
    var origin = ngInternals.urlResolve(window.location.href);
    var urlIsAllowedOrigin;

    beforeEach(function() {
      urlIsAllowedOrigin = ngInternals.urlIsAllowedOriginFactory([
        'https://foo.com/',
        origin.protocol + '://bar.com:1337/'
      ]);
    });


    it('should implicitly allow the current origin', function() {
      expect(urlIsAllowedOrigin('path')).toBe(true);
    });


    it('should check against the list of whitelisted origins', function() {
      expect(urlIsAllowedOrigin('https://foo.com/path')).toBe(true);
      expect(urlIsAllowedOrigin(origin.protocol + '://bar.com:1337/path')).toBe(true);
      expect(urlIsAllowedOrigin('https://baz.com:1337/path')).toBe(false);
      expect(urlIsAllowedOrigin('https://qux.com/path')).toBe(false);
    });


    it('should support both strings and parsed URL objects', function() {
      expect(urlIsAllowedOrigin('path')).toBe(true);
      expect(urlIsAllowedOrigin(ngInternals.urlResolve('path'))).toBe(true);
      expect(urlIsAllowedOrigin('https://foo.com/path')).toBe(true);
      expect(urlIsAllowedOrigin(ngInternals.urlResolve('https://foo.com/path'))).toBe(true);
    });


    it('should return true only if the origins (protocol, hostname, post) match', function() {
      var differentProtocol = (origin.protocol !== 'http') ? 'http' : 'https';
      var differentPort = (parseInt(origin.port, 10) || 0) + 1;
      var url;


      // Relative path
      url = 'path';
      expect(urlIsAllowedOrigin(url)).toBe(true);


      // Same origin
      url = origin.protocol + '://' + origin.host + '/path';
      expect(urlIsAllowedOrigin(url)).toBe(true);

      // Same origin - implicit protocol
      url = '//' + origin.host + '/path';
      expect(urlIsAllowedOrigin(url)).toBe(true);

      // Same origin - different protocol
      url = differentProtocol + '://' + origin.host + '/path';
      expect(urlIsAllowedOrigin(url)).toBe(false);

      // Same origin - different port
      url = origin.protocol + '://' + origin.hostname + ':' + differentPort + '/path';
      expect(urlIsAllowedOrigin(url)).toBe(false);


      // Allowed origin
      url = origin.protocol + '://bar.com:1337/path';
      expect(urlIsAllowedOrigin(url)).toBe(true);

      // Allowed origin - implicit protocol
      url = '//bar.com:1337/path';
      expect(urlIsAllowedOrigin(url)).toBe(true);

      // Allowed origin - different protocol
      url = differentProtocol + '://bar.com:1337/path';
      expect(urlIsAllowedOrigin(url)).toBe(false);

      // Allowed origin - different port
      url = origin.protocol + '://bar.com:1338/path';
      expect(urlIsAllowedOrigin(url)).toBe(false);
    });
  });
});
