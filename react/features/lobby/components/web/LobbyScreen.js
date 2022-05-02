// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconClose } from '../../../base/icons';
import { ActionButton, InputField, PreMeetingScreen } from '../../../base/premeeting';
import { LoadingIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import ChatInput from '../../../chat/components/web/ChatInput';
import MessageContainer from '../../../chat/components/web/MessageContainer';
import AbstractLobbyScreen, {
    _mapStateToProps,
    type Props
} from '../AbstractLobbyScreen';

/**
 * Implements a waiting screen that represents the participant being in the lobby.
 */
class LobbyScreen extends AbstractLobbyScreen<Props> {
    /**
     * Reference to the React Component for displaying chat messages. Used for
     * scrolling to the end of the chat messages.
     */
    _messageContainerRef: Object;

    /**
       * Initializes a new {@code LobbyScreen} instance.
       *
       * @param {Object} props - The read-only properties with which the new
       * instance is to be initialized.
       */
    constructor(props: Props) {
        super(props);

        this._messageContainerRef = React.createRef();
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
    componentDidUpdate(prevProps) {
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

    _getScreenTitleKey: () => string;

    _onAskToJoin: () => boolean;

    _onCancel: () => boolean;

    _onChangeDisplayName: Object => void;

    _onChangeEmail: Object => void;

    _onChangePassword: Object => void;

    _onEnableEdit: () => void;

    _onJoinWithPassword: () => void;

    _onSendMessage: () => void;

    _onSubmit: () => boolean;

    _onSwitchToKnockMode: () => void;

    _onSwitchToPasswordMode: () => void;

    _onToggleChat: () => void;

    _renderContent: () => React$Element<*>;

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
                        src = { IconClose } />
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
            <>
                <InputField
                    className = { _passwordJoinFailed ? 'error' : '' }
                    onChange = { this._onChangePassword }
                    placeHolder = { t('lobby.passwordField') }
                    testId = 'lobby.password'
                    type = 'password'
                    value = { this.state.password } />

                {_passwordJoinFailed && <div
                    className = 'prejoin-error'
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
        const { t } = this.props;

        return (
            <>
                <ActionButton
                    onClick = { this._onJoinWithPassword }
                    testId = 'lobby.passwordJoinButton'
                    type = 'primary'>
                    { t('prejoin.joinMeeting') }
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
        const { _knocking, _isLobbyChatActive, _renderPassword, t } = this.props;

        return (
            <>
                { _knocking || <ActionButton
                    disabled = { !this.state.displayName }
                    onClick = { this._onAskToJoin }
                    testId = 'lobby.knockButton'
                    type = 'primary'>
                    { t('lobby.knockButton') }
                </ActionButton> }
                { (_knocking && _isLobbyChatActive) && <ActionButton
                    className = 'open-chat-button'
                    onClick = { this._onToggleChat }
                    testId = 'toolbar.openChat'
                    type = 'primary' >
                    { t('toolbar.openChat') }
                </ActionButton> }
                {_renderPassword && <ActionButton
                    onClick = { this._onSwitchToPasswordMode }
                    testId = 'lobby.enterPasswordButton'
                    type = 'secondary'>
                    { t('lobby.enterPasswordButton') }
                </ActionButton> }
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
    _scrollMessageContainerToBottom(withAnimation) {
        if (this._messageContainerRef.current) {
            this._messageContainerRef.current.scrollToBottom(withAnimation);
        }
    }
}

export default translate(connect(_mapStateToProps)(LobbyScreen));
