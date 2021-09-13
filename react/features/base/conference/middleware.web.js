// @flow

import { setPrejoinPageVisibility, setSkipPrejoinOnReload } from '../../prejoin';
import { PREJOIN_SCREEN_STATES } from '../../prejoin/constants';
import { JitsiConferenceErrors } from '../lib-jitsi-meet';
import { MiddlewareRegistry } from '../redux';

import { CONFERENCE_FAILED, CONFERENCE_JOINED } from './actionTypes';
import './middleware.any';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const { enableForcedReload } = getState()['features/base/config'];

    switch (action.type) {
    case CONFERENCE_JOINED: {
        if (enableForcedReload) {
            dispatch(setPrejoinPageVisibility(PREJOIN_SCREEN_STATES.HIDDEN));
            dispatch(setSkipPrejoinOnReload(false));
        }

        break;
    }
    case CONFERENCE_FAILED: {
        enableForcedReload
            && action.error?.name === JitsiConferenceErrors.CONFERENCE_RESTARTED
            && dispatch(setSkipPrejoinOnReload(true));

        break;
    }
    }

    return next(action);
});
