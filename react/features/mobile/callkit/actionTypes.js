/**
 * The type of redux action to set CallKit's and ConnectionService's event
 * subscriptions.
 *
 * {
 *     type: __SET_CALL_INTEGRATION_SUBSCRIPTIONS,
 *     subscriptions: Array|undefined
 * }
 *
 * @protected
 */
export const _SET_CALL_INTEGRATION_SUBSCRIPTIONS
    = Symbol('_SET_CALL_INTEGRATION_SUBSCRIPTIONS');
