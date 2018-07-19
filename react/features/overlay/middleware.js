// @flow

import { StateListenerRegistry } from '../base/redux';

import { setFatalError } from './actions';

declare var APP: Object;

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
            && typeof error.recoverable === 'undefined'
            && dispatch(setFatalError(error));
    }
);
