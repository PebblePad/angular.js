'use strict';
 describe('$exceptionHandler', () => {
  /* global $ExceptionHandlerProvider:false */
  test('should log errors with single argument', () => {
    angular.mock.module(function($provide) {
      $provide.provider('$exceptionHandler', ngInternals.$ExceptionHandlerProvider);
    });
    angular.mock.inject(function($log, $exceptionHandler) {
      $exceptionHandler('myError');
      expect($log.error.logs.shift()).toEqual(['myError']);
    });
  });


  test('should log errors with multiple arguments', () => {
    angular.mock.module(function($provide) {
      $provide.provider('$exceptionHandler', ngInternals.$ExceptionHandlerProvider);
    });
    angular.mock.inject(function($log, $exceptionHandler) {
      $exceptionHandler('myError', 'comment');
      expect($log.error.logs.shift()).toEqual(['myError', 'comment']);
    });
  });
});
