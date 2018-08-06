// @flow

/**
 * A map of user ID to a set of callbacks that should be executed when the user
 * receives an audio level update.
 *
 * @private
 */
const subscribers: Map<string, Set<Function>> = new Map();

/**
 * An intermediary that acts as a pub/sub service for audio level updates.
 */
export default {
    /**
     * Takes in an audio level update and notifies subscribers of the new
     * value.
     *
     * @param {string} id - The ID of the user with the audio level update.
     * @param {int} lvl - The new audio level.
     * @returns {void}
     */
    onUpdate(id: string, lvl: number) {
        const idSubscribers = subscribers.get(id);

        if (idSubscribers) {
            idSubscribers.forEach(idSubscriber => idSubscriber(lvl));
        }
    },

    /**
     * Subscribe to audio level changes of a specific participant ID.
     *
     * @param {string} id - The ID of the user with the audio level update.
     * @param {Function} callback - The callback to invoke on an audio level
     * update.
     * @returns {void}
     */
    subscribe(id: ?string, callback: Function) {
        if (!id) {
            return;
        }

        if (!subscribers.has(id)) {
            subscribers.set(id, new Set());
        }

        const idSubscribers = subscribers.get(id);

        // Double truthy check for flow.
        if (idSubscribers) {
            idSubscribers.add(callback);
        }
    },

    /**
     * Unsubscribe to audio level changes of a specific participant ID.
     *
     * @param {string} id - The ID of the user with the audio level update.
     * @param {Function} callback - The callback to be unsubscribed.
     * @returns {void}
     */
    unsubscribe(id: string, callback: Function) {
        const idSubscribers = subscribers.get(id);

        if (idSubscribers) {
            idSubscribers.delete(callback);
        }
    }
};
