// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import {
    SCREEN_SHARE_STREAM_ADDED,
    SCREEN_SHARE_STREAM_REMOVED,
    SET_TILE_VIEW
} from './actionTypes';

const STORE_NAME = 'features/video-layout';

PersistenceRegistry.register(STORE_NAME, {
    tileViewEnabled: true
});

ReducerRegistry.register(STORE_NAME, (state = {}, action) => {
    switch (action.type) {
    case SCREEN_SHARE_STREAM_ADDED: {
        const screenShares = new Set(state.screenShares);

        screenShares.add(action.participantId);

        return {
            ...state,
            screenShares
        };
    }

    case SCREEN_SHARE_STREAM_REMOVED: {
        const screenShares = new Set(state.screenShares);

        screenShares.delete(action.participantId);

        return {
            ...state,
            screenShares
        };
    }

    case SET_TILE_VIEW:
        return {
            ...state,
            tileViewEnabled: action.enabled
        };
    }

    return state;
});
