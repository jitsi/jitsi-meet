import { createInstance } from '@amplitude/analytics-browser';

const amplitude = createInstance();

export default amplitude;

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
        defaultTracking: false
    };

    return amplitude.init(amplitudeAPPKey, user, options).promise;
}
