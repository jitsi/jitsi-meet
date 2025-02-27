/// <reference types="vitest" />

import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./react/test/setup.ts"],
        include: ["react/**/*.{test,spec}.{js,ts,jsx,tsx}"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
        },
    },
});
