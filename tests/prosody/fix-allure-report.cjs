// Post-process the generated Allure report to set default sort order to
// "order" (the order tests ran) instead of alphabetical.  Mirrors the same
// hack used in tests/wdio.conf.ts.
'use strict';

const fs = require('fs');
const path = require('path');

const indexFile = path.join(__dirname, 'allure-report', 'index.html');

if (!fs.existsSync(indexFile)) {
    console.warn('fix-allure-report: index.html not found, skipping');
    process.exit(0);
}

const setting = '{"treeSorting":{"sorter":"sorter.order","ascending":true}}';
const script = `<script>localStorage.setItem("ALLURE_REPORT_SETTINGS_SUITES", '${setting}');</script>`;

const content = fs.readFileSync(indexFile, 'utf8');
fs.writeFileSync(indexFile, content.replace('<body>', `<body>${script}`));
