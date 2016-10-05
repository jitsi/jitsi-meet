/**
 * Prevents further propagation of the events to be handler by a specific event
 * handler/listener in the capturing and bubbling phases.
 *
 * @param {Function} eventHandler - The event handler/listener which handles
 * events that need to be stopped from propagating.
 * @returns {Function} An event handler/listener to be used in place of the
 * specified eventHandler in order to stop the events from propagating.
 */
export function stopEventPropagation(eventHandler) {
    return ev => {
        const r = eventHandler(ev);

        // React Native does not propagate the press event so, for the sake of
        // cross-platform compatibility, stop the propagation on Web as well.
        // Additionally, use feature checking in order to deal with browser
        // differences.
        if (ev && ev.stopPropagation) {
            ev.stopPropagation();
            ev.preventDefault && ev.preventDefault();
        }

        return r;
    };
}
