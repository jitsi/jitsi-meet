import elementResizeDetectorMaker from 'element-resize-detector';

/**
 * Class for managing a collection of handlers to monitor resizing actions of
 * elements.
 */
class ElementResizeMonitor {

    /**
     * Initializes a new ElementResizeMonitor instance.
     */
    constructor() {
        /**
         * An elementResizeDetectorMaker instance to listen to resizing actions
         * of elements.
         *
         * @private
         * @type {Object}
         */
        this._erd = elementResizeDetectorMaker();

        /**
         * A map to store handlers (callbacks) of each element when resized.
         *
         * @private
         * @type {Map}
         */
        this._eventHandlers = new Map();
    }

    /**
     * Registers a handler to an element's array of callbacks
     * when it's resized.
     *
     * @param {Object} element - The target monitored element.
     * @param {callback} handler - The handler registered.
     * @returns {void}
     */
    registerHandler(element, handler) {
        if (this._eventHandlers.has(element)) {
            this._eventHandlers.get(element).push(handler);
        } else {
            this._eventHandlers.set(element, [ handler ]);
            this._listenToElement(element);
        }
    }

    /**
     * Removes a handler from an element's array of callbacks
     * when it's resized.
     *
     * @param {Object} element - The target monitored element.
     * @param {callback} handler - The handler removed.
     * @returns {void}
     */
    removeHandler(element, handler) {
        if (!this._eventHandlers.has(element)) {
            return;
        }

        const handlerArray = this._eventHandlers.get(element);

        handlerArray.splice(handlerArray.indexOf(handler), 1);
        if (handlerArray.length === 0) {
            this._unlistenToElement(element);
        }
    }

    /**
     * Unlistens to resizing event of an element.
     *
     * @param {Object} element - The target element unlistened.
     * @private
     * @returns {void}
     */
    _unlistenToElement(element) {
        this._eventHandlers.delete(element);
        this._erd.removeAllListeners(element);
    }

    /**
     * Listens to resizing event of an element.
     *
     * @param {Object} element - The target element listened.
     * @private
     * @returns {void}
     */
    _listenToElement(element) {
        this._erd.listenTo(element, () => {
            for (const handler of this._eventHandlers.get(element)) {
                handler();
            }
        });
    }
}

export const elementResizeMonitor = new ElementResizeMonitor();
