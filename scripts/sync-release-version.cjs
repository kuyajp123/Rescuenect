#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const releaseVersion = process.argv[2];
const rootDir = path.resolve(__dirname, '..');
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

if (!releaseVersion || !semverPattern.test(releaseVersion)) {
  throw new Error(`Expected a valid semver release version, received: ${releaseVersion || '<empty>'}`);
}

const versionFiles = [
  'Frontend/package.json',
  'Frontend/package-lock.json',
  'mobile/client/package.json',
  'mobile/client/package-lock.json',
];

const readJson = (relativePath) => {
  const absolutePath = path.join(rootDir, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
};

const writeJson = (relativePath, json) => {
  const absolutePath = path.join(rootDir, relativePath);
  fs.writeFileSync(absolutePath, `${JSON.stringify(json, null, 2)}\n`);
};

for (const relativePath of versionFiles) {
  const json = readJson(relativePath);
  json.version = releaseVersion;

  if (json.packages?.['']) {
    json.packages[''].version = releaseVersion;
  }

  writeJson(relativePath, json);
}

console.log(`Synced frontend and mobile versions to ${releaseVersion}`);
