// @flow

/**
 * An registry that dispatches hardware back button events for subscribers with a custom logic.
 */
class BackButtonRegistry {
    _listeners: Array<Function>;

    /**
     * Instantiates a new instance of the registry.
     */
    constructor() {
        this._listeners = [];
    }

    /**
     * Adds a listener to the registry.
     *
     * NOTE: Due to the different order of component mounts, we allow a component to register
     * its listener to the top of the list, so then that will be invoked before other, 'non-top'
     * listeners. For example a 'non-top' listener can be the one that puts the app into PiP mode,
     * while a 'top' listener is the one that closes a modal in a conference.
     *
     * @param {Function} listener - The listener function.
     * @param {boolean?} top - If true, the listener will be put on the top (eg for modal-like components).
     * @returns {void}
     */
    addListener(listener: Function, top: boolean = false) {
        if (top) {
            this._listeners.splice(0, 0, listener);
        } else {
            this._listeners.push(listener);
        }
    }

    /**
     * Removes a listener from the registry.
     *
     * @param {Function} listener - The listener to remove.
     * @returns {void}
     */
    removeListener(listener: Function) {
        this._listeners = this._listeners.filter(f => f !== listener);
    }

    onHardwareBackPress: () => boolean;

    /**
     * Callback for the back button press event.
     *
     * @returns {boolean}
     */
    onHardwareBackPress() {
        for (const listener of this._listeners) {
            const result = listener();

            if (result === true) {
                return true;
            }
        }

        return false;
    }
}

export default new BackButtonRegistry();
