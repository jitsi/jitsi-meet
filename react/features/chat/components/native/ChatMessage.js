// @flow

import React from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { translate } from '../../../base/i18n';
import { Linkify } from '../../../base/react';
import { connect } from '../../../base/redux';
import { type StyleType } from '../../../base/styles';
import { MESSAGE_TYPE_ERROR, MESSAGE_TYPE_LOCAL } from '../../constants';
import { replaceNonUnicodeEmojis } from '../../functions';
import AbstractChatMessage, { type Props as AbstractProps } from '../AbstractChatMessage';
import PrivateMessageButton from '../PrivateMessageButton';

import styles from './styles';

type Props = AbstractProps & {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType
};

/**
 * Renders a single chat message.
 */
class ChatMessage extends AbstractChatMessage<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _styles, message } = this.props;
        const localMessage = message.messageType === MESSAGE_TYPE_LOCAL;
        const { privateMessage } = message;

        // Style arrays that need to be updated in various scenarios, such as
        // error messages or others.
        const detailsWrapperStyle = [
            styles.detailsWrapper
        ];
        const messageBubbleStyle = [
            styles.messageBubble
        ];

        if (localMessage) {
            // This is a message sent by the local participant.

            // The wrapper needs to be aligned to the right.
            detailsWrapperStyle.push(styles.ownMessageDetailsWrapper);

            // The bubble needs some additional styling
            messageBubbleStyle.push(_styles.localMessageBubble);
        } else if (message.messageType === MESSAGE_TYPE_ERROR) {
            // This is a system message.

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.systemMessageBubble);
        } else {
            // This is a remote message sent by a remote participant.

            // The bubble needs some additional styling
            messageBubbleStyle.push(_styles.remoteMessageBubble);
        }

        if (privateMessage) {
            messageBubbleStyle.push(_styles.privateMessageBubble);
        }

        return (
            <View style = { styles.messageWrapper } >
                { this._renderAvatar() }
                <View style = { detailsWrapperStyle }>
                    <View style = { messageBubbleStyle }>
                        <View style = { styles.textWrapper } >
                            { this._renderDisplayName() }
                            <Linkify linkStyle = { styles.chatLink }>
                                { replaceNonUnicodeEmojis(this._getMessageText()) }
                            </Linkify>
                            { this._renderPrivateNotice() }
                        </View>
                        { this._renderPrivateReplyButton() }
                    </View>
                    { this._renderTimestamp() }
                </View>
            </View>
        );
    }

    _getFormattedTimestamp: () => string;

    _getMessageText: () => string;

    _getPrivateNoticeMessage: () => string;

    /**
     * Renders the avatar of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderAvatar() {
        const { message } = this.props;

        return (
            <View style = { styles.avatarWrapper }>
                { this.props.showAvatar && <Avatar
                    displayName = { message.displayName }
                    participantId = { message.id }
                    size = { styles.avatarWrapper.width } />
                }
            </View>
        );
    }

    /**
     * Renders the display name of the sender if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderDisplayName() {
        const { _styles, message, showDisplayName } = this.props;

        if (!showDisplayName) {
            return null;
        }

        return (
            <Text style = { _styles.displayName }>
                { message.displayName }
            </Text>
        );
    }

    /**
     * Renders the message privacy notice, if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderPrivateNotice() {
        const { _styles, message } = this.props;

        if (!message.privateMessage) {
            return null;
        }

        return (
            <Text style = { _styles.privateNotice }>
                { this._getPrivateNoticeMessage() }
            </Text>
        );
    }

    /**
     * Renders the private reply button, if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderPrivateReplyButton() {
        const { _styles, message } = this.props;
        const { messageType, privateMessage } = message;

        if (!privateMessage || messageType === MESSAGE_TYPE_LOCAL) {
            return null;
        }

        return (
            <View style = { _styles.replyContainer }>
                <PrivateMessageButton
                    participantID = { message.id }
                    reply = { true }
                    showLabel = { false }
                    toggledStyles = { _styles.replyStyles } />
            </View>
        );
    }

    /**
     * Renders the time at which the message was sent, if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderTimestamp() {
        if (!this.props.showTimestamp) {
            return null;
        }

        return (
            <Text style = { styles.timeText }>
                { this._getFormattedTimestamp() }
            </Text>
        );
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _styles: ColorSchemeRegistry.get(state, 'Chat')
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));
