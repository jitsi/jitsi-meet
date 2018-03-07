/**
 * Selector for calculating how the number of unread messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of unread messages.
 */
export function getUnreadCount(state) {
    const { lastReadMessage, messages } = state['features/chat'];
    const messagesCount = messages.length;

    if (!messagesCount) {
        return 0;
    }

    const lastReadIndex = messages.lastIndexOf(lastReadMessage);

    return messagesCount - (lastReadIndex + 1);
}
