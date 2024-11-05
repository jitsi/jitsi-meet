module.exports = {
    presets: [ 'module:metro-react-native-babel-preset' ],
    env: {
        production: {
            plugins: [ 'react-native-paper/babel' ]
        }
    },

    // This happens because react native has conflict with @babel/plugin-transform-private-methods plugin
    // https://github.com/ethers-io/ethers.js/discussions/4309#discussioncomment-6694524
    plugins: [ 'optional-require',
        [ '@babel/plugin-transform-private-methods', {
            'loose': true
        } ]
    ]
};
