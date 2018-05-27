// @flow

import Button from '@atlaskit/button';
import { FieldTextStateless } from '@atlaskit/field-text';
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

/**
 * The type of the React {@code Component} props of {@link ProfileTab}.
 */
export type Props = {

    /**
     * Whether or not server-side authentication is available.
     */
    authEnabled: boolean,

    /**
     * The name of the currently (server-side) authenticated user.
     */
    authLogin: string,

    /**
     * The display name to display for the local participant.
     */
    displayName: string,

    /**
     * The email to display for the local participant.
     */
    email: string,

    /**
     * Callback invoked when the server side auth flow is triggered.
     */
    onAuthToggle: Function,

    /**
     * Callback invoked when the entered display name has changed.
     */
    onDisplayNameChange: Function,

    /**
     * Callback invoked when the entered email name has changed.
     */
    onEmailChange: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * React {@code Component} for modifying the local user's profile.
 *
 * @extends Component
 */
class ProfileTab extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            authEnabled,
            displayName,
            email,
            onDisplayNameChange,
            onEmailChange,
            t
        } = this.props;

        return (
            <div>
                <div className = 'profile-edit'>
                    <div className = 'profile-edit-field'>
                        <FieldTextStateless
                            autoFocus = { true }
                            compact = { true }
                            id = 'setDisplayName'
                            label = { t('profile.setDisplayNameLabel') }
                            onChange = { onDisplayNameChange }
                            placeholder = { t('settings.name') }
                            shouldFitContainer = { true }
                            type = 'text'
                            value = { displayName } />
                    </div>
                    <div className = 'profile-edit-field'>
                        <FieldTextStateless
                            compact = { true }
                            id = 'setEmail'
                            label = { t('profile.setEmailLabel') }
                            onChange = { onEmailChange }
                            placeholder = { t('profile.setEmailInput') }
                            shouldFitContainer = { true }
                            type = 'text'
                            value = { email } />
                    </div>
                </div>
                { authEnabled && this._renderAuth() }
            </div>
        );
    }

    /**
     * Returns a React Element for interacting with server-side authentication.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderAuth() {
        const {
            authLogin,
            onAuthToggle,
            t
        } = this.props;

        return (
            <div>
                <div className = 'mock-atlaskit-label'>
                    { t('toolbar.authenticate') }
                </div>
                { authLogin
                    && <div className = 'auth-name'>
                        { t('settings.loggedIn', { name: authLogin }) }
                    </div> }
                <Button
                    appearance = 'primary'
                    id = 'login_button'
                    onClick = { onAuthToggle }
                    type = 'button'>
                    { authLogin ? t('toolbar.logout') : t('toolbar.login') }
                </Button>
            </div>
        );
    }
}

export default translate(ProfileTab);
