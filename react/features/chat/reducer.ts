import { v4 as uuidv4 } from 'uuid';

import { UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { ILocalParticipant, IParticipant } from '../base/participants/types';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import { ADD_FILE, _FILE_LIST_RECEIVED } from '../file-sharing/actionTypes';
import { IVisitorChatParticipant } from '../visitors/types';

import {
    ADD_MESSAGE,
    ADD_MESSAGE_REACTION,
    CLEAR_CHAT_SEARCH,
    CLEAR_CHAT_STATE,
    CLOSE_CHAT,
    EDIT_MESSAGE,
    MODERATE_MESSAGE,
    NOTIFY_PRIVATE_RECIPIENTS_CHANGED,
    OPEN_CHAT,
    REMOVE_LOBBY_CHAT_PARTICIPANT,
    RETRACT_MESSAGE,
    SET_CHAT_IS_RESIZING,
    SET_CHAT_SEARCH_MATCH_INDEX,
    SET_CHAT_SEARCH_QUERY,
    SET_CHAT_WIDTH,
    SET_FOCUSED_TAB,
    SET_LOBBY_CHAT_ACTIVE_STATE,
    SET_LOBBY_CHAT_RECIPIENT,
    SET_MESSAGE_MODERATION_SUPPORTED,
    SET_PRIVATE_MESSAGE_RECIPIENT,
    SET_USER_CHAT_WIDTH
} from './actionTypes';
import { CHAT_SIZE, ChatTabs } from './constants';
import { addPendingEntry } from './functions';
import { IMessage, IPendingEditsMap, IPendingModerationsMap } from './types';

const DEFAULT_STATE = {
    groupChatWithPermissions: false,
    privateChatWithPermissions: false,
    isOpen: false,
    messageModerationSupported: false,
    messages: [],
    notifyPrivateRecipientsChangedTimestamp: undefined,
    pendingEdits: {},
    pendingModerations: {},
    reactions: {},
    unreadMessagesCount: 0,
    unreadFilesCount: 0,
    privateMessageRecipient: undefined,
    searchQuery: '',
    searchMatchIndex: 0,
    lobbyMessageRecipient: undefined,
    isLobbyChatActive: false,
    focusedTab: undefined,
    isResizing: false,
    width: {
        current: CHAT_SIZE,
        userSet: null
    }
};

export interface IChatState {
    focusedTab?: ChatTabs;
    groupChatWithPermissions: boolean;
    isLobbyChatActive: boolean;
    isOpen: boolean;
    isResizing: boolean;
    lastReadMessage?: IMessage;
    lobbyMessageRecipient?: {
        id: string;
        name: string;
    } | ILocalParticipant;
    messageModerationSupported: boolean;
    messages: IMessage[];
    notifyPrivateRecipientsChangedTimestamp?: number;
    pendingEdits: IPendingEditsMap;
    pendingModerations: IPendingModerationsMap;
    privateChatWithPermissions: boolean;
    privateMessageRecipient?: IParticipant | IVisitorChatParticipant;
    searchMatchIndex: number;
    searchQuery: string;
    unreadFilesCount: number;
    unreadMessagesCount: number;
    width: {
        current: number;
        userSet: number | null;
    };
}

ReducerRegistry.register<IChatState>('features/chat', (state = DEFAULT_STATE, action): IChatState => {
    switch (action.type) {
    case ADD_MESSAGE: {
        const newMessage: IMessage = {
            displayName: action.displayName,
            editedAt: action.editedAt,
            error: action.error,
            fileMetadata: action.fileMetadata,
            isFromGuest: Boolean(action.isFromGuest),
            isFromVisitor: Boolean(action.isFromVisitor),
            participantId: action.participantId,
            isEdited: Boolean(action.isEdited),
            isReaction: action.isReaction,
            // Reaction, system and error messages carry no id; give them one so every message is addressable.
            messageId: action.messageId ?? uuidv4(),
            messageType: action.messageType,
            message: action.message,
            reactions: action.reactions,
            privateMessage: action.privateMessage,
            lobbyChat: action.lobbyChat,
            recipient: action.recipient,
            recipientId: action.recipientId,
            replyToMessageId: action.replyToMessageId,
            sentToVisitor: Boolean(action.sentToVisitor),
            timestamp: action.timestamp
        };

        // The message id is chosen by the sender, so only look up entries the maps hold themselves:
        // an id such as '__proto__' must not resolve to an inherited value.
        const pendingEdit = action.messageId
            && Object.prototype.hasOwnProperty.call(state.pendingEdits, action.messageId)
            ? state.pendingEdits[action.messageId] : undefined;
        const pendingModeration = action.messageId
            && Object.prototype.hasOwnProperty.call(state.pendingModerations, action.messageId)
            ? state.pendingModerations[action.messageId] : undefined;

        // only apply a cached pending edit if its claimed author matches
        // the author of the message that actually arrived. Prevents a forged/mismatched
        // edit that was queued for a not-yet-seen messageId from silently overwriting
        // someone else's message once it shows up.
        const pendingEditValid = pendingEdit?.participantId === action.participantId;

        let finalMessage = pendingEdit && pendingEditValid
            ? {
                ...newMessage,
                message: pendingEdit.message,
                isEdited: true,
                editedAt: pendingEdit.editedAt
            }
            : newMessage;

        // The message was moderated before it arrived (e.g. a moderator brought a late joiner up to
        // date before the room history was received), so it arrives already removed. The pending
        // moderation is kept rather than consumed, like in MODERATE_MESSAGE: message ids are chosen
        // by the sender, so several messages may arrive with the same id, and moderating twice is harmless.
        if (pendingModeration) {
            finalMessage = {
                ...finalMessage,
                message: '',
                isModerated: true,
                moderationReason: pendingModeration.reason
            };
        }

        // React native, unlike web, needs a reverse sorted message list.
        const messages = navigator.product === 'ReactNative'
            ? [
                finalMessage,
                ...state.messages
            ]
            : [
                ...state.messages,
                finalMessage
            ];

        const pendingEdits = { ...state.pendingEdits };

        if (pendingEdit && pendingEditValid && action.messageId) {
            delete pendingEdits[action.messageId];
        }

        return {
            ...state,
            lastReadMessage:
                action.hasRead ? finalMessage : state.lastReadMessage,
            unreadMessagesCount: state.focusedTab !== ChatTabs.CHAT ? state.unreadMessagesCount + 1 : state.unreadMessagesCount,
            messages,
            pendingEdits
        };
    }

    case ADD_MESSAGE_REACTION: {
        const { participantId, reactionList, messageId } = action;

        const messages = state.messages.map(message => {
            // A deleted or moderated message is shown as a placeholder, so it does not take reactions.
            if (messageId === message.messageId && !message.isDeleted && !message.isModerated) {
                const newReactions = new Map(message.reactions);

                reactionList.forEach((reaction: string) => {
                    let participants = newReactions.get(reaction);

                    if (!participants) {
                        participants = new Set();
                        newReactions.set(reaction, participants);
                    }

                    participants.add(participantId);
                });

                return {
                    ...message,
                    reactions: newReactions
                };
            }

            return message;
        });

        return {
            ...state,
            lastReadMessage: _getLastReadMessage(state, messages),
            messages
        };
    }

    case CLEAR_CHAT_SEARCH:
        return {
            ...state,
            searchQuery: '',
            searchMatchIndex: 0
        };

    case CLEAR_CHAT_STATE:
        return {
            ...DEFAULT_STATE,
            width: state.width
        };

    case EDIT_MESSAGE: {
        const newMessage = action.message;
        let messageExists = false;
        let applied = false;

        const messages = state.messages.map(m => {
            if (m.messageId === newMessage.messageId) {
                messageExists = true;

                if (!newMessage.participantId || newMessage.participantId !== m.participantId) {
                    return m;
                }

                // A deleted or moderated message has had its text cleared, so an edit
                // arriving afterwards must not bring the text back.
                if (m.isDeleted || m.isModerated) {
                    return m;
                }

                applied = true;

                return {
                    ...m,
                    message: newMessage.message,
                    isEdited: true,
                    editedAt: newMessage.editedAt
                };
            }

            return m;
        });

        // Message hasn't arrived yet — cache it as a pending edit so it can be
        // applied later, once ADD_MESSAGE validates authorship.
        if (!messageExists) {
            return {
                ...state,
                pendingEdits: addPendingEntry(state.pendingEdits, newMessage.messageId, {
                    message: newMessage.message,
                    editedAt: newMessage.editedAt,
                    participantId: newMessage.participantId
                })
            };
        }

        if (!applied) {
            return state;
        }

        return {
            ...state,
            lastReadMessage: _getLastReadMessage(state, messages),
            messages
        };
    }

    case MODERATE_MESSAGE: {
        let messageExists = false;

        const messages = state.messages.map(message => {
            if (message.messageId === action.messageId) {
                messageExists = true;

                // Clear the text, like RETRACT_MESSAGE does, so the removed content
                // does not stay in the state while the UI shows a placeholder.
                return {
                    ...message,
                    message: '',
                    isModerated: true,
                    moderationReason: action.reason
                };
            }

            return message;
        });

        // Cache the moderation whether or not the message has arrived yet: it is applied to the
        // message once it does, and, as message ids are chosen by the sender, also to any later
        // message that arrives with the same id.
        const pendingModerations = addPendingEntry(state.pendingModerations, action.messageId, {
            reason: action.reason
        });

        if (!messageExists) {
            return {
                ...state,
                pendingModerations
            };
        }

        return {
            ...state,
            lastReadMessage: _getLastReadMessage(state, messages),
            messages,
            pendingModerations
        };
    }

    case RETRACT_MESSAGE: {
        let retracted = false;

        const messages = state.messages.map(message => {
            if (message.messageId === action.messageId && message.participantId === action.retractedBy) {
                retracted = true;

                return {
                    ...message,
                    message: '',
                    isDeleted: true,
                    retractedBy: action.retractedBy
                };
            }

            return message;
        });

        if (!retracted) {
            return state;
        }

        return {
            ...state,
            lastReadMessage: _getLastReadMessage(state, messages),
            messages
        };
    }

    case SET_MESSAGE_MODERATION_SUPPORTED:
        return {
            ...state,
            messageModerationSupported: action.supported
        };

    case SET_CHAT_SEARCH_MATCH_INDEX:
        return {
            ...state,
            searchMatchIndex: action.index
        };

    case SET_CHAT_SEARCH_QUERY:
        return {
            ...state,
            searchQuery: action.query,
            searchMatchIndex: 0
        };

    case SET_PRIVATE_MESSAGE_RECIPIENT:
        return {
            ...state,
            privateMessageRecipient: action.participant
        };

    case OPEN_CHAT:
        return {
            ...state,
            isOpen: true,
            privateMessageRecipient: action.participant
        };

    case CLOSE_CHAT:
        return {
            ...state,
            isOpen: false,
            lastReadMessage: state.messages[
                navigator.product === 'ReactNative' ? 0 : state.messages.length - 1],
            privateMessageRecipient: action.participant,
            isLobbyChatActive: false,
            searchQuery: '',
            searchMatchIndex: 0
        };

    case SET_LOBBY_CHAT_RECIPIENT:
        return {
            ...state,
            isLobbyChatActive: true,
            lobbyMessageRecipient: action.participant,
            privateMessageRecipient: undefined,
            isOpen: action.open
        };
    case SET_LOBBY_CHAT_ACTIVE_STATE:
        return {
            ...state,
            isLobbyChatActive: action.payload,
            isOpen: action.payload || state.isOpen,
            privateMessageRecipient: undefined
        };

    case REMOVE_LOBBY_CHAT_PARTICIPANT: {
        const messages = action.removeLobbyChatMessages
            ? state.messages.filter(m => !m.lobbyChat)
            : state.messages;

        return {
            ...state,
            lastReadMessage: _getLastReadMessageAfterRemoval(state, messages),
            messages,
            isOpen: state.isOpen && state.isLobbyChatActive ? false : state.isOpen,
            isLobbyChatActive: false,
            lobbyMessageRecipient: undefined
        };
    }
    case UPDATE_CONFERENCE_METADATA: {
        const { metadata } = action;

        if (metadata?.permissions) {
            return {
                ...state,
                groupChatWithPermissions: Boolean(metadata.permissions.groupChatRestricted),
                privateChatWithPermissions: Boolean(metadata.permissions.privateChatRestricted)
            };
        }

        break;
    }
    case SET_FOCUSED_TAB:
        return {
            ...state,
            focusedTab: action.tabId,
            unreadMessagesCount: action.tabId === ChatTabs.CHAT ? 0 : state.unreadMessagesCount,
            unreadFilesCount: action.tabId === ChatTabs.FILE_SHARING ? 0 : state.unreadFilesCount
        };

    case SET_CHAT_WIDTH: {
        return {
            ...state,
            width: {
                ...state.width,
                current: action.width
            }
        };
    }

    case SET_USER_CHAT_WIDTH: {
        const { width } = action;

        return {
            ...state,
            width: {
                current: width,
                userSet: width
            }
        };
    }

    case SET_CHAT_IS_RESIZING: {
        return {
            ...state,
            isResizing: action.resizing
        };
    }
    case NOTIFY_PRIVATE_RECIPIENTS_CHANGED:
        return {
            ...state,
            notifyPrivateRecipientsChangedTimestamp: action.payload
        };

    case ADD_FILE:
        return {
            ...state,
            unreadFilesCount: action.shouldIncrementUnread ? state.unreadFilesCount + 1 : state.unreadFilesCount
        };

    case _FILE_LIST_RECEIVED: {
        const remoteFilesCount = Object.values(action.files).filter(
            (file: any) => file.authorParticipantId !== action.localParticipantId
        ).length;

        return {
            ...state,
            unreadFilesCount: remoteFilesCount
        };
    }
    }

    return state;
});

/**
 * Returns the last read message to keep in the state once some of the messages were replaced by
 * updated copies. The last read message is compared by reference, thus it has to point to the
 * updated copy, or it would not be found in the new list anymore and would keep the old content.
 *
 * @param {IChatState} state - The current chat state.
 * @param {IMessage[]} messages - The new list of messages, mapped one to one from the current one.
 * @returns {IMessage|undefined}
 */
function _getLastReadMessage(state: IChatState, messages: IMessage[]): IMessage | undefined {
    const { lastReadMessage } = state;

    if (!lastReadMessage) {
        return lastReadMessage;
    }

    const index = state.messages.indexOf(lastReadMessage);

    return index === -1 ? lastReadMessage : messages[index];
}

/**
 * Returns the last read message to keep in the state once some of the messages were removed.
 * If the last read message itself was removed, the closest older message that is kept becomes the
 * last read one, so the messages that were already read are not counted as unread again.
 *
 * @param {IChatState} state - The current chat state.
 * @param {IMessage[]} messages - The new list of messages, a subset of the current one.
 * @returns {IMessage|undefined}
 */
function _getLastReadMessageAfterRemoval(state: IChatState, messages: IMessage[]): IMessage | undefined {
    const { lastReadMessage } = state;

    if (!lastReadMessage || messages === state.messages) {
        return lastReadMessage;
    }

    const index = state.messages.indexOf(lastReadMessage);

    if (index === -1) {
        return lastReadMessage;
    }

    const kept = new Set(messages);

    // React native stores the messages in a reversed order, so the older ones come after.
    const step = navigator.product === 'ReactNative' ? 1 : -1;

    for (let i = index; i >= 0 && i < state.messages.length; i += step) {
        if (kept.has(state.messages[i])) {
            return state.messages[i];
        }
    }

    return undefined;
}
