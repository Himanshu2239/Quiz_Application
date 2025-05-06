// A minimal tsconfig-paths–style resolver for @shared/* imports
const Module = require('module');
const path = require('path');
const fs = require('fs');

const originalRequire = Module.prototype.require;

Module.prototype.require = function (modulePath) {
  // Intercept our path-alias prefix
  if (modulePath.startsWith('@shared/')) {
    // Resolve into dist/shared (or adjust if different)
    const relative = modulePath.replace(/^@shared\//, '');
    const base = path.join(__dirname, '..', 'dist', 'shared', relative);

    // Try .js first
    if (fs.existsSync(base + '.js')) {
      return originalRequire.call(this, base + '.js');
    }
    // Try .ts next (if you ever run TS directly)
    if (fs.existsSync(base + '.ts')) {
      return originalRequire.call(this, base + '.ts');
    }
    // If neither exists, let Node error out
  }

  // Fallback to normal behavior
  return originalRequire.call(this, modulePath);
};
