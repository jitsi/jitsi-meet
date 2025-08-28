import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_CAR_MODE,
    SET_TILE_VIEW,
    VIRTUAL_SCREENSHARE_REMOTE_PARTICIPANTS_UPDATED
} from './actionTypes';

const DEFAULT_STATE = {
    /**
     * Whether we are in carmode.
     *
     * @public
     * @type {boolean}
     */
    carMode: false,

    remoteScreenShares: [],

    /**
     * The indicator which determines whether the video layout should display
     * video thumbnails in a tiled layout.
     *
     * Note: undefined means that the user hasn't requested anything in particular yet, so
     * we use our auto switching rules.
     *
     * @public
     * @type {boolean}
     */
    tileViewEnabled: undefined
};

export interface IVideoLayoutState {
    carMode: boolean;
    remoteScreenShares: string[];
    tileViewEnabled?: boolean;
}

const STORE_NAME = 'features/video-layout';

ReducerRegistry.register<IVideoLayoutState>(STORE_NAME, (state = DEFAULT_STATE, action): IVideoLayoutState => {
    switch (action.type) {
    case VIRTUAL_SCREENSHARE_REMOTE_PARTICIPANTS_UPDATED:
        return {
            ...state,
            remoteScreenShares: action.participantIds
        };

    case SET_CAR_MODE:
        return {
            ...state,
            carMode: action.enabled
        };

    case SET_TILE_VIEW:
        return {
            ...state,
            tileViewEnabled: action.enabled
        };
    }

    return state;
});
