import {
    ColorPalette,
    createStyleSheet,
    fixAndroidViewClipping
} from '../../base/styles';

/**
 * The styles of the feature conference.
 */
export default createStyleSheet({
    /**
     * {@code Conference} style.
     */
    conference: fixAndroidViewClipping({
        alignSelf: 'stretch',
        backgroundColor: ColorPalette.appBackground,
        flex: 1
    }),

    /**
     * Style for the connecting indicator.
     */
    connectingIndicator: {
        alignItems: 'center',
        backgroundColor: ColorPalette.white,
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        opacity: 0.6,
        position: 'absolute',
        right: 0,
        top: 0
    }
});
