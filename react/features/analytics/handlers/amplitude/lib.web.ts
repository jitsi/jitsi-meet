import { createInstance } from '@amplitude/analytics-browser';
import { EnrichmentPlugin, Event, PluginType } from '@amplitude/analytics-types';

const amplitude = createInstance();

export default amplitude;

const stripParam = (url: any) => {
    if (!url) return url;
    try {
        const u = new URL(url);

        u.hash = '';
        u.search = '';

        return u.toString();
    } catch {
        return url.split('#')[0].split('?')[0];
    }
};

class StripParamsPlugin implements EnrichmentPlugin {
    name: 'strip-params-plugin';
    type: PluginType.ENRICHMENT;

    async setup(): Promise<void> {
        return undefined;
    }

    async execute(event: Event): Promise<Event | null> {
        if (event.event_properties) {
            // @ts-ignore
            event.event_properties['[Amplitude] Page Location'] = stripParam(event.event_properties['[Amplitude] Page Location']);
            // @ts-ignore
            event.event_properties['[Amplitude] Page URL'] = stripParam(event.event_properties['[Amplitude] Page URL']);
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
