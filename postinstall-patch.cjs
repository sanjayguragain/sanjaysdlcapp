/**
 * postinstall-patch.cjs
 *
 * Patches vscode-jsonrpc inside @github/copilot-sdk to add missing `exports`
 * subpaths ("./node" and "./node.js") required by Node.js v22+ ESM resolution.
 * Without this, `import … from "vscode-jsonrpc/node"` fails with
 * ERR_PACKAGE_PATH_NOT_EXPORTED.
 *
 * Runs automatically via the "postinstall" npm lifecycle hook in package.json.
 */

const fs = require("fs");
const path = require("path");

const pkgPath = path.join(
  __dirname,
  "node_modules",
  "@github",
  "copilot-sdk",
  "node_modules",
  "vscode-jsonrpc",
  "package.json"
);

if (!fs.existsSync(pkgPath)) {
  // SDK not installed — skip silently
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

// Only patch if the exports field is missing or incomplete
if (!pkg.exports || !pkg.exports["./node"]) {
  pkg.exports = {
    ".": { import: "./lib/node/main.js", require: "./lib/node/main.js" },
    "./node": { import: "./node.js", require: "./node.js" },
    "./node.js": { import: "./node.js", require: "./node.js" },
    "./browser": { import: "./browser.js", require: "./browser.js" },
    "./browser.js": { import: "./browser.js", require: "./browser.js" },
  };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("[postinstall-patch] Patched vscode-jsonrpc exports for Node.js ESM compatibility");
} else {
  console.log("[postinstall-patch] vscode-jsonrpc already patched — skipping");
}
