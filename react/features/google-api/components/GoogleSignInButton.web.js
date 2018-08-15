// @flow

import React, { Component } from 'react';

/**
 * The type of the React {@code Component} props of {@link GoogleSignInButton}.
 */
type Props = {

    // The callback to invoke when {@code GoogleSignInButton} is clicked.
    onClick: Function,

    // The text to display within {@code GoogleSignInButton}.
    text: string
};

/**
 * A React Component showing a button to sign in with Google.
 *
 * @extends Component
 */
export default class GoogleSignInButton extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = 'google-sign-in'
                onClick = { this.props.onClick }>
                <img
                    className = 'google-logo'
                    src = 'images/googleLogo.svg' />
                <div className = 'google-cta'>
                    { this.props.text }
                </div>
            </div>
        );
    }
}
