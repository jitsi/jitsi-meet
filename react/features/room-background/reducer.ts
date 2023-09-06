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
    backgroundImageUrl: 'https://obs.eu-de.otc.t-systems.com/ivicos-image-upload-service/images/microsoft:a74d1ccf-4e17-41c9-bf39-fa5c15688a1e:a73bf31b-cfa5-4f2e-a18d-ec6d5f0eb8d6/c59c4a40-a110-48d4-881d-9f32b855a4a2.png'
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
    console.log(action);
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
            // eslint-disable-next-line max-len
            // backgroundImageUrl: 'https://obs.eu-de.otc.t-systems.com/ivicos-image-upload-service/images/microsoft:a74d1ccf-4e17-41c9-bf39-fa5c15688a1e:a73bf31b-cfa5-4f2e-a18d-ec6d5f0eb8d6/c59c4a40-a110-48d4-881d-9f32b855a4a2.png',
            lastUpdate
        };
    }
    }

    return state;
});
