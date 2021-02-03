// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { ActionButton, InputField, PreMeetingScreen } from '../../../base/premeeting';
import { LoadingIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractLobbyScreen, {
    _mapStateToProps
} from '../AbstractLobbyScreen';

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
        return (
            <PreMeetingScreen title = { this.props.t(this._getScreenTitleKey()) }>
                { this._renderContent() }
            </PreMeetingScreen>
        );
    }

    _getScreenTitleKey: () => string;

    _onAskToJoin: () => boolean;

    _onCancel: () => boolean;

    _onChangeDisplayName: Object => void;

    _onChangeEmail: Object => void;

    _onChangePassword: Object => void;

    _onEnableEdit: () => void;

    _onJoinWithPassword: () => void;

    _onSubmit: () => boolean;

    _onSwitchToKnockMode: () => void;

    _onSwitchToPasswordMode: () => void;

    _renderContent: () => React$Element<*>;

    /**
     * Renders the joining (waiting) fragment of the screen.
     *
     * @inheritdoc
     */
    _renderJoining() {
        return (
            <div className = 'container'>
                <div className = 'spinner'>
                    <LoadingIndicator size = 'large' />
                </div>
                <span className = 'joining-message'>
                    { this.props.t('lobby.joiningMessage') }
                </span>
                { this._renderStandardButtons() }
            </div>
        );
    }

    /**
     * Renders the participant form to let the knocking participant enter its details.
     *
     * NOTE: We don't use edit action on web since the prejoin functionality got merged.
     * Mobile won't use it either once prejoin gets implemented there too.
     *
     * @inheritdoc
     */
    _renderParticipantForm() {
        return this._renderParticipantInfo();
    }

    /**
     * Renders the participant info fragment when we have all the required details of the user.
     *
     * @inheritdoc
     */
    _renderParticipantInfo() {
        const { displayName } = this.state;
        const { t } = this.props;

        return (
            <InputField
                onChange = { this._onChangeDisplayName }
                placeHolder = { t('lobby.nameField') }
                testId = 'lobby.nameField'
                value = { displayName } />
        );
    }

    /**
     * Renders the password form to let the participant join by using a password instead of knocking.
     *
     * @inheritdoc
     */
    _renderPasswordForm() {
        const { _passwordJoinFailed, t } = this.props;

        return (
            <InputField
                className = { _passwordJoinFailed ? 'error' : '' }
                onChange = { this._onChangePassword }
                placeHolder = { _passwordJoinFailed ? t('lobby.invalidPassword') : t('lobby.passwordField') }
                testId = 'lobby.password'
                type = 'password'
                value = { this.state.password } />
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
                <ActionButton
                    disabled = { !this.state.password }
                    onClick = { this._onJoinWithPassword }
                    testId = 'lobby.passwordJoinButton'
                    type = 'primary'>
                    { t('lobby.passwordJoinButton') }
                </ActionButton>
                <ActionButton
                    onClick = { this._onSwitchToKnockMode }
                    testId = 'lobby.backToKnockModeButton'
                    type = 'secondary'>
                    { t('lobby.backToKnockModeButton') }
                </ActionButton>
            </>
        );
    }

    /**
     * Renders the standard button set.
     *
     * @inheritdoc
     */
    _renderStandardButtons() {
        const { _knocking, t } = this.props;

        return (
            <>
                { _knocking || <ActionButton
                    disabled = { !this.state.displayName }
                    onClick = { this._onAskToJoin }
                    testId = 'lobby.knockButton'
                    type = 'primary'>
                    { t('lobby.knockButton') }
                </ActionButton> }
                <ActionButton
                    onClick = { this._onSwitchToPasswordMode }
                    testId = 'lobby.enterPasswordButton'
                    type = 'secondary'>
                    { t('lobby.enterPasswordButton') }
                </ActionButton>
            </>
        );
    }
}

export default translate(connect(_mapStateToProps)(LobbyScreen));
