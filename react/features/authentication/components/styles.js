import { BoxModel, createStyleSheet } from '../../base/styles';

/**
 * The style common to {@code LoginDialog} and {@code WaitForOwnerDialog}.
 */
const dialog = {
    marginBottom: BoxModel.margin,
    marginTop: BoxModel.margin
};

/**
 * The style common to {@code Text} rendered by {@code LoginDialog} and
 * {@code WaitForOwnerDialog}.
 */
const text = {
};

/**
 * The styles of the authentication feature.
 */
export default createStyleSheet({
    /**
     * The style of bold {@code Text} rendered by the {@code Dialog}s of the
     * feature authentication.
     */
    boldDialogText: {
        ...text,
        fontWeight: 'bold'
    },

    /**
     * The style of {@code Text} rendered by the {@code Dialog}s of the
     * feature authentication.
     */
    dialogText: {
        ...text
    },

    /**
     * The style of {@code TextInput} rendered by the {@code Dialog}s of the
     * feature authentication.
     */
    dialogTextInput: {
        // XXX Matches react-native-prompt's dialogInput because base/dialog's
        // Dialog is implemented using react-native-prompt.
        fontSize: 18,
        height: 50
    },

    /**
     * The style of {@code LoginDialog}.
     */
    loginDialog: {
        ...dialog,
        flex: 0,
        flexDirection: 'column'
    },

    /**
     * The style of {@code WaitForOwnerDialog}.
     */
    waitForOwnerDialog: {
        ...dialog,
        ...text
    }
});
