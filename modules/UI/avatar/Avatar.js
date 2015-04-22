var Settings = require("../../settings/Settings");
var MediaStreamType = require("../../../service/RTC/MediaStreamTypes");

var users = {};
var activeSpeakerJid;

function setVisibility(selector, show) {
    if (selector && selector.length > 0) {
        selector.css("visibility", show ? "visible" : "hidden");
    }
}

function isUserMuted(jid) {
    // XXX(gp) we may want to rename this method to something like
    // isUserStreaming, for example.
    if (jid && jid != APP.xmpp.myJid()) {
        var resource = Strophe.getResourceFromJid(jid);
        if (!require("../videolayout/VideoLayout").isInLastN(resource)) {
            return true;
        }
    }

    if(jid && jid == APP.xmpp.myJid())
    {
        var localVideo = APP.RTC.localVideo;
        return (!localVideo || localVideo.isMuted());
    }

    if (!APP.RTC.remoteStreams[jid] || !APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE]) {
        return null;
    }
    return APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE].muted;
}

function getGravatarUrl(id, size) {
    if(id === APP.xmpp.myJid() || !id) {
        id = Settings.getSettings().uid;
    }
    return 'https://www.gravatar.com/avatar/' +
        MD5.hexdigest(id.trim().toLowerCase()) +
        "?d=wavatar&size=" + (size || "30");
}

var Avatar = {

    /**
     * Sets the user's avatar in the settings menu(if local user), contact list
     * and thumbnail
     * @param jid jid of the user
     * @param id email or userID to be used as a hash
     */
    setUserAvatar: function (jid, id) {
        if (id) {
            if (users[jid] === id) {
                return;
            }
            users[jid] = id;
        }
        var thumbUrl = getGravatarUrl(users[jid] || jid, 100);
        var contactListUrl = getGravatarUrl(users[jid] || jid);
        var resourceJid = Strophe.getResourceFromJid(jid);
        var thumbnail = $('#participant_' + resourceJid);
        var avatar = $('#avatar_' + resourceJid);

        // set the avatar in the settings menu if it is local user and get the
        // local video container
        if (jid === APP.xmpp.myJid()) {
            $('#avatar').get(0).src = thumbUrl;
            thumbnail = $('#localVideoContainer');
        }

        // set the avatar in the contact list
        var contact = $('#' + resourceJid + '>img');
        if (contact && contact.length > 0) {
            contact.get(0).src = contactListUrl;
        }

        // set the avatar in the thumbnail
        if (avatar && avatar.length > 0) {
            avatar[0].src = thumbUrl;
        } else {
            if (thumbnail && thumbnail.length > 0) {
                avatar = document.createElement('img');
                avatar.id = 'avatar_' + resourceJid;
                avatar.className = 'userAvatar';
                avatar.src = thumbUrl;
                thumbnail.append(avatar);
            }
        }

        //if the user is the current active speaker - update the active speaker
        // avatar
        if (jid === activeSpeakerJid) {
            this.updateActiveSpeakerAvatarSrc(jid);
        }
    },

    /**
     * Hides or shows the user's avatar
     * @param jid jid of the user
     * @param show whether we should show the avatar or not
     * video because there is no dominant speaker and no focused speaker
     */
    showUserAvatar: function (jid, show) {
        if (users[jid]) {
            var resourceJid = Strophe.getResourceFromJid(jid);
            var video = $('#participant_' + resourceJid + '>video');
            var avatar = $('#avatar_' + resourceJid);

            if (jid === APP.xmpp.myJid()) {
                video = $('#localVideoWrapper>video');
            }
            if (show === undefined || show === null) {
                show = isUserMuted(jid);
            }

            //if the user is the currently focused, the dominant speaker or if
            //there is no focused and no dominant speaker and the large video is
            //currently shown
            if (activeSpeakerJid === jid && require("../videolayout/VideoLayout").isLargeVideoOnTop()) {
                setVisibility($("#largeVideo"), !show);
                setVisibility($('#activeSpeaker'), show);
                setVisibility(avatar, false);
                setVisibility(video, false);
            } else {
                if (video && video.length > 0) {
                    setVisibility(video, !show);
                }
                setVisibility(avatar, show);

            }
        }
    },

    /**
     * Updates the src of the active speaker avatar
     * @param jid of the current active speaker
     */
    updateActiveSpeakerAvatarSrc: function (jid) {
        if (!jid) {
            jid = APP.xmpp.findJidFromResource(
                require("../videolayout/VideoLayout").getLargeVideoState().userResourceJid);
        }
        var avatar = $("#activeSpeakerAvatar")[0];
        var url = getGravatarUrl(users[jid],
            interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE);
        if (jid === activeSpeakerJid && avatar.src === url) {
            return;
        }
        activeSpeakerJid = jid;
        var isMuted = isUserMuted(jid);
        if (jid && isMuted !== null) {
            avatar.src = url;
            setVisibility($("#largeVideo"), !isMuted);
            Avatar.showUserAvatar(jid, isMuted);
        }
    }

};


module.exports = Avatar;