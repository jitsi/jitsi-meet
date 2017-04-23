import { Symbol } from '../base/react';

/**
 * The type of (redux) action which signals that a token data should be stored
 * in Redux store.
 *
 * {
 *     type: SET_TOKEN_DATA,
 *     tokenData: TokenData
 * }
 */
export const SET_TOKEN_DATA = Symbol('SET_TOKEN_DATA');
