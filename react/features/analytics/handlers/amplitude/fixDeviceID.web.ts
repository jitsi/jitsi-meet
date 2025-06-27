import { Types } from '@amplitude/analytics-browser';

/**
 * Custom logic for setting the correct device id.
 *
 * @param {Types.BrowserClient} _amplitude - The amplitude instance.
 * @returns {void}
 */
export function fixDeviceID(_amplitude: Types.BrowserClient): Promise<any> {
    return new Promise(resolve => resolve(true));
}
