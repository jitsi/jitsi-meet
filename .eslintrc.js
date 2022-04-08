module.exports = {
    'extends': [
        '@jitsi/eslint-config'
    ],
    'overrides': [
        {
            'files': [ '*.ts', '*.tsx' ],
            'rules': {
                'no-undef': 'off'
            }
        }
    ]
};
