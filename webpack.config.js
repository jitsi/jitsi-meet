/* global __dirname */

const process = require('process');

/**
 * The URL of the Jitsi Meet deployment to be proxy to in the context of
 * development with webpack-dev-server.
 */
const devServerProxyTarget
    = process.env.WEBPACK_DEV_SERVER_PROXY_TARGET || 'https://beta.meet.jit.si';

const minimize
    = process.argv.indexOf('-p') !== -1
        || process.argv.indexOf('--optimize-minimize') !== -1;

// The base Webpack configuration to bundle the JavaScript artifacts of
// jitsi-meet such as app.bundle.js and external_api.js.
const config = {
    devServer: {
        https: true,
        inline: true,
        proxy: {
            '/': {
                bypass: devServerProxyBypass,
                secure: false,
                target: devServerProxyTarget
            }
        }
    },
    devtool: 'source-map',
    mode: minimize ? 'production' : 'development',
    module: {
        rules: [ {
            // Transpile ES2015 (aka ES6) to ES5. Accept the JSX syntax by React
            // as well.

            exclude: [
                new RegExp(`${__dirname}/node_modules/(?!js-utils)`)
            ],
            loader: 'babel-loader',
            options: {
                // XXX The require.resolve bellow solves failures to locate the
                // presets when lib-jitsi-meet, for example, is npm linked in
                // jitsi-meet.
                plugins: [
                    require.resolve('@babel/plugin-transform-flow-strip-types'),
                    require.resolve('@babel/plugin-proposal-class-properties'),
                    require.resolve(
                        '@babel/plugin-proposal-export-default-from'),
                    require.resolve(
                        '@babel/plugin-proposal-export-namespace-from')
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
                                chrome: 58,
                                electron: 2,
                                firefox: 54,
                                safari: 11
                            }

                        }
                    ],
                    require.resolve('@babel/preset-flow'),
                    require.resolve('@babel/preset-react')
                ]
            },
            test: /\.jsx?$/
        }, {
            // Expose jquery as the globals $ and jQuery because it is expected
            // to be available in such a form by multiple jitsi-meet
            // dependencies including lib-jitsi-meet.

            loader: 'expose-loader?$!expose-loader?jQuery',
            test: /\/node_modules\/jquery\/.*\.js$/
        }, {
            // Allow CSS to be imported into JavaScript.

            test: /\.css$/,
            use: [
                'style-loader',
                'css-loader'
            ]
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
        sourceMapFilename: `[name].${minimize ? 'min' : 'js'}.map`
    },
    resolve: {
        alias: {
            jquery: `jquery/dist/jquery${minimize ? '.min' : ''}.js`
        },
        aliasFields: [
            'browser'
        ],
        extensions: [
            '.web.js',

            // Webpack defaults:
            '.js',
            '.json'
        ]
    }
};

module.exports = [
    Object.assign({}, config, {
        entry: {
            'app.bundle': './app.js',

            'device_selection_popup_bundle':
                './react/features/settings/popup.js',

            'alwaysontop':
                './react/features/always-on-top/index.js',

            'dial_in_info_bundle': [
                './react/features/invite/components/dial-in-info-page'
            ],

            'do_external_connect':
                './connection_optimization/do_external_connect.js',

            'flacEncodeWorker':
                './react/features/local-recording/'
                    + 'recording/flac/flacEncodeWorker.js',
            'analytics-ga':
                './react/features/analytics/handlers/GoogleAnalyticsHandler.js'
        }
    }),
    Object.assign({}, config, {
        entry: {
            'video-blur-effect':
                './react/features/stream-effects/JitsiStreamBlurEffect.js'
        },
        output: Object.assign({}, config.output, {
            library: [ 'JitsiMeetJS', 'app', 'effects' ],
            libraryTarget: 'window'
        })
    }),

    // The Webpack configuration to bundle external_api.js (aka
    // JitsiMeetExternalAPI).
    Object.assign({}, config, {
        entry: {
            'external_api': './modules/API/external/index.js'
        },
        output: Object.assign({}, config.output, {
            library: 'JitsiMeetExternalAPI',
            libraryTarget: 'umd'
        })
    })
];

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
    if (path.startsWith('/css/') || path.startsWith('/doc/')
            || path.startsWith('/fonts/') || path.startsWith('/images/')
            || path.startsWith('/static/')) {
        return path;
    }

    const configs = module.exports;

    /* eslint-disable array-callback-return, indent */

    if ((Array.isArray(configs) ? configs : Array(configs)).some(c => {
                if (path.startsWith(c.output.publicPath)) {
                    if (!minimize) {
                        // Since webpack-dev-server is serving non-minimized
                        // artifacts, serve them even if the minimized ones are
                        // requested.
                        Object.keys(c.entry).some(e => {
                            const name = `${e}.min.js`;

                            if (path.indexOf(name) !== -1) {
                                // eslint-disable-next-line no-param-reassign
                                path = path.replace(name, `${e}.js`);

                                return true;
                            }
                        });
                    }

                    return true;
                }
            })) {
        return path;
    }

    /* eslint-enable array-callback-return, indent */
}
