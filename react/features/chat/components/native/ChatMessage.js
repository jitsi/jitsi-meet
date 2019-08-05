// @flow

import React from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { Linkify } from '../../../base/react';

import AbstractChatMessage, { type Props } from '../AbstractChatMessage';
import styles from './styles';

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
        const { message } = this.props;
        const localMessage = message.messageType === 'local';

        // Style arrays that need to be updated in various scenarios, such as
        // error messages or others.
        const detailsWrapperStyle = [
            styles.detailsWrapper
        ];
        const textWrapperStyle = [
            styles.textWrapper
        ];

        if (localMessage) {
            // The wrapper needs to be aligned to the right.
            detailsWrapperStyle.push(styles.ownMessageDetailsWrapper);

            // The bubble needs to be differently styled.
            textWrapperStyle.push(styles.ownTextWrapper);
        } else if (message.messageType === 'error') {
            // The bubble needs to be differently styled.
            textWrapperStyle.push(styles.systemTextWrapper);
        }

        const messageText = message.messageType === 'error'
            ? this.props.t('chat.error', {
                error: message.error,
                originalText: message.message
            })
            : message.message;

        return (
            <View style = { styles.messageWrapper } >
                { this._renderAvatar() }
                <View style = { detailsWrapperStyle }>
                    <View style = { textWrapperStyle } >
                        {
                            this.props.showDisplayName
                                && this._renderDisplayName()
                        }
                        <Linkify linkStyle = { styles.chatLink }>
                            { messageText }
                        </Linkify>
                    </View>
                    { this.props.showTimestamp && this._renderTimestamp() }
                </View>
            </View>
        );
    }

    _getFormattedTimestamp: () => string;

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
     * Renders the display name of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderDisplayName() {
        return (
            <Text style = { styles.displayName }>
                { this.props.message.displayName }
            </Text>
        );
    }

    /**
     * Renders the time at which the message was sent.
     *
     * @returns {React$Element<*>}
     */
    _renderTimestamp() {
        return (
            <Text style = { styles.timeText }>
                { this._getFormattedTimestamp() }
            </Text>
        );
    }
}

export default translate(ChatMessage);
