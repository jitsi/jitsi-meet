/**
 * The type of (redux) action to update visitors count.
 *
 * {
 *     type: UPDATE_VISITORS_COUNT,
 *     count: number
 * }
 */
export const UPDATE_VISITORS_COUNT = 'UPDATE_VISITORS_COUNT';

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
