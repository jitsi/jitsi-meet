/* global __dirname, process */

// Checks that every option a URL may override (configWhitelist.ts and the lists
// it concatenates) is typed in the IConfig interface (configType.ts).
//
// Usage: npm run lint:config

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const configDir = path.resolve(__dirname, '../react/features/base/config');
const CONFIG_TYPE = path.join(configDir, 'configType.ts');
const WHITELISTS = [
    path.join(configDir, 'configWhitelist.ts'),
    path.join(configDir, 'extraConfigWhitelist.ts'),
    path.join(configDir, 'isEmbeddedConfigWhitelist.ts')
];

/**
 * Parses a file with the TypeScript compiler.
 *
 * @param {string} file - The path of the file.
 * @returns {ts.SourceFile}
 */
function parse(file) {
    return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

/**
 * Collects the top-level member names of the IConfig interface.
 *
 * @returns {Set<string>}
 */
function collectIConfigKeys() {
    const source = parse(CONFIG_TYPE);
    const iface = source.statements.find(s => ts.isInterfaceDeclaration(s) && s.name.text === 'IConfig');

    if (!iface) {
        throw new Error(`interface IConfig not found in ${CONFIG_TYPE}`);
    }

    return new Set(iface.members.map(member => member.name?.text).filter(Boolean));
}

/**
 * Collects the top-level option names whitelisted for URL overrides. Dotted
 * entries such as `p2p.enabled` count as `p2p`.
 *
 * @returns {Set<string>}
 */
function collectWhitelistKeys() {
    const keys = new Set();

    for (const file of WHITELISTS) {
        const source = parse(file);
        const exported = source.statements.find(ts.isExportAssignment);

        if (!exported) {
            throw new Error(`no default export found in ${file}`);
        }

        // The default export may be an array literal or `[...].concat(...)`;
        // walk the expression and take every string in an array literal.
        (function visit(node) {
            if (ts.isArrayLiteralExpression(node)) {
                for (const element of node.elements) {
                    if (ts.isStringLiteralLike(element)) {
                        keys.add(element.text.split('.')[0]);
                    }
                }
            }
            ts.forEachChild(node, visit);
        })(exported.expression);
    }

    return keys;
}

const iconfig = collectIConfigKeys();
const missing = [ ...collectWhitelistKeys() ].filter(key => !iconfig.has(key)).sort();

if (missing.length) {
    console.error('Whitelisted options missing from IConfig in react/features/base/config/configType.ts:');
    missing.forEach(key => console.error(`    ${key}`));
    process.exitCode = 1;
}
