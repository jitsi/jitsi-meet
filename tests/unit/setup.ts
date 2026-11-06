import Module from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

// Mock window and navigator safely for Node environments
if (typeof (globalThis as any).window === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
        value: globalThis,
        configurable: true,
        writable: true
    });
}

const storageMap = new Map();
(globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
    clear: () => storageMap.clear(),
    key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
    get length() { return storageMap.size; }
};
(globalThis as any).window.localStorage = (globalThis as any).localStorage;

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
}

// Hook resolveFilename to resolve .web.ts / .web.js before .ts / .js and mock heavyweight UI dependencies
const originalResolveFilename = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function(request: string, parent: any, isMain: boolean, options: any) {
    const req = request.replace(/\\/g, '/');

    if (req.includes('dompurify')) {
        return path.resolve(__dirname, 'mockDomPurify.js');
    }

    if (req.includes('VideoLayout') || req.includes('LargeVideoManager')) {
        return path.resolve(__dirname, 'mockVideoLayout.js');
    }

    if (req.includes('modules/transport')) {
        return path.resolve(__dirname, 'mockTransport.js');
    }

    if (req.includes('conference/actions') || (req === './actions' && parent?.filename?.includes('conference'))) {
        return path.resolve(__dirname, 'mockConferenceActions.js');
    }

    if (req.includes('connection/actions')) {
        return path.resolve(__dirname, 'mockConferenceActions.js');
    }

    if (req.includes('notifications/actions')) {
        return path.resolve(__dirname, 'mockConferenceActions.js');
    }

    if (req.includes('participants/actions')) {
        return path.resolve(__dirname, 'mockConferenceActions.js');
    }

    if (req.includes('media/actions')) {
        return path.resolve(__dirname, 'mockConferenceActions.js');
    }

    if (req.includes('app/functions')) {
        return path.resolve(__dirname, 'mockConferenceActions.js');
    }

    if (req.includes('transcribing/functions')) {
        return path.resolve(__dirname, 'mockConferenceActions.js');
    }

    if (req.includes('participants/functions')) {
        return path.resolve(__dirname, 'mockParticipants.js');
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
