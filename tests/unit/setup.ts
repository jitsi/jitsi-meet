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

// Hook resolveFilename to resolve .web.ts / .web.js before .ts / .js
const originalResolveFilename = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function(request: string, parent: any, isMain: boolean, options: any) {
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
