// @flow

import { getLogger as _getLogger } from 'jitsi-meet-logger';

/**
 * Options for building the logger. We disable the callee info on RN because it's
 * almost always empty anyway.
 */
const DEFAULT_OPTS = {};
const DEFAULT_RN_OPTS = { disableCallerInfo: true };

/**
 * Gets a logger for the given id.
 *
 * @param {string} id - Name for the logger.
 * @returns {Object} - The logger object.
 */
export function getLogger(id: string) {
    const opts = navigator.product === 'ReactNative' ? DEFAULT_RN_OPTS : DEFAULT_OPTS;

    return _getLogger(id, undefined, opts);
}
