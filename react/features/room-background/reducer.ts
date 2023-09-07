import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_BACKGROUND_DATA
} from './actionTypes';

/**
 * The name of the redux store/state property which is the root of the redux
 * state of the feature {@code room-background}.
 */
const STORE_NAME = 'features/room-background';

const DEFAULT_STATE = {
    /**
     * The custom background color for the LargeVideo.
     *
     * @public
     * @type {string}
     */
    backgroundColor: '',

    /**
     * The custom background image used on the LargeVideo.
     *
     * @public
     * @type {string}
     */
    // eslint-disable-next-line max-len
    backgroundImageUrl: ''
};

export interface IRoomBackground {
    backgroundColor: string;
    backgroundImageUrl: string;
    lastUpdate?: any;
}

/**
 * Reduces redux actions for the purposes of the feature {@code room-background}.
 */
ReducerRegistry.register<IRoomBackground>(STORE_NAME, (state = DEFAULT_STATE, action): IRoomBackground => {
    switch (action.type) {
    case SET_BACKGROUND_DATA: {
        const {
            backgroundColor,
            backgroundImageUrl,
            lastUpdate
        } = action.value;

        return {
            backgroundColor,
            backgroundImageUrl,
            lastUpdate
        };
    }
    }

    return state;
});
