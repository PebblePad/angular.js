'use strict';
 describe('$$rAF', () => {
  test('should queue and block animation frames', angular.mock.inject(function($$rAF) {
    if (!$$rAF.supported) return;

    var message;
    $$rAF(function() {
      message = 'yes';
    });

    expect(message).toBeUndefined();
    $$rAF.flush();
    expect(message).toBe('yes');
  }));

  test('should provide a cancellation method', angular.mock.inject(function($$rAF) {
    if (!$$rAF.supported) return;

    var present = true;
    var cancel = $$rAF(function() {
      present = false;
    });

    expect(present).toBe(true);
    cancel();

    try {
      $$rAF.flush();
    } catch (e) { /* empty */ }
    expect(present).toBe(true);
  }));

  describe('$timeout fallback', () => {
    test('it should use a $timeout incase native rAF isn\'t supported', () => {
      var timeoutSpy = jest.fn().mockName('callback');

      //we need to create our own injector to work around the ngMock overrides
      var injector = angular.injector(['ng', function($provide) {
        $provide.value('$timeout', timeoutSpy);
        $provide.value('$window', {
          location: window.location
        });
      }]);

      var $$rAF = injector.get('$$rAF');
      expect($$rAF.supported).toBe(false);

      var message;
      $$rAF(function() {
        message = 'on';
      });

      expect(message).toBeUndefined();
      expect(timeoutSpy).toHaveBeenCalled();

      timeoutSpy.mock.lastCall[0]();

      expect(message).toBe('on');
    });
  });

  describe('mocks', () => {
    test('should throw an error if no frames are present', angular.mock.inject(function($$rAF) {
      if ($$rAF.supported) {
        var failed = false;
        try {
          $$rAF.flush();
        } catch (e) {
          failed = true;
        }
        expect(failed).toBe(true);
      }
    }));
  });

  describe('mobile', () => {
    test('should provide a cancellation method for an older version of Android', () => {
      //we need to create our own injector to work around the ngMock overrides
      var injector = angular.injector(['ng', function($provide) {
        $provide.value('$window', {
          location: window.location,
          history: window.history,
          webkitRequestAnimationFrame: jest.fn().mockName('$window.webkitRequestAnimationFrame'),
          webkitCancelRequestAnimationFrame: jest.fn().mockName('$window.webkitCancelRequestAnimationFrame')
        });
      }]);

      var $$rAF = injector.get('$$rAF');
      var $window = injector.get('$window');
      var cancel = $$rAF(function() {});

      expect($$rAF.supported).toBe(true);

      try {
        cancel();
      } catch (e) { /* empty */ }

      expect($window.webkitCancelRequestAnimationFrame).toHaveBeenCalled();
    });
  });
});
