// Version-wise, react-native and @react-native/metro-config must be the same.

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */

const {
    resolver: {
        sourceExts,
        assetExts
    }
} = getDefaultConfig();

const config = {
    transformer: {
        babelTransformerPath: require.resolve('react-native-svg-transformer')
    },
    resolver: {
        assetExts: assetExts.filter(ext => ext !== 'svg'),
        sourceExts: [ ...sourceExts, 'svg' ]
    }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
