/* global __dirname */

require('babel-polyfill'); // Define Object.assign() from ES6 in ES5.

var HasteResolverPlugin = require('haste-resolver-webpack-plugin');
var process = require('process');
var webpack = require('webpack');

var aui_css = __dirname + '/node_modules/@atlassian/aui/dist/aui/css/';
var minimize
    = process.argv.indexOf('-p') !== -1
        || process.argv.indexOf('--optimize-minimize') !== -1;
var node_modules = __dirname + '/node_modules/';
var plugins = [
    new HasteResolverPlugin()
];
var strophe = /\/node_modules\/strophe(js-plugins)?\/.*\.js$/;

if (minimize) {
    // XXX Webpack's command line argument -p is not enough. Further
    // optimizations are made possible by the use of DefinePlugin and NODE_ENV
    // with value 'production'. For example, React takes advantage of these.
    plugins.push(new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: JSON.stringify('production')
        }
    }));
}

// The base Webpack configuration to bundle the JavaScript artifacts of
// jitsi-meet such as app.bundle.js and external_api.js.
var config = {
    devtool: 'source-map',
    module: {
        loaders: [ {
            // Transpile ES2015 (aka ES6) to ES5. Accept the JSX syntax by React
            // as well.

            exclude: node_modules,
            loader: 'babel',
            query: {
                // XXX The require.resolve bellow solves failures to locate the
                // presets when lib-jitsi-meet, for example, is npm linked in
                // jitsi-meet. The require.resolve, of course, mandates the use
                // of the prefix babel-preset- in the preset names.
                presets: [
                    'babel-preset-es2015',
                    'babel-preset-react',
                    'babel-preset-stage-1'
                ].map(require.resolve)
            },
            test: /\.jsx?$/
        }, {
            // Expose jquery as the globals $ and jQuery because it is expected
            // to be available in such a form by multiple jitsi-meet
            // dependencies including AUI, lib-jitsi-meet.

            loader: 'expose?$!expose?jQuery',
            test: /\/node_modules\/jquery\/.*\.js$/
        }, {
            // Disable AMD for the Strophe.js library or its imports will fail
            // at runtime.

            loader: 'imports?define=>false&this=>window',
            test: strophe
        }, {
            // Allow CSS to be imported into JavaScript.

            loaders: [
                'style',
                'css'
            ],
            test: /\.css$/
        }, {
            // Emit the static assets of AUI such as images that are referenced
            // by CSS into the output path.

            include: aui_css,
            loader: 'file',
            query: {
                context: aui_css,
                name: '[path][name].[ext]'
            },
            test: /\.(gif|png|svg)$/
        }, {
            // Enable the import of JSON files.

            loader: 'json',
            exclude: node_modules,
            test: /\.json$/
        } ],
        noParse: [

            // Do not parse the files of the Strophe.js library or at least
            // parts of the properties of the Strophe global variable will be
            // missing and strophejs-plugins will fail at runtime.
            strophe
        ]
    },
    node: {
        // Allow the use of the real filename of the module being executed. By
        // default Webpack does not leak path-related information and provides a
        // value that is a mock (/index.js).
        __filename: true
    },
    output: {
        filename: '[name]' + (minimize ? '.min' : '') + '.js',
        libraryTarget: 'umd',
        path: __dirname + '/build',
        sourceMapFilename: '[name].' + (minimize ? 'min' : 'js') + '.map'
    },
    plugins: plugins,
    resolve: {
        alias: {
            jquery: 'jquery/dist/jquery' + (minimize ? '.min' : '') + '.js'
        },
        packageAlias: 'browser'
    }
};

module.exports = [

    // The Webpack configuration to bundle app.bundle.js (aka APP).
    Object.assign({}, config, {
        entry: {
            'app.bundle': './app.js'
        },
        output: Object.assign({}, config.output, {
            library: 'APP'
        })
    }),

    // The Webpack configuration to bundle external_api.js (aka
    // JitsiMeetExternalAPI).
    Object.assign({}, config, {
        entry: {
            'external_api': './modules/API/external/external_api.js'
        },
        output: Object.assign({}, config.output, {
            library: 'JitsiMeetExternalAPI'
        })
    })
];
