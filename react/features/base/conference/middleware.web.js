// @flow

import { setPrejoinPageVisibility, setSkipPrejoinOnReload } from '../../prejoin';
import { JitsiConferenceErrors } from '../lib-jitsi-meet';
import { MiddlewareRegistry } from '../redux';

import { CONFERENCE_FAILED, CONFERENCE_JOINED } from './actionTypes';
import './middleware.any';

declare var APP: Object;

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const { enableForcedReload } = getState()['features/base/config'];

    switch (action.type) {
    case CONFERENCE_JOINED: {
        if (enableForcedReload) {
            dispatch(setPrejoinPageVisibility(false));
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
