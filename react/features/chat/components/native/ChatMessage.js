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
 * Size of the rendered avatar in the message.
 */
const AVATAR_SIZE = 32;

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
        const timeStamp = getLocalizedDateFormatter(
            message.createdAt).format(TIMESTAMP_FORMAT);
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
        } else if (message.system) {
            // The bubble needs to be differently styled.
            textWrapperStyle.push(styles.systemTextWrapper);
        }

        return (
            <View style = { styles.messageWrapper } >
                {

                    // Avatar is only rendered for remote messages.
                    !localMessage && this._renderAvatar()
                }
                <View style = { detailsWrapperStyle }>
                    <View style = { textWrapperStyle } >
                        {

                            // Display name is only rendered for remote
                            // messages.
                            !localMessage && this._renderDisplayName()
                        }
                        <Text style = { styles.messageText }>
                            { message.text }
                        </Text>
                    </View>
                    <Text style = { styles.timeText }>
                        { timeStamp }
                    </Text>
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
        const { _avatarURL } = this.props;

        return (
            <View style = { styles.avatarWrapper }>
                <Avatar
                    size = { AVATAR_SIZE }
                    uri = { _avatarURL } />
            </View>
        );
    }

    /**
     * Renders the display name of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderDisplayName() {
        const { message } = this.props;

        return (
            <Text style = { styles.displayName }>
                { message.user.name }
            </Text>
        );
    }
}

export default translate(connect(_mapStateToProps)(ChatMessage));
