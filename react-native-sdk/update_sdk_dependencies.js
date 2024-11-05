const fs = require('fs');

const packageJSON = require('../package.json');

const SDKPackageJSON = require('./package.json');

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
        if (SDKPackageJSON.peerDependencies.hasOwnProperty(key)) {

            // Updates all peer dependencies except react and react-native.
            if (key !== 'react' && key !== 'react-native') {
                SDKPackageJSON.peerDependencies[key] = packageJSON.dependencies[key];
            }
        }
    }

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
