import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import { vi } from 'vitest';

// Setup file for Vitest test environment in Jitsi Meet
const dummyFn = () => false;

const mockJitsiMeetJS = {
    analytics: {},
    constants: {
        iceRestartReason: {},
        recording: {
            error: {},
            mode: {},
            status: {
                OFF: 'off',
                ON: 'on',
                PENDING: 'pending'
            }
        }
    },
    errors: {
        audioTranslation: {},
        conference: {},
        connection: {},
        track: {}
    },
    events: {
        conference: {},
        connection: {},
        connectionQuality: {},
        detection: {},
        e2eping: {},
        mediaDevices: {},
        track: {}
    },
    mediaDevices: {
        isDeviceListAvailable: dummyFn
    },
    util: {
        browser: {
            isChrome: dummyFn,
            isChromiumBased: dummyFn,
            isElectron: dummyFn,
            isFirefox: dummyFn,
            isSafari: dummyFn,
            isVersionLessThan: dummyFn,
            isWebKitBased: dummyFn
        }
    }
};

(globalThis as any).JitsiMeetJS = mockJitsiMeetJS;

if (typeof window !== 'undefined') {
    (window as any).interfaceConfig = (window as any).interfaceConfig || {};
    (window as any).config = (window as any).config || {};
    (window as any).JitsiMeetJS = mockJitsiMeetJS;

    if (window.location) {
        try {
            window.location.href = 'https://meet.jit.si';
        } catch {
            // Ignore if read-only in some environments
        }
    }
}

// Mock lib-jitsi-meet/_ so any module importing JitsiMeetJS gets the mock
vi.mock('../../react/features/base/lib-jitsi-meet/_', () => ({
    default: mockJitsiMeetJS
}));

// Enable .web.ts / .web.js resolution for dynamic require calls in legacy base code
if (typeof require !== 'undefined' && require.extensions) {
    require.extensions['.web.ts'] = require.extensions['.ts'];
    require.extensions['.web.tsx'] = require.extensions['.tsx'];
    require.extensions['.web.js'] = require.extensions['.js'];
}

const originalResolveFilename = (Module as any)._resolveFilename;

(Module as any)._resolveFilename = function(request: string, parent: any, isMain: boolean, options: any) {
    if (request.startsWith('.')) {
        const parentDir = parent?.filename ? path.dirname(parent.filename) : process.cwd();
        const absolutePath = path.resolve(parentDir, request);

        for (const ext of [ '.web.ts', '.web.tsx', '.web.js' ]) {
            if (fs.existsSync(absolutePath + ext)) {
                return originalResolveFilename.call(this, absolutePath + ext, parent, isMain, options);
            }
        }
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
};
