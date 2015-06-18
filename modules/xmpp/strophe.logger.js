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
/* global Strophe */
module.exports = function () {

    Strophe.addConnectionPlugin('logger', {
        // logs raw stanzas and makes them available for download as JSON
        connection: null,
        log: [],
        init: function (conn) {
            this.connection = conn;
            this.connection.rawInput = this.log_incoming.bind(this);
            this.connection.rawOutput = this.log_outgoing.bind(this);
        },
        log_incoming: function (stanza) {
            this.log.push([new Date().getTime(), 'incoming', stanza]);
        },
        log_outgoing: function (stanza) {
            this.log.push([new Date().getTime(), 'outgoing', stanza]);
        }
    });
};