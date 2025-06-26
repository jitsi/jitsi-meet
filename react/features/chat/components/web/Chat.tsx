import { throttle } from 'lodash-es';
import React, { useCallback, useEffect, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconInfo, IconMessage, IconShareDoc, IconSubtitles } from '../../../base/icons/svg';
import { getLocalParticipant } from '../../../base/participants/functions';
import Tabs from '../../../base/ui/components/web/Tabs';
import { arePollsDisabled } from '../../../conference/functions.any';
import FileSharing from '../../../file-sharing/components/web/FileSharing';
import { isFileSharingEnabled } from '../../../file-sharing/functions.any';
import PollsPane from '../../../polls/components/web/PollsPane';
import { isCCTabEnabled } from '../../../subtitles/functions.any';
import { sendMessage, setChatIsResizing, setFocusedTab, setUserChatWidth, toggleChat } from '../../actions.web';
import { CHAT_SIZE, ChatTabs, SMALL_WIDTH_THRESHOLD } from '../../constants';
import { getChatMaxSize } from '../../functions';
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
     * True if file sharing tab is enabled.
     */
    _isFileSharingTabEnabled: boolean;

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
     * Whether the user is currently resizing the chat panel.
     */
    _isResizing: boolean;

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

    /**
     * The current width of the chat panel.
     */
    _width: number;
}

const useStyles = makeStyles<{ _isResizing: boolean; width: number; }>()((theme, { _isResizing, width }) => {
    return {
        container: {
            backgroundColor: theme.palette.ui01,
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
            transition: _isResizing ? undefined : 'width .16s ease-in-out',
            width: `${width}px`,
            zIndex: 300,

            '&:hover, &:focus-within': {
                '& .dragHandleContainer': {
                    visibility: 'visible'
                }
            },

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
            ...theme.typography.heading6,
            lineHeight: 'unset',
            fontWeight: theme.typography.heading6.fontWeight as any,

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
        },

        resizableChat: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
        },

        dragHandleContainer: {
            height: '100%',
            width: '9px',
            backgroundColor: 'transparent',
            position: 'absolute',
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            visibility: 'hidden',
            right: '4px',
            top: 0,

            '&:hover': {
                '& .dragHandle': {
                    backgroundColor: theme.palette.icon01
                }
            },

            '&.visible': {
                visibility: 'visible',

                '& .dragHandle': {
                    backgroundColor: theme.palette.icon01
                }
            }
        },

        dragHandle: {
            backgroundColor: theme.palette.icon02,
            height: '100px',
            width: '3px',
            borderRadius: '1px'
        }
    };
});

