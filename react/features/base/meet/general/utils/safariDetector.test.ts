import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isSafari } from "./safariDetector";

describe("isSafari", () => {
    const originalWindow = global.window;
    const originalNavigator = global.navigator;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        global.window = originalWindow;
        global.navigator = originalNavigator;
    });

    describe("Environment Detection", () => {
        it("When window is undefined, then it should return false", () => {
            // @ts-ignore
            delete global.window;

            const result = isSafari();

            expect(result).toBe(false);
        });
    });

    describe("Safari Detection by User Agent", () => {
        it("When user agent contains Safari but not Chrome/Chromium, then it should return true", () => {
            global.window = {
                navigator: {
                    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15"
                }
            } as any;

            const result = isSafari();

            expect(result).toBe(true);
        });

        it("When user agent contains Safari and Chrome, then it should return false", () => {
            global.window = {
                navigator: {
                    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            } as any;

            const result = isSafari();

            expect(result).toBe(false);
        });

        it("When user agent contains Safari and Chromium, then it should return false", () => {
            global.window = {
                navigator: {
                    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chromium/120.0.0.0 Safari/537.36"
                }
            } as any;

            const result = isSafari();

            expect(result).toBe(false);
        });
    });

    describe("Safari Detection by Features", () => {
        it("When window has safari property, then it should return true", () => {
            global.window = {
                navigator: {
                    userAgent: "Mozilla/5.0 (compatible; TestAgent/1.0)"
                },
                safari: {}
            } as any;

            const result = isSafari();

            expect(result).toBe(true);
        });

        it("When window has webkitAudioContext but not chrome, then it should return true", () => {
            global.window = {
                navigator: {
                    userAgent: "Mozilla/5.0 (compatible; TestAgent/1.0)"
                },
                webkitAudioContext: function() {}
            } as any;

            const result = isSafari();

            expect(result).toBe(true);
        });

        it("When window has webkitAudioContext and chrome, then it should return false", () => {
            global.window = {
                navigator: {
                    userAgent: "Mozilla/5.0 (compatible; TestAgent/1.0)"
                },
                webkitAudioContext: function() {},
                chrome: {}
            } as any;

            const result = isSafari();

            expect(result).toBe(false);
        });
    });

    describe("Combined Detection", () => {
        it("When neither user agent nor features indicate Safari, then it should return false", () => {
            global.window = {
                navigator: {
                    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0"
                }
            } as any;

            const result = isSafari();

            expect(result).toBe(false);
        });


    })
});