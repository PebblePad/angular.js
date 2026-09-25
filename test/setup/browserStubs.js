if (window.SVGScriptElement === undefined) {
  window.SVGScriptElement = jest.fn();
}

if (window.ontransitionend === undefined) {
  window.ontransitionend = jest.fn();
}

if (window.onanimationend === undefined) {
  window.onanimationend = jest.fn();
}

if (window.TransitionEvent === undefined) {
  class TransitionEvent extends Event {
    constructor(type, transitionEventInitDict = {},) {
      super(type, transitionEventInitDict);
      this.elapsedTime = transitionEventInitDict.elapsedTime || 0.0;
      this.propertyName = transitionEventInitDict.propertyName || '';
      this.pseudoElement = transitionEventInitDict.pseudoElement || '';
    }
  }

  window.TransitionEvent = TransitionEvent;
}

if (window.AnimationEvent === undefined) {
  class AnimationEvent extends Event {
    constructor(type, animationEventInitDict = {}) {
      super(type, animationEventInitDict);
      this.animationName = animationEventInitDict.animationName || '';
      this.elapsedTime = animationEventInitDict.elapsedTime || 0.0;
      this.pseudoElement = animationEventInitDict.pseudoElement || '';
    }
  }

  window.AnimationEvent = AnimationEvent;
}

// jsdom does not implement SVGAElement, so an <a> inside <svg> is a plain SVGElement without an
// `href` property. Browsers expose it as an SVGAnimatedString, which ngHref / htmlAnchorDirective /
// $location rely on to detect SVG anchors and use `xlink:href`.
if (window.SVGAElement === undefined && !('href' in window.SVGElement.prototype)) {
  const XLINK_NS = 'http://www.w3.org/1999/xlink';

  class SVGAnimatedString {
    constructor(element) {
      this._element = element;
    }

    get baseVal() {
      return this._element.getAttribute('href') || this._element.getAttributeNS(XLINK_NS, 'href') || '';
    }

    set baseVal(value) {
      this._element.setAttribute('href', value);
    }

    get animVal() {
      return this.baseVal;
    }

    get [Symbol.toStringTag]() {
      return 'SVGAnimatedString';
    }
  }

  window.SVGAnimatedString = SVGAnimatedString;

  Object.defineProperty(window.SVGElement.prototype, 'href', {
    configurable: true,
    get() {
      return this.localName === 'a' ? new SVGAnimatedString(this) : undefined;
    }
  });
}

if (document.currentScript === null) {
  const currentScript = document.createElement('script');
  currentScript.src = location.href;
  Object.defineProperty(document, 'currentScript', { value: currentScript });
}

if (HTMLElement.prototype.isContentEditable === undefined) {
  Object.defineProperty(HTMLElement.prototype, 'isContentEditable', {
    configurable: true,
    get() {
      for (var node = this; node && node.nodeType === Node.ELEMENT_NODE; node = node.parentNode) {
        var value = node.getAttribute('contenteditable');
        if (value === null) continue;
        value = value.toLowerCase();
        if (value === '' || value === 'true' || value === 'plaintext-only') return true;
        if (value === 'false') return false;
        // invalid value: inherit from parent
      }
      return false;
    }
  });
}

/**
 * JSDOM input clamping
 */
var desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
Object.defineProperty(HTMLInputElement.prototype, 'value', {
  configurable: true,
  enumerable: desc.enumerable,
  get: desc.get,
  set(val) {
    desc.set.call(this, val);   // let JSDOM clamp to min and max first
    if (this.type !== 'range' || this.step.toLowerCase() === 'any') return;

    var step = parseFloat(this.step);
    var min = parseFloat(this.min);
    var max = parseFloat(this.max);
    if (!(step > 0)) step = 1;
    if (isNaN(min)) min = 0;
    if (isNaN(max)) max = 100;

    var n = parseFloat(desc.get.call(this));
    var rounded = min + Math.floor((n - min) / step + 0.5) * step;
    if (rounded > max) rounded -= step;
    if (rounded !== n) desc.set.call(this, String(rounded));
  }
});

