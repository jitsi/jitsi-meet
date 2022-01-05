// @flow

import clsx from 'clsx';
import React from 'react';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { PollsPane } from '../../../polls/components';
import { toggleChat } from '../../actions.web';
import AbstractChat, {
    _mapStateToProps,
    type Props
} from '../AbstractChat';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import DisplayNameForm from './DisplayNameForm';
import KeyboardAvoider from './KeyboardAvoider';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';

/**
 * React Component for holding the chat feature in a side panel that slides in
 * and out of view.
 */
class Chat extends AbstractChat<Props> {

    /**
     * Reference to the React Component for displaying chat messages. Used for
     * scrolling to the end of the chat messages.
     */
    _messageContainerRef: Object;

    /**
     * Initializes a new {@code Chat} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._messageContainerRef = React.createRef();

        // Bind event handlers so they are only bound once for every instance.
        this._onChatTabKeyDown = this._onChatTabKeyDown.bind(this);
        this._onChatInputResize = this._onChatInputResize.bind(this);
        this._onEscClick = this._onEscClick.bind(this);
        this._onPollsTabKeyDown = this._onPollsTabKeyDown.bind(this);
        this._onToggleChat = this._onToggleChat.bind(this);
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
        if (this.props._messages !== prevProps._messages) {
            this._scrollMessageContainerToBottom(true);
        } else if (this.props._isOpen && !prevProps._isOpen) {
            this._scrollMessageContainerToBottom(false);
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _isOpen, _isPollsEnabled, _showNamePrompt } = this.props;

        return (
            _isOpen ? <div
                className = 'sideToolbarContainer'
                id = 'sideToolbarContainer'
                onKeyDown = { this._onEscClick } >
                <ChatHeader
                    className = 'chat-header'
                    id = 'chat-header'
                    isPollsEnabled = { _isPollsEnabled }
                    onCancel = { this._onToggleChat } />
                { _showNamePrompt
                    ? <DisplayNameForm isPollsEnabled = { _isPollsEnabled } />
                    : this._renderChat() }
            </div> : null
        );
    }

    _onChatInputResize: () => void;

    /**
     * Callback invoked when {@code ChatInput} changes height. Preserves
     * displaying the latest message if it is scrolled to.
     *
     * @private
     * @returns {void}
     */
    _onChatInputResize() {
        this._messageContainerRef.current.maybeUpdateBottomScroll();
    }

    _onChatTabKeyDown: (KeyboardEvent) => void;

    /**
     * Key press handler for the chat tab.
     *
     * @param {KeyboardEvent} event - The event.
     * @returns {void}
     */
    _onChatTabKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            this._onToggleChatTab();
        }
    }

    _onEscClick: (KeyboardEvent) => void;

    /**
     * Click handler for the chat sidenav.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event) {
        if (event.key === 'Escape' && this.props._isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this._onToggleChat();
        }
    }

    _onPollsTabKeyDown: (KeyboardEvent) => void;

    /**
     * Key press handler for the polls tab.
     *
     * @param {KeyboardEvent} event - The event.
     * @returns {void}
     */
    _onPollsTabKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            this._onTogglePollsTab();
        }
    }

    /**
     * Returns a React Element for showing chat messages and a form to send new
     * chat messages.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderChat() {
        const { _isPollsEnabled, _isPollsTabFocused } = this.props;

        if (_isPollsTabFocused) {
            return (
                <>
                    {_isPollsEnabled && this._renderTabs()}
                    <div
                        aria-labelledby = 'polls-tab'
                        id = 'polls-panel'
                        role = 'tabpanel'>
                        <PollsPane />
                    </div>
                    <KeyboardAvoider />
                </>
            );
        }

        return (
            <>
                {_isPollsEnabled && this._renderTabs()}
                <div
                    aria-labelledby = 'chat-tab'
                    className = { clsx('chat-panel', !_isPollsEnabled && 'chat-panel-no-tabs') }
                    id = 'chat-panel'
                    role = 'tabpanel'>
                    <MessageContainer
                        messages = { this.props._messages }
                        ref = { this._messageContainerRef } />
                    <MessageRecipient />
                    <ChatInput
                        onResize = { this._onChatInputResize }
                        onSend = { this._onSendMessage } />
                    <KeyboardAvoider />
                </div>
            </>
        );
    }

    /**
     * Returns a React Element showing the Chat and Polls tab.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderTabs() {
        const { _isPollsEnabled, _isPollsTabFocused, _nbUnreadMessages, _nbUnreadPolls, t } = this.props;

        return (
            <div
                aria-label = { t(_isPollsEnabled ? 'chat.titleWithPolls' : 'chat.title') }
                className = { 'chat-tabs-container' }
                role = 'tablist'>
                <div
                    aria-controls = 'chat-panel'
                    aria-label = { t('chat.tabs.chat') }
                    aria-selected = { !_isPollsTabFocused }
                    className = { `chat-tab ${
                        _isPollsTabFocused ? '' : 'chat-tab-focus'
                    }` }
                    id = 'chat-tab'
                    onClick = { this._onToggleChatTab }
                    onKeyDown = { this._onChatTabKeyDown }
                    role = 'tab'
                    tabIndex = '0'>
                    <span
                        className = { 'chat-tab-title' }>
                        {t('chat.tabs.chat')}
                    </span>
                    {this.props._isPollsTabFocused
                        && _nbUnreadMessages > 0 && (
                        <span className = { 'chat-tab-badge' }>
                            {_nbUnreadMessages}
                        </span>
                    )}
                </div>
                <div
                    aria-controls = 'polls-panel'
                    aria-label = { t('chat.tabs.polls') }
                    aria-selected = { _isPollsTabFocused }
                    className = { `chat-tab ${
                        _isPollsTabFocused ? 'chat-tab-focus' : ''
                    }` }
                    id = 'polls-tab'
                    onClick = { this._onTogglePollsTab }
                    onKeyDown = { this._onPollsTabKeyDown }
                    role = 'tab'
                    tabIndex = '0'>
                    <span className = { 'chat-tab-title' }>
                        {t('chat.tabs.polls')}
                    </span>
                    {!_isPollsTabFocused
                        && this.props._nbUnreadPolls > 0 && (
                        <span className = { 'chat-tab-badge' }>
                            {_nbUnreadPolls}
                        </span>
                    )}
                </div>
            </div>
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

    _onSendMessage: (string) => void;

    _onToggleChat: () => void;

    /**
    * Toggles the chat window.
    *
    * @returns {Function}
    */
    _onToggleChat() {
        this.props.dispatch(toggleChat());
    }
    _onTogglePollsTab: () => void;
    _onToggleChatTab: () => void;

}

export default translate(connect(_mapStateToProps)(Chat));
