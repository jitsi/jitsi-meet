import {
    setPrejoinPageVisibility,
    setSkipPrejoinOnReload
} from '../../prejoin/actions.web';
import { JitsiConferenceErrors } from '../lib-jitsi-meet';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { CONFERENCE_FAILED, CONFERENCE_JOINED, CONFERENCE_JOIN_IN_PROGRESS } from './actionTypes';
import './middleware.any';

MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;
    const { enableForcedReload } = getState()['features/base/config'];

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        dispatch(setPrejoinPageVisibility(false));

        break;
    }
    case CONFERENCE_JOINED: {
        if (enableForcedReload) {
            dispatch(setSkipPrejoinOnReload(false));
        }

        break;
    }
    case CONFERENCE_FAILED: {
        const errorName = action.error?.name;

        if (enableForcedReload && errorName === JitsiConferenceErrors.CONFERENCE_RESTARTED) {
            dispatch(setSkipPrejoinOnReload(true));
        }

        break;
    }
    }

    return next(action);
});
