// @flow

import React, { Component } from 'react';

import ChatMessage from './ChatMessage';

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
 * @augments React.Component
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

        return (
            <div className = { `chat-message-group ${className}` }>
                {
                    messages.map((message, i) => (
                        <ChatMessage
                            key = { i }
                            message = { message }
                            showDisplayName = { i === 0 }
                            showTimestamp = { i === messages.length - 1 } />
                    ))
                }
            </div>
        );
    }
}

export default ChatMessageGroup;
