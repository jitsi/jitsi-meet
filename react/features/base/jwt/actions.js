// @flow

import { SET_JWT } from './actionTypes';

/**
 * Stores a specific JSON Web Token (JWT) into the redux store.
 *
 * @param {string} [jwt] - The JSON Web Token (JWT) to store.
 * @returns {{
 *     type: SET_TOKEN_DATA,
 *     jwt: (string|undefined)
 * }}
 */
export function setJWT(jwt: ?string) {
    return {
        type: SET_JWT,
        //video
        // jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6InBvbHl0b2siLCJzdWIiOiJwb2x5dG9rIiwicm9vbSI6IioiLCJzZWxmaWUiOiJWIiwibmJmIjoxNjYyMDk1MTQ2LCJleHAiOjE2NjIwOTg4NjZ9.ZmoPW-s44QaFV7LfezThl9NClDY3xFEf5IMlBb0nUjw'
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6InBvbHl0b2siLCJzdWIiOiJwb2x5dG9rIiwicm9vbSI6IioiLCJzZWxmaWUiOiJBIiwibmJmIjoxNjYyMDk1MTQ2LCJleHAiOjE2NjIwOTg4NjZ9.pFpcOG0DiSckpve-DSnrn9-PMld5iaTXATWllJoqESc'
    };
}
