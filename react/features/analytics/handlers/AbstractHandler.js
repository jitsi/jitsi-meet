/**
 * Abstract implementation of analytics handler
 */
export default class AbstractHandler {
    /**
     * Creates new instance.
     */
    constructor() {
        this._enabled = false;
        this._ignoredEvents
            = [ 'e2e_rtt', 'rtp.stats', 'rtt.by.region', 'available.device',
                'stream.switch.delay', 'ice.state.changed', 'ice.duration' ];
    }

    /**
     * Extracts a name for the event from the event properties.
     *
     * @param {Object} event - The analytics event.
     * @returns {string} - The extracted name.
     */
    _extractName(event) {
        // Page events have a single 'name' field.
        if (event.type === 'page') {
            return event.name;
        }

        const {
            action,
            actionSubject,
            source
        } = event;

        // All events have action, actionSubject, and source fields. All
        // three fields are required, and often jitsi-meet and
        // lib-jitsi-meet use the same value when separate values are not
        // necessary (i.e. event.action == event.actionSubject).
        // Here we concatenate these three fields, but avoid adding the same
        // value twice, because it would only make the event's name harder
        // to read.
        let name = action;

        if (actionSubject && actionSubject !== action) {
            name = `${actionSubject}.${action}`;
        }
        if (source && source !== action) {
            name = `${source}.${name}`;
        }

        return name;
    }

    /**
     * Checks if an event should be ignored or not.
     *
     * @param {Object} event - The event.
     * @returns {boolean}
     */
    _shouldIgnore(event) {
        if (!event || !this._enabled) {
            return true;
        }

        // Temporary removing some of the events that are too noisy.
        return this._ignoredEvents.indexOf(event.action) !== -1;
    }
}
