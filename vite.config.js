import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { exec } from 'child_process';
import { visualizer } from 'rollup-plugin-visualizer';
import { promisify } from 'util';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { defineConfig } from 'vite';

// Static files to copy to build root (dest: ".")
const ROOT_FILES = [
    'fonts',
    'images', 
    'lang',
    'sounds',
    '_unlock',
    'LICENSE',
    'manifest.json',
    'pwa-worker.js',
    'resources/*.txt',
    'config.js',
    'interface_config.js',
    'node_modules/@matrix-org/olm/olm.wasm',
    'node_modules/@jitsi/rnnoise-wasm/dist/rnnoise.wasm',
    'react/features/stream-effects/virtual-background/vendor/tflite/*.wasm',
    'node_modules/@tensorflow/tfjs-backend-wasm/dist/*.wasm',
    'node_modules/@vladmandic/human-models/models/{blazeface-front.bin,blazeface-front.json,emotion.bin,emotion.json}',
];

// Static files to copy to build/static folder
const STATIC_FILES = [
    'static/pwa'
];

// Files to copy to build/libs folder
const LIB_FILES = [
    'node_modules/lib-jitsi-meet/dist/umd/lib-jitsi-meet.*',
    'react/features/stream-effects/virtual-background/vendor/models/*.tflite',
];

/**
 * Simple SSI processing function
 * @param {string} content - The content to process
 * @param {number} depth - Current recursion depth
 * @param {Set<string>} includedFiles - Set of already included files to prevent cycles
 * @param {string} baseDir - Base directory for resolving relative paths (for relative includes)
 * @param {string} rootDir - Project root directory for resolving absolute includes ("/path")
 * @returns {string} The processed content with SSI directives resolved
 */
function processSSI(content, depth = 0, includedFiles = new Set(), baseDir = process.cwd(), rootDir = process.cwd()) {
    const MAX_DEPTH = 10; // Increased depth for more complex includes

    // SSI patterns to handle
    const patterns = [
        // Include directive: <!--#include virtual="/path/to/file" -->
        /<!--#include\s+virtual="([^"]+)"\s*-->/g,
        // Echo directive: <!--# echo var="variable" default="defaultValue" -->
        /<!--#\s+echo\s+var="([^"]+)"(?:\s+default="([^"]*)")?\s*-->/g
    ];

    let result = content;

    if (depth >= MAX_DEPTH) {
        console.warn(`SSI processing reached max depth of ${MAX_DEPTH}, stopping recursion`);
        return result;
    }

    // Process include directives
    result = result.replace(patterns[0], (fullMatch, includePath) => {
        try {
            // Handle absolute ("/...") as relative to project root, and relative otherwise
            const absolutePath = includePath.startsWith('/')
                ? path.join(rootDir, includePath.slice(1))
                : path.resolve(baseDir, includePath);

            if (includedFiles.has(absolutePath)) {
                console.warn(`SSI circular include detected: ${includePath}`);
                return '<!-- SSI circular include detected -->';
            }

            if (fs.existsSync(absolutePath)) {
                const fileContent = fs.readFileSync(absolutePath, 'utf8');
                includedFiles.add(absolutePath);

                // Recursively process the included file
                const processedContent = processSSI(
                    fileContent,
                    depth + 1,
                    includedFiles,
                    path.dirname(absolutePath),
                    rootDir
                );
                return processedContent;
            } else {
                console.warn(`SSI include file not found: ${absolutePath}`);
                return '<!-- SSI include file not found -->';
            }
        } catch (err) {
            console.error(`SSI include error for ${includePath}:`, err);
            return `<!-- SSI error: ${err.message} -->`;
        }
    });

    // Process echo directives (for environment variables or placeholders)
    result = result.replace(patterns[1], (fullMatch, varName, defaultValue = '') => {
        // TODO: For now, we'll just return the default value or empty string
        // In a real implementation, you might want to resolve actual environment variables
        return defaultValue || '';
    });

    return result;
}

/**
 * SSI middleware usable in both dev and preview servers.
 * - For dev: reads HTML from project root and runs transformIndexHtml
 * - For preview: reads HTML from build outDir and serves processed output
 */
