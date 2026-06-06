import { createInstance } from '@amplitude/analytics-browser';
import { EnrichmentPlugin, Event, PluginType } from '@amplitude/analytics-types';

const amplitude = createInstance();

export default amplitude;

function stripParam(url?: string): string | undefined {
    if (!url) return url;

    try {
        const u = new URL(url);

        u.hash = '';
        u.search = '';

        return u.toString();
    } catch {
        return url.split('#')[0].split('?')[0];
    }
}

class StripParamsPlugin implements EnrichmentPlugin {
    name: 'strip-params-plugin';
    type: PluginType.ENRICHMENT;

    async setup(): Promise<void> {
        return undefined;
    }

    async execute(event: Event): Promise<Event | null> {
        const { event_properties } = event;

        if (event_properties) {
            // These are only needed to make TS happy.
            type EventPropertiesKey = keyof typeof event_properties;
            const PAGE_LOCATION_KEY = '[Amplitude] Page Location' as EventPropertiesKey;
            const PAGE_URL_KEY = '[Amplitude] Page URL' as EventPropertiesKey;

            event_properties[PAGE_LOCATION_KEY] = stripParam(event_properties[PAGE_LOCATION_KEY]);
            event_properties[PAGE_URL_KEY] = stripParam(event_properties[PAGE_URL_KEY]);
        }

        return event;
    }
}

/**
 * Initializes the Amplitude instance.
 *
 * @param {string} amplitudeAPPKey - The Amplitude app key.
 * @param {string | undefined} user - The user ID.
 * @returns {Promise} The initialized Amplitude instance.
 */
export function initAmplitude(
        amplitudeAPPKey: string, user: string | undefined): Promise<unknown> {

    // Forces sending all events on exit (flushing) via sendBeacon.
    window.addEventListener('pagehide', () => {
        // Set https transport to use sendBeacon API.
        amplitude.setTransport('beacon');
        // Send all pending events to server.
        amplitude.flush();
    });

    const options = {
        autocapture: {
            attribution: true,
            pageViews: true,
            sessions: false,
            fileDownloads: false,
            formInteractions: false,
            elementInteractions: false
        },
    };

    amplitude.add(new StripParamsPlugin());

    return amplitude.init(amplitudeAPPKey, user, options).promise;
}
