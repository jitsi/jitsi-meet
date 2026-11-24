import { appNavigate } from '../../app/actions.native';
import { notifyConferenceFailed } from '../../conference/actions.native';
import { JitsiConferenceErrors } from '../lib-jitsi-meet';
import { SET_NETWORK_INFO } from '../net-info/actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { CONFERENCE_FAILED, CONFERENCE_JOINED, CONFERENCE_LEFT } from './actionTypes';
import { conferenceLeft } from './actions.native';
import { TRIGGER_READY_TO_CLOSE_REASONS } from './constants';
import './middleware.any';
import { processDestroyConferenceEvent } from './functions';
import {
    maybeRestartIceOnNetworkChange,
    noteSessionNetwork,
    resetNetworkChangeState
} from './networkChangeIceRestart.native';

MiddlewareRegistry.register(store => next => action => {
    const { dispatch } = store;
    const { error } = action;

    switch (action.type) {
    case CONFERENCE_JOINED: {
        const result = next(action);

        noteSessionNetwork(store);

        return result;
    }

    case CONFERENCE_LEFT:
        resetNetworkChangeState();
        break;

    case SET_NETWORK_INFO: {
        const result = next(action);

        maybeRestartIceOnNetworkChange(store);

        return result;
    }

    case CONFERENCE_FAILED: {
        const { getState } = store;
        const state = getState();
        const { notifyOnConferenceDestruction = true } = state['features/base/config'];

        if (error?.name !== JitsiConferenceErrors.CONFERENCE_DESTROYED) {
            break;
        }

        if (processDestroyConferenceEvent(state, dispatch, error.params)) {
            break;
        }

        if (!notifyOnConferenceDestruction) {
            dispatch(conferenceLeft(action.conference));
            dispatch(appNavigate(undefined));
            break;
        }

        const [ reason ] = error.params;

        const reasonKey = Object.keys(TRIGGER_READY_TO_CLOSE_REASONS)[
            Object.values(TRIGGER_READY_TO_CLOSE_REASONS).indexOf(reason)
        ];

        dispatch(notifyConferenceFailed(reasonKey, () => {
            dispatch(conferenceLeft(action.conference));
            dispatch(appNavigate(undefined));
        }));
    }
    }

    return next(action);
});
