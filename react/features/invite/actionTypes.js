/**
 * The type of redux action to set the {@code EventEmitter} subscriptions
 * utilized by the feature invite.
 *
 * {
 *     type: _SET_EMITTER_SUBSCRIPTIONS,
 *     emitterSubscriptions: Array|undefined
 * }
 *
 * @protected
 */
export const _SET_EMITTER_SUBSCRIPTIONS = Symbol('_SET_EMITTER_SUBSCRIPTIONS');

/**
 * The type of redux action which will add pending invite request to the redux
 * store.
 *
 * {
 *     type: ADD_PENDING_INVITE_REQUEST,
 *     request: Object
 * }
 */
export const ADD_PENDING_INVITE_REQUEST = Symbol('ADD_PENDING_INVITE_REQUEST');

/**
 * The type of the (redux) action which signals that a click/tap has been
 * performed on {@link InviteButton} and that the execution flow for
 * adding/inviting people to the current conference/meeting is to begin.
 *
 * {
 *     type: BEGIN_ADD_PEOPLE
 * }
 */
export const BEGIN_ADD_PEOPLE = Symbol('BEGIN_ADD_PEOPLE');

/**
 * The type of redux action which will remove pending invite requests from the
 * redux store.
 *
 * {
 *     type: REMOVE_PENDING_INVITE_REQUESTS
 * }
 */
export const REMOVE_PENDING_INVITE_REQUESTS
    = Symbol('REMOVE_PENDING_INVITE_REQUESTS');

/**
 * The type of redux action which sets the visibility of {@code CalleeInfo}.
 *
 * {
 *     type: SET_CALLEE_INFO_VISIBLE,
 *     calleeInfoVisible: boolean
 * }
 */
export const SET_CALLEE_INFO_VISIBLE = Symbol('SET_CALLEE_INFO_VISIBLE');

/**
 * The type of the action which signals an error occurred while requesting dial-
 * in numbers.
 *
 * {
 *     type: UPDATE_DIAL_IN_NUMBERS_FAILED,
 *     error: Object
 * }
 */
export const UPDATE_DIAL_IN_NUMBERS_FAILED
    = Symbol('UPDATE_DIAL_IN_NUMBERS_FAILED');

/**
 * The type of the action which signals a request for dial-in numbers has
 * succeeded.
 *
 * {
 *     type: UPDATE_DIAL_IN_NUMBERS_SUCCESS,
 *     conferenceID: Object,
 *     dialInNumbers: Object
 * }
 */
export const UPDATE_DIAL_IN_NUMBERS_SUCCESS
    = Symbol('UPDATE_DIAL_IN_NUMBERS_SUCCESS');
