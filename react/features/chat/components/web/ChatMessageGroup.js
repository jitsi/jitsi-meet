// @flow

import React, { Component } from 'react';
import ChatMessage from './ChatMessage';

import { getLocalizedDateFormatter } from '../../../base/i18n';

type Props = {

    /**
     * Additional CSS classes to apply to the root element.
     */
    className: string,

    /**
     * The messages to display as a group.
     */
    messages: Array<Object>,
};

/**
 * Displays a list of chat messages. Will show only the display name for the
 * first chat message and the timestamp for the last chat message.
 *
 * @extends React.Component
 */
class ChatMessageGroup extends Component<Props> {
    static defaultProps = {
        className: ''
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { className, messages } = this.props;

        const messagesLength = messages.length;

        if (!messagesLength) {
            return null;
        }

        const { timestamp } = messages[messagesLength - 1];

        return (
            <div className = { `chat-message-group ${className}` }>
                {
                    messages.map((message, i) => (
                        <ChatMessage
                            key = { i }
                            message = { message }
                            showDisplayName = { i === 0 } />
                    ))
                }
                <div className = 'chat-message-group-footer'>
                    { getLocalizedDateFormatter(
                        new Date(timestamp)).format('H:mm') }
                </div>
            </div>
        );
    }
}

export default ChatMessageGroup;
