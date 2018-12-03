// @flow

import { Component } from 'react';

/**
 * {@code AbstractGoogleSignInButton} component's property types.
 */
type Props = {

    /**
     * The callback to invoke when the button is clicked.
     */
    onClick: Function,

    /**
     * True if the user is signed in, so it needs to render a different label
     * and maybe different style (for the future).
     */
    signedIn?: boolean,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract class of the {@code GoogleSignInButton} to share platform
 * independent code.
 *
 * @inheritdoc
 */
export default class AbstractGoogleSignInButton extends Component<Props> {
}
