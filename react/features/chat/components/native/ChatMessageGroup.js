// @flow

import React, { Component } from 'react';
import { FlatList } from 'react-native';

import { MESSAGE_TYPE_LOCAL, MESSAGE_TYPE_REMOTE } from '../../constants';

import ChatMessage from './ChatMessage';

type Props = {

  /**
   * The messages array to render.
   */
  messages: Array<Object>
}

/**
 * Implements a container to render all the chat messages in a conference.
 */
export default class ChatMessageGroup extends Component<Props> {
    /**
     * Instantiates a new instance of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._keyExtractor = this._keyExtractor.bind(this);
        this._renderMessage = this._renderMessage.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <FlatList
                data = { this.props.messages }
                inverted = { true }
                keyExtractor = { this._keyExtractor }
                renderItem = { this._renderMessage } />
        );
    }

    _keyExtractor: Object => string;

    /**
     * Key extractor for the flatlist.
     *
     * @param {Object} item - The flatlist item that we need the key to be
     * generated for.
     * @param {number} index - The index of the element.
     * @returns {string}
     */
    _keyExtractor(item, index) {
        return `key_${index}`;
    }

    _renderMessage: Object => React$Element<*>;

    /**
     * Renders a single chat message.
     *
     * @param {Object} message - The chat message to render.
     * @returns {React$Element<*>}
     */
    _renderMessage({ index, item: message }) {
        return (
            <ChatMessage
                message = { message }
                showAvatar = {
                    this.props.messages[0].messageType !== MESSAGE_TYPE_LOCAL
                        && index === this.props.messages.length - 1
                }
                showDisplayName = {
                    this.props.messages[0].messageType === MESSAGE_TYPE_REMOTE
                        && index === this.props.messages.length - 1
                }
                showTimestamp = { index === 0 } />
        );
    }
}
