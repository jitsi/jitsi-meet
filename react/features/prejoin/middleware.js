// @flow

import { MiddlewareRegistry } from '../base/redux';
import { updateSettings } from '../base/settings';
import { getLocalVideoTrack, replaceLocalTrack } from '../base/tracks';

import { PREJOIN_START_CONFERENCE } from './actionTypes';
import { setPrejoinPageVisibility } from './actions';

declare var APP: Object;

/**
 * The redux middleware for {@link PrejoinPage}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case PREJOIN_START_CONFERENCE: {
        const { getState, dispatch } = store;
        const state = getState();
        const { userSelectedSkipPrejoin } = state['features/prejoin'];
        const localVideoTrack = getLocalVideoTrack(state['features/base/tracks']);

        userSelectedSkipPrejoin && dispatch(updateSettings({
            userSelectedSkipPrejoin
        }));

        if (localVideoTrack?.muted) {
            await dispatch(replaceLocalTrack(localVideoTrack.jitsiTrack, null));
        }

        const jitsiTracks = getState()['features/base/tracks'].map(t => t.jitsiTrack);

        dispatch(setPrejoinPageVisibility(false));
        APP.conference.prejoinStart(jitsiTracks);

        break;
    }
    }


    return next(action);
});
