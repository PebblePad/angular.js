'use strict';

var supportTests = {
  classes: '/^class\\b/.test((class C {}).toString())',
  fatArrows: 'a => a',
  shorthandMethods: '({ fn(x) { return; } })'
};

window.support = {};

for (var prop in supportTests) {
  if (supportTests.hasOwnProperty(prop)) {
    try {
      // eslint-disable-next-line no-eval
      window.support[prop] = !!eval(supportTests[prop]);
    } catch (e) {
      window.support[prop] = false;
    }
  }
}
