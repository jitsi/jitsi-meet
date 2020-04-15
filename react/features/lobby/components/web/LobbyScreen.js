// @flow

import React from 'react';

import { Avatar } from '../../../base/avatar';
import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { Icon, IconEdit } from '../../../base/icons';
import { LoadingIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractLobbyScreen, { _mapStateToProps } from '../AbstractLobbyScreen';

/**
 * Implements a waiting screen that represents the participant being in the lobby.
 */
class LobbyScreen extends AbstractLobbyScreen {
    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _meetingName, t } = this.props;

        return (
            <Dialog
                disableBlanketClickDismiss = { false }
                disableEnter = { true }
                hideCancelButton = { true }
                isModal = { false }
                onCancel = { this._onCancel }
                submitDisabled = { true }
                width = 'small'>
                <div id = 'lobby-screen'>
                    <span className = 'title'>
                        { t(this._getScreenTitleKey()) }
                    </span>
                    <span className = 'roomName'>
                        { _meetingName }
                    </span>
                    { this._renderContent() }
                </div>
            </Dialog>
        );
    }

    _getScreenTitleKey: () => string;

    _onAskToJoin: () => boolean;

    _onCancel: () => boolean;

    _onChangeDisplayName: Object => void;

    _onChangeEmail: Object => void;

    _onChangePassword: Object => void;

    _onEnableEdit: () => void;

    _onSubmit: () => boolean;

    _onSwitchToKnockMode: () => void;

    _onSwitchToPasswordMode: () => void;

    _renderContent: () => React$Element<*>;

    /**
     * Renders the joining (waiting) fragment of the screen.
     *
     * @inheritdoc
     */
    _renderJoining(withPassword) {
        return (
            <div className = 'joiningContainer'>
                <LoadingIndicator />
                <span>
                    { this.props.t(`lobby.${withPassword ? 'joinWithPasswordMessage' : 'joiningMessage'}`) }
                </span>
            </div>
        );
    }

    /**
     * Renders the participant form to let the knocking participant enter its details.
     *
     * @inheritdoc
     */
    _renderParticipantForm() {
        const { t } = this.props;
        const { displayName, email } = this.state;

        return (
            <div className = 'form'>
                <span>
                    { t('lobby.nameField') }
                </span>
                <input
                    onChange = { this._onChangeDisplayName }
                    type = 'text'
                    value = { displayName } />
                <span>
                    { t('lobby.emailField') }
                </span>
                <input
                    onChange = { this._onChangeEmail }
                    type = 'email'
                    value = { email } />
            </div>
        );
    }

    /**
     * Renders the participant info fragment when we have all the required details of the user.
     *
     * @inheritdoc
     */
    _renderParticipantInfo() {
        const { displayName, email } = this.state;
        const { _participantId } = this.props;

        return (
            <div className = 'participantInfo'>
                <div className = 'editButton'>
                    <button
                        onClick = { this._onEnableEdit }
                        type = 'button'>
                        <Icon src = { IconEdit } />
                    </button>
                </div>
                <Avatar
                    participantId = { _participantId }
                    size = { 64 } />
                <span className = 'displayName'>
                    { displayName }
                </span>
                <span className = 'email'>
                    { email }
                </span>
            </div>
        );
    }

    /**
     * Renders the password form to let the participant join by using a password instead of knocking.
     *
     * @inheritdoc
     */
    _renderPasswordForm() {
        return (
            <div className = 'form'>
                <span>
                    { this.props.t('lobby.passwordField') }
                </span>
                <input
                    onChange = { this._onChangePassword }
                    type = 'password'
                    value = { this.state.password } />
            </div>
        );
    }

    /**
     * Renders the password join button (set).
     *
     * @inheritdoc
     */
    _renderPasswordJoinButtons() {
        const { t } = this.props;

        return (
            <>
                <button
                    className = 'primary'
                    disabled = { !this.state.password }
                    onClick = { this._onAskToJoin }
                    type = 'submit'>
                    { t('lobby.passwordJoinButton') }
                </button>
                <button
                    className = 'borderLess'
                    onClick = { this._onSwitchToKnockMode }
                    type = 'button'>
                    { t('lobby.backToKnockModeButton') }
                </button>
            </>
        );
    }

    /**
     * Renders the standard button set.
     *
     * @inheritdoc
     */
    _renderStandardButtons() {
        const { t } = this.props;

        return (
            <>
                <button
                    className = 'primary'
                    disabled = { !this.state.displayName }
                    onClick = { this._onAskToJoin }
                    type = 'submit'>
                    { t('lobby.knockButton') }
                </button>
                <button
                    className = 'borderLess'
                    onClick = { this._onSwitchToPasswordMode }
                    type = 'button'>
                    { t('lobby.enterPasswordButton') }
                </button>
            </>
        );
    }
}

export default translate(connect(_mapStateToProps)(LobbyScreen));
