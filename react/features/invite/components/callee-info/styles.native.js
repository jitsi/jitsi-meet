import { StyleSheet } from 'react-native';

import { ColorPalette, createStyleSheet } from '../../../base/styles';

export default createStyleSheet({
    // XXX The names below were preserved for the purposes of compatibility
    // with the existing CSS class names on Web.

    /**
     * The style of {@code CalleeInfo}.
     */
    ringing: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        backgroundColor: ColorPalette.black,
        flex: 0,
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: 0.8
    },

    'ringing__avatar': {
        borderRadius: 50,
        flex: 0,
        height: 100,
        width: 100
    },

    'ringing__caller-info': {
        alignItems: 'center',
        flex: 0,
        flexDirection: 'row',
        justifyContent: 'center'
    },

    'ringing__content': {
        alignItems: 'center',
        flex: 0,
        flexDirection: 'column',
        justifyContent: 'center'
    },

    /**
     * The style of {@code Text} within {@code CalleeInfo}.
     */
    'ringing__text': {
        color: ColorPalette.white
    }
});
