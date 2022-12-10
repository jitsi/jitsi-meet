// @ts-ignore
import aliases from 'react-emoji-render/data/aliases';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import emojiAsciiAliases from 'react-emoji-render/data/asciiAliases';

import { IReduxState } from '../app/types';
import { escapeRegexp } from '../base/util/helpers';

import { IMessage } from './reducer';

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
export function replaceNonUnicodeEmojis(message: string) {
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
    let lastReadIndex;

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
