// @flow

import React from 'react';

import { translate } from '../../base/i18n';

import AbstractGoogleSignInButton from './AbstractGoogleSignInButton';

/**
 * A React Component showing a button to sign in with Google.
 *
 * @extends Component
 */
class GoogleSignInButton extends AbstractGoogleSignInButton {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <div
                className = 'google-sign-in'
                onClick = { this.props.onClick }>
                <img
                    className = 'google-logo'
                    src = 'images/googleLogo.svg' />
                <div className = 'google-cta'>
                    {
                        t(this.props.signedIn
                            ? 'liveStreaming.signOut'
                            : 'liveStreaming.signIn')
                    }
                </div>
            </div>
        );
    }
}

export default translate(GoogleSignInButton);
