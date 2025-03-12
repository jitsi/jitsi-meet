import React, { Component } from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { translate } from '../../../base/i18n/functions';
import Linkify from '../../../base/react/components/native/Linkify';
import { isGifEnabled, isGifMessage } from '../../../gifs/functions.native';
import { CHAR_LIMIT, MESSAGE_TYPE_ERROR, MESSAGE_TYPE_LOCAL } from '../../constants';
import {
    getCanReplyToMessage,
    getFormattedTimestamp,
    getMessageText,
    getPrivateNoticeMessage,
    replaceNonUnicodeEmojis
} from '../../functions';
import { IChatMessageProps } from '../../types';

import GifMessage from './GifMessage';
import PrivateMessageButton from './PrivateMessageButton';
import styles from './styles';


/**
 * Renders a single chat message.
 */
class ChatMessage extends Component<IChatMessageProps> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const { gifEnabled, message, knocking } = this.props;
        const localMessage = message.messageType === MESSAGE_TYPE_LOCAL;
        const { privateMessage, lobbyChat } = message;

        // Style arrays that need to be updated in various scenarios, such as
        // error messages or others.
        const detailsWrapperStyle: ViewStyle[] = [
            styles.detailsWrapper as ViewStyle
        ];
        const messageBubbleStyle: ViewStyle[] = [
            styles.messageBubble as ViewStyle
        ];

        if (localMessage) {
            // This is a message sent by the local participant.

            // The wrapper needs to be aligned to the right.
            detailsWrapperStyle.push(styles.ownMessageDetailsWrapper as ViewStyle);

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.localMessageBubble);
        } else if (message.messageType === MESSAGE_TYPE_ERROR) {
            // This is a system message.

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.systemMessageBubble);
        } else {
            // This is a remote message sent by a remote participant.

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.remoteMessageBubble);
        }

        if (privateMessage) {
            messageBubbleStyle.push(styles.privateMessageBubble);
        }

        if (lobbyChat && !knocking) {
            messageBubbleStyle.push(styles.lobbyMessageBubble);
        }

        const messageText = getMessageText(this.props.message);

        return (
            <View
                id = { message.messageId }
                style = { styles.messageWrapper as ViewStyle } >
                { this._renderAvatar() }
                <View style = { detailsWrapperStyle }>
                    <View style = { messageBubbleStyle }>
                        <View style = { styles.textWrapper as ViewStyle } >
                            { this._renderDisplayName() }
                            { gifEnabled && isGifMessage(messageText)
                                ? <GifMessage message = { messageText } />
                                : this._renderMessageTextComponent(messageText) }
                            { this._renderPrivateNotice() }
                        </View>
                        { this._renderPrivateReplyButton() }
                    </View>
                    { this._renderTimestamp() }
                </View>
            </View>
        );
    }

    /**
     * Renders the avatar of the sender.
     *
     * @returns {React.ReactElement<*>}
     */
    _renderAvatar() {
        const { message } = this.props;

        return (
            <View style = { styles.avatarWrapper }>
                { this.props.showAvatar && <Avatar
                    displayName = { message.displayName }
                    participantId = { message.participantId }
                    size = { styles.avatarWrapper.width } />
                }
            </View>
        );
    }

    /**
     * Renders the display name of the sender if necessary.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderDisplayName() {
        const { message, showDisplayName } = this.props;

        if (!showDisplayName) {
            return null;
        }

        return (
            <Text style = { styles.senderDisplayName }>
                { message.displayName }
            </Text>
        );
    }

    /**
     * Renders the message text based on number of characters.
     *
     * @param {string} messageText - The message text.
     * @returns {React.ReactElement<*>}
     */
    _renderMessageTextComponent(messageText: string) {

        if (messageText.length >= CHAR_LIMIT) {
            return (
                <Text
                    selectable = { true }
                    style = { styles.chatMessage }>
                    { messageText }
                </Text>
            );
        }

        return (
            <Linkify
                linkStyle = { styles.chatLink }
                style = { styles.chatMessage }>
                { replaceNonUnicodeEmojis(messageText) }
            </Linkify>
        );
    }

    /**
     * Renders the message privacy notice, if necessary.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderPrivateNotice() {
        const { message, knocking } = this.props;

        if (!(message.privateMessage || (message.lobbyChat && !knocking))) {
            return null;
        }

        return (
            <Text style = { message.lobbyChat ? styles.lobbyMsgNotice : styles.privateNotice }>
                { getPrivateNoticeMessage(this.props.message) }
            </Text>
        );
    }

    /**
     * Renders the private reply button, if necessary.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderPrivateReplyButton() {
        const { message, canReply } = this.props;
        const { lobbyChat } = message;

        if (!canReply) {
            return null;
        }

        return (
            <View style = { styles.replyContainer as ViewStyle }>
                <PrivateMessageButton
                    isLobbyMessage = { lobbyChat }
                    participantID = { message.participantId }
                    reply = { true }
                    showLabel = { false }
                    toggledStyles = { styles.replyStyles } />
            </View>
        );
    }

    /**
     * Renders the time at which the message was sent, if necessary.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderTimestamp() {
        if (!this.props.showTimestamp) {
            return null;
        }

        return (
            <Text style = { styles.timeText }>
                { getFormattedTimestamp(this.props.message) }
            </Text>
        );
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IChatMessageProps} message - Message object.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, { message }: IChatMessageProps) {
    return {
        canReply: getCanReplyToMessage(state, message),
        gifEnabled: isGifEnabled(state),
        knocking: state['features/lobby'].knocking
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));
