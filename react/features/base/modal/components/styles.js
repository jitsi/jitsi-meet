// @flow

import { ColorSchemeRegistry, schemeColor } from '../../color-scheme';

export default {
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
