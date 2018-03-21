import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * A React Component showing a button to sign in with Google.
 *
 * @extends Component
 */
export default class GoogleSignInButton extends Component {
    /**
     * {@code GoogleSignInButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The callback to invoke when the button is clicked.
         */
        onClick: PropTypes.func,

        /**
         * The text to display in the button.
         */
        text: PropTypes.string
    };

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
