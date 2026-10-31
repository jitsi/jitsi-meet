/* global __dirname */

const path = require('node:path');
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
    resolve: {
        alias: [
            {
                find: /.*modules\/UI\/videolayout\/(VideoLayout|LargeVideoManager)/,
                replacement: path.resolve(__dirname, 'tests/unit/mockVideoLayout.js')
            }
        ],
        extensions: [
            '.web.js',
            '.web.ts',
            '.web.tsx',
            '.tsx',
            '.ts',
            '.js',
            '.json'
        ]
    },
    test: {
        environment: 'happy-dom',
        globals: true,
        include: [
            'tests/unit/**/*.{test,spec}.ts',
            'react/**/*.{test,spec}.{ts,tsx}'
        ],
        setupFiles: [
            './tests/unit/setup.ts'
        ]
    }
});
