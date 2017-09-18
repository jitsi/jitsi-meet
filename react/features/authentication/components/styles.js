import { BoxModel, createStyleSheet } from '../../base/styles';

/**
 * The style common to <tt>LoginDialog</tt> and <tt>WaitForOwnerDialog</tt>.
 */
const dialog = {
    marginBottom: BoxModel.margin,
    marginTop: BoxModel.margin
};

/**
 * The style common to <tt>Text</tt> rendered by <tt>LoginDialog</tt> and
 * <tt>WaitForOwnerDialog</tt>.
 */
const text = {
};

/**
 * The styles of the authentication feature.
 */
export default createStyleSheet({
    /**
     * The style of <tt>LoginDialog</tt>.
     */
    loginDialog: {
        ...dialog,
        flex: 0,
        flexDirection: 'column'
    },

    /**
     * The style of <tt>Text</tt> rendered by <tt>LoginDialog</tt>.
     */
    loginDialogText: {
        ...text
    },

    /**
     * The style of <tt>TextInput</tt> rendered by <tt>LoginDialog</tt>.
     */
    loginDialogTextInput: {
        // XXX Matches react-native-prompt's dialogInput because base/dialog's
        // Dialog is implemented using react-native-prompt.
        fontSize: 18,
        height: 50
    },

    /**
     * The style of <tt>WaitForOwnerDialog</tt>.
     */
    waitForOwnerDialog: {
        ...dialog,
        ...text
    }
});
