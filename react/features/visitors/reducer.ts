import { CONFERENCE_WILL_LEAVE } from '../base/conference/actionTypes';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import { I_AM_VISITOR_MODE, UPDATE_VISITORS_COUNT } from './actionTypes';

const DEFAULT_STATE = {
    count: -1,
    iAmVisitor: false,
    showNotification: false
};

export interface IVisitorsState {
    count?: number;
    iAmVisitor: boolean;
}
ReducerRegistry.register<IVisitorsState>('features/visitors', (state = DEFAULT_STATE, action): IVisitorsState => {
    switch (action.type) {
    case CONFERENCE_WILL_LEAVE: {
        return {
            ...state,
            ...DEFAULT_STATE,

            // If the action was called because a visitor was promoted don't clear the iAmVisitor field. It will be set
            // to false with the I_AM_VISITOR_MODE action and we will be able to distinguish leaving the conference use
            // case and promoting a visitor use case.
            iAmVisitor: action.isRedirect ? state.iAmVisitor : DEFAULT_STATE.iAmVisitor
        };
    }
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
