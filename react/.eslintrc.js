module.exports = {
    'extends': [
        '../.eslintrc.js',
        '@jitsi/eslint-config/flow',
        '@jitsi/eslint-config/jsdoc',
        '@jitsi/eslint-config/react',
        '.eslintrc-react-native.js'
    ],
    'overrides': [
        {
            'files': [ '*.ts', '*.tsx' ],
            parser: '@typescript-eslint/parser',
            rules: {
                'no-undef': 'off',
                'no-use-before-define': 'off',
                '@typescript-eslint/ban-ts-comment': 'off',
                '@typescript-eslint/no-empty-function': 'off',
                '@typescript-eslint/ban-types': 'off',
                '@typescript-eslint/no-explicit-any': 'off',
                'no-prototype-builtins': 'off',
                'no-shadow': 'off',
                '@typescript-eslint/no-shadow': [ 'error' ],
                'typescript-sort-keys/interface': 'error',
                'typescript-sort-keys/string-enum': 'error'
            },
            'plugins': [ '@typescript-eslint', 'typescript-sort-keys' ],
            'extends': [
                'plugin:@typescript-eslint/eslint-recommended',
                'plugin:@typescript-eslint/recommended'
            ]
        }
    ],
    'rules': {
        'flowtype/no-types-missing-file-annotation': 0,

        // XXX remove this eventually.
        'react/jsx-indent-props': 0
    },
    'settings': {
        'flowtype': {
            'onlyFilesWithFlowAnnotation': true
        },
        'react': {
            'version': 'detect'
        }
    }
};
