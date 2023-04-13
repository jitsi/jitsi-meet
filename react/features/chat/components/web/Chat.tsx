import clsx from 'clsx';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Tabs from '../../../base/ui/components/web/Tabs';
import PollsPane from '../../../polls/components/web/PollsPane';
import { toggleChat } from '../../actions.web';
import { CHAT_TABS } from '../../constants';
import AbstractChat, {
    IProps,
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
class Chat extends AbstractChat<IProps> {

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
    constructor(props: IProps) {
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
                    isPollsEnabled = { _isPollsEnabled }
                    onCancel = { this._onToggleChat } />
                { _showNamePrompt
                    ? <DisplayNameForm isPollsEnabled = { _isPollsEnabled } />
                    : this._renderChat() }
            </div> : null
        );
    }

    /**
     * Key press handler for the chat tab.
     *
     * @param {KeyboardEvent} event - The event.
     * @returns {void}
     */
    _onChatTabKeyDown(event: React.KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            this._onToggleChatTab();
        }
    }

    /**
     * Click handler for the chat sidenav.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event: React.KeyboardEvent) {
        if (event.key === 'Escape' && this.props._isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this._onToggleChat();
        }
    }

    /**
     * Key press handler for the polls tab.
     *
     * @param {KeyboardEvent} event - The event.
     * @returns {void}
     */
    _onPollsTabKeyDown(event: React.KeyboardEvent) {
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

        return (
            <>
                { _isPollsEnabled && this._renderTabs() }
                <div
                    aria-labelledby = { CHAT_TABS.CHAT }
                    className = { clsx(
                        'chat-panel',
                        !_isPollsEnabled && 'chat-panel-no-tabs',
                        _isPollsTabFocused && 'hide'
                    ) }
                    id = { `${CHAT_TABS.CHAT}-panel` }
                    role = 'tabpanel'
                    tabIndex = { 0 }>
                    <MessageContainer
                        messages = { this.props._messages } />
                    <MessageRecipient />
                    <ChatInput
                        onSend = { this._onSendMessage } />
                </div>
                { _isPollsEnabled && (
                    <>
                        <div
                            aria-labelledby = { CHAT_TABS.POLLS }
                            className = { clsx('polls-panel', !_isPollsTabFocused && 'hide') }
                            id = { `${CHAT_TABS.POLLS}-panel` }
                            role = 'tabpanel'
                            tabIndex = { 0 }>
                            <PollsPane />
                        </div>
                        <KeyboardAvoider />
                    </>
                )}
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
                    controlsId: `${CHAT_TABS.CHAT}-panel`,
                    label: t('chat.tabs.chat')
                }, {
                    accessibilityLabel: t('chat.tabs.polls'),
                    countBadge: !_isPollsTabFocused && _nbUnreadPolls > 0 ? _nbUnreadPolls : undefined,
                    id: CHAT_TABS.POLLS,
                    controlsId: `${CHAT_TABS.POLLS}-panel`,
                    label: t('chat.tabs.polls')
                }
                ] } />
        );
    }

    /**
    * Toggles the chat window.
    *
    * @returns {Function}
    */
    _onToggleChat() {
        this.props.dispatch(toggleChat());
    }

    /**
     * Change selected tab.
     *
     * @param {string} id - Id of the clicked tab.
     * @returns {void}
     */
    _onChangeTab(id: string) {
        id === CHAT_TABS.CHAT ? this._onToggleChatTab() : this._onTogglePollsTab();
    }
}

export default translate(connect(_mapStateToProps)(Chat));
