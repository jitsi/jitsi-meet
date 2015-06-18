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
var XMPPEvents = {
    CONNECTION_FAILED: "xmpp.connection.failed",
    CONFERENCE_CREATED: "xmpp.conferenceCreated.jingle",
    CALL_TERMINATED: "xmpp.callterminated.jingle",
    CALL_INCOMING: "xmpp.callincoming.jingle",
    DISPOSE_CONFERENCE: "xmpp.dispose_conference",
    GRACEFUL_SHUTDOWN: "xmpp.graceful_shutdown",
    KICKED: "xmpp.kicked",
    BRIDGE_DOWN: "xmpp.bridge_down",
    USER_ID_CHANGED: "xmpp.user_id_changed",
    STREAMS_CHANGED: "xmpp.streams_changed",
    // We joined the MUC
    MUC_JOINED: "xmpp.muc_joined",
    // A member joined the MUC
    MUC_MEMBER_JOINED: "xmpp.muc_member_joined",
    // A member left the MUC
    MUC_MEMBER_LEFT: "xmpp.muc_member_left",
    MUC_ROLE_CHANGED: "xmpp.muc_role_changed",
    MUC_DESTROYED: "xmpp.muc_destroyed",
    DISPLAY_NAME_CHANGED: "xmpp.display_name_changed",
    REMOTE_STATS: "xmpp.remote_stats",
    LOCAL_ROLE_CHANGED: "xmpp.localrole_changed",
    PRESENCE_STATUS: "xmpp.presence_status",
    RESERVATION_ERROR: "xmpp.room_reservation_error",
    SUBJECT_CHANGED: "xmpp.subject_changed",
    MESSAGE_RECEIVED: "xmpp.message_received",
    SENDING_CHAT_MESSAGE: "xmpp.sending_chat_message",
    PASSWORD_REQUIRED: "xmpp.password_required",
    AUTHENTICATION_REQUIRED: "xmpp.authentication_required",
    CHAT_ERROR_RECEIVED: "xmpp.chat_error_received",
    ETHERPAD: "xmpp.etherpad",
    DEVICE_AVAILABLE: "xmpp.device_available",
    START_MUTED: "xmpp.start_muted"
};
module.exports = XMPPEvents;