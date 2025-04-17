import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Tabs from '../../../base/ui/components/web/Tabs';
import { arePollsDisabled } from '../../../conference/functions.any';
import PollsPane from '../../../polls/components/web/PollsPane';
import { isCCTabEnabled } from '../../../subtitles/functions.any';
import { sendMessage, setFocusedTab, toggleChat } from '../../actions.web';
import { CHAT_SIZE, ChatTabs, SMALL_WIDTH_THRESHOLD } from '../../constants';
import { IChatProps as AbstractProps } from '../../types';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ClosedCaptionsTab from './ClosedCaptionsTab';
import DisplayNameForm from './DisplayNameForm';
import KeyboardAvoider from './KeyboardAvoider';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';

interface IProps extends AbstractProps {

    /**
     * The currently focused tab.
     */
    _focusedTab: ChatTabs;

    /**
     * True if the CC tab is enabled and false otherwise.
     */
    _isCCTabEnabled: boolean;

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

const useStyles = makeStyles()(theme => {
    return {
        container: {
            backgroundColor: theme.palette.ui01,
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
            transition: 'width .16s ease-in-out',
            width: `${CHAT_SIZE}px`,
            zIndex: 300,

            '@media (max-width: 580px)': {
                height: '100dvh',
                position: 'fixed',
                left: 0,
                right: 0,
                top: 0,
                width: 'auto'
            },

            '*': {
                userSelect: 'text',
                '-webkit-user-select': 'text'
            }
        },

        chatHeader: {
            height: '60px',
            position: 'relative',
            width: '100%',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
            alignItems: 'center',
            boxSizing: 'border-box',
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.heading6),

            '.jitsi-icon': {
                cursor: 'pointer'
            }
        },

        chatPanel: {
            display: 'flex',
            flexDirection: 'column',

            // extract header + tabs height
            height: 'calc(100% - 110px)'
        },

        chatPanelNoTabs: {
            // extract header height
            height: 'calc(100% - 60px)'
        },

        pollsPanel: {
            // extract header + tabs height
            height: 'calc(100% - 110px)'
        }
    };
});

const Chat = ({
    _isModal,
    _isOpen,
    _isPollsEnabled,
    _isCCTabEnabled,
    _focusedTab,
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
    const { classes, cx } = useStyles();

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
    const onEscClick = useCallback((event: React.KeyboardEvent) => {
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
    const onChangeTab = useCallback((id: string) => {
        dispatch(setFocusedTab(id as ChatTabs));
    }, [ dispatch ]);

    /**
     * Returns a React Element for showing chat messages and a form to send new
     * chat messages.
     *
     * @private
     * @returns {ReactElement}
     */
    function renderChat() {
        return (
            <>
                {renderTabs()}
                <div
                    aria-labelledby = { ChatTabs.CHAT }
                    className = { cx(
                        classes.chatPanel,
                        !_isPollsEnabled && !_isCCTabEnabled && classes.chatPanelNoTabs,
                        _focusedTab !== ChatTabs.CHAT && 'hide'
                    ) }
                    id = { `${ChatTabs.CHAT}-panel` }
                    role = 'tabpanel'
                    tabIndex = { 0 }>
                    <MessageContainer
                        messages = { _messages } />
                    <MessageRecipient />
                    <ChatInput
                        onSend = { onSendMessage } />
                </div>
                { _isPollsEnabled && (
                    <>
                        <div
                            aria-labelledby = { ChatTabs.POLLS }
                            className = { cx(classes.pollsPanel, _focusedTab !== ChatTabs.POLLS && 'hide') }
                            id = { `${ChatTabs.POLLS}-panel` }
                            role = 'tabpanel'
                            tabIndex = { 1 }>
                            <PollsPane />
                        </div>
                        <KeyboardAvoider />
                    </>
                )}
                { _isCCTabEnabled && <div
                    aria-labelledby = { ChatTabs.CLOSED_CAPTIONS }
                    className = { cx(classes.chatPanel, _focusedTab !== ChatTabs.CLOSED_CAPTIONS && 'hide') }
                    id = { `${ChatTabs.CLOSED_CAPTIONS}-panel` }
                    role = 'tabpanel'
                    tabIndex = { 2 }>
                    <ClosedCaptionsTab />
                </div> }
            </>
        );
    }


    /**
     * Returns a React Element showing the Chat, Polls and Subtitles tabs.
     *
     * @private
     * @returns {ReactElement}
     */
    function renderTabs() {
        const tabs = [
            {
                accessibilityLabel: t('chat.tabs.chat'),
                countBadge:
                    _focusedTab !== ChatTabs.CHAT && _nbUnreadMessages > 0 ? _nbUnreadMessages : undefined,
                id: ChatTabs.CHAT,
                controlsId: `${ChatTabs.CHAT}-panel`,
                label: t('chat.tabs.chat')
            }
        ];

        if (_isPollsEnabled) {
            tabs.push({
                accessibilityLabel: t('chat.tabs.polls'),
                countBadge: _focusedTab !== ChatTabs.POLLS && _nbUnreadPolls > 0 ? _nbUnreadPolls : undefined,
                id: ChatTabs.POLLS,
                controlsId: `${ChatTabs.POLLS}-panel`,
                label: t('chat.tabs.polls')
            });
        }

        if (_isCCTabEnabled) {
            tabs.push({
                accessibilityLabel: t('chat.tabs.closedCaptions'),
                countBadge: undefined,
                id: ChatTabs.CLOSED_CAPTIONS,
                controlsId: `${ChatTabs.CLOSED_CAPTIONS}-panel`,
                label: t('chat.tabs.closedCaptions')
            });
        }

        return (
            <Tabs
                accessibilityLabel = { t(_isPollsEnabled ? 'chat.titleWithPolls' : 'chat.title') }
                onChange = { onChangeTab }
                selected = { _focusedTab }
                tabs = { tabs } />
        );
    }

    return (
        _isOpen ? <div
            className = { classes.container }
            id = 'sideToolbarContainer'
            onKeyDown = { onEscClick } >
            <ChatHeader
                className = { cx('chat-header', classes.chatHeader) }
                isCCTabEnabled = { _isCCTabEnabled }
                isPollsEnabled = { _isPollsEnabled }
                onCancel = { onToggleChat } />
            {_showNamePrompt
                ? <DisplayNameForm
                    isCCTabEnabled = { _isCCTabEnabled }
                    isPollsEnabled = { _isPollsEnabled } />
                : renderChat()}
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
 *     _isCCTabEnabled: boolean,
 *     _focusedTab: string,
 *     _messages: Array<Object>,
 *     _nbUnreadMessages: number,
 *     _nbUnreadPolls: number,
 *     _showNamePrompt: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { isOpen, focusedTab, messages, nbUnreadMessages } = state['features/chat'];
    const { nbUnreadPolls } = state['features/polls'];
    const _localParticipant = getLocalParticipant(state);

    return {
        _isModal: window.innerWidth <= SMALL_WIDTH_THRESHOLD,
        _isOpen: isOpen,
        _isPollsEnabled: !arePollsDisabled(state),
        _isCCTabEnabled: isCCTabEnabled(state),
        _focusedTab: focusedTab,
        _messages: messages,
        _nbUnreadMessages: nbUnreadMessages,
        _nbUnreadPolls: nbUnreadPolls,
        _showNamePrompt: !_localParticipant?.name
    };
}

export default translate(connect(_mapStateToProps)(Chat));
