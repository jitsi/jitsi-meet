/*
 * Adorable Avatars service used at the end of this file is released under the
 * terms of the MIT License.
 *
 * Copyright (c) 2014 Adorable IO LLC
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* global APP */

import { getAvatarURL } from '../../../react/features/base/participants';

let users = {};

export default {
    /**
     * Sets prop in users object.
     * @param id {string} user id or undefined for the local user.
     * @param prop {string} name of the prop
     * @param val {string} value to be set
     */
    _setUserProp: function (id, prop, val) {
        // FIXME: Fixes the issue with not be able to return avatar for the
        // local user when the conference has been left. Maybe there is beter
        // way to solve it.
        if(!id || APP.conference.isLocalId(id)) {
            id = "local";
        }
        if(!val || (users[id] && users[id][prop] === val))
            return;
        if(!users[id])
            users[id] = {};
        users[id][prop] = val;
    },

    /**
     * Sets the user's avatar in the settings menu(if local user), contact list
     * and thumbnail
     * @param id id of the user
     * @param email email or nickname to be used as a hash
     */
    setUserEmail: function (id, email) {
        this._setUserProp(id, "email", email);
    },

    /**
     * Sets the user's avatar in the settings menu(if local user), contact list
     * and thumbnail
     * @param id id of the user
     * @param url the url for the avatar
     */
    setUserAvatarUrl: function (id, url) {
        this._setUserProp(id, "avatarUrl", url);
    },

    /**
     * Sets the user's avatar id.
     * @param id id of the user
     * @param avatarId an id to be used for the avatar
     */
    setUserAvatarID: function (id, avatarId) {
        this._setUserProp(id, "avatarId", avatarId);
    },

    /**
     * Returns the URL of the image for the avatar of a particular user,
     * identified by its id.
     * @param {string} userId user id
     */
    getAvatarUrl: function (userId) {
        let user;
        if (!userId || APP.conference.isLocalId(userId)) {
            user = users.local;
            userId = APP.conference.getMyUserId();
        } else {
            user = users[userId];
        }

        return getAvatarURL({
            avatarID: user ? user.avatarId : undefined,
            avatarURL: user ? user.avatarUrl : undefined,
            email: user ? user.email : undefined,
            id: userId
        });
    }
};
