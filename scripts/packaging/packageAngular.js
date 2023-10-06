/* eslint-disable */
const fs = require("fs");
const path = require("path");
const process = require("process");

const basePath = process.cwd();
const packageDir = path.join(basePath, "./dist/angular");
const buildDir = path.join(basePath, "./build");
const version = require("../../build/version.json");

const filesToCopy = [
  "angular.js",
  "angular.min.js",
  "angular.min.js.map",
  "angular-csp.css",
  "ngComponent.js"
];

const indexJs = `require("./angular");\nmodule.exports = angular;`;

const packageJson = {
  name: "angular",
  version: version.full,
  description: "HTML enhanced for web apps",
  main: "index.js",
  scripts: {
    test: "echo \"Error: no test specified\" && exit 1"
  },
  repository: {
    type: "git",
    url: "https://github.com/angular/angular.js.git"
  },
  keywords: [
    "angular",
    "framework",
    "browser",
    "client-side"
  ],
  author: "Angular Core Team <angular-core+npm@google.com>",
  license: "MIT",
  bugs: {
    url: "https://github.com/angular/angular.js/issues"
  },
  homepage: "https://angularjs.org"
};

fs.rmSync(packageDir, { recursive: true, force: true });

fs.mkdirSync(packageDir, { recursive: true });
filesToCopy.forEach((f) => fs.copyFileSync(path.join(buildDir, f), path.join(packageDir, f)));

fs.writeFileSync(path.join(packageDir, "index.js"), indexJs);
fs.writeFileSync(path.join(packageDir, "package.json"), JSON.stringify(packageJson, null, 4));
fs.copyFileSync(path.join(basePath, "LICENSE"), path.join(packageDir, "LICENSE.md"));
