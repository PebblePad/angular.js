'use strict';

function createMockStyleSheet(doc) {
  doc = doc ? doc[0] : window.document;

  var node = doc.createElement('style');
  var head = doc.getElementsByTagName('head')[0];
  head.appendChild(node);

  var ss = doc.styleSheets[doc.styleSheets.length - 1];

  return {
    addRule: function(selector, styles) {
      try {
        ss.insertRule(selector + '{ ' + styles + '}', 0);
      } catch (e) {
        try {
          ss.addRule(selector, styles);
        } catch (e2) { /* empty */ }
      }
    },

    addPossiblyPrefixedRule: function(selector, styles) {
      // Support: Android <5, Blackberry Browser 10, default Chrome in Android 4.4.x
      // Mentioned browsers need a -webkit- prefix for transitions & animations.
      var prefixedStyles = styles.split(/\s*;\s*/g)
        .filter(function(style) {
          return style && /^(?:transition|animation)\b/.test(style);
        })
        .map(function(style) {
          return '-webkit-' + style;
        }).join('; ');

      this.addRule(selector, prefixedStyles);

      this.addRule(selector, styles);
    },

    destroy: function() {
      head.removeChild(node);
    }
  };
}

window.createMockStyleSheet = createMockStyleSheet;
