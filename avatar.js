var Avatar = (function(my) {
    var users = {};
    var activeSpeakerJid;
    /**
     * Sets the user's avatar in the settings menu(if local user), contact list
     * and thumbnail
     * @param jid jid of the user
     * @param id email or userID to be used as a hash
     */
    my.setUserAvatar = function(jid, id) {
        if(id) {
            if(users[jid] === id) {
                return;
            }
            users[jid] = id;
        }
        var url = getGravatarUrl(users[jid] || jid);
        var resourceJid = Strophe.getResourceFromJid(jid);
        var thumbnail = $('#participant_' + resourceJid);
        var avatar = $('#avatar_' + resourceJid);

        // set the avatar in the settings menu if it is local user and get the
        // local video container
        if(jid === connection.emuc.myroomjid) {
            $('#avatar').get(0).src = url;
            thumbnail = $('#localVideoContainer');
        }

        // set the avatar in the contact list
        var contact = $('#' + resourceJid + '>img');
        if(contact && contact.length > 0) {
            contact.get(0).src = url;
        }

        // set the avatar in the thumbnail
        if(avatar && avatar.length > 0) {
            avatar[0].src = url;
        } else {
            if (thumbnail && thumbnail.length > 0) {
                avatar = document.createElement('img');
                avatar.id = 'avatar_' + resourceJid;
                avatar.className = 'userAvatar';
                avatar.src = url;
                thumbnail.append(avatar);
            }
        }

        //if the user is the current active speaker - update the active speaker
        // avatar
        if(jid === activeSpeakerJid) {
            Avatar.updateActiveSpeakerAvatarSrc(jid);
        }
    };

    /**
     * Hides or shows the user's avatar
     * @param jid jid of the user
     * @param show whether we should show the avatar or not
     * video because there is no dominant speaker and no focused speaker
     */
    my.showUserAvatar = function(jid, show) {
        if(users[jid]) {
            var resourceJid = Strophe.getResourceFromJid(jid);
            var video = $('#participant_' + resourceJid + '>video');
            var avatar = $('#avatar_' + resourceJid);

            if(jid === connection.emuc.myroomjid) {
                video = $('#localVideoWrapper>video');
            }
            if(show === undefined || show === null) {
                show = isUserMuted(jid);
            }

            //if the user is the currently focused, the dominant speaker or if
            //there is no focused and no dominant speaker
            if (activeSpeakerJid === jid) {
                setVisibility($("#largeVideo"), !show);
                setVisibility($('#activeSpeakerAvatar'), show);
                setVisibility(avatar, false);
                setVisibility(video, false);
            } else {
                if (video && video.length > 0) {
                    setVisibility(video, !show);
                    setVisibility(avatar, show);
                }
            }
        }
    };

    /**
     * Updates the src of the active speaker avatar
     * @param jid of the current active speaker
     */
    my.updateActiveSpeakerAvatarSrc = function(jid) {
        if(!jid) {
            if (focusedVideoSrc) {
                jid = getJidFromVideoSrc(focusedVideoSrc);
            } else {
                jid = connection.emuc.findJidFromResource(
                    VideoLayout.getDominantSpeakerResourceJid());
            }
        }
        var avatar = $("#activeSpeakerAvatar")[0];
        var url = getGravatarUrl(users[jid],
            interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE);
        if(jid === activeSpeakerJid && avatar.src === url) {
            return;
        }
        activeSpeakerJid = jid;
        var isMuted = isUserMuted(jid);
        if(jid && isMuted !== null) {
            avatar.src = url;
            setVisibility($("#largeVideo"), !isMuted);
            Avatar.showUserAvatar(jid, isMuted);
        }
    };

    function setVisibility(selector, show) {
        if (selector && selector.length > 0) {
            selector.css("visibility", show ? "visible" : "hidden");
        }
    }

    function isUserMuted(jid) {
        // XXX(gp) we may want to rename this method to something like
        // isUserStreaming, for example.
        if (jid && jid != connection.emuc.myroomjid) {
            var resource = Strophe.getResourceFromJid(jid);
            if (!VideoLayout.isInLastN(resource)) {
                return true;
            }
        }

        if (!mediaStreams[jid] || !mediaStreams[jid][MediaStream.VIDEO_TYPE]) {
            return null;
        }
        return mediaStreams[jid][MediaStream.VIDEO_TYPE].muted;
    }

    function getGravatarUrl(id, size) {
        if(id === connection.emuc.myroomjid || !id) {
            id = SettingsMenu.getUID();
        }
        return 'https://www.gravatar.com/avatar/' +
            MD5.hexdigest(id.trim().toLowerCase()) +
            "?d=retro&size=" + (size || "30");
    }

    return my;
}(Avatar || {}));
