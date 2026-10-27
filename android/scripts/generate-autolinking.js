/* global __dirname, process */

// Writes the RN autolinking manifest outside android/build, so `gradle clean`
// and F-Droid's build-dir cleanup keep it. LIBRE_BUILD filtering is baked in.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Keep in sync with libreExcludedModules in android/settings.gradle.
const LIBRE_EXCLUDED_MODULES = [
    '@amplitude/analytics-react-native',
    '@giphy/react-native-sdk',
    '@react-native-google-signin/google-signin'
];

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'node_modules/.jitsi/autolinking.json');
const config = JSON.parse(execFileSync('npx', [ 'react-native', 'config' ], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
}));

// Same truthy values as Groovy's String.toBoolean().
if (/^\s*(true|y|1)\s*$/i.test(process.env.LIBRE_BUILD ?? '')) {
    LIBRE_EXCLUDED_MODULES.forEach(name => delete config.dependencies[name]);
    config.libreBuild = true;
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(config, null, 2));
