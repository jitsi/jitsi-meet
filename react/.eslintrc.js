module.exports = {
    extends: [
        '../.eslintrc.js',
        '@jitsi/eslint-config/jsdoc',
        '@jitsi/eslint-config/react',
        '.eslintrc-react-native.js'
    ],
    overrides: [
        {
            files: [ '*.ts', '*.tsx' ],
            extends: [ '@jitsi/eslint-config/typescript' ],
            parserOptions: {
                project: [ './tsconfig.web.json', './tsconfig.native.json' ]
            },
            rules: {
                // TODO: Remove these and fix the warnings
                '@typescript-eslint/no-unsafe-function-type': 0,
                '@typescript-eslint/no-wrapper-object-types': 0,
                '@typescript-eslint/no-require-imports': 0
            }
        }
    ],
    settings: {
        react: {
            'version': 'detect'
        }
    }
};
