/**
 * Enumeration with the events for the conference.
 * @type {{string: string}}
 */
var JitsiConferenceEvents = {
    /**
     * A new media track was added to the conference.
     */
    TRACK_ADDED: "conference.trackAdded",
    /**
     * The media track was removed from the conference.
     */
    TRACK_REMOVED: "conference.trackRemoved",
    /**
     * The dominant speaker was changed.
     */
    DOMINANT_SPEAKER_CHANGED: "conference.dominantSpeaker",
    /**
     * A new user joinned the conference.
     */
    USER_JOINED: "conference.userJoined",
    /**
     * A user has left the conference.
     */
    USER_LEFT: "conference.userLeft",
    /**
     * User role changed.
     */
    USER_ROLE_CHANGED: "conference.roleChanged",
    /**
     * New text message was received.
     */
    MESSAGE_RECEIVED: "conference.messageReceived",
    /**
     * A user has changed it display name
     */
    DISPLAY_NAME_CHANGED: "conference.displayNameChanged",
    /**
     * A participant avatar has changed.
     */
    AVATAR_CHANGED: "conference.avatarChanged",
    /**
     * New connection statistics are received.
     */
    CONNECTION_STATS_RECEIVED: "conference.connectionStatsReceived",
    /**
     * The Last N set is changed.
     */
    LAST_N_ENDPOINTS_CHANGED: "conference.lastNEndpointsChanged",
    /**
     * You are included / excluded in somebody's last N set
     */
    IN_LAST_N_CHANGED: "conference.lastNEndpointsChanged",
    /**
     * A media track ( attached to the conference) mute status was changed.
     */
    TRACK_MUTE_CHANGED: "conference.trackMuteChanged",
    /**
     * Audio levels of a media track ( attached to the conference) was changed.
     */
    TRACK_AUDIO_LEVEL_CHANGED: "conference.audioLevelsChanged",
    /**
     * Indicates that the connection to the conference has been interrupted
     * for some reason.
     */
    CONNECTION_INTERRUPTED: "conference.connectionInterrupted",
    /**
     * Indicates that the connection to the conference has been restored.
     */
    CONNECTION_RESTORED: "conference.connectionRestored",
    /**
     * Indicates that conference failed.
     */
    CONFERENCE_FAILED: "conference.failed",
    /**
     * Indicates that conference has been joined.
     */
    CONFERENCE_JOINED: "conference.joined",
    /**
     * Indicates that conference has been left.
     */
    CONFERENCE_LEFT: "conference.left",
    /**
     * You are kicked from the conference.
     */
    KICKED: "conferenece.kicked",
    /**
     * Indicates that start muted settings changed.
     */
    START_MUTED: "conference.start_muted",
    /**
     * Indicates that DTMF support changed.
     */
    DTMF_SUPPORT_CHANGED: "conference.dtmfSupportChanged",
    /**
     * Indicates that recording state changed.
     */
    RECORDING_STATE_CHANGED: "conference.recordingStateChanged",
    /**
     * Indicates that phone number changed.
     */
    PHONE_NUMBER_CHANGED: "conference.phoneNumberChanged"
};

module.exports = JitsiConferenceEvents;
