/* global __dirname */

const CircularDependencyPlugin = require('circular-dependency-plugin');
const fs = require('fs');
const { join, resolve } = require('path');
const process = require('process');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

/**
 * Build a Performance configuration object for the given size.
 * See: https://webpack.js.org/configuration/performance/
 *
 * @param {Object} options - options for the bundles configuration.
 * @param {boolean} options.analyzeBundle - whether the bundle needs to be analyzed for size.
 * @param {boolean} options.isProduction - whether this is a production build or not.
 * @param {number} size - the size limit to apply.
 * @returns {Object} a performance hints object.
 */
function getPerformanceHints(options, size) {
    const { analyzeBundle, isProduction } = options;

    return {
        hints: isProduction && !analyzeBundle ? 'error' : false,
        maxAssetSize: size,
        maxEntrypointSize: size
    };
}

/**
 * Build a BundleAnalyzerPlugin plugin instance for the given bundle name.
 *
 * @param {boolean} analyzeBundle - whether the bundle needs to be analyzed for size.
 * @param {string} name - the name of the bundle.
 * @returns {Array} a configured list of plugins.
 */
function getBundleAnalyzerPlugin(analyzeBundle, name) {
    if (!analyzeBundle) {
        return [];
    }

    return [ new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true,
        statsFilename: `${name}-stats.json`
    }) ];
}

/**
 * Simple SSI processing function
 * @param {string} html - The HTML content to process
 * @param {number} depth - Current recursion depth
 * @param {Set<string>} includedFiles - Set of already included files to prevent cycles
 * @returns {string} The processed HTML with SSI directives resolved
 */
function processSSI(html, depth = 0, includedFiles = new Set()) {
    const MAX_DEPTH = 3;

    // Basic SSI implementation - handles <!--#include virtual="/path/to/file" -->
    const ssiPattern = /<!--#include\s+virtual="([^"]+)"\s*-->/g;
    let result = html;

    if (depth >= MAX_DEPTH) {
        console.warn(`SSI processing reached max depth of ${MAX_DEPTH}, stopping recursion`);

        return result;
    }

    result = result.replace(ssiPattern, (fullMatch, includePath) => {
        try {
            const absolutePath = join(process.cwd(), includePath);

            if (includedFiles.has(absolutePath)) {
                console.warn(`SSI circular include detected: ${absolutePath}`);

                return '<!-- SSI circular include detected -->';
            }

            // console.log(`SSI processing: ${includePath} -> ${absolutePath}`);
            if (fs.existsSync(absolutePath)) {
                const content = fs.readFileSync(absolutePath, 'utf8');

                includedFiles.add(absolutePath);

                return processSSI(content, depth + 1, includedFiles);
            }
            console.warn(`SSI include file not found: ${absolutePath}`);

            return '<!-- SSI include file not found -->';
        } catch (err) {
            console.error(`SSI include error for ${includePath}:`, err);

            return `<!-- SSI error: ${err.message} -->`;
        }
    });

    return result;
}

/**
 * The base Webpack configuration to bundle the JavaScript artifacts of
 * jitsi-meet such as app.bundle.js and external_api.js.
 *
 * @param {Object} options - options for the bundles configuration.
 * @param {boolean} options.detectCircularDeps - whether to detect circular dependencies or not.
 * @param {boolean} options.isProduction - whether this is a production build or not.
 * @returns {Object} the base config object.
 */
