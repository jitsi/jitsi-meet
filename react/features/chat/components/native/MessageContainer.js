// @flow

import React from 'react';
import { FlatList } from 'react-native';

import AbstractMessageContainer, { type Props }
    from '../AbstractMessageContainer';

import ChatMessageGroup from './ChatMessageGroup';
import styles from './styles';

/**
 * Implements a container to render all the chat messages in a conference.
 */
export default class MessageContainer extends AbstractMessageContainer {
    /**
     * Instantiates a new instance of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._keyExtractor = this._keyExtractor.bind(this);
        this._renderMessageGroup = this._renderMessageGroup.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <FlatList
                data = { this._getMessagesGroupedBySender() }
                inverted = { true }
                keyExtractor = { this._keyExtractor }
                keyboardShouldPersistTaps = 'always'
                renderItem = { this._renderMessageGroup }
                style = { styles.messageContainer } />
        );
    }

    _getMessagesGroupedBySender: () => Array<Array<Object>>;

    _keyExtractor: Object => string

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

    _renderMessageGroup: Object => React$Element<*>;

    /**
     * Renders a single chat message.
     *
     * @param {Array<Object>} messages - The chat message to render.
     * @returns {React$Element<*>}
     */
    _renderMessageGroup({ item: messages }) {
        return <ChatMessageGroup messages = { messages } />;
    }
}
