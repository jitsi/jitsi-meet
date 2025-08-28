// @ts-expect-error
import aliases from 'react-emoji-render/data/aliases';
// eslint-disable-next-line lines-around-comment
// @ts-expect-error
import emojiAsciiAliases from 'react-emoji-render/data/asciiAliases';

import { IReduxState } from '../app/types';
import { getLocalizedDateFormatter } from '../base/i18n/dateUtil';
import i18next from '../base/i18n/i18next';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { getParticipantById, isPrivateChatEnabled } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { escapeRegexp } from '../base/util/helpers';
import { getParticipantsPaneWidth } from '../participants-pane/functions';
import { VIDEO_SPACE_MIN_SIZE } from '../video-layout/constants';
import { IVisitorChatParticipant } from '../visitors/types';

import { MESSAGE_TYPE_ERROR, MESSAGE_TYPE_LOCAL, TIMESTAMP_FORMAT } from './constants';
import { IMessage } from './types';

/**
 * An ASCII emoticon regexp array to find and replace old-style ASCII
 * emoticons (such as :O) with the new Unicode representation, so that
 * devices and browsers that support them can render these natively
 * without a 3rd party component.
 *
 * NOTE: this is currently only used on mobile, but it can be used
 * on web too once we drop support for browsers that don't support
 * unicode emoji rendering.
 */
const ASCII_EMOTICON_REGEXP_ARRAY: Array<[RegExp, string]> = [];

/**
 * An emoji regexp array to find and replace alias emoticons
 * (such as :smiley:) with the new Unicode representation, so that
 * devices and browsers that support them can render these natively
 * without a 3rd party component.
 *
 * NOTE: this is currently only used on mobile, but it can be used
 * on web too once we drop support for browsers that don't support
 * unicode emoji rendering.
 */
const SLACK_EMOJI_REGEXP_ARRAY: Array<[RegExp, string]> = [];

(function() {
    for (const [ key, value ] of Object.entries(aliases)) {

        // Add ASCII emoticons
        const asciiEmoticons = emojiAsciiAliases[key];

        if (asciiEmoticons) {
            const asciiEscapedValues = asciiEmoticons.map((v: string) => escapeRegexp(v));

            const asciiRegexp = `(${asciiEscapedValues.join('|')})`;

            // Escape urls
            const formattedAsciiRegexp = key === 'confused'
                ? `(?=(${asciiRegexp}))(:(?!//).)`
                : asciiRegexp;

            ASCII_EMOTICON_REGEXP_ARRAY.push([ new RegExp(formattedAsciiRegexp, 'g'), value as string ]);
        }

        // Add slack-type emojis
        const emojiRegexp = `\\B(${escapeRegexp(`:${key}:`)})\\B`;

        SLACK_EMOJI_REGEXP_ARRAY.push([ new RegExp(emojiRegexp, 'g'), value as string ]);
    }
})();

/**
 * Replaces ASCII and other non-unicode emoticons with unicode emojis to let the emojis be rendered
 * by the platform native renderer.
 *
 * @param {string} message - The message to parse and replace.
 * @returns {string}
 */
export function replaceNonUnicodeEmojis(message: string): string {
    let replacedMessage = message;

    for (const [ regexp, replaceValue ] of SLACK_EMOJI_REGEXP_ARRAY) {
        replacedMessage = replacedMessage.replace(regexp, replaceValue);
    }

    for (const [ regexp, replaceValue ] of ASCII_EMOTICON_REGEXP_ARRAY) {
        replacedMessage = replacedMessage.replace(regexp, replaceValue);
    }

    return replacedMessage;
}

/**
 * Selector for calculating the number of unread chat messages.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {number} The number of unread messages.
 */
export function getUnreadCount(state: IReduxState) {
    const { lastReadMessage, messages } = state['features/chat'];
    const messagesCount = messages.length;

    if (!messagesCount) {
        return 0;
    }

    let reactionMessages = 0;
    let lastReadIndex: number;

    if (navigator.product === 'ReactNative') {
        // React native stores the messages in a reversed order.
        lastReadIndex = messages.indexOf(<IMessage>lastReadMessage);

        for (let i = 0; i < lastReadIndex; i++) {
            if (messages[i].isReaction) {
                reactionMessages++;
            }
        }

        return lastReadIndex - reactionMessages;
    }

    lastReadIndex = messages.lastIndexOf(<IMessage>lastReadMessage);

    for (let i = lastReadIndex + 1; i < messagesCount; i++) {
        if (messages[i].isReaction) {
            reactionMessages++;
        }
    }

    return messagesCount - (lastReadIndex + 1) - reactionMessages;
}

