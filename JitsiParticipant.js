/* global Strophe */

/**
 * Represents a participant in (a member of) a conference.
 */
function JitsiParticipant(jid, conference, displayName){
    this._jid = jid;
    this._id = Strophe.getResourceFromJid(jid);
    this._conference = conference;
    this._displayName = displayName;
    this._supportsDTMF = false;
    this._tracks = [];
    this._role = 'none';
}

/**
 * @returns {JitsiConference} The conference that this participant belongs to.
 */
JitsiParticipant.prototype.getConference = function() {
    return this._conference;
};

/**
 * @returns {Array.<JitsiTrack>} The list of media tracks for this participant.
 */
JitsiParticipant.prototype.getTracks = function() {
    return this._tracks;
};

/**
 * @returns {String} The ID of this participant.
 */
JitsiParticipant.prototype.getId = function() {
    return this._id;
};

/**
 * @returns {String} The JID of this participant.
 */
JitsiParticipant.prototype.getJid = function() {
    return this._jid;
};

/**
 * @returns {String} The human-readable display name of this participant.
 */
JitsiParticipant.prototype.getDisplayName = function() {
    return this._displayName;
};

/**
 * @returns {Boolean} Whether this participant is a moderator or not.
 */
JitsiParticipant.prototype.isModerator = function() {
    return this._role === 'moderator';
};

// Gets a link to an etherpad instance advertised by the participant?
//JitsiParticipant.prototype.getEtherpad = function() {
//
//}


/*
 * @returns {Boolean} Whether this participant has muted their audio.
 */
JitsiParticipant.prototype.isAudioMuted = function() {
    return this.getTracks().reduce(function (track, isAudioMuted) {
        return isAudioMuted && (track.isVideoTrack() || track.isMuted());
    }, true);
};

/*
 * @returns {Boolean} Whether this participant has muted their video.
 */
JitsiParticipant.prototype.isVideoMuted = function() {
    return this.getTracks().reduce(function (track, isVideoMuted) {
        return isVideoMuted && (track.isAudioTrack() || track.isMuted());
    }, true);
};

/*
 * @returns {???} The latest statistics reported by this participant
 * (i.e. info used to populate the GSM bars)
 * TODO: do we expose this or handle it internally?
 */
JitsiParticipant.prototype.getLatestStats = function() {

};

/**
 * @returns {String} The role of this participant.
 */
JitsiParticipant.prototype.getRole = function() {
    return this._role;
};

/*
 * @returns {Boolean} Whether this participant is
 * the conference focus (i.e. jicofo).
 */
JitsiParticipant.prototype.isFocus = function() {

};

/*
 * @returns {Boolean} Whether this participant is
 * a conference recorder (i.e. jirecon).
 */
JitsiParticipant.prototype.isRecorder = function() {

};

/*
 * @returns {Boolean} Whether this participant is a SIP gateway (i.e. jigasi).
 */
JitsiParticipant.prototype.isSipGateway = function() {

};

/**
 * @returns {Boolean} Whether this participant
 * is currently sharing their screen.
 */
JitsiParticipant.prototype.isScreenSharing = function() {

};

/**
 * @returns {String} The user agent of this participant
 * (i.e. browser userAgent string).
 */
JitsiParticipant.prototype.getUserAgent = function() {

};

/**
 * Kicks the participant from the conference (requires certain privileges).
 */
JitsiParticipant.prototype.kick = function() {

};

/**
 * Asks this participant to mute themselves.
 */
JitsiParticipant.prototype.askToMute = function() {

};

JitsiParticipant.prototype.supportsDTMF = function () {
    return this._supportsDTMF;
};


module.exports = JitsiParticipant;
