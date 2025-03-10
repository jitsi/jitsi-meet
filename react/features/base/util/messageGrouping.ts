/**
 * Interface representing a message that can be grouped.
 * Used by both chat messages and subtitles.
 */
export interface IGroupableMessage {

    /**
     * The ID of the participant who sent the message.
     */
    participantId: string;
}

/**
 * Interface representing a group of messages from the same sender.
 *
 * @template T - The type of messages in the group, must extend IGroupableMessage.
 */
export interface IMessageGroup<T extends IGroupableMessage> {

    /**
     * Array of messages in this group.
     */
    messages: T[];

    /**
     * The ID of the participant who sent all messages in this group.
     */
    senderId: string;
}

/**
 * Groups an array of messages by sender.
 *
 * @template T - The type of messages to group, must extend IGroupableMessage.
 * @param {T[]} messages - The array of messages to group.
 * @returns {IMessageGroup<T>[]} - An array of message groups, where each group contains messages from the same sender.
 * @example
 * const messages = [
 *   { participantId: "user1", timestamp: 1000 },
 *   { participantId: "user1", timestamp: 2000 },
 *   { participantId: "user2", timestamp: 3000 }
 * ];
 * const groups = groupMessagesBySender(messages);
 * // Returns:
 * // [
 * //   {
 * //     senderId: "user1",
 * //     messages: [
 * //       { participantId: "user1", timestamp: 1000 },
 * //       { participantId: "user1", timestamp: 2000 }
 * //     ]
 * //   },
 * //   { senderId: "user2", messages: [{ participantId: "user2", timestamp: 3000 }] }
 * // ]
 */
export function groupMessagesBySender<T extends IGroupableMessage>(
        messages: T[]
): IMessageGroup<T>[] {
    if (!messages?.length) {
        return [];
    }

    const groups: IMessageGroup<T>[] = [];
    let currentGroup: IMessageGroup<T> | null = null;

    for (const message of messages) {
        if (!currentGroup || currentGroup.senderId !== message.participantId) {
            currentGroup = {
                messages: [ message ],
                senderId: message.participantId
            };
            groups.push(currentGroup);
        } else {
            currentGroup.messages.push(message);
        }
    }

    return groups;
}
