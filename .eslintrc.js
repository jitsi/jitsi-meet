module.exports = {
    extends: [
        '@jitsi/eslint-config'
    ],
    overrides: [
        {
            files: [ 'vitest.config.mts' ],
            parserOptions: {
                project: './tsconfig.web.json',
                sourceType: 'module'
            }
        }
    ]
};
