/* eslint-disable */

const fs = require('fs');
const process = require('process');
const traverse = require('traverse');
const path = require('path');
const mainLang = require('./main.json');

const [targetLangFile] = process.argv.slice(-1);

if (!targetLangFile) {
    console.error('Error: No target language file specified.');
    process.exit(1);
}

const targetLangPath = path.resolve(__dirname, targetLangFile);

if (!fs.existsSync(targetLangPath)) {
    console.error(`Error: The file "${targetLangFile}" does not exist.`);
    process.exit(1);
}

const targetLang = require(targetLangPath);

const paths = traverse(mainLang).reduce((acc, item) => {
    if (this.isLeaf) {
        acc.push(this.path);
    }
    return acc;
}, []);

const result = {};

for (const path of paths) {
    if (traverse(targetLang).has(path)) {
        traverse(result).set(path, traverse(targetLang).get(path));
    } else {
        console.warn(`Warning: ${path.join('.')} is missing in the target language file.`);
        traverse(result).set(path, '');
    }
}

const data = JSON.stringify(result, null, 4);

try {
    fs.writeFileSync(targetLangPath, data + '\n');
    console.log(`Translations successfully updated in "${targetLangFile}".`);
} catch (error) {
    console.error(`Error writing to file "${targetLangFile}":`, error);
    process.exit(1);
}