module.exports = {
    'extends': [
        '../.eslintrc.js',
        '@jitsi/eslint-config/jsdoc'
    ],
    'overrides': [
        {
            'files': [ '*.ts', '*.tsx' ],
            extends: [ '@jitsi/eslint-config/typescript' ],
            parserOptions: {
                sourceType: 'module',
                project: [ './tests/tsconfig.json' ]
            }
        }
    ]
};
