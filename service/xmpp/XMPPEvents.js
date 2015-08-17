var XMPPEvents = {
    // Designates an event indicating that the connection to the XMPP server
    // failed.
    CONNECTION_FAILED: "xmpp.connection.failed",
    // Designates an event indicating that the media (ICE) connection was
    // interrupted. This should go to the RTC module.
    CONNECTION_INTERRUPTED: "xmpp.connection.interrupted",
    // Designates an event indicating that the media (ICE) connection was
    // restored. This should go to the RTC module.
    CONNECTION_RESTORED: "xmpp.connection.restored",
    // Designates an event indicating that an offer (e.g. Jingle
    // session-initiate) was received.
    CALL_INCOMING: "xmpp.callincoming.jingle",
    // Designates an event indicating that we were kicked from the XMPP MUC.
    KICKED: "xmpp.kicked",
    // Designates an event indicating that the userID for a specific JID has
    // changed.
    USER_ID_CHANGED: "xmpp.user_id_changed",
    // Designates an event indicating that we have joined the XMPP MUC.
    MUC_JOINED: "xmpp.muc_joined",
    // Designates an event indicating that a participant joined the XMPP MUC.
    MUC_MEMBER_JOINED: "xmpp.muc_member_joined",
    // Designates an event indicating that a participant left the XMPP MUC.
    MUC_MEMBER_LEFT: "xmpp.muc_member_left",
    // Designates an event indicating that the MUC role of a participant has
    // changed.
    MUC_ROLE_CHANGED: "xmpp.muc_role_changed",
    // Designates an event indicating that the XMPP MUC was destroyed.
    MUC_DESTROYED: "xmpp.muc_destroyed",
    // Designates an event indicating that the display name of a participant
    // has changed.
    DISPLAY_NAME_CHANGED: "xmpp.display_name_changed",
    // Designates an event indicating that we received statistics from a
    // participant in the MUC.
    REMOTE_STATS: "xmpp.remote_stats",
    // Designates an event indicating that our role in the XMPP MUC has changed.
    LOCAL_ROLE_CHANGED: "xmpp.localrole_changed",
    // Designates an event indicating that the subject of the XMPP MUC has
    // changed.
    SUBJECT_CHANGED: "xmpp.subject_changed",
    // Designates an event indicating that an XMPP message in the MUC was
    // received.
    MESSAGE_RECEIVED: "xmpp.message_received",
    // Designates an event indicating that we sent an XMPP message to the MUC.
    SENDING_CHAT_MESSAGE: "xmpp.sending_chat_message",
    // Designates an event indicating that the video type (e.g. 'camera' or
    // 'screen') for a participant has changed.
    PARTICIPANT_VIDEO_TYPE_CHANGED: "xmpp.video_type",
    // Designates an event indicating that a participant in the XMPP MUC has
    // advertised that they have audio muted (or unmuted).
    PARTICIPANT_AUDIO_MUTED: "xmpp.audio_muted",
    // Designates an event indicating that a participant in the XMPP MUC has
    // advertised that they have video muted (or unmuted).
    PARTICIPANT_VIDEO_MUTED: "xmpp.video_muted",
    // Designates an event indicating that the focus has asked us to mute our
    // audio.
    AUDIO_MUTED_BY_FOCUS: "xmpp.audio_muted_by_focus",
    // Designates an event indicating that a moderator in the room changed the
    // "start muted" settings for the conference.
    START_MUTED_SETTING_CHANGED: "xmpp.start_muted_setting_changed",
    // Designates an event indicating that we should join the conference with
    // audio and/or video muted.
    START_MUTED_FROM_FOCUS: "xmpp.start_muted_from_focus",


    PEERCONNECTION_READY: "xmpp.peerconnection_ready",
    CONFERENCE_SETUP_FAILED: "xmpp.conference_setup_failed",
    PASSWORD_REQUIRED: "xmpp.password_required",
    AUTHENTICATION_REQUIRED: "xmpp.authentication_required",
    CHAT_ERROR_RECEIVED: "xmpp.chat_error_received",
    ETHERPAD: "xmpp.etherpad",
    DEVICE_AVAILABLE: "xmpp.device_available",
    BRIDGE_DOWN: "xmpp.bridge_down",
    PRESENCE_STATUS: "xmpp.presence_status",
    RESERVATION_ERROR: "xmpp.room_reservation_error",
    DISPOSE_CONFERENCE: "xmpp.dispose_conference",
    GRACEFUL_SHUTDOWN: "xmpp.graceful_shutdown",
    // TODO: only used in a hack, should probably be removed.
    SET_LOCAL_DESCRIPTION_ERROR: 'xmpp.set_local_description_error',
    // TODO: only used in a hack, should probably be removed.
    SET_REMOTE_DESCRIPTION_ERROR: 'xmpp.set_remote_description_error',
    // TODO: only used in a hack, should probably be removed.
    CREATE_ANSWER_ERROR: 'xmpp.create_answer_error',
    JINGLE_FATAL_ERROR: 'xmpp.jingle_fatal_error',
    PROMPT_FOR_LOGIN: 'xmpp.prompt_for_login',
    FOCUS_DISCONNECTED: 'xmpp.focus_disconnected',
    ROOM_JOIN_ERROR: 'xmpp.room_join_error',
    ROOM_CONNECT_ERROR: 'xmpp.room_connect_error',
    // xmpp is connected and obtained user media
    READY_TO_JOIN: 'xmpp.ready_to_join',
    FOCUS_LEFT: "xmpp.focus_left",
    REMOTE_STREAM_RECEIVED: "xmpp.remote_stream_received"
};
module.exports = XMPPEvents;