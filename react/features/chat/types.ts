import { WithTranslation } from 'react-i18next';

import { IStore } from '../app/types';
import { IFileMetadata } from '../file-sharing/types';

import {
    MESSAGE_TYPE_ERROR,
    MESSAGE_TYPE_LOCAL,
    MESSAGE_TYPE_REMOTE
} from './constants';

export type ChatMessageType =
    | typeof MESSAGE_TYPE_LOCAL
    | typeof MESSAGE_TYPE_ERROR
    | typeof MESSAGE_TYPE_REMOTE;

export interface IMessage {
    displayName: string;
    editedAt?: number;
    error?: unknown;
    fileMetadata?: IFileMetadata;
    isDeleted?: boolean;
    isEdited?: Boolean;
    isFromGuest?: boolean;
    isFromVisitor?: boolean;
    isModerated?: boolean;
    isReaction: boolean;
    lobbyChat: boolean;
    message: string;
    messageId: string;
    messageType: ChatMessageType;
    moderationReason?: string;
    participantId: string;
    privateMessage: boolean;
    reactions: Map<string, Set<string>>;
    recipient: string;
    recipientId?: string;
    /**
     * When set, XMPP message id of the message this one replies to (XEP-0461), from lib-jitsi-meet.
     */
    replyToMessageId?: string;
    retractedBy?: string;
    sentToVisitor?: boolean;
    timestamp: number;
}

/**
 * The type of the React {@code Component} props of {@code AbstractChat}.
 */
export interface IChatProps extends WithTranslation {

    /**
     * All the chat messages in the conference.
     */
    _messages: IMessage[];

    /**
     * Number of unread chat messages.
     */
    _unreadMessagesCount: number;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];
}

export interface IChatMessageProps extends WithTranslation {

    /**
     * Whether the message can be replied to.
     */
    canReply?: boolean;

    /**
     * Whether gifs are enabled or not.
     */
    gifEnabled?: boolean;

    /**
     * Whether a long press opens the message menu (native). False when the menu would be empty.
     */
    hasMenu?: boolean;

    /**
     * Case-insensitive search query whose matches in the message text should be highlighted.
     * Left undefined/empty for no highlighting.
     */
    highlightQuery?: string;

    /**
     * Whether this message is the currently focused search match (for prev/next navigation).
     */
    isActiveMatch?: boolean;

    /**
     * Hides the row while the message menu draws its copy, so the message does not show twice (native).
     */
    isHidden?: boolean;

    /**
     * Renders the copy drawn above the message menu backdrop (native): outlined and not interactive.
     */
    isPreview?: boolean;

    /**
     * Whether current participant is currently knocking in the lobby room.
     */
    knocking?: boolean;

    /**
     * Changes when the message list changes. The hidden row then measures itself again (native).
     */
    measureKey?: number;

    /**
     * The representation of a chat message.
     */
    message: IMessage;

    /**
     * Opens the message menu for this message (native).
     */
    onLongPress?: (props: IMessageMenuProps) => void;

    /**
     * Gets the new window frame of the hidden row, after the list changed (native).
     */
    onRemeasure?: (anchor: IMessageAnchor) => void;

    /**
     * Whether or not the avatar image of the participant which sent the message
     * should be displayed.
     */
    showAvatar?: boolean;

    /**
     * Whether or not the name of the participant which sent the message should
     * be displayed.
     */
    showDisplayName: boolean;

    /**
     * Whether or not the time at which the message was sent should be
     * displayed.
     */
    showTimestamp: boolean;
}

/**
 * Window frame of a long-pressed message row, so the menu can redraw the row above its backdrop.
 */
export interface IMessageAnchor {
    height: number;
    width: number;
    x: number;
    y: number;
}

/**
 * The props of the native message menu.
 */
export interface IMessageMenuProps {
    anchor?: IMessageAnchor;
    messageId: string;
    onCopy?: () => void;
    onEdit?: (messageId: string) => void;
    onLift?: (height: number) => void;
    showAvatar?: boolean;
    showDisplayName: boolean;
    showTimestamp: boolean;
}

/**
 * The shape of a single cached pending edit, keyed by messageId in Redux state.
 */
export interface IPendingEdit {
    editedAt: number;
    message: string;
    participantId?: string;
}

/**
 * The shape of a single cached pending moderation, keyed by messageId in Redux state.
 */
export interface IPendingModeration {
    reason?: string;
}

/**
 * The shape of a map of entries cached for messages that have not arrived yet.
 */
export interface IPendingMap<T> {
    [messageId: string]: T;
}

/**
 * The shape of the pendingEdits map in Redux state.
 */
export type IPendingEditsMap = IPendingMap<IPendingEdit>;

/**
 * The shape of the pendingModerations map in Redux state.
 */
export type IPendingModerationsMap = IPendingMap<IPendingModeration>;
