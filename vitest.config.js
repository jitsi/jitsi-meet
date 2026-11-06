const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
    resolve: {
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
