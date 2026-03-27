import { Theme } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { getParticipantById, getParticipantDisplayName, isPrivateChatEnabled } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import Message from '../../../base/react/components/web/Message';
import { setEditMessageTarget } from '../../actions.web';
import { MESSAGE_TYPE_LOCAL } from '../../constants';
import { getDisplayNameSuffix, getFormattedTimestamp, getMessageText, getPrivateNoticeMessage, isFileMessage } from '../../functions';
import { IChatMessageProps } from '../../types';

import FileMessage from './FileMessage';
import MessageMenu from './MessageMenu';
import ReactButton from './ReactButton';

interface IProps extends IChatMessageProps {
    className?: string;
    enablePrivateChat?: boolean;
    shouldDisplayMenuOnRight?: boolean;
    state?: IReduxState;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        chatMessageFooter: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: theme.spacing(1)
        },
        chatMessageFooterLeft: {
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden'
        },
        chatMessageWrapper: {
            maxWidth: '100%'
        },
        chatMessage: {
            display: 'inline-flex',
            padding: '12px',
            backgroundColor: theme.palette.chatMessageRemote,
            borderRadius: '4px 12px 12px 12px',
            maxWidth: '100%',
            marginTop: '4px',
            boxSizing: 'border-box' as const,

            '&.file': {
                display: 'flex',
                maxWidth: '100%',
                minWidth: 0,

                '& $replyWrapper': {
                    width: '100%',
                    minWidth: 0
                },

                '& $messageContent': {
                    width: '100%',
                    minWidth: 0
                }
            },

            '&.privatemessage': {
                backgroundColor: theme.palette.chatMessagePrivate
            },
            '&.local': {
                backgroundColor: theme.palette.chatMessageLocal,
                borderRadius: '12px 4px 12px 12px',

                '&.privatemessage': {
                    backgroundColor: theme.palette.chatMessagePrivate
                },
                '&.local': {
                    backgroundColor: theme.palette.chatMessageLocal,
                    borderRadius: '12px 4px 12px 12px',

                    '&.privatemessage': {
                        backgroundColor: theme.palette.chatMessagePrivate
                    }
                },

                '&.error': {
                    backgroundColor: theme.palette.actionDanger,
                    borderRadius: 0,
                    fontWeight: 100
                },

                '&.lobbymessage': {
                    backgroundColor: theme.palette.chatMessagePrivate
                }
            },
            '&.error': {
                backgroundColor: theme.palette.actionDanger,
                borderRadius: 0,
                fontWeight: 100
            },
            '&.lobbymessage': {
                backgroundColor: theme.palette.chatMessagePrivate
            }
        },
        sideBySideContainer: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'left',
            alignItems: 'center',
            marginLeft: theme.spacing(1)
        },
        reactionBox: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(1),
            backgroundColor: theme.palette.grey[800],
            borderRadius: theme.shape.borderRadius,
            padding: theme.spacing(0, 1),
            cursor: 'pointer'
        },
        reactionCount: {
            fontSize: '0.8rem',
            color: theme.palette.grey[400]
        },
        replyButton: {
            padding: '2px'
        },
        replyWrapper: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
            maxWidth: '100%'
        },
        messageContent: {
            maxWidth: '100%',
            overflow: 'hidden'
        },
        optionsButtonContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing(1),
            minWidth: '32px',
            minHeight: '32px'
        },
        displayName: {
            ...theme.typography.labelBold,
            color: theme.palette.chatSenderName,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            marginBottom: theme.spacing(1),
            maxWidth: '130px'
        },
        userMessage: {
            ...theme.typography.bodyShortRegular,
            color: theme.palette.chatMessageText,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
        },
        privateMessageNotice: {
            ...theme.typography.labelRegular,
            color: theme.palette.chatPrivateNotice,
            marginTop: theme.spacing(1)
        },
        timestamp: {
            ...theme.typography.labelRegular,
            color: theme.palette.chatTimestamp,
            marginTop: theme.spacing(1),
            marginLeft: theme.spacing(1),
            whiteSpace: 'nowrap',
            flexShrink: 0
        },
        editedLabel: {
            ...theme.typography.labelRegular,
            color: theme.palette.chatTimestamp,
            marginTop: theme.spacing(1),
            whiteSpace: 'nowrap'
        },
        editHistoryPopover: {
            padding: theme.spacing(2),
            backgroundColor: theme.palette.chatInputBackground,
            borderRadius: theme.shape.borderRadius,
            maxWidth: '250px',
            maxHeight: '400px',
            overflowY: 'auto',
            color: theme.palette.chatMessageText
        },
        editHistoryItem: {
            marginBottom: theme.spacing(1),
            paddingBottom: theme.spacing(1),
            borderBottom: `1px solid ${theme.palette.divider}`,
            '&:last-child': {
                borderBottom: 'none',
                paddingBottom: 0,
                marginBottom: 0
            }
        },
        reactionsPopover: {
            padding: theme.spacing(2),
            backgroundColor: theme.palette.chatInputBackground,
            borderRadius: theme.shape.borderRadius,
            maxWidth: '150px',
            maxHeight: '400px',
            overflowY: 'auto',
            color: theme.palette.chatMessageText
        },
        reactionItem: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: theme.spacing(1),
            gap: theme.spacing(1),
            borderBottom: `1px solid ${theme.palette.common.white}`,
            paddingBottom: theme.spacing(1),
            '&:last-child': {
                borderBottom: 'none',
                paddingBottom: 0
            }
        },
        participantList: {
            marginLeft: theme.spacing(1),
            fontSize: '0.8rem',
            maxWidth: '120px'
        },
        participant: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }
    };
});

