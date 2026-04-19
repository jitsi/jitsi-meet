import { IStateful } from '../app/types';
import { toState } from '../redux/functions';

export const getVideoStreamEnable = (stateful: IStateful) => {
    const state = toState(stateful)['features/base/video-stream'];

    return state.enable;
};
