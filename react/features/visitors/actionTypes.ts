/**
 * The type of (redux) action to update visitors in queue count.
 *
 * {
 *     type: UPDATE_VISITORS_IN_QUEUE_COUNT,
 *     count: number
 * }
 */
export const UPDATE_VISITORS_IN_QUEUE_COUNT = 'UPDATE_VISITORS_IN_QUEUE_COUNT';

/**
 * The type of (redux) action which enables/disables visitors UI mode.
 *
 * {
 *     type: I_AM_VISITOR_MODE,
 *     enabled: boolean
 * }
 */
export const I_AM_VISITOR_MODE = 'I_AM_VISITOR_MODE';

/**
 * The type of (redux) action which indicates that a promotion request was received from a visitor.
 *
 * {
 *     type: VISITOR_PROMOTION_REQUEST,
 *     nick: string,
 *     from: string
 * }
 */
export const VISITOR_PROMOTION_REQUEST = 'VISITOR_PROMOTION_REQUEST';

/**
 * The type of (redux) action which indicates that a promotion response denied was received.
 *
 * {
 *     type: CLEAR_VISITOR_PROMOTION_REQUEST,
 *     request: IPromotionRequest
 * }
 */
export const CLEAR_VISITOR_PROMOTION_REQUEST = 'CLEAR_VISITOR_PROMOTION_REQUEST';

/**
 * The type of (redux) action which sets in visitor's queue.
 *
 * {
 *     type: SET_IN_VISITORS_QUEUE,
 *     value: boolean
 * }
 */
export const SET_IN_VISITORS_QUEUE = 'SET_IN_VISITORS_QUEUE';

/**
 * The type of (redux) action which sets visitor demote actor.
 *
 * {
 *     type: SET_VISITOR_DEMOTE_ACTOR,
 *     displayName: string
 * }
 */
export const SET_VISITOR_DEMOTE_ACTOR = 'SET_VISITOR_DEMOTE_ACTOR';

/**
 * The type of (redux) action which sets visitors support.
 *
 * {
 *     type: SET_VISITORS_SUPPORTED,
 *     value: string
 * }
 */
export const SET_VISITORS_SUPPORTED = 'SET_VISITORS_SUPPORTED';
