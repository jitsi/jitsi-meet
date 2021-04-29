// @flow

import { schemeColor } from '../../../base/color-scheme';
import { BoxModel, ColorPalette, createStyleSheet } from '../../../base/styles';

/**
 * The styles of the React {@code Component}s of the feature subtitles.
 */
export default createStyleSheet({

    title: {
        fontSize: 24,
        fontWeight: 'bold'
    },

    question : {
        fontSize: 16,
        fontStyle: 'italic',
        paddingBottom: 16,
    },

    field: {
        borderBottomWidth: 1,
        fontSize: 14,
        flexGrow: 1,
    },
});
