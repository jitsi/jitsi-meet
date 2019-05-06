// @flow

import React from 'react';
import { Text, View } from 'react-native';

import { getLocalizedDateFormatter, translate } from '../../../base/i18n';
import { Avatar } from '../../../base/participants';
import { connect } from '../../../base/redux';

import AbstractChatMessage, {
    _mapStateToProps,
    type Props
} from '../AbstractChatMessage';
import styles from './styles';

/**
 * Formatter string to display the message timestamp.
 */
const TIMESTAMP_FORMAT = 'H:mm';

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

        return (
            <View style = { styles.messageWrapper } >
                { this._renderAvatar() }
                <View style = { detailsWrapperStyle }>
                    <View style = { textWrapperStyle } >
                        {
                            this.props.showDisplayName
                                && this._renderDisplayName()
                        }
                        <Text style = { styles.messageText }>
                            { message.messageType === 'error'
                                ? this.props.t('chat.error', {
                                    error: message.error,
                                    originalText: message.message
                                })
                                : message.message }
                        </Text>
                    </View>
                    { this.props.showTimestamp && this._renderTimestamp() }
                </View>
            </View>
        );
    }

    /**
     * Renders the avatar of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderAvatar() {
        return (
            <View style = { styles.avatarWrapper }>
                { this.props.showAvatar && <Avatar
                    size = { styles.avatarWrapper.width }
                    uri = { this.props._avatarURL } />
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
                {
                    getLocalizedDateFormatter(
                        new Date(this.props.message.timestamp)
                    ).format(TIMESTAMP_FORMAT)
                }
            </Text>
        );
    }
}

export default translate(connect(_mapStateToProps)(ChatMessage));