/**
 * Get whether the chat smileys are disabled or not.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} The disabled flag.
 */
export function areSmileysDisabled(state: IReduxState) {
    const disableChatSmileys = state['features/base/config']?.disableChatSmileys === true;

    return disableChatSmileys;
}

/**
 * Returns the timestamp to display for the message.
 *
 * @param {IMessage} message - The message from which to get the timestamp.
 * @returns {string}
 */
export function getFormattedTimestamp(message: IMessage) {
    return getLocalizedDateFormatter(new Date(message.timestamp))
        .format(TIMESTAMP_FORMAT);
}

/**
 * Generates the message text to be rendered in the component.
 *
 * @param {IMessage} message - The message from which to get the text.
 * @returns {string}
 */
export function getMessageText(message: IMessage) {
    return message.messageType === MESSAGE_TYPE_ERROR
        ? i18next.t('chat.error', {
            error: message.message
        })
        : message.message;
}


/**
 * Returns whether a message can be replied to.
 *
 * @param {IReduxState} state - The redux state.
 * @param {IMessage} message - The message to be checked.
 * @returns {boolean}
 */
export function getCanReplyToMessage(state: IReduxState, message: IMessage) {
    const { knocking } = state['features/lobby'];
    const participant = getParticipantById(state, message.participantId);

    // Check if basic reply conditions are met
    const basicCanReply = (Boolean(participant) || message.isFromVisitor)
        && (message.privateMessage || (message.lobbyChat && !knocking))
        && message.messageType !== MESSAGE_TYPE_LOCAL;

    if (!basicCanReply) {
        return false;
    }

    // Check private chat configuration for visitor messages
    if (message.isFromVisitor) {
        const visitorParticipant = { id: message.participantId, name: message.displayName, isVisitor: true as const };

        return isPrivateChatEnabled(visitorParticipant, state);
    }

    // For non-visitor messages, use the regular participant
    return isPrivateChatEnabled(participant, state);
}

/**
 * Returns the message that is displayed as a notice for private messages.
 *
 * @param {IMessage} message - The message to be checked.
 * @returns {string}
 */
export function getPrivateNoticeMessage(message: IMessage) {
    let recipient;

    if (message.messageType === MESSAGE_TYPE_LOCAL) {
        // For messages sent by local user, show the recipient name
        // For visitor messages, use the visitor's display name with indicator
        recipient = message.sentToVisitor ? `${message.recipient} ${i18next.t('visitors.chatIndicator')}` : message.recipient;
    } else {
        // For messages received from others, show "you"
        recipient = i18next.t('chat.you');
    }

    return i18next.t('chat.privateNotice', {
        recipient
    });
}


/**
 * Check if participant is not allowed to send group messages.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - Returns true if the participant is not allowed to send group messages.
 */
export function isSendGroupChatDisabled(state: IReduxState) {
    const { groupChatRequiresPermission } = state['features/dynamic-branding'];

    if (!groupChatRequiresPermission) {
        return false;
    }

    return !isJwtFeatureEnabled(state, MEET_FEATURES.SEND_GROUPCHAT, false);
}

/**
 * Calculates the maximum width available for the chat panel based on the current window size
 * and other UI elements.
 *
 * @param {IReduxState} state - The Redux state containing the application's current state.
 * @returns {number} The maximum width in pixels available for the chat panel. Returns 0 if there
 * is no space available.
 */
export function getChatMaxSize(state: IReduxState) {
    const { clientWidth } = state['features/base/responsive-ui'];

    return Math.max(clientWidth - getParticipantsPaneWidth(state) - VIDEO_SPACE_MIN_SIZE, 0);
}

/**
 * Type guard to check if a participant is a visitor chat participant.
 *
 * @param {IParticipant | IVisitorChatParticipant | undefined} participant - The participant to check.
 * @returns {boolean} - True if the participant is a visitor chat participant.
 */
export function isVisitorChatParticipant(
        participant?: IParticipant | IVisitorChatParticipant
): participant is IVisitorChatParticipant {
    return Boolean(participant && 'isVisitor' in participant && participant.isVisitor === true);
}
