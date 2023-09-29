import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_SCREENSHOT_CAPTURE } from './actionTypes';

PersistenceRegistry.register('features/screnshot-capture', true, {
    capturesEnabled: false
});

const DEFAULT_STATE = {
    capturesEnabled: false
};

export interface IScreenshotCaptureState {
    capturesEnabled: boolean;
}

ReducerRegistry.register<IScreenshotCaptureState>('features/screenshot-capture',
(state = DEFAULT_STATE, action): IScreenshotCaptureState => {
    switch (action.type) {
    case SET_SCREENSHOT_CAPTURE: {
        return {
            ...state,
            capturesEnabled: action.payload
        };
    }
    }

    return state;
});
