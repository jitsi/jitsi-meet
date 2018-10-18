// @flow

import { ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * For styling explanations, see:
 * https://developers.google.com/identity/branding-guidelines
 */
const BUTTON_HEIGHT = 40;

/**
 * The styles of the React {@code Components} of google-api.
 */
export default createStyleSheet({

    /**
     * Image of the sign in button (Google branded).
     */
    signInImage: {
        flex: 1
    },

    /**
     * An image-based button for sign in.
     */
    signInButton: {
        alignItems: 'center',
        height: BUTTON_HEIGHT,
        justifyContent: 'center'
    },

    /**
     * A text-based button for sign out (no sign out button guidance for
     * Google).
     */
    signOutButton: {
        alignItems: 'center',
        borderColor: ColorPalette.lightGrey,
        borderRadius: 3,
        borderWidth: 1,
        color: ColorPalette.white,
        height: BUTTON_HEIGHT,
        justifyContent: 'center'
    },

    /**
     * Text of the sign out button.
     */
    signOutButtonText: {
        color: ColorPalette.blue,
        fontSize: 14,
        fontWeight: 'bold'
    }

});
