import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../base/icons/svg';
import PreMeetingScreen from '../../../base/premeeting/components/web/PreMeetingScreen';
import LoadingIndicator from '../../../base/react/components/web/LoadingIndicator';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import ChatInput from '../../../chat/components/web/ChatInput';
import MessageContainer from '../../../chat/components/web/MessageContainer';
import AbstractLobbyScreen, {
    IProps,
    _mapStateToProps
} from '../AbstractLobbyScreen';

/**
 * Implements a waiting screen that represents the participant being in the lobby.
 */
class LobbyScreen extends AbstractLobbyScreen<IProps> {
    /**
     * Reference to the React Component for displaying chat messages. Used for
     * scrolling to the end of the chat messages.
     */
    _messageContainerRef: React.RefObject<MessageContainer>;

    /**
       * Initializes a new {@code LobbyScreen} instance.
       *
       * @param {Object} props - The read-only properties with which the new
       * instance is to be initialized.
       */
    constructor(props: IProps) {
        super(props);

        this._messageContainerRef = React.createRef<MessageContainer>();
    }

    /**
       * Implements {@code Component#componentDidMount}.
       *
       * @inheritdoc
       */
    componentDidMount() {
        this._scrollMessageContainerToBottom(true);
    }

    /**
       * Implements {@code Component#componentDidUpdate}.
       *
       * @inheritdoc
       */
    componentDidUpdate(prevProps: IProps) {
        if (this.props._lobbyChatMessages !== prevProps._lobbyChatMessages) {
            this._scrollMessageContainerToBottom(true);
        } else if (this.props._isLobbyChatActive && !prevProps._isLobbyChatActive) {
            this._scrollMessageContainerToBottom(false);
        }
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _deviceStatusVisible, showCopyUrlButton, t } = this.props;

        return (
            <PreMeetingScreen
                className = 'lobby-screen'
                showCopyUrlButton = { showCopyUrlButton }
                showDeviceStatus = { _deviceStatusVisible }
                title = { t(this._getScreenTitleKey(), { moderator: this.props._lobbyMessageRecipient }) }>
                { this._renderContent() }
            </PreMeetingScreen>
        );
    }

    /**
     * Renders the joining (waiting) fragment of the screen.
     *
     * @inheritdoc
     */
    _renderJoining() {
        const { _isLobbyChatActive } = this.props;

        return (
            <div className = 'lobby-screen-content'>
                {_isLobbyChatActive
                    ? this._renderLobbyChat()
                    : (
                        <>
                            <div className = 'spinner'>
                                <LoadingIndicator size = 'large' />
                            </div>
                            <span className = 'joining-message'>
                                { this.props.t('lobby.joiningMessage') }
                            </span>
                        </>
                    )}
                { this._renderStandardButtons() }
            </div>
        );
    }

    /**
     * Renders the widget to chat with the moderator before allowed in.
     *
     * @inheritdoc
     */
    _renderLobbyChat() {
        const { _lobbyChatMessages, t } = this.props;
        const { isChatOpen } = this.state;

        return (
            <div className = { `lobby-chat-container ${isChatOpen ? 'hidden' : ''}` }>
                <div className = 'lobby-chat-header'>
                    <h1 className = 'title'>
                        { t(this._getScreenTitleKey(), { moderator: this.props._lobbyMessageRecipient }) }
                    </h1>
                    <Icon
                        ariaLabel = { t('toolbar.closeChat') }
                        onClick = { this._onToggleChat }
                        role = 'button'
                        src = { IconCloseLarge } />
                </div>
                <MessageContainer
                    messages = { _lobbyChatMessages }
                    ref = { this._messageContainerRef } />
                <ChatInput onSend = { this._onSendMessage } />
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
        const { _isDisplayNameRequiredActive, t } = this.props;
        const showError = _isDisplayNameRequiredActive && !displayName;

        return (
            <>
                <Input
                    autoFocus = { true }
                    className = 'lobby-prejoin-input'
                    error = { showError }
                    id = 'lobby-name-field'
                    onChange = { this._onChangeDisplayName }
                    placeholder = { t('lobby.nameField') }
                    testId = 'lobby.nameField'
                    value = { displayName } />

                { showError && <div
                    className = 'lobby-prejoin-error'
                    data-testid = 'lobby.errorMessage'>{t('prejoin.errorMissingName')}</div>}
            </>
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
            <>
                <Input
                    className = { `lobby-prejoin-input ${_passwordJoinFailed ? 'error' : ''}` }
                    id = 'lobby-password-input'
                    onChange = { this._onChangePassword }
                    placeholder = { t('lobby.enterPasswordButton') }
                    testId = 'lobby.password'
                    type = 'password'
                    value = { this.state.password } />

                {_passwordJoinFailed && <div
                    className = 'lobby-prejoin-error'
                    data-testid = 'lobby.errorMessage'>{t('lobby.invalidPassword')}</div>}
            </>
        );
    }

    /**
     * Renders the password join button (set).
     *
     * @inheritdoc
     */
    _renderPasswordJoinButtons() {
        return (
            <>
                <Button
                    className = 'lobby-button-margin'
                    fullWidth = { true }
                    labelKey = 'prejoin.joinMeeting'
                    onClick = { this._onJoinWithPassword }
                    testId = 'lobby.passwordJoinButton'
                    type = 'primary' />
                <Button
                    className = 'lobby-button-margin'
                    fullWidth = { true }
                    labelKey = 'lobby.backToKnockModeButton'
                    onClick = { this._onSwitchToKnockMode }
                    testId = 'lobby.backToKnockModeButton'
                    type = 'secondary' />
            </>
        );
    }

    /**
     * Renders the standard button set.
     *
     * @inheritdoc
     */
    _renderStandardButtons() {
        const { _knocking, _isLobbyChatActive, _renderPassword } = this.props;

        return (
            <>
                {_knocking || <Button
                    className = 'lobby-button-margin'
                    disabled = { !this.state.displayName }
                    fullWidth = { true }
                    labelKey = 'lobby.knockButton'
                    onClick = { this._onAskToJoin }
                    testId = 'lobby.knockButton'
                    type = 'primary' />
                }
                {(_knocking && _isLobbyChatActive) && <Button
                    className = 'lobby-button-margin open-chat-button'
                    fullWidth = { true }
                    labelKey = 'toolbar.openChat'
                    onClick = { this._onToggleChat }
                    testId = 'toolbar.openChat'
                    type = 'primary' />
                }
                {_renderPassword && <Button
                    className = 'lobby-button-margin'
                    fullWidth = { true }
                    labelKey = 'lobby.enterPasswordButton'
                    onClick = { this._onSwitchToPasswordMode }
                    testId = 'lobby.enterPasswordButton'
                    type = 'secondary' />
                }
            </>
        );
    }

    /**
     * Scrolls the chat messages so the latest message is visible.
     *
     * @param {boolean} withAnimation - Whether or not to show a scrolling
     * animation.
     * @private
     * @returns {void}
     */
    _scrollMessageContainerToBottom(withAnimation: boolean) {
        if (this._messageContainerRef.current) {
            this._messageContainerRef.current.scrollToElement(withAnimation, null);
        }
    }
}

export default translate(connect(_mapStateToProps)(LobbyScreen));
