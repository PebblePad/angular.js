/* global $: false */
'use strict';

window.jQuery = require("jquery");
window.$ = jQuery;
 describe('jQuery patch', () => {

  var doc = null;
  var divSpy = null;
  var spy1 = null;
  var spy2 = null;

  beforeAll(() => {
    ngInternals.bindJQueryFiredRef.current = false;
    ngInternals.bindJQuery();
  })

   beforeEach(() => {
    divSpy = jest.fn().mockName('div.$destroy');
    spy1 = jest.fn().mockName('span1.$destroy');
    spy2 = jest.fn().mockName('span2.$destroy');
    doc = $('<div><span class=first>abc</span><span class=second>xyz</span></div>');
    doc.find('span.first').on('$destroy', spy1);
    doc.find('span.second').on('$destroy', spy2);
  });

   afterEach(() => {
    expect(divSpy).not.toHaveBeenCalled();

    expect(spy1).toHaveBeenCalled();
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalledTimes(1);
  });

  describe('$destroy event', () => {

    test('should fire on remove()', () => {
      doc.find('span').remove();
    });

    test('should fire on replaceWith()', () => {
      doc.find('span').replaceWith('<b>bla</b>');
    });

    test('should fire on replaceAll()', () => {
      $('<b>bla</b>').replaceAll(doc.find('span'));
    });

    test('should fire on empty()', () => {
      doc.empty();
    });

    test('should fire on html(param)', () => {
      doc.html('abc');
    });

    test('should fire on html(\'\')', () => {
      doc.html('');
    });
  });
});
 describe('jQuery patch eagerness', () => {

  var doc = null;
  var divSpy = null;
  var spy1 = null;
  var spy2 = null;

   beforeEach(() => {
    divSpy = jest.fn().mockName('div.$destroy');
    spy1 = jest.fn().mockName('span1.$destroy');
    spy2 = jest.fn().mockName('span2.$destroy');
    doc = $('<div><span class=first>abc</span><span class=second>xyz</span></div>');
    doc.find('span.first').on('$destroy', spy1);
    doc.find('span.second').on('$destroy', spy2);
  });

   afterEach(() => {
    expect(divSpy).not.toHaveBeenCalled();
    expect(spy1).not.toHaveBeenCalled();
  });

  describe('$destroy event is not invoked in too many cases', () => {

    test('should fire only on matched elements on remove(selector)', () => {
      doc.find('span').remove('.second');
      expect(spy2).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalledTimes(1);
    });

    test('should not fire on html()', () => {
      doc.html();
      expect(spy2).not.toHaveBeenCalled();
    });
  });
});
