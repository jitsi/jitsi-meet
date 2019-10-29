// @flow

import _ from 'lodash';
import Logger, { getLogger as _getLogger } from 'jitsi-meet-logger';

import LogTransport from './LogTransport';

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

/**
 * Initializes native logging. This operations must be done as early as possible.
 */
export const _initLogging = _.once(() => {
    if (navigator.product !== 'ReactNative') {
        return;
    }

    // Lazy load it to avoid cycles in early web bootstrap code.
    const { default: JitsiMeetJS } = require('../lib-jitsi-meet/_');

    Logger.setGlobalOptions(DEFAULT_RN_OPTS);
    JitsiMeetJS.setGlobalLogOptions(DEFAULT_RN_OPTS);
    Logger.removeGlobalTransport(console);
    JitsiMeetJS.removeGlobalLogTransport(console);
    Logger.addGlobalTransport(LogTransport);
    JitsiMeetJS.addGlobalLogTransport(LogTransport);
});
