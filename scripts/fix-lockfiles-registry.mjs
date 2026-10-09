#!/usr/bin/env node
// Rewrites private-registry URLs in lockfiles to the public npm registry.
//
// Some lockfiles in this monorepo were generated against a private proxy
// (`npm.artifacts.furycloud.io`) whose tarball URLs are not reachable in CI or
// for external contributors. This script rewrites `resolved`/tarball URLs in
// place without touching package versions or integrity hashes, so no install is
// required.
//
// Usage:
//   node scripts/fix-lockfiles-registry.mjs          # apply fixes
//   node scripts/fix-lockfiles-registry.mjs --check  # report only; exit 1 if any
//
// This is exposed as `npm run fix:lockfiles` / `npm run check:lockfiles`.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import process from "node:process";

const PRIVATE_HOST = "npm.artifacts.furycloud.io";
const PUBLIC_REGISTRY = "https://registry.npmjs.org/";

// Matches `https://<private-host>/repository/<repo-name>/` prefixes, keeping the
// package path that follows (npm's public registry uses the same layout).
const PRIVATE_URL_PATTERN = new RegExp(
  `https://${PRIVATE_HOST.replace(/\./g, "\\.")}/repository/[^/]+/`,
  "g",
);

const LOCKFILE_NAMES = new Set([
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "out",
  "build",
  "dist",
  "coverage",
  ".turbo",
  ".cache",
]);

const collectLockfiles = async (dir, found = []) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      await collectLockfiles(join(dir, entry.name), found);
    } else if (LOCKFILE_NAMES.has(entry.name)) {
      found.push(join(dir, entry.name));
    }
  }
  return found;
};

const main = async () => {
  const checkOnly = process.argv.includes("--check");
  const root = process.cwd();
  const lockfiles = await collectLockfiles(root);

  let totalReplacements = 0;
  const changed = [];

  for (const file of lockfiles) {
    const original = await readFile(file, "utf8");
    const matches = original.match(PRIVATE_URL_PATTERN);
    if (!matches || matches.length === 0) continue;

    totalReplacements += matches.length;
    changed.push({ file: relative(root, file), count: matches.length });

    if (!checkOnly) {
      await writeFile(
        file,
        original.replace(PRIVATE_URL_PATTERN, PUBLIC_REGISTRY),
        "utf8",
      );
    }
  }

  if (changed.length === 0) {
    console.log(
      `✅ No private-registry URLs found (${lockfiles.length} lockfile(s) scanned).`,
    );
    return;
  }

  const verb = checkOnly ? "Found" : "Fixed";
  console.log(`🔧 ${verb} ${totalReplacements} private-registry URL(s):`);
  for (const { file, count } of changed) {
    console.log(`   ${file}: ${count}`);
  }
  console.log(`   ${PRIVATE_HOST} → registry.npmjs.org`);

  if (checkOnly) {
    console.error(
      "\nRun `npm run fix:lockfiles` to rewrite them to the public registry.",
    );
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
