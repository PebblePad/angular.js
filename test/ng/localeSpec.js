'use strict';
 describe('$locale', () => {
  /* global $LocaleProvider: false */

  var $locale;
  beforeEach(angular.mock.inject(function(_$locale_) {
    $locale = _$locale_;
  }));

  test('should have locale id set to en-us', () => {
    expect($locale.id).toBe('en-us');
  });


  test('should have NUMBER_FORMATS', () => {
    var numberFormats = $locale.NUMBER_FORMATS;
    expect(numberFormats).toBeDefined();
    expect(numberFormats.PATTERNS.length).toBe(2);
    angular.forEach(numberFormats.PATTERNS, function(pattern) {
      expect(pattern.minInt).toBeDefined();
      expect(pattern.minFrac).toBeDefined();
      expect(pattern.maxFrac).toBeDefined();
      expect(pattern.posPre).toBeDefined();
      expect(pattern.posSuf).toBeDefined();
      expect(pattern.negPre).toBeDefined();
      expect(pattern.negSuf).toBeDefined();
      expect(pattern.gSize).toBeDefined();
      expect(pattern.lgSize).toBeDefined();
    });
  });


  test('should have DATETIME_FORMATS', () => {
    var datetime = $locale.DATETIME_FORMATS;
    expect(datetime).toBeDefined();
    expect(datetime.DAY.length).toBe(7);
    expect(datetime.SHORTDAY.length).toBe(7);
    expect(datetime.SHORTMONTH.length).toBe(12);
    expect(datetime.MONTH.length).toBe(12);
    expect(datetime.AMPMS.length).toBe(2);
  });


  test('should return correct plural types', () => {
    expect($locale.pluralCat(-1)).toBe('other');
    expect($locale.pluralCat(0)).toBe('other');
    expect($locale.pluralCat(2)).toBe('other');
    expect($locale.pluralCat(1)).toBe('one');
  });
});
