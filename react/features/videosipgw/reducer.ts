import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SIP_GW_AVAILABILITY_CHANGED } from './actionTypes';

export interface IVideoSipGW {
    status?: string;
}

ReducerRegistry.register<IVideoSipGW>(
    'features/videosipgw', (state = {}, action): IVideoSipGW => {
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
