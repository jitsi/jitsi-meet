import { CONFERENCE_PROPERTIES_CHANGED, CONFERENCE_WILL_LEAVE } from '../base/conference/actionTypes';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CLEAR_VISITOR_PROMOTION_REQUEST,
    I_AM_VISITOR_MODE,
    SET_IN_VISITORS_QUEUE,
    SET_VISITORS_SUPPORTED,
    SET_VISITOR_DEMOTE_ACTOR,
    UPDATE_VISITORS_IN_QUEUE_COUNT,
    VISITOR_PROMOTION_REQUEST
} from './actionTypes';
import { IPromotionRequest } from './types';

const DEFAULT_STATE = {
    count: 0,
    iAmVisitor: false,
    inQueue: false,
    inQueueCount: 0,
    showNotification: false,
    supported: false,
    promotionRequests: []
};

export interface IVisitorsState {
    count?: number;
    demoteActorDisplayName?: string;
    iAmVisitor: boolean;
    inQueue: boolean;
    inQueueCount?: number;
    promotionRequests: IPromotionRequest[];
    supported: boolean;
}
ReducerRegistry.register<IVisitorsState>('features/visitors', (state = DEFAULT_STATE, action): IVisitorsState => {
    switch (action.type) {
    case CONFERENCE_PROPERTIES_CHANGED: {
        const visitorCount = Number(action.properties?.['visitor-count']);

        if (!isNaN(visitorCount) && state.count !== visitorCount) {
            return {
                ...state,
                count: visitorCount
            };
        }

        break;
    }
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
    case UPDATE_VISITORS_IN_QUEUE_COUNT: {
        if (state.count === action.count) {
            return state;
        }

        return {
            ...state,
            inQueueCount: action.count
        };
    }
    case I_AM_VISITOR_MODE: {
        return {
            ...state,
            iAmVisitor: action.enabled
        };
    }
    case SET_IN_VISITORS_QUEUE: {
        return {
            ...state,
            inQueue: action.value
        };
    }
    case SET_VISITOR_DEMOTE_ACTOR: {
        return {
            ...state,
            demoteActorDisplayName: action.displayName
        };
    }
    case SET_VISITORS_SUPPORTED: {
        return {
            ...state,
            supported: action.value
        };
    }
    case VISITOR_PROMOTION_REQUEST: {
        const currentRequests = state.promotionRequests || [];

        return {
            ...state,
            promotionRequests: [ ...currentRequests, action.request ]
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
