// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import { SET_TILE_VIEW } from './actionTypes';

const DEFAULT_STATE = {

    /**
     * The indicator which determines whether the video layout should display
     * video thumbnails in a tiled layout.
     *
     * @public
     * @type {boolean}
     */
    tileViewEnabled: false
};

const STORE_NAME = 'features/video-layout';

PersistenceRegistry.register(STORE_NAME);

ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_TILE_VIEW:
        return {
            ...state,
            tileViewEnabled: action.enabled
        };
    }

    return state;
});
