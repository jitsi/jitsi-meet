/* eslint-disable */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');


/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */


const config = (async () => {
    const {
        resolver: {
            sourceExts,
            assetExts
        }
    } = await getDefaultConfig();

    return {
        transformer: {
            babelTransformerPath: require.resolve('react-native-svg-transformer')
        },
        resolver: {
            assetExts: assetExts.filter(ext => ext !== 'svg'),
            sourceExts: [...sourceExts, 'svg']
        }
    }
})();

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
