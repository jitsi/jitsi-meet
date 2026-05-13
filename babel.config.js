/**
 * Babel plugin: rewrites `import('x')` to `Promise.resolve(require('x'))`.
 * The module is loaded synchronously via `require`, but stays wrapped in a
 * Promise so callers' `await` / `.then()` keep working unchanged. Needed
 * because RN's New Architecture can't run Metro's runtime bundle loader for
 * `import()`.
 *
 * @param {Object} babel - Babel API; `types`.
 * @returns {Object} A Babel plugin definition.
 */
function dynamicImportToRequire({ types: t }) {
    return {
        name: 'transform-dynamic-import-to-require',
        visitor: {
            CallExpression(path) {
                if (!t.isImport(path.node.callee)) {
                    return;
                }
                path.replaceWith(
                    t.callExpression(
                        t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
                        [ t.callExpression(t.identifier('require'), path.node.arguments) ]
                    )
                );
            }
        }
    };
}

module.exports = {
    presets: [ 'module:@react-native/babel-preset' ],
    env: {
        production: {
            plugins: [ 'react-native-paper/babel' ]
        }
    },

    // This happens because react native has conflict with @babel/plugin-transform-private-methods plugin
    // https://github.com/ethers-io/ethers.js/discussions/4309#discussioncomment-6694524
    plugins: [
        'optional-require',
        [
            '@babel/plugin-transform-private-methods', {
                'loose': true
            }
        ],
        'react-native-worklets-core/plugin',
        dynamicImportToRequire
    ]
};
