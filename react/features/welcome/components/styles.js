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
 * The styles of WelcomePage.
 */
export default createStyleSheet({
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
        color: '#00ccff',
        fontSize: 18
    },

    /**
     * The style of the top-level container of WelcomePage.
     */
    container: fixAndroidViewClipping({
        alignSelf: 'stretch',
        backgroundColor: ColorPalette.blue,
        flex: 1
    }),

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
     * The style of the View displayed over the local video. The latter is
     * thought of as the background (content) of WelcomePage. The former is
     * thought of as the foreground (content) of WelcomePage.
     */
    localVideoOverlay: {
        // Since (1) the top-level container of WelcomePage is not transparent
        // and, more importantly, (2) this View is displayed over the local
        // video, this View would better not have a background color.
        // Otherwise, Views within this View will inherit its background color
        // and Text, for example, will display non-transparent rectangles over
        // the local video.
        backgroundColor: 'transparent',
        bottom: 0,
        flex: 1,
        flexDirection: 'column',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },

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
    }
});
