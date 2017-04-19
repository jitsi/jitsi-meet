/* @flow */

import jwtDecode from 'jwt-decode';

/**
 * Represent the data parsed from the JWT token
 */
export default class TokenData {

    /**
     * Object representing callee data.
     */
    callee: Object;

    /**
     * Object representing caller data.
     */
    caller: Object;

    /**
     * Contains group. Taken from the token payload.
     */
    group: string;

    /**
     * Indicates whether the user is a guest.
     */
    isGuest: boolean;

    /**
     * Issuer claim identifies the principal that issued the JWT.
     */
    issuer: string;

    /**
     * Raw jwt token itself.
     */
    jwt: string;

    /**
     * Contains server. Taken from the token payload.
     */
    server: string;

    /**
     * Creates instance of token data.
     *
     * @param {string} jwt - The JWT token.
     */
    constructor(jwt: string) {
        const payload = jwtDecode(jwt);

        if (!payload) {
            return;
        }

        if (!payload.context) {
            return;
        }

        this.callee = payload.context.callee;
        this.caller = payload.context.user;
        this.group = payload.context.group;
        this.issuer = payload.issuer;
        this.jwt = jwt;
        this.server = payload.context.server;
    }
}
