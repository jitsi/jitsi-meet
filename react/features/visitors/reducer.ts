import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    I_AM_VISITOR_MODE,
    UPDATE_VISITORS_COUNT
} from './actionTypes';

const DEFAULT_STATE = {
    iAmVisitor: false
};

export interface IVisitorsState {
    count?: number;
    iAmVisitor: boolean;
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
    case I_AM_VISITOR_MODE: {
        return {
            ...state,
            iAmVisitor: action.enabled
        };
    }
    }

    return state;
});
