import { IStore } from '../app/types';
import { JitsiConferenceErrors, JitsiConnectionErrors } from '../base/lib-jitsi-meet';
import {
    isFatalJitsiConferenceError,
    isFatalJitsiConnectionError
} from '../base/lib-jitsi-meet/functions.any';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { openPageReloadDialog } from './actions';
import logger from './logger';

/**
 * Error type. Basically like Error, but augmented with a recoverable property.
 */
type ErrorType = {

    /**
     * Error message.
     */
    message?: string;

    /**
     * Error name.
     */
    name: string;

    /**
     * Indicates whether this event is recoverable or not.
     */
    recoverable?: boolean;
};

/**
 * List of errors that are not fatal (or handled differently) so then the page reload dialog won't kick in.
 */
const RN_NO_RELOAD_DIALOG_ERRORS = [
    JitsiConnectionErrors.NOT_LIVE_ERROR,
    JitsiConferenceErrors.CONFERENCE_ACCESS_DENIED,
    JitsiConferenceErrors.CONFERENCE_DESTROYED,
    JitsiConferenceErrors.CONNECTION_ERROR,
    JitsiConferenceErrors.CONFERENCE_RESTARTED
];

const ERROR_TYPES = {
    CONFIG: 'CONFIG',
    CONNECTION: 'CONNECTION',
    CONFERENCE: 'CONFERENCE'
};

/**
 * Gets the error type and whether it's fatal or not.
 *
 * @param {Object} state - The redux state.
 * @param {Object|string} error - The error to process.
 * @returns {void}
 */
const getErrorExtraInfo = (state: any, error: ErrorType) => {
    const { error: conferenceError } = state['features/base/conference'];
    const { error: configError } = state['features/base/config'];
    const { error: connectionError } = state['features/base/connection'];

    if (error === conferenceError) {
        return {
            type: ERROR_TYPES.CONFERENCE, // @ts-ignore
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
            type: ERROR_TYPES.CONNECTION, // @ts-ignore
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
    /* listener */ (error: ErrorType, store: IStore) => {
        if (!error) {
            return;
        }

        const state = store.getState();

        // eslint-disable-next-line no-negated-condition
        if (typeof APP !== 'undefined') {
            APP.API.notifyError({
                ...error,
                ...getErrorExtraInfo(state, error)
            });
        } else if (RN_NO_RELOAD_DIALOG_ERRORS.indexOf(error.name) === -1 && typeof error.recoverable === 'undefined') {
            const { error: conferenceError } = state['features/base/conference'];
            const { error: configError } = state['features/base/config'];
            const { error: connectionError } = state['features/base/connection'];
            const conferenceState = state['features/base/conference'];

            if (conferenceState.leaving) {
                logger.info(`Ignoring ${error.name} while leaving conference`);

                return;
            }

            setTimeout(() => {
                logger.info(`Reloading due to error: ${error.name}`, error);

                store.dispatch(openPageReloadDialog(conferenceError, configError, connectionError));
            }, 500);
        }
    }
);
