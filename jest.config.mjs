const jestConfig = {
  roots: [
    "<rootDir>/test",
  ],
  testRegex: "(Spec|Specs)\\.js$",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: [
    '<rootDir>/test/setup/browserStubs.js',
    '<rootDir>/test/setup/config.js',
    '<rootDir>/test/modules/no_bootstrap.js',
    '<rootDir>/test/helpers/support.js',
    '<rootDir>/test/.build/angular/angular.js',
    '<rootDir>/test/.build/angular-animate/angular-animate.js',
    '<rootDir>/test/.build/angular-message-format/angular-message-format.js',
    '<rootDir>/test/.build/angular-messages/angular-messages.js',
    '<rootDir>/test/.build/angular-cookies/angular-cookies.js',
    '<rootDir>/test/.build/angular-resource/angular-resource.js',
    '<rootDir>/test/.build/angular-route/angular-route.js',
    '<rootDir>/test/.build/angular-sanitize/angular-sanitize.js',
    '<rootDir>/test/.build/angular-mocks/angular-mocks.js',
    '<rootDir>/test/.build/angular-touch/angular-touch.js',
    '<rootDir>/test/.build/angular-aria/angular-aria.js',
    '<rootDir>/test/helpers/matchers.js',
    '<rootDir>/test/helpers/privateMocks.js',
    '<rootDir>/test/helpers/testabilityPatch.js',

  ]
}

export default jestConfig
