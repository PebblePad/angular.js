export const modules = [
  {
    name: "angular",
    description: "HTML enhanced for web apps",
    copy: [
      {
        from: "css/angular.css",
        to: "angular-csp.css"
      }
    ],
    jsFiles: [
      {
        name: "angular",
        module: false,
        segments: [
          "src/angular.prefix",
          "src/es6Bindings/compilationBindings.js",
          "src/minErr.js",
          "src/Angular.js",
          "src/loader.js",
          "src/shallowCopy.js",
          "src/stringify.js",
          "src/AngularPublic.js",
          "src/jqLite.js",
          "src/apis.js",
          "src/auto/injector.js",
          "src/ng/anchorScroll.js",
          "src/ng/animate.js",
          "src/ng/animateRunner.js",
          "src/ng/animateCss.js",
          "src/ng/browser.js",
          "src/ng/cacheFactory.js",
          "src/ng/compile.js",
          "src/ng/controller.js",
          "src/ng/document.js",
          "src/ng/exceptionHandler.js",
          "src/ng/forceReflow.js",
          "src/ng/http.js",
          "src/ng/httpBackend.js",
          "src/ng/interpolate.js",
          "src/ng/interval.js",
          "src/ng/jsonpCallbacks.js",
          "src/ng/locale.js",
          "src/ng/location.js",
          "src/ng/log.js",
          "src/ng/parse.js",
          "src/ng/q.js",
          "src/ng/raf.js",
          "src/ng/rootScope.js",
          "src/ng/rootElement.js",
          "src/ng/sanitizeUri.js",
          "src/ng/sce.js",
          "src/ng/sniffer.js",
          "src/ng/templateRequest.js",
          "src/ng/testability.js",
          "src/ng/timeout.js",
          "src/ng/urlUtils.js",
          "src/ng/window.js",
          "src/ng/cookieReader.js",
          "src/ng/filter.js",
          "src/ng/filter/filter.js",
          "src/ng/filter/filters.js",
          "src/ng/filter/limitTo.js",
          "src/ng/filter/orderBy.js",
          "src/ng/directive/directives.js",
          "src/ng/directive/a.js",
          "src/ng/directive/attrs.js",
          "src/ng/directive/form.js",
          "src/ng/directive/input.js",
          "src/ng/directive/ngBind.js",
          "src/ng/directive/ngChange.js",
          "src/ng/directive/ngClass.js",
          "src/ng/directive/ngCloak.js",
          "src/ng/directive/ngController.js",
          "src/ng/directive/ngCsp.js",
          "src/ng/directive/ngEventDirs.js",
          "src/ng/directive/ngIf.js",
          "src/ng/directive/ngInclude.js",
          "src/ng/directive/ngInit.js",
          "src/ng/directive/ngList.js",
          "src/ng/directive/ngModel.js",
          "src/ng/directive/ngModelOptions.js",
          "src/ng/directive/ngNonBindable.js",
          "src/ng/directive/ngOptions.js",
          "src/ng/directive/ngPluralize.js",
          "src/ng/directive/ngRepeat.js",
          "src/ng/directive/ngShowHide.js",
          "src/ng/directive/ngStyle.js",
          "src/ng/directive/ngSwitch.js",
          "src/ng/directive/ngTransclude.js",
          "src/ng/directive/script.js",
          "src/ng/directive/select.js",
          "src/ng/directive/validators.js",
          "src/angular.bind.js",
          "src/publishExternalApis.js",
          "prebuilt-locales/angular-locale_en-us.js",
          "src/angular.suffix"
        ]
      },
      {
        name: "ngComponent",
        module: true,
        segments: [
          'src/es6Bindings/ngComponent.js'
        ],
      }
    ]
  },
  {
    name: "angular-animate",
    description: "AngularJS module for animations",
    copy: [],
    jsFiles: [
      {
        name: "angular-animate",
        module: false,
        segments: [
          "src/angular.prefix",
          'src/ngAnimate/shared.js',
          'src/ngAnimate/rafScheduler.js',
          'src/ngAnimate/animateChildrenDirective.js',
          'src/ngAnimate/animateCss.js',
          'src/ngAnimate/animateCssDriver.js',
          'src/ngAnimate/animateJs.js',
          'src/ngAnimate/animateJsDriver.js',
          'src/ngAnimate/animateQueue.js',
          'src/ngAnimate/animation.js',
          'src/ngAnimate/ngAnimateSwap.js',
          'src/ngAnimate/module.js',
          "src/angular.suffix"
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-cookies",
    description: "AngularJS module for cookies",
    copy: [],
    jsFiles: [
      {
        name: "angular-cookies",
        module: false,
        segments: [
          "src/angular.prefix",
          'src/ngCookies/cookies.js',
          'src/ngCookies/cookieStore.js',
          'src/ngCookies/cookieWriter.js',
          "src/angular.suffix"
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-message-format",
    description: "AngularJS module for plural and gender MessageFormat extensions $interpolate/interpolations",
    copy: [],
    jsFiles: [
      {
        name: "angular-message-format",
        module: false,
        segments: [
          "src/angular.prefix",
          'src/ngMessageFormat/messageFormatCommon.js',
          'src/ngMessageFormat/messageFormatSelector.js',
          'src/ngMessageFormat/messageFormatInterpolationParts.js',
          'src/ngMessageFormat/messageFormatParser.js',
          'src/ngMessageFormat/messageFormatService.js',
          "src/angular.suffix"
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-messages",
    description: "AngularJS module that provides enhanced support for displaying messages within templates",
    copy: [],
    jsFiles: [
      {
        name: "angular-messages",
        module: false,
        segments: [
          "src/angular.prefix",
          'src/ngMessages/messages.js',
          "src/angular.suffix"
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-parse-ext",
    description: "AngularJS ngParseExt module",
    copy: [],
    jsFiles: [
      {
        name: "angular-parse-ext",
        minify: {
          compress: {
            conditionals: false,
            if_return: false,
          }
        },
        module: false,
        segments: [
          "src/angular.prefix",
          'src/ngParseExt/ucd.js',
          'src/ngParseExt/module.js',
          "src/angular.suffix",
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-resource",
    description: "AngularJS module for interacting with RESTful server-side data sources",
    copy: [],
    jsFiles: [
      {
        name: "angular-resource",
        module: false,
        segments: [
          'src/ngResource/resource.js'
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-route",
    description: "AngularJS router module",
    copy: [],
    jsFiles: [
      {
        name: "angular-route",
        module: false,
        segments: [
          "src/angular.prefix",
          'src/shallowCopy.js',
          'src/ngRoute/route.js',
          'src/ngRoute/routeParams.js',
          'src/ngRoute/directive/ngView.js',
          "src/angular.suffix"
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-sanitize",
    description: "AngularJS module for sanitizing HTML",
    copy: [],
    jsFiles: [
      {
        name: "angular-sanitize",
        module: false,
        segments: [
          "src/angular.prefix",
          'src/ngSanitize/sanitize.js',
          'src/ngSanitize/filter/linky.js',
          "src/angular.suffix"
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-mocks",
    description: "AngularJS mocks for testing",
    copy: [],
    jsFiles: [
      {
        name: "angular-mocks",
        module: false,
        segments: [
          "src/angular.prefix",
          'src/ngMock/angular-mocks.js',
          'src/ngMock/browserTrigger.js',
          "src/angular.suffix"
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-touch",
    description: "AngularJS module for touch events and helpers for touch-enabled devices",
    copy: [],
    jsFiles: [
      {
        name: "angular-touch",
        module: false,
        segments: [
          "src/angular.prefix",
          'src/ngTouch/touch.js',
          'src/ngTouch/swipe.js',
          'src/ngTouch/directive/ngClick.js',
          'src/ngTouch/directive/ngSwipe.js',
          "src/angular.suffix"
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-aria",
    description: "AngularJS module for making accessibility easy",
    copy: [],
    jsFiles: [
      {
        name: "angular-aria",
        module: false,
        segments: [
          "src/angular.prefix",
          'src/ngAria/aria.js',
          "src/angular.suffix"
        ],
      }
    ],
    peerDependencies: ["angular"]
  },
  {
    name: "angular-i18n",
    description: "AngularJS module for internationalization",
    copy: [
      {
        from: "prebuilt-locales",
        to: "./"
      }
    ],
    jsFiles: []
  },
];
