module.exports = {
    'extends': [
        '../.eslintrc.js'
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
