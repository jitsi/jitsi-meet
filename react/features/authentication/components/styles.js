import { BoxModel, ColorPalette, createStyleSheet } from '../../base/styles';

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
    color: ColorPalette.white
};

/**
 * The styles of the authentication feature.
 */
export default createStyleSheet({

    /**
     * The style of {@code Text} rendered by the {@code Dialog}s of the
     * feature authentication.
     */
    dialogText: {
        ...text,
        margin: BoxModel.margin,
        marginTop: BoxModel.margin * 2
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
