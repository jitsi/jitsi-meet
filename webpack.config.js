/* global __dirname */

const CircularDependencyPlugin = require('circular-dependency-plugin');
const fs = require('fs');
const { join } = require('path');
const process = require('process');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

/**
 * The URL of the Jitsi Meet deployment to be proxy to in the context of
 * development with webpack-dev-server.
 */
const devServerProxyTarget
    = process.env.WEBPACK_DEV_SERVER_PROXY_TARGET || 'https://alpha.jitsi.net';

/**
 * Build a Performance configuration object for the given size.
 * See: https://webpack.js.org/configuration/performance/
 *
 * @param {Object} options - options for the bundles configuration.
 * @param {boolean} options.analyzeBundle - whether the bundle needs to be analyzed for size.
 * @param {boolean} options.minimize - whether the code should be minimized or not.
 * @param {number} size - the size limit to apply.
 * @returns {Object} a performance hints object.
 */
function getPerformanceHints(options, size) {
    const { analyzeBundle, minimize } = options;

    return {
        hints: minimize && !analyzeBundle ? 'error' : false,
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
 * Determines whether a specific (HTTP) request is to bypass the proxy of
 * webpack-dev-server (i.e. is to be handled by the proxy target) and, if not,
 * which local file is to be served in response to the request.
 *
 * @param {Object} request - The (HTTP) request received by the proxy.
 * @returns {string|undefined} If the request is to be served by the proxy
 * target, undefined; otherwise, the path to the local file to be served.
 */
function devServerProxyBypass({ path }) {
    if (path.startsWith('/css/')
            || path.startsWith('/doc/')
            || path.startsWith('/fonts/')
            || path.startsWith('/images/')
            || path.startsWith('/lang/')
            || path.startsWith('/sounds/')
            || path.startsWith('/static/')
            || path.endsWith('.wasm')) {

        return path;
    }

    if (path.startsWith('/libs/')) {
        if (path.endsWith('.min.js') && !fs.existsSync(join(process.cwd(), path))) {
            return path.replace('.min.js', '.js');
        }

        return path;
    }
}

/**
 * The base Webpack configuration to bundle the JavaScript artifacts of
 * jitsi-meet such as app.bundle.js and external_api.js.
 *
 * @param {Object} options - options for the bundles configuration.
 * @param {boolean} options.detectCircularDeps - whether to detect circular dependencies or not.
 * @param {boolean} options.minimize - whether the code should be minimized or not.
 * @returns {Object} the base config object.
 */
function getConfig(options = {}) {
    const { detectCircularDeps, minimize } = options;

    return {
        devtool: 'source-map',
        mode: minimize ? 'production' : 'development',
        module: {
            rules: [ {
                // Transpile ES2015 (aka ES6) to ES5. Accept the JSX syntax by React
                // as well.

                loader: 'babel-loader',
                options: {
                    // Avoid loading babel.config.js, since we only use it for React Native.
                    configFile: false,

                    // XXX The require.resolve bellow solves failures to locate the
                    // presets when lib-jitsi-meet, for example, is npm linked in
                    // jitsi-meet.
                    plugins: [
                        require.resolve('@babel/plugin-proposal-export-default-from')
                    ],
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
                                }

                            }
                        ],
                        require.resolve('@babel/preset-flow'),
                        require.resolve('@babel/preset-react')
                    ]
                },
                test: /\.jsx?$/
            }, {
                // TODO: get rid of this.
                // Expose jquery as the globals $ and jQuery because it is expected
                // to be available in such a form by lib-jitsi-meet.
                loader: 'expose-loader',
                options: {
                    exposes: [ '$', 'jQuery' ]
                },
                test: require.resolve('jquery')
            }, {
                // Allow CSS to be imported into JavaScript.

                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }, {
                test: /\/node_modules\/@atlaskit\/modal-dialog\/.*\.js$/,
                resolve: {
                    alias: {
                        'react-focus-lock': `${__dirname}/react/features/base/util/react-focus-lock-wrapper.js`,
                        '../styled/Modal': `${__dirname}/react/features/base/dialog/components/web/ThemedDialog.js`
                    }
                }
            }, {
                test: /\/react\/features\/base\/util\/react-focus-lock-wrapper.js$/,
                resolve: {
                    alias: {
                        'react-focus-lock': `${__dirname}/node_modules/react-focus-lock`
                    }
                }
            }, {
                test: /\.svg$/,
                use: [ {
                    loader: '@svgr/webpack',
                    options: {
                        dimensions: false,
                        expandProps: 'start'
                    }
                } ]
            } ]
        },
        node: {
            // Allow the use of the real filename of the module being executed. By
            // default Webpack does not leak path-related information and provides a
            // value that is a mock (/index.js).
            __filename: true
        },
        optimization: {
            concatenateModules: minimize,
            minimize
        },
        output: {
            filename: `[name]${minimize ? '.min' : ''}.js`,
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
        https: true,
        host: '127.0.0.1',
        hot: true,
        proxy: {
            '/': {
                bypass: devServerProxyBypass,
                secure: false,
                target: devServerProxyTarget,
                headers: {
                    'Host': new URL(devServerProxyTarget).host
                }
            }
        },
        static: {
            directory: process.cwd()
        }
    };
}

