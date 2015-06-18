/*
 * Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var UIEvents = require("../../../service/UI/UIEvents");

var nickname = null;
var eventEmitter = null;

var NickanameHandler = {
    init: function (emitter) {
        eventEmitter = emitter;
        var storedDisplayName = window.localStorage.displayname;
        if (storedDisplayName) {
            nickname = storedDisplayName;
        }
    },
    setNickname: function (newNickname) {
        if (!newNickname || nickname === newNickname)
            return;

        nickname = newNickname;
        window.localStorage.displayname = nickname;
        eventEmitter.emit(UIEvents.NICKNAME_CHANGED, newNickname);
    },
    getNickname: function () {
        return nickname;
    },
    addListener: function (type, listener) {
        eventEmitter.on(type, listener);
    }
};

module.exports = NickanameHandler;