import ReducerRegistry from '../../base/redux/ReducerRegistry';

import { ENABLE_IOS_PIP } from './actionTypes';

const DEFAULT_STATE = {
    enableIosPIP: false
};

export interface IMobilePictureInPictureState {
    enableIosPIP: boolean;
}

const STORE_NAME = 'features/mobile/picture-in-picture';

// eslint-disable-next-line max-len
ReducerRegistry.register<IMobilePictureInPictureState>(STORE_NAME, (state = DEFAULT_STATE, action): IMobilePictureInPictureState => {
    switch (action.type) {

    case ENABLE_IOS_PIP: {
        const { enableIosPIP } = action;

        return {
            ...state,
            enableIosPIP
        };
    }

    default:
        return state;
    }
});
