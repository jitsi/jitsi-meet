import { Theme } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { getParticipantDisplayName } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import Message from '../../../base/react/components/web/Message';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { getFormattedTimestamp, getMessageText, getPrivateNoticeMessage } from '../../functions';
import { IChatMessageProps } from '../../types';

import MessageMenu from './MessageMenu';
import ReactButton from './ReactButton';

interface IProps extends IChatMessageProps {
    shouldDisplayChatMessageMenu: boolean;
    state?: IReduxState;
    type: string;
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
            backgroundColor: theme.palette.ui02,
            borderRadius: '4px 12px 12px 12px',
            maxWidth: '100%',
            marginTop: '4px',
            boxSizing: 'border-box' as const,

            '&.privatemessage': {
                backgroundColor: theme.palette.support05
            },
            '&.local': {
                backgroundColor: theme.palette.ui04,
                borderRadius: '12px 4px 12px 12px',

                '&.privatemessage': {
                    backgroundColor: theme.palette.support05
                },
                '&.local': {
                    backgroundColor: theme.palette.ui04,
                    borderRadius: '12px 4px 12px 12px',

                    '&.privatemessage': {
                        backgroundColor: theme.palette.support05
                    }
                },

                '&.error': {
                    backgroundColor: theme.palette.actionDanger,
                    borderRadius: 0,
                    fontWeight: 100
                },

                '&.lobbymessage': {
                    backgroundColor: theme.palette.support05
                }
            },
            '&.error': {
                backgroundColor: theme.palette.actionDanger,
                borderRadius: 0,
                fontWeight: 100
            },
            '&.lobbymessage': {
                backgroundColor: theme.palette.support05
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
            overflow: 'hidden',
            flex: 1
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
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.text02,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            marginBottom: theme.spacing(1),
            maxWidth: '130px'
        },
        userMessage: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text01,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
        },
        privateMessageNotice: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text02,
            marginTop: theme.spacing(1)
        },
        timestamp: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text03,
            marginTop: theme.spacing(1),
            marginLeft: theme.spacing(1),
            whiteSpace: 'nowrap',
            flexShrink: 0
        },
        reactionsPopover: {
            padding: theme.spacing(2),
            backgroundColor: theme.palette.ui03,
            borderRadius: theme.shape.borderRadius,
            maxWidth: '150px',
            maxHeight: '400px',
            overflowY: 'auto',
            color: theme.palette.text01
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
    message,
    state,
    showDisplayName,
    type,
    shouldDisplayChatMessageMenu,
    knocking,
    t
}: IProps) => {
    const { classes, cx } = useStyles();
    const [ isHovered, setIsHovered ] = useState(false);
    const [ isReactionsOpen, setIsReactionsOpen ] = useState(false);

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

    /**
     * Renders the display name of the sender.
     *
     * @returns {React$Element<*>}
     */
    function _renderDisplayName() {
        return (
            <div
                aria-hidden = { true }
                className = { cx('display-name', classes.displayName) }>
                {message.displayName}
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

    return (
        <div
            className = { cx(classes.chatMessageWrapper, type) }
            id = { message.messageId }
            onMouseEnter = { handleMouseEnter }
            onMouseLeave = { handleMouseLeave }
            tabIndex = { -1 }>
            <div className = { classes.sideBySideContainer }>
                {!shouldDisplayChatMessageMenu && (
                    <div className = { classes.optionsButtonContainer }>
                        {isHovered && <MessageMenu
                            isLobbyMessage = { message.lobbyChat }
                            message = { message.message }
                            participantId = { message.participantId }
                            shouldDisplayChatMessageMenu = { shouldDisplayChatMessageMenu } />}
                    </div>
                )}
                <div
                    className = { cx(
                        'chatmessage',
                        classes.chatMessage,
                        type,
                        message.privateMessage && 'privatemessage',
                        message.lobbyChat && !knocking && 'lobbymessage'
                    ) }>
                    <div className = { classes.replyWrapper }>
                        <div className = { cx('messagecontent', classes.messageContent) }>
                            {showDisplayName && _renderDisplayName()}
                            <div className = { cx('usermessage', classes.userMessage) }>
                                <Message
                                    screenReaderHelpText = { message.displayName === message.recipient
                                        ? t<string>('chat.messageAccessibleTitleMe')
                                        : t<string>('chat.messageAccessibleTitle', {
                                            user: message.displayName
                                        }) }
                                    text = { getMessageText(message) } />
                                {(message.privateMessage || (message.lobbyChat && !knocking))
                                    && _renderPrivateNotice()}
                                <div className = { classes.chatMessageFooter }>
                                    <div className = { classes.chatMessageFooterLeft }>
                                        {message.reactions && message.reactions.size > 0 && (
                                            <>
                                                {renderReactions}
                                            </>
                                        )}
                                    </div>
                                    {_renderTimestamp()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {shouldDisplayChatMessageMenu && (
                    <div className = { classes.sideBySideContainer }>
                        {!message.privateMessage && !message.lobbyChat && <div>
                            <div className = { classes.optionsButtonContainer }>
                                {isHovered && <ReactButton
                                    messageId = { message.messageId }
                                    receiverId = { '' } />}
                            </div>
                        </div>}
                        <div>
                            <div className = { classes.optionsButtonContainer }>
                                {isHovered && <MessageMenu
                                    isLobbyMessage = { message.lobbyChat }
                                    message = { message.message }
                                    participantId = { message.participantId }
                                    shouldDisplayChatMessageMenu = { shouldDisplayChatMessageMenu } />}
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
    const localParticipantId = state['features/base/participants'].local?.id;

    return {
        shouldDisplayChatMessageMenu: message.participantId !== localParticipantId,
        knocking,
        state
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));
