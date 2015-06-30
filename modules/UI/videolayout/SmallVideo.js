var UIUtil = require("../util/UIUtil");
var LargeVideo = require("./LargeVideo");

function SmallVideo(){
    this.isMuted = false;
    this.hasAvatar = false;
}

function setVisibility(selector, show) {
    if (selector && selector.length > 0) {
        selector.css("visibility", show ? "visible" : "hidden");
    }
}

SmallVideo.prototype.showDisplayName = function(isShow) {
    var nameSpan = $('#' + this.videoSpanId + '>span.displayname').get(0);
    if (isShow) {
        if (nameSpan && nameSpan.innerHTML && nameSpan.innerHTML.length)
            nameSpan.setAttribute("style", "display:inline-block;");
    }
    else {
        if (nameSpan)
            nameSpan.setAttribute("style", "display:none;");
    }
};

SmallVideo.prototype.setDeviceAvailabilityIcons = function (devices) {
    if(!this.container)
        return;

    $("#" + this.videoSpanId + " > .noMic").remove();
    $("#" + this.videoSpanId + " > .noVideo").remove();
    if(!devices.audio)
    {
        this.container.appendChild(
            document.createElement("div")).setAttribute("class","noMic");
    }

    if(!devices.video)
    {
        this.container.appendChild(
            document.createElement("div")).setAttribute("class","noVideo");
    }

    if(!devices.audio && !devices.video)
    {
        $("#" + this.videoSpanId + " > .noMic").css("background-position", "75%");
        $("#" + this.videoSpanId + " > .noVideo").css("background-position", "25%");
        $("#" + this.videoSpanId + " > .noVideo").css("background-color", "transparent");
    }
}

/**
 * Shows the presence status message for the given video.
 */
SmallVideo.prototype.setPresenceStatus = function (statusMsg) {

    if (!this.container) {
        // No container
        return;
    }

    var statusSpan = $('#' + this.videoSpanId + '>span.status');
    if (!statusSpan.length) {
        //Add status span
        statusSpan = document.createElement('span');
        statusSpan.className = 'status';
        statusSpan.id = this.videoSpanId + '_status';
        $('#' + this.videoSpanId)[0].appendChild(statusSpan);

        statusSpan = $('#' + this.videoSpanId + '>span.status');
    }

    // Display status
    if (statusMsg && statusMsg.length) {
        $('#' + this.videoSpanId + '_status').text(statusMsg);
        statusSpan.get(0).setAttribute("style", "display:inline-block;");
    }
    else {
        // Hide
        statusSpan.get(0).setAttribute("style", "display:none;");
    }
};

/**
 * Creates an audio or video stream element.
 */

SmallVideo.createStreamElement = function (sid, stream) {
    var isVideo = stream.getVideoTracks().length > 0;

    var element = isVideo
        ? document.createElement('video')
        : document.createElement('audio');
    var id = (isVideo ? 'remoteVideo_' : 'remoteAudio_')
        + sid + '_' + APP.RTC.getStreamID(stream);

    element.id = id;
    element.autoplay = true;
    element.oncontextmenu = function () { return false; };

    return element;
};

/**
 * Updates the data for the indicator
 * @param id the id of the indicator
 * @param percent the percent for connection quality
 * @param object the data
 */
SmallVideo.prototype.updateStatsIndicator = function (percent, object) {
    if(this.connectionIndicator)
        this.connectionIndicator.updateConnectionQuality(percent, object);
}

SmallVideo.prototype.hideIndicator = function () {
    if(this.connectionIndicator)
        this.connectionIndicator.hideIndicator();
}


/**
 * Shows audio muted indicator over small videos.
 * @param {string} isMuted
 */
SmallVideo.prototype.showAudioIndicator = function(isMuted) {
    var audioMutedSpan = $('#' + this.videoSpanId + '>span.audioMuted');

    if (!isMuted) {
        if (audioMutedSpan.length > 0) {
            audioMutedSpan.popover('hide');
            audioMutedSpan.remove();
        }
    }
    else {
        if(audioMutedSpan.length == 0 ) {
            audioMutedSpan = document.createElement('span');
            audioMutedSpan.className = 'audioMuted';
            UIUtil.setTooltip(audioMutedSpan,
                "videothumbnail.mute",
                "top");

            this.container.appendChild(audioMutedSpan);
            APP.translation.translateElement($('#' + this.videoSpanId + " > span"));
            var mutedIndicator = document.createElement('i');
            mutedIndicator.className = 'icon-mic-disabled';
            audioMutedSpan.appendChild(mutedIndicator);

        }
        this.updateIconPositions();
    }
    this.isMuted = isMuted;
};

/**
 * Shows video muted indicator over small videos.
 */
SmallVideo.prototype.showVideoIndicator = function(isMuted) {
    this.showAvatar(isMuted);

    var videoMutedSpan = $('#' + this.videoSpanId + '>span.videoMuted');

    if (isMuted === false) {
        if (videoMutedSpan.length > 0) {
            videoMutedSpan.remove();
        }
    }
    else {
        if(videoMutedSpan.length == 0) {
            videoMutedSpan = document.createElement('span');
            videoMutedSpan.className = 'videoMuted';

            this.container.appendChild(videoMutedSpan);

            var mutedIndicator = document.createElement('i');
            mutedIndicator.className = 'icon-camera-disabled';
            UIUtil.setTooltip(mutedIndicator,
                "videothumbnail.videomute",
                "top");
            videoMutedSpan.appendChild(mutedIndicator);
            //translate texts for muted indicator
            APP.translation.translateElement($('#' + this.videoSpanId  + " > span > i"));
        }

        this.updateIconPositions();

    }
};

