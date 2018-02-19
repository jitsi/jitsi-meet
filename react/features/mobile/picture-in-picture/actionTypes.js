/**
 * The type of redux action to enter (or rather initiate entering)
 * picture-in-picture.
 *
 * {
 *      type: ENTER_PICTURE_IN_PICTURE
 * }
 *
 * @public
 */
export const ENTER_PICTURE_IN_PICTURE = Symbol('ENTER_PICTURE_IN_PICTURE');

/**
 * The type of redux action to set the {@code EventEmitter} subscriptions
 * utilized by the feature picture-in-picture.
 *
 * {
 *     type: _SET_EMITTER_SUBSCRIPTIONS,
 *     emitterSubscriptions: Array|undefined
 * }
 *
 * @protected
 */
export const _SET_EMITTER_SUBSCRIPTIONS = Symbol('_SET_EMITTER_SUBSCRIPTIONS');
