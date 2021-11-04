module.exports = {
    'extends': [
        '../.eslintrc.js',
        'eslint-config-jitsi/flow',
        'eslint-config-jitsi/jsdoc',
        'eslint-config-jitsi/react',
        '.eslintrc-react-native.js'
    ],
    'rules': {
        // XXX remove this eventually.
        'react/jsx-indent-props': 0
    }
};
