import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import Message from '../../../base/react/components/web/Message';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { MESSAGE_TYPE_LOCAL } from '../../constants';
import AbstractChatMessage, { IProps as AbstractProps } from '../AbstractChatMessage';

import PrivateMessageButton from './PrivateMessageButton';

interface IProps extends AbstractProps {

    classes: any;

    type: string;
}

const styles = (theme: Theme) => {
    return {
        chatMessageWrapper: {
            maxWidth: '100%'
        },

        chatMessage: {
            display: 'inline-flex',
            padding: '12px',
            backgroundColor: theme.palette.ui02,
            borderRadius: '4px 12px 12px 12px',
            boxSizing: 'border-box' as const,
            maxWidth: '100%',
            marginTop: '4px',

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
            alignItems: 'center'
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
            whiteSpace: 'pre-wrap'
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
};

/**
 * Renders a single chat message.
 */
class ChatMessage extends AbstractChatMessage<IProps> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { message, t, knocking, classes, type } = this.props;

        return (
            <div
                className = { classes.chatMessageWrapper }
                id = { this.props.message.messageId }
                tabIndex = { -1 }>
                <div
                    className = { clsx('chatmessage', classes.chatMessage, type,
                        message.privateMessage && 'privatemessage',
                        message.lobbyChat && !knocking && 'lobbymessage') }>
                    <div className = { classes.replyWrapper }>
                        <div className = { clsx('messagecontent', classes.messageContent) }>
                            { this.props.showDisplayName && this._renderDisplayName() }
                            <div className = { clsx('usermessage', classes.userMessage) }>
                                <span className = 'sr-only'>
                                    { this.props.message.displayName === this.props.message.recipient
                                        ? t('chat.messageAccessibleTitleMe')
                                        : t('chat.messageAccessibleTitle',
                                        { user: this.props.message.displayName }) }
                                </span>
                                <Message text = { this._getMessageText() } />
                            </div>
                            { (message.privateMessage || (message.lobbyChat && !knocking))
                                && this._renderPrivateNotice() }
                        </div>
                        { (message.privateMessage || (message.lobbyChat && !knocking))
                            && message.messageType !== MESSAGE_TYPE_LOCAL
                            && (
                                <div
                                    className = { classes.replyButtonContainer }>
                                    <PrivateMessageButton
                                        isLobbyMessage = { message.lobbyChat }
                                        participantID = { message.id } />
                                </div>
                            ) }
                    </div>
                </div>
                { this.props.showTimestamp && this._renderTimestamp() }
            </div>
        );
    }

    /**
     * Renders the display name of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderDisplayName() {
        return (
            <div
                aria-hidden = { true }
                className = { clsx('display-name', this.props.classes.displayName) }>
                { this.props.message.displayName }
            </div>
        );
    }

    /**
     * Renders the message privacy notice.
     *
     * @returns {React$Element<*>}
     */
    _renderPrivateNotice() {
        return (
            <div className = { this.props.classes.privateMessageNotice }>
                { this._getPrivateNoticeMessage() }
            </div>
        );
    }

    /**
     * Renders the time at which the message was sent.
     *
     * @returns {React$Element<*>}
     */
    _renderTimestamp() {
        return (
            <div className = { clsx('timestamp', this.props.classes.timestamp) }>
                { this._getFormattedTimestamp() }
            </div>
        );
    }
}

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

export default translate(connect(_mapStateToProps)(withStyles(styles)(ChatMessage)));
