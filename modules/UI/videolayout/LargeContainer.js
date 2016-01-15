
/**
 * Base class for all Large containers which we can show.
 */
export default class LargeContainer {

    /**
     * Show this container.
     * @returns Promise
     */
    show () {
    }

    /**
     * Hide this container.
     * @returns Promise
     */
    hide () {
    }

    /**
     * Resize this container.
     * @param {number} containerWidth available width
     * @param {number} containerHeight available height
     * @param {boolean} animate if container should animate it's resize process
     */
    resize (containerWidth, containerHeight, animate) {
    }

    /**
     * Handler for "hover in" events.
     */
    onHoverIn (e) {
    }

    /**
     * Handler for "hover out" events.
     */
    onHoverOut (e) {
    }
}
