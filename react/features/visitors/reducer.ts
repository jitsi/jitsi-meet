import { CONFERENCE_WILL_LEAVE } from '../base/conference/actionTypes';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CLEAR_VISITOR_PROMOTION_REQUEST,
    I_AM_VISITOR_MODE,
    UPDATE_VISITORS_COUNT,
    VISITOR_PROMOTION_REQUEST
} from './actionTypes';
import { IPromotionRequest } from './types';

const DEFAULT_STATE = {
    count: -1,
    iAmVisitor: false,
    showNotification: false,
    promotionRequests: []
};

export interface IVisitorsState {
    count?: number;
    iAmVisitor: boolean;
    promotionRequests: IPromotionRequest[];
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
    case VISITOR_PROMOTION_REQUEST: {
        const currentRequests = state.promotionRequests || [];

        currentRequests.push(action.request);

        return {
            ...state,
            promotionRequests: [ ...currentRequests ]
        };
    }
    case CLEAR_VISITOR_PROMOTION_REQUEST: {
        let currentRequests = state.promotionRequests || [];

        currentRequests = currentRequests.filter(r => r.from !== action.request.from);

        return {
            ...state,
            promotionRequests: currentRequests
        };
    }
    }

    return state;
});
