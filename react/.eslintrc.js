module.exports = {
    'extends': [
        '../.eslintrc.js',
        '@jitsi/eslint-config/flow',
        '@jitsi/eslint-config/jsdoc',
        '@jitsi/eslint-config/react',
        '.eslintrc-react-native.js'
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
