// @flow

import { MiddlewareRegistry } from '../base/redux';
import { updateSettings } from '../base/settings';

import { PREJOIN_START_CONFERENCE } from './actionTypes';

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
        const tracks = state['features/base/tracks'];

        userSelectedSkipPrejoin && dispatch(updateSettings({
            userSelectedSkipPrejoin
        }));

        APP.conference.prejoinStart(tracks.map(t => t.jitsiTrack));

        break;
    }
    }


    return next(action);
});
