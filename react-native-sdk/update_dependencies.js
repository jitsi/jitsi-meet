/* eslint-disable guard-for-in */

const fs = require('fs');

const packageJSON = require('../../package.json');

const RNSDKpackageJSON = require('./package.json');

/**
 * Updates dependencies from the app package.json with the peer dependencies of the RNSDK package.json.
 */
function updateDependencies() {
    let updated = false;

    for (const key in RNSDKpackageJSON.peerDependencies) {
        if (!packageJSON.dependencies.hasOwnProperty(key)) {
            packageJSON.dependencies[key]
                = '*' || RNSDKpackageJSON.peerDependencies[key];
            updated = true;
        }
    }

    if (!updated) {
        return;
    }

    packageJSON.dependencies = Object.keys(packageJSON.dependencies)
        .sort()
        .reduce((item, itemKey) => {
            item[itemKey] = packageJSON.dependencies[itemKey];

            return item;
        }, {});

    console.log(
        'Updating dependencies:',
        Object.keys(packageJSON.dependencies)
    );

    const data = JSON.stringify(packageJSON, null, 2);

    fs.writeFileSync('../../package.json', data);

    console.log(
        'All needed dependencies have been updated. \nPlease run npm install.'
    );
}

updateDependencies();
