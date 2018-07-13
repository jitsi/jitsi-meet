import { StyleSheet } from 'react-native';

import { ColorPalette, createStyleSheet } from '../../../base/styles';

export default createStyleSheet({
    // XXX The names bellow were preserved for the purposes of compatibility
    // with the existing CSS class names on Web.

    /**
     * The style of {@code CalleeInfo}.
     */
    ringing: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        flex: 0,
        flexDirection: 'column'
    },

    solidBG: {
        backgroundColor: '#0052CC'
    },

    'ringing__avatar': {
        borderRadius: 128,
        width: 128,
        height: 128
    },

    'ringing__avatar-container': {
        marginTop: 58,
        borderRadius: 128,
        borderColor: '#4C9AFF',
        backgroundColor: '#0052CC',
        borderWidth: 3,
        width: 134,
        height: 134,
        flex: 0
    },

    'ringing__content': {
        marginTop: 0,
        alignItems: 'center',
        flex: 0,
        flexDirection: 'column-reverse'
    },

    'ringing__texts-container': {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 0
    },

    /**
     * The style of {@code Text} within {@code CalleeInfo}.
     */
    'ringing__name': {
        marginTop: 8,
        color: ColorPalette.white,
        fontSize: 36,
        lineHeight: 40
    },

    /**
     * The style of {@code Text} within {@code CalleeInfo}.
     */
    'ringing__status__text': {
        marginTop: 8,
        color: ColorPalette.white,
        fontSize: 14,
        lineHeight: 24
    }
});
