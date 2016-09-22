import path from 'path';
import process from 'process';
import webpack from 'webpack';

const aui_css
    = path.resolve(__dirname, './node_modules/@atlassian/aui/dist/aui/css/');
const minimize
    = process.argv.indexOf('-p') != -1
        || process.argv.indexOf('--optimize-minimize') != -1;
const strophe = /\/node_modules\/strophe(js-plugins)?\/.*\.js$/;

// The base Webpack configuration to bundle the JavaScript artifacts of
// jitsi-meet such as app.bundle.js and external_api.js.
const config = {
    devtool: 'source-map',
    module: {
        loaders: [{
            // Transpile ES2015 (aka ES6) to ES5.

            exclude: [
                path.resolve(__dirname, './modules/RTC/adapter.screenshare.js'),
                path.resolve(__dirname, './node_modules/')
            ],
            loader: 'babel',
            test: /\.js$/
        },{
            // Expose jquery as the globals $ and jQuery because it is expected
            // to be available in such a form by multiple jitsi-meet
            // dependencies including AUI, lib-jitsi-meet.

            loader: 'expose?$!expose?jQuery',
            test: /\/node_modules\/jquery\/.*\.js$/
        },{
            // Disable AMD for the Strophe.js library or its imports will fail
            // at runtime.

            loader: 'imports?define=>false&this=>window',
            test: strophe
        },{
            // Allow CSS to be imported into JavaScript.

            loaders: [
                'style',
                'css'
            ],
            test: /\.css$/
        },{
            // Emit the static assets of AUI such as images that are referenced
            // by CSS into the output path.

            include: aui_css,
            loader: 'file',
            query: {
                context: aui_css,
                name: '[path][name].[ext]'
            },
            test: /\.(gif|png|svg)$/
        }],
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
        path: path.resolve(__dirname, './build'),
        sourceMapFilename: '[name].' + (minimize ? 'min' : 'js') + '.map'
    },
    resolve: {
        alias: {
            aui:
                '@atlassian/aui/dist/aui/js/aui'
                    + (minimize ? '.min' : '')
                    + '.js',
            'aui-experimental':
                '@atlassian/aui/dist/aui/js/aui-experimental'
                    + (minimize ? '.min' : '')
                    + '.js',
            jquery: 'jquery/dist/jquery' + (minimize ? '.min' : '') + '.js',
            'jQuery-Impromptu':
                'jQuery-Impromptu/dist/jquery-impromptu'
                    + (minimize ? '.min' : '')
                    + '.js',
        },
        packageAlias: 'browser'
    }
};

export default [{
    // The Webpack configuration to bundle app.bundle.js (aka APP).

    ...config,
    entry: {
       'app.bundle': './app.js'
    },
    output: {
        ...config.output,
        library: 'APP'
    }
}, {
    // The Webpack configuration to bundle external_api.js (aka
    // JitsiMeetExternalAPI).

    ...config,
    entry: {
       'external_api': './modules/API/external/external_api.js'
    },
    output: {
        ...config.output,
        library: 'JitsiMeetExternalAPI'
    }
}];
