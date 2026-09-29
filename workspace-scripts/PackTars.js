import fs, { promises as fsp } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";

const baseDirectory = resolve("dist");
const outputDirectory = resolve("dist-tarballs");
fs.mkdirSync(outputDirectory, { recursive: true });

console.log("Cleaning up previous tarballs: In progress ⌚");
await fsp.rm(outputDirectory, { force: true, recursive: true });
await fsp.mkdir(outputDirectory);
console.log("Cleaning up previous tarballs: Done ✅\n");

const directories = fs.readdirSync(baseDirectory, { withFileTypes: true });

for (const entry of directories) {
  if (!entry.isDirectory()) {
    throw new Error(`Unexpected file found in ${entry.name}. Ensure only angular packages built for distribution exist.`);
  }

  const packageDirectory = join(baseDirectory, entry.name);
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(join(packageDirectory, "package.json"), "utf8"));
  } catch (e) {
    throw new Error(`Failed to find package.json for ${entry.name}. Ensure only angular packages built for distribution exist.`, { cause: e });
  }

  console.log(`Packing ${packageJson.name}@${packageJson.version}: In progress ⌚`);
  const [{ filename }] = JSON.parse(execSync(`npm pack --json --pack-destination "${outputDirectory}"`, { cwd: packageDirectory }).toString());

  console.log(`Packed ${filename}: Done ✅\n`);
}
