module.exports = {
    'extends': [
        '../.eslintrc.js',
        '@jitsi/eslint-config/flow',
        '@jitsi/eslint-config/jsdoc',
        '@jitsi/eslint-config/react',
        '.eslintrc-react-native.js'
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
