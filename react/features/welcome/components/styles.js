import {
    BoxModel,
    ColorPalette,
    createStyleSheet,
    fixAndroidViewClipping
} from '../../base/styles';

export const PLACEHOLDER_TEXT_COLOR = 'rgba(255, 255, 255, 0.3)';

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
        justifyContent: 'center',

        // XXX Lift the legaleseContainer up above the iPhone X home indicator;
        // otherwise, the former is partially underneath the latter.
        marginBottom: BoxModel.margin
    },

    /**
     * The style of a piece of legal-related content such as a (hyper)link to
     * Privacy Policy or Terms of Service displayed on the WelcomePage.
     */
    legaleseItem: {
        // XXX The backgroundColor must be transparent; otherwise, the
        // backgroundColor of a parent may show through. Moreover, the
        // legaleseItem is not really expected to have a background of its own.
        backgroundColor: 'transparent',
        color: TEXT_COLOR,
        fontSize: 12,
        margin: BoxModel.margin
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
        alignSelf: 'stretch',
        flex: 1,
        flexDirection: 'column',

        // XXX RecentList will eventually push the room name TextInput and the
        // Join button up from the center. I don't like that movement from
        // center to top, especially without an animation. Just start with the
        // room name TextInput and the Join button at the top.
        justifyContent: 'flex-start',
        margin: 3 * BoxModel.margin,

        // XXX Be consistent with the marginBottom of legaleseContainer!
        marginBottom: BoxModel.margin,

        // XXX Push the roomContainer down bellow the iPhone X notchl otherwise,
        // the former seems glued to the latter. THe amount of visual margin at
        // the top is pretty much as the visual margin at the bottom (if you sum
        // all bottom and top margins and account for legaleseItem) which brings
        // symmetry as well.
        marginTop: 5 * BoxModel.margin
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
