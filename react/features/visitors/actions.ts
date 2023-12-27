import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';

import {
    CLEAR_VISITOR_PROMOTION_REQUEST,
    I_AM_VISITOR_MODE,
    UPDATE_VISITORS_COUNT,
    VISITOR_PROMOTION_REQUEST
} from './actionTypes';
import { IPromotionRequest } from './types';

/**
 * Action used to admit multiple participants in the conference.
 *
 * @param {Array<Object>} requests - A list of visitors requests.
 * @returns {Function}
 */
export function admitMultiple(requests: Array<IPromotionRequest>): Function {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);

        requests.forEach(r => {
            conference?.sendMessage({
                type: 'visitors',
                action: 'promotion-response',
                approved: true,
                id: r.from
            });
        });
    };
}

/**
 * Approves the request of a visitor to join the main meeting.
 *
 * @param {IPromotionRequest} request - The request from the visitor.
 * @returns {Function}
 */
export function approveRequest(request: IPromotionRequest): Function {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);

        conference?.sendMessage({
            type: 'visitors',
            action: 'promotion-response',
            approved: true,
            id: request.from
        });

        dispatch(clearPromotionRequest(request));
    };
}

/**
 * Denies the request of a visitor to join the main meeting.
 *
 * @param {IPromotionRequest} request - The request from the visitor.
 * @returns {Function}
 */
export function denyRequest(request: IPromotionRequest): Function {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);

        conference?.sendMessage({
            type: 'visitors',
            action: 'promotion-response',
            approved: false,
            id: request.from
        });

        dispatch(clearPromotionRequest(request));
    };
}

/**
 * Removes a promotion request from the state.
 *
 * @param {IPromotionRequest} request - The request.
 * @returns {{
 *     type: CLEAR_VISITOR_PROMOTION_REQUEST,
 *     request: IPromotionRequest
 * }}
 */
export function clearPromotionRequest(request: IPromotionRequest) {
    return {
        type: CLEAR_VISITOR_PROMOTION_REQUEST,
        request
    };
}

/**
 * Visitor has sent us a promotion request.
 *
 * @param {IPromotionRequest} request - The request.
 * @returns {{
 *     type: VISITOR_PROMOTION_REQUEST,
 * }}
 */
export function promotionRequestReceived(request: IPromotionRequest) {
    return {
        type: VISITOR_PROMOTION_REQUEST,
        request
    };
}

/**
 * Sets Visitors mode on or off.
 *
 * @param {boolean} enabled - The new visitors mode state.
 * @returns {{
 *     type: I_AM_VISITOR_MODE,
 * }}
 */
export function setIAmVisitor(enabled: boolean) {
    return {
        type: I_AM_VISITOR_MODE,
        enabled
    };
}

/**
 * Visitors count has been updated.
 *
 * @param {number} count - The new visitors count.
 * @returns {{
 *     type: UPDATE_VISITORS_COUNT,
 * }}
 */
export function updateVisitorsCount(count: number) {
    return {
        type: UPDATE_VISITORS_COUNT,
        count
    };
}
