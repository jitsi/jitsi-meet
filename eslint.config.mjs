import eslintConfigInternxt from '@internxt/eslint-config-internxt';

export default [
    {
        ignores: [
            'build/',
            'doc/',
            'libs/',
            'resources/',
            'react/features/stream-effects/virtual-background/vendor/',
            'react/features/face-landmarks/resources/',
            'actionTypes.ts',
            'react-native-sdk/',
            '*.d.ts',
            'webpack.config.js',
            'tests/'
        ]
    },
    ...eslintConfigInternxt,
    {
        rules: {
            'linebreak-style': ['error', 'unix'],
            'quotes': 'off',
            'max-len': 'warn',
            'no-undef': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-unsafe-function-type': 'warn'
        }
    }
];