// @flow

import React from 'react';
import { toArray } from 'react-emoji-render';
import Linkify from 'react-linkify';


import { translate } from '../../../base/i18n';

import AbstractChatMessage, {
    type Props
} from '../AbstractChatMessage';

/**
 * Renders a single chat message.
 */
class ChatMessage extends AbstractChatMessage<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { message } = this.props;
        const messageToDisplay = message.messageType === 'error'
            ? this.props.t('chat.error', {
                error: message.error,
                originalText: message.message
            })
            : message.message;

        // replace links and smileys
        // Strophe already escapes special symbols on sending,
        // so we escape here only tags to avoid double &amp;
        const escMessage = messageToDisplay.replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>');
        const processedMessage = [];

        // content is an array of text and emoji components
        const content = toArray(escMessage, { className: 'smiley' });

        content.forEach(i => {
            if (typeof i === 'string') {
                processedMessage.push(
                    <Linkify
                        key = { i }
                        properties = {{
                            rel: 'noopener noreferrer',
                            target: '_blank'
                        }}>{ i }</Linkify>);
            } else {
                processedMessage.push(i);
            }
        });

        return (
            <div className = 'chatmessage-wrapper'>
                <div className = 'chatmessage'>
                    { this.props.showDisplayName && this._renderDisplayName() }
                    <div className = 'usermessage'>
                        { processedMessage }
                    </div>
                </div>
                { this.props.showTimestamp && this._renderTimestamp() }
            </div>
        );
    }

    _getFormattedTimestamp: () => string;

    /**
     * Renders the display name of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderDisplayName() {
        return (
            <div className = 'display-name'>
                { this.props.message.displayName }
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
            <div className = 'timestamp'>
                { this._getFormattedTimestamp() }
            </div>
        );
    }
}

export default translate(ChatMessage);
