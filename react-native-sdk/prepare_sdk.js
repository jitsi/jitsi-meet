const fs = require('fs');
const path = require('path');


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
 * @param {string} source Source directory.
 * @param {string} num2 The second number.
 */
function copyFolderRecursiveSync(source, target) {
    let files = [];
    const targetFolder = path.join(target, path.basename(source));

    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
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
copyFolderRecursiveSync('../ios/sdk/src/AppInfo.m', './ios/src');