const Chat = ({
    _isModal,
    _isOpen,
    _isPollsEnabled,
    _isCCTabEnabled,
    _isFileSharingTabEnabled,
    _focusedTab,
    _isResizing,
    _messages,
    _nbUnreadMessages,
    _nbUnreadPolls,
    _onSendMessage,
    _onToggleChat,
    _onToggleChatTab,
    _onTogglePollsTab,
    _showNamePrompt,
    _width,
    dispatch,
    t
}: IProps) => {
    const { classes, cx } = useStyles({ _isResizing, width: _width });
    const [ isMouseDown, setIsMouseDown ] = useState(false);
    const [ mousePosition, setMousePosition ] = useState<number | null>(null);
    const [ dragChatWidth, setDragChatWidth ] = useState<number | null>(null);
    const maxChatWidth = useSelector(getChatMaxSize);

    /**
     * Handles mouse down on the drag handle.
     *
     * @param {MouseEvent} e - The mouse down event.
     * @returns {void}
     */
    const onDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Store the initial mouse position and chat width
        setIsMouseDown(true);
        setMousePosition(e.clientX);
        setDragChatWidth(_width);

        // Indicate that resizing is in progress
        dispatch(setChatIsResizing(true));

        // Add visual feedback that we're dragging
        document.body.style.cursor = 'col-resize';

        // Disable text selection during resize
        document.body.style.userSelect = 'none';

        console.log('Chat resize: Mouse down', { clientX: e.clientX, initialWidth: _width });
    }, [ _width, dispatch ]);

    /**
     * Drag handle mouse up handler.
     *
     * @returns {void}
     */
    const onDragMouseUp = useCallback(() => {
        if (isMouseDown) {
            setIsMouseDown(false);
            dispatch(setChatIsResizing(false));

            // Restore cursor and text selection
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            console.log('Chat resize: Mouse up');
        }
    }, [ isMouseDown, dispatch ]);

    /**
     * Handles drag handle mouse move.
     *
     * @param {MouseEvent} e - The mousemove event.
     * @returns {void}
     */
    const onChatResize = useCallback(throttle((e: MouseEvent) => {
        // console.log('Chat resize: Mouse move', { clientX: e.clientX, isMouseDown, mousePosition, _width });
        if (isMouseDown && mousePosition !== null && dragChatWidth !== null) {
            // For chat panel resizing on the left edge:
            // - Dragging left (decreasing X coordinate) should make the panel wider
            // - Dragging right (increasing X coordinate) should make the panel narrower
            const diff = e.clientX - mousePosition;

            const newWidth = Math.max(
                Math.min(dragChatWidth + diff, maxChatWidth),
                CHAT_SIZE
            );

            // Update the width only if it has changed
            if (newWidth !== _width) {
                dispatch(setUserChatWidth(newWidth));
            }
        }
    }, 50, {
        leading: true,
        trailing: false
    }), [ isMouseDown, mousePosition, dragChatWidth, _width, maxChatWidth, dispatch ]);

    // Set up event listeners when component mounts
    useEffect(() => {
        document.addEventListener('mouseup', onDragMouseUp);
        document.addEventListener('mousemove', onChatResize);

        return () => {
            document.removeEventListener('mouseup', onDragMouseUp);
            document.removeEventListener('mousemove', onChatResize);
        };
    }, [ onDragMouseUp, onChatResize ]);

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
                        !_isPollsEnabled
                        && !_isCCTabEnabled
                        && !_isFileSharingTabEnabled
                        && classes.chatPanelNoTabs,
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
                { _isFileSharingTabEnabled && <div
                    aria-labelledby = { ChatTabs.FILE_SHARING }
                    className = { cx(classes.chatPanel, _focusedTab !== ChatTabs.FILE_SHARING && 'hide') }
                    id = { `${ChatTabs.FILE_SHARING}-panel` }
                    role = 'tabpanel'
                    tabIndex = { 3 }>
                    <FileSharing />
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
        let tabs = [
            {
                accessibilityLabel: t('chat.tabs.chat'),
                countBadge:
                    _focusedTab !== ChatTabs.CHAT && _nbUnreadMessages > 0 ? _nbUnreadMessages : undefined,
                id: ChatTabs.CHAT,
                controlsId: `${ChatTabs.CHAT}-panel`,
                icon: IconMessage
            }
        ];

        if (_isPollsEnabled) {
            tabs.push({
                accessibilityLabel: t('chat.tabs.polls'),
                countBadge: _focusedTab !== ChatTabs.POLLS && _nbUnreadPolls > 0 ? _nbUnreadPolls : undefined,
                id: ChatTabs.POLLS,
                controlsId: `${ChatTabs.POLLS}-panel`,
                icon: IconInfo
            });
        }

        if (_isCCTabEnabled) {
            tabs.push({
                accessibilityLabel: t('chat.tabs.closedCaptions'),
                countBadge: undefined,
                id: ChatTabs.CLOSED_CAPTIONS,
                controlsId: `${ChatTabs.CLOSED_CAPTIONS}-panel`,
                icon: IconSubtitles
            });
        }

        if (_isFileSharingTabEnabled) {
            tabs.push({
                accessibilityLabel: t('chat.tabs.fileSharing'),
                countBadge: undefined,
                id: ChatTabs.FILE_SHARING,
                controlsId: `${ChatTabs.FILE_SHARING}-panel`,
                icon: IconShareDoc
            });
        }

        if (tabs.length === 1) {
            tabs = [];
        }

        return (
            <Tabs
                accessibilityLabel = { _isPollsEnabled || _isCCTabEnabled || _isFileSharingTabEnabled
                    ? t('chat.titleWithFeatures', {
                        features: [
                            _isPollsEnabled ? t('chat.titleWithPolls') : '',
                            _isCCTabEnabled ? t('chat.titleWithCC') : '',
                            _isFileSharingTabEnabled ? t('chat.titleWithFileSharing') : ''
                        ].filter(Boolean).join(', ')
                    })
                    : t('chat.title')
                }
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
            <div
                className = { cx(
                    classes.dragHandleContainer,
                    (isMouseDown || _isResizing) && 'visible',
                    'dragHandleContainer'
                ) }
                onMouseDown = { onDragHandleMouseDown }>
                <div className = { cx(classes.dragHandle, 'dragHandle') } />
            </div>
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
 *     _showNamePrompt: boolean,
 *     _width: number,
 *     _isResizing: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { isOpen, focusedTab, messages, nbUnreadMessages, width, isResizing } = state['features/chat'];
    const { nbUnreadPolls } = state['features/polls'];
    const _localParticipant = getLocalParticipant(state);

    return {
        _isModal: window.innerWidth <= SMALL_WIDTH_THRESHOLD,
        _isOpen: isOpen,
        _isPollsEnabled: !arePollsDisabled(state),
        _isCCTabEnabled: isCCTabEnabled(state),
        _isFileSharingTabEnabled: isFileSharingEnabled(state),
        _focusedTab: focusedTab,
        _messages: messages,
        _nbUnreadMessages: nbUnreadMessages,
        _nbUnreadPolls: nbUnreadPolls,
        _showNamePrompt: !_localParticipant?.name,
        _width: width?.current || CHAT_SIZE,
        _isResizing: isResizing
    };
}

export default translate(connect(_mapStateToProps)(Chat));
