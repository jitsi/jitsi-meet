import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../base/i18n/functions';

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
 * A React Component showing a button to sign in with Google.
 *
 * @augments Component
 */
class GoogleSignInButton extends Component<IProps> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { t } = this.props;

        return (
            <div
                className = 'google-sign-in'
                onClick = { this.props.onClick }>
                <img
                    alt = { t('welcomepage.logo.googleLogo') }
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
