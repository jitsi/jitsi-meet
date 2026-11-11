import React, { Component, createRef } from 'react';
import { EmitterSubscription, Keyboard, Pressable, Text, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { translate } from '../../../base/i18n/functions';
import Linkify from '../../../base/react/components/native/Linkify';
import { isGifEnabled, isGifMessage } from '../../../gifs/functions.native';
import { CHAR_LIMIT, MESSAGE_TYPE_ERROR, MESSAGE_TYPE_LOCAL } from '../../constants';
import {
    canEditMessage,
    canModerateMessage,
    canReactToMessage,
    canRetractMessage,
    getActiveChatSearchMatch,
    getCanReplyToMessage,
    getChatSearchQuery,
    getDisplayNameSuffix,
    getFormattedTimestamp,
    getHighlightSegments,
    getMessageText,
    getPrivateNoticeMessage,
    replaceNonUnicodeEmojis
} from '../../functions';
import { IChatMessageProps } from '../../types';

import GifMessage from './GifMessage';
import PrivateMessageButton from './PrivateMessageButton';
import styles from './styles';

/**
 * Opens the menu anyway if no keyboardDidHide event comes, for example with a hardware keyboard.
 */
const KEYBOARD_HIDE_TIMEOUT = 500;

/**
 * Renders a single chat message.
 */
class ChatMessage extends Component<IChatMessageProps> {
    _keyboardSubscription?: EmitterSubscription;
    _keyboardTimeout?: ReturnType<typeof setTimeout>;
    _rowRef = createRef<View>();

    /**
     * Measures the hidden row again when the list changes, so the menu copy follows the row.
     *
     * @inheritdoc
     */
    override componentDidUpdate(prevProps: IChatMessageProps) {
        const { isHidden, measureKey, onRemeasure } = this.props;

        if (!isHidden || !onRemeasure || measureKey === prevProps.measureKey) {
            return;
        }

        // The new rows are laid out after this update.
        requestAnimationFrame(() => {
            this._rowRef.current?.measureInWindow((x, y, width, height) => onRemeasure({ height, width, x, y }));
        });
    }

    /**
     * Opens the message menu with the row's window frame, so the menu can redraw the row above its backdrop.
     *
     * @returns {void}
     */
    _onLongPress = () => {
        if (!Keyboard.isVisible()) {
            this._openMenu();

            return;
        }

        // The chat area grows when the keyboard closes, so measure the row after that.
        this._keyboardSubscription?.remove();
        this._keyboardSubscription = Keyboard.addListener('keyboardDidHide', this._onKeyboardHidden);
        this._keyboardTimeout = setTimeout(this._onKeyboardHidden, KEYBOARD_HIDE_TIMEOUT);
        Keyboard.dismiss();
    };

    /**
     * Opens the menu once the keyboard closed, or after the timeout.
     *
     * @returns {void}
     */
    _onKeyboardHidden = () => {
        if (!this._keyboardSubscription) {
            return;
        }

        this._stopWaitingForKeyboard();
        requestAnimationFrame(this._openMenu);
    };

    /**
     * Removes the keyboard listener and the timeout.
     *
     * @returns {void}
     */
    _stopWaitingForKeyboard() {
        this._keyboardSubscription?.remove();
        this._keyboardSubscription = undefined;
        clearTimeout(this._keyboardTimeout);
    }

    /**
     * Implements {@code Component#componentWillUnmount}.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        this._stopWaitingForKeyboard();
    }

    /**
     * Measures the row and opens the message menu.
     *
     * @returns {void}
     */
    _openMenu = () => {
        const { message, onLongPress, showAvatar, showDisplayName, showTimestamp } = this.props;
        const menuProps = { messageId: message.messageId, showAvatar, showDisplayName, showTimestamp };
        const row = this._rowRef.current;

        if (!row) {
            onLongPress?.(menuProps);

            return;
        }

        row.measureInWindow((x, y, width, height) => onLongPress?.({ ...menuProps, anchor: { height, width, x, y } }));
    };

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const { gifEnabled, hasMenu, message, knocking, isActiveMatch, isHidden, isPreview } = this.props;
        const localMessage = message.messageType === MESSAGE_TYPE_LOCAL;
        const { privateMessage, lobbyChat } = message;

        // Style arrays that need to be updated in various scenarios, such as
        // error messages or others.
        const detailsWrapperStyle: ViewStyle[] = [
            styles.detailsWrapper as ViewStyle
        ];
        const messageBubbleStyle: ViewStyle[] = [
            styles.messageBubble as ViewStyle
        ];

        if (localMessage) {
            // This is a message sent by the local participant.

            // The wrapper needs to be aligned to the right.
            detailsWrapperStyle.push(styles.ownMessageDetailsWrapper as ViewStyle);

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.localMessageBubble);
        } else if (message.messageType === MESSAGE_TYPE_ERROR) {
            // This is a system message.

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.systemMessageBubble);
        } else {
            // This is a remote message sent by a remote participant.

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.remoteMessageBubble);
        }

        if (privateMessage) {
            messageBubbleStyle.push(styles.privateMessageBubble);
        }

        if (lobbyChat && !knocking) {
            messageBubbleStyle.push(styles.lobbyMessageBubble);
        }

        if (isActiveMatch) {
            messageBubbleStyle.push(styles.activeMatchMessageBubble);
        }

        if (isPreview) {
            messageBubbleStyle.push(styles.previewMessageBubble as ViewStyle);
        }

        // A moderation is shown over a retraction, as its reason is shown as well.
        const messageText = message.isModerated
            ? this.props.t('chat.moderatedMessage')
            : message.isDeleted
                ? this.props.t(localMessage ? 'chat.deletedMessageByMe' : 'chat.deletedMessage')
                : getMessageText(this.props.message);

        return (
            <View
                id = { isPreview ? undefined : message.messageId }
                pointerEvents = { isPreview ? 'none' : 'auto' }
                ref = { this._rowRef }
                style = { [ styles.messageWrapper as ViewStyle, isHidden && styles.hiddenMessageWrapper ] } >
                { this._renderAvatar() }
                <View style = { detailsWrapperStyle }>
                    <Pressable
                        disabled = { !hasMenu || isPreview }
                        onLongPress = { this._onLongPress }
                        style = { messageBubbleStyle }>
                        <View style = { styles.textWrapper as ViewStyle } >
                            { this._renderDisplayName() }
                            { gifEnabled && isGifMessage(messageText)
                                ? <GifMessage message = { messageText } />
                                : this._renderMessageTextComponent(messageText) }
                            { this._renderModerationReason() }
                            { this._renderPrivateNotice() }
                            { this._renderEditedLabel() }
                        </View>
                        { !message.isDeleted && !message.isModerated && this._renderPrivateReplyButton() }
                    </Pressable>
                    { this._renderReactions() }
                    { this._renderTimestamp() }
                </View>
            </View>
        );
    }

    /**
     * Renders the avatar of the sender.
     *
     * @returns {React.ReactElement<*>}
     */
    _renderAvatar() {
        const { message } = this.props;

        return (
            <View style = { styles.avatarWrapper }>
                { this.props.showAvatar && <Avatar
                    displayName = { message.displayName }
                    participantId = { message.participantId }
                    size = { styles.avatarWrapper.width } />
                }
            </View>
        );
    }

    /**
     * Renders the display name of the sender if necessary.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderDisplayName() {
        const { message, showDisplayName } = this.props;

        if (!showDisplayName) {
            return null;
        }

        const { displayName } = message;

        return (
            <Text style = { styles.senderDisplayName }>
                { `${displayName}${getDisplayNameSuffix(message)}` }
            </Text>
        );
    }

    /**
     * Renders the message text based on number of characters.
     *
     * @param {string} messageText - The message text.
     * @returns {React.ReactElement<*>}
     */
    _renderMessageTextComponent(messageText: string) {
        const { hasMenu, highlightQuery, isActiveMatch } = this.props;

        // Selectable text takes the long press on iOS, so it is off when the long press opens the menu (it has Copy).
        const selectable = !hasMenu;

        if (messageText.length >= CHAR_LIMIT) {
            if (highlightQuery && !isActiveMatch) {
                return (
                    <Text
                        selectable = { selectable }
                        style = { styles.chatMessage }>
                        { this._renderHighlightedSegments(messageText, highlightQuery, isActiveMatch) }
                    </Text>
                );
            }

            return (
                <Text
                    selectable = { selectable }
                    style = { styles.chatMessage }>
                    { messageText }
                </Text>
            );
        }

        const processedText = replaceNonUnicodeEmojis(messageText);

        return (
            <Linkify
                linkStyle = { styles.chatLink }
                selectable = { selectable }
                style = { styles.chatMessage }>
                { highlightQuery && !isActiveMatch
                    ? this._renderHighlightedSegments(processedText, highlightQuery, isActiveMatch)
                    : processedText }
            </Linkify>
        );
    }

    /**
     * Splits text into highlight/non-highlight segments and renders them.
     *
     * @param {string} text - The text to split.
     * @param {string} query - The active search query.
     * @param {boolean} [isActiveMatch] - Whether this message is the focused match.
     * @returns {Array<React.ReactNode>}
     */
    _renderHighlightedSegments(text: string, query: string, isActiveMatch?: boolean) {
        return getHighlightSegments(text, query).map((segment, index) => segment.match
            ? (
                <Text
                    key = { index }
                    style = { isActiveMatch ? styles.chatMessageHighlightActive : styles.chatMessageHighlight }>
                    { segment.text }
                </Text>
            )
            : segment.text);
    }

    /**
     * Renders the message privacy notice, if necessary.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderPrivateNotice() {
        const { message, knocking } = this.props;

        if (!(message.privateMessage || (message.lobbyChat && !knocking))) {
            return null;
        }

        return (
            <Text style = { message.lobbyChat ? styles.lobbyMsgNotice : styles.privateNotice }>
                { getPrivateNoticeMessage(this.props.message) }
            </Text>
        );
    }

    /**
     * Renders the reason a moderator gave for removing the message, if any.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderModerationReason() {
        const { message, t } = this.props;

        if (!message.isModerated || !message.moderationReason) {
            return null;
        }

        return (
            <Text style = { styles.privateNotice }>
                { t('chat.moderationReason', { reason: message.moderationReason }) }
            </Text>
        );
    }

    /**
     * Renders "(edited)" under the text of an edited message. In the bubble, so it shows without a timestamp too.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderEditedLabel() {
        const { message, t } = this.props;

        if (!message.isEdited || message.isDeleted || message.isModerated) {
            return null;
        }

        return <Text style = { styles.editedLabel }>{ t('chat.edited') }</Text>;
    }

    /**
     * Renders the reactions chip: the 3 most used reactions and the total count, as on web.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderReactions() {
        const { message } = this.props;

        if (!message.reactions?.size || message.isDeleted || message.isModerated) {
            return null;
        }

        const reactions = Array.from(message.reactions.entries())
            .sort(([ , a ], [ , b ]) => b.size - a.size);
        const total = reactions.reduce((sum, [ , participants ]) => sum + participants.size, 0);

        return (
            <View style = { styles.reactionsChip as ViewStyle }>
                { reactions.slice(0, 3).map(([ reaction ]) => (
                    <Text
                        key = { reaction }
                        style = { styles.reactionsChipEmoji }>
                        { reaction }
                    </Text>
                )) }
                <Text style = { styles.reactionsChipCount }>{ total }</Text>
            </View>
        );
    }

    /**
     * Renders the private reply button, if necessary.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderPrivateReplyButton() {
        const { message, canReply } = this.props;
        const { lobbyChat } = message;

        if (!canReply) {
            return null;
        }

        return (
            <View style = { styles.replyContainer as ViewStyle }>
                <PrivateMessageButton
                    isLobbyMessage = { lobbyChat }
                    participantID = { message.participantId }
                    reply = { true }
                    showLabel = { false }
                    toggledStyles = { styles.replyStyles } />
            </View>
        );
    }

    /**
     * Renders the time at which the message was sent, if necessary.
     *
     * @returns {React.ReactElement<*> | null}
     */
    _renderTimestamp() {
        if (!this.props.showTimestamp) {
            return null;
        }

        return (
            <Text style = { styles.timeText }>
                { getFormattedTimestamp(this.props.message) }
            </Text>
        );
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IChatMessageProps} message - Message object.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, { message }: IChatMessageProps) {
    const activeMatch = getActiveChatSearchMatch(state);

    return {
        canReply: getCanReplyToMessage(state, message),
        gifEnabled: isGifEnabled(state),
        hasMenu: canReactToMessage(state, message) || canEditMessage(state, message)
            || canRetractMessage(state, message) || canModerateMessage(state, message),
        // A deleted or moderated message shows a placeholder, which is not searched, so do not highlight it.
        highlightQuery: message.isDeleted || message.isModerated ? '' : getChatSearchQuery(state),
        isActiveMatch: Boolean(activeMatch && activeMatch.messageId === message.messageId),
        knocking: state['features/lobby'].knocking
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));
