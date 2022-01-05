// @flow

import { ColorSchemeRegistry, schemeColor } from '../../color-scheme';

export default {

    jitsiScreenContainer: {
        flex: 1
    },

    safeArea: {
        flex: 1
    }
};

ColorSchemeRegistry.register('Modal', {
    page: {
        alignItems: 'stretch',
        backgroundColor: schemeColor('background')
    }
});
