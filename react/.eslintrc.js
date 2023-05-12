module.exports = {
    'extends': [
        '../.eslintrc.js',
        '@jitsi/eslint-config/jsdoc',
        '@jitsi/eslint-config/react',
        '.eslintrc-react-native.js'
    ],
    'overrides': [
        {
            'files': [ '*.ts', '*.tsx' ],
            extends: [ '@jitsi/eslint-config/typescript' ],
            parserOptions: {
                sourceType: 'module',
                project: [ './tsconfig.web.json', './tsconfig.native.json' ]
            },
            rules: {
                '@typescript-eslint/naming-convention': [
                    'error',
                    {
                        'selector': 'interface',
                        'format': [ 'PascalCase' ],
                        'custom': {
                            'regex': '^I[A-Z]',
                            'match': true
                        }
                    }
                ]
            }
        }
    ],
    'rules': {
        // XXX remove this eventually.
        'react/jsx-indent-props': 0
    },
    'settings': {
        'react': {
            'version': 'detect'
        }
    }
};
