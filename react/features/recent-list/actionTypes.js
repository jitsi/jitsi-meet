// @flow

/**
 * Action type to signal a new addition to the list.
 *
 * {
 *     type: _STORE_CURRENT_CONFERENCE,
 *     locationURL: Object
 * }
 *
 * @protected
 */
export const _STORE_CURRENT_CONFERENCE = Symbol('_STORE_CURRENT_CONFERENCE');

/**
 * Action type to signal that a new conference duration info is available.
 *
 * {
 *     type: _UPDATE_CONFERENCE_DURATION,
 *     locationURL: Object
 * }
 *
 * @protected
 */
export const _UPDATE_CONFERENCE_DURATION
    = Symbol('_UPDATE_CONFERENCE_DURATION');
