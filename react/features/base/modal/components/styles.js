// @flow

import { ColorSchemeRegistry, schemeColor } from '../../color-scheme';

export default {
    safeArea: {
        flex: 1
    }
};

ColorSchemeRegistry.register('Modal', {
    page: {
        backgroundColor: schemeColor('background')
    }
});
