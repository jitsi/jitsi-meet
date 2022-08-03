const fs = require('fs');
const path = require('path');

const packageJSON = require('../package.json');

const {
    androidSourcePath,
    androidTargetPath,
    iosDestPath,
    iosSrcPath
} = require('./constants.ts');
const SDKPackageJSON = require('./package.json');


/**
 * Copies a specified file in a way that recursive copy is possible.
 */
function copyFileSync(source, target) {

    let targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.copyFileSync(source, targetFile);
}


/**
 * Copies a specified directory recursively.
 */
function copyFolderRecursiveSync(source, target) {
    let files = [];
    const targetFolder = path.join(target, path.basename(source));

    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(file => {
            const curSource = path.join(source, file);

            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}

/**
 * Merges the dependency versions from the root package.json with the dependencies of the SDK package.json.
 */
function mergeDependencyVersions() {
    for (const key in SDKPackageJSON.dependencies) {
        if (SDKPackageJSON.dependencies.hasOwnProperty(key)) {
            SDKPackageJSON.dependencies[key] = packageJSON.dependencies[key] || packageJSON.devDependencies[key];
        }
    }
    const data = JSON.stringify(SDKPackageJSON, null, 4);

    fs.writeFileSync('package.json', data);
}

// TODO: put this in a seperate step
mergeDependencyVersions();

copyFolderRecursiveSync(
    '../images',
    '.'
);
copyFolderRecursiveSync(
    '../sounds',
    '.'
);
copyFolderRecursiveSync(
    '../lang',
    '.'
);
copyFolderRecursiveSync(
    '../modules',
    '.'
);
copyFolderRecursiveSync(
    '../react',
    '.'
);
copyFolderRecursiveSync(
    '../service',
    '.'
);
copyFolderRecursiveSync(
    '../ios/sdk/sdk.xcodeproj',
    './ios'
);
copyFolderRecursiveSync(
    `${iosSrcPath}/callkit`,
    iosDestPath
);
copyFolderRecursiveSync(
    `${iosSrcPath}/dropbox`,
    iosDestPath
);
copyFolderRecursiveSync(
    '../ios/sdk/src/picture-in-picture',
    iosDestPath
);
fs.copyFileSync(
    `${iosSrcPath}/AppInfo.m`,
    `${iosDestPath}/AppInfo.m`
);
fs.copyFileSync(
    `${iosSrcPath}/AudioMode.m`,
    `${iosDestPath}/AudioMode.m`
);
fs.copyFileSync(
    `${iosSrcPath}/InfoPlistUtil.m`,
    `${iosDestPath}/InfoPlistUtil.m`
);
fs.copyFileSync(
    `${iosSrcPath}/InfoPlistUtil.h`,
    `${iosDestPath}/InfoPlistUtil.h`
);
fs.copyFileSync(
    `${iosSrcPath}/JavaScriptSandbox.m`,
    `${iosDestPath}/JavaScriptSandbox.m`
);
fs.copyFileSync(
    `${iosSrcPath}/JitsiAudioSession.m`,
    `${iosDestPath}/JitsiAudioSession.m`
);
fs.copyFileSync(
    `${iosSrcPath}/JitsiAudioSession.h`,
    `${iosDestPath}/JitsiAudioSession.h`
);
fs.copyFileSync(
    `${iosSrcPath}/JitsiAudioSession+Private.h`,
    `${iosDestPath}/JitsiAudioSession+Private.h`
);
fs.copyFileSync(
    `${iosSrcPath}/LocaleDetector.m`,
    `${iosDestPath}/LocaleDetector.m`
);
fs.copyFileSync(
    `${iosSrcPath}/POSIX.m`,
    `${iosDestPath}/POSIX.m`
);
fs.copyFileSync(
    `${iosSrcPath}/Proximity.m`,
    `${iosDestPath}/Proximity.m`
);
copyFolderRecursiveSync(
    `${androidSourcePath}/log`,
     `${androidTargetPath}/log`
);
copyFolderRecursiveSync(
    `${androidSourcePath}/net`,
    `${androidTargetPath}/log`
);
fs.copyFileSync(
    `${androidSourcePath}/AndroidSettingsModule.java`,
    `${androidTargetPath}/AndroidSettingsModule.java`
);
fs.copyFileSync(
    `${androidSourcePath}/AppInfoModule.java`,
    `${androidTargetPath}/AppInfoModule.java`
);
fs.copyFileSync(
    `${androidSourcePath}/AudioDeviceHandlerConnectionService.java`,
    `${androidTargetPath}/AudioDeviceHandlerConnectionService.java`
);
fs.copyFileSync(
    `${androidSourcePath}/AudioDeviceHandlerGeneric.java`,
    `${androidTargetPath}/AudioDeviceHandlerGeneric.java`
);
fs.copyFileSync(
    `${androidSourcePath}/AudioModeModule.java`,
    `${androidTargetPath}/AudioModeModule.java`
);
fs.copyFileSync(
    `${androidSourcePath}/ConnectionService.java`,
    `${androidTargetPath}/ConnectionService.java`
);
fs.copyFileSync(
    `${androidSourcePath}/JavaScriptSandboxModule.java`,
    `${androidTargetPath}/JavaScriptSandboxModule.java`
);
fs.copyFileSync(
    `${androidSourcePath}/LocaleDetector.java`,
    `${androidTargetPath}/LocaleDetector.java`
);
fs.copyFileSync(
    `${androidSourcePath}/LogBridgeModule.java`,
    `${androidTargetPath}/LogBridgeModule.java`
);
fs.copyFileSync(
    `${androidSourcePath}/PictureInPictureModule.java`,
    `${androidTargetPath}/PictureInPictureModule.java`
);
fs.copyFileSync(
    `${androidSourcePath}/ProximityModule.java`,
    `${androidTargetPath}/ProximityModule.java`
);
fs.copyFileSync(
    `${androidSourcePath}/RNConnectionService.java`,
    `${androidTargetPath}/RNConnectionService.java`
);
