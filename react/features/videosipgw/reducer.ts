import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SIP_GW_AVAILABILITY_CHANGED } from './actionTypes';

export interface IVideoSipGW {
    status?: string;
}

ReducerRegistry.register(
    'features/videosipgw', (state: IVideoSipGW = {}, action): IVideoSipGW => {
        switch (action.type) {
        case SIP_GW_AVAILABILITY_CHANGED: {
            return {
                ...state,
                status: action.status
            };
        }
        }

        return state;
    });