/**
 * Computed style polyfill for JSDOM and AngularJS Shorthand syntax
 */
const TIME_VALUE = /^[-+]?(?:\d+\.?\d*|\.\d+)m?s$/i;
const ITERATION_COUNT_VALUE = /^(?:\d+\.?\d*|\.\d+|infinite)$/i;
const EASING_VALUE = /^(?:ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end|(?:cubic-bezier|steps|linear)\(.*\))$/i;
const DIRECTION_VALUE = /^(?:normal|reverse|alternate|alternate-reverse)$/i;
const FILL_MODE_VALUE = /^(?:none|forwards|backwards|both)$/i;
const PLAY_STATE_VALUE = /^(?:running|paused)$/i;

const splitLayers = (value) => value.split(/\s*,\s*(?![^()]*\))/);
const splitTokens = (layer) => layer.trim().split(/\s+(?![^()]*\))/);

// Per spec, the first time value in a layer is the duration and the second is the delay
const parseTransitionLayer = (layer) => {
  const longhands = { duration: '0s', delay: '0s', timingFunction: 'ease', property: 'all' };
  let timeCount = 0;
  splitTokens(layer).forEach((token) => {
    if (TIME_VALUE.test(token)) {
      longhands[timeCount++ ? 'delay' : 'duration'] = token;
    } else if (EASING_VALUE.test(token)) {
      longhands.timingFunction = token;
    } else {
      longhands.property = token;
    }
  });
  return longhands;
};

const parseAnimationLayer = (layer) => {
  const longhands = {
    duration: '0s',
    delay: '0s',
    timingFunction: 'ease',
    iterationCount: '1',
    direction: 'normal',
    fillMode: 'none',
    playState: 'running',
    name: 'none'
  };
  let timeCount = 0;
  splitTokens(layer).forEach((token) => {
    if (TIME_VALUE.test(token)) {
      longhands[timeCount++ ? 'delay' : 'duration'] = token;
    } else if (EASING_VALUE.test(token)) {
      longhands.timingFunction = token;
    } else if (ITERATION_COUNT_VALUE.test(token)) {
      longhands.iterationCount = token;
    } else if (DIRECTION_VALUE.test(token)) {
      longhands.direction = token;
    } else if (FILL_MODE_VALUE.test(token)) {
      longhands.fillMode = token;
    } else if (PLAY_STATE_VALUE.test(token)) {
      longhands.playState = token;
    } else {
      longhands.name = token;
    }
  });
  return longhands;
};

const shorthandParsers = {
  transition: parseTransitionLayer,
  animation: parseAnimationLayer
};

const shorthandLonghandKeys = {
  transition: ['duration', 'delay', 'timingFunction', 'property'],
  animation: ['duration', 'delay', 'timingFunction', 'iterationCount', 'direction', 'fillMode', 'playState', 'name']
};

// Returns a single longhand value (e.g. `duration`) from a (possibly multi-layered) shorthand value
const expandShorthand = (shorthandProp, shorthand, key) => {
  return splitLayers(shorthand).map((layer) => shorthandParsers[shorthandProp](layer)[key]).join(', ');
};

const toCamelLonghand = (shorthandProp, key) => shorthandProp + key[0].toUpperCase() + key.slice(1);
const toKebab = (camel) => camel.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

const isEmptyStyle = (value) => value === '' || value === null || value === undefined;

const ogCetComputedStyle = window.getComputedStyle;
const defaultAnimationValues = {
  transitionDuration: '0s',
  transitionDelay: '0s',
  transitionProperty: 'all',
  transitionTimingFunction: 'ease',
  animationName: 'none',
  animationDuration: '0s',
  animationDelay: '0s',
  animationIterationCount: '1',
  animationTimingFunction: 'ease',
  animationPlayState: 'running'
};

const timeProps = ['transitionDuration', 'transitionDelay', 'animationDuration', 'animationDelay'];

