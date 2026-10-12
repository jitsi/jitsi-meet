/* eslint-disable */

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

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
        resolveRequest(context, name, platform) {
            if (context.originModulePath.replace(/\\/g, '/').endsWith('/@matrix-org/olm/olm_legacy.js')
                    && [ 'fs', 'path', 'crypto' ].includes(name)) {
                return {
                    type: 'sourceFile',
                    filePath: path.join(__dirname, 'react/features/base/lib-jitsi-meet/native-e2ee/node-only.ts')
                };
            }
            return context.resolveRequest(context, name, platform);
        },
        assetExts: assetExts.filter(ext => ext !== 'svg'),
        sourceExts: [ ...sourceExts, 'svg' ]
    }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
