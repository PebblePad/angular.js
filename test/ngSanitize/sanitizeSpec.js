'use strict';
 describe('HTML', () => {
  var ua = window.navigator.userAgent;
  var isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);

  var expectHTML;

  beforeEach(angular.mock.module('ngSanitize'));
   beforeEach(() => {
    expectHTML = function(html) {
      var sanitize;
      angular.mock.inject(function($sanitize) {
        sanitize = $sanitize;
      });
      return expect(sanitize(html));
    };
  });

  describe('htmlParser', () => {
     beforeEach(() => {
      // Trigger the $sanitizer provider to execute, which initializes the `htmlParser` function.
      angular.mock.inject(function($sanitize) {});
    });

    test('should not parse comments', () => {
      expectHTML('<!--FOOBAR-->').toBe("");
    });

    test('should parse basic format', () => {
      expectHTML('<tag attr="value">text</tag>').toBe("text");
    });

    test('should not treat "<" followed by a non-/ or non-letter as a tag', () => {
      expectHTML('<- text1 text2 <1 text1 text2 <{').
      toBe('&lt;- text1 text2 &lt;1 text1 text2 &lt;{');
    });

    test('should accept tag delimiters such as "<" inside real tags', () => {
      // Assert that the < is part of the text node content, and not part of a tag name.
      expectHTML('<p> 10 < 100 </p>').toEqual('<p> 10 &lt; 100 </p>');
    });

    test('should parse newlines in tags', () => {
      expectHTML('<tag\n attr="value"\n>text</\ntag\n>').toBe("text");
    });

    test('should parse newlines in attributes', () => {
      expectHTML('<tag attr="\nvalue\n">text</tag>').toBe("text");
    });

    test('should parse namespace', () => {
      expectHTML('<ns:t-a-g ns:a-t-t-r="\nvalue\n">text</ns:t-a-g>').toBe("text");
    });

    test('should parse empty value attribute of node', () => {
      expectHTML('<test-foo selected value="">abc</test-foo>').toBe("abc");
    });
  });

  // THESE TESTS ARE EXECUTED WITH COMPILED ANGULAR
  test('should echo html', () => {
    expectHTML('hello<b class="1\'23" align=\'""\'>world</b>.').
       toBeOneOf('hello<b class="1\'23" align="&#34;&#34;">world</b>.',
                 'hello<b align="&#34;&#34;" class="1\'23">world</b>.');
  });

  test('should remove script', () => {
    expectHTML('a<SCRIPT>evil< / scrIpt >c.').toEqual('a');
    expectHTML('a<SCRIPT>evil</scrIpt>c.').toEqual('ac.');
  });

  test('should remove script that has newline characters', () => {
    expectHTML('a<SCRIPT\n>\n\revil\n\r</scrIpt\n >c.').toEqual('ac.');
  });

  test('should remove DOCTYPE header', () => {
    expectHTML('<!DOCTYPE html>').toEqual('');
    expectHTML('<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"\n"http://www.w3.org/TR/html4/strict.dtd">').toEqual('');
    expectHTML('a<!DOCTYPE html>c.').toEqual('ac.');
    expectHTML('a<!DocTyPe html>c.').toEqual('ac.');
  });

  test('should escape non-start tags', () => {
    expectHTML('a< SCRIPT >A< SCRIPT >evil< / scrIpt >B< / scrIpt >c.').
      toBe('a&lt; SCRIPT &gt;A&lt; SCRIPT &gt;evil&lt; / scrIpt &gt;B&lt; / scrIpt &gt;c.');
  });

  test('should remove attrs', () => {
    expectHTML('a<div style="abc">b</div>c').toEqual('a<div>b</div>c');
  });

  test('should handle large datasets', () => {
    // Large is non-trivial to quantify, but handling ~100,000 should be sufficient for most purposes.
    var largeNumber = 17; // 2^17 = 131,072
    var result = '<div>b</div>';
    // Ideally we would use repeat, but that isn't supported in IE.
    for (var i = 0; i < largeNumber; i++) {
      result += result;
    }
    expectHTML('a' + result + 'c').toEqual('a' + result + 'c');
  });

  test('should remove style', () => {
    expectHTML('a<STyle>evil</stYle>c.').toEqual('ac.');
  });

  test('should remove style that has newline characters', () => {
    expectHTML('a<STyle \n>\n\revil\n\r</stYle\n>c.').toEqual('ac.');
  });

  test('should remove script and style', () => {
    expectHTML('a<STyle>evil<script></script></stYle>c.').toEqual('ac.');
  });

  test('should remove double nested script', () => {
    expectHTML('a<SCRIPT>ev<script>evil</sCript>il</scrIpt>c.').toEqual('ailc.');
  });

  test('should remove unknown  names', () => {
    expectHTML('a<xxx><B>b</B></xxx>c').toEqual('a<b>b</b>c');
  });

  test('should remove unsafe value', () => {
    expectHTML('<a href="javascript:alert()">').toEqual('<a></a>');
    expectHTML('<img src="foo.gif" usemap="#foomap">').toEqual('<img src="foo.gif">');
  });

  test('should handle self closed elements', () => {
    expectHTML('a<hr/>c').toEqual('a<hr>c');
  });

  test('should handle namespace', () => {
    expectHTML('a<my:hr/><my:div>b</my:div>c').toEqual('abc');
  });

  test('should handle entities', () => {
    var everything = '<div rel="!@#$%^&amp;*()_+-={}[]:&#34;;\'&lt;&gt;?,./`~ &#295;">' +
    '!@#$%^&amp;*()_+-={}[]:&#34;;\'&lt;&gt;?,./`~ &#295;</div>';
    expectHTML(everything).toEqual(everything);
  });

  test('should mangle improper html', () => {
    // This text is encoded more than a real HTML parser would, but it should render the same.
    expectHTML('< div rel="</div>" alt=abc dir=\'"\' >text< /div>').
      toBe('&lt; div rel=&#34;&#34; alt=abc dir=\'&#34;\' &gt;text&lt; /div&gt;');
  });

  test('should mangle improper html2', () => {
    // A proper HTML parser would clobber this more in most cases, but it looks reasonable.
    expectHTML('< div rel="</div>" / >').
      toBe('&lt; div rel=&#34;&#34; / &gt;');
  });

  test('should ignore back slash as escape', () => {
    expectHTML('<img alt="xxx\\" title="><script>....">').
      toBeOneOf('<img alt="xxx\\" title="&gt;&lt;script&gt;....">',
                '<img title="&gt;&lt;script&gt;...." alt="xxx\\">');
  });

  test('should ignore object attributes', () => {
    expectHTML('<a constructor="hola">:)</a>').
      toEqual('<a>:)</a>');
    expectHTML('<constructor constructor="hola">:)</constructor>').
      toEqual('');
  });

  test('should keep spaces as prefix/postfix', () => {
    expectHTML(' a ').toEqual(' a ');
  });

  test('should allow multiline strings', () => {
    expectHTML('\na\n').toEqual('&#10;a&#10;');
  });

  test('should accept tag delimiters such as "<" inside real tags (with nesting)', () => {
    //this is an integrated version of the 'should accept tag delimiters such as "<" inside real tags' test
    expectHTML('<p> 10 < <span>100</span> </p>')
    .toEqual('<p> 10 &lt; <span>100</span> </p>');
  });

  test('should accept non-string arguments', () => {
    expectHTML(null).toBe('');
    expectHTML(undefined).toBe('');
    expectHTML(42).toBe('42');
    expectHTML({}).toBe('[object Object]');
    expectHTML([1, 2, 3]).toBe('1,2,3');
    expectHTML(true).toBe('true');
    expectHTML(false).toBe('false');
  });


  test('should strip svg elements if not enabled via provider', () => {
    expectHTML('<svg width="400px" height="150px" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"></svg>')
      .toEqual('');
  });

  test('should prevent mXSS attacks', () => {
    expectHTML('<a href="&#x3000;javascript:alert(1)">CLICKME</a>').toBe('<a>CLICKME</a>');
  });

  test('should strip html comments', () => {
    expectHTML('<!-- comment 1 --><p>text1<!-- comment 2 -->text2</p><!-- comment 3 -->')
      .toEqual('<p>text1text2</p>');
  });

  describe('clobbered elements', () => {
    //JSDOM polyfill
    Object.defineProperty(HTMLFormElement.prototype, "firstChild", {
      get() {
        for (const input of this.querySelectorAll("input")) {
          if (input.name) {
            Object.defineProperty(this, input.name, { value: input})
          }
        }
        return this.childNodes[0] ?? null;
      }
    })

    test('should throw on a form with an input named "parentNode"', () => {
      angular.mock.inject(function($sanitize) {
        expect(function() {
          $sanitize('<form><input name="parentNode" /></form>');
        }).toThrowMinErr('$sanitize', 'elclob');

        expect(function() {
          $sanitize('<form><div><div><input name="parentNode" /></div></div></form>');
        }).toThrowMinErr('$sanitize', 'elclob');
      });
    });

    test('should throw on a form with an input named "nextSibling"', () => {
      angular.mock.inject(function($sanitize) {

        expect(function() {
          $sanitize('<form><input name="nextSibling" /></form>');
        }).toThrowMinErr('$sanitize', 'elclob');

        expect(function() {
          $sanitize('<form><div><div><input name="nextSibling" /></div></div></form>');
        }).toThrowMinErr('$sanitize', 'elclob');

      });
    });
  });

  // See https://github.com/cure53/DOMPurify/blob/a992d3a75031cb8bb032e5ea8399ba972bdf9a65/src/purify.js#L439-L449
  test('should not allow JavaScript execution when creating inert document', angular.mock.inject(function($sanitize) {
    $sanitize('<svg><g onload="window.xxx = 100"></g></svg>');

    expect(window.xxx).toBe(undefined);
    delete window.xxx;
  }));

  // See https://github.com/cure53/DOMPurify/releases/tag/0.6.7
  test('should not allow JavaScript hidden in badly formed HTML to get through sanitization (Firefox bug)', angular.mock.inject(function($sanitize) {
    var doc = $sanitize('<svg><p><style><img src="</style><img src=x onerror=alert(1)//">');
    expect(doc).toEqual('<p><img src="x"></p>');
  }));

  describe('Custom white-list support', () => {

    var $sanitizeProvider;
    beforeEach(angular.mock.module(function(_$sanitizeProvider_) {
      $sanitizeProvider = _$sanitizeProvider_;

      $sanitizeProvider.addValidElements(['foo']);
      $sanitizeProvider.addValidElements({
        htmlElements: ['foo-button', 'foo-video'],
        htmlVoidElements: ['foo-input'],
        svgElements: ['foo-svg']
      });
      $sanitizeProvider.addValidAttrs(['foo']);
    }));

    test('should allow custom white-listed element', () => {
      expectHTML('<foo></foo>').toEqual('<foo></foo>');
      expectHTML('<foo-button></foo-button>').toEqual('<foo-button></foo-button>');
      expectHTML('<foo-video></foo-video>').toEqual('<foo-video></foo-video>');
    });

    test('should allow custom white-listed void element', () => {
      expectHTML('<foo-input/>').toEqual('<foo-input>');
    });

    test('should allow custom white-listed void element to be used with closing tag', () => {
      expectHTML('<foo-input></foo-input>').toEqual('<foo-input>');
    });

    test('should allow custom white-listed attribute', () => {
      expectHTML('<foo-input foo="foo"/>').toEqual('<foo-input foo="foo">');
    });

    test('should ignore custom white-listed SVG element if SVG disabled', () => {
      expectHTML('<foo-svg></foo-svg>').toEqual('');
    });

    test('should not allow add custom element after service has been instantiated', angular.mock.inject(function($sanitize) {
      $sanitizeProvider.addValidElements(['bar']);
      expectHTML('<bar></bar>').toEqual('');
    }));
  });

  describe('SVG support', () => {

    beforeEach(angular.mock.module(function($sanitizeProvider) {
      $sanitizeProvider.enableSvg(true);
      $sanitizeProvider.addValidElements({
        svgElements: ['font-face-uri']
      });
    }));

    test('should accept SVG tags', () => {
      expectHTML('<svg width="400px" height="150px" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"></svg>')
        .toBeOneOf('<svg width="400px" height="150px" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"></circle></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg" height="150px" width="400px"><circle fill="red" stroke-width="3" stroke="black" r="40" cy="50" cx="50"></circle></svg>',
                   '<svg width="400px" height="150px" xmlns="http://www.w3.org/2000/svg"><circle fill="red" stroke="black" stroke-width="3" cx="50" cy="50" r="40"></circle></svg>',
                   '<svg width="400px" height="150px" xmlns="http://www.w3.org/2000/svg"><circle FILL="red" STROKE="black" STROKE-WIDTH="3" cx="50" cy="50" r="40"></circle></svg>');
    });

    test('should not ignore white-listed svg camelCased attributes', () => {
      expectHTML('<svg preserveAspectRatio="true"></svg>')
        .toBeOneOf('<svg preserveAspectRatio="true"></svg>',
                   '<svg preserveAspectRatio="true" xmlns="http://www.w3.org/2000/svg"></svg>');

    });

    test('should allow custom white-listed SVG element', () => {
      expectHTML('<font-face-uri></font-face-uri>').toEqual('<font-face-uri></font-face-uri>');
    });

    test('should sanitize SVG xlink:href attribute values', () => {
      expectHTML('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="javascript:alert()"></a></svg>')
        .toBeOneOf('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a></a></svg>',
                   '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><a></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a xmlns:xlink="http://www.w3.org/1999/xlink"></a></svg>');

      expectHTML('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="https://example.com"></a></svg>')
        .toBeOneOf('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="https://example.com"></a></svg>',
                   '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><a xlink:href="https://example.com"></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a xlink:href="https://example.com" xmlns:xlink="http://www.w3.org/1999/xlink"></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://example.com"></a></svg>');
    });

    test('should sanitize SVG xml:base attribute values', () => {
      expectHTML('<svg xmlns="http://www.w3.org/2000/svg"><a xml:base="javascript:alert(1)//" href="#"></a></svg>')
        .toEqual('<svg xmlns="http://www.w3.org/2000/svg"><a href="#"></a></svg>');

      expectHTML('<svg xmlns="http://www.w3.org/2000/svg"><a xml:base="https://example.com" href="#"></a></svg>')
        .toEqual('<svg xmlns="http://www.w3.org/2000/svg"><a xml:base="https://example.com" href="#"></a></svg>');

    });

    test('should sanitize unknown namespaced SVG attributes', () => {
      expectHTML('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:foo="javascript:alert()"></a></svg>')
        .toBeOneOf('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a></a></svg>',
                   '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><a></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a></a></svg>');

      expectHTML('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:bar="https://example.com"></a></svg>')
        .toBeOneOf('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a></a></svg>',
                   '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><a></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a></a></svg>');
    });

    test('should not accept SVG animation tags', () => {
      expectHTML('<svg xmlns:xlink="http://www.w3.org/1999/xlink"><a><text y="1em">Click me</text><animate attributeName="xlink:href" values="javascript:alert(1)"/></a></svg>')
        .toBeOneOf('<svg xmlns:xlink="http://www.w3.org/1999/xlink"><a><text y="1em">Click me</text></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a><text y="1em">Click me</text></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a><text y="1em">Click me</text></a></svg>');

      expectHTML('<svg><a xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="?"><circle r="400"></circle>' +
        '<animate attributeName="xlink:href" begin="0" from="javascript:alert(1)" to="&" /></a></svg>')
        .toBeOneOf('<svg><a xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="?"><circle r="400"></circle></a></svg>',
                   '<svg><a xlink:href="?" xmlns:xlink="http://www.w3.org/1999/xlink"><circle r="400"></circle></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a xlink:href="?" xmlns:xlink="http://www.w3.org/1999/xlink"><circle r="400"></circle></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="?"><circle r="400"></circle></a></svg>');
    });

    test('should not accept SVG `use` tags', () => {
      expectHTML('<svg><use xlink:href="test.svg#xss" /></svg>')
        .toBeOneOf('<svg></svg>',
                   '<svg xmlns:xlink="http://www.w3.org/1999/xlink"></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    });
  });


  describe('htmlSanitizerWriter', () => {
    var html = '';
    var sanitize;
    beforeEach(() => {
      angular.mock.inject(function($sanitize) {
        sanitize = $sanitize;
      });
    })

    test('should write basic HTML', () => {
      html = sanitize('before<div rel="123">in</div>after');
      expect(html).toEqual('before<div rel="123">in</div>after');
    });

    test('should escape text nodes', () => {
      html = sanitize('<textarea>a<div>&</div>c</textarea>');
      expect(html).toEqual('a&lt;div&gt;&amp;&lt;/div&gt;c');
    });

    test('should escape IE script', () => {
      html = sanitize('<textarea>&<>{}</textarea>');
      expect(html).toEqual('&amp;&lt;&gt;{}');
    });

    test('should escape attributes', () => {
      html = sanitize(`<div rel="!@#$%^&*()_+-={}[]:;'<>?,./\`~ \n\0\r\u0127">`);
      expect(html).toEqual('<div rel="!@#$%^&amp;*()_+-={}[]:;\'&lt;&gt;?,./`~ &#10;&#65533;&#10;&#295;"></div>');

      html = sanitize(`<div rel='"'>`);
      expect(html).toEqual('<div rel="&#34;"></div>');
    });

    test('should ignore misformed elements', () => {
      html = sanitize('d>i&v');
      expect(html).toEqual('d&gt;i&amp;v');
    });

    test('should ignore unknown attributes', () => {
      html = sanitize('<div unknown=""></div>');
      expect(html).toEqual('<div></div>');
    });

    test('should handle surrogate pair', () => {
      html = sanitize(String.fromCharCode(55357, 56374));
      expect(html).toEqual('&#128054;');
    });

    describe('explicitly disallow', () => {
      test('should not allow attributes', () => {
        html = sanitize('<div id="a" name="a" style="a"></div>');
        expect(html).toEqual('<div></div>');
      });

      test('should not allow tags', () => {
        const tags = [
          '<frameset></frameset>',
          '<frame/>',
          '<form></form>',
          '<param/>',
          '<object></object>',
          '<embed></',
          '<textarea></textarea>',
          '<input/>',
          '<button></button>',
          '<option></option>',
          '<select></select>',
          '<script></script>',
          '<style></style>',
          '<link/>',
          '<base/>',
          '<basefont/>'
        ].join("");
        html = sanitize(tags);
        expect(html).toEqual('');
      });
    });

    describe('uri validation', () => {
      test('should call the uri validator', () => {
        html = sanitize(`<a href="someUrl"></a><img src="someImgUrl"/><some-tag src="someNonUrl"></some-tag>`);
        expect(html).toEqual('<a href="someUrl"></a><img src="someImgUrl">');
      });

      test('should drop non valid uri attributes', () => {
        html = sanitize(`<a href="fake://someUrl"></a>`);
        expect(html).toEqual('<a></a>');
      });

      test('should preserve whitespace', () => {
        const text = sanitize('  a&b ')
        expect(text).toEqual('  a&amp;b ');
      });
    });
  });

  describe('uri checking', () => {
     beforeEach(() => {
      expect.extend({
        toBeValidUrl(actual) {
          var sanitize;
          angular.mock.inject(function($sanitize) {
            sanitize = $sanitize;
          });
          var input = '<a href="' + actual + '"></a>';
          var pass = sanitize(input) === input;

          return {
            pass: pass,
            message() {
              return 'Expected \'' + actual + '\'' + (pass ? ' not' : '') + ' to be a valid url.';
            }
          };
        }
      });
    });

    test('should use $$sanitizeUri for a[href] links', () => {
      var $$sanitizeUri = jest.fn().mockName('$$sanitizeUri');
      angular.mock.module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function() {
        $$sanitizeUri.mockReturnValue('someUri');

        expectHTML('<a href="someUri"></a>').toEqual('<a href="someUri"></a>');
        expect($$sanitizeUri).toHaveBeenCalledWith('someUri', false);

        $$sanitizeUri.mockReturnValue('unsafe:someUri');
        expectHTML('<a href="someUri"></a>').toEqual('<a></a>');
      });
    });

    test('should use $$sanitizeUri for img[src] links', () => {
      var $$sanitizeUri = jest.fn().mockName('$$sanitizeUri');
      angular.mock.module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(function() {
        $$sanitizeUri.mockReturnValue('someUri');

        expectHTML('<img src="someUri"/>').toEqual('<img src="someUri">');
        expect($$sanitizeUri).toHaveBeenCalledWith('someUri', true);

        $$sanitizeUri.mockReturnValue('unsafe:someUri');
        expectHTML('<img src="someUri"/>').toEqual('<img>');
      });
    });

    test('should be URI', () => {
      expect('').toBeValidUrl();
      expect('http://abc').toBeValidUrl();
      expect('HTTP://abc').toBeValidUrl();
      expect('https://abc').toBeValidUrl();
      expect('HTTPS://abc').toBeValidUrl();
      expect('ftp://abc').toBeValidUrl();
      expect('FTP://abc').toBeValidUrl();
      expect('mailto:me@example.com').toBeValidUrl();
      expect('MAILTO:me@example.com').toBeValidUrl();
      expect('tel:123-123-1234').toBeValidUrl();
      expect('TEL:123-123-1234').toBeValidUrl();
      expect('#anchor').toBeValidUrl();
      expect('/page1.md').toBeValidUrl();
    });

    test('should not be URI', () => {
      // eslint-disable-next-line no-script-url
      expect('javascript:alert').not.toBeValidUrl();
    });

    describe('javascript URLs', () => {
      test('should ignore javascript:', () => {
        // eslint-disable-next-line no-script-url
        expect('JavaScript:abc').not.toBeValidUrl();
        expect(' \n Java\n Script:abc').not.toBeValidUrl();
        expect('http://JavaScript/my.js').toBeValidUrl();
      });

      test('should ignore dec encoded javascript:', () => {
        expect('&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;').not.toBeValidUrl();
        expect('&#106&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;').not.toBeValidUrl();
        expect('&#106 &#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;').not.toBeValidUrl();
      });

      test('should ignore decimal with leading 0 encoded javascript:', () => {
        expect('&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058').not.toBeValidUrl();
        expect('&#0000106 &#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058').not.toBeValidUrl();
        expect('&#0000106; &#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058').not.toBeValidUrl();
      });

      test('should ignore hex encoded javascript:', () => {
        expect('&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A;').not.toBeValidUrl();
        expect('&#x6A;&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A;').not.toBeValidUrl();
        expect('&#x6A &#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A;').not.toBeValidUrl();
      });

      test('should ignore hex encoded whitespace javascript:', () => {
        expect('jav&#x09;ascript:alert();').not.toBeValidUrl();
        expect('jav&#x0A;ascript:alert();').not.toBeValidUrl();
        expect('jav&#x0A ascript:alert();').not.toBeValidUrl();
        expect('jav\u0000ascript:alert();').not.toBeValidUrl();
        expect('java\u0000\u0000script:alert();').not.toBeValidUrl();
        expect(' &#14; java\u0000\u0000script:alert();').not.toBeValidUrl();
      });
    });
  });

  describe('sanitizeText', () => {
    /* global sanitizeText: false */
    test('should escape text', () => {
      expect(ngInternals.sanitizeText('a<div>&</div>c')).toEqual('a&lt;div&gt;&amp;&lt;/div&gt;c');
    });
  });
});