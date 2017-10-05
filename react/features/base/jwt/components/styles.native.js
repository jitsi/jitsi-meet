import { ColorPalette, createStyleSheet } from '../../styles';

export default createStyleSheet({
    // XXX The names bellow were preserved for the purposes of compatibility
    // with the existing CSS class names on Web.

    /**
     * The style of {@code CallOverlay}.
     */
    ringing: {
        alignItems: 'center',
        backgroundColor: ColorPalette.black,
        bottom: 0,
        flex: 0,
        flexDirection: 'column',
        justifyContent: 'center',
        left: 0,
        opacity: 0.8,
        position: 'absolute',
        right: 0,
        top: 0
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
     * The style of {@code Text} within {@code CallOverlay}.
     */
    'ringing__text': {
        color: ColorPalette.white
    }
});
