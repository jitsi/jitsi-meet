// @flow

import uuid from 'uuid';

import { toURLString } from '../util';

import type JitsiConference from 'lib-jitsi-meet/JitsiConference';
import type JitsiConnection from 'lib-jitsi-meet/JitsiConnection';

/**
 * FIXME.
 */
export class Session {
    _conference: ?JitsiConference;
    _connection: ?JitsiConnection;
    conferenceFailed: boolean;
    id: string;
    locationURL: URL;
    room: string;

    /**
     * FIXME.
     *
     * @param {URL} locationURL - FIXME.
     * @param {string} room - FIXME.
     */
    constructor(locationURL: URL, room: string) {
        this.locationURL = locationURL;
        this.room = room;
        this.id = uuid.v4().toUpperCase();
        this.conferenceFailed = false;
    }

    /**
     * FIXME.
     *
     * @param {JitsiConference} [conference] - FIXME.
     */
    set conference(conference: ?JitsiConference) {
        if (this._conference && conference && this._conference !== conference) {
            throw new Error(`Attempt to reassign conference to ${this.toString()}`);
        }

        this._conference = conference;
    }

    /**
     * FIXME.
     *
     * @returns {?JitsiConference}
     */
    get conference(): ?JitsiConference {
        return this._conference;
    }

    /**
     * FIXME.
     *
     * @param {JitsiConnection} [connection] - FIXME.
     */
    set connection(connection: ?JitsiConnection) {
        if (this._connection && connection && this._connection !== connection) {
            throw new Error(`Attempt to reassign connection to ${this.toString()}`);
        }

        this._connection = connection;
    }

    /**
     * FIXME.
     *
     * @returns {?JitsiConnection}
     */
    get connection() {
        return this._connection;
    }

    /**
     * FIXME.
     *
     * @returns {string}
     */
    toString() {
        return `Session[id=${this.id}, URL: ${toURLString(this.locationURL)} room: ${this.room}]`;
    }
}
