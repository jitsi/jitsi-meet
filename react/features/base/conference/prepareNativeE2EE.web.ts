import { IJitsiConference } from './reducer';

/**
 * Keeps browser conference creation synchronous and unchanged.
 *
 * @param {Object} _conference - The conference created by the SDK.
 * @returns {undefined}
 */
export function prepareNativeE2EE(_conference: IJitsiConference): Promise<void> | undefined {
    return undefined;
}
