// @flow

import clsx from 'clsx';
import React from 'react';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import Tabs from '../../../base/ui/components/web/Tabs';
import { PollsPane } from '../../../polls/components';
import { toggleChat } from '../../actions.web';
import { CHAT_TABS } from '../../constants';
import AbstractChat, {
    type Props,
    _mapStateToProps
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
        this._onEscClick = this._onEscClick.bind(this);
        this._onPollsTabKeyDown = this._onPollsTabKeyDown.bind(this);
        this._onToggleChat = this._onToggleChat.bind(this);
        this._onChangeTab = this._onChangeTab.bind(this);
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
                    { _isPollsEnabled && this._renderTabs() }
                    <div
                        aria-labelledby = { CHAT_TABS.POLLS }
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
                { _isPollsEnabled && this._renderTabs() }
                <div
                    aria-labelledby = { CHAT_TABS.CHAT }
                    className = { clsx('chat-panel', !_isPollsEnabled && 'chat-panel-no-tabs') }
                    id = 'chat-panel'
                    role = 'tabpanel'>
                    <MessageContainer
                        messages = { this.props._messages } />
                    <MessageRecipient />
                    <ChatInput
                        onSend = { this._onSendMessage } />
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
            <Tabs
                accessibilityLabel = { t(_isPollsEnabled ? 'chat.titleWithPolls' : 'chat.title') }
                onChange = { this._onChangeTab }
                selected = { _isPollsTabFocused ? CHAT_TABS.POLLS : CHAT_TABS.CHAT }
                tabs = { [ {
                    accessibilityLabel: t('chat.tabs.chat'),
                    countBadge: _isPollsTabFocused && _nbUnreadMessages > 0 ? _nbUnreadMessages : undefined,
                    id: CHAT_TABS.CHAT,
                    label: t('chat.tabs.chat')
                }, {
                    accessibilityLabel: t('chat.tabs.polls'),
                    countBadge: !_isPollsTabFocused && _nbUnreadPolls > 0 ? _nbUnreadPolls : undefined,
                    id: CHAT_TABS.POLLS,
                    label: t('chat.tabs.polls')
                }
                ] } />
        );
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
    _onChangeTab: (string) => void;

    /**
     * Change selected tab.
     *
     * @param {string} id - Id of the clicked tab.
     * @returns {void}
     */
    _onChangeTab(id) {
        id === CHAT_TABS.CHAT ? this._onToggleChatTab() : this._onTogglePollsTab();
    }
}

export default translate(connect(_mapStateToProps)(Chat));
