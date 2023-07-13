import clsx from 'clsx';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import Tabs from '../../../base/ui/components/web/Tabs';
import PollsPane from '../../../polls/components/web/PollsPane';
import { sendMessage, setIsPollsTabFocused, toggleChat } from '../../actions.web';
import { CHAT_TABS, SMALL_WIDTH_THRESHOLD } from '../../constants';
import { IChatProps as AbstractProps } from '../../types';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import DisplayNameForm from './DisplayNameForm';
import KeyboardAvoider from './KeyboardAvoider';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';

interface IProps extends AbstractProps {

    /**
     * Whether the chat is opened in a modal or not (computed based on window width).
     */
    _isModal: boolean;

    /**
     * True if the chat window should be rendered.
     */
    _isOpen: boolean;

    /**
     * True if the polls feature is enabled.
     */
    _isPollsEnabled: boolean;

    /**
     * Whether the poll tab is focused or not.
     */
    _isPollsTabFocused: boolean;

    /**
     * Number of unread poll messages.
     */
    _nbUnreadPolls: number;

    /**
     * Function to send a text message.
     *
     * @protected
     */
    _onSendMessage: Function;

    /**
     * Function to toggle the chat window.
     */
    _onToggleChat: Function;

    /**
     * Function to display the chat tab.
     *
     * @protected
     */
    _onToggleChatTab: Function;

    /**
     * Function to display the polls tab.
     *
     * @protected
     */
    _onTogglePollsTab: Function;

    /**
     * Whether or not to block chat access with a nickname input form.
     */
    _showNamePrompt: boolean;
}

const Chat = ({
    _isModal,
    _isOpen,
    _isPollsEnabled,
    _isPollsTabFocused,
    _messages,
    _nbUnreadMessages,
    _nbUnreadPolls,
    _onSendMessage,
    _onToggleChat,
    _onToggleChatTab,
    _onTogglePollsTab,
    _showNamePrompt,
    dispatch,
    t
}: IProps) => {
    /**
    * Sends a text message.
    *
    * @private
    * @param {string} text - The text message to be sent.
    * @returns {void}
    * @type {Function}
    */
    const onSendMessage = useCallback((text: string) => {
        dispatch(sendMessage(text));
    }, []);

    /**
    * Toggles the chat window.
    *
    * @returns {Function}
    */
    const onToggleChat = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    /**
     * Click handler for the chat sidenav.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    const _onEscClick = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && _isOpen) {
            event.preventDefault();
            event.stopPropagation();
            onToggleChat();
        }
    }, [ _isOpen ]);

    /**
     * Change selected tab.
     *
     * @param {string} id - Id of the clicked tab.
     * @returns {void}
     */
    const _onChangeTab = useCallback((id: string) => {
        dispatch(setIsPollsTabFocused(id !== CHAT_TABS.CHAT));
    }, []);

    /**
     * Returns a React Element for showing chat messages and a form to send new
     * chat messages.
     *
     * @private
     * @returns {ReactElement}
     */
    function _renderChat() {
        return (
            <>
                {_isPollsEnabled && _renderTabs()}
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
                        messages = { _messages } />
                    <MessageRecipient />
                    <ChatInput
                        onSend = { onSendMessage } />
                </div>
                {_isPollsEnabled && (
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
    function _renderTabs() {
        return (
            <Tabs
                accessibilityLabel = { t(_isPollsEnabled ? 'chat.titleWithPolls' : 'chat.title') }
                onChange = { _onChangeTab }
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

    return (
        _isOpen ? <div
            className = 'sideToolbarContainer'
            id = 'sideToolbarContainer'
            onKeyDown = { _onEscClick } >
            <ChatHeader
                className = 'chat-header'
                isPollsEnabled = { _isPollsEnabled }
                onCancel = { onToggleChat } />
            {_showNamePrompt
                ? <DisplayNameForm isPollsEnabled = { _isPollsEnabled } />
                : _renderChat()}
        </div> : null
    );
};

/**
 * Maps (parts of) the redux state to {@link Chat} React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @param {any} _ownProps - Components' own props.
 * @private
 * @returns {{
 *     _isModal: boolean,
 *     _isOpen: boolean,
 *     _isPollsEnabled: boolean,
 *     _isPollsTabFocused: boolean,
 *     _messages: Array<Object>,
 *     _nbUnreadMessages: number,
 *     _nbUnreadPolls: number,
 *     _showNamePrompt: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { isOpen, isPollsTabFocused, messages, nbUnreadMessages } = state['features/chat'];
    const { nbUnreadPolls } = state['features/polls'];
    const _localParticipant = getLocalParticipant(state);
    const { disablePolls } = state['features/base/config'];

    return {
        _isModal: window.innerWidth <= SMALL_WIDTH_THRESHOLD,
        _isOpen: isOpen,
        _isPollsEnabled: !disablePolls,
        _isPollsTabFocused: isPollsTabFocused,
        _messages: messages,
        _nbUnreadMessages: nbUnreadMessages,
        _nbUnreadPolls: nbUnreadPolls,
        _showNamePrompt: !_localParticipant?.name
    };
}

export default translate(connect(_mapStateToProps)(Chat));
