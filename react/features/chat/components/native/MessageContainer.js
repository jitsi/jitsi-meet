// @flow

import React from 'react';
import { FlatList, Text, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import AbstractMessageContainer, { type Props as AbstractProps }
    from '../AbstractMessageContainer';

import ChatMessageGroup from './ChatMessageGroup';
import styles from './styles';

type Props = AbstractProps & {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

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
                data = { data }

                // Workaround for RN bug:
                // https://github.com/facebook/react-native/issues/21196
                inverted = { Boolean(data.length) }
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

    _renderListEmptyComponent: () => React$Element<any>;

    /**
     * Renders a message when there are no messages in the chat yet.
     *
     * @returns {React$Element<any>}
     */
    _renderListEmptyComponent() {
        const { _styles, t } = this.props;

        return (
            <View style = { styles.emptyComponentWrapper }>
                <Text style = { _styles.emptyComponentText }>
                    { t('chat.noMessagesMessage') }
                </Text>
            </View>
        );
    }

    _renderMessageGroup: Object => React$Element<any>;

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

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _styles: ColorSchemeRegistry.get(state, 'Chat')
    };
}

export default translate(connect(_mapStateToProps)(MessageContainer));
