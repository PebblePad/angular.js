import { promises as fsp } from "fs";
import { dirname } from "path";
import { minify } from "@swc/core"
import { modules } from "./config/Modules.js";
import { version } from "./config/Version.js";

const buildForTestEnv = process.argv.slice(2).some((a) => a === "--test");
const fileWrapperKey = buildForTestEnv ? "test" : "dist";
const outputDirectory = buildForTestEnv ? "./test/.build" : "./dist";
//TODO: VERSION! - NG_VERSION_FULL replacements or manual?

console.log("Cleaning up previous build: In progress ⌚");
await fsp.rm(outputDirectory, { force: true, recursive: true });
console.log("Cleaning up previous build: Done ✅");

console.log("Building all modules: In progress");
const packageJsonTemplate = JSON.parse(await fsp.readFile("workspace-scripts/templates/package.json", "utf8"));
const licenseTemplate = await fsp.readFile("./LICENSE", "utf8");

await Promise.all(modules.map(buildModule));
console.log("Building all modules: Done ✅");

async function buildModule(moduleDetails) {
  console.log(` ↳ Building ${moduleDetails.name}: In progress ⌚`);
  const directoryPath = `${outputDirectory}/${moduleDetails.name}`;
  await fsp.mkdir(directoryPath, { recursive: true });

  const modulePackageJson = structuredClone(packageJsonTemplate);
  modulePackageJson.name = moduleDetails.name;
  modulePackageJson.description = moduleDetails.description;
  modulePackageJson.main = moduleDetails.jsFiles.length === 0 ? "" : `${moduleDetails.jsFiles[0].name}.js`;
  modulePackageJson.version = version;

  await Promise.all([
    buildModuleFiles(moduleDetails, directoryPath),
    copyModuleFiles(moduleDetails, directoryPath),
    fsp.writeFile(`${directoryPath}/package.json`, JSON.stringify(modulePackageJson, null, 4), "utf8"),
    fsp.writeFile(`${directoryPath}/LICENSE.md`, licenseTemplate, "utf8"),
  ]);

  console.log(` ↳ Building ${moduleDetails.name}: Done ✅`);
}

async function buildModuleFiles(moduleDetails, directoryPath) {
  for (const file of moduleDetails.jsFiles) {
    const fileReads = [];
    const segments = file.segments;

    if (file.prefix[fileWrapperKey] !== null) {
      segments.unshift(file.prefix[fileWrapperKey]);
    }

    if (file.suffix[fileWrapperKey] !== null) {
      segments.push(file.suffix[fileWrapperKey]);
    }

    for (const segment of segments) {
      fileReads.push(fsp.readFile(segment, "utf8"));
    }

    const fileContents = await Promise.all(fileReads);
    const srcContent = fileContents.join("");

    const minified = await minify(srcContent, {
      format: {
        comments: "some",
      },
      module: !!file.module,
      sourceMap: true,
      ...file.minify
    })

    const baseFilename = `${directoryPath}/${file.name}`;
    return Promise.all([
      fsp.writeFile(`${baseFilename}.js`, srcContent, "utf8"),
      fsp.writeFile(`${baseFilename}.min.js`, minified.code, "utf8"),
      fsp.writeFile(`${baseFilename}.min.js.map`, minified.map, "utf8")
    ]);
  }
}

function copyModuleFiles(moduleDetails, directoryPath) {
  const copyPromises = moduleDetails.copy.map((toCopy) => {
    const destination = `${directoryPath}/${toCopy.to}`;
    if (/\.[a-z0-9]{1,20}$/i.test(toCopy.from)) {
      return copyFile(toCopy.from, destination)
    }

    return fsp.cp(toCopy.from, destination, { force: true, recursive: true });
  })

  return Promise.all(copyPromises);
}

async function copyFile(sourcePath, destinationPath) {
  try {
    await fsp.copyFile(sourcePath, destinationPath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    const destinationDirectory = dirname(destinationPath);
    await fsp.mkdir(destinationDirectory, { recursive: true });
    await fsp.copyFile(sourcePath, destinationPath);
  }
}
