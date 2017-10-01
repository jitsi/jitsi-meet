import {
    BoxModel,
    ColorPalette,
    createStyleSheet,
    fixAndroidViewClipping
} from '../../base/styles';

/**
 * The default color of text on the WelcomePage.
 */
const TEXT_COLOR = ColorPalette.white;

/**
 * The styles of the React {@code Components} of the feature welcome including
 * {@code WelcomePage} and {@code BlankPage}.
 */
export default createStyleSheet({
    /**
     * The style of the top-level container of {@code BlankPage}.
     */
    blankPage: {
    },

    /**
     * Join button style.
     */
    button: {
        backgroundColor: ColorPalette.white,
        borderColor: ColorPalette.white,
        borderRadius: 8,
        borderWidth: 1,
        height: 45,
        justifyContent: 'center',
        marginBottom: BoxModel.margin,
        marginTop: BoxModel.margin
    },

    /**
     * Join button text style.
     */
    buttonText: {
        alignSelf: 'center',
        color: ColorPalette.blue,
        fontSize: 18
    },

    /**
     * The style of the legal-related content such as (hyper)links to Privacy
     * Policy and Terms of Service displayed on the WelcomePage.
     */
    legaleseContainer: {
        alignItems: 'center',
        flex: 0,
        flexDirection: 'row',
        justifyContent: 'center'
    },

    /**
     * The style of a piece of legal-related content such as a (hyper)link to
     * Privacy Policy or Terms of Service displayed on the WelcomePage.
     */
    legaleseItem: {
        color: TEXT_COLOR,
        fontSize: 12,
        margin: BoxModel.margin
    },

    /**
     * The style of the {@code View} displayed over the local video by
     * {@code LocalVideoTrackUnderlay}. The latter is thought of as the
     * background (content). The former is thought of as the foreground
     * (content).
     */
    localVideoTrackOverlay: {
        backgroundColor: 'transparent',
        bottom: 0,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },

    /**
     * The style of the top-level container/{@code View} of
     * {@code LocalVideoTrackUnderlay}.
     */
    localVideoTrackUnderlay: fixAndroidViewClipping({
        alignSelf: 'stretch',
        backgroundColor: 'transparent',
        flex: 1
    }),

    /**
     * Container for room name input box and 'join' button.
     */
    roomContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        margin: 3 * BoxModel.margin
    },

    /**
     * Room input style.
     */
    textInput: {
        backgroundColor: 'transparent',
        borderColor: ColorPalette.white,
        borderRadius: 8,
        borderWidth: 1,
        color: TEXT_COLOR,
        fontSize: 23,
        height: 50,
        padding: 4,
        textAlign: 'center'
    },

    /**
     * Application title style.
     */
    title: {
        color: TEXT_COLOR,
        fontSize: 25,
        marginBottom: 2 * BoxModel.margin,
        textAlign: 'center'
    },

    /**
     * The style of the top-level container of {@code WelcomePage}.
     */
    welcomePage: {
        backgroundColor: ColorPalette.blue
    }
});
