import { createRemoteVideoMenuButtonEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { connect, disconnect, setPreferVisitor } from '../base/connection/actions';
import { getLocalParticipant } from '../base/participants/functions';

import {
    CLEAR_VISITOR_PROMOTION_REQUEST,
    I_AM_VISITOR_MODE,
    SET_IN_VISITORS_QUEUE,
    SET_VISITORS_SUPPORTED,
    SET_VISITOR_DEMOTE_ACTOR,
    UPDATE_VISITORS_IN_QUEUE_COUNT,
    VISITOR_PROMOTION_REQUEST
} from './actionTypes';
import logger from './logger';
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

        conference?.sendMessage({
            type: 'visitors',
            action: 'promotion-response',
            approved: true,
            ids: requests.map(r => r.from)
        });
    };
}

/**
 * Approves the request of a visitor to join the main meeting.
 *
 * @param {IPromotionRequest} request - The request from the visitor.
 * @returns {Function}
 */
export function approveRequest(request: IPromotionRequest) {
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
export function denyRequest(request: IPromotionRequest) {
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
 * Sends a demote request to a main participant to join the meeting as a visitor.
 *
 * @param {string} id - The ID for the participant.
 * @returns {Function}
 */
export function demoteRequest(id: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);
        const localParticipant = getLocalParticipant(getState());

        sendAnalytics(createRemoteVideoMenuButtonEvent('demote.button', { 'participant_id': id }));

        if (id === localParticipant?.id) {
            dispatch(disconnect(true))
                .then(() => {
                    dispatch(setPreferVisitor(true));
                    logger.info('Dispatching connect to demote the local participant.');

                    return dispatch(connect());
                });
        } else {
            conference?.sendMessage({
                type: 'visitors',
                action: 'demote-request',
                id,
                actor: localParticipant?.id
            });
        }
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
 * Sets in visitor's queue.
 *
 * @param {boolean} value - The new value.
 * @returns {{
 *     type: SET_IN_VISITORS_QUEUE,
 * }}
 */
export function setInVisitorsQueue(value: boolean) {
    return {
        type: SET_IN_VISITORS_QUEUE,
        value
    };
}

/**
 * Sets visitor demote actor.
 *
 * @param {string|undefined} displayName - The display name of the participant.
 * @returns {{
 *     type: SET_VISITOR_DEMOTE_ACTOR,
 * }}
 */
export function setVisitorDemoteActor(displayName: string | undefined) {
    return {
        type: SET_VISITOR_DEMOTE_ACTOR,
        displayName
    };
}

/**
 * Visitors count has been updated.
 *
 * @param {boolean} value - The new value whether visitors are supported.
 * @returns {{
 *     type: SET_VISITORS_SUPPORTED,
 * }}
 */
export function setVisitorsSupported(value: boolean) {
    return {
        type: SET_VISITORS_SUPPORTED,
        value
    };
}

/**
 * Visitors in queue count has been updated.
 *
 * @param {number} count - The new visitors in queue count.
 * @returns {{
 *     type: UPDATE_VISITORS_IN_QUEUE_COUNT,
 * }}
 */
export function updateVisitorsInQueueCount(count: number) {
    return {
        type: UPDATE_VISITORS_IN_QUEUE_COUNT,
        count
    };
}

/**
 * Closes the overflow menu if opened.
 *
 * @private
 * @returns {void}
 */
export function goLive() {
    return (_: IStore['dispatch'], getState: IStore['getState']) => {
        const { conference } = getState()['features/base/conference'];

        conference?.getMetadataHandler().setMetadata('visitors', {
            live: true
        });
    };
}
