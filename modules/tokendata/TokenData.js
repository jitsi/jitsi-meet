/* global  getConfigParamsFromUrl, config */

/**
 * Parses and handles JWT tokens. Sets config.token.
 */

import * as jws from "jws";

/**
 * Get the JWT token from the URL.
 */
let params = getConfigParamsFromUrl("search", true);
let jwt = params.jwt;

/**
 * Implements a user of conference.
 */
class User {
    /**
     * @param name {string} the name of the user.
     * @param email {string} the email of the user.
     * @param avatarUrl {string} the URL for the avatar of the user.
     */
    constructor(name, email, avatarUrl) {
        this._name = name;
        this._email = email;
        this._avatarUrl = avatarUrl;
    }

    /**
     * GETERS START.
     */

    /**
     * Returns the name property
     */
    getName() {
        return this._name;
    }

    /**
     * Returns the email property
     */
    getEmail() {
        return this._email;
    }

    /**
     * Returns the URL of the avatar
     */
    getAvatarUrl() {
        return this._avatarUrl;
    }

    /**
     * GETERS END.
     */
}

/**
 * Represent the data parsed from the JWT token
 */
class TokenData{
    /**
     * @param {string} the JWT token
     */
    constructor(jwt) {
        this.isGuest = true;
        if(!jwt)
            return;

        this.isGuest = config.enableUserRolesBasedOnToken !== true;

        this.jwt = jwt;

        //External API settings
        this.externalAPISettings = {
            forceEnable: true,
            enabledEvents: ["video-conference-joined", "video-conference-left",
                "video-ready-to-close"]
        };
        this._decode();
        // Use JWT param as token if there is not other token set and if the
        // iss field is not anonymous. If you want to pass data with JWT token
        // but you don't want to pass the JWT token for verification the iss
        // field should be set to "anonymous"
        if(!config.token && this.payload && this.payload.iss !== "anonymous")
            config.token = jwt;
    }

    /**
     * Decodes the JWT token and sets the decoded data to properties.
     */
    _decode() {
        this.decodedJWT = jws.decode(jwt);
        if(!this.decodedJWT || !this.decodedJWT.payload)
            return;
        this.payload = this.decodedJWT.payload;
        if(!this.payload.context)
            return;
        this.server = this.payload.context.server;
        this.group = this.payload.context.group;
        let callerData = this.payload.context.user;
        let calleeData = this.payload.context.callee;
        if(callerData)
            this.caller = new User(callerData.name, callerData.email,
                callerData.avatarUrl);
        if(calleeData)
            this.callee = new User(calleeData.name, calleeData.email,
                calleeData.avatarUrl);
    }
}

/**
 * Stores the TokenData instance.
 */
let data = null;

/**
 * Returns the data variable. Creates new TokenData instance if <tt>data</tt>
 * variable is null.
 */
export default function getTokenData() {
    if(!data)
        data = new TokenData(jwt);
    return data;
}
