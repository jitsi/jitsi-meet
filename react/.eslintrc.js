module.exports = {
    'extends': [
        '../.eslintrc.js',
        'eslint-config-jitsi/jsdoc',
        'eslint-config-jitsi/react',
        '.eslintrc-react-native.js'
    ],
    'rules': {
        'jsdoc/require-description-complete-sentence': 0,
        'react/no-deprecated': 0
    }
};