module.exports = (_env, argv) => {
    const analyzeBundle = Boolean(process.env.ANALYZE_BUNDLE);
    const mode = typeof argv.mode === 'undefined' ? 'production' : argv.mode;
    const isProduction = mode === 'production';
    const configOptions = {
        detectCircularDeps: Boolean(process.env.DETECT_CIRCULAR_DEPS) || !isProduction,
        minimize: isProduction
    };
    const config = getConfig(configOptions);
    const perfHintOptions = {
        analyzeBundle,
        minimize: isProduction
    };

    return [
        Object.assign({}, config, {
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
            performance: getPerformanceHints(perfHintOptions, 4 * 1024 * 1024)
        }),
        Object.assign({}, config, {
            entry: {
                'alwaysontop': './react/features/always-on-top/index.js'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'alwaysontop')
            ],
            performance: getPerformanceHints(perfHintOptions, 800 * 1024)
        }),
        Object.assign({}, config, {
            entry: {
                'dial_in_info_bundle': './react/features/invite/components/dial-in-info-page'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'dial_in_info'),
                new webpack.IgnorePlugin({
                    resourceRegExp: /^\.\/locale$/,
                    contextRegExp: /moment$/
                })
            ],
            performance: getPerformanceHints(perfHintOptions, 500 * 1024)
        }),
        Object.assign({}, config, {
            entry: {
                'do_external_connect': './connection_optimization/do_external_connect.js'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'do_external_connect')
            ],
            performance: getPerformanceHints(perfHintOptions, 5 * 1024)
        }),
        Object.assign({}, config, {
            entry: {
                'flacEncodeWorker': './react/features/local-recording/recording/flac/flacEncodeWorker.js'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'flacEncodeWorker')
            ],
            performance: getPerformanceHints(perfHintOptions, 5 * 1024)
        }),
        Object.assign({}, config, {
            entry: {
                'analytics-ga': './react/features/analytics/handlers/GoogleAnalyticsHandler.js'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'analytics-ga')
            ],
            performance: getPerformanceHints(perfHintOptions, 5 * 1024)
        }),
        Object.assign({}, config, {
            entry: {
                'close3': './static/close3.js'
            },
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'close3')
            ],
            performance: getPerformanceHints(perfHintOptions, 128 * 1024)
        }),

        Object.assign({}, config, {
            entry: {
                'external_api': './modules/API/external/index.js'
            },
            output: Object.assign({}, config.output, {
                library: 'JitsiMeetExternalAPI',
                libraryTarget: 'umd'
            }),
            plugins: [
                ...config.plugins,
                ...getBundleAnalyzerPlugin(analyzeBundle, 'external_api')
            ],
            performance: getPerformanceHints(perfHintOptions, 35 * 1024)
        })
    ];
};
