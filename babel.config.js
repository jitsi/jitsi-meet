module.exports = {
    presets: [ 'module:metro-react-native-babel-preset' ],
    env: {
        production: {
            plugins: [ 'react-native-paper/babel' ]
        }
    },
    loaders: [
        { test: /\.js$/, loader: 'babel', query: {compact: false} },
        { test: /\.css$/, loader: 'babel', query: {compact: false} }
    ],
    plugins: [ 'optional-require' ]
};
