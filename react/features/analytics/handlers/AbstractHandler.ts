export interface IEvent {
    action?: string;
    actionSubject?: string;
    attributes?: {
        [key: string]: string | undefined;
    };
    name?: string;
    source?: string;
    type?: string;
}

interface IOptions {
    amplitudeAPPKey?: string;
    amplitudeIncludeUTM?: boolean;
    blackListedEvents?: string[];
    envType?: string;
    group?: string;
    host?: string;
    matomoEndpoint?: string;
    matomoSiteID?: string;
    product?: string;
    subproduct?: string;
    user?: string;
    version?: string;
    whiteListedEvents?: string[];
}

/**
 * Abstract implementation of analytics handler.
 */
export default class AbstractHandler {
    _enabled: boolean;
    _whiteListedEvents: Array<string> | undefined;
    _blackListedEvents: Array<string> | undefined;

    /**
     * Creates new instance.
     *
     * @param {Object} options - Optional parameters.
     */
    constructor(options: IOptions = {}) {
        this._enabled = false;
        this._whiteListedEvents = options.whiteListedEvents;

        // FIXME:
        // Keeping the list with the very noisy events so that we don't flood with events whoever hasn't configured
        // white/black lists yet. We need to solve this issue properly by either making these events not so noisy or
        // by removing them completely from the code.
        this._blackListedEvents = [
            ...(options.blackListedEvents || []), // eslint-disable-line no-extra-parens
            'e2e_rtt', 'rtp.stats', 'rtt.by.region', 'available.device', 'stream.switch.delay', 'ice.state.changed',
            'ice.duration', 'peer.conn.status.duration'
        ];
    }

    /**
     * Extracts a name for the event from the event properties.
     *
     * @param {Object} event - The analytics event.
     * @returns {string} - The extracted name.
     */
    _extractName(event: IEvent) {
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
    _shouldIgnore(event: IEvent) {
        if (!event || !this._enabled) {
            return true;
        }

        const name = this._extractName(event) ?? '';

        if (Array.isArray(this._whiteListedEvents)) {
            return this._whiteListedEvents.indexOf(name) === -1;
        }

        if (Array.isArray(this._blackListedEvents)) {
            return this._blackListedEvents.indexOf(name) !== -1;
        }

        return false;
    }
}
