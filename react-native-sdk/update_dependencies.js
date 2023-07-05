/* eslint-disable guard-for-in */
/* global __dirname */

const fs = require('fs');
const path = require('path');

const pathToPackageJSON = path.resolve(__dirname, '../../../package.json');

const packageJSON = require(pathToPackageJSON);

const RNSDKpackageJSON = require(path.resolve(__dirname, './package.json'));

/**
 * Updates dependencies from the app package.json with the peer dependencies of the RNSDK package.json.
 */
function updateDependencies() {
    let updated = false;

    for (const key in RNSDKpackageJSON.peerDependencies) {
        if (!packageJSON.dependencies.hasOwnProperty(key)) {
            packageJSON.dependencies[key] = RNSDKpackageJSON.peerDependencies[key];
            updated = true;
        }
    }

    if (!updated) {
        return;
    }

    console.log(`
=========================
The following dependencies were added to your package.json:
\n
${Object.keys(packageJSON.dependencies)}
\n
Make sure you run npm install
If you are building for ios run cd ios && pod install to link them.
=========================
`);

    packageJSON.dependencies = Object.keys(packageJSON.dependencies)
        .sort()
        .reduce((item, itemKey) => {
            item[itemKey] = packageJSON.dependencies[itemKey];

            return item;
        }, {});

    const data = JSON.stringify(packageJSON, null, 2);

    fs.writeFileSync(pathToPackageJSON, data);

    console.log(
        'All needed dependencies have been updated. \nPlease run npm install.'
    );
}

updateDependencies();
