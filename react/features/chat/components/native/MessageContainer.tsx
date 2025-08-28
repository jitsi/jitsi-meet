import React, { Component } from 'react';
import { FlatList, Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IMessageGroup, groupMessagesBySender } from '../../../base/util/messageGrouping';
import { IMessage } from '../../types';

import ChatMessageGroup from './ChatMessageGroup';
import styles from './styles';

interface IProps {
    messages: IMessage[];
    t: Function;
}

/**
 * Implements a container to render all the chat messages in a conference.
 */
class MessageContainer extends Component<IProps, any> {

    static defaultProps = {
        messages: [] as IMessage[]
    };

    /**
     * Instantiates a new instance of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._keyExtractor = this._keyExtractor.bind(this);
        this._renderListEmptyComponent = this._renderListEmptyComponent.bind(this);
        this._renderMessageGroup = this._renderMessageGroup.bind(this);
        this._getMessagesGroupedBySender = this._getMessagesGroupedBySender.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const data = this._getMessagesGroupedBySender();

        return (
            <FlatList
                ListEmptyComponent = { this._renderListEmptyComponent }
                bounces = { false }
                data = { data }

                // Workaround for RN bug:
                // https://github.com/facebook/react-native/issues/21196
                inverted = { Boolean(data.length) }
                keyExtractor = { this._keyExtractor }
                keyboardShouldPersistTaps = 'handled'
                renderItem = { this._renderMessageGroup } />
        );
    }

    /**
     * Key extractor for the flatlist.
     *
     * @param {Object} _item - The flatlist item that we need the key to be
     * generated for.
     * @param {number} index - The index of the element.
     * @returns {string}
     */
    _keyExtractor(_item: Object, index: number) {
        return `key_${index}`;
    }

    /**
     * Renders a message when there are no messages in the chat yet.
     *
     * @returns {React$Element<any>}
     */
    _renderListEmptyComponent() {
        const { t } = this.props;

        return (
            <View
                id = 'no-messages-message'
                style = { styles.emptyComponentWrapper as ViewStyle }>
                <Text style = { styles.emptyComponentText as TextStyle }>
                    { t('chat.noMessagesMessage') }
                </Text>
            </View>
        );
    }

    /**
     * Renders a single chat message.
     *
     * @param {Array<Object>} messages - The chat message to render.
     * @returns {React$Element<*>}
     */
    _renderMessageGroup({ item: group }: { item: IMessageGroup<IMessage>; }) {
        const { messages } = group;

        return <ChatMessageGroup messages = { messages } />;
    }

    /**
     * Returns an array of message groups, where each group is an array of messages
     * grouped by the sender.
     *
     * @returns {Array<Array<Object>>}
     */
    _getMessagesGroupedBySender() {
        return groupMessagesBySender(this.props.messages);
    }
}

export default translate(connect()(MessageContainer));
