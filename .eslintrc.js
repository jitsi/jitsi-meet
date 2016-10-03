module.exports = {
    'env': {
        'browser': true,
        'commonjs': true,
        'es6': true
    },
    'extends': 'eslint:recommended',
    'globals': {
        // The globals that (1) are accessed but not defined within many of our
        // files, (2) are certainly defined, and (3) we would like to use
        // without explicitly specifying them (using a comment) inside of our
        // files.
        '__filename': false
    },
    'parserOptions': {
        'ecmaFeatures': {
            'experimentalObjectRestSpread': true
        },
        'sourceType': 'module'
    },
    'rules': {
        'new-cap': [
            'error',
            {
                'capIsNew': false // Behave like JSHint's newcap.
            }
        ],
        // While it is considered a best practice to avoid using methods on
        // console in JavaScript that is designed to be executed in the browser
        // and ESLint includes the rule among its set of recommended rules, (1)
        // the general practice is to strip such calls before pushing to
        // production and (2) we prefer to utilize console in lib-jitsi-meet
        // (and jitsi-meet).
        'no-console': 'off',
        'semi': 'error'
    }
};
