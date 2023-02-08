import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    UPDATE_VISITORS_COUNT,
    VISITORS_MODE_ENABLED
} from './actionTypes';

const DEFAULT_STATE = {
    enabled: false
};

export interface IVisitorsState {
    count?: number;
    enabled: boolean;
}
ReducerRegistry.register<IVisitorsState>('features/visitors', (state = DEFAULT_STATE, action): IVisitorsState => {
    switch (action.type) {
    case UPDATE_VISITORS_COUNT: {
        if (state.count === action.count) {
            return state;
        }

        return {
            ...state,
            count: action.count
        };
    }
    case VISITORS_MODE_ENABLED: {
        return {
            ...state,
            enabled: action.enabled
        };
    }
    }

    return state;
});
