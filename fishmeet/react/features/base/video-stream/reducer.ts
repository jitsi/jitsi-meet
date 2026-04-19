import ReducerRegistry from '../redux/ReducerRegistry';

import { TOGGLE_VIDEO_STREAM } from './actionTypes';

export interface IVideoStreamState {
    enable?: boolean;
}

const DEFAULT_STATE: IVideoStreamState = {
    enable: true
};

ReducerRegistry.register<IVideoStreamState>('features/base/video-stream', (state = DEFAULT_STATE, action): IVideoStreamState => {
    switch (action.type) {
    case TOGGLE_VIDEO_STREAM: {
        const { enable } = action;

        return {
            ...state,
            enable
        };
    }
    }

    return state;
});
