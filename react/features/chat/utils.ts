import { IMessage } from './types';

/**
 * Updates a message in the messages array by its messageId immutably.
 *
 * @param {IMessage[]} messages - The current messages array.
 * @param {string} messageId - The ID of the message to update.
 * @param {Function} updater - A function that takes the matched message and returns the updated message.
 * @returns {IMessage[]} A new messages array with the updated message.
 */
export function updateMessageById(
        messages: IMessage[],
        messageId: string,
        updater: (msg: IMessage) => IMessage
): IMessage[] {
    return messages.map(m =>
        m.messageId === messageId ? updater(m) : m
    );
}
