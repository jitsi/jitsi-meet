import { ReducerRegistry } from '../base/redux';

import { SIP_GW_AVAILABILITY_CHANGED } from './actionTypes.ts';

ReducerRegistry.register(
    'features/videosipgw', (state = [], action) => {
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
