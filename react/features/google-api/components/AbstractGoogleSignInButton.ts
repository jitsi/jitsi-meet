import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

/**
 * {@code AbstractGoogleSignInButton} Component's property types.
 */
interface IProps extends WithTranslation {

    /**
     * The callback to invoke when the button is clicked.
     */
    onClick: (e?: React.MouseEvent) => void;

    /**
     * True if the user is signed in, so it needs to render a different label
     * and maybe different style (for the future).
     */
    signedIn?: boolean;

    /**
     * The text to display within {@code GoogleSignInButton}.
     */
    text?: string;
}

/**
 * Abstract class of the {@code GoogleSignInButton} to share platform
 * independent code.
 *
 * @inheritdoc
 */
export default class AbstractGoogleSignInButton extends Component<IProps> {
}
