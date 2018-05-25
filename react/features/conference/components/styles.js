import {
    BoxModel,
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
     * View that contains the indicators.
     */
    indicatorContainer: {
        flex: 1,
        flexDirection: 'row',
        margin: BoxModel.margin,
        position: 'absolute',
        right: 0,
        top: 0
    },

    /**
     * Indicator container for wide aspect ratio.
     */
    indicatorContainerWide: {
        right: 80
    },

    /**
     * The style of the {@link View} which expands over the whole
     * {@link Conference} area and splits it between the {@link Filmstrip} and
     * the {@link Toolbox}.
     */
    toolboxAndFilmstripContainer: {
        bottom: BoxModel.margin,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        left: 0,
        position: 'absolute',
        right: 0,

        // Both on Android and iOS there is the status bar which may be visible.
        // On iPhone X there is the notch. In the two cases BoxModel.margin is
        // not enough.
        top: BoxModel.margin * 3
    }
});
