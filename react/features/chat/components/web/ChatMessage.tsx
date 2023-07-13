import { Theme } from '@mui/material';
import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import Message from '../../../base/react/components/web/Message';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { MESSAGE_TYPE_LOCAL } from '../../constants';
import { getFormattedTimestamp, getMessageText, getPrivateNoticeMessage } from '../../functions';
import { IChatMessageProps } from '../../types';

import PrivateMessageButton from './PrivateMessageButton';

interface IProps extends IChatMessageProps {

    type: string;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
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
                }
            },

            '&.error': {
                backgroundColor: 'rgb(215, 121, 118)',
                borderRadius: 0,
                fontWeight: 100
            },

            '&.lobbymessage': {
                backgroundColor: theme.palette.support05
            }
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

        replyButtonContainer: {
            display: 'flex',
            alignItems: 'flex-start',
            height: '100%'
        },

        replyButton: {
            padding: '2px'
        },

        displayName: {
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.text02,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            marginBottom: theme.spacing(1)
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
            marginTop: theme.spacing(1)
        }
    };
});

/**
 * Renders a single chat message.
 *
 * @param {IProps} props - Component's props.
 * @returns {JSX}
 */
const ChatMessage = ({
    knocking,
    message,
    showDisplayName,
    showTimestamp,
    type,
    t
}: IProps) => {
    const { classes, cx } = useStyles();

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
                {getFormattedTimestamp(message)}
            </div>
        );
    }

    return (
        <div
            className = { cx(classes.chatMessageWrapper, type) }
            id = { message.messageId }
            tabIndex = { -1 }>
            <div
                className = { cx('chatmessage', classes.chatMessage, type,
                    message.privateMessage && 'privatemessage',
                    message.lobbyChat && !knocking && 'lobbymessage') }>
                <div className = { classes.replyWrapper }>
                    <div className = { cx('messagecontent', classes.messageContent) }>
                        {showDisplayName && _renderDisplayName()}
                        <div className = { cx('usermessage', classes.userMessage) }>
                            <span className = 'sr-only'>
                                {message.displayName === message.recipient
                                    ? t('chat.messageAccessibleTitleMe')
                                    : t('chat.messageAccessibleTitle',
                                        { user: message.displayName })}
                            </span>
                            <Message text = { getMessageText(message) } />
                        </div>
                        {(message.privateMessage || (message.lobbyChat && !knocking))
                            && _renderPrivateNotice()}
                    </div>
                    {(message.privateMessage || (message.lobbyChat && !knocking))
                        && message.messageType !== MESSAGE_TYPE_LOCAL
                        && (
                            <div
                                className = { classes.replyButtonContainer }>
                                <PrivateMessageButton
                                    isLobbyMessage = { message.lobbyChat }
                                    participantID = { message.id } />
                            </div>
                        )}
                </div>
            </div>
            {showTimestamp && _renderTimestamp()}
        </div>
    );
};

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { knocking } = state['features/lobby'];

    return {
        knocking
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));
