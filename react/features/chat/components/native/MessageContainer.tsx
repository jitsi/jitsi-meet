import React, { Component } from 'react';
import { FlatList, Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { openSheet } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions.native';
import { groupMessagesBySender } from '../../../base/util/messageGrouping';
import { MESSAGE_TYPE_LOCAL, MESSAGE_TYPE_REMOTE } from '../../constants';
import { getActiveChatSearchMatch } from '../../functions';
import { IMessage, IMessageAnchor, IMessageMenuProps } from '../../types';

import ChatMessage from './ChatMessage';
import MessageMenu from './MessageMenu';
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
    _menuMessageId?: string;
    dispatch: IStore['dispatch'];
    messages: IMessage[];
    onEditMessage?: (messageId: string) => void;
    onMessageCopied?: () => void;
    t: Function;
}

/**
 * Implements a container to render all the chat messages in a conference.
 */
interface IState {

    /**
     * Height of the spacer at the visual bottom of the list. Lifts the rows while the message menu is open,
     * so the sheet does not cover the long-pressed message.
     */
    lift: number;
}

class MessageContainer extends Component<IProps, IState> {

    static defaultProps = {
        messages: [] as IMessage[]
    };

    _flatListRef: React.RefObject<FlatList<any>>;

    /**
     * The props of the open message menu, to send it a new row frame.
     */
    _menuProps?: IMessageMenuProps;

    /**
     * Instantiates a new instance of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = { lift: 0 };

        this._flatListRef = React.createRef();
        this._keyExtractor = this._keyExtractor.bind(this);
        this._renderListEmptyComponent = this._renderListEmptyComponent.bind(this);
        this._renderMessage = this._renderMessage.bind(this);
        this._getMessageRows = this._getMessageRows.bind(this);
        this._onLift = this._onLift.bind(this);
        this._onRemeasure = this._onRemeasure.bind(this);
        this._onMessageLongPress = this._onMessageLongPress.bind(this);
        this._onScrollToIndexFailed = this._onScrollToIndexFailed.bind(this);
    }

    /**
     * Opens the message menu. Opened here, not in ChatMessage, as the menu renders a ChatMessage copy.
     *
     * @param {IMessageMenuProps} menuProps - The menu props.
     * @returns {void}
     */
    _onMessageLongPress(menuProps: IMessageMenuProps) {
        this._menuProps = {
            ...menuProps,
            onCopy: this.props.onMessageCopied,
            onEdit: this.props.onEditMessage,
            onLift: this._onLift
        };
        this.props.dispatch(openSheet(MessageMenu, this._menuProps));
    }

    /**
     * Gives the open menu the new place of the row, after the list changed. The same sheet re-renders, with no
     * new slide. The row is lifted, so the lift is added back: the copy computes the lift again.
     *
     * @param {IMessageAnchor} anchor - The new window frame of the row.
     * @returns {void}
     */
    _onRemeasure(anchor: IMessageAnchor) {
        if (!this._menuProps || !this.props._menuMessageId) {
            return;
        }

        this._menuProps = { ...this._menuProps, anchor: { ...anchor, y: anchor.y + this.state.lift } };
        this.props.dispatch(openSheet(MessageMenu, this._menuProps));
    }

    /**
     * Lifts the rows by the given height, from the message menu.
     *
     * @param {number} lift - The height.
     * @returns {void}
     */
    _onLift(lift: number) {
        this.setState({ lift });
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    override componentDidUpdate(prevProps: IProps) {
        const { _activeMatch, _menuMessageId } = this.props;

        if (_activeMatch && _activeMatch.messageId !== prevProps._activeMatch?.messageId) {
            this._scrollToActiveMatch();
        }

        // The menu closed: drop its props and the lift.
        if (!_menuMessageId) {
            this._menuProps = undefined;
            this.state.lift && this.setState({ lift: 0 });
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
        const { lift } = this.state;

        return (
            <FlatList
                ListEmptyComponent = { this._renderListEmptyComponent }

                // The list is inverted, so the header is the visual bottom.
                ListHeaderComponent = { lift ? <View style = {{ height: lift }} /> : null }
                bounces = { false }

                // @ts-ignore
                contentContainerStyle = { noMessages && styles.emptyListContentContainer }
                data = { data }
                extraData = { this.props._menuMessageId }
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
        const isHidden = item.message.messageId === this.props._menuMessageId;

        return (
            <ChatMessage
                isHidden = { isHidden }
                measureKey = { isHidden ? this.props.messages.length : undefined }
                message = { item.message }
                onLongPress = { this._onMessageLongPress }
                onRemeasure = { isHidden ? this._onRemeasure : undefined }
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
    const { sheet, sheetProps } = state['features/base/dialog'];
    const menuProps = sheet === MessageMenu ? sheetProps as IMessageMenuProps | undefined : undefined;

    return {
        _activeMatch: getActiveChatSearchMatch(state),

        // Only a menu that draws the copy, which needs the row's frame, hides the row.
        _menuMessageId: menuProps?.anchor ? menuProps.messageId : undefined
    };
}

export default translate(connect(_mapStateToProps)(MessageContainer));
