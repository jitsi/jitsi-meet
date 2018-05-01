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