// Browsers always report computed time values in seconds, and AngularJS relies on this
// (`parseMaxTime` ignores `ms`), so convert any `ms` values JSDOM passes through as-is.
const normalizeTimeValues = (value) => splitLayers(value).map((time) => {
  return /ms$/i.test(time) ? (parseFloat(time) / 1000) + 's' : time;
}).join(', ');

// JSDOM does not expand the `transition` / `animation` shorthands into their longhands, and reports
// unset longhands as their initial value (e.g. `0s`, or `auto` for `animation-duration`) rather than
// an empty string. A longhand that is empty or still at its initial value is therefore treated as
// unset and derived from the shorthand.
const applyShorthandLonghands = (styles, shorthandProp, keys) => {
  const shorthand = styles[shorthandProp];
  if (isEmptyStyle(shorthand)) return;

  keys.forEach((key) => {
    const prop = toCamelLonghand(shorthandProp, key);
    const current = styles[prop];
    if (isEmptyStyle(current) || current === 'auto' || current === defaultAnimationValues[prop]) {
      styles[prop] = expandShorthand(shorthandProp, shorthand, key);
    }
  });
};

window.getComputedStyle = (element, pseudoElement) => {
  const styles = ogCetComputedStyle(element, pseudoElement);

  applyShorthandLonghands(styles, 'transition', ['duration', 'delay', 'property']);
  applyShorthandLonghands(styles, 'animation', ['duration', 'delay', 'iterationCount']);

  Object.entries(defaultAnimationValues).forEach(([k,v]) => {
    const currentValue = styles[k];
    if (isEmptyStyle(currentValue) || currentValue === "auto") {
      styles[k] = v;
    }
  });

  timeProps.forEach((prop) => {
    styles[prop] = normalizeTimeValues(styles[prop]);
  });

  return styles;
};

/**
 * Inline style polyfill for JSDOM `transition` / `animation` shorthands. Unlike browsers, JSDOM:
 * - does not expand a shorthand set on `element.style` into its longhands (e.g. reading
 *   `style.transitionDuration` after setting `style.transition` returns '')
 * - does not reset the longhands when a shorthand is set
 */
const styleProto = (window.CSSStyleProperties || window.CSSStyleDeclaration).prototype;
const ogGetPropertyValue = window.CSSStyleDeclaration.prototype.getPropertyValue;
const ogRemoveProperty = window.CSSStyleDeclaration.prototype.removeProperty;
const inlineLonghandLookup = {};

const getInlineLonghand = (style, shorthandProp, key, current) => {
  if (current !== '') return current;
  const shorthand = ogGetPropertyValue.call(style, shorthandProp);
  return shorthand ? expandShorthand(shorthandProp, shorthand, key) : current;
};

Object.entries(shorthandLonghandKeys).forEach(([shorthandProp, keys]) => {
  keys.forEach((key) => {
    const camel = toCamelLonghand(shorthandProp, key);
    inlineLonghandLookup[toKebab(camel)] = [shorthandProp, key];

    [camel, toKebab(camel)].forEach((name) => {
      const desc = Object.getOwnPropertyDescriptor(styleProto, name);
      if (!desc || !desc.get) return;
      Object.defineProperty(styleProto, name, {
        ...desc,
        get() {
          return getInlineLonghand(this, shorthandProp, key, desc.get.call(this));
        }
      });
    });
  });

  const desc = Object.getOwnPropertyDescriptor(styleProto, shorthandProp);
  if (desc && desc.set) {
    Object.defineProperty(styleProto, shorthandProp, {
      ...desc,
      set(value) {
        keys.forEach((key) => ogRemoveProperty.call(this, toKebab(toCamelLonghand(shorthandProp, key))));
        desc.set.call(this, value);
      }
    });
  }
});

window.CSSStyleDeclaration.prototype.getPropertyValue = function(name) {
  const current = ogGetPropertyValue.call(this, name);
  const lookup = inlineLonghandLookup[name];
  return lookup ? getInlineLonghand(this, lookup[0], lookup[1], current) : current;
};