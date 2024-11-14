module.exports = {
    'extends': [
        '../.eslintrc.js',
        '@jitsi/eslint-config/jsdoc',
        '@jitsi/eslint-config/react'
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