const ChatMessage = ({
    className = '',
    message,
    state,
    showDisplayName,
    shouldDisplayMenuOnRight,
    enablePrivateChat,
    knocking,
    t
}: IProps) => {
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();
    const historyCardRef = useRef<HTMLDivElement>(null);
    const [ isHovered, setIsHovered ] = useState(false);
    const [ isReactionsOpen, setIsReactionsOpen ] = useState(false);
    const [ isHistoryOpen, setIsHistoryOpen ] = useState(false);

    useEffect(() => {
        if (!isHistoryOpen) {
            return;
        }

        const handleDocumentPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;

            if (historyCardRef.current?.contains(target)) {
                return;
            }

            setIsHistoryOpen(false);
        };

        document.addEventListener('pointerdown', handleDocumentPointerDown);

        return () => {
            document.removeEventListener('pointerdown', handleDocumentPointerDown);
        };
    }, [ isHistoryOpen ]);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    const handleReactionsOpen = useCallback(() => {
        setIsReactionsOpen(true);
    }, []);

    const handleReactionsClose = useCallback(() => {
        setIsReactionsOpen(false);
    }, []);

    const handleEditMessage = useCallback(() => {
        setIsHistoryOpen(false);
        dispatch(setEditMessageTarget(message.messageId));
    }, [ dispatch, message.messageId ]);

    const handleToggleHistory = useCallback(() => {
        setIsHistoryOpen(value => !value);
    }, []);

    const handleHistoryKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsHistoryOpen(false);
        }
    }, []);

    /**
     * Renders the display name of the sender.
     *
     * @returns {React$Element<*>}
     */
    function _renderDisplayName() {
        const { displayName } = message;

        return (
            <div
                aria-hidden = { true }
                className = { cx('display-name', classes.displayName) }>
                {`${displayName}${getDisplayNameSuffix(message)}`}
            </div>
        );
    }

    /**
     * Renders the message privacy notice.
     *
     * @returns {React$Element<*>}
     */
    function _renderPrivateNotice() {
        return (
            <div className = { classes.privateMessageNotice }>
                {getPrivateNoticeMessage(message)}
            </div>
        );
    }

    /**
     * Renders the time at which the message was sent.
     *
     * @returns {React$Element<*>}
     */
    function _renderTimestamp() {
        return (
            <div className = { cx('timestamp', classes.timestamp) }>
                <p>
                    {getFormattedTimestamp(message)}
                </p>
            </div>
        );
    }

    const editedLabel = message.isEdited
        ? (
            <span className = { classes.editedLabel }>
                {t('chat.editedLabel')}
            </span>
        )
        : null;

    const editHistory = (isHistoryOpen && message.versions?.length)
        ? (
            <div
                aria-label = { t('chat.viewEditHistory') }
                aria-modal = { false }
                className = { classes.editHistoryPopover }
                onKeyDown = { handleHistoryKeyDown }
                ref = { historyCardRef }
                role = 'dialog'
                tabIndex = { -1 }>
                {message.versions.map((version, index) => (
                    <div
                        className = { classes.editHistoryItem }
                        key = { `${version.editedAt}-${index}` }>
                        <p>{new Date(version.editedAt).toLocaleString()}</p>
                        <p>{version.message}</p>
                    </div>
                ))}
            </div>
        )
        : null;

    /**
     * Renders the reactions for the message.
     *
     * @returns {React$Element<*>}
     */
    const renderReactions = useMemo(() => {
        if (!message.reactions || message.reactions.size === 0) {
            return null;
        }

        const reactionsArray = Array.from(message.reactions.entries())
            .map(([ reaction, participants ]) => {
                return { reaction,
                    participants };
            })
            .sort((a, b) => b.participants.size - a.participants.size);

        const totalReactions = reactionsArray.reduce((sum, { participants }) => sum + participants.size, 0);
        const numReactionsDisplayed = 3;

        const reactionsContent = (
            <div className = { classes.reactionsPopover }>
                {reactionsArray.map(({ reaction, participants }) => (
                    <div
                        className = { classes.reactionItem }
                        key = { reaction }>
                        <p>
                            <span>{reaction}</span>
                            <span>{participants.size}</span>
                        </p>
                        <div className = { classes.participantList }>
                            {Array.from(participants).map(participantId => (
                                <p
                                    className = { classes.participant }
                                    key = { participantId }>
                                    {state && getParticipantDisplayName(state, participantId)}
                                </p>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );

        return (
            <Popover
                content = { reactionsContent }
                onPopoverClose = { handleReactionsClose }
                onPopoverOpen = { handleReactionsOpen }
                position = 'top'
                trigger = 'hover'
                visible = { isReactionsOpen }>
                <div className = { classes.reactionBox }>
                    {reactionsArray.slice(0, numReactionsDisplayed).map(({ reaction }, index) =>
                        <p key = { index }>{reaction}</p>
                    )}
                    {reactionsArray.length > numReactionsDisplayed && (
                        <p className = { classes.reactionCount }>
                            +{totalReactions - numReactionsDisplayed}
                        </p>
                    )}
                </div>
            </Popover>
        );
    }, [ message?.reactions, isHovered, isReactionsOpen ]);

    const canEditMessage = message.messageType === MESSAGE_TYPE_LOCAL
        && !message.privateMessage
        && !message.lobbyChat
        && !message.isReaction
        && !isFileMessage(message);
    const hasEditHistory = Boolean(message.versions?.length);

    return (
        <div
            className = { cx(classes.chatMessageWrapper, className) }
            id = { message.messageId }
            onMouseEnter = { handleMouseEnter }
            onMouseLeave = { handleMouseLeave }
            tabIndex = { -1 }>
            <div className = { classes.sideBySideContainer }>
                {!shouldDisplayMenuOnRight && (
                    <div className = { classes.optionsButtonContainer }>
                        {isHovered && <MessageMenu
                            canEditMessage = { canEditMessage }
                            displayName = { message.displayName }
                            enablePrivateChat = { Boolean(enablePrivateChat) }
                            hasEditHistory = { hasEditHistory }
                            isFileMessage = { isFileMessage(message) }
                            isFromVisitor = { message.isFromVisitor }
                            isLobbyMessage = { message.lobbyChat }
                            message = { message.message }
                            onEditMessage = { handleEditMessage }
                            onShowEditHistory = { handleToggleHistory }
                            participantId = { message.participantId } />}
                        {editHistory}
                    </div>
                )}
                <div
                    className = { cx(
                        'chatmessage',
                        classes.chatMessage,
                        className,
                        message.privateMessage && 'privatemessage',
                        message.lobbyChat && !knocking && 'lobbymessage',
                        isFileMessage(message) && 'file'
                    ) }>
                    <div className = { classes.replyWrapper }>
                        <div className = { cx('messagecontent', classes.messageContent) }>
                            {showDisplayName && _renderDisplayName()}
                            <div className = { cx('usermessage', classes.userMessage) }>
                                {isFileMessage(message) ? (
                                    <FileMessage
                                        message = { message }
                                        screenReaderHelpText = { message.messageType === MESSAGE_TYPE_LOCAL
                                            ? t<string>('chat.fileAccessibleTitleMe')
                                            : t<string>('chat.fileAccessibleTitle', {
                                                user: message.displayName
                                            })
                                        } />
                                ) : (
                                    <Message
                                        screenReaderHelpText = { message.messageType === MESSAGE_TYPE_LOCAL
                                            ? t<string>('chat.messageAccessibleTitleMe')
                                            : t<string>('chat.messageAccessibleTitle', {
                                                user: message.displayName
                                            }) }
                                        text = { getMessageText(message) } />
                                )}
                                {(message.privateMessage || (message.lobbyChat && !knocking))
                                    && _renderPrivateNotice()}
                                <div className = { classes.chatMessageFooter }>
                                    <div className = { classes.chatMessageFooterLeft }>
                                        {message.reactions && message.reactions.size > 0 && (
                                            <>
                                                {renderReactions}
                                            </>
                                        )}
                                        {editedLabel}
                                    </div>
                                    {_renderTimestamp()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {shouldDisplayMenuOnRight && (
                    <div className = { classes.sideBySideContainer }>
                        {!message.privateMessage && !message.lobbyChat
                        && !message.isReaction && <div>
                            <div className = { classes.optionsButtonContainer }>
                                {isHovered && <ReactButton
                                    messageId = { message.messageId }
                                    receiverId = { '' } />}
                            </div>
                        </div>}
                        <div>
                            <div className = { classes.optionsButtonContainer }>
                                {isHovered && <MessageMenu
                                    canEditMessage = { canEditMessage }
                                    displayName = { message.displayName }
                                    enablePrivateChat = { Boolean(enablePrivateChat) }
                                    hasEditHistory = { hasEditHistory }
                                    isFileMessage = { isFileMessage(message) }
                                    isFromVisitor = { message.isFromVisitor }
                                    isLobbyMessage = { message.lobbyChat }
                                    message = { message.message }
                                    onEditMessage = { handleEditMessage }
                                    onShowEditHistory = { handleToggleHistory }
                                    participantId = { message.participantId } />}
                                {editHistory}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, { message }: IProps) {
    const { knocking } = state['features/lobby'];

    const participant = getParticipantById(state, message.participantId);

    // For visitor private messages, participant will be undefined but we should still allow private chat
    // Create a visitor participant object for visitor messages to pass to isPrivateChatEnabled
    const participantForCheck = message.isFromVisitor
        ? { id: message.participantId, name: message.displayName, isVisitor: true as const }
        : participant;

    const enablePrivateChat = (!message.isFromVisitor || message.privateMessage)
        && isPrivateChatEnabled(participantForCheck, state);

    // Only the local messages appear on the right side of the chat therefore only for them the menu has to be on the
    // left side.
    const shouldDisplayMenuOnRight = message.messageType !== MESSAGE_TYPE_LOCAL;

    return {
        shouldDisplayMenuOnRight,
        enablePrivateChat,
        knocking,
        state
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));
