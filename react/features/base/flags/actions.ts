import logger from '../app/logger';

import { UPDATE_FLAGS } from './actionTypes';
import * as featureFlags from './constants';

/**
 * Updates the current features flags with the given ones. They will be merged.
 *
 * @param {Object} flags - The new flags object.
 * @returns {{
 *     type: UPDATE_FLAGS,
 *     flags: Object
 * }}
 */
export function updateFlags(flags: Object) {
    const supportedFlags = Object.values(featureFlags);
    const unsupportedFlags = Object.keys(flags).filter(flag => !supportedFlags.includes(flag as any));

    if (unsupportedFlags.length > 0) {
        logger.warn(`The following feature flags are not supported: ${unsupportedFlags.join(', ')}.`);
    }

    return {
        type: UPDATE_FLAGS,
        flags
    };
}
