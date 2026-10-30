import Module from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

// Mock window and navigator safely for Node 21+ environments
if (typeof (globalThis as any).window === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
        value: globalThis,
        configurable: true,
        writable: true
    });
}

try {
    Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Node', product: 'Gecko' },
        configurable: true,
        writable: true
    });
} catch {
    // If navigator is already defined and non-configurable, ignore
}

(globalThis as any).location = { href: 'https://meet.jit.si', search: '', hash: '' };
(globalThis as any).interfaceConfig = {};
(globalThis as any).config = {};
(globalThis as any).addEventListener = (globalThis as any).addEventListener || (() => {});
(globalThis as any).removeEventListener = (globalThis as any).removeEventListener || (() => {});

const dummyFn = () => false;
(globalThis as any).JitsiMeetJS = {
    analytics: {},
    util: {
        browser: {
            isChrome: dummyFn,
            isChromiumBased: dummyFn,
            isElectron: dummyFn,
            isFirefox: dummyFn,
            isSafari: dummyFn,
            isWebKitBased: dummyFn,
            isVersionLessThan: dummyFn,
            isUserInteractionRequiredForUnmute: dummyFn
        }
    },
    errors: {
        audioTranslation: {},
        conference: {},
        connection: {},
        track: {
            TRACK_IS_DISPOSED: 'track.track_is_disposed'
        }
    },
    events: {
        conference: {},
        connection: {},
        connectionQuality: {},
        detection: {},
        e2eping: {},
        mediaDevices: {},
        track: {},
        rtcstats: {}
    },
    constants: {
        recording: {
            status: {
                OFF: 'off',
                PENDING: 'pending',
                ON: 'on'
            },
            mode: {
                FILE: 'file',
                STREAM: 'stream'
            },
            error: {}
        },
        trackStreamingStatus: {},
        sipVideoGW: {},
        iceRestartReason: {}
    }
};

// Enable .web.ts, .web.tsx, .web.js resolution for CommonJS / tsx
if (typeof require !== 'undefined' && require.extensions) {
    require.extensions['.web.ts'] = require.extensions['.ts'];
    require.extensions['.web.tsx'] = require.extensions['.tsx'];
    require.extensions['.web.js'] = require.extensions['.js'];
    require.extensions['.svg'] = (module: any) => {
        module.exports = 'svg-mock';
    };
    require.extensions['.png'] = (module: any) => {
        module.exports = 'png-mock';
    };

    try {
        const dompurifyPath = require.resolve('dompurify');
        const mockPurifyInstance = {
            addHook: () => {},
            removeHook: () => {},
            sanitize: (s: any) => s,
            isSupported: true
        };
        const mockDomPurify = () => mockPurifyInstance;
        Object.assign(mockDomPurify, mockPurifyInstance);

        require.cache[dompurifyPath] = {
            id: dompurifyPath,
            filename: dompurifyPath,
            loaded: true,
            exports: mockDomPurify
        } as any;
    } catch {
        // Ignore if dompurify is not resolved
    }
}

// Hook resolveFilename to resolve .web.ts / .web.js before .ts / .js
const originalResolveFilename = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function(request: string, parent: any, isMain: boolean, options: any) {
    if (request.includes('VideoLayout') || request.includes('LargeVideoManager')) {
        return path.resolve(__dirname, 'mockVideoLayout.js');
    }

    if (request.includes('modules/transport')) {
        return path.resolve(__dirname, 'mockTransport.js');
    }

    if (request.endsWith('jaas/functions') || request.endsWith('jaas/functions.ts')) {
        return path.resolve(__dirname, 'mockJaas.js');
    }

    if (request.endsWith('participants/functions') || request.endsWith('participants/functions.ts')
        || (request === './functions' && parent?.filename?.includes('participants'))) {
        return path.resolve(__dirname, 'mockParticipants.js');
    }

    if (request.endsWith('conference/functions') || request.endsWith('conference/functions.ts')
        || (request === './functions' && parent?.filename?.includes('conference'))) {
        return path.resolve(__dirname, 'mockConferenceFunctions.js');
    }

    if (request.startsWith('.')) {
        const parentDir = parent && parent.filename ? path.dirname(parent.filename) : process.cwd();
        const absolutePath = path.resolve(parentDir, request);

        for (const ext of [ '.web.ts', '.web.tsx', '.web.js' ]) {
            if (fs.existsSync(absolutePath + ext)) {
                return originalResolveFilename.call(this, absolutePath + ext, parent, isMain, options);
            }
        }
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
};
