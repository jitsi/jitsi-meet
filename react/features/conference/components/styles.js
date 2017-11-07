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
     * The style of the View rendered while the conference is being connected
     * (i.e. the XMPP connection is being established and the MUC is being
     * joined).
     */
    connectingIndicator: {
        alignItems: 'center',
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,

        // Because the background of LargeVideo varies wildly (e.g. the
        // participant's video or avatar), the LoadingIndicator may be difficult
        // to see. Reduce the variance of the background of LargeVideo and,
        // thus, increase the visibility of LoadingIndicator by introducing
        // contrast and translucency.
        backgroundColor: ColorPalette.appBackground,
        opacity: 0.5
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
        left: BoxModel.margin,
        position: 'absolute',
        right: BoxModel.margin,

        // Both on Android and iOS there is the status bar which may be visible.
        // On iPhone X there is the notch. In the two cases BoxModel.margin is
        // not enough.
        top: BoxModel.margin * 3
    }
});
