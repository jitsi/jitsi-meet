/**
 * Enumeration with the events for the conference.
 * @type {{string: string}}
 */
var ConferenceEvents = {
    /**
     * New media stream was added to the conference.
     */
    STREAM_ADDED: "conference.streamAdded",
    /**
     * The media stream was removed to the conference.
     */
    STREAM_REMOVED: "conference.streamRemoved",
    /**
     * The active speaker was changed.
     */
    ACTIVE_SPEAKER_CHANGED: "conference.activeSpeaker",
    /**
     * A new user joinned the conference.
     */
    USER_JOINED: "conference.userJoined",
    /**
     * A user has left the conference.
     */
    USER_LEFT: "conference.userLeft",
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
    LAST_N_CHANGED: "conference.lastNChanged",
    /**
     * Stream was muted.
     */
    STREAM_MUTED: "conference.streamMuted",
    /**
     * Stream was unmuted.
     */
    STREAM_UNMUTED: "conference.streamUnmuted",
    /**
     * Audio levels of a stream was changed.
     */
    STREAM_AUDIO_LEVEL_CHANGED: "conference.audioLevelsChanged",
    /**
     * Indicates that the connection to the conference has been interrupted for some reason.
     */
    CONNECTION_INTERRUPTED: "conference.connecionInterrupted",
    /**
     * Indicates that the connection to the conference has been restored.
     */
    CONNECTION_RESTORED: "conference.connecionRestored"
};

module.exports = ConferenceEvents;