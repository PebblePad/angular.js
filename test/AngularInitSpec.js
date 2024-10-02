describe('angularInit', function() {
  const angularInit = ngInternals.angularInit;
  var document;

  beforeEach(function() {
    document = window.document;
  });

  afterEach(function() {
    dealoc(element);
  });

  var bootstrapSpy;
  var element;

  beforeEach(function() {
    element = {
      hasAttribute(name) {
        return !!element[name];
      },

      querySelector(arg) {
        return element.querySelector[arg] || null;
      },

      getAttribute(name) {
        return element[name];
      }
    };
    bootstrapSpy = jest.fn();
    window.name = "";
  });
  it('should do nothing when not found', function() {
    angularInit(element, bootstrapSpy);
    expect(bootstrapSpy).not.toHaveBeenCalled();
  });


  it('should look for ngApp directive as attr', function() {
    var appElement = angular.element('<div ng-app="ABC"></div>')[0];
    element.querySelector['[ng-app]'] = appElement;
    angularInit(element, bootstrapSpy);
    expect(bootstrapSpy).toHaveBeenCalledOnceWith(appElement, ['ABC'], expect.any(Object));
  });


  it('should look for ngApp directive using querySelectorAll', function() {
    var appElement = angular.element('<div x-ng-app="ABC"></div>')[0];
    element.querySelector['[x-ng-app]'] = appElement;
    angularInit(element, bootstrapSpy);
    expect(bootstrapSpy).toHaveBeenCalledOnceWith(appElement, ['ABC'], expect.any(Object));
  });


  it('should bootstrap anonymously', function() {
    var appElement = angular.element('<div x-ng-app></div>')[0];
    element.querySelector['[x-ng-app]'] = appElement;
    angularInit(element, bootstrapSpy);
    expect(bootstrapSpy).toHaveBeenCalledOnceWith(appElement, [], expect.any(Object));
  });


  it('should bootstrap if the annotation is on the root element', function() {
    var appElement = angular.element('<div ng-app=""></div>')[0];
    angularInit(appElement, bootstrapSpy);
    expect(bootstrapSpy).toHaveBeenCalledOnceWith(appElement, [], expect.any(Object));
  });


  it('should complain if app module cannot be found', function() {
    var appElement = angular.element('<div ng-app="doesntexist"></div>')[0];

    expect(function() {
      angularInit(appElement, angular.bootstrap);
    }).toThrowMinErr('$injector', 'modulerr',
      new RegExp('Failed to instantiate module doesntexist due to:\\n' +
        '.*\\[\\$injector:nomod] Module \'doesntexist\' is not available! You either ' +
        'misspelled the module name or forgot to load it\\.')
    );
  });


  it('should complain if an element has already been bootstrapped', function() {
    var element = angular.element('<div>bootstrap me!</div>');
    angular.bootstrap(element);

    expect(function() {
      angular.bootstrap(element);
    }).toThrowMinErr('ng', 'btstrpd',
      /App Already Bootstrapped with this Element '&lt;div class="?ng-scope"?( ng\d+="?\d+"?)?&gt;'/i);

    dealoc(element);
  });


  it('should complain if manually bootstrapping a document whose <html> element has already been bootstrapped', function() {
    angular.bootstrap(document.getElementsByTagName('html')[0]);
    expect(function() {
      angular.bootstrap(document);
    }).toThrowMinErr('ng', 'btstrpd', /App Already Bootstrapped with this Element 'document'/i);

    dealoc(document);
  });


  it('should bootstrap in strict mode when ng-strict-di attribute is specified', function() {
    bootstrapSpy = jest.spyOn(angular, 'bootstrap');
    var appElement = angular.element('<div ng-app="" ng-strict-di></div>');
    angularInit(angular.element('<div></div>').append(appElement[0])[0], bootstrapSpy);
    expect(bootstrapSpy).toHaveBeenCalledTimes(1);
    expect(bootstrapSpy.mock.calls[bootstrapSpy.mock.calls.length - 1][2].strictDi).toBe(true);

    var injector = appElement.injector();
    function testFactory($rootScope) {}
    expect(function() {
      injector.instantiate(testFactory);
    }).toThrowMinErr('$injector', 'strictdi');

    dealoc(appElement);
  });

  describe('auto bootstrap restrictions', function() {
    const allowAutoBootstrap= ngInternals.allowAutoBootstrap;

    function createFakeDoc(attrs, protocol, currentScript) {

      protocol = protocol || 'http:';
      var origin = protocol + '//something';

      if (currentScript === undefined) {
        currentScript = document.createElement('script');
        Object.keys(attrs).forEach(function(key) { currentScript.setAttribute(key, attrs[key]); });
      }

      // Fake a minimal document object (the actual document.currentScript is readonly).
      return {
        currentScript: currentScript,
        location: {protocol: protocol, origin: origin},
        createElement: document.createElement.bind(document)
      };
    }

    it('should bootstrap from a script with no source (e.g. src, href or xlink:href attributes)', function() {
      expect(allowAutoBootstrap(createFakeDoc({src: null}))).toBe(true);
      expect(allowAutoBootstrap(createFakeDoc({href: null}))).toBe(true);
      expect(allowAutoBootstrap(createFakeDoc({'xlink:href': null}))).toBe(true);
    });

    it('should not bootstrap from a script with an empty source (e.g. `src=""`)', function() {
      expect(allowAutoBootstrap(createFakeDoc({src: ''}))).toBe(false);
      expect(allowAutoBootstrap(createFakeDoc({href: ''}))).toBe(false);
      expect(allowAutoBootstrap(createFakeDoc({'xlink:href': ''}))).toBe(false);
    });


    it('should not bootstrap from an extension into a non-extension document', function() {

      expect(allowAutoBootstrap(createFakeDoc({src: 'resource://something'}))).toBe(false);
      expect(allowAutoBootstrap(createFakeDoc({src: 'file://whatever'}))).toBe(true);
    });

    it('should not bootstrap from an extension into a non-extension document, via SVG script', function() {

      // SVG script tags don't use the `src` attribute to load their source.
      // Instead they use `href` or the deprecated `xlink:href` attributes.

      expect(allowAutoBootstrap(createFakeDoc({href: 'resource://something'}))).toBe(false);
      expect(allowAutoBootstrap(createFakeDoc({'xlink:href': 'resource://something'}))).toBe(false);

      expect(allowAutoBootstrap(createFakeDoc({src: 'http://something', href: 'resource://something'}))).toBe(false);
      expect(allowAutoBootstrap(createFakeDoc({href: 'http://something', 'xlink:href': 'resource://something'}))).toBe(false);
      expect(allowAutoBootstrap(createFakeDoc({src: 'resource://something', href: 'http://something', 'xlink:href': 'http://something'}))).toBe(false);
    });

    it('should not bootstrap if the currentScript property has been clobbered', function() {

      var img = document.createElement('img');
      img.setAttribute('src', '');
      expect(allowAutoBootstrap(createFakeDoc({}, 'http:', img))).toBe(false);
    });
  });
});