SmallVideo.prototype.enableDominantSpeaker = function (isEnable)
{
    var displayName = this.resourceJid;
    var nameSpan = $('#' + this.videoSpanId + '>span.displayname');
    if (nameSpan.length > 0)
        displayName = nameSpan.html();

    console.log("UI enable dominant speaker",
        displayName,
        this.resourceJid,
        isEnable);


    if (!this.container) {
        return;
    }

    var video = $('#' + this.videoSpanId + '>video');

    if (video && video.length > 0) {
        if (isEnable) {
            this.showDisplayName(LargeVideo.isLargeVideoOnTop());

            if (!this.container.classList.contains("dominantspeaker"))
                this.container.classList.add("dominantspeaker");
        }
        else {
            this.showDisplayName(false);

            if (this.container.classList.contains("dominantspeaker"))
                this.container.classList.remove("dominantspeaker");
        }
    }

    this.showAvatar();
};

SmallVideo.prototype.updateIconPositions = function () {
    var audioMutedSpan = $('#' + this.videoSpanId + '>span.audioMuted');
    var connectionIndicator = $('#' + this.videoSpanId + '>div.connectionindicator');
    var videoMutedSpan = $('#' + this.videoSpanId + '>span.videoMuted');
    if(connectionIndicator.length > 0
        && connectionIndicator[0].style.display != "none") {
        audioMutedSpan.css({right: "23px"});
        videoMutedSpan.css({right: ((audioMutedSpan.length > 0? 23 : 0) + 30) + "px"});
    }
    else
    {
        audioMutedSpan.css({right: "0px"});
        videoMutedSpan.css({right: (audioMutedSpan.length > 0? 30 : 0) + "px"});
    }
}


/**
 * Creates the element indicating the moderator(owner) of the conference.
 *
 * @param parentElement the parent element where the owner indicator will
 * be added
 */
SmallVideo.prototype.createModeratorIndicatorElement = function () {
    // Show moderator indicator
    var indicatorSpan = $('#' + this.videoSpanId + ' .focusindicator');

    if (!indicatorSpan || indicatorSpan.length === 0) {
        indicatorSpan = document.createElement('span');
        indicatorSpan.className = 'focusindicator';

        this.container.appendChild(indicatorSpan);
        indicatorSpan = $('#' + this.videoSpanId + ' .focusindicator');
    }

    if (indicatorSpan.children().length !== 0)
        return;
    var moderatorIndicator = document.createElement('i');
    moderatorIndicator.className = 'fa fa-star';
    indicatorSpan[0].appendChild(moderatorIndicator);

    UIUtil.setTooltip(indicatorSpan[0],
        "videothumbnail.moderator",
        "top");

    //translates text in focus indicators
    APP.translation.translateElement($('#' + this.videoSpanId + ' .focusindicator'));
}


SmallVideo.prototype.getSrc = function () {
    return APP.RTC.getVideoSrc($('#' + this.videoSpanId).find("video").get(0));
}

SmallVideo.prototype.focus = function(isFocused)
{
    if(!isFocused) {
        this.container.classList.remove("videoContainerFocused");
    }
    else
    {
        this.container.classList.add("videoContainerFocused");
    }
}

SmallVideo.prototype.hasVideo = function () {
    return $("#" + this.videoSpanId).find("video").length !== 0;
}

/**
 * Hides or shows the user's avatar
 * @param show whether we should show the avatar or not
 * video because there is no dominant speaker and no focused speaker
 */
SmallVideo.prototype.showAvatar = function (show) {
    if(!this.hasAvatar)
        return;

    var video = $('#' + this.videoSpanId).find("video");
    var avatar = $('#avatar_' + this.resourceJid);

    if (show === undefined || show === null) {
        if(!this.VideoLayout.isInLastN(this.resourceJid)) {
            show = true;
        }
        else
        {
            show = APP.RTC.isVideoMuted(this.peerJid);
        }

    }

    if (LargeVideo.showAvatar(this.resourceJid, show))
    {
        setVisibility(avatar, false);
        setVisibility(video, false);
    } else {
        if (video && video.length > 0) {
            setVisibility(video, !show);
        }
        setVisibility(avatar, show);

    }
}

SmallVideo.prototype.avatarChanged = function (thumbUrl) {
    var thumbnail = $('#' + this.videoSpanId);
    var avatar = $('#avatar_' + this.resourceJid);
    this.hasAvatar = true;

    // set the avatar in the thumbnail
    if (avatar && avatar.length > 0) {
        avatar[0].src = thumbUrl;
    } else {
        if (thumbnail && thumbnail.length > 0) {
            avatar = document.createElement('img');
            avatar.id = 'avatar_' + this.resourceJid;
            avatar.className = 'userAvatar';
            avatar.src = thumbUrl;
            thumbnail.append(avatar);
        }
    }
}

module.exports = SmallVideo;