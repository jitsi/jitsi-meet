// @flow

import { JitsiConferenceErrors } from '../base/lib-jitsi-meet';
import {
    isFatalJitsiConferenceError,
    isFatalJitsiConnectionError
} from '../base/lib-jitsi-meet/functions';
import { StateListenerRegistry } from '../base/redux';

import { setFatalError } from './actions';

declare var APP: Object;

/**
 * Error type. Basically like Error, but augmented with a recoverable property.
 */
type ErrorType = {|

    /**
     * Error message.
     */
    message?: string,

    /**
     * Error name.
     */
    name: string,

    /**
     * Indicates whether this event is recoverable or not.
     */
    recoverable?: boolean
|};

/**
 * List of errors that are not fatal (or handled differently) so then the overlays won't kick in.
 */
const NON_OVERLAY_ERRORS = [
    JitsiConferenceErrors.CONFERENCE_ACCESS_DENIED,
    JitsiConferenceErrors.CONFERENCE_DESTROYED,
    JitsiConferenceErrors.CONNECTION_ERROR
];

const ERROR_TYPES = {
    CONFIG: 'CONFIG',
    CONNECTION: 'CONNECTION',
    CONFERENCE: 'CONFERENCE'
};

/**
 * Gets the error type and whether it's fatal or not.
 *
 * @param {Function} getState - The redux function for fetching the current state.
 * @param {Object|string} error - The error to process.
 * @returns {void}
 */
const getErrorExtraInfo = (getState, error) => {
    const state = getState();
    const { error: conferenceError } = state['features/base/conference'];
    const { error: configError } = state['features/base/config'];
    const { error: connectionError } = state['features/base/connection'];

    if (error === conferenceError) {
        return {
            type: ERROR_TYPES.CONFERENCE,
            isFatal: isFatalJitsiConferenceError(error.name || error)
        };
    }

    if (error === configError) {
        return {
            type: ERROR_TYPES.CONFIG,
            isFatal: true
        };
    }

    if (error === connectionError) {
        return {
            type: ERROR_TYPES.CONNECTION,
            isFatal: isFatalJitsiConnectionError(error.name || error)
        };
    }
};

/**
 * State listener which emits the {@code fatalErrorOccurred} action which works
 * as a catch all for critical errors which have not been claimed by any other
 * feature for error recovery (the recoverable flag is not set).
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const { error: conferenceError } = state['features/base/conference'];
        const { error: configError } = state['features/base/config'];
        const { error: connectionError } = state['features/base/connection'];

        return configError || connectionError || conferenceError;
    },
    /* listener */ (error: ErrorType, { dispatch, getState }) => {
        if (!error) {
            return;
        }

        if (typeof APP !== 'undefined') {
            APP.API.notifyError({
                ...error,
                ...getErrorExtraInfo(getState, error)
            });
        }

        if (NON_OVERLAY_ERRORS.indexOf(error.name) === -1 && typeof error.recoverable === 'undefined') {
            dispatch(setFatalError(error));
        }
    }
);
