// @flow

import Button from '@atlaskit/button';
import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import UIEvents from '../../../../../service/UI/UIEvents';
import {
    sendAnalytics,
    createProfilePanelButtonEvent
} from '../../../analytics';
import { AbstractDialogTab } from '../../../base/dialog';
import type { Props as AbstractDialogTabProps } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link ProfileTab}.
 */
export type Props = {
    ...$Exact<AbstractDialogTabProps>,

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
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * React {@code Component} for modifying the local user's profile.
 *
 * @extends Component
 */
class ProfileTab extends AbstractDialogTab<Props> {
    static defaultProps = {
        displayName: '',
        email: ''
    };

    /**
     * Initializes a new {@code ConnectedSettingsDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code ConnectedSettingsDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onAuthToggle = this._onAuthToggle.bind(this);
    }

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
                            // eslint-disable-next-line react/jsx-no-bind
                            onChange = {
                                ({ target: { value } }) =>
                                    super._onChange({ displayName: value })
                            }
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
                            // eslint-disable-next-line react/jsx-no-bind
                            onChange = {
                                ({ target: { value } }) =>
                                    super._onChange({ email: value })
                            }
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

    _onAuthToggle: () => void;

    /**
     * Shows the dialog for logging in or out of a server and closes this
     * dialog.
     *
     * @private
     * @returns {void}
     */
    _onAuthToggle() {
        if (this.props.authLogin) {
            sendAnalytics(createProfilePanelButtonEvent('logout.button'));

            APP.UI.messageHandler.openTwoButtonDialog({
                leftButtonKey: 'dialog.Yes',
                msgKey: 'dialog.logoutQuestion',
                submitFunction(evt, yes) {
                    if (yes) {
                        APP.UI.emitEvent(UIEvents.LOGOUT);
                    }
                },
                titleKey: 'dialog.logoutTitle'
            });
        } else {
            sendAnalytics(createProfilePanelButtonEvent('login.button'));

            APP.UI.emitEvent(UIEvents.AUTH_CLICKED);
        }

        this.props.closeDialog();
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
                    onClick = { this._onAuthToggle }
                    type = 'button'>
                    { authLogin ? t('toolbar.logout') : t('toolbar.login') }
                </Button>
            </div>
        );
    }
}

export default translate(ProfileTab);
