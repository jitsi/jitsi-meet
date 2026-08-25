import React, { Component } from 'react';
import { FlatList, Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions.native';
import { groupMessagesBySender } from '../../../base/util/messageGrouping';
import { MESSAGE_TYPE_LOCAL, MESSAGE_TYPE_REMOTE } from '../../constants';
import { getActiveChatSearchMatch } from '../../functions';
import { IMessage } from '../../types';

import ChatMessage from './ChatMessage';
import styles from './styles';

/**
 * A single flat list row: one message plus its grouping flags.
 */
interface IMessageRow {
    message: IMessage;
    showAvatar: boolean;
    showDisplayName: boolean;
    showTimestamp: boolean;
}

interface IProps {
    _activeMatch?: IMessage;
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

    _flatListRef: React.RefObject<FlatList<any>>;

    /**
     * Instantiates a new instance of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._flatListRef = React.createRef();
        this._keyExtractor = this._keyExtractor.bind(this);
        this._renderListEmptyComponent = this._renderListEmptyComponent.bind(this);
        this._renderMessage = this._renderMessage.bind(this);
        this._getMessageRows = this._getMessageRows.bind(this);
        this._onScrollToIndexFailed = this._onScrollToIndexFailed.bind(this);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    override componentDidUpdate(prevProps: IProps) {
        const { _activeMatch } = this.props;

        if (_activeMatch && _activeMatch.messageId !== prevProps._activeMatch?.messageId) {
            this._scrollToActiveMatch();
        }
    }

    /**
     * Scrolls the list so the active search match message is visible.
     *
     * @returns {void}
     */
    _scrollToActiveMatch() {
        const { _activeMatch } = this.props;

        if (!_activeMatch) {
            return;
        }

        const data = this._getMessageRows();
        const index = data.findIndex(row => row.message.messageId === _activeMatch.messageId);

        if (index === -1) {
            return;
        }

        requestAnimationFrame(() => {
            this._flatListRef.current?.scrollToIndex({
                animated: true,
                index,
                viewPosition: 0.5
            });
        });
    }

    /**
     * Fallback for when scrollToIndex fires before the target row is measured.
     *
     * @param {Object} info - Info about the failed scroll attempt.
     * @returns {void}
     */
    _onScrollToIndexFailed(info: { averageItemLength: number; index: number; }) {
        // Jump near the target so it renders, then retry.
        this._flatListRef.current?.scrollToOffset({
            animated: false,
            offset: info.averageItemLength * info.index
        });

        setTimeout(() => {
            this._flatListRef.current?.scrollToIndex({
                animated: true,
                index: info.index,
                viewPosition: 0.5
            });
        }, 100);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const data = this._getMessageRows();
        const noMessages = data.length === 0;

        return (
            <FlatList
                ListEmptyComponent = { this._renderListEmptyComponent }
                bounces = { false }

                // @ts-ignore
                contentContainerStyle = { noMessages && styles.emptyListContentContainer }
                data = { data }
                // Workaround for RN bug:
                // https://github.com/facebook/react-native/issues/21196
                inverted = { Boolean(data.length) }
                keyExtractor = { this._keyExtractor }
                keyboardShouldPersistTaps = 'handled'
                onScrollToIndexFailed = { this._onScrollToIndexFailed }
                ref = { this._flatListRef }
                renderItem = { this._renderMessage }
                style = { noMessages && styles.emptyListStyle } />
        );
    }

    /**
     * Key extractor for the flatlist.
     *
     * @param {IMessageRow} item - The row whose key we need to generate.
     * @returns {string}
     */
    _keyExtractor(item: IMessageRow) {
        return item.message.messageId;
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
     * @param {Object} row - The row containing the message and its grouping flags.
     * @returns {React$Element<*>}
     */
    _renderMessage({ item }: { item: IMessageRow; }) {
        return (
            <ChatMessage
                message = { item.message }
                showAvatar = { item.showAvatar }
                showDisplayName = { item.showDisplayName }
                showTimestamp = { item.showTimestamp } />
        );
    }

    /**
     * Builds one row per message with its grouping flags.
     *
     * @returns {IMessageRow[]}
     */
    _getMessageRows(): IMessageRow[] {
        const rows: IMessageRow[] = [];

        for (const group of groupMessagesBySender(this.props.messages)) {
            const groupType = group.messages[0].messageType;
            const oldestIndex = group.messages.length - 1;

            group.messages.forEach((message, index) => {
                rows.push({
                    message,
                    showAvatar: groupType !== MESSAGE_TYPE_LOCAL && index === oldestIndex,
                    showDisplayName: groupType === MESSAGE_TYPE_REMOTE && index === oldestIndex,
                    showTimestamp: index === 0
                });
            });
        }

        return rows;
    }
}

function _mapStateToProps(state: IReduxState) {
    return {
        _activeMatch: getActiveChatSearchMatch(state)
    };
}

export default translate(connect(_mapStateToProps)(MessageContainer));
