const fs = require('fs');
const semver = require('semver');

const packageJSON = require('../package.json');

const SDKPackageJSON = require('./package.json');

// Skip checking these.
const skipDeps = [ 'react', 'react-native' ];

/**
 * Merges the dependency versions from the root package.json with the dependencies of the SDK package.json.
 */
function mergeDependencyVersions() {

    // Updates SDK dependencies to match project dependencies.
    for (const key in SDKPackageJSON.dependencies) {
        if (SDKPackageJSON.dependencies.hasOwnProperty(key)) {
            SDKPackageJSON.dependencies[key] = packageJSON.dependencies[key] || packageJSON.devDependencies[key];
        }
    }

    // Updates SDK peer dependencies.
    for (const key in packageJSON.dependencies) {
        if (SDKPackageJSON.peerDependencies.hasOwnProperty(key) && !skipDeps.includes(key)) {
            SDKPackageJSON.peerDependencies[key] = packageJSON.dependencies[key];
        }
    }

    // Set RN peer dependency.
    const rnVersion = semver.parse(packageJSON.dependencies['react-native']);

    if (!rnVersion) {
        throw new Error('failed to parse React Native version');
    }

    // In RN the "major" version is the Semver minor.
    SDKPackageJSON.peerDependencies['react-native'] = `~0.${rnVersion.minor}.0`;

    // Updates SDK overrides dependencies.
    for (const key in packageJSON.overrides) {
        if (SDKPackageJSON.overrides.hasOwnProperty(key)) {
            SDKPackageJSON.overrides[key] = packageJSON.overrides[key];
        }
    }

    const data = JSON.stringify(SDKPackageJSON, null, 4);

    fs.writeFileSync('package.json', data);
}

mergeDependencyVersions();
