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
    conference: {
        flex: 1
    },

    /**
     * Style for {@code Conference} wrapper.
     */
    conferenceWrapper: fixAndroidViewClipping({
        alignSelf: 'stretch',
        backgroundColor: ColorPalette.appBackground,
        flex: 1
    }),

    /**
     * The style of the {@link View} which expands over the whole
     * {@link Conference} area and splits it between the {@link Filmstrip} and
     * the {@link Toolbox}.
     */
    toolboxAndFilmstripContainer: {
        bottom: 0,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        left: 0,
        marginHorizontal: BoxModel.margin,
        marginVertical: BoxModel.margin / 2,
        position: 'absolute',
        right: 0,
        top: 0
    }
});
