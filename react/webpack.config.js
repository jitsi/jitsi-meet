var WebPack = require('webpack');
var HtmlPlugin = require('html-webpack-plugin');
var HasteResolver = require('haste-resolver-webpack-plugin');

module.exports = {
    output: {
        filename: 'bundle.js',
        path: __dirname + '/dist',
        publicPath: '/'
    },
    cache: true,
    debug: true,
    devtool: 'source-map',
    entry: {
        app: __dirname + '/index.web.js'
    },
    plugins: [
        new HasteResolver({
            platform: 'web'
        }),
        new HtmlPlugin({
            filename: 'index.html',
            template: __dirname + '/index-template.html'
        })
    ],
    module: {
        loaders: [
            // Load CSS files that are required in modules.
            {
                test: /\.css$/,
                exclude: /node_modules/,
                loader: 'style-loader!css-loader',
            },
            // Load font files for font-awesome. It uses a trailing version
            // number in the names when requiring so we have to accept them in
            // our test regex.
            {
                test: /\.(eot|svg|ttf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "url-loader?limit=10000&minetype=application/font-woff"
            },
            // Process all JavaScript files as ECMAScript2015 along with
            // accepting the JSX syntax used by React.
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015', 'react', 'stage-1']
                }
            },
            // Disable AMD for Strophe and its plugins because we don't know how
            // to require them successfully.
            {
                test: /\/strophe(js-plugins)?\//,
                loader: 'imports?define=>false&this=>window'
            }
        ]
    }
};
