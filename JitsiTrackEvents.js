var JitsiTrackEvents = {
    /**
     * A media track mute status was changed.
     */
    TRACK_MUTE_CHANGED: "track.trackMuteChanged",
    /**
     * Audio levels of a this track was changed.
     */
    TRACK_AUDIO_LEVEL_CHANGED: "track.audioLevelsChanged",
    /**
     * The media track was removed to the conference.
     */
    TRACK_STOPPED: "track.stopped"
};

module.exports = JitsiTrackEvents;
