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
import { getParticipantById } from '../base/participants/functions';
import { escapeRegexp } from '../base/util/helpers';

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

    return Boolean(participant)
        && (message.privateMessage || (message.lobbyChat && !knocking))
        && message.messageType !== MESSAGE_TYPE_LOCAL;
}

/**
 * Returns the message that is displayed as a notice for private messages.
 *
 * @param {IMessage} message - The message to be checked.
 * @returns {string}
 */
export function getPrivateNoticeMessage(message: IMessage) {
    return i18next.t('chat.privateNotice', {
        recipient: message.messageType === MESSAGE_TYPE_LOCAL ? message.recipient : i18next.t('chat.you')
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