function createSSIMiddleware(server, isPreview = false) {
    const projectRoot = server.config.root;
    const htmlRoot = isPreview
        ? path.resolve(projectRoot, server.config.build.outDir || 'dist')
        : projectRoot;

    return (req, res, next) => {
        // Only handle GET requests that are likely HTML documents
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
        }

        const url = (req.originalUrl || req.url || '/').split('#')[0];
        const pathname = url.split('?')[0];

        // Heuristics: handle root, directories, and explicit .html files
        const wantsHtml = pathname === '/' || pathname.endsWith('/') || pathname.endsWith('.html') || (req.headers.accept || '').includes('text/html');
        if (!wantsHtml) {
            return next();
        }

        let candidatePath = pathname;
        if (candidatePath === '/') {
            candidatePath = '/index.html';
        } else if (candidatePath.endsWith('/')) {
            candidatePath = candidatePath + 'index.html';
        } else if (!path.extname(candidatePath)) {
            candidatePath = candidatePath + '.html';
        }

        const filePath = path.join(htmlRoot, candidatePath.replace(/^\//, ''));
        if (!fs.existsSync(filePath)) {
            return next();
        }

        (async () => {
            try {
                const raw = fs.readFileSync(filePath, 'utf8');
                const processed = processSSI(
                    raw,
                    0,
                    new Set(),
                    path.dirname(filePath),
                    htmlRoot
                );

                if (!isPreview) {
                    // Let Vite inject HMR and transform HTML in dev
                    const transformed = await server.transformIndexHtml(candidatePath, processed);
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    res.statusCode = 200;
                    res.end(transformed);
                    return;
                }

                // Preview: serve processed HTML as-is
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.statusCode = 200;
                res.end(processed);
            } catch (err) {
                console.error('SSI middleware error:', err);
                next(err);
            }
        })();
    };
}

/**
 * Plugin to run deploy-local.sh script
 */
function deployLocalPlugin(options = {}) {
    const {
        scriptPath = './deploy-local.sh',
        timeout = 300000 // 5 minutes timeout
    } = options;

    return {
        name: 'vite-plugin-deploy-local',

        async writeBundle() {
            try {
                const execAsync = promisify(exec);
                const scriptFullPath = path.resolve(process.cwd(), scriptPath);
                if (fs.existsSync(scriptFullPath)) {
                    const stats = fs.statSync(scriptFullPath);
                    if (stats.isFile()) {
                        // Check if script is executable (Unix-like systems)
                        const isExecutable = process.platform === 'win32' || 
                            (stats.mode & parseInt('111', 8)) !== 0;

                        if (isExecutable) {
                            const { stdout, stderr } = await execAsync(scriptFullPath, {
                                cwd: process.cwd(),
                                timeout
                            });
                            stdout && console.log('Deploy script output:', stdout);
                            stderr && console.warn('Deploy script warnings:', stderr);
                        }
                    }
                }
            } catch (error) {
                console.error('Error running deploy local script:', error.message);
            }
        }
    };
}

export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production';
    const analyzeBundle = Boolean(process.env.ANALYZE_BUNDLE);
    const detectCircularDeps = Boolean(process.env.DETECT_CIRCULAR_DEPS)

    return {
        plugins: [
            basicSsl({
                name: 'jitsi-meet',
                domains: [ 'localhost', '127.0.0.1', '::1' ],
                certDir: './build/certs'
            }),
            svgr({
                svgrOptions: {
                    dimensions: false,
                    expandProps: 'start'
                },
                include: '**/*.svg',
                exclude: ''
            }),
            react(),
            {
                name: 'vite-middleware-custom-ssi',
                configureServer(server) {
                    server.middlewares.use(createSSIMiddleware(server, false));
                },
                configurePreviewServer(server) {
                    server.middlewares.use(createSSIMiddleware(server, true));
                }
            },
            ...(analyzeBundle ? [
                visualizer({
                    filename: './build/app-stats.html',
                    open: true,
                    gzipSize: true,
                    brotliSize: true
                }),
            ] : []),
            ...(isProduction ? [
                deployLocalPlugin({
                    scriptPath: './deploy-local.sh',
                }),
                viteStaticCopy({
                    structured: false,
                    targets: [
                        // Root files
                        ...ROOT_FILES.map(src => ({ src, dest: '.', overwrite: 'error' })),
                        // Static files
                        ...STATIC_FILES.map(src => ({ src, dest: 'static', overwrite: 'error' })),
                        // Library files
                        ...LIB_FILES.map(src => ({ src, dest: 'libs', overwrite: 'error' })),
                        {
                            src: `node_modules/@jitsi/excalidraw/dist/excalidraw-assets${isProduction ? '' : '-dev'}`,
                            dest: 'libs',
                            overwrite: 'error'
                        },
                    ]
                }),
            ] : []),
        ],

        define: {
            '__DEV__': !isProduction,
            // Provide process for browser compatibility
            global: 'globalThis',
            'process.env': '{}',
            'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
            // Define APP and other globals
            'APP': 'window.APP',
            'JitsiMeetJS': 'window.JitsiMeetJS',
            'config': 'window.config',
            'interfaceConfig': 'window.interfaceConfig',
        },

        resolve: {
            alias: {
                'focus-visible': 'focus-visible/dist/focus-visible.min.js',
            },
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

        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: [
                        'legacy-js-api',
                        'import',
                        'global-builtin',
                        'color-functions',
                        'slash-div'
                    ]
                }
            }
        },

        server: {
            open: true,
        },

        // Configure worker and worklet handling
        worker: {
            format: 'es'
        },

        // Handle module resolution fallbacks
        build: {
            outDir: 'build',
            sourcemap: true,
            rollupOptions: {
                input: [
                    'index.html',
                    'static/404.html',
                    'static/close.html',
                    'static/close2.html', 
                    'static/close3.html',
                    'static/dialInInfo.html',
                    'static/msredirect.html',
                    'static/oauth.html',
                    'static/offline.html',
                    'static/planLimit.html',
                    'static/prejoin.html',
                    'static/recommendedBrowsers.html',
                    'static/whiteboard.html'
                ],
            },
        },
    };
});