function getConfig(options = {}) {
    const { detectCircularDeps, isProduction } = options;

    return {
        devtool: isProduction ? 'source-map' : 'eval-source-map',
        mode: isProduction ? 'production' : 'development',
        module: {
            rules: [ {
                // Transpile ES2015 (aka ES6) to ES5. Accept the JSX syntax by React
                // as well.

                loader: 'babel-loader',
                options: {
                    // Avoid loading babel.config.js, since we only use it for React Native.
                    configFile: false,

                    presets: [
                        [
                            require.resolve('@babel/preset-env'),

                            // Tell babel to avoid compiling imports into CommonJS
                            // so that webpack may do tree shaking.
                            {
                                modules: false,

                                // Specify our target browsers so no transpiling is
                                // done unnecessarily. For browsers not specified
                                // here, the ES2015+ profile will be used.
                                targets: {
                                    chrome: 80,
                                    electron: 10,
                                    firefox: 68,
                                    safari: 14
                                },

                                // Consider stage 3 proposals which are implemented by some browsers already.
                                shippedProposals: true,

                                // Detect usage of modern JavaScript features and automatically polyfill them
                                // with core-js.
                                useBuiltIns: 'usage',

                                // core-js version to use, must be in sync with the version in package.json.
                                corejs: '3.40'
                            }
                        ],
                        require.resolve('@babel/preset-react')
                    ]
                },
                test: /\.(j|t)sx?$/,
                exclude: /node_modules/
            }, {
                // Allow CSS to be imported into JavaScript.

                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }, {
                test: /\.svg$/,
                use: [ {
                    loader: '@svgr/webpack',
                    options: {
                        dimensions: false,
                        expandProps: 'start'
                    }
                } ]
            }, {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                options: {
                    configFile: 'tsconfig.web.json',
                    transpileOnly: !isProduction // Skip type checking for dev builds.,
                }
            } ]
        },
        node: {
            // Allow the use of the real filename of the module being executed. By
            // default Webpack does not leak path-related information and provides a
            // value that is a mock (/index.js).
            __filename: true
        },
        optimization: {
            concatenateModules: isProduction,
            minimize: isProduction
        },
        output: {
            filename: `[name]${isProduction ? '.min' : ''}.js`,
            path: `${__dirname}/build`,
            publicPath: '/libs/',
            sourceMapFilename: '[file].map'
        },
        plugins: [
            detectCircularDeps
                && new CircularDependencyPlugin({
                    allowAsyncCycles: false,
                    exclude: /node_modules/,
                    failOnError: false
                })
        ].filter(Boolean),
        resolve: {
            alias: {
                'focus-visible': 'focus-visible/dist/focus-visible.min.js'
            },
            aliasFields: [
                'browser'
            ],
            extensions: [
                '.web.js',
                '.web.ts',
                '.web.tsx',

                // Typescript:
                '.tsx',
                '.ts',

                // Webpack defaults:
                '.js',
                '.json'
            ],
            fallback: {
                // Provide some empty Node modules (required by AtlasKit, olm).
                crypto: false,
                fs: false,
                path: false,
                process: false
            }
        }
    };
}

/**
 * Helper function to build the dev server config. It's necessary to split it in
 * Webpack 5 because only one devServer entry is supported, so we attach it to
 * the main bundle.
 *

 * @returns {Object} the dev server configuration.
 */
