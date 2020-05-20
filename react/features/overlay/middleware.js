// @flow

import { JitsiConferenceErrors } from '../base/lib-jitsi-meet';
import { StateListenerRegistry } from '../base/redux';

import { setFatalError } from './actions';

declare var APP: Object;

/**
 * List of errors that are not fatal (or handled differently) so then the overlays won't kick in.
 */
const NON_OVERLAY_ERRORS = [
    JitsiConferenceErrors.CONFERENCE_ACCESS_DENIED,
    JitsiConferenceErrors.CONFERENCE_DESTROYED,
    JitsiConferenceErrors.CONNECTION_ERROR
];

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
    /* listener */ (error, { dispatch }) => {
        error
            && NON_OVERLAY_ERRORS.indexOf(error.name) === -1
            && typeof error.recoverable === 'undefined'
            && dispatch(setFatalError(error));
    }
);
