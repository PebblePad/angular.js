'use strict';
 describe('resource', () => {
  var noop = angular.noop;
  var extend = angular.extend;
 describe('basic usage', () => {
  var $resource;
  var CreditCard;
  var callback;
  var $httpBackend;
  var resourceProvider;
  var $q;

  beforeEach(angular.mock.module('ngResource'));

  beforeEach(angular.mock.module(function($resourceProvider) {
    resourceProvider = $resourceProvider;
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $resource = $injector.get('$resource');
    $q = $injector.get('$q');
    CreditCard = $resource('/CreditCard/:id:verb', {id:'@id.key'}, {
      charge:{
        method:'post',
        params:{verb:'!charge'}
      },
      patch: {
        method: 'PATCH'
      },
      conditionalPut: {
        method: 'PUT',
        headers: {
          'If-None-Match': '*'
        }
      }

    });
    callback = jest.fn().mockName('callback');
  }));

   afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
  });


  describe('isValidDottedPath', () => {
    /* global isValidDottedPath: false */
    test('should support arbitrary dotted names', () => {
      expect(ngInternals.isValidDottedPath('')).toBe(false);
      expect(ngInternals.isValidDottedPath('1')).toBe(false);
      expect(ngInternals.isValidDottedPath('1abc')).toBe(false);
      expect(ngInternals.isValidDottedPath('.')).toBe(false);
      expect(ngInternals.isValidDottedPath('$')).toBe(true);
      expect(ngInternals.isValidDottedPath('@')).toBe(true);
      expect(ngInternals.isValidDottedPath('a')).toBe(true);
      expect(ngInternals.isValidDottedPath('A')).toBe(true);
      expect(ngInternals.isValidDottedPath('a1')).toBe(true);
      expect(ngInternals.isValidDottedPath('$a')).toBe(true);
      expect(ngInternals.isValidDottedPath('$1')).toBe(true);
      expect(ngInternals.isValidDottedPath('$$')).toBe(true);
      expect(ngInternals.isValidDottedPath('$.$')).toBe(true);
      expect(ngInternals.isValidDottedPath('.$')).toBe(false);
      expect(ngInternals.isValidDottedPath('$.')).toBe(false);
      expect(ngInternals.isValidDottedPath('@.')).toBe(false);
      expect(ngInternals.isValidDottedPath('.@')).toBe(false);
    });
  });

  describe('lookupDottedPath', () => {
    /* global lookupDottedPath: false */
    var data = {a: {b: 'foo', c: null, '@d':'d-foo'},'@b':'b-foo'};

    test('should throw for invalid path', () => {
      expect(function() {
        ngInternals.lookupDottedPath(data, '.ckck');
      }).toThrowMinErr('$resource', 'badmember',
                       'Dotted member path "@.ckck" is invalid.');
    });

    test('should get dotted paths', () => {
      expect(ngInternals.lookupDottedPath(data, 'a')).toEqual({b: 'foo', c: null, '@d':'d-foo'});
      expect(ngInternals.lookupDottedPath(data, 'a.b')).toBe('foo');
      expect(ngInternals.lookupDottedPath(data, 'a.c')).toBeNull();
      expect(ngInternals.lookupDottedPath(data, 'a.@d')).toBe('d-foo');
      expect(ngInternals.lookupDottedPath(data, '@b')).toBe('b-foo');
    });

    test('should skip over null/undefined members', () => {
      expect(ngInternals.lookupDottedPath(data, 'a.b.c')).toBeUndefined();
      expect(ngInternals.lookupDottedPath(data, 'a.c.c')).toBeUndefined();
      expect(ngInternals.lookupDottedPath(data, 'a.b.c.d')).toBeUndefined();
      expect(ngInternals.lookupDottedPath(data, 'NOT_EXIST')).toBeUndefined();
    });
  });

  test('should not include a request body when calling $delete', () => {
    $httpBackend.expect('DELETE', '/fooresource', null).respond({});
    var Resource = $resource('/fooresource');
    var resource = new Resource({ foo: 'bar' });

    resource.$delete();
    $httpBackend.flush();
  });

  test('should include a request body when calling custom method with hasBody is true', () => {
    var instant = {name: 'info.txt'};
    var condition = {at: '2038-01-19 03:14:08'};

    $httpBackend.expect('CREATE', '/fooresource', instant).respond({fid: 42});
    $httpBackend.expect('DELETE', '/fooresource', condition).respond({});

    var r = $resource('/fooresource', {}, {
      create: {method: 'CREATE', hasBody: true},
      delete: {method: 'DELETE', hasBody: true}
    });

    var creationResponse = r.create(instant);
    var deleteResponse = r.delete(condition);

    $httpBackend.flush();

    expect(creationResponse.fid).toBe(42);
    expect(deleteResponse.$resolved).toBe(true);
  });

  test('should not include a request body if hasBody is false on POST, PUT and PATCH', () => {
    function verifyRequest(method, url, data) {
      expect(data).toBeUndefined();
      return [200, {id: 42}];
    }

    $httpBackend.expect('POST', '/foo').respond(verifyRequest);
    $httpBackend.expect('PUT', '/foo').respond(verifyRequest);
    $httpBackend.expect('PATCH', '/foo').respond(verifyRequest);

    var R = $resource('/foo', {}, {
      post: {method: 'POST', hasBody: false},
      put: {method: 'PUT', hasBody: false},
      patch: {method: 'PATCH', hasBody: false}
    });

    var postResponse = R.post();
    var putResponse = R.put();
    var patchResponse = R.patch();

    $httpBackend.flush();

    expect(postResponse.id).toBe(42);
    expect(putResponse.id).toBe(42);
    expect(patchResponse.id).toBe(42);
  });

  test('should expect a body if hasBody is true', () => {
    var username = 'yathos';
    var loginRequest = {name: username, password: 'Smile'};
    var user = {id: 1, name: username};

    $httpBackend.expect('LOGIN', '/user/me', loginRequest).respond(user);

    $httpBackend.expect('LOGOUT', '/user/me', null).respond(null);

    var UserService = $resource('/user/me', {}, {
      login: {method: 'LOGIN', hasBody: true},
      logout: {method: 'LOGOUT', hasBody: false}
    });

    var loginResponse = UserService.login(loginRequest);
    var logoutResponse = UserService.logout();

    $httpBackend.flush();

    expect(loginResponse.id).toBe(user.id);
    expect(logoutResponse.$resolved).toBe(true);
  });

  test('should build resource', () => {
    expect(typeof CreditCard).toBe('function');
    expect(typeof CreditCard.get).toBe('function');
    expect(typeof CreditCard.save).toBe('function');
    expect(typeof CreditCard.remove).toBe('function');
    expect(typeof CreditCard['delete']).toBe('function');
    expect(typeof CreditCard.query).toBe('function');
  });


  describe('shallow copy', () => {
    /* global ngInternals.shallowClearAndCopy */
    test('should make a copy', () => {
      var original = {key:{}};
      var copy = ngInternals.shallowClearAndCopy(original);
      expect(copy).toEqual(original);
      expect(copy.key).toBe(original.key);
    });


    test('should omit "$$"-prefixed properties', () => {
      var original = {$$some: true, $$: true};
      var clone = {};

      expect(ngInternals.shallowClearAndCopy(original, clone)).toBe(clone);
      expect(clone.$$some).toBeUndefined();
      expect(clone.$$).toBeUndefined();
    });


    test('should copy "$"-prefixed properties from copy', () => {
      var original = {$some: true};
      var clone = {};

      expect(ngInternals.shallowClearAndCopy(original, clone)).toBe(clone);
      expect(clone.$some).toBe(original.$some);
    });


    test('should omit properties from prototype chain', () => {
      var original;
      var clone = {};
      function Func() {}
      Func.prototype.hello = 'world';

      original = new Func();
      original.goodbye = 'world';

      expect(ngInternals.shallowClearAndCopy(original, clone)).toBe(clone);
      expect(clone.hello).toBeUndefined();
      expect(clone.goodbye).toBe('world');
    });
  });


  test('should not throw if response.data is the resource object', () => {
    var data = {id:{key:123}, number:'9876'};
    $httpBackend.expect('GET', '/CreditCard/123').respond(data);

    var cc = CreditCard.get({id:123});
    $httpBackend.flush();
    expect(cc instanceof CreditCard).toBe(true);

    $httpBackend.expect('POST', '/CreditCard/123', angular.toJson(data)).respond(cc);

    cc.$save();
    $httpBackend.flush();
    expect(cc.id).toEqual({key:123});
    expect(cc.number).toEqual('9876');
  });


  test('should default to empty parameters', () => {
    $httpBackend.expect('GET', 'URL').respond({});
    $resource('URL').query();
  });


  test('should ignore slashes of undefined parameters', () => {
    var R = $resource('/Path/:a/:b/:c');

    $httpBackend.when('GET', '/Path').respond('{}');
    $httpBackend.when('GET', '/Path/0').respond('{}');
    $httpBackend.when('GET', '/Path/false').respond('{}');
    $httpBackend.when('GET', '/Path').respond('{}');
    $httpBackend.when('GET', '/Path/').respond('{}');
    $httpBackend.when('GET', '/Path/1').respond('{}');
    $httpBackend.when('GET', '/Path/2/3').respond('{}');
    $httpBackend.when('GET', '/Path/4/5').respond('{}');
    $httpBackend.when('GET', '/Path/6/7/8').respond('{}');

    R.get({});
    R.get({a:0});
    R.get({a:false});
    R.get({a:null});
    R.get({a:undefined});
    R.get({a:''});
    R.get({a:1});
    R.get({a:2, b:3});
    R.get({a:4, c:5});
    R.get({a:6, b:7, c:8});
  });

  test('should not ignore leading slashes of undefined parameters that have non-slash trailing sequence', () => {
    var R = $resource('/Path/:a.foo/:b.bar/:c.baz');

    $httpBackend.when('GET', '/Path/.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/0.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/false.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/1.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/2.foo/3.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/4.foo/.bar/5.baz').respond('{}');
    $httpBackend.when('GET', '/Path/6.foo/7.bar/8.baz').respond('{}');

    R.get({});
    R.get({a:0});
    R.get({a:false});
    R.get({a:null});
    R.get({a:undefined});
    R.get({a:''});
    R.get({a:1});
    R.get({a:2, b:3});
    R.get({a:4, c:5});
    R.get({a:6, b:7, c:8});
  });

  test('should not collapsed the url into an empty string', () => {
    var R = $resource('/:foo/:bar/');

    $httpBackend.when('GET', '/').respond('{}');

    R.get({});
  });

  test('should support escaping colons in url template', () => {
    var R = $resource('http://localhost\\:8080/Path/:a/\\:stillPath/:b');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo/:stillPath/bar').respond();
    R.get({a: 'foo', b: 'bar'});
  });

  test('should support an unescaped url', () => {
    var R = $resource('http://localhost:8080/Path/:a');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo').respond();
    R.get({a: 'foo'});
  });


  test('should correctly encode url params', () => {
    var R = $resource('/Path/:a');

    $httpBackend.expect('GET', '/Path/foo%231').respond('{}');
    $httpBackend.expect('GET', '/Path/doh!@foo?bar=baz%231').respond('{}');
    $httpBackend.expect('GET', '/Path/herp$').respond('{}');
    $httpBackend.expect('GET', '/Path/foo;bar').respond('{}');
    $httpBackend.expect('GET', '/Path/foo?bar=baz;qux').respond('{}');

    R.get({a: 'foo#1'});
    R.get({a: 'doh!@foo', bar: 'baz#1'});
    R.get({a: 'herp$'});
    R.get({a: 'foo;bar'});
    R.get({a: 'foo', bar: 'baz;qux'});
  });

  test('should not encode @ in url params', () => {
    //encodeURIComponent is too aggressive and doesn't follow http://www.ietf.org/rfc/rfc3986.txt
    //with regards to the character set (pchar) allowed in path segments
    //so we need this test to make sure that we don't over-encode the params and break stuff like
    //buzz api which uses @self

    var R = $resource('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh@fo%20o?!do%26h=g%3Da+h&:bar=$baz@1').respond('{}');
    R.get({a: 'doh@fo o', ':bar': '$baz@1', '!do&h': 'g=a h'});
  });

  test('should encode array params', () => {
    var R = $resource('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh&foo?bar=baz1&bar=baz2').respond('{}');
    R.get({a: 'doh&foo', bar: ['baz1', 'baz2']});
  });

  test('should not encode string "null" to "+" in url params', () => {
    var R = $resource('/Path/:a');
    $httpBackend.expect('GET', '/Path/null').respond('{}');
    R.get({a: 'null'});
  });


  test('should implicitly strip trailing slashes from URLs by default', () => {
    var R = $resource('http://localhost:8080/Path/:a/');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo').respond();
    R.get({a: 'foo'});
  });

  test('should support explicitly stripping trailing slashes from URLs', () => {
    var R = $resource('http://localhost:8080/Path/:a/', {}, {}, {stripTrailingSlashes: true});

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo').respond();
    R.get({a: 'foo'});
  });

  test('should support explicitly keeping trailing slashes in URLs', () => {
    var R = $resource('http://localhost:8080/Path/:a/', {}, {}, {stripTrailingSlashes: false});

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo/').respond();
    R.get({a: 'foo'});
  });

  test('should support provider-level configuration to strip trailing slashes in URLs', () => {
    // Set the new behavior for all new resources created by overriding the
    // provider configuration
    resourceProvider.defaults.stripTrailingSlashes = false;

    var R = $resource('http://localhost:8080/Path/:a/');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo/').respond();
    R.get({a: 'foo'});
  });

  test('should support IPv6 URLs', () => {
    test('http://[2620:0:861:ed1a::1]',        {ed1a: 'foo'}, 'http://[2620:0:861:ed1a::1]');
    test('http://[2620:0:861:ed1a::1]/',       {ed1a: 'foo'}, 'http://[2620:0:861:ed1a::1]/');
    test('http://[2620:0:861:ed1a::1]/:ed1a',  {ed1a: 'foo'}, 'http://[2620:0:861:ed1a::1]/foo');
    test('http://[2620:0:861:ed1a::1]/:ed1a',  {},            'http://[2620:0:861:ed1a::1]/');
    test('http://[2620:0:861:ed1a::1]/:ed1a/', {ed1a: 'foo'}, 'http://[2620:0:861:ed1a::1]/foo/');
    test('http://[2620:0:861:ed1a::1]/:ed1a/', {},            'http://[2620:0:861:ed1a::1]/');

    // Helpers
    function test(templateUrl, params, actualUrl) {
      var R = $resource(templateUrl, null, null, {stripTrailingSlashes: false});
      $httpBackend.expect('GET', actualUrl).respond(null);
      R.get(params);
    }
  });

  test('should support params in the `hostname` part of the URL', () => {
    test('http://:hostname',            {hostname: 'foo.com'},              'http://foo.com');
    test('http://:hostname/',           {hostname: 'foo.com'},              'http://foo.com/');
    test('http://:l2Domain.:l1Domain',  {l1Domain: 'com', l2Domain: 'bar'}, 'http://bar.com');
    test('http://:l2Domain.:l1Domain/', {l1Domain: 'com', l2Domain: 'bar'}, 'http://bar.com/');
    test('http://127.0.0.:octet',       {octet: 42},                        'http://127.0.0.42');
    test('http://127.0.0.:octet/',      {octet: 42},                        'http://127.0.0.42/');

    // Helpers
    function test(templateUrl, params, actualUrl) {
      var R = $resource(templateUrl, null, null, {stripTrailingSlashes: false});
      $httpBackend.expect('GET', actualUrl).respond(null);
      R.get(params);
    }
  });

  test('should support overriding provider default trailing-slash stripping configuration', () => {
    // Set the new behavior for all new resources created by overriding the
    // provider configuration
    resourceProvider.defaults.stripTrailingSlashes = false;

    // Specific instances of $resource can still override the provider's default
    var R = $resource('http://localhost:8080/Path/:a/', {}, {}, {stripTrailingSlashes: true});

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo').respond();
    R.get({a: 'foo'});
  });


  test('should allow relative paths in resource url', () => {
    var R = $resource(':relativePath');
    $httpBackend.expect('GET', 'data.json').respond('{}');
    R.get({ relativePath: 'data.json' });
  });

  test('should handle + in url params', () => {
    var R = $resource('/api/myapp/:myresource?from=:from&to=:to&histlen=:histlen');
    $httpBackend.expect('GET', '/api/myapp/pear+apple?from=2012-04-01&to=2012-04-29&histlen=3').respond('{}');
    R.get({ myresource: 'pear+apple', from: '2012-04-01', to: '2012-04-29', histlen: 3  });
  });


  test('should encode & in query params unless in query param value', () => {
    var R1 = $resource('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh&foo?bar=baz%261').respond('{}');
    R1.get({a: 'doh&foo', bar: 'baz&1'});

    var R2 = $resource('/api/myapp/resource?:query');
    $httpBackend.expect('GET', '/api/myapp/resource?foo&bar').respond('{}');
    R2.get({query: 'foo&bar'});

    var R3 = $resource('/api/myapp/resource?from=:from');
    $httpBackend.expect('GET', '/api/myapp/resource?from=bar%20%26%20blanks').respond('{}');
    R3.get({from: 'bar & blanks'});
  });


  test('should build resource with default param', () => {
    $httpBackend.expect('GET', '/Order/123/Line/456.visa?minimum=0.05').respond({id: 'abc'});
    var LineItem = $resource('/Order/:orderId/Line/:id:verb',
                                  {orderId: '123', id: '@id.key', verb:'.visa', minimum: 0.05});
    var item = LineItem.get({id: 456});
    $httpBackend.flush();
    expect(item).toEqualData({id:'abc'});
  });


  test('should support @_property lookups with underscores', () => {
    $httpBackend.expect('GET', '/Order/123').respond({_id: {_key:'123'}, count: 0});
    var LineItem = $resource('/Order/:_id', {_id: '@_id._key'});
    var item = LineItem.get({_id: 123});
    $httpBackend.flush();
    expect(item).toEqualData({_id: {_key: '123'}, count: 0});
    $httpBackend.expect('POST', '/Order/123').respond({_id: {_key:'123'}, count: 1});
    item.$save();
    $httpBackend.flush();
    expect(item).toEqualData({_id: {_key: '123'}, count: 1});
  });


  test('should not pass default params between actions', () => {
    var R = $resource('/Path', {}, {get: {method: 'GET', params: {objId: '1'}}, perform: {method: 'GET'}});

    $httpBackend.expect('GET', '/Path?objId=1').respond('{}');
    $httpBackend.expect('GET', '/Path').respond('{}');

    R.get({});
    R.perform({});
  });


  test('should build resource with action default param overriding default param', () => {
    $httpBackend.expect('GET', '/Customer/123').respond({id: 'abc'});
    var TypeItem = $resource('/:type/:typeId', {type: 'Order'},
                                  {get: {method: 'GET', params: {type: 'Customer'}}});
    var item = TypeItem.get({typeId: 123});

    $httpBackend.flush();
    expect(item).toEqualData({id: 'abc'});
  });


  test('should build resource with action default param reading the value from instance', () => {
    $httpBackend.expect('POST', '/Customer/123').respond();
    var R = $resource('/Customer/:id', {}, {post: {method: 'POST', params: {id: '@id'}}});

    var inst = new R({id:123});
    expect(inst.id).toBe(123);

    inst.$post();
  });


  test('should not throw TypeError on null default params', () => {
    $httpBackend.expect('GET', '/Path').respond('{}');
    var R = $resource('/Path', {param: null}, {get: {method: 'GET'}});

    expect(function() {
      R.get({});
    }).not.toThrow();
  });


  test('should handle multiple params with same name', () => {
    var R = $resource('/:id/:id');

    $httpBackend.when('GET').respond('{}');
    $httpBackend.expect('GET', '/1/1');

    R.get({id:1});
  });


  test('should throw an exception if a param is called "hasOwnProperty"', () => {
    expect(function() {
      $resource('/:hasOwnProperty').get();
    }).toThrowMinErr('$resource','badname', 'hasOwnProperty is not a valid parameter name');
  });


  test('should create resource', () => {
    $httpBackend.expect('POST', '/CreditCard', '{"name":"misko"}').respond({id: 123, name: 'misko'});

    var cc = CreditCard.save({name: 'misko'}, callback);
    expect(cc).toEqualData({name: 'misko'});
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(cc).toEqualData({id: 123, name: 'misko'});
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.lastCall[0]).toEqual(cc);
    expect(callback.mock.lastCall[1]()).toEqual(Object.create(null));
  });


  test('should read resource', () => {
    $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
    var cc = CreditCard.get({id: 123}, callback);

    expect(cc instanceof CreditCard).toBeTruthy();
    expect(cc).toEqualData({});
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(cc).toEqualData({id: 123, number: '9876'});
    expect(callback.mock.lastCall[0]).toEqual(cc);
    expect(callback.mock.lastCall[1]()).toEqual(Object.create(null));
  });


  test('should send correct headers', () => {
    $httpBackend.expectPUT('/CreditCard/123', undefined, function(headers) {
      return headers['If-None-Match'] === '*';
    }).respond({id:123});

    CreditCard.conditionalPut({id: {key:123}});
  });


  test('should read partial resource', () => {
    $httpBackend.expect('GET', '/CreditCard').respond([{id:{key:123}}]);
    var ccs = CreditCard.query();

    $httpBackend.flush();
    expect(ccs.length).toEqual(1);

    var cc = ccs[0];
    expect(cc instanceof CreditCard).toBe(true);
    expect(cc.number).toBeUndefined();

    $httpBackend.expect('GET', '/CreditCard/123').respond({id: {key: 123}, number: '9876'});
    cc.$get(callback);
    $httpBackend.flush();
    expect(callback.mock.lastCall[0]).toEqual(cc);
    expect(callback.mock.lastCall[1]()).toEqual(Object.create(null));
    expect(cc.number).toEqual('9876');
  });


  test('should update resource', () => {
    $httpBackend.expect('POST', '/CreditCard/123', '{"id":{"key":123},"name":"misko"}').
                 respond({id: {key: 123}, name: 'rama'});

    var cc = CreditCard.save({id: {key: 123}, name: 'misko'}, callback);
    expect(cc).toEqualData({id:{key:123}, name:'misko'});
    expect(callback).not.toHaveBeenCalled();
    $httpBackend.flush();
  });


  test('should query resource', () => {
    $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);

    var ccs = CreditCard.query({key: 'value'}, callback);
    expect(ccs).toEqualData([]);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(ccs).toEqualData([{id:1}, {id:2}]);
    expect(callback.mock.lastCall[0]).toEqual(ccs);
    expect(callback.mock.lastCall[1]()).toEqual(Object.create(null));
  });


  test('should have all arguments optional', () => {
    $httpBackend.expect('GET', '/CreditCard').respond([{id:1}]);

    var log = '';
    var ccs = CreditCard.query(function() { log += 'cb;'; });

    $httpBackend.flush();
    expect(ccs).toEqualData([{id:1}]);
    expect(log).toEqual('cb;');
  });


  test('should delete resource and call callback', () => {
    $httpBackend.expect('DELETE', '/CreditCard/123').respond({});
    CreditCard.remove({id:123}, callback);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(callback.mock.lastCall[0]).toEqualData({});
    expect(callback.mock.lastCall[1]()).toEqual(Object.create(null));

    callback.mockClear();
    $httpBackend.expect('DELETE', '/CreditCard/333').respond(204, null);
    CreditCard.remove({id:333}, callback);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(callback.mock.lastCall[0]).toEqualData({});
    expect(callback.mock.lastCall[1]()).toEqual(Object.create(null));
  });


  test('should post charge verb', () => {
    $httpBackend.expect('POST', '/CreditCard/123!charge?amount=10', '{"auth":"abc"}').respond({success: 'ok'});
    CreditCard.charge({id:123, amount:10}, {auth:'abc'}, callback);
  });


  test('should post charge verb on instance', () => {
    $httpBackend.expect('POST', '/CreditCard/123!charge?amount=10',
        '{"id":{"key":123},"name":"misko"}').respond({success: 'ok'});

    var card = new CreditCard({id:{key:123}, name:'misko'});
    card.$charge({amount:10}, callback);
  });


  test('should patch a resource', () => {
    $httpBackend.expectPATCH('/CreditCard/123', '{"name":"igor"}').
                     respond({id: 123, name: 'rama'});

    var card = CreditCard.patch({id: 123}, {name: 'igor'}, callback);

    expect(card).toEqualData({name: 'igor'});
    expect(callback).not.toHaveBeenCalled();
    $httpBackend.flush();
    expect(callback).toHaveBeenCalled();
    expect(card).toEqualData({id: 123, name: 'rama'});
  });


  test('should create on save', () => {
    $httpBackend.expect('POST', '/CreditCard', '{"name":"misko"}').respond({id: 123}, {header1: 'a'});

    var cc = new CreditCard();
    expect(cc.$get).toBeDefined();
    expect(cc.$query).toBeDefined();
    expect(cc.$remove).toBeDefined();
    expect(cc.$save).toBeDefined();

    cc.name = 'misko';
    cc.$save(callback);
    expect(cc).toEqualData({name:'misko'});

    $httpBackend.flush();
    expect(cc).toEqualData({id:123});
    expect(callback.mock.lastCall[0]).toEqual(cc);
    expect(callback.mock.lastCall[1]()).toEqual(angular.extend(Object.create(null), {header1: 'a'}));
  });


  test('should not mutate the resource object if response contains no body', () => {
    var data = {id:{key:123}, number:'9876'};
    $httpBackend.expect('GET', '/CreditCard/123').respond(data);

    var cc = CreditCard.get({id:123});
    $httpBackend.flush();
    expect(cc instanceof CreditCard).toBe(true);

    $httpBackend.expect('POST', '/CreditCard/123', angular.toJson(data)).respond('');
    var idBefore = cc.id;

    cc.$save();
    $httpBackend.flush();
    expect(idBefore).toEqual(cc.id);
  });


  test('should support dynamic default parameters (global)', () => {
    var currentGroup = 'students';
    var Person = $resource('/Person/:group/:id', { group() { return currentGroup; }});

    $httpBackend.expect('GET', '/Person/students/fedor').respond({id: 'fedor', email: 'f@f.com'});

    var fedor = Person.get({id: 'fedor'});
    $httpBackend.flush();

    expect(fedor).toEqualData({id: 'fedor', email: 'f@f.com'});
  });


  test('should pass resource object to dynamic default parameters', () => {
    var Person = $resource('/Person/:id', {
      id(data) {
        return data ? data.id : 'fedor';
      }
    });

    $httpBackend.expect('GET', '/Person/fedor').respond(
        {id: 'fedor', email: 'f@f.com', count: 1});

    var fedor = Person.get();
    $httpBackend.flush();

    expect(fedor).toEqualData({id: 'fedor', email: 'f@f.com', count: 1});

    $httpBackend.expect('POST', '/Person/fedor2').respond(
        {id: 'fedor2', email: 'f2@f.com', count: 2});

    fedor.id = 'fedor2';
    fedor.$save();
    $httpBackend.flush();

    expect(fedor).toEqualData({id: 'fedor2', email: 'f2@f.com', count: 2});
  });


  test('should support dynamic default parameters (action specific)', () => {
    var currentGroup = 'students';

    var Person = $resource('/Person/:group/:id', {}, {
      fetch: {
        method: 'GET',
        params: {group() { return currentGroup; }}
      }
    });

    $httpBackend.expect('GET', '/Person/students/fedor').respond({id: 'fedor', email: 'f@f.com'});

    var fedor = Person.fetch({id: 'fedor'});
    $httpBackend.flush();

    expect(fedor).toEqualData({id: 'fedor', email: 'f@f.com'});
  });


  test('should exercise full stack', () => {
    var Person = $resource('/Person/:id');

    $httpBackend.expect('GET', '/Person/123').respond('\n{\n"name":\n"misko"\n}\n');
    var person = Person.get({id:123});
    $httpBackend.flush();
    expect(person.name).toEqual('misko');
  });

  test('should return a resource instance when calling a class method with a resource instance', () => {
    $httpBackend.expect('GET', '/Person/123').respond('{"name":"misko"}');
    var Person = $resource('/Person/:id');
    var person = Person.get({id:123});
    $httpBackend.flush();
    $httpBackend.expect('POST', '/Person').respond('{"name":"misko2"}');

    var person2 = Person.save(person);
    $httpBackend.flush();

    expect(person2).toEqual(expect.any(Person));
  });

  test('should not include $promise and $resolved when resource is toJson\'ed', () => {
    $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
    var cc = CreditCard.get({id: 123});
    $httpBackend.flush();

    cc.$myProp = 'still here';

    expect(cc.$promise).toBeDefined();
    expect(cc.$resolved).toBe(true);

    var json = JSON.parse(angular.toJson(cc));
    expect(json.$promise).not.toBeDefined();
    expect(json.$resolved).not.toBeDefined();
    expect(json).toEqual({id: 123, number: '9876', $myProp: 'still here'});
  });

  test('should not include $cancelRequest when resource is toJson\'ed', () => {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        cancellable: true
      }
    });

    var card = CreditCard.get();
    var json = card.toJSON();

    expect(card.$cancelRequest).toBeDefined();
    expect(json.$cancelRequest).toBeUndefined();
  });


  describe('promise api', () => {

    var $rootScope;


    beforeEach(angular.mock.inject(function(_$rootScope_) {
      $rootScope = _$rootScope_;
    }));


    describe('single resource', () => {

      test('should add $promise to the result object', () => {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        cc.$promise.then(callback);
        expect(callback).not.toHaveBeenCalled();

        $httpBackend.flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.lastCall[0]).toBe(cc);
      });


      test('should keep $promise around after resolution', () => {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        cc.$promise.then(callback);
        $httpBackend.flush();

        callback.mockClear();

        cc.$promise.then(callback);
        $rootScope.$apply(); //flush async queue

        expect(callback).toHaveBeenCalledTimes(1);
      });


      test('should keep the original promise after instance action', () => {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        $httpBackend.expect('POST', '/CreditCard/123').respond({id: 123, number: '9876'});

        var cc = CreditCard.get({id: 123});
        var originalPromise = cc.$promise;

        cc.number = '666';
        cc.$save({id: 123});

        expect(cc.$promise).toBe(originalPromise);
      });


      test('should allow promise chaining', () => {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        cc.$promise.then(function(value) { return 'new value'; }).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledOnceWith('new value');
      });


      test('should allow $promise error callback registration', () => {
        $httpBackend.expect('GET', '/CreditCard/123').respond(404, 'resource not found');
        var cc = CreditCard.get({id: 123});

        cc.$promise.then(null, callback);
        $httpBackend.flush();

        var response = callback.mock.lastCall[0];

        expect(response.data).toEqual('resource not found');
        expect(response.status).toEqual(404);
      });


      test('should add $resolved boolean field to the result object', () => {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        expect(cc.$resolved).toBe(false);

        cc.$promise.then(callback);
        expect(cc.$resolved).toBe(false);

        $httpBackend.flush();

        expect(cc.$resolved).toBe(true);
      });


      test('should set $resolved field to true when an error occurs', () => {
        $httpBackend.expect('GET', '/CreditCard/123').respond(404, 'resource not found');
        var cc = CreditCard.get({id: 123});

        cc.$promise.then(null, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(cc.$resolved).toBe(true);
      });


      test('should keep $resolved true in all subsequent interactions', () => {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});
        $httpBackend.flush();
        expect(cc.$resolved).toBe(true);

        $httpBackend.expect('POST', '/CreditCard/123').respond();
        cc.$save({id: 123});
        expect(cc.$resolved).toBe(true);
        $httpBackend.flush();
        expect(cc.$resolved).toBe(true);
      });


      test('should return promise from action method calls', () => {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = new CreditCard({name: 'Mojo'});

        expect(cc).toEqualData({name: 'Mojo'});

        cc.$get({id:123}).then(callback);

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(cc).toEqualData({id: 123, number: '9876'});
        callback.mockClear();

        $httpBackend.expect('POST', '/CreditCard').respond({id: 1, number: '9'});

        cc.$save().then(callback);

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(cc).toEqualData({id: 1, number: '9'});
      });


      test('should allow parsing a value from headers', () => {
        // https://github.com/angular/angular.js/pull/2607#issuecomment-17759933
        $httpBackend.expect('POST', '/CreditCard').respond(201, '', {'Location': '/new-id'});

        var parseUrlFromHeaders = function(response) {
          var resource = response.resource;
          resource.url = response.headers('Location');
          return resource;
        };

        var CreditCard = $resource('/CreditCard', {}, {
          save: {
            method: 'post',
            interceptor: {response: parseUrlFromHeaders}
          }
        });

        var cc = new CreditCard({name: 'Me'});

        cc.$save();
        $httpBackend.flush();

        expect(cc.url).toBe('/new-id');
      });


      test('should pass the same transformed value to success callbacks and to promises', () => {
        $httpBackend.expect('GET', '/CreditCard').respond(200, { value: 'original' });

        var transformResponse = function(response) {
          return { value: 'transformed' };
        };

        var CreditCard = $resource('/CreditCard', {}, {
          call: {
            method: 'get',
            interceptor: { response: transformResponse }
          }
        });

        var successValue;
        var promiseValue;

        var cc = new CreditCard({ name: 'Me' });

        var req = cc.$call({}, function(result) {
          successValue = result;
        });
        req.then(function(result) {
          promiseValue = result;
        });

        $httpBackend.flush();
        expect(successValue).toEqual({ value: 'transformed' });
        expect(promiseValue).toEqual({ value: 'transformed' });
        expect(successValue).toBe(promiseValue);
      });
    });


    describe('resource collection', () => {

      test('should add $promise to the result object', () => {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'});

        ccs.$promise.then(callback);
        expect(callback).not.toHaveBeenCalled();

        $httpBackend.flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.lastCall[0]).toBe(ccs);
      });


      test('should keep $promise around after resolution', () => {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'});

        ccs.$promise.then(callback);
        $httpBackend.flush();

        callback.mockClear();

        ccs.$promise.then(callback);
        $rootScope.$apply(); //flush async queue

        expect(callback).toHaveBeenCalledTimes(1);
      });


      test('should allow promise chaining', () => {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'});

        ccs.$promise.then(function(value) { return 'new value'; }).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledOnceWith('new value');
      });


      test('should allow $promise error callback registration', () => {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond(404, 'resource not found');
        var ccs = CreditCard.query({key: 'value'});

        ccs.$promise.then(null, callback);
        $httpBackend.flush();

        var response = callback.mock.lastCall[0];

        expect(response.data).toEqual('resource not found');
        expect(response.status).toEqual(404);
      });


      test('should add $resolved boolean field to the result object', () => {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'}, callback);

        expect(ccs.$resolved).toBe(false);

        ccs.$promise.then(callback);
        expect(ccs.$resolved).toBe(false);

        $httpBackend.flush();

        expect(ccs.$resolved).toBe(true);
      });


      test('should set $resolved field to true when an error occurs', () => {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond(404, 'resource not found');
        var ccs = CreditCard.query({key: 'value'});

        ccs.$promise.then(null, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(ccs.$resolved).toBe(true);
      });
    });


    describe('requestInterceptor', () => {
      var rejectReason = {'lol':'cat'};
      var successSpy;
      var failureSpy;

       beforeEach(() => {
        successSpy = jest.fn().mockName('successSpy');
        failureSpy = jest.fn().mockName('failureSpy');
      });

      test('should allow per action request interceptor that gets full configuration', () => {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request(httpConfig) {
                callback(httpConfig);
                return httpConfig;
              }
            }
          }
        });

        $httpBackend.expect('GET', '/CreditCard').respond([{id: 1}]);

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);

        $httpBackend.flush();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(successSpy).toHaveBeenCalledTimes(1);
        expect(failureSpy).not.toHaveBeenCalled();

        expect(callback).toHaveBeenCalledWith({
          'method': 'get',
          'url': '/CreditCard'
        });
      });

      test('should call $http with the value returned from requestInterceptor', () => {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request(httpConfig) {
                httpConfig.url = '/DebitCard';
                return httpConfig;
              }
            }
          }
        });

        $httpBackend.expect('GET', '/DebitCard').respond([{id: 1}]);

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);

        $httpBackend.flush();
        expect(successSpy).toHaveBeenCalledOnceWith(expect.arrayContaining([
          expect.objectContaining({id: 1})
        ]));
        expect(failureSpy).not.toHaveBeenCalled();
      });

      test('should abort the operation if the requestInterceptor rejects the operation', () => {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request() {
                return $q.reject(rejectReason);
              }
            }
          }
        });

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);

        // Make sure all promises resolve.
        $rootScope.$apply();

        // Ensure the resource promise was rejected
        expect(resource.$resolved).toBeTruthy();
        expect(successSpy).not.toHaveBeenCalled();
        expect(failureSpy).toHaveBeenCalledOnceWith(rejectReason);

        // Ensure that no requests were made.
        $httpBackend.verifyNoOutstandingRequest();
      });

      test('should call requestErrorInterceptor if requestInterceptor rejects the operation', () => {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request() {
                return $q.reject(rejectReason);
              },
              requestError(rejection) {
                callback(rejection);
                return $q.reject(rejection);
              }
            }
          }
        });

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);
        $rootScope.$digest();

        expect(callback).toHaveBeenCalledOnceWith(rejectReason);
        expect(successSpy).not.toHaveBeenCalled();
        expect(failureSpy).toHaveBeenCalledOnceWith(rejectReason);

        // Ensure that no requests were made.
        $httpBackend.verifyNoOutstandingRequest();
      });

      test('should abort the operation if a requestErrorInterceptor rejects the operation', () => {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request() {
                return $q.reject(rejectReason);
              },
              requestError(rejection) {
                return $q.reject(rejection);
              }
            }
          }
        });

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);
        $rootScope.$apply();

        expect(resource.$resolved).toBeTruthy();
        expect(successSpy).not.toHaveBeenCalled();
        expect(failureSpy).toHaveBeenCalledOnceWith(rejectReason);

        // Ensure that no requests were made.
        $httpBackend.verifyNoOutstandingRequest();
      });

      test('should continue the operation if a requestErrorInterceptor rescues it', () => {
        var CreditCard = $resource('/CreditCard', {}, {
          query: {
            method: 'get',
            isArray: true,
            interceptor: {
              request(httpConfig) {
                return $q.reject(httpConfig);
              },
              requestError(httpConfig) {
                return $q.resolve(httpConfig);
              }
            }
          }
        });

        $httpBackend.expect('GET', '/CreditCard').respond([{id: 1}]);

        var resource = CreditCard.query();
        resource.$promise.then(successSpy, failureSpy);
        $httpBackend.flush();

        expect(resource.$resolved).toBeTruthy();
        expect(successSpy).toHaveBeenCalledOnceWith(expect.arrayContaining([
          expect.objectContaining({id: 1})
        ]));
        expect(failureSpy).not.toHaveBeenCalled();

        $httpBackend.verifyNoOutstandingRequest();
      });
    });


    describe('responseInterceptor', () => {
      test('should allow per action response interceptor that gets full response', () => {
        var response;

        $httpBackend.expect('GET', '/CreditCard').respond(201, {id: 1}, {foo: 'bar'}, 'Ack');
        CreditCard = $resource('/CreditCard', {}, {
          get: {
            method: 'get',
            interceptor: {response(resp) { response = resp; }}
          }
        });

        var cc = CreditCard.get();
        $httpBackend.flush();

        expect(response.resource).toBe(cc);
        expect(response.config).toBeDefined();
        expect(response.status).toBe(201);
        expect(response.statusText).toBe('Ack');
        expect(response.headers()).toEqual({foo: 'bar'});
      });


      test('should allow per action responseError interceptor that gets full response', () => {
        var response;

        $httpBackend.expect('GET', '/CreditCard').respond(404, {ignored: 'stuff'}, {foo: 'bar'}, 'Ack');
        CreditCard = $resource('/CreditCard', {}, {
          get: {
            method: 'get',
            interceptor: {responseError(resp) { response = resp; }}
          }
        });

        var cc = CreditCard.get();
        $httpBackend.flush();

        expect(response.resource).toBe(cc);
        expect(response.config).toBeDefined();
        expect(response.status).toBe(404);
        expect(response.statusText).toBe('Ack');
        expect(response.headers()).toEqual({foo: 'bar'});
      });


      test('should fulfill the promise with the value returned by the response interceptor',
        function() {
          $httpBackend.whenGET('/CreditCard').respond(200);
          CreditCard = $resource('/CreditCard', {}, {
            test1: {
              method: 'get',
              interceptor: {response() { return 'foo'; }}
            },
            test2: {
              method: 'get',
              interceptor: {response() { return $q.resolve('bar'); }}
            },
            test3: {
              method: 'get',
              interceptor: {response() { return $q.reject('baz'); }}
            }
          });

          CreditCard.test1().$promise.then(callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('foo');

          callback.mockClear();

          CreditCard.test2().$promise.then(callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('bar');

          callback.mockClear();

          CreditCard.test3().$promise.then(null, callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('baz');
        }
      );


      test('should fulfill the promise with the value returned by the responseError interceptor',
        function() {
          $httpBackend.whenGET('/CreditCard').respond(404);
          CreditCard = $resource('/CreditCard', {}, {
            test1: {
              method: 'get',
              interceptor: {responseError() { return 'foo'; }}
            },
            test2: {
              method: 'get',
              interceptor: {responseError() { return $q.resolve('bar'); }}
            },
            test3: {
              method: 'get',
              interceptor: {responseError() { return $q.reject('baz'); }}
            }
          });

          CreditCard.test1().$promise.then(callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('foo');

          callback.mockClear();

          CreditCard.test2().$promise.then(callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('bar');

          callback.mockClear();

          CreditCard.test3().$promise.then(null, callback);
          $httpBackend.flush();
          expect(callback).toHaveBeenCalledOnceWith('baz');
        }
      );


      test('should call the success callback when response interceptor succeeds', () => {
        $httpBackend.whenGET('/CreditCard').respond(200);
        CreditCard = $resource('/CreditCard', {}, {
          test1: {
            method: 'get',
            interceptor: {response() { return 'foo'; }}
          },
          test2: {
            method: 'get',
            interceptor: {response() { return $q.resolve('bar'); }}
          }
        });

        CreditCard.test1(callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('foo', expect.any(Function), 200, '');

        callback.mockClear();

        CreditCard.test2(callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('bar', expect.any(Function), 200, '');
      });


      test('should call the error callback when response interceptor fails', () => {
        $httpBackend.whenGET('/CreditCard').respond(200);
        CreditCard = $resource('/CreditCard', {}, {
          test1: {
            method: 'get',
            interceptor: {response() { throw 'foo'; }}
          },
          test2: {
            method: 'get',
            interceptor: {response() { return $q.reject('bar'); }}
          }
        });

        CreditCard.test1(angular.noop, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('foo');

        callback.mockClear();

        CreditCard.test2(angular.noop, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('bar');
      });


      test('should call the success callback when responseError interceptor succeeds', () => {
        $httpBackend.whenGET('/CreditCard').respond(404);
        CreditCard = $resource('/CreditCard', {}, {
          test1: {
            method: 'get',
            interceptor: {responseError() { return 'foo'; }}
          },
          test2: {
            method: 'get',
            interceptor: {responseError() { return $q.resolve('bar'); }}
          }
        });

        CreditCard.test1(callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('foo', expect.any(Function), 404, '');

        callback.mockClear();

        CreditCard.test2(callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('bar', expect.any(Function), 404, '');
      });


      test('should call the error callback when responseError interceptor fails', () => {
        $httpBackend.whenGET('/CreditCard').respond(404);
        CreditCard = $resource('/CreditCard', {}, {
          test1: {
            method: 'get',
            interceptor: {responseError() { throw 'foo'; }}
          },
          test2: {
            method: 'get',
            interceptor: {responseError() { return $q.reject('bar'); }}
          }
        });

        CreditCard.test1(angular.noop, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('foo');

        callback.mockClear();

        CreditCard.test2(angular.noop, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnceWith('bar');
      });
    });
  });


  describe('success mode', () => {
    test('should call the success callback (as 1st argument) on 2xx responses', () => {
      var instance;
      var headers;
      var status;
      var statusText;
      var successCb = jest.fn().mockName('successCb').mockImplementation(function(d, h, s, t) {
        expect(d).toBe(instance);
        expect(h()).toEqual(expect.objectContaining(headers));
        expect(s).toBe(status);
        expect(t).toBe(statusText);
      });

      instance = CreditCard.get(successCb);
      headers = {foo: 'bar'};
      status = 200;
      statusText = 'OK';
      $httpBackend.expect('GET', '/CreditCard').respond(status, {}, headers, statusText);
      $httpBackend.flush();

      expect(successCb).toHaveBeenCalledTimes(1);

      instance = CreditCard.get(successCb);
      headers = {baz: 'qux'};
      status = 299;
      statusText = 'KO';
      $httpBackend.expect('GET', '/CreditCard').respond(status, {}, headers, statusText);
      $httpBackend.flush();

      expect(successCb).toHaveBeenCalledTimes(2);
    });


    test('should call the success callback (as 2nd argument) on 2xx responses', () => {
      var instance;
      var headers;
      var status;
      var statusText;
      var successCb = jest.fn().mockName('successCb').mockImplementation(function(d, h, s, t) {
        expect(d).toBe(instance);
        expect(h()).toEqual(expect.objectContaining(headers));
        expect(s).toBe(status);
        expect(t).toBe(statusText);
      });

      instance = CreditCard.get({id: 123}, successCb);
      headers = {foo: 'bar'};
      status = 200;
      statusText = 'OK';
      $httpBackend.expect('GET', '/CreditCard/123').respond(status, {}, headers, statusText);
      $httpBackend.flush();

      expect(successCb).toHaveBeenCalledTimes(1);

      instance = CreditCard.get({id: 456}, successCb);
      headers = {baz: 'qux'};
      status = 299;
      statusText = 'KO';
      $httpBackend.expect('GET', '/CreditCard/456').respond(status, {}, headers, statusText);
      $httpBackend.flush();

      expect(successCb).toHaveBeenCalledTimes(2);
    });
  });

  describe('failure mode', () => {
    var ERROR_CODE = 500;
    var ERROR_RESPONSE = 'Server Error';
    var errorCB;

     beforeEach(() => {
      errorCB = jest.fn().mockName('error').mockImplementation(function(response) {
        expect(response.data).toBe(ERROR_RESPONSE);
        expect(response.status).toBe(ERROR_CODE);
      });
    });


    test('should call the error callback if provided on non 2xx response', () => {
      $httpBackend.expect('GET', '/CreditCard/123').respond(ERROR_CODE, ERROR_RESPONSE);

      CreditCard.get({id:123}, callback, errorCB);
      $httpBackend.flush();
      expect(errorCB).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
    });


    test('should call the error callback if provided on non 2xx response (without data)', () => {
      $httpBackend.expect('GET', '/CreditCard').respond(ERROR_CODE, ERROR_RESPONSE);

      CreditCard.get(callback, errorCB);
      $httpBackend.flush();
      expect(errorCB).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  test('should transform request/response', () => {
    var Person = $resource('/Person/:id', {}, {
      save: {
        method: 'POST',
        params: {id: '@id'},
        transformRequest(data) {
          return angular.toJson({ __id: data.id });
        },
        transformResponse(data) {
          return { id: data.__id };
        }
      }
    });

    $httpBackend.expect('POST', '/Person/123', { __id: 123 }).respond({ __id: 456 });
    var person = new Person({id:123});
    person.$save();
    $httpBackend.flush();
    expect(person.id).toEqual(456);
  });

  describe('suffix parameter', () => {

    describe('query', () => {
      test('should add a suffix', () => {
        $httpBackend.expect('GET', '/users.json').respond([{id: 1, name: 'user1'}]);
        var UserService = $resource('/users/:id.json', {id: '@id'});
        var user = UserService.query();
        $httpBackend.flush();
        expect(user).toEqualData([{id: 1, name: 'user1'}]);
      });

      test('should not require it if not provided', () => {
        $httpBackend.expect('GET', '/users.json').respond([{id: 1, name: 'user1'}]);
        var UserService = $resource('/users.json');
        var user = UserService.query();
        $httpBackend.flush();
        expect(user).toEqualData([{id: 1, name: 'user1'}]);
      });

      test('should work when query parameters are supplied', () => {
        $httpBackend.expect('GET', '/users.json?red=blue').respond([{id: 1, name: 'user1'}]);
        var UserService = $resource('/users/:user_id.json', {user_id: '@id'});
        var user = UserService.query({red: 'blue'});
        $httpBackend.flush();
        expect(user).toEqualData([{id: 1, name: 'user1'}]);
      });

      test('should work when query parameters are supplied and the format is a resource parameter', () => {
        $httpBackend.expect('GET', '/users.json?red=blue').respond([{id: 1, name: 'user1'}]);
        var UserService = $resource('/users/:user_id.:format', {user_id: '@id', format: 'json'});
        var user = UserService.query({red: 'blue'});
        $httpBackend.flush();
        expect(user).toEqualData([{id: 1, name: 'user1'}]);
      });

      test('should work with the action is overridden', () => {
        $httpBackend.expect('GET', '/users.json').respond([{id: 1, name: 'user1'}]);
        var UserService = $resource('/users/:user_id', {user_id: '@id'}, {
          query: {
            method: 'GET',
            url: '/users/:user_id.json',
            isArray: true
          }
        });
        var user = UserService.query();
        $httpBackend.flush();
        expect(user).toEqualData([{id: 1, name: 'user1'}]);
      });

      test('should not convert string literals in array into Resource objects', () => {
        $httpBackend.expect('GET', '/names.json').respond(['mary', 'jane']);
        var strings = $resource('/names.json').query();
        $httpBackend.flush();
        expect(strings).toEqualData(['mary', 'jane']);
      });

      test('should not convert number literals in array into Resource objects', () => {
        $httpBackend.expect('GET', '/names.json').respond([213, 456]);
        var numbers = $resource('/names.json').query();
        $httpBackend.flush();
        expect(numbers).toEqualData([213, 456]);
      });

      test('should not convert boolean literals in array into Resource objects', () => {
        $httpBackend.expect('GET', '/names.json').respond([true, false]);
        var bools = $resource('/names.json').query();
        $httpBackend.flush();
        expect(bools).toEqualData([true, false]);
      });
    });

    describe('get', () => {
      test('should add them to the id', () => {
        $httpBackend.expect('GET', '/users/1.json').respond({id: 1, name: 'user1'});
        var UserService = $resource('/users/:user_id.json', {user_id: '@id'});
        var user = UserService.get({user_id: 1});
        $httpBackend.flush();
        expect(user).toEqualData({id: 1, name: 'user1'});
      });

      test('should work when an id and query parameters are supplied', () => {
        $httpBackend.expect('GET', '/users/1.json?red=blue').respond({id: 1, name: 'user1'});
        var UserService = $resource('/users/:user_id.json', {user_id: '@id'});
        var user = UserService.get({user_id: 1, red: 'blue'});
        $httpBackend.flush();
        expect(user).toEqualData({id: 1, name: 'user1'});
      });

      test('should work when the format is a parameter', () => {
        $httpBackend.expect('GET', '/users/1.json?red=blue').respond({id: 1, name: 'user1'});
        var UserService = $resource('/users/:user_id.:format', {user_id: '@id', format: 'json'});
        var user = UserService.get({user_id: 1, red: 'blue'});
        $httpBackend.flush();
        expect(user).toEqualData({id: 1, name: 'user1'});
      });

      test('should work with the action is overridden', () => {
        $httpBackend.expect('GET', '/users/1.json').respond({id: 1, name: 'user1'});
        var UserService = $resource('/users/:user_id', {user_id: '@id'}, {
          get: {
            method: 'GET',
            url: '/users/:user_id.json'
          }
        });
        var user = UserService.get({user_id: 1});
        $httpBackend.flush();
        expect(user).toEqualData({id: 1, name: 'user1'});
      });
    });

    describe('save', () => {
      test('should append the suffix', () => {
        $httpBackend.expect('POST', '/users.json', '{"name":"user1"}').respond({id: 123, name: 'user1'});
        var UserService = $resource('/users/:user_id.json', {user_id: '@id'});
        var user = UserService.save({name: 'user1'}, callback);
        expect(user).toEqualData({name: 'user1'});
        expect(callback).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(user).toEqualData({id: 123, name: 'user1'});
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.lastCall[0]).toEqual(user);
        expect(callback.mock.lastCall[1]()).toEqual(Object.create(null));
      });

      test('should append when an id is supplied', () => {
        $httpBackend.expect('POST', '/users/123.json', '{"id":123,"name":"newName"}').respond({id: 123, name: 'newName'});
        var UserService = $resource('/users/:user_id.json', {user_id: '@id'});
        var user = UserService.save({id: 123, name: 'newName'}, callback);
        expect(callback).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(user).toEqualData({id: 123, name: 'newName'});
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.lastCall[0]).toEqual(user);
        expect(callback.mock.lastCall[1]()).toEqual(Object.create(null));
      });

      test('should append when an id is supplied and the format is a parameter', () => {
        $httpBackend.expect('POST', '/users/123.json', '{"id":123,"name":"newName"}').respond({id: 123, name: 'newName'});
        var UserService = $resource('/users/:user_id.:format', {user_id: '@id', format: 'json'});
        var user = UserService.save({id: 123, name: 'newName'}, callback);
        expect(callback).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(user).toEqualData({id: 123, name: 'newName'});
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.lastCall[0]).toEqual(user);
        expect(callback.mock.lastCall[1]()).toEqual(Object.create(null));
      });
    });

    describe('escaping /. with /\\.', () => {
      test('should work with query()', () => {
        $httpBackend.expect('GET', '/users/.json').respond();
        $resource('/users/\\.json').query();
      });
      test('should work with get()', () => {
        $httpBackend.expect('GET', '/users/.json').respond();
        $resource('/users/\\.json').get();
      });
      test('should work with save()', () => {
        $httpBackend.expect('POST', '/users/.json').respond();
        $resource('/users/\\.json').save({});
      });
      test('should work with save() if dynamic params', () => {
        $httpBackend.expect('POST', '/users/.json').respond();
        $resource('/users/:json', {json: '\\.json'}).save({});
      });
      test('should work with query() if dynamic params', () => {
        $httpBackend.expect('GET', '/users/.json').respond();
        $resource('/users/:json', {json: '\\.json'}).query();
      });
      test('should work with get() if dynamic params', () => {
        $httpBackend.expect('GET', '/users/.json').respond();
        $resource('/users/:json', {json: '\\.json'}).get();
      });
    });
  });

  describe('action-level url override', () => {

    test('should support overriding url template with static url', () => {
      $httpBackend.expect('GET', '/override-url?type=Customer&typeId=123').respond({id: 'abc'});
      var TypeItem = $resource('/:type/:typeId', {type: 'Order'}, {
        get: {
          method: 'GET',
          params: {type: 'Customer'},
          url: '/override-url'
        }
      });
      var item = TypeItem.get({typeId: 123});
      $httpBackend.flush();
      expect(item).toEqualData({id: 'abc'});
    });


    test('should support overriding url template with a new template ending in param', () => {
      //    url parameter in action, parameter ending the string
      $httpBackend.expect('GET', '/Customer/123').respond({id: 'abc'});
      var TypeItem = $resource('/foo/:type', {type: 'Order'}, {
        get: {
          method: 'GET',
          params: {type: 'Customer'},
          url: '/:type/:typeId'
        }
      });
      var item = TypeItem.get({typeId: 123});
      $httpBackend.flush();
      expect(item).toEqualData({id: 'abc'});

      //    url parameter in action, parameter not ending the string
      $httpBackend.expect('GET', '/Customer/123/pay').respond({id: 'abc'});
      TypeItem = $resource('/foo/:type', {type: 'Order'}, {
        get: {
          method: 'GET',
          params: {type: 'Customer'},
          url: '/:type/:typeId/pay'
        }
      });
      item = TypeItem.get({typeId: 123});
      $httpBackend.flush();
      expect(item).toEqualData({id: 'abc'});
    });


    test('should support overriding url template with a new template ending in string', () => {
      $httpBackend.expect('GET', '/Customer/123/pay').respond({id: 'abc'});
      var TypeItem = $resource('/foo/:type', {type: 'Order'}, {
        get: {
          method: 'GET',
          params: {type: 'Customer'},
          url: '/:type/:typeId/pay'
        }
      });
      var item = TypeItem.get({typeId: 123});
      $httpBackend.flush();
      expect(item).toEqualData({id: 'abc'});
    });
  });
});
 describe('extra params', () => {
  var $http;
  var $httpBackend;
  var $resource;
  var $rootScope;

  beforeEach(angular.mock.module('ngResource'));

  beforeEach(angular.mock.module(function($provide) {
    $provide.decorator('$http', function($delegate) {
      return jest.fn().mockName('$http').mockImplementation($delegate);
    });
  }));

  beforeEach(angular.mock.inject(function(_$http_, _$httpBackend_, _$resource_, _$rootScope_) {
    $http = _$http_;
    $httpBackend = _$httpBackend_;
    $resource = _$resource_;
    $rootScope = _$rootScope_;
  }));

   afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
  });


  test('should pass extra params to `$http` as `config.params`', () => {
    $httpBackend.expectGET('/bar?baz=qux').respond('{}');

    var R = $resource('/:foo');
    R.get({foo: 'bar', baz: 'qux'});

    $rootScope.$digest();
    expect($http).toHaveBeenCalledWith(expect.objectContaining({params: {baz: 'qux'}}));
  });

  test('should pass extra params even if `Object.prototype` has properties with the same name',
    function() {
      $httpBackend.expectGET('/foo?toString=bar').respond('{}');

      var R = $resource('/foo');
      R.get({toString: 'bar'});
    }
  );
});
 describe('errors', () => {
  var $httpBackend;
  var $resource;

  beforeEach(angular.mock.module(function($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  beforeEach(angular.mock.module('ngResource'));

  beforeEach(angular.mock.inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $resource = $injector.get('$resource');
  }));


  test('should fail if action expects an object but response is an array', () => {
    var successSpy = jest.fn().mockName('successSpy');
    var failureSpy = jest.fn().mockName('failureSpy');

    $httpBackend.expect('GET', '/Customer/123').respond({id: 'abc'});

    $resource('/Customer/123').query()
      .$promise.then(successSpy, function(e) { failureSpy(e.message); });
    $httpBackend.flush();

    expect(successSpy).not.toHaveBeenCalled();
    expect(failureSpy).toHaveBeenCalled();
    expect(failureSpy.mock.lastCall[0]).toEqualMinErr('$resource', 'badcfg',
        'Error in resource configuration for action `query`. ' +
        'Expected response to contain an array but got an object (Request: GET /Customer/123)');
  });

  test('should fail if action expects an array but response is an object', () => {
    var successSpy = jest.fn().mockName('successSpy');
    var failureSpy = jest.fn().mockName('failureSpy');

    $httpBackend.expect('GET', '/Customer/123').respond([1,2,3]);

    $resource('/Customer/123').get()
      .$promise.then(successSpy, function(e) { failureSpy(e.message); });
    $httpBackend.flush();

    expect(successSpy).not.toHaveBeenCalled();
    expect(failureSpy).toHaveBeenCalled();
    expect(failureSpy.mock.lastCall[0]).toEqualMinErr('$resource', 'badcfg',
        'Error in resource configuration for action `get`. ' +
        'Expected response to contain an object but got an array (Request: GET /Customer/123)');
  });
});
 describe('handling rejections', () => {
  var $exceptionHandler;
  var $httpBackend;
  var $resource;

  beforeEach(angular.mock.module('ngResource'));
  beforeEach(angular.mock.module(function($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  beforeEach(angular.mock.inject(function(_$exceptionHandler_, _$httpBackend_, _$resource_) {
    $exceptionHandler = _$exceptionHandler_;
    $httpBackend = _$httpBackend_;
    $resource = _$resource_;

    $httpBackend.whenGET('/CreditCard').respond(404);
  }));


  test('should reject the promise even when there is an error callback', () => {
    var errorCb1 = jest.fn().mockName('errorCb1');
    var errorCb2 = jest.fn().mockName('errorCb2');
    var CreditCard = $resource('/CreditCard');

    CreditCard.get(angular.noop, errorCb1).$promise.catch(errorCb2);
    $httpBackend.flush();

    expect(errorCb1).toHaveBeenCalledTimes(1);
    expect(errorCb2).toHaveBeenCalledTimes(1);
  });


  test('should report a PUR when no error callback or responseError interceptor is provided',
    function() {
      var CreditCard = $resource('/CreditCard');

      CreditCard.get();
      $httpBackend.flush();

      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0]).toMatch(/^Possibly unhandled rejection/);
    }
  );


  test('should not report a PUR when an error callback or responseError interceptor is provided',
    function() {
      var CreditCard = $resource('/CreditCard', {}, {
        test1: {
          method: 'GET'
        },
        test2: {
          method: 'GET',
          interceptor: {responseError() { return {}; }}
        }
      });

      // With error callback
      CreditCard.test1(angular.noop, angular.noop);
      $httpBackend.flush();

      expect($exceptionHandler.errors.length).toBe(0);

      // With responseError interceptor
      CreditCard.test2();
      $httpBackend.flush();

      expect($exceptionHandler.errors.length).toBe(0);

      // With error callback and responseError interceptor
      CreditCard.test2(angular.noop, angular.noop);
      $httpBackend.flush();

      expect($exceptionHandler.errors.length).toBe(0);
    }
  );


  test('should report a PUR when the responseError interceptor returns a rejected promise',
    angular.mock.inject(function($q) {
      var CreditCard = $resource('/CreditCard', {}, {
        test: {
          method: 'GET',
          interceptor: {responseError() { return $q.reject({}); }}
        }
      });

      CreditCard.test();
      $httpBackend.flush();

      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0]).toMatch(/^Possibly unhandled rejection/);
    })
  );


  test('should not swallow exceptions in success callback when error callback is provided',
    function() {
      $httpBackend.expectGET('/CreditCard/123').respond(null);
      var CreditCard = $resource('/CreditCard/:id');
      CreditCard.get({id: 123},
          function(res) { throw new Error('should be caught'); },
          function() {});

      $httpBackend.flush();
      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0].toString()).toMatch(/^Error: should be caught/);
    }
  );


  test('should not swallow exceptions in success callback when error callback is not provided',
    function() {
      $httpBackend.expectGET('/CreditCard/123').respond(null);
      var CreditCard = $resource('/CreditCard/:id');
      CreditCard.get({id: 123},
          function(res) { throw new Error('should be caught'); });

      $httpBackend.flush();
      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0].toString()).toMatch(/^Error: should be caught/);
    }
  );


  test('should not swallow exceptions in success callback when error callback is provided and has responseError interceptor',
    function() {
      $httpBackend.expectGET('/CreditCard/123').respond(null);
      var CreditCard = $resource('/CreditCard/:id', null, {
        get: {
          method: 'GET',
          interceptor: {responseError() {}}
        }
      });

      CreditCard.get({id: 123},
          function(res) { throw new Error('should be caught'); },
          function() {});

      $httpBackend.flush();
      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0].toString()).toMatch(/^Error: should be caught/);
    }
  );


  test('should not swallow exceptions in success callback when error callback is not provided and has responseError interceptor',
    function() {
      $httpBackend.expectGET('/CreditCard/123').respond(null);
      var CreditCard = $resource('/CreditCard/:id', null, {
        get: {
          method: 'GET',
          interceptor: {responseError() {}}
        }
      });

      CreditCard.get({id: 123},
          function(res) { throw new Error('should be caught'); });

      $httpBackend.flush();
      expect($exceptionHandler.errors.length).toBe(1);
      expect($exceptionHandler.errors[0].toString()).toMatch(/^Error: should be caught/);
    }
  );


  test('should not propagate exceptions in success callback to the returned promise', () => {
    var successCallbackSpy = jest.fn().mockName('successCallback').mockImplementation(() => { throw new Error('error'); });
    var promiseResolveSpy = jest.fn().mockName('promiseResolve');
    var promiseRejectSpy = jest.fn().mockName('promiseReject');

    $httpBackend.expectGET('/CreditCard/123').respond(null);
    var CreditCard = $resource('/CreditCard/:id');
    CreditCard.get({id: 123}, successCallbackSpy).
      $promise.then(promiseResolveSpy, promiseRejectSpy);

    $httpBackend.flush();
    expect(successCallbackSpy).toHaveBeenCalled();
    expect(promiseResolveSpy).toHaveBeenCalledWith(expect.any(CreditCard));
    expect(promiseRejectSpy).not.toHaveBeenCalled();
  });


  test('should not be able to recover from inside the error callback', () => {
    var errorCallbackSpy = jest.fn().mockName('errorCallback').mockReturnValue({id: 123});
    var promiseResolveSpy = jest.fn().mockName('promiseResolve');
    var promiseRejectSpy = jest.fn().mockName('promiseReject');

    $httpBackend.expectGET('/CreditCard/123').respond(404);
    var CreditCard = $resource('/CreditCard/:id');
    CreditCard.get({id: 123}, angular.noop, errorCallbackSpy).
      $promise.then(promiseResolveSpy, promiseRejectSpy);

    $httpBackend.flush();
    expect(errorCallbackSpy).toHaveBeenCalled();
    expect(promiseResolveSpy).not.toHaveBeenCalled();
    expect(promiseRejectSpy).toHaveBeenCalledWith(expect.objectContaining({status: 404}));
  });


  describe('requestInterceptor', () => {
    var rejectReason = {'lol':'cat'};
    var $q;
    var $rootScope;
    var successSpy;
    var failureSpy;
    var callback;

    beforeEach(angular.mock.inject(function(_$q_, _$rootScope_) {
      $q = _$q_;
      $rootScope = _$rootScope_;

      successSpy = jest.fn().mockName('successSpy');
      failureSpy = jest.fn().mockName('failureSpy');
      callback = jest.fn();
    }));

    test('should call requestErrorInterceptor if requestInterceptor throws an error', () => {
      var CreditCard = $resource('/CreditCard', {}, {
        query: {
          method: 'get',
          isArray: true,
          interceptor: {
            request() {
              throw rejectReason;
            },
            requestError(rejection) {
              callback(rejection);
              return $q.reject(rejection);
            }
          }
        }
      });

      var resource = CreditCard.query();
      resource.$promise.then(successSpy, failureSpy);
      $rootScope.$apply();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(rejectReason);
      expect(successSpy).not.toHaveBeenCalled();
      expect(failureSpy).toHaveBeenCalledTimes(1);
      expect(failureSpy).toHaveBeenCalledWith(rejectReason);

      // Ensure that no requests were made.
      $httpBackend.verifyNoOutstandingRequest();
    });

    test('should abort the operation if a requestErrorInterceptor throws an exception', () => {
      var CreditCard = $resource('/CreditCard', {}, {
        query: {
          method: 'get',
          isArray: true,
          interceptor: {
            request() {
              return $q.reject();
            },
            requestError() {
              throw rejectReason;
            }
          }
        }
      });

      var resource = CreditCard.query();
      resource.$promise.then(successSpy, failureSpy);
      $rootScope.$apply();

      expect(resource.$resolved).toBeTruthy();
      expect(successSpy).not.toHaveBeenCalled();
      expect(failureSpy).toHaveBeenCalledTimes(1);
      expect(failureSpy).toHaveBeenCalledWith(rejectReason);

      // Ensure that no requests were made.
      $httpBackend.verifyNoOutstandingRequest();
    });
  });
});
 describe('cancelling requests', () => {
  var httpSpy;
  var $httpBackend;
  var $resource;
  var $timeout;

  beforeEach(angular.mock.module('ngResource', function($provide) {
    $provide.decorator('$http', function($delegate) {
      httpSpy = jest.fn().mockName('$http').mockImplementation($delegate);
      return httpSpy;
    });
  }));

  beforeEach(angular.mock.inject(function(_$httpBackend_, _$resource_, _$timeout_) {
    $httpBackend = _$httpBackend_;
    $resource = _$resource_;
    $timeout = _$timeout_;
  }));

  test('should accept numeric timeouts in actions and pass them to $http', () => {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        timeout: 10000
      }
    });

    CreditCard.get();
    $httpBackend.flush();

    expect(httpSpy).toHaveBeenCalledTimes(1);
    expect(httpSpy.mock.calls[0][0].timeout).toBe(10000);
  });

  test('should delete non-numeric timeouts in actions and log a $debug message',
    angular.mock.inject(function($log, $q) {
      jest.spyOn($log, 'debug').mockImplementation(() => {});
      $httpBackend.whenGET('/CreditCard').respond({});

      var CreditCard = $resource('/CreditCard', {}, {
        get: {
          method: 'GET',
          timeout: $q.defer().promise
        }
      });

      CreditCard.get();
      $httpBackend.flush();

      expect(httpSpy).toHaveBeenCalledTimes(1);
      expect(httpSpy.mock.calls[0][0].timeout).toBeUndefined();
      expect($log.debug).toHaveBeenCalledOnceWith('ngResource:\n' +
          '  Only numeric values are allowed as `timeout`.\n' +
          '  Promises are not supported in $resource, because the same value would ' +
          'be used for multiple requests. If you are looking for a way to cancel ' +
          'requests, you should use the `cancellable` option.');
    })
  );

  test('should use `cancellable` value if passed a non-numeric `timeout` in an action',
    angular.mock.inject(function($log, $q, $rootScope) {
      jest.spyOn($log, 'debug').mockImplementation(() => {});
      $httpBackend.whenGET('/CreditCard').respond({});

      var CreditCard = $resource('/CreditCard', {}, {
        get: {
          method: 'GET',
          timeout: $q.defer().promise,
          cancellable: true
        }
      });

      var creditCard = CreditCard.get();
      $rootScope.$digest();
      expect(creditCard.$cancelRequest).toBeDefined();
      expect(httpSpy.mock.calls[0][0].timeout).toEqual(expect.any($q));
      expect(httpSpy.mock.calls[0][0].timeout.then).toBeDefined();

      expect($log.debug).toHaveBeenCalledOnceWith('ngResource:\n' +
          '  Only numeric values are allowed as `timeout`.\n' +
          '  Promises are not supported in $resource, because the same value would ' +
          'be used for multiple requests. If you are looking for a way to cancel ' +
          'requests, you should use the `cancellable` option.');
    })
  );

  test('should not create a `$cancelRequest` method for instance calls', () => {
    $httpBackend.whenPOST('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      save1: {
        method: 'POST',
        cancellable: false
      },
      save2: {
        method: 'POST',
        cancellable: true
      }
    });

    var creditCard = new CreditCard();

    var promise1 = creditCard.$save1();
    expect(promise1.$cancelRequest).toBeUndefined();
    expect(creditCard.$cancelRequest).toBeUndefined();

    var promise2 = creditCard.$save2();
    expect(promise2.$cancelRequest).toBeUndefined();
    expect(creditCard.$cancelRequest).toBeUndefined();

    $httpBackend.flush();
    expect(promise1.$cancelRequest).toBeUndefined();
    expect(promise2.$cancelRequest).toBeUndefined();
    expect(creditCard.$cancelRequest).toBeUndefined();
  });

  test('should not create a `$cancelRequest` method for non-cancellable calls', () => {
    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        cancellable: false
      }
    });

    var creditCard = CreditCard.get();

    expect(creditCard.$cancelRequest).toBeUndefined();
  });

  test('should also take into account `options.cancellable`', () => {
    var options = {cancellable: true};
    var CreditCard = $resource('/CreditCard', {}, {
      get1: {method: 'GET', cancellable: false},
      get2: {method: 'GET', cancellable: true},
      get3: {method: 'GET'}
    }, options);

    var creditCard1 = CreditCard.get1();
    var creditCard2 = CreditCard.get2();
    var creditCard3 = CreditCard.get3();

    expect(creditCard1.$cancelRequest).toBeUndefined();
    expect(creditCard2.$cancelRequest).toBeDefined();
    expect(creditCard3.$cancelRequest).toBeDefined();

    options = {cancellable: false};
    CreditCard = $resource('/CreditCard', {}, {
      get1: {method: 'GET', cancellable: false},
      get2: {method: 'GET', cancellable: true},
      get3: {method: 'GET'}
    }, options);

    creditCard1 = CreditCard.get1();
    creditCard2 = CreditCard.get2();
    creditCard3 = CreditCard.get3();

    expect(creditCard1.$cancelRequest).toBeUndefined();
    expect(creditCard2.$cancelRequest).toBeDefined();
    expect(creditCard3.$cancelRequest).toBeUndefined();
  });

  test('should accept numeric timeouts in cancellable actions and cancel the request when timeout occurs', () => {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        timeout: 10000,
        cancellable: true
      }
    });

    var ccs = CreditCard.get();
    ccs.$promise.catch(angular.noop);
    $timeout.flush();
    expect($httpBackend.flush).toThrow(new Error('No pending request to flush !'));

    CreditCard.get();
    expect($httpBackend.flush).not.toThrow();

  });

  test('should cancel the request (if cancellable), when calling `$cancelRequest`', () => {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        cancellable: true
      }
    });

    var ccs = CreditCard.get();
    ccs.$cancelRequest();
    expect($httpBackend.flush).toThrow(new Error('No pending request to flush !'));

    CreditCard.get();
    expect($httpBackend.flush).not.toThrow();
  });

  test('should cancel the request, when calling `$cancelRequest` in cancellable actions with timeout defined', () => {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        timeout: 10000,
        cancellable: true
      }
    });

    var ccs = CreditCard.get();
    ccs.$cancelRequest();
    expect($httpBackend.flush).toThrow(new Error('No pending request to flush !'));

    CreditCard.get();
    expect($httpBackend.flush).not.toThrow();
  });

  test('should reset `$cancelRequest` after the response arrives', () => {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        cancellable: true
      }
    });

    var creditCard = CreditCard.get();

    expect(creditCard.$cancelRequest).not.toBe(angular.noop);

    $httpBackend.flush();

    expect(creditCard.$cancelRequest).toBe(angular.noop);
  });

  test('should not break when calling old `$cancelRequest` after the response arrives', () => {
    $httpBackend.whenGET('/CreditCard').respond({});

    var CreditCard = $resource('/CreditCard', {}, {
      get: {
        method: 'GET',
        cancellable: true
      }
    });

    var creditCard = CreditCard.get();
    var cancelRequest = creditCard.$cancelRequest;

    $httpBackend.flush();

    expect(cancelRequest).not.toBe(angular.noop);
    expect(cancelRequest).not.toThrow();
  });
});
 describe('configuring `cancellable` on the provider', () => {
  var $resource;

  beforeEach(angular.mock.module('ngResource', function($resourceProvider) {
    $resourceProvider.defaults.cancellable = true;
  }));

  beforeEach(angular.mock.inject(function(_$resource_) {
    $resource = _$resource_;
  }));

  test('should also take into account `$resourceProvider.defaults.cancellable`', () => {
    var CreditCard = $resource('/CreditCard', {}, {
      get1: {method: 'GET', cancellable: false},
      get2: {method: 'GET', cancellable: true},
      get3: {method: 'GET'}
    });

    var creditCard1 = CreditCard.get1();
    var creditCard2 = CreditCard.get2();
    var creditCard3 = CreditCard.get3();

    expect(creditCard1.$cancelRequest).toBeUndefined();
    expect(creditCard2.$cancelRequest).toBeDefined();
    expect(creditCard3.$cancelRequest).toBeDefined();
  });
});
});
