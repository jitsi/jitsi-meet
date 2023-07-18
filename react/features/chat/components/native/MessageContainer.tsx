import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { FlatList, Text, TextStyle, View, ViewStyle } from 'react-native';

import { translate } from '../../../base/i18n/functions';
import { getMessagesGroupedBySender } from '../../functions';
import { IMessage } from '../../types';

import ChatMessageGroup from './ChatMessageGroup';
import styles from './styles';

interface IProps extends WithTranslation {

    /**
     * The messages array to render.
     */
    messages: IMessage[];
}

/**
 * Implements a container to render all the chat messages in a conference.
 */
class MessageContainer extends Component<IProps> {
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
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const data = getMessagesGroupedBySender(this.props.messages);

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
            <View style = { styles.emptyComponentWrapper as ViewStyle }>
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
    _renderMessageGroup({ item: messages }: { item: IMessage[]; }) {
        return <ChatMessageGroup messages = { messages } />;
    }
}

export default translate(MessageContainer);
