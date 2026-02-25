// Usage: node check_missing.js --<lang_code>
// Examples: node check_missing.js --hi (Hindi), node check_missing.js --es (Spanish)

const fs = require('fs');
const path = require('path');

// Load available languages from languages.json
const languages = require('./languages.json');

// Parse command line arguments
const args = process.argv.slice(2);
let langCode = 'hi'; // default to Hindi

for (const arg of args) {
  if (arg.startsWith('--') && arg !== '--verbose' && arg !== '-v') {
    langCode = arg.slice(2);
  }
}

// Determine the language file name
let langFile;
if (langCode === 'en') {
  console.log('English is the source language (main.json). Nothing to compare.');
  process.exit(0);
}
langFile = `main-${langCode}.json`;
const langFilePath = path.join(__dirname, langFile);

if (!fs.existsSync(langFilePath)) {
  console.error(`Error: Language file '${langFile}' not found.`);
  console.log('\nAvailable language codes:');
  Object.entries(languages).forEach(([code, name]) => {
    if (code !== 'en') console.log(`  --${code} (${name})`);
  });
  process.exit(1);
}

const main = require('./main.json');
const targetLang = require(langFilePath);

function getKeys(obj, prefix) {
  prefix = prefix || '';
  let keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const mainKeys = new Set(getKeys(main));
const targetKeys = new Set(getKeys(targetLang));

const missing = [...mainKeys].filter(k => !targetKeys.has(k));

console.log(`\n=== Translation Check for ${langFile} ===\n`);
console.log('Missing keys count:', missing.length);
console.log('Total keys in main.json:', mainKeys.size);
console.log(`Total keys in ${langFile}:`, targetKeys.size);
console.log('Coverage:', ((targetKeys.size / mainKeys.size) * 100).toFixed(1) + '%');

console.log('\nMissing top-level sections:');
const missingSections = {};
missing.forEach(k => {
  const section = k.split('.')[0];
  missingSections[section] = (missingSections[section] || 0) + 1;
});
for (const [s, c] of Object.entries(missingSections).sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`  ${s}: ${c} missing`);
}

// Option to show all missing keys
if (args.includes('--verbose') || args.includes('-v')) {
  console.log('\nAll missing keys:');
  missing.sort((a, b) => a.localeCompare(b)).forEach(k => console.log(`  ${k}`));
}
