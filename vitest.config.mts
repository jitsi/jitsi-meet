import { defineConfig } from 'vitest/config';

export default defineConfig({
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
        include: [
            'react/**/*.{test,spec}.{ts,tsx}'
        ]
    }
});
