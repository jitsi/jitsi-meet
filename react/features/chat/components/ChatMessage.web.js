// @flow

import React, { PureComponent } from 'react';
import { toArray } from 'react-emoji-render';
import Linkify from 'react-linkify';


import { translate } from '../../base/i18n';

/**
 * The type of the React {@code Component} props of {@link Chat}.
 */
type Props = {

    /**
     * The redux representation of a chat message.
     */
    message: Object,

    /**
     * Invoked to receive translated strings.
     */
    t: Function
};

/**
 * Displays as passed in chat message.
 *
 * @extends Component
 */
class ChatMessage extends PureComponent<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { message } = this.props;
        let messageTypeClassname = '';
        let messageToDisplay = message.message;

        switch (message.messageType) {
        case 'local':
            messageTypeClassname = 'localuser';

            break;
        case 'error':
            messageTypeClassname = 'error';
            messageToDisplay = this.props.t('chat.error', {
                error: message.error,
                originalText: messageToDisplay
            });
            break;
        default:
            messageTypeClassname = 'remoteuser';
        }

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
            <div className = { `chatmessage ${messageTypeClassname}` }>
                <img
                    className = 'chatArrow'
                    src = 'images/chatArrow.svg' />
                <div className = 'display-name'>
                    { message.displayName }
                </div>
                <div className = { 'timestamp' }>
                    { ChatMessage.formatTimestamp(message.timestamp) }
                </div>
                <div className = 'usermessage'>
                    { processedMessage }
                </div>
            </div>
        );
    }

    /**
     * Returns a timestamp formatted for display.
     *
     * @param {number} timestamp - The timestamp for the chat message.
     * @private
     * @returns {string}
     */
    static formatTimestamp(timestamp) {
        const now = new Date(timestamp);
        let hour = now.getHours();
        let minute = now.getMinutes();
        let second = now.getSeconds();

        if (hour.toString().length === 1) {
            hour = `0${hour}`;
        }

        if (minute.toString().length === 1) {
            minute = `0${minute}`;
        }

        if (second.toString().length === 1) {
            second = `0${second}`;
        }

        return `${hour}:${minute}:${second}`;
    }
}

export default translate(ChatMessage, { wait: false });
