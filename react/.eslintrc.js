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
    },
    parserOptions: {
        parser: '@babel/eslint-parser',
        requireConfigFile: false, // <== ADD THIS
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module' // Allows for the use of imports
    }
};
