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

if (document.currentScript === null) {
  const currentScript = document.createElement('script');
  currentScript.src = location.href;
  Object.defineProperty(document, 'currentScript', { value: currentScript });
}
