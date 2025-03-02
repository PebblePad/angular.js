'use strict';

describe('jqLite', function() {
  var scope;
  var element;
  var a;
  var b;
  var c;
  var document;
  var jqLite = angular.element;

  expect.extend({
    toJqEqual(_actual_, expected) {
      var msg = 'Unequal length';

      var value = _actual_ && expected && _actual_.length === expected.length;
      for (var i = 0; value && i < expected.length; i++) {
        var actual = angular.element(_actual_[i])[0];
        var expect = angular.element(expected[i])[0];
        value = value && angular.equals(expect, actual);
        msg = 'Not equal at index: ' + i
          + ' - Expected: ' + expect
          + ' - Actual: ' + actual;
      }

      return {
        message: () => msg,
        pass: value
      };
    }
  });

  beforeEach(angular.mock.module(provideLog));

  beforeEach(function() {
    a = angular.element('<div>A</div>')[0];
    b = angular.element('<div>B</div>')[0];
    c = angular.element('<div>C</div>')[0];
  });


  beforeEach(angular.mock.inject(function($rootScope) {
    document = window.document;
    scope = $rootScope;
  }));


  afterEach(function() {
    dealoc(element);
    dealoc(a);
    dealoc(b);
    dealoc(c);

    element = null;
    a = null;
    b = null;
    c = null;
  });

  describe('construction', function() {
    it('should allow construction with text node', function() {
      var text = a.firstChild;
      var selected = angular.element(text);
      expect(selected.length).toEqual(1);
      expect(selected[0]).toEqual(text);
    });


    it('should allow construction with html', function() {
      var nodes = angular.element('<div>1</div><span>2</span>');
      expect(nodes[0].parentNode).toBeDefined();
      expect(nodes[0].parentNode.nodeType).toBe(11); /** Document Fragment **/
      expect(nodes[0].parentNode).toBe(nodes[1].parentNode);
      expect(nodes.length).toEqual(2);
      expect(nodes[0].innerHTML).toEqual('1');
      expect(nodes[1].innerHTML).toEqual('2');
    });


    it('should allow construction of html with leading whitespace', function() {
      var nodes = angular.element('  \n\r   \r\n<div>1</div><span>2</span>');
      expect(nodes[0].parentNode).toBeDefined();
      expect(nodes[0].parentNode.nodeType).toBe(11); /** Document Fragment **/
      expect(nodes[0].parentNode).toBe(nodes[1].parentNode);
      expect(nodes.length).toBe(2);
      expect(nodes[0].innerHTML).toBe('1');
      expect(nodes[1].innerHTML).toBe('2');
    });


    // This is not working correctly in jQuery prior to v2.2.
    // See https://github.com/jquery/jquery/issues/1987 for details.
    it('should properly handle dash-delimited node names', function() {
      var nodeNames = 'thead tbody tfoot colgroup caption tr th td div kung'.split(' ');
      var nodeNamesTested = 0;

      angular.forEach(nodeNames, function(nodeName) {
        var customNodeName = nodeName + '-foo';
        var nodes = angular.element('<' + customNodeName + '>Hello, world !</' + customNodeName + '>');

        expect(nodes.length).toBe(1);
        expect(ngInternals.nodeName_(nodes)).toBe(customNodeName);
        expect(nodes.html()).toBe('Hello, world !');

        nodeNamesTested++;
      });

      expect(nodeNamesTested).toBe(10);
    });


    it('should allow creation of comment tags', function() {
      var nodes = angular.element('<!-- foo -->');
      expect(nodes.length).toBe(1);
      expect(nodes[0].nodeType).toBe(8);
    });


    it('should allow creation of script tags', function() {
      var nodes = angular.element('<script></script>');
      expect(nodes.length).toBe(1);
      expect(nodes[0].tagName.toUpperCase()).toBe('SCRIPT');
    });


    it('should wrap document fragment', function() {
      var fragment = angular.element(document.createDocumentFragment());
      expect(fragment.length).toBe(1);
      expect(fragment[0].nodeType).toBe(11);
    });


    it('should allow construction of <option> elements', function() {
      var nodes = angular.element('<option>');
      expect(nodes.length).toBe(1);
      expect(nodes[0].nodeName.toLowerCase()).toBe('option');
    });

    it('should allow construction of multiple <option> elements', function() {
      var nodes = angular.element('<option></option><option></option>');
      expect(nodes.length).toBe(2);
      expect(nodes[0].nodeName.toLowerCase()).toBe('option');
      expect(nodes[1].nodeName.toLowerCase()).toBe('option');
    });


    // Special tests for the construction of elements which are restricted (in the HTML5 spec) to
    // being children of specific nodes.
    angular.forEach([
      'caption',
      'colgroup',
      'col',
      'optgroup',
      'opt',
      'tbody',
      'td',
      'tfoot',
      'th',
      'thead',
      'tr'
    ], function(name) {
      it('should allow construction of <$NAME$> elements'.replace('$NAME$', name), function() {
        var nodes = angular.element('<$NAME$>'.replace('$NAME$', name));
        expect(nodes.length).toBe(1);
        expect(nodes[0].nodeName.toLowerCase()).toBe(name);
      });
    });

    describe('security', function() {
      it('shouldn\'t crash at attempts to close the table wrapper', function() {
        expect(function() {
          // This test case attempts to close the tags which wrap input
          // based on matching done in wrapMap, escaping the wrapper & thus
          // triggering an error when descending.
          var el = angular.element('<td></td></tr></tbody></table><td></td>');
          expect(el.length).toBe(2);
          expect(el[0].nodeName.toLowerCase()).toBe('td');
          expect(el[1].nodeName.toLowerCase()).toBe('td');
        }).not.toThrow();
      });

      it('shouldn\'t unsanitize sanitized code', function(done) {
        var counter = 0;
        var assertCount = 13;
        var container = angular.element('<div></div>');

        function donePartial() {
          counter++;
          if (counter === assertCount) {
            container.remove();
            delete window.xss;
            done();
          }
        }

        angular.element(document.body).append(container);
        window.xss = jest.fn();

        // Thanks to Masato Kinugawa from Cure53 for providing the following test cases.
        // Note: below test cases need to invoke the xss function with consecutive
        // decimal parameters for the assertions to be correct.
        angular.forEach([
          '<img alt="<x" title="/><img src=url404 onerror=xss(0)>">',
          '<img alt="\n<x" title="/>\n<img src=url404 onerror=xss(1)>">',
          '<style><style/><img src=url404 onerror=xss(2)>',
          '<xmp><xmp/><img src=url404 onerror=xss(3)>',
          '<title><title /><img src=url404 onerror=xss(4)>',
          '<iframe><iframe/><img src=url404 onerror=xss(5)>',
          '<noframes><noframes/><img src=url404 onerror=xss(6)>',
          '<noscript><noscript/><img src=url404 onerror=xss(7)>',
          '<foo" alt="" title="/><img src=url404 onerror=xss(8)>">',
          '<img alt="<x" title="" src="/><img src=url404 onerror=xss(9)>">',
          '<noscript/><img src=url404 onerror=xss(10)>',
          '<noembed><noembed/><img src=url404 onerror=xss(11)>',

          '<option><style></option></select><img src=url404 onerror=xss(12)></style>'
        ], function(htmlString, index) {
          var element = angular.element('<div></div>');

          container.append(element);
          element.append(angular.element(htmlString));

          window.setTimeout(function() {
            expect(window.xss).not.toHaveBeenCalledWith(index);
            donePartial();
          }, 1000);
        });
      });

      it('should allow to restore legacy insecure behavior', function() {
        // eslint-disable-next-line new-cap
        angular.UNSAFE_restoreLegacyJqLiteXHTMLReplacement();

        var elem = angular.element('<div/><span/>');
        expect(elem.length).toBe(2);
        expect(elem[0].nodeName.toLowerCase()).toBe('div');
        expect(elem[1].nodeName.toLowerCase()).toBe('span');
      });
    });
  });

  describe('_data', function() {
    it('should provide access to the events present on the element', function() {
      element = angular.element('<i>foo</i>');
      expect(angular.element._data(element[0]).events).toBeUndefined();

      element.on('click', function() { });
      expect(angular.element._data(element[0]).events.click).toBeDefined();
    });
  });

  describe('inheritedData', function() {

    it('should retrieve data attached to the current element', function() {
      var element = angular.element('<i>foo</i>');
      element.data('myData', 'abc');
      expect(element.inheritedData('myData')).toBe('abc');
      dealoc(element);
    });


    it('should walk up the dom to find data', function() {
      var element = angular.element('<ul><li><p><b>deep deep</b><p></li></ul>');
      var deepChild = angular.element(element[0].getElementsByTagName('b')[0]);
      element.data('myData', 'abc');
      expect(deepChild.inheritedData('myData')).toBe('abc');
      dealoc(element);
    });


    it('should return undefined when no data was found', function() {
      var element = angular.element('<ul><li><p><b>deep deep</b><p></li></ul>');
      var deepChild = angular.element(element[0].getElementsByTagName('b')[0]);
      expect(deepChild.inheritedData('myData')).toBeFalsy();
      dealoc(element);
    });


    it('should work with the child html element instead if the current element is the document obj',
      function() {
        var item = {};
        var doc = angular.element(document);
        var html = doc.find('html');

        html.data('item', item);
        expect(doc.inheritedData('item')).toBe(item);
        expect(html.inheritedData('item')).toBe(item);
        dealoc(doc);
      }
    );

    it('should return null values', function() {
      var ul = angular.element('<ul><li><p><b>deep deep</b><p></li></ul>');
      var li = ul.find('li');
      var b = li.find('b');

      ul.data('foo', 'bar');
      li.data('foo', null);
      expect(b.inheritedData('foo')).toBe(null);
      expect(li.inheritedData('foo')).toBe(null);
      expect(ul.inheritedData('foo')).toBe('bar');

      dealoc(ul);
    });

    it('should pass through DocumentFragment boundaries via host', function() {
      var host = angular.element('<div></div>');
      var frag = document.createDocumentFragment();
      var $frag = angular.element(frag);
      frag.host = host[0];
      host.data('foo', 123);
      host.append($frag);
      expect($frag.inheritedData('foo')).toBe(123);

      dealoc(host);
      dealoc($frag);
    });
  });


  describe('scope', function() {
    it('should retrieve scope attached to the current element', function() {
      var element = angular.element('<i>foo</i>');
      element.data('$scope', scope);
      expect(element.scope()).toBe(scope);
      dealoc(element);
    });

    it('should retrieve isolate scope attached to the current element', function() {
      var element = angular.element('<i>foo</i>');
      element.data('$isolateScope', scope);
      expect(element.isolateScope()).toBe(scope);
      dealoc(element);
    });

    it('should retrieve scope attached to the html element if it\'s requested on the document',
      function() {
        var doc = angular.element(document);
        var html = doc.find('html');
        var scope = {};

        html.data('$scope', scope);

        expect(doc.scope()).toBe(scope);
        expect(html.scope()).toBe(scope);
        dealoc(doc);
      });

    it('should walk up the dom to find scope', function() {
      var element = angular.element('<ul><li><p><b>deep deep</b><p></li></ul>');
      var deepChild = angular.element(element[0].getElementsByTagName('b')[0]);
      element.data('$scope', scope);
      expect(deepChild.scope()).toBe(scope);
      dealoc(element);
    });


    it('should return undefined when no scope was found', function() {
      var element = angular.element('<ul><li><p><b>deep deep</b><p></li></ul>');
      var deepChild = angular.element(element[0].getElementsByTagName('b')[0]);
      expect(deepChild.scope()).toBeFalsy();
      dealoc(element);
    });
  });


  describe('isolateScope', function() {

    it('should retrieve isolate scope attached to the current element', function() {
      var element = angular.element('<i>foo</i>');
      element.data('$isolateScope', scope);
      expect(element.isolateScope()).toBe(scope);
      dealoc(element);
    });


    it('should not walk up the dom to find scope', function() {
      var element = angular.element('<ul><li><p><b>deep deep</b><p></li></ul>');
      var deepChild = angular.element(element[0].getElementsByTagName('b')[0]);
      element.data('$isolateScope', scope);
      expect(deepChild.isolateScope()).toBeUndefined();
      dealoc(element);
    });


    it('should return undefined when no scope was found', function() {
      var element = angular.element('<div></div>');
      expect(element.isolateScope()).toBeFalsy();
      dealoc(element);
    });
  });


  describe('injector', function() {
    it('should retrieve injector attached to the current element or its parent', function() {
      var template = angular.element('<div><span></span></div>');
      var span = template.children().eq(0);
      var injector = angular.bootstrap(template);


      expect(span.injector()).toBe(injector);
      dealoc(template);
    });


    it('should retrieve injector attached to the html element if it\'s requested on document',
      function() {
        var doc = angular.element(document);
        var html = doc.find('html');
        var injector = {};

        html.data('$injector', injector);

        expect(doc.injector()).toBe(injector);
        expect(html.injector()).toBe(injector);
        dealoc(doc);
      });


    it('should do nothing with a noncompiled template', function() {
      var template = angular.element('<div><span></span></div>');
      expect(template.injector()).toBeUndefined();
      dealoc(template);
    });
  });


  describe('controller', function() {
    it('should retrieve controller attached to the current element or its parent', function() {
      var div = angular.element('<div><span></span></div>');
      var span = div.find('span');

      div.data('$ngControllerController', 'ngController');
      span.data('$otherController', 'other');

      expect(span.controller()).toBe('ngController');
      expect(span.controller('ngController')).toBe('ngController');
      expect(span.controller('other')).toBe('other');

      expect(div.controller()).toBe('ngController');
      expect(div.controller('ngController')).toBe('ngController');
      expect(div.controller('other')).toBeUndefined();

      dealoc(div);
    });
  });


  describe('data', function() {
    it('should set and get and remove data', function() {
      var selected = angular.element([a, b, c]);

      expect(selected.data('prop')).toBeUndefined();
      expect(selected.data('prop', 'value')).toBe(selected);
      expect(selected.data('prop')).toBe('value');
      expect(angular.element(a).data('prop')).toBe('value');
      expect(angular.element(b).data('prop')).toBe('value');
      expect(angular.element(c).data('prop')).toBe('value');

      angular.element(a).data('prop', 'new value');
      expect(angular.element(a).data('prop')).toBe('new value');
      expect(selected.data('prop')).toBe('new value');
      expect(angular.element(b).data('prop')).toBe('value');
      expect(angular.element(c).data('prop')).toBe('value');

      expect(selected.removeData('prop')).toBe(selected);
      expect(angular.element(a).data('prop')).toBeUndefined();
      expect(angular.element(b).data('prop')).toBeUndefined();
      expect(angular.element(c).data('prop')).toBeUndefined();
    });

    it('should only remove the specified value when providing a property name to removeData', function() {
      var selected = angular.element(a);

      expect(selected.data('prop1')).toBeUndefined();

      selected.data('prop1', 'value');
      selected.data('prop2', 'doublevalue');

      expect(selected.data('prop1')).toBe('value');
      expect(selected.data('prop2')).toBe('doublevalue');

      selected.removeData('prop1');

      expect(selected.data('prop1')).toBeUndefined();
      expect(selected.data('prop2')).toBe('doublevalue');

      selected.removeData('prop2');
    });


    it('should add and remove data on SVGs', function() {
      var svg = angular.element('<svg><rect></rect></svg>');

      svg.data('svg-level', 1);
      expect(svg.data('svg-level')).toBe(1);

      svg.children().data('rect-level', 2);
      expect(svg.children().data('rect-level')).toBe(2);

      svg.remove();
    });


    it('should not add to the cache if the node is a comment or text node', function() {
      var nodes = angular.element('<!-- some comment --> and some text');
      expect(jqLiteCacheSize()).toEqual(0);
      nodes.data('someKey');
      expect(jqLiteCacheSize()).toEqual(0);
      nodes.data('someKey', 'someValue');
      expect(jqLiteCacheSize()).toEqual(0);
    });


    it('should provide the non-wrapped data calls', function() {
      var node = document.createElement('div');

      expect(jqLite.hasData(node)).toBe(false);
      expect(jqLite.data(node, 'foo')).toBeUndefined();
      expect(jqLite.hasData(node)).toBe(false);

      jqLite.data(node, 'foo', 'bar');

      expect(jqLite.hasData(node)).toBe(true);
      expect(jqLite.data(node, 'foo')).toBe('bar');
      expect(angular.element(node).data('foo')).toBe('bar');

      expect(jqLite.data(node)).toBe(angular.element(node).data());

      jqLite.removeData(node, 'foo');
      expect(jqLite.data(node, 'foo')).toBeUndefined();

      jqLite.data(node, 'bar', 'baz');
      jqLite.removeData(node);
      jqLite.removeData(node);
      expect(jqLite.data(node, 'bar')).toBeUndefined();

      angular.element(node).remove();
      expect(jqLite.hasData(node)).toBe(false);
    });

    it('should emit $destroy event if element removed via remove()', function() {
      var log = '';
      element = angular.element(a);
      element.on('$destroy', function() {log += 'destroy;';});
      element.remove();
      expect(log).toEqual('destroy;');
    });


    it('should emit $destroy event if an element is removed via html(\'\')', angular.mock.inject(function(log) {
      element = angular.element('<div><span>x</span></div>');
      element.find('span').on('$destroy', log.fn('destroyed'));

      element.html('');

      expect(element.html()).toBe('');
      expect(log).toEqual('destroyed');
    }));


    it('should emit $destroy event if an element is removed via empty()', angular.mock.inject(function(log) {
      element = angular.element('<div><span>x</span></div>');
      element.find('span').on('$destroy', log.fn('destroyed'));

      element.empty();

      expect(element.html()).toBe('');
      expect(log).toEqual('destroyed');
    }));


    it('should keep data if an element is removed via detach()', function() {
      var root = angular.element('<div><span>abc</span></div>');
      var span = root.find('span');
      var data = span.data();

      span.data('foo', 'bar');
      span.detach();

      expect(data).toEqual({foo: 'bar'});

      span.remove();
    });


    it('should retrieve all data if called without params', function() {
      var element = angular.element(a);
      expect(element.data()).toEqual({});

      element.data('foo', 'bar');
      expect(element.data()).toEqual({foo: 'bar'});

      element.data().baz = 'xxx';
      expect(element.data()).toEqual({foo: 'bar', baz: 'xxx'});
    });

    it('should create a new data object if called without args', function() {
      var element = angular.element(a);
      var data = element.data();

      expect(data).toEqual({});
      element.data('foo', 'bar');
      expect(data).toEqual({foo: 'bar'});
    });

    it('should create a new data object if called with a single object arg', function() {
      var element = angular.element(a);
      var newData = {foo: 'bar'};

      element.data(newData);
      expect(element.data()).toEqual({foo: 'bar'});
      expect(element.data()).not.toBe(newData); // create a copy
    });

    it('should merge existing data object with a new one if called with a single object arg',
      function() {
        var element = angular.element(a);
        element.data('existing', 'val');
        expect(element.data()).toEqual({existing: 'val'});

        var oldData = element.data();
        var newData = {meLike: 'turtles', 'youLike': 'carrots'};

        expect(element.data(newData)).toBe(element);
        expect(element.data()).toEqual({meLike: 'turtles', youLike: 'carrots', existing: 'val'});
        expect(element.data()).toBe(oldData); // merge into the old object
      });

    describe('data cleanup', function() {
      it('should remove data on element removal', function() {
        var div = angular.element('<div><span>text</span></div>');
        var span = div.find('span');

        span.data('name', 'AngularJS');
        span.remove();
        expect(span.data('name')).toBeUndefined();
      });

      it('should remove event listeners on element removal', function() {
        var div = angular.element('<div><span>text</span></div>');
        var span = div.find('span');
        var log = '';

        span.on('click', function() { log += 'click;'; });
        browserTrigger(span);
        expect(log).toEqual('click;');

        span.remove();

        browserTrigger(span);
        expect(log).toEqual('click;');
      });

      it('should work if the descendants of the element change while it\'s being removed', function() {
        var div = angular.element('<div><p><span>text</span></p></div>');
        div.find('p').on('$destroy', function() {
          div.find('span').remove();
        });
        expect(function() {
          div.remove();
        }).not.toThrow();
      });
    });

    describe('camelCasing keys', function() {
      it('should camelCase the key in a setter', function() {
        var element = angular.element(a);

        element.data('a-B-c-d-42--e', 'z-x');
        expect(element.data()).toEqual({'a-BCD-42-E': 'z-x'});
      });

      it('should camelCase the key in a getter', function() {
        var element = angular.element(a);

        element.data()['a-BCD-42-E'] = 'x-c';
        expect(element.data('a-B-c-d-42--e')).toBe('x-c');
      });

      it('should camelCase the key in a mass setter', function() {
        var element = angular.element(a);

        element.data({'a-B-c-d-42--e': 'c-v', 'r-t-v': 42});
        expect(element.data()).toEqual({'a-BCD-42-E': 'c-v', 'rTV': 42});
      });

      it('should ignore non-camelCase keys in the data in a getter', function() {
        var element = angular.element(a);

        element.data()['a-b'] = 'b-n';
        expect(element.data('a-b')).toBe(undefined);
      });
    });
  });


  describe('attr', function() {
    it('should read, write and remove attr', function() {
      var selector = angular.element([a, b]);

      expect(selector.attr('prop', 'value')).toEqual(selector);
      expect(angular.element(a).attr('prop')).toEqual('value');
      expect(angular.element(b).attr('prop')).toEqual('value');

      expect(selector.attr({'prop': 'new value'})).toEqual(selector);
      expect(angular.element(a).attr('prop')).toEqual('new value');
      expect(angular.element(b).attr('prop')).toEqual('new value');

      angular.element(b).attr({'prop': 'new value 2'});
      expect(angular.element(selector).attr('prop')).toEqual('new value');
      expect(angular.element(b).attr('prop')).toEqual('new value 2');

      selector.removeAttr('prop');
      expect(angular.element(a).attr('prop')).toBeFalsy();
      expect(angular.element(b).attr('prop')).toBeFalsy();
    });

    it('should read boolean attributes as strings', function() {
      var select = angular.element('<select>');
      expect(select.attr('multiple')).toBeUndefined();
      expect(angular.element('<select multiple>').attr('multiple')).toBe('multiple');
      expect(angular.element('<select multiple="">').attr('multiple')).toBe('multiple');
      expect(angular.element('<select multiple="x">').attr('multiple')).toBe('multiple');
    });

    it('should add/remove boolean attributes', function() {
      var select = angular.element('<select>');
      select.attr('multiple', false);
      expect(select.attr('multiple')).toBeUndefined();

      select.attr('multiple', true);
      expect(select.attr('multiple')).toBe('multiple');
    });

    it('should not take properties into account when getting respective boolean attributes', function() {
      // Use a div and not a select as the latter would itself reflect the multiple attribute
      // to a property.
      var div = angular.element('<div>');

      div[0].multiple = true;
      expect(div.attr('multiple')).toBe(undefined);

      div.attr('multiple', 'multiple');
      div[0].multiple = false;
      expect(div.attr('multiple')).toBe('multiple');
    });

    it('should not set properties when setting respective boolean attributes', function() {
      // Use a div and not a select as the latter would itself reflect the multiple attribute
      // to a property.
      var div = angular.element('<div>');

      // Check the initial state.
      expect(div[0].multiple).toBe(undefined);

      div.attr('multiple', 'multiple');
      expect(div[0].multiple).toBe(undefined);

      div.attr('multiple', '');
      expect(div[0].multiple).toBe(undefined);

      div.attr('multiple', false);
      expect(div[0].multiple).toBe(undefined);

      div.attr('multiple', null);
      expect(div[0].multiple).toBe(undefined);
    });

    it('should normalize the case of boolean attributes', function() {
      var input = angular.element('<input readonly>');
      expect(input.attr('readonly')).toBe('readonly');
      expect(input.attr('readOnly')).toBe('readonly');
      expect(input.attr('READONLY')).toBe('readonly');

      input.attr('readonly', false);
      expect(input[0].getAttribute('readonly')).toBe(null);

      input.attr('readOnly', 'READonly');
      expect(input.attr('readonly')).toBe('readonly');
      expect(input.attr('readOnly')).toBe('readonly');
    });

    it('should return undefined for non-existing attributes', function() {
      var elm = angular.element('<div class="any">a</div>');
      expect(elm.attr('non-existing')).toBeUndefined();
    });

    it('should return undefined for non-existing attributes on input', function() {
      var elm = angular.element('<input>');
      expect(elm.attr('readonly')).toBeUndefined();
      expect(elm.attr('readOnly')).toBeUndefined();
      expect(elm.attr('disabled')).toBeUndefined();
    });

    it('should do nothing when setting or getting on attribute nodes', function() {
      var attrNode = angular.element(document.createAttribute('myattr'));
      expect(attrNode).toBeDefined();
      expect(attrNode[0].nodeType).toEqual(2);
      expect(attrNode.attr('some-attribute','somevalue')).toEqual(attrNode);
      expect(attrNode.attr('some-attribute')).toBeUndefined();
    });

    it('should do nothing when setting or getting on text nodes', function() {
      var textNode = angular.element(document.createTextNode('some text'));
      expect(textNode).toBeDefined();
      expect(textNode[0].nodeType).toEqual(3);
      expect(textNode.attr('some-attribute','somevalue')).toEqual(textNode);
      expect(textNode.attr('some-attribute')).toBeUndefined();
    });

    it('should do nothing when setting or getting on comment nodes', function() {
      var comment = angular.element(document.createComment('some comment'));
      expect(comment).toBeDefined();
      expect(comment[0].nodeType).toEqual(8);
      expect(comment.attr('some-attribute','somevalue')).toEqual(comment);
      expect(comment.attr('some-attribute')).toBeUndefined();
    });

    it('should remove the attribute for a null value', function() {
      var elm = angular.element('<div attribute="value">a</div>');
      elm.attr('attribute', null);
      expect(elm[0].hasAttribute('attribute')).toBe(false);
    });

    it('should not remove the attribute for an empty string as a value', function() {
      var elm = angular.element('<div attribute="value">a</div>');
      elm.attr('attribute', '');
      expect(elm[0].getAttribute('attribute')).toBe('');
    });

    it('should remove the boolean attribute for a false value', function() {
      var elm = angular.element('<select multiple>');
      elm.attr('multiple', false);
      expect(elm[0].hasAttribute('multiple')).toBe(false);
    });

    it('should remove the boolean attribute for a null value', function() {
      var elm = angular.element('<select multiple>');
      elm.attr('multiple', null);
      expect(elm[0].hasAttribute('multiple')).toBe(false);
    });

    it('should not remove the boolean attribute for an empty string as a value', function() {
      var elm = angular.element('<select multiple>');
      elm.attr('multiple', '');
      expect(elm[0].getAttribute('multiple')).toBe('multiple');
    });

    it('should not fail on elements without the getAttribute method', function() {
      angular.forEach([window, document], function(node) {
        expect(function() {
          var elem = angular.element(node);
          elem.attr('foo');
          elem.attr('bar', 'baz');
          elem.attr('bar');
        }).not.toThrow();
      });
    });
  });


  describe('prop', function() {
    it('should read element property', function() {
      var elm = angular.element('<div class="foo">a</div>');
      expect(elm.prop('className')).toBe('foo');
    });

    it('should set element property to a value', function() {
      var elm = angular.element('<div class="foo">a</div>');
      elm.prop('className', 'bar');
      expect(elm[0].className).toBe('bar');
      expect(elm.prop('className')).toBe('bar');
    });

    it('should set boolean element property', function() {
      var elm = angular.element('<input type="checkbox">');
      expect(elm.prop('checked')).toBe(false);

      elm.prop('checked', true);
      expect(elm.prop('checked')).toBe(true);

      elm.prop('checked', '');
      expect(elm.prop('checked')).toBe(false);

      elm.prop('checked', 'lala');
      expect(elm.prop('checked')).toBe(true);

      elm.prop('checked', null);
      expect(elm.prop('checked')).toBe(false);
    });
  });


  describe('class', function() {

    it('should properly do  with SVG elements', function() {
      var svg = angular.element('<svg><rect></rect></svg>');
      var rect = svg.children();

      expect(rect.hasClass('foo-class')).toBe(false);
      rect.addClass('foo-class');
      expect(rect.hasClass('foo-class')).toBe(true);
      rect.removeClass('foo-class');
      expect(rect.hasClass('foo-class')).toBe(false);
    });


    it('should ignore comment elements', function() {
      var comment = angular.element(document.createComment('something'));

      comment.addClass('whatever');
      comment.hasClass('whatever');
      comment.toggleClass('whatever');
      comment.removeClass('whatever');
    });


    describe('hasClass', function() {
      it('should check class', function() {
        var selector = angular.element([a, b]);
        expect(selector.hasClass('abc')).toEqual(false);
      });


      it('should make sure that partial class is not checked as a subset', function() {
        var selector = angular.element([a, b]);
        selector.addClass('a');
        selector.addClass('b');
        selector.addClass('c');
        expect(selector.addClass('abc')).toEqual(selector);
        expect(selector.removeClass('abc')).toEqual(selector);
        expect(angular.element(a).hasClass('abc')).toEqual(false);
        expect(angular.element(b).hasClass('abc')).toEqual(false);
        expect(angular.element(a).hasClass('a')).toEqual(true);
        expect(angular.element(a).hasClass('b')).toEqual(true);
        expect(angular.element(a).hasClass('c')).toEqual(true);
      });
    });


    describe('addClass', function() {
      it('should allow adding of class', function() {
        var selector = angular.element([a, b]);
        expect(selector.addClass('abc')).toEqual(selector);
        expect(angular.element(a).hasClass('abc')).toEqual(true);
        expect(angular.element(b).hasClass('abc')).toEqual(true);
      });


      it('should ignore falsy values', function() {
        var jqA = angular.element(a);
        expect(jqA[0].className).toBe('');

        jqA.addClass(undefined);
        expect(jqA[0].className).toBe('');

        jqA.addClass(null);
        expect(jqA[0].className).toBe('');

        jqA.addClass(false);
        expect(jqA[0].className).toBe('');
      });


      it('should allow multiple classes to be added in a single string', function() {
        var jqA = angular.element(a);
        expect(a.className).toBe('');

        jqA.addClass('foo bar baz');
        expect(a.className).toBe('foo bar baz');
      });


      // JQLite specific implementation/performance tests
      it('should only get/set the attribute once when multiple classes added', function() {
        var fakeElement = {
          nodeType: 1,
          setAttribute: jest.fn(),
          getAttribute: jest.fn().mockReturnValue("")
        };
        var jqA = angular.element(fakeElement);

        jqA.addClass('foo bar baz');
        expect(fakeElement.getAttribute).toHaveBeenCalledOnceWith('class');
        expect(fakeElement.setAttribute).toHaveBeenCalledOnceWith('class', 'foo bar baz');
      });


      it('should not set the attribute when classes not changed', function() {
        var fakeElement = {
          nodeType: 1,
          setAttribute: jest.fn(),
          getAttribute: jest.fn().mockReturnValue('foo bar')
        };
        var jqA = angular.element(fakeElement);

        jqA.addClass('foo');
        expect(fakeElement.getAttribute).toHaveBeenCalledOnceWith('class');
        expect(fakeElement.setAttribute).not.toHaveBeenCalled();
      });


      it('should not add duplicate classes', function() {
        var jqA = angular.element(a);
        expect(a.className).toBe('');

        a.className = 'foo';
        jqA.addClass('foo');
        expect(a.className).toBe('foo');

        jqA.addClass('bar foo baz');
        expect(a.className).toBe('foo bar baz');
      });
    });


    describe('toggleClass', function() {
      it('should allow toggling of class', function() {
        var selector = angular.element([a, b]);
        expect(selector.toggleClass('abc')).toEqual(selector);
        expect(angular.element(a).hasClass('abc')).toEqual(true);
        expect(angular.element(b).hasClass('abc')).toEqual(true);

        expect(selector.toggleClass('abc')).toEqual(selector);
        expect(angular.element(a).hasClass('abc')).toEqual(false);
        expect(angular.element(b).hasClass('abc')).toEqual(false);

        expect(selector.toggleClass('abc', true)).toEqual(selector);
        expect(angular.element(a).hasClass('abc')).toEqual(true);
        expect(angular.element(b).hasClass('abc')).toEqual(true);

        expect(selector.toggleClass('abc', false)).toEqual(selector);
        expect(angular.element(a).hasClass('abc')).toEqual(false);
        expect(angular.element(b).hasClass('abc')).toEqual(false);

      });

      it('should allow toggling multiple classes without a condition', function() {
        var selector = angular.element([a, b]);
        expect(selector.toggleClass('abc cde')).toBe(selector);
        expect(angular.element(a).hasClass('abc')).toBe(true);
        expect(angular.element(a).hasClass('cde')).toBe(true);
        expect(angular.element(b).hasClass('abc')).toBe(true);
        expect(angular.element(b).hasClass('cde')).toBe(true);

        expect(selector.toggleClass('abc cde')).toBe(selector);
        expect(angular.element(a).hasClass('abc')).toBe(false);
        expect(angular.element(a).hasClass('cde')).toBe(false);
        expect(angular.element(b).hasClass('abc')).toBe(false);
        expect(angular.element(b).hasClass('cde')).toBe(false);

        expect(selector.toggleClass('abc')).toBe(selector);
        expect(selector.toggleClass('abc cde')).toBe(selector);
        expect(angular.element(a).hasClass('abc')).toBe(false);
        expect(angular.element(a).hasClass('cde')).toBe(true);
        expect(angular.element(b).hasClass('abc')).toBe(false);
        expect(angular.element(b).hasClass('cde')).toBe(true);

        expect(selector.toggleClass('abc cde')).toBe(selector);
        expect(angular.element(a).hasClass('abc')).toBe(true);
        expect(angular.element(a).hasClass('cde')).toBe(false);
        expect(angular.element(b).hasClass('abc')).toBe(true);
        expect(angular.element(b).hasClass('cde')).toBe(false);
      });

      it('should allow toggling multiple classes with a condition', function() {
        var selector = angular.element([a, b]);
        selector.addClass('abc');
        expect(selector.toggleClass('abc cde', true)).toBe(selector);
        expect(angular.element(a).hasClass('abc')).toBe(true);
        expect(angular.element(a).hasClass('cde')).toBe(true);
        expect(angular.element(b).hasClass('abc')).toBe(true);
        expect(angular.element(b).hasClass('cde')).toBe(true);

        selector.removeClass('abc');
        expect(selector.toggleClass('abc cde', false)).toBe(selector);
        expect(angular.element(a).hasClass('abc')).toBe(false);
        expect(angular.element(a).hasClass('cde')).toBe(false);
        expect(angular.element(b).hasClass('abc')).toBe(false);
        expect(angular.element(b).hasClass('cde')).toBe(false);
      });

      it('should not break for null / undefined selectors', function() {
        var selector = angular.element([a, b]);
        expect(selector.toggleClass(null)).toBe(selector);
        expect(selector.toggleClass(undefined)).toBe(selector);
      });
    });


    describe('removeClass', function() {
      it('should allow removal of class', function() {
        var selector = angular.element([a, b]);
        expect(selector.addClass('abc')).toEqual(selector);
        expect(selector.removeClass('abc')).toEqual(selector);
        expect(angular.element(a).hasClass('abc')).toEqual(false);
        expect(angular.element(b).hasClass('abc')).toEqual(false);
      });


      it('should correctly remove middle class', function() {
        var element = angular.element('<div class="foo bar baz"></div>');
        expect(element.hasClass('bar')).toBe(true);

        element.removeClass('bar');

        expect(element.hasClass('foo')).toBe(true);
        expect(element.hasClass('bar')).toBe(false);
        expect(element.hasClass('baz')).toBe(true);
      });


      it('should remove multiple classes specified as one string', function() {
        var jqA = angular.element(a);

        a.className = 'foo bar baz';
        jqA.removeClass('foo baz noexistent');
        expect(a.className).toBe('bar');
      });


      // JQLite specific implementation/performance tests
      it('should get/set the attribute once when removing multiple classes', function() {
        var fakeElement = {
          nodeType: 1,
          setAttribute: jest.fn(),
          getAttribute: jest.fn().mockReturnValue('foo bar baz')
        };
        var jqA = angular.element(fakeElement);

        jqA.removeClass('foo baz noexistent');
        expect(fakeElement.getAttribute).toHaveBeenCalledOnceWith('class');
        expect(fakeElement.setAttribute).toHaveBeenCalledOnceWith('class', 'bar');
      });


      it('should not set the attribute when classes not changed', function() {
        var fakeElement = {
          nodeType: 1,
          setAttribute: jest.fn(),
          getAttribute: jest.fn().mockReturnValue('foo bar')
        };
        var jqA = angular.element(fakeElement);

        jqA.removeClass('noexistent');
        expect(fakeElement.getAttribute).toHaveBeenCalledOnceWith('class');
        expect(fakeElement.setAttribute).not.toHaveBeenCalled();
      });
    });
  });


  describe('css', function() {
    it('should set and read css', function() {
      var selector = angular.element([a, b]);

      expect(selector.css('margin', '1px')).toEqual(selector);
      expect(angular.element(a).css('margin')).toEqual('1px');
      expect(angular.element(b).css('margin')).toEqual('1px');

      expect(selector.css({'margin': '2px'})).toEqual(selector);
      expect(angular.element(a).css('margin')).toEqual('2px');
      expect(angular.element(b).css('margin')).toEqual('2px');

      angular.element(b).css({'margin': '3px'});
      expect(angular.element(selector).css('margin')).toEqual('2px');
      expect(angular.element(a).css('margin')).toEqual('2px');
      expect(angular.element(b).css('margin')).toEqual('3px');

      selector.css('margin', '');
      expect(angular.element(a).css('margin')).toBeFalsy();
      expect(angular.element(b).css('margin')).toBeFalsy();
    });


    it('should set a bunch of css properties specified via an object', function() {
      expect(angular.element(a).css('margin')).toBeFalsy();
      expect(angular.element(a).css('padding')).toBeFalsy();
      expect(angular.element(a).css('border')).toBeFalsy();

      angular.element(a).css({'margin': '1px', 'padding': '2px', 'border': ''});

      expect(angular.element(a).css('margin')).toBe('1px');
      expect(angular.element(a).css('padding')).toBe('2px');
      expect(angular.element(a).css('border')).toBeFalsy();
    });


    it('should correctly handle dash-separated and camelCased properties', function() {
      var jqA = angular.element(a);

      expect(jqA.css('z-index')).toBeOneOf('', 'auto');
      expect(jqA.css('zIndex')).toBeOneOf('', 'auto');


      jqA.css({'zIndex':5});

      expect(jqA.css('z-index')).toBeOneOf('5', 5);
      expect(jqA.css('zIndex')).toBeOneOf('5', 5);

      jqA.css({'z-index':7});

      expect(jqA.css('z-index')).toBeOneOf('7', 7);
      expect(jqA.css('zIndex')).toBeOneOf('7', 7);
    });

    it('should leave non-dashed strings alone', function() {
      var jqA = angular.element(a);

      jqA.css('foo', 'foo');
      jqA.css('fooBar', 'bar');

      expect(a.style.foo).toBe('foo');
      expect(a.style.fooBar).toBe('bar');
    });

    it('should convert dash-separated strings to camelCase', function() {
      var jqA = angular.element(a);

      jqA.css('foo-bar', 'foo');
      jqA.css('foo-bar-baz', 'bar');
      jqA.css('foo:bar_baz', 'baz');

      expect(a.style.fooBar).toBe('foo');
      expect(a.style.fooBarBaz).toBe('bar');
      expect(a.style['foo:bar_baz']).toBe('baz');
    });

    it('should convert leading dashes followed by a lowercase letter', function() {
      var jqA = angular.element(a);

      jqA.css('-foo-bar', 'foo');

      expect(a.style.FooBar).toBe('foo');
    });

    it('should not convert slashes followed by a non-letter', function() {
      var jqA = angular.element(a);

      jqA.css('foo-42- -a-B', 'foo');

      expect(a.style['foo-42- A-B']).toBe('foo');
    });

    it('should convert the -ms- prefix to ms instead of Ms', function() {
      var jqA = angular.element(a);

      jqA.css('-ms-foo-bar', 'foo');
      jqA.css('-moz-foo-bar', 'bar');
      jqA.css('-webkit-foo-bar', 'baz');

      expect(a.style.msFooBar).toBe('foo');
      expect(a.style.MozFooBar).toBe('bar');
      expect(a.style.WebkitFooBar).toBe('baz');
    });

    it('should not collapse sequences of dashes', function() {
      var jqA = angular.element(a);

      jqA.css('foo---bar-baz--qaz', 'foo');

      expect(a.style['foo--BarBaz-Qaz']).toBe('foo');
    });

    it('should write vendor prefixes with the special -ms- exception', function() {
      var jqA = angular.element(a);

      jqA.css('-webkit-foo-bar', 'webkit');
      jqA.css('-moz-foo-baz', 'moz');
      jqA.css('-ms-foo-qaz', 'ms');

      expect(a.style.WebkitFooBar).toBe('webkit');
      expect(a.style.webkitFooBar).not.toBeDefined();

      expect(a.style.MozFooBaz).toBe('moz');
      expect(a.style.mozFooBaz).not.toBeDefined();

      expect(a.style.MsFooQaz).not.toBeDefined();
      expect(a.style.msFooQaz).toBe('ms');
    });
  });


  describe('text', function() {
    it('should return `""` on empty', function() {
      expect(angular.element().length).toEqual(0);
      expect(angular.element().text()).toEqual('');
    });


    it('should read/write value', function() {
      var element = angular.element('<div>ab</div><span>c</span>');
      expect(element.length).toEqual(2);
      expect(element[0].innerHTML).toEqual('ab');
      expect(element[1].innerHTML).toEqual('c');
      expect(element.text()).toEqual('abc');
      expect(element.text('xyz') === element).toBeTruthy();
      expect(element.text()).toEqual('xyzxyz');
    });

    it('should return text only for element or text nodes', function() {
      expect(angular.element('<div>foo</div>').text()).toBe('foo');
      expect(angular.element('<div>foo</div>').contents().eq(0).text()).toBe('foo');
      expect(angular.element(document.createComment('foo')).text()).toBe('');
    });
  });


  describe('val', function() {
    it('should read, write value', function() {
      var input = angular.element('<input type="text"/>');
      expect(input.val('abc')).toEqual(input);
      expect(input[0].value).toEqual('abc');
      expect(input.val()).toEqual('abc');
    });

    it('should get an array of selected elements from a multi select', function() {
      expect(angular.element(
        '<select multiple>' +
        '<option selected>test 1</option>' +
        '<option selected>test 2</option>' +
        '</select>').val()).toEqual(['test 1', 'test 2']);

      expect(angular.element(
        '<select multiple>' +
        '<option selected>test 1</option>' +
        '<option>test 2</option>' +
        '</select>').val()).toEqual(['test 1']);

      // In jQuery < 3.0 .val() on select[multiple] with no selected options returns an
      // null instead of an empty array.
      expect(angular.element(
        '<select multiple>' +
        '<option>test 1</option>' +
        '<option>test 2</option>' +
        '</select>').val()).toEqualOneOf(null, []);
    });

    it('should get an empty array from a multi select if no elements are chosen', function() {
      expect(angular.element(
        '<select multiple>' +
        '<optgroup>' +
        '<option>test 1</option>' +
        '<option>test 2</option>' +
        '</optgroup>' +
        '<option>test 3</option>' +
        '</select>').val()).toEqual([]);

      expect(angular.element(
        '<select multiple>' +
        '<optgroup disabled>' +
        '<option>test 1</option>' +
        '<option>test 2</option>' +
        '</optgroup>' +
        '<option disabled>test 3</option>' +
        '</select>').val()).toEqual([]);
    });
  });


  describe('html', function() {
    it('should return `undefined` on empty', function() {
      expect(angular.element().length).toEqual(0);
      expect(angular.element().html()).toEqual(undefined);
    });


    it('should read/write a value', function() {
      var element = angular.element('<div>abc</div>');
      expect(element.length).toEqual(1);
      expect(element[0].innerHTML).toEqual('abc');
      expect(element.html()).toEqual('abc');
      expect(element.html('xyz') === element).toBeTruthy();
      expect(element.html()).toEqual('xyz');
    });
  });


  describe('empty', function() {
    it('should write a value', function() {
      var element = angular.element('<div>abc</div>');
      expect(element.length).toEqual(1);
      expect(element.empty() === element).toBeTruthy();
      expect(element.html()).toEqual('');
    });
  });


  describe('on', function() {
    it('should bind to window on hashchange', function() {
      var eventFn;
      var window = {
        document: {},
        location: {},
        alert: angular.noop,
        setInterval: angular.noop,
        length:10, // pretend you are an array
        addEventListener(type, fn) {
          expect(type).toEqual('hashchange');
          eventFn = fn;
        },
        removeEventListener: angular.noop
      };
      window.window = window;

      var log;
      var jWindow = angular.element(window).on('hashchange', function() {
        log = 'works!';
      });
      eventFn({type: 'hashchange'});
      expect(log).toEqual('works!');
      dealoc(jWindow);
    });


    it('should bind to all elements and return functions', function() {
      var selected = angular.element([a, b]);
      var log = '';
      expect(selected.on('click', function() {
        log += 'click on: ' + angular.element(this).text() + ';';
      })).toEqual(selected);
      browserTrigger(a, 'click');
      expect(log).toEqual('click on: A;');
      browserTrigger(b, 'click');
      expect(log).toEqual('click on: A;click on: B;');
    });

    it('should not bind to comment or text nodes', function() {
      var nodes = angular.element('<!-- some comment -->Some text');
      var someEventHandler = jest.fn();

      nodes.on('someEvent', someEventHandler);
      nodes.triggerHandler('someEvent');

      expect(someEventHandler).not.toHaveBeenCalled();
    });

    it('should bind to all events separated by space', function() {
      var elm = angular.element(a);
      var callback = jest.fn();

      elm.on('click keypress', callback);
      elm.on('click', callback);

      browserTrigger(a, 'click');
      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(2);

      callback.mockClear();
      browserTrigger(a, 'keypress');
      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should set event.target', function() {
      var elm = angular.element(a);
      elm.on('click', function(event) {
        expect(event.target).toBe(a);
      });

      browserTrigger(a, 'click');
    });

    it('should have event.isDefaultPrevented method', function() {
      var element = angular.element(a);
      var clickSpy = jest.fn();

      clickSpy.mockImplementation(function(e) {
        expect(function() {
          expect(e.isDefaultPrevented()).toBe(false);
          e.preventDefault();
          expect(e.isDefaultPrevented()).toBe(true);
        }).not.toThrow();
      });

      element.on('click', clickSpy);

      browserTrigger(a, 'click');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should stop triggering handlers when stopImmediatePropagation is called', function() {
      var element = angular.element(a);
      var clickSpy1 = jest.fn();
      var clickSpy2 = jest.fn().mockImplementation((event) => { event.stopImmediatePropagation(); });
      var clickSpy3 = jest.fn();
      var clickSpy4 = jest.fn();

      element.on('click', clickSpy1);
      element.on('click', clickSpy2);
      element.on('click', clickSpy3);
      element[0].addEventListener('click', clickSpy4);

      browserTrigger(element, 'click');

      expect(clickSpy1).toHaveBeenCalled();
      expect(clickSpy2).toHaveBeenCalled();
      expect(clickSpy3).not.toHaveBeenCalled();
      expect(clickSpy4).not.toHaveBeenCalled();
    });

    it('should execute stopPropagation when stopImmediatePropagation is called', function() {
      var element = angular.element(a);
      var clickSpy = jest.fn();

      clickSpy.mockImplementation(function(event) {
        jest.spyOn(event, 'stopPropagation');
        event.stopImmediatePropagation();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      element.on('click', clickSpy);

      browserTrigger(element, 'click');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should have event.isImmediatePropagationStopped method', function() {
      var element = angular.element(a);
      var clickSpy = jest.fn();

      clickSpy.mockImplementation(function(event) {
        expect(event.isImmediatePropagationStopped()).toBe(false);
        event.stopImmediatePropagation();
        expect(event.isImmediatePropagationStopped()).toBe(true);
      });

      element.on('click', clickSpy);

      browserTrigger(element, 'click');
      expect(clickSpy).toHaveBeenCalled();
    });

    describe('mouseenter-mouseleave', function() {
      var root;
      var parent;
      var child;
      var log;

      function setup(html, parentNode, childNode) {
        log = '';
        root = angular.element(html);
        parent = root.find(parentNode);
        child = parent.find(childNode);

        parent.on('mouseenter', function() { log += 'parentEnter;'; });
        parent.on('mouseleave', function() { log += 'parentLeave;'; });

        child.on('mouseenter', function() { log += 'childEnter;'; });
        child.on('mouseleave', function() { log += 'childLeave;'; });
      }

      function browserMoveTrigger(from, to) {
        var fireEvent = function(type, element, relatedTarget) {
          var evnt;
          evnt = document.createEvent('MouseEvents');

          var originalPreventDefault = evnt.preventDefault;
          var fakeProcessDefault = true;

          evnt.preventDefault = function() {
            fakeProcessDefault = false;
            return originalPreventDefault.apply(evnt, arguments);
          };

          var x = 0;
          var y = 0;
          evnt.initMouseEvent(type, true, true, window, 0, x, y, x, y, false, false,
            false, false, 0, relatedTarget);

          element.dispatchEvent(evnt);
        };
        fireEvent('mouseout', from[0], to[0]);
        fireEvent('mouseover', to[0], from[0]);
      }

      afterEach(function() {
        dealoc(root);
      });

      it('should fire mouseenter when coming from outside the browser window', function() {
        setup('<div>root<p>parent<span>child</span></p><ul></ul></div>', 'p', 'span');

        browserMoveTrigger(root, parent);
        expect(log).toEqual('parentEnter;');

        browserMoveTrigger(parent, child);
        expect(log).toEqual('parentEnter;childEnter;');

        browserMoveTrigger(child, parent);
        expect(log).toEqual('parentEnter;childEnter;childLeave;');

        browserMoveTrigger(parent, root);
        expect(log).toEqual('parentEnter;childEnter;childLeave;parentLeave;');

      });

      it('should fire the mousenter on SVG elements', function() {
        setup(
          '<div>' +
          '<svg xmlns="http://www.w3.org/2000/svg"' +
          '     viewBox="0 0 18.75 18.75"' +
          '     width="18.75"' +
          '     height="18.75"' +
          '     version="1.1">' +
          '       <path d="M0,0c0,4.142,3.358,7.5,7.5,7.5s7.5-3.358,7.5-7.5-3.358-7.5-7.5-7.5-7.5,3.358-7.5,7.5"' +
          '             fill-rule="nonzero"' +
          '             fill="#CCC"' +
          '             ng-attr-fill="{{data.color || \'#CCC\'}}"/>' +
          '</svg>' +
          '</div>',
          'svg', 'path');

        browserMoveTrigger(parent, child);
        expect(log).toEqual('childEnter;');
      });
    });

    it('should throw an error if eventData or a selector is passed', function() {
      var elm = angular.element(a);
      var anObj = {};
      var aString = '';
      var aValue = 45;
      var callback = function() {};

      expect(function() {
        elm.on('click', anObj, callback);
      }).toThrowMinErr('jqLite', 'onargs');

      expect(function() {
        elm.on('click', null, aString, callback);
      }).toThrowMinErr('jqLite', 'onargs');

      expect(function() {
        elm.on('click', aValue, callback);
      }).toThrowMinErr('jqLite', 'onargs');
    });
  });


  describe('off', function() {
    it('should do nothing when no listener was registered with bound', function() {
      var aElem = angular.element(a);

      aElem.off();
      aElem.off('click');
      aElem.off('click', function() {});
    });

    it('should do nothing when a specific listener was not registered', function() {
      var aElem = angular.element(a);
      aElem.on('click', function() {});

      aElem.off('mouseenter', function() {});
    });

    it('should deregister all listeners', function() {
      var aElem = angular.element(a);
      var clickSpy = jest.fn();
      var mouseoverSpy = jest.fn();

      aElem.on('click', clickSpy);
      aElem.on('mouseover', mouseoverSpy);

      browserTrigger(a, 'click');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).toHaveBeenCalledTimes(1);

      clickSpy.mockClear();
      mouseoverSpy.mockClear();

      aElem.off();

      browserTrigger(a, 'click');
      expect(clickSpy).not.toHaveBeenCalled();
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).not.toHaveBeenCalled();
    });


    it('should deregister listeners for specific type', function() {
      var aElem = angular.element(a);
      var clickSpy = jest.fn();
      var mouseoverSpy = jest.fn();

      aElem.on('click', clickSpy);
      aElem.on('mouseover', mouseoverSpy);

      browserTrigger(a, 'click');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).toHaveBeenCalledTimes(1);

      clickSpy.mockClear();
      mouseoverSpy.mockClear();

      aElem.off('click');

      browserTrigger(a, 'click');
      expect(clickSpy).not.toHaveBeenCalled();
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).toHaveBeenCalledTimes(1);

      mouseoverSpy.mockClear();

      aElem.off('mouseover');
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).not.toHaveBeenCalled();
    });


    it('should deregister all listeners for types separated by spaces', function() {
      var aElem = angular.element(a);
      var clickSpy = jest.fn();
      var mouseoverSpy = jest.fn();

      aElem.on('click', clickSpy);
      aElem.on('mouseover', mouseoverSpy);

      browserTrigger(a, 'click');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).toHaveBeenCalledTimes(1);

      clickSpy.mockClear();
      mouseoverSpy.mockClear();

      aElem.off('click mouseover');

      browserTrigger(a, 'click');
      expect(clickSpy).not.toHaveBeenCalled();
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).not.toHaveBeenCalled();
    });


    it('should deregister specific listener', function() {
      var aElem = angular.element(a);
      var clickSpy1 = jest.fn();
      var clickSpy2 = jest.fn();

      aElem.on('click', clickSpy1);
      aElem.on('click', clickSpy2);

      browserTrigger(a, 'click');
      expect(clickSpy1).toHaveBeenCalledTimes(1);
      expect(clickSpy2).toHaveBeenCalledTimes(1);

      clickSpy1.mockClear();
      clickSpy2.mockClear();

      aElem.off('click', clickSpy1);

      browserTrigger(a, 'click');
      expect(clickSpy1).not.toHaveBeenCalled();
      expect(clickSpy2).toHaveBeenCalledTimes(1);

      clickSpy2.mockClear();

      aElem.off('click', clickSpy2);
      browserTrigger(a, 'click');
      expect(clickSpy2).not.toHaveBeenCalled();
    });


    it('should correctly deregister the mouseenter/mouseleave listeners', function() {
      var aElem = angular.element(a);
      var onMouseenter = jest.fn();
      var onMouseleave = jest.fn();

      aElem.on('mouseenter', onMouseenter);
      aElem.on('mouseleave', onMouseleave);
      aElem.off('mouseenter', onMouseenter);
      aElem.off('mouseleave', onMouseleave);
      aElem.on('mouseenter', onMouseenter);
      aElem.on('mouseleave', onMouseleave);

      browserTrigger(a, 'mouseover', {relatedTarget: b});
      expect(onMouseenter).toHaveBeenCalledTimes(1);

      browserTrigger(a, 'mouseout', {relatedTarget: b});
      expect(onMouseleave).toHaveBeenCalledTimes(1);
    });


    it('should call a `mouseenter/leave` listener only once when `mouseenter/leave` and `mouseover/out` '
      + 'are triggered simultaneously', function() {
      var aElem = angular.element(a);
      var onMouseenter = jest.fn();
      var onMouseleave = jest.fn();

      aElem.on('mouseenter', onMouseenter);
      aElem.on('mouseleave', onMouseleave);

      browserTrigger(a, 'mouseenter', {relatedTarget: b});
      browserTrigger(a, 'mouseover', {relatedTarget: b});
      expect(onMouseenter).toHaveBeenCalledTimes(1);

      browserTrigger(a, 'mouseleave', {relatedTarget: b});
      browserTrigger(a, 'mouseout', {relatedTarget: b});
      expect(onMouseleave).toHaveBeenCalledTimes(1);
    });

    it('should call a `mouseenter/leave` listener when manually triggering the event', function() {
      var aElem = angular.element(a);
      var onMouseenter = jest.fn();
      var onMouseleave = jest.fn();

      aElem.on('mouseenter', onMouseenter);
      aElem.on('mouseleave', onMouseleave);

      aElem.triggerHandler('mouseenter');
      expect(onMouseenter).toHaveBeenCalledTimes(1);

      aElem.triggerHandler('mouseleave');
      expect(onMouseleave).toHaveBeenCalledTimes(1);
    });


    it('should deregister specific listener within the listener and call subsequent listeners', function() {
      var aElem = angular.element(a);
      var clickSpy = jest.fn();

      var clickOnceSpy = jest.fn().mockImplementation(() => {
        aElem.off('click', clickOnceSpy);
      });

      aElem.on('click', clickOnceSpy);
      aElem.on('click', clickSpy);

      browserTrigger(a, 'click');
      expect(clickOnceSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);

      browserTrigger(a, 'click');
      expect(clickOnceSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });


    it('should deregister specific listener for multiple types separated by spaces', function() {
      var aElem = angular.element(a);
      var leaderSpy = jest.fn();
      var extraSpy = jest.fn();

      aElem.on('click', leaderSpy);
      aElem.on('click', extraSpy);
      aElem.on('mouseover', leaderSpy);

      browserTrigger(a, 'click');
      browserTrigger(a, 'mouseover');
      expect(leaderSpy).toHaveBeenCalledTimes(2);
      expect(extraSpy).toHaveBeenCalledTimes(1);

      leaderSpy.mockClear();
      extraSpy.mockClear();

      aElem.off('click mouseover', leaderSpy);

      browserTrigger(a, 'click');
      browserTrigger(a, 'mouseover');
      expect(leaderSpy).not.toHaveBeenCalled();
      expect(extraSpy).toHaveBeenCalledTimes(1);
    });


    describe('native listener deregistration', function() {
      it('should deregister the native listener when all jqLite listeners for given type are gone ' +
        'after off("eventName", listener) call',  function() {
        var aElem = angular.element(a);
        var addEventListenerSpy = jest.spyOn(aElem[0], 'addEventListener');
        var removeEventListenerSpy = jest.spyOn(aElem[0], 'removeEventListener');
        var nativeListenerFn;

        var jqLiteListener = function() {};
        aElem.on('click', jqLiteListener);

        // jQuery <2.2 passes the non-needed `false` useCapture parameter.
        // See https://github.com/jquery/jquery/issues/2199 for details.
        expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', expect.any(Function));
        nativeListenerFn = addEventListenerSpy.mock.calls[0][1];
        expect(removeEventListenerSpy).not.toHaveBeenCalled();

        aElem.off('click', jqLiteListener);
        expect(removeEventListenerSpy).toHaveBeenCalledOnceWith('click', nativeListenerFn);
      });


      it('should deregister the native listener when all jqLite listeners for given type are gone ' +
        'after off("eventName") call',  function() {
        var aElem = angular.element(a);
        var addEventListenerSpy = jest.spyOn(aElem[0], 'addEventListener');
        var removeEventListenerSpy = jest.spyOn(aElem[0], 'removeEventListener');
        var nativeListenerFn;

        aElem.on('click', function() {});
        expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', expect.any(Function));
        nativeListenerFn = addEventListenerSpy.mock.calls[0][1];
        expect(removeEventListenerSpy).not.toHaveBeenCalled();

        aElem.off('click');
        expect(removeEventListenerSpy).toHaveBeenCalledOnceWith('click', nativeListenerFn);
      });


      it('should deregister the native listener when all jqLite listeners for given type are gone ' +
        'after off("eventName1 eventName2") call',  function() {
        var aElem = angular.element(a);
        var addEventListenerSpy = jest.spyOn(aElem[0], 'addEventListener');
        var removeEventListenerSpy = jest.spyOn(aElem[0], 'removeEventListener');
        var nativeListenerFn;

        aElem.on('click', function() {});
        expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', expect.any(Function));
        nativeListenerFn = addEventListenerSpy.mock.calls[0][1];
        addEventListenerSpy.mockClear();

        aElem.on('dblclick', function() {});
        expect(addEventListenerSpy).toHaveBeenCalledOnceWith('dblclick', nativeListenerFn);
        expect(removeEventListenerSpy).not.toHaveBeenCalled();

        aElem.off('click dblclick');

        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', nativeListenerFn);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('dblclick', nativeListenerFn);
        expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      });


      it('should deregister the native listener when all jqLite listeners for given type are gone ' +
        'after off() call',  function() {
        var aElem = angular.element(a);
        var addEventListenerSpy = jest.spyOn(aElem[0], 'addEventListener');
        var removeEventListenerSpy = jest.spyOn(aElem[0], 'removeEventListener');
        var nativeListenerFn;

        aElem.on('click', function() {});
        expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', expect.any(Function));
        nativeListenerFn = addEventListenerSpy.mock.calls[0][1];
        addEventListenerSpy.mockClear();

        aElem.on('dblclick', function() {});
        expect(addEventListenerSpy).toHaveBeenCalledOnceWith('dblclick', nativeListenerFn);

        aElem.off();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', nativeListenerFn);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('dblclick', nativeListenerFn);
        expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      });
    });


    it('should throw an error if a selector is passed', function() {
      var aElem = angular.element(a);
      aElem.on('click', angular.noop);
      expect(function() {
        aElem.off('click', angular.noop, '.test');
      }).toThrowMinErr('jqLite', 'offargs');
    });
  });

  describe('one', function() {

    it('should only fire the callback once', function() {
      var element = angular.element(a);
      var spy = jest.fn();

      element.one('click', spy);

      browserTrigger(element, 'click');
      expect(spy).toHaveBeenCalledTimes(1);

      browserTrigger(element, 'click');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should deregister when off is called', function() {
      var element = angular.element(a);
      var spy = jest.fn();

      element.one('click', spy);
      element.off('click', spy);

      browserTrigger(element, 'click');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should return the same event object just as on() does', function() {
      var element = angular.element(a);
      var eventA;
      var eventB;
      element.on('click', function(event) {
        eventA = event;
      });
      element.one('click', function(event) {
        eventB = event;
      });

      browserTrigger(element, 'click');
      expect(eventA).toEqual(eventB);
    });

    it('should not remove other event handlers of the same type after execution', function() {
      var element = angular.element(a);
      var calls = [];
      element.one('click', function() {
        calls.push('one');
      });
      element.on('click', function() {
        calls.push('on');
      });

      browserTrigger(element, 'click');
      browserTrigger(element, 'click');

      expect(calls).toEqual(['one','on','on']);
    });
  });


  describe('replaceWith', function() {
    it('should replaceWith', function() {
      var root = angular.element('<div>').html('before-<div></div>after');
      var div = root.find('div');
      expect(div.replaceWith('<span>span-</span><b>bold-</b>')).toEqual(div);
      expect(root.text()).toEqual('before-span-bold-after');
    });


    it('should replaceWith text', function() {
      var root = angular.element('<div>').html('before-<div></div>after');
      var div = root.find('div');
      expect(div.replaceWith('text-')).toEqual(div);
      expect(root.text()).toEqual('before-text-after');
    });
  });


  describe('children', function() {
    it('should only select element nodes', function() {
      var root = angular.element('<div><!-- some comment -->before-<div></div>after-<span></span>');
      var div = root.find('div');
      var span = root.find('span');
      expect(root.children()).toJqEqual([div, span]);
    });
  });


  describe('contents', function() {
    it('should select all types child nodes', function() {
      var root = angular.element('<div><!-- some comment -->before-<div></div>after-<span></span></div>');
      var contents = root.contents();
      expect(contents.length).toEqual(5);
      expect(contents[0].data).toEqual(' some comment ');
      expect(contents[1].data).toEqual('before-');
    });

    it('should select all types iframe contents', function(done) {
      var iframe_ = document.createElement('iframe');
      var tested = false;
      var iframe = angular.element(iframe_);
      function test() {
        var doc = iframe_.contentDocument || iframe_.contentWindow.document;
        doc.body.innerHTML = '\n<span>Text</span>\n';

        var contents = iframe.contents();
        expect(contents[0]).toBeTruthy();
        expect(contents.length).toBe(1);
        expect(contents.prop('nodeType')).toBe(9);
        expect(contents[0].body).toBeTruthy();
        expect(angular.element(contents[0].body).contents().length).toBe(3);
        iframe.remove();
        doc = null;
        tested = true;
      }
      iframe_.onload = iframe_.onreadystatechange = function() {
        if (iframe_.contentDocument) test();
      };
      // eslint-disable-next-line no-script-url
      iframe_.src = 'javascript:false';
      angular.element(document).find('body').append(iframe);

      // This test is potentially flaky on CI cloud instances, so there is a generous
      // wait period...
      var job = createAsync(done);
      job.waitsFor(function() { return tested; }, 'iframe to load', 5000).done();
      job.start();
    });
  });


  describe('append', function() {
    it('should append', function() {
      var root = angular.element('<div>');
      expect(root.append('<span>abc</span>')).toEqual(root);
      expect(root.html().toLowerCase()).toEqual('<span>abc</span>');
    });
    it('should append text', function() {
      var root = angular.element('<div>');
      expect(root.append('text')).toEqual(root);
      expect(root.html()).toEqual('text');
    });
    it('should append to document fragment', function() {
      var root = angular.element(document.createDocumentFragment());
      expect(root.append('<p>foo</p>')).toBe(root);
      expect(root.children().length).toBe(1);
    });
    it('should not append anything if parent node is not of type element or docfrag', function() {
      var root = angular.element('<p>some text node</p>').contents();
      expect(root.append('<p>foo</p>')).toBe(root);
      expect(root.children().length).toBe(0);
    });
  });


  describe('wrap', function() {
    it('should wrap text node', function() {
      var root = angular.element('<div>A&lt;a&gt;B&lt;/a&gt;C</div>');
      var text = root.contents();
      expect(text.wrap('<span>')[0]).toBe(text[0]);
      expect(root.find('span').text()).toEqual('A<a>B</a>C');
    });
    it('should wrap free text node', function() {
      var root = angular.element('<div>A&lt;a&gt;B&lt;/a&gt;C</div>');
      var text = root.contents();
      text.remove();
      expect(root.text()).toBe('');

      text.wrap('<span>');
      expect(text.parent().text()).toEqual('A<a>B</a>C');
    });
    it('should clone elements to be wrapped around target', function() {
      var root = angular.element('<div class="sigil"></div>');
      var span = angular.element('<span>A</span>');

      span.wrap(root);
      expect(root.children().length).toBe(0);
      expect(span.parent().hasClass('sigil')).toBeTruthy();
    });
    it('should wrap multiple elements', function() {
      var root = angular.element('<div class="sigil"></div>');
      var spans = angular.element('<span>A</span><span>B</span><span>C</span>');

      spans.wrap(root);

      expect(spans.eq(0).parent().hasClass('sigil')).toBeTruthy();
      expect(spans.eq(1).parent().hasClass('sigil')).toBeTruthy();
      expect(spans.eq(2).parent().hasClass('sigil')).toBeTruthy();
    });
  });


  describe('prepend', function() {
    it('should prepend to empty', function() {
      var root = angular.element('<div>');
      expect(root.prepend('<span>abc</span>')).toEqual(root);
      expect(root.html().toLowerCase()).toEqual('<span>abc</span>');
    });
    it('should prepend to content', function() {
      var root = angular.element('<div>text</div>');
      expect(root.prepend('<span>abc</span>')).toEqual(root);
      expect(root.html().toLowerCase()).toEqual('<span>abc</span>text');
    });
    it('should prepend text to content', function() {
      var root = angular.element('<div>text</div>');
      expect(root.prepend('abc')).toEqual(root);
      expect(root.html().toLowerCase()).toEqual('abctext');
    });
    it('should prepend array to empty in the right order', function() {
      var root = angular.element('<div>');
      expect(root.prepend([a, b, c])).toBe(root);
      expect(sortedHtml(root)).
      toBe('<div><div>A</div><div>B</div><div>C</div></div>');
    });
    it('should prepend array to content in the right order', function() {
      var root = angular.element('<div>text</div>');
      expect(root.prepend([a, b, c])).toBe(root);
      expect(sortedHtml(root)).
      toBe('<div><div>A</div><div>B</div><div>C</div>text</div>');
    });
  });


  describe('remove', function() {
    it('should remove', function() {
      var root = angular.element('<div><span>abc</span></div>');
      var span = root.find('span');
      expect(span.remove()).toEqual(span);
      expect(root.html()).toEqual('');
    });
  });


  describe('detach', function() {
    it('should detach', function() {
      var root = angular.element('<div><span>abc</span></div>');
      var span = root.find('span');
      expect(span.detach()).toEqual(span);
      expect(root.html()).toEqual('');
    });
  });


  describe('after', function() {
    it('should after', function() {
      var root = angular.element('<div><span></span></div>');
      var span = root.find('span');
      expect(span.after('<i></i><b></b>')).toEqual(span);
      expect(root.html().toLowerCase()).toEqual('<span></span><i></i><b></b>');
    });


    it('should allow taking text', function() {
      var root = angular.element('<div><span></span></div>');
      var span = root.find('span');
      span.after('abc');
      expect(root.html().toLowerCase()).toEqual('<span></span>abc');
    });


    it('should not throw when the element has no parent', function() {
      var span = angular.element('<span></span>');
      expect(function() { span.after('abc'); }).not.toThrow();
      expect(span.length).toBe(1);
      expect(span[0].outerHTML).toBe('<span></span>');
    });
  });


  describe('parent', function() {
    it('should return parent or an empty set when no parent', function() {
      var parent = angular.element('<div><p>abc</p></div>');
      var child = parent.find('p');

      expect(parent.parent()).toBeTruthy();
      expect(parent.parent().length).toEqual(0);

      expect(child.parent().length).toBe(1);
      expect(child.parent()[0]).toBe(parent[0]);
    });


    it('should return empty set when no parent', function() {
      var element = angular.element('<div>abc</div>');
      expect(element.parent()).toBeTruthy();
      expect(element.parent().length).toEqual(0);
    });


    it('should return empty jqLite object when parent is a document fragment', function() {
      //this is quite unfortunate but jQuery 1.5.1 behaves this way
      var fragment = document.createDocumentFragment();

      var child = angular.element('<p>foo</p>');

      fragment.appendChild(child[0]);
      expect(child[0].parentNode).toBe(fragment);
      expect(child.parent().length).toBe(0);
    });
  });


  describe('next', function() {
    it('should return next sibling', function() {
      var element = angular.element('<div><b>b</b><i>i</i></div>');
      var b = element.find('b');
      var i = element.find('i');
      expect(b.next()).toJqEqual([i]);
    });


    it('should ignore non-element siblings', function() {
      var element = angular.element('<div><b>b</b>TextNode<!-- comment node --><i>i</i></div>');
      var b = element.find('b');
      var i = element.find('i');
      expect(b.next()).toJqEqual([i]);
    });
  });


  describe('find', function() {
    it('should find child by name', function() {
      var root = angular.element('<div><div>text</div></div>');
      var innerDiv = root.find('div');
      expect(innerDiv.length).toEqual(1);
      expect(innerDiv.html()).toEqual('text');
    });

    it('should find child by name and not care about text nodes', function() {
      var divs = angular.element('<div><span>aa</span></div>text<div><span>bb</span></div>');
      var innerSpan = divs.find('span');
      expect(innerSpan.length).toEqual(2);
    });
  });


  describe('eq', function() {
    it('should select the nth element ', function() {
      var element = angular.element('<div><span>aa</span></div><div><span>bb</span></div>');
      expect(element.find('span').eq(0).html()).toBe('aa');
      expect(element.find('span').eq(-1).html()).toBe('bb');
      expect(element.find('span').eq(20).length).toBe(0);
    });
  });


  describe('triggerHandler', function() {
    it('should trigger all registered handlers for an event', function() {
      var element = angular.element('<span>poke</span>');
      var pokeSpy = jest.fn();
      var clickSpy1 = jest.fn();
      var clickSpy2 = jest.fn();

      element.on('poke', pokeSpy);
      element.on('click', clickSpy1);
      element.on('click', clickSpy2);

      expect(pokeSpy).not.toHaveBeenCalled();
      expect(clickSpy1).not.toHaveBeenCalled();
      expect(clickSpy2).not.toHaveBeenCalled();

      element.triggerHandler('poke');
      expect(pokeSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy1).not.toHaveBeenCalled();
      expect(clickSpy2).not.toHaveBeenCalled();

      element.triggerHandler('click');
      expect(clickSpy1).toHaveBeenCalledTimes(1);
      expect(clickSpy2).toHaveBeenCalledTimes(1);
    });

    it('should pass in a dummy event', function() {
      // we need the event to have at least preventDefault because AngularJS will call it on
      // all anchors with no href automatically

      var element = angular.element('<a>poke</a>');

      var pokeSpy = jest.fn();
      var event;

      element.on('click', pokeSpy);

      element.triggerHandler('click');
      event = pokeSpy.mock.calls[0][0];
      expect(event.preventDefault).toBeDefined();
      expect(event.target).toEqual(element[0]);
      expect(event.type).toEqual('click');
    });

    it('should pass extra parameters as an additional argument', function() {
      var element = angular.element('<a>poke</a>');
      var pokeSpy = jest.fn();
      var data;

      element.on('click', pokeSpy);

      element.triggerHandler('click', [{hello: 'world'}]);
      data = pokeSpy.mock.calls[0][1];
      expect(data.hello).toBe('world');
    });

    it('should mark event as prevented if preventDefault is called', function() {
      var element = angular.element('<a>poke</a>');
      var pokeSpy = jest.fn();
      var event;

      element.on('click', pokeSpy);
      element.triggerHandler('click');
      event = pokeSpy.mock.calls[0][0];

      expect(event.isDefaultPrevented()).toBe(false);
      event.preventDefault();
      expect(event.isDefaultPrevented()).toBe(true);
    });

    it('should support handlers that deregister themselves', function() {
      var element = angular.element('<a>poke</a>');
      var clickSpy = jest.fn();

      var clickOnceSpy = jest.fn().mockImplementation(function() {
        element.off('click', clickOnceSpy);
      });

      element.on('click', clickOnceSpy);
      element.on('click', clickSpy);

      element.triggerHandler('click');
      expect(clickOnceSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);

      element.triggerHandler('click');
      expect(clickOnceSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });

    it('should accept a custom event instead of eventName', function() {
      var element = angular.element('<a>poke</a>');
      var pokeSpy = jest.fn();

      var customEvent = {
        type: 'click',
        someProp: 'someValue'
      };

      var actualEvent;

      element.on('click', pokeSpy);
      element.triggerHandler(customEvent);
      actualEvent = pokeSpy.mock.calls[0][0];
      expect(actualEvent.preventDefault).toBeDefined();
      expect(actualEvent.someProp).toEqual('someValue');
      expect(actualEvent.target).toEqual(element[0]);
      expect(actualEvent.type).toEqual('click');
    });

    it('should stop triggering handlers when stopImmediatePropagation is called', function() {
      var element = angular.element(a);
      var clickSpy1 = jest.fn();
      var clickSpy2 = jest.fn().mockImplementation(function(event) { event.stopImmediatePropagation(); });
      var clickSpy3 = jest.fn();

      element.on('click', clickSpy1);
      element.on('click', clickSpy2);
      element.on('click', clickSpy3);

      element.triggerHandler('click');

      expect(clickSpy1).toHaveBeenCalled();
      expect(clickSpy2).toHaveBeenCalled();
      expect(clickSpy3).not.toHaveBeenCalled();
    });

    it('should have event.isImmediatePropagationStopped method', function() {
      var element = angular.element(a);
      var clickSpy = jest.fn();
      var event;

      element.on('click', clickSpy);
      element.triggerHandler('click');
      event = clickSpy.mock.calls[0][0];

      expect(event.isImmediatePropagationStopped()).toBe(false);
      event.stopImmediatePropagation();
      expect(event.isImmediatePropagationStopped()).toBe(true);
    });
  });


  describe('kebabToCamel', function() {
    it('should leave non-dashed strings alone', function() {
      expect(ngInternals.kebabToCamel('foo')).toBe('foo');
      expect(ngInternals.kebabToCamel('')).toBe('');
      expect(ngInternals.kebabToCamel('fooBar')).toBe('fooBar');
    });

    it('should convert dash-separated strings to camelCase', function() {
      expect(ngInternals.kebabToCamel('foo-bar')).toBe('fooBar');
      expect(ngInternals.kebabToCamel('foo-bar-baz')).toBe('fooBarBaz');
      expect(ngInternals.kebabToCamel('foo:bar_baz')).toBe('foo:bar_baz');
    });

    it('should convert leading dashes followed by a lowercase letter', function() {
      expect(ngInternals.kebabToCamel('-foo-bar')).toBe('FooBar');
    });

    it('should not convert dashes followed by a non-letter', function() {
      expect(ngInternals.kebabToCamel('foo-42- -a-B')).toBe('foo-42- A-B');
    });

    it('should not convert browser specific css properties in a special way', function() {
      expect(ngInternals.kebabToCamel('-ms-foo-bar')).toBe('MsFooBar');
      expect(ngInternals.kebabToCamel('-moz-foo-bar')).toBe('MozFooBar');
      expect(ngInternals.kebabToCamel('-webkit-foo-bar')).toBe('WebkitFooBar');
    });

    it('should not collapse sequences of dashes', function() {
      expect(ngInternals.kebabToCamel('foo---bar-baz--qaz')).toBe('foo--BarBaz-Qaz');
    });
  });

  describe('bind/unbind', function() {
    it('should alias bind() to on()', function() {
      var element = angular.element(a);
      expect(element.bind).toBe(element.on);
    });

    it('should alias unbind() to off()', function() {
      var element = angular.element(a);
      expect(element.unbind).toBe(element.off);
    });
  });
});
