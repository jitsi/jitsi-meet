import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../base/i18n/functions';

/**
 * The type of the React {@code Component} props of
 * {@link MicrosoftSignInButton}.
 */
interface IProps extends WithTranslation {

    /**
     * The callback to invoke when {@code MicrosoftSignInButton} is clicked.
     */
    onClick: (e?: React.MouseEvent) => void;

    /**
     * The text to display within {@code MicrosoftSignInButton}.
     */
    text: string;
}

/**
 * A React Component showing a button to sign in with Microsoft.
 *
 * @augments Component
 */
class MicrosoftSignInButton extends Component<IProps> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        return (
            <div
                className = 'microsoft-sign-in'
                onClick = { this.props.onClick }>
                <img
                    alt = { this.props.t('welcomepage.logo.microsoftLogo') }
                    className = 'microsoft-logo'
                    src = 'images/microsoftLogo.svg' />
                <div className = 'microsoft-cta'>
                    { this.props.text }
                </div>
            </div>
        );
    }
}

export default translate(MicrosoftSignInButton);