function getDevServerConfig() {
    return {
        client: {
            overlay: {
                errors: true,
                warnings: false
            }
        },
        host: '::',
        hot: true,
        setupMiddlewares: (middlewares, devServer) => {
            if (!devServer) {
                throw new Error('webpack-dev-server is not defined');
            }

            // Middleware 1: Handle .min.js fallback to .js in /libs/ directory
            devServer.app.use((req, res, next) => {
                const urlPath = req.url.split('?')[0];

                if (urlPath.startsWith('/libs/') && urlPath.endsWith('.min.js')) {
                    if (!fs.existsSync(join(process.cwd(), urlPath))) {
                        req.url = urlPath.replace('.min.js', '.js');
                    }
                }
                next();
            });

            // Middleware 2: Handle SPA fallback to index.html
            devServer.app.use((req, res, next) => {
                const urlPath = req.url.split('?')[0].split('#')[0]; // Remove query params and hash
                const pathName = urlPath === '/' ? '/' : urlPath.replace(/\/$/, ''); // Normalize path

                // Skip assets, existing files, and special paths
                if (urlPath.match(/\.(js|css|map|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
                    return next();
                }
                const filePath = join(process.cwd(), pathName);

                if (
                    pathName === '/'
                    || pathName === '/index.html'
                    || !fs.existsSync(filePath)
                    || fs.statSync(filePath).isDirectory()
                ) {
                    req.url = '/index.html';
                }
                next();
            });

            // Middleware 3: Apply SSI for html files
            devServer.app.use((req, res, next) => {
                const urlPath = req.url.split('?')[0];
                const filePath = join(process.cwd(), urlPath);

                if (!urlPath.endsWith('.html')) {
                    return next();
                }

                // If the file exists, read it, process SSI, and send the result
                if (fs.existsSync(filePath)) {
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');

                        res.setHeader('Content-Type', 'text/html');
                        res.send(processSSI(content));
                    } catch (err) {
                        next();
                    }
                } else {
                    next();
                }
            });

            return middlewares;
        },
        server: process.env.CODESPACES ? 'http' : 'https',
        static: {
            directory: process.cwd(),
            watch: {
                ignored: file => file.endsWith('.log')
            }
        }
    };
}

module.exports = (_env, argv) => {
    const analyzeBundle = Boolean(process.env.ANALYZE_BUNDLE);
    const mode = typeof argv.mode === 'undefined' ? 'production' : argv.mode;
    const isProduction = mode === 'production';
    const configOptions = {
        detectCircularDeps: Boolean(process.env.DETECT_CIRCULAR_DEPS),
        isProduction
    };
    const config = getConfig(configOptions);
    const perfHintOptions = {
        analyzeBundle,
        isProduction
    };

    return [
        { ...config,
            entry: {
                'app.bundle': './app.js'
            },
            devServer: isProduction ? {} : getDevServerConfig(),
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'app'),
                new webpack.IgnorePlugin({
                    resourceRegExp: /^canvas$/,
                    contextRegExp: /resemblejs$/
                }),
                new webpack.IgnorePlugin({
                    resourceRegExp: /^\.\/locale$/,
                    contextRegExp: /moment$/
                }),
                new webpack.ProvidePlugin({
                    process: 'process/browser'
                })
            ],

            performance: getPerformanceHints(perfHintOptions, 5 * 1024 * 1024) },
        { ...config,
            entry: {
                'alwaysontop': './react/features/always-on-top/index.tsx'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'alwaysontop')
            ],
            performance: getPerformanceHints(perfHintOptions, 800 * 1024) },
        { ...config,
            entry: {
                'close3': './static/close3.js'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'close3')
            ],
            performance: getPerformanceHints(perfHintOptions, 128 * 1024) },

        { ...config,
            entry: {
                'external_api': './modules/API/external/index.js'
            },
            output: { ...config.output,
                library: 'JitsiMeetExternalAPI',
                libraryTarget: 'umd' },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'external_api')
            ],
            performance: getPerformanceHints(perfHintOptions, 95 * 1024) },
        { ...config,
            entry: {
                'face-landmarks-worker': './react/features/face-landmarks/faceLandmarksWorker.ts'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'face-landmarks-worker')
            ],
            performance: getPerformanceHints(perfHintOptions, 1024 * 1024 * 2) },
        { ...config, /**
             * The NoiseSuppressorWorklet is loaded in an audio worklet which doesn't have the same
             * context as a normal window, (e.g. self/window is not defined).
             * While running a production build webpack's boilerplate code doesn't introduce any
             * audio worklet "unfriendly" code however when running the dev server, hot module replacement
             * and live reload add javascript code that can't be ran by the worklet, so we explicitly ignore
             * those parts with the null-loader.
             * The dev server also expects a `self` global object that's not available in the `AudioWorkletGlobalScope`,
             * so we replace it.
             */
            entry: {
                'noise-suppressor-worklet':
                    './react/features/stream-effects/noise-suppression/NoiseSuppressorWorklet.ts'
            },

            module: { rules: [
                ...config.module.rules,
                {
                    test: resolve(__dirname, 'node_modules/webpack-dev-server/client'),
                    loader: 'null-loader'
                }
            ] },
            plugins: [
            ],
            performance: getPerformanceHints(perfHintOptions, 1024 * 1024 * 2),

            output: {
                ...config.output,

                globalObject: 'AudioWorkletGlobalScope'
            } },

        { ...config,
            entry: {
                'screenshot-capture-worker': './react/features/screenshot-capture/worker.ts'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'screenshot-capture-worker')
            ],
            performance: getPerformanceHints(perfHintOptions, 30 * 1024) }
    ];
};
