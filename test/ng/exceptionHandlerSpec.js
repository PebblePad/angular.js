'use strict';

describe('$exceptionHandler', function() {
  /* global $ExceptionHandlerProvider:false */
  it('should log errors with single argument', function() {
    angular.mock.module(function($provide) {
      $provide.provider('$exceptionHandler', ngInternals.$ExceptionHandlerProvider);
    });
    angular.mock.inject(function($log, $exceptionHandler) {
      $exceptionHandler('myError');
      expect($log.error.logs.shift()).toEqual(['myError']);
    });
  });


  it('should log errors with multiple arguments', function() {
    angular.mock.module(function($provide) {
      $provide.provider('$exceptionHandler', ngInternals.$ExceptionHandlerProvider);
    });
    angular.mock.inject(function($log, $exceptionHandler) {
      $exceptionHandler('myError', 'comment');
      expect($log.error.logs.shift()).toEqual(['myError', 'comment']);
    });
  });
});
