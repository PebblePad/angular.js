'use strict';
export class NgComponent {
  constructor() {
    if (window.angular.$$compilationBindings.current !== null) {
      Object.assign(this, window.angular.$$compilationBindings.current);
    }
  }
}
