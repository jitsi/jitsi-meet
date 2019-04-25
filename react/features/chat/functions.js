// @flow

/**
 * Selector for calculating the number of unread chat messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of unread messages.
 */
export function getUnreadCount(state: Object) {
    const { lastReadMessage, messages } = state['features/chat'];
    const messagesCount = messages.length;

    if (!messagesCount) {
        return 0;
    }

    if (navigator.product === 'ReactNative') {
        // React native stores the messages in a reversed order.
        return messages.indexOf(lastReadMessage);
    }

    const lastReadIndex = messages.lastIndexOf(lastReadMessage);

    return messagesCount - (lastReadIndex + 1);
}
