// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import { SET_TILE_VIEW } from './actionTypes';

const STORE_NAME = 'features/video-layout';

PersistenceRegistry.register(STORE_NAME);

ReducerRegistry.register(STORE_NAME, (state = {}, action) => {
    switch (action.type) {
    case SET_TILE_VIEW:
        return {
            ...state,
            tileViewEnabled: action.enabled
        };
    }

    return state;
});
