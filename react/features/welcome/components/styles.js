import { ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * Welcome page container style.
 */
const container = {
    alignSelf: 'stretch',
    backgroundColor: ColorPalette.jitsiBlue,
    bottom: 0,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
};

/**
 * The welcome page style.
 * TODO: Make styles more generic and reusable. Use color palette for all
 * colors.
 */
export const styles = createStyleSheet({
    /**
     * Join button text style.
     */
    button: {
        backgroundColor: 'white',
        borderColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        height: 45,
        justifyContent: 'center',
        marginBottom: 10,
        marginTop: 10
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
     * Welcome page container style.
     */
    container,

    /**
     * Container for room name input box and 'join' button.
     */
    roomContainer: {
        ...container,
        backgroundColor: 'transparent',
        padding: 30
    },

    /**
     * Navigator container style.
     */
    navContainer: {
        backgroundColor: ColorPalette.appBackground,
        flex: 1
    },

    /**
     * Room input style.
     */
    textInput: {
        backgroundColor: 'transparent',
        borderColor: 'white',
        borderRadius: 8,
        borderStyle: 'solid',
        borderWidth: 1,
        color: 'white',
        fontSize: 23,
        height: 50,
        padding: 4,
        textAlign: 'center'
    },

    /**
     * Application title style.
     */
    title: {
        color: '#fff',
        fontSize: 25,
        marginBottom: 20,
        textAlign: 'center'
    }
});
