// babel is used for jest
// FIXME make jest work with webpack if possible?
module.exports = {
    env: {
        test: {
            plugins: [

                // Stage 2
                '@babel/plugin-proposal-export-default-from',
                '@babel/plugin-proposal-export-namespace-from',
                '@babel/plugin-proposal-nullish-coalescing-operator',
                '@babel/plugin-proposal-optional-chaining',

                // Stage 3
                '@babel/plugin-syntax-dynamic-import',
                [ '@babel/plugin-proposal-class-properties', { loose: false } ],
                '@babel/plugin-proposal-json-strings',

                // lib-jitsi-meet
                '@babel/plugin-transform-flow-strip-types'
            ],
            presets: [
                '@babel/env',
                '@babel/preset-flow',
                '@babel/react'
            ]
        }
    }
};
