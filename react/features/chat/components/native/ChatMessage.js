// @flow

import React from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import { getLocalizedDateFormatter, translate } from '../../../base/i18n';
import { Avatar } from '../../../base/participants';

import AbstractChatMessage, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps
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

type Props = AbstractProps & {

    /**
     * True if the chat window has a solid BG so then we have to adopt in style.
     */
    _solidBackground: boolean
}

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
        const timeTextStyles = [
            styles.timeText
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

        if (this.props._solidBackground) {
            timeTextStyles.push(styles.solidBGTimeText);
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
                    <Text style = { timeTextStyles }>
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

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {{
 *     _solidBackground: boolean
 * }}
 */
function _mapStateToProps(state, ownProps) {
    return {
        ..._abstractMapStateToProps(state, ownProps),
        _solidBackground: state['features/base/conference'].audioOnly
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));
