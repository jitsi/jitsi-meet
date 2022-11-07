import React, { ReactElement } from 'react';
import { FlatList, Text, View } from 'react-native';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractMessageContainer, { type Props as AbstractProps }
    from '../AbstractMessageContainer';

import ChatMessageGroup from './ChatMessageGroup';
import styles from './styles';

type Props = AbstractProps & {

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Implements a container to render all the chat messages in a conference.
 */
class MessageContainer extends AbstractMessageContainer<Props> {
    /**
     * Instantiates a new instance of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
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

    _getMessagesGroupedBySender: () => Array<Array<Object>>;

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

    _renderListEmptyComponent: () => ReactElement;

    /**
     * Renders a message when there are no messages in the chat yet.
     *
     * @returns {React$Element<any>}
     */
    _renderListEmptyComponent() {
        const { t } = this.props;

        return (
            <View style = { styles.emptyComponentWrapper }>
                <Text style = { styles.emptyComponentText }>
                    { t('chat.noMessagesMessage') }
                </Text>
            </View>
        );
    }

    _renderMessageGroup: Object => ReactElement;

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

export default translate(connect()(MessageContainer));
