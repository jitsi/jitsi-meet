const fs = require('fs');
const path = require('path');

const packageJSON = require('../package.json');

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

copyFolderRecursiveSync('../images', '.');
copyFolderRecursiveSync('../sounds', '.');
copyFolderRecursiveSync('../lang', '.');
copyFolderRecursiveSync('../modules', '.');
copyFolderRecursiveSync('../react', '.');
copyFolderRecursiveSync('../service', '.');
copyFolderRecursiveSync('../ios/sdk/sdk.xcodeproj', './ios');
copyFolderRecursiveSync('../ios/sdk/src/callkit', './ios/src');
copyFolderRecursiveSync('../ios/sdk/src/dropbox', './ios/src');
copyFolderRecursiveSync('../ios/sdk/src/picture-in-picture', './ios/src');
fs.copyFileSync('../ios/sdk/src/AppInfo.m', './ios/src/AppInfo.m');
fs.copyFileSync('../ios/sdk/src/AudioMode.m', './ios/src/AudioMode.m');
fs.copyFileSync('../ios/sdk/src/InfoPlistUtil.m', './ios/src/InfoPlistUtil.m');
fs.copyFileSync('../ios/sdk/src/InfoPlistUtil.h', './ios/src/InfoPlistUtil.h');
fs.copyFileSync('../ios/sdk/src/JavaScriptSandbox.m', './ios/src/JavaScriptSandbox.m');
fs.copyFileSync('../ios/sdk/src/JitsiAudioSession.m', './ios/src/JitsiAudioSession.m');
fs.copyFileSync('../ios/sdk/src/JitsiAudioSession.h', './ios/src/JitsiAudioSession.h');
fs.copyFileSync('../ios/sdk/src/JitsiAudioSession+Private.h', './ios/src/JitsiAudioSession+Private.h');
fs.copyFileSync('../ios/sdk/src/LocaleDetector.m', './ios/src/LocaleDetector.m');
fs.copyFileSync('../ios/sdk/src/POSIX.m', './ios/src/POSIX.m');
fs.copyFileSync('../ios/sdk/src/Proximity.m', './ios/src/Proximity.m');
copyFolderRecursiveSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/log',
     './android/src/main/java/org/jitsi/meet/sdk/log');
copyFolderRecursiveSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/net',
    './android/src/main/java/org/jitsi/meet/sdk/net');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/AndroidSettingsModule.java',
    './android/src/main/java/org/jitsi/meet/sdk/AndroidSettingsModule.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/AppInfoModule.java',
    './android/src/main/java/org/jitsi/meet/sdk/AppInfoModule.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/AudioDeviceHandlerConnectionService.java',
    './android/src/main/java/org/jitsi/meet/sdk/AudioDeviceHandlerConnectionService.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/AudioDeviceHandlerGeneric.java',
    './android/src/main/java/org/jitsi/meet/sdk/AudioDeviceHandlerGeneric.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/AudioModeModule.java',
    './android/src/main/java/org/jitsi/meet/sdk/AudioModeModule.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/ConnectionService.java',
    './android/src/main/java/org/jitsi/meet/sdk/ConnectionService.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/JavaScriptSandboxModule.java',
    './android/src/main/java/org/jitsi/meet/sdk/JavaScriptSandboxModule.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/LocaleDetector.java',
    './android/src/main/java/org/jitsi/meet/sdk/LocaleDetector.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/LogBridgeModule.java',
    './android/src/main/java/org/jitsi/meet/sdk/LogBridgeModule.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/PictureInPictureModule.java',
    './android/src/main/java/org/jitsi/meet/sdk/PictureInPictureModule.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/ProximityModule.java',
    './android/src/main/java/org/jitsi/meet/sdk/ProximityModule.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/RNConnectionService.java',
    './android/src/main/java/org/jitsi/meet/sdk/RNConnectionService.java');
fs.copyFileSync(
    '../android/sdk/src/main/java/org/jitsi/meet/sdk/WiFiStatsModule.java',
    './android/src/main/java/org/jitsi/meet/sdk/WiFiStatsModule.java');

