var XMPPEvents = {
    CONNECTION_FAILED: "xmpp.connection.failed",
    // Indicates an interrupted connection event.
    CONNECTION_INTERRUPTED: "xmpp.connection.interrupted",
    // Indicates a restored connection event.
    CONNECTION_RESTORED: "xmpp.connection.restored",
    CONFERENCE_CREATED: "xmpp.conferenceCreated.jingle",
    CALL_INCOMING: "xmpp.callincoming.jingle",
    DISPOSE_CONFERENCE: "xmpp.dispose_conference",
    GRACEFUL_SHUTDOWN: "xmpp.graceful_shutdown",
    KICKED: "xmpp.kicked",
    BRIDGE_DOWN: "xmpp.bridge_down",
    USER_ID_CHANGED: "xmpp.user_id_changed",
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
    PEERCONNECTION_READY: "xmpp.peerconnection_ready",
    CONFERENCE_SETUP_FAILED: "xmpp.conference_setup_failed",
    AUDIO_MUTED: "xmpp.audio_muted",
    VIDEO_MUTED: "xmpp.video_muted",
    AUDIO_MUTED_BY_FOCUS: "xmpp.audio_muted_by_focus",
    START_MUTED_SETTING_CHANGED: "xmpp.start_muted_setting_changed",
    START_MUTED_FROM_FOCUS: "xmpp.start_muted_from_focus",
    SET_LOCAL_DESCRIPTION_ERROR: 'xmpp.set_local_description_error',
    SET_REMOTE_DESCRIPTION_ERROR: 'xmpp.set_remote_description_error',
    CREATE_ANSWER_ERROR: 'xmpp.create_answer_error',
    JINGLE_FATAL_ERROR: 'xmpp.jingle_fatal_error',
    PROMPT_FOR_LOGIN: 'xmpp.prompt_for_login',
    FOCUS_DISCONNECTED: 'xmpp.focus_disconnected',
    ROOM_JOIN_ERROR: 'xmpp.room_join_error',
    ROOM_CONNECT_ERROR: 'xmpp.room_connect_error',
    // xmpp is connected and obtained user media
    READY_TO_JOIN: 'xmpp.ready_to_join'
};
module.exports = XMPPEvents;