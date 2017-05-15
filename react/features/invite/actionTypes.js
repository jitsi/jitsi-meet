import { Symbol } from '../base/react';

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
 * The type of the action which signals a request for dial-in numbers has been
 * started.
 *
 * {
 *     type: UPDATE_DIAL_IN_NUMBERS_REQUEST
 * }
 */
export const UPDATE_DIAL_IN_NUMBERS_REQUEST
    = Symbol('UPDATE_DIAL_IN_NUMBERS_REQUEST');

/**
 * The type of the action which signals a request for dial-in numbers has
 * succeeded.
 *
 * {
 *     type: UPDATE_DIAL_IN_NUMBERS_SUCCESS,
 *     response: Object
 * }
 */
export const UPDATE_DIAL_IN_NUMBERS_SUCCESS
    = Symbol('UPDATE_DIAL_IN_NUMBERS_SUCCESS');


