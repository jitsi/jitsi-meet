/* global $, APP, JitsiMeetJS */
/* jshint -W101 */
import Avatar from "../avatar/Avatar";
import UIUtil from "../util/UIUtil";

const RTCUIHelper = JitsiMeetJS.util.RTCUIHelper;

function SmallVideo(VideoLayout) {
    this.isMuted = false;
    this.hasAvatar = false;
    this.isVideoMuted = false;
    this.videoStream = null;
    this.audioStream = null;
    this.VideoLayout = VideoLayout;
}

function setVisibility(selector, show) {
    if (selector && selector.length > 0) {
        selector.css("visibility", show ? "visible" : "hidden");
    }
}

/**
 * Returns the identifier of this small video.
 *
 * @returns the identifier of this small video
 */
SmallVideo.prototype.getId = function () {
    return this.id;
};

/* Indicates if this small video is currently visible.
 *
 * @return <tt>true</tt> if this small video isn't currently visible and
 * <tt>false</tt> - otherwise.
 */
SmallVideo.prototype.isVisible = function () {
    return $('#' + this.videoSpanId).is(':visible');
};

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

/**
 * Enables / disables the device availability icons for this small video.
 * @param {enable} set to {true} to enable and {false} to disable
 */
SmallVideo.prototype.enableDeviceAvailabilityIcons = function (enable) {
    if (typeof enable === "undefined")
        return;

    this.deviceAvailabilityIconsEnabled = enable;
};

/**
 * Sets the device "non" availability icons.
 * @param devices the devices, which will be checked for availability
 */
SmallVideo.prototype.setDeviceAvailabilityIcons = function (devices) {
    if (!this.deviceAvailabilityIconsEnabled)
        return;

    if(!this.container)
        return;

    var noMic = $("#" + this.videoSpanId + " > .noMic");
    var noVideo =  $("#" + this.videoSpanId + " > .noVideo");

    noMic.remove();
    noVideo.remove();
    if (!devices.audio) {
        this.container.appendChild(
            document.createElement("div")).setAttribute("class", "noMic");
    }

    if (!devices.video) {
        this.container.appendChild(
            document.createElement("div")).setAttribute("class", "noVideo");
    }

    if (!devices.audio && !devices.video) {
        noMic.css("background-position", "75%");
        noVideo.css("background-position", "25%");
        noVideo.css("background-color", "transparent");
    }
};

/**
 * Sets the type of the video displayed by this instance.
 * @param videoType 'camera' or 'desktop'
 */
SmallVideo.prototype.setVideoType = function (videoType) {
    this.videoType = videoType;
};

/**
 * Returns the type of the video displayed by this instance.
 * @returns {String} 'camera', 'screen' or undefined.
 */
SmallVideo.prototype.getVideoType = function () {
    return this.videoType;
};

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
 * Creates an audio or video element for a particular MediaStream.
 */
SmallVideo.createStreamElement = function (stream) {
    let isVideo = stream.isVideoTrack();

    let element = isVideo
        ? document.createElement('video')
        : document.createElement('audio');
    if (isVideo) {
        element.setAttribute("muted", "true");
    }

    RTCUIHelper.setAutoPlay(element, true);

    element.id = SmallVideo.getStreamElementID(stream);

    element.onplay = function () {
        var type = (isVideo ? 'video' : 'audio');
        var now = APP.performanceTimes[type + ".render"]
            = window.performance.now();
        console.log("(TIME) Render " + type + ":\t",
                    now);
    };

    element.oncontextmenu = function () { return false; };

    return element;
};

/**
 * Returns the element id for a particular MediaStream.
 */
SmallVideo.getStreamElementID = function (stream) {
    let isVideo = stream.isVideoTrack();

    return (isVideo ? 'remoteVideo_' : 'remoteAudio_') + stream.getId();
};

/**
 * Configures hoverIn/hoverOut handlers.
 */
SmallVideo.prototype.bindHoverHandler = function () {
    // Add hover handler
    var self = this;
    $(this.container).hover(
        function () {
            self.showDisplayName(true);
        },
        function () {
            // If the video has been "pinned" by the user we want to
            // keep the display name on place.
            if (!self.VideoLayout.isLargeVideoVisible() ||
                !self.VideoLayout.isCurrentlyOnLarge(self.id))
                self.showDisplayName(false);
        }
    );
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
};

SmallVideo.prototype.hideIndicator = function () {
    if(this.connectionIndicator)
        this.connectionIndicator.hideIndicator();
};


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
        if (!audioMutedSpan.length) {
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
 * Shows video muted indicator over small videos and disables/enables avatar
 * if video muted.
 */
SmallVideo.prototype.setMutedView = function(isMuted) {
    this.isVideoMuted = isMuted;
    this.updateView();

    var videoMutedSpan = $('#' + this.videoSpanId + '>span.videoMuted');

    if (isMuted === false) {
        if (videoMutedSpan.length > 0) {
            videoMutedSpan.remove();
        }
    }
    else {
        if (!videoMutedSpan.length) {
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

SmallVideo.prototype.updateIconPositions = function () {
    var audioMutedSpan = $('#' + this.videoSpanId + '>span.audioMuted');
    var connectionIndicator = $('#' + this.videoSpanId + '>div.connectionindicator');
    var videoMutedSpan = $('#' + this.videoSpanId + '>span.videoMuted');
    if(connectionIndicator.length > 0 &&
        connectionIndicator[0].style.display != "none") {
        audioMutedSpan.css({right: "23px"});
        videoMutedSpan.css({right: ((audioMutedSpan.length > 0? 23 : 0) + 30) + "px"});
    } else {
        audioMutedSpan.css({right: "0px"});
        videoMutedSpan.css({right: (audioMutedSpan.length > 0? 30 : 0) + "px"});
    }
};

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
};

SmallVideo.prototype.selectVideoElement = function () {
    return $(RTCUIHelper.findVideoElement($('#' + this.videoSpanId)[0]));
};

/**
 * Enables / disables the css responsible for focusing/pinning a video
 * thumbnail.
 *
 * @param isFocused indicates if the thumbnail should be focused/pinned or not
 */
SmallVideo.prototype.focus = function(isFocused) {
    var focusedCssClass = "videoContainerFocused";
    var isFocusClassEnabled = $(this.container).hasClass(focusedCssClass);

    if (!isFocused && isFocusClassEnabled) {
        $(this.container).removeClass(focusedCssClass);
    }
    else if (isFocused && !isFocusClassEnabled) {
        $(this.container).addClass(focusedCssClass);
    }
};

SmallVideo.prototype.hasVideo = function () {
    return this.selectVideoElement().length !== 0;
};

/**
 * Hides or shows the user's avatar.
 * This update assumes that large video had been updated and we will
 * reflect it on this small video.
 *
 * @param show whether we should show the avatar or not
 * video because there is no dominant speaker and no focused speaker
 */
SmallVideo.prototype.updateView = function () {
    if (!this.hasAvatar) {
        if (this.id) {
            // Init avatar
            this.avatarChanged(Avatar.getAvatarUrl(this.id));
        } else {
            console.error("Unable to init avatar - no id", this);
            return;
        }
    }

    let video = this.selectVideoElement();

    let avatar = $(`#avatar_${this.id}`);

    var isCurrentlyOnLarge = this.VideoLayout.isCurrentlyOnLarge(this.id);

    var showVideo = !this.isVideoMuted && !isCurrentlyOnLarge;
    var showAvatar;
    if ((!this.isLocal
            && !this.VideoLayout.isInLastN(this.id))
        || this.isVideoMuted) {
        showAvatar = true;
    } else {
        // We want to show the avatar when the video is muted or not exists
        // that is when 'true' or 'null' is returned
        showAvatar = !this.videoStream || this.videoStream.isMuted();
    }

    showAvatar = showAvatar && !isCurrentlyOnLarge;

    if (video && video.length > 0) {
        setVisibility(video, showVideo);
    }
    setVisibility(avatar, showAvatar);

    this.showDisplayName(!showVideo && !showAvatar);
};

SmallVideo.prototype.avatarChanged = function (avatarUrl) {
    var thumbnail = $('#' + this.videoSpanId);
    var avatar = $('#avatar_' + this.id);
    this.hasAvatar = true;

    // set the avatar in the thumbnail
    if (avatar && avatar.length > 0) {
        avatar[0].src = avatarUrl;
    } else {
        if (thumbnail && thumbnail.length > 0) {
            avatar = document.createElement('img');
            avatar.id = 'avatar_' + this.id;
            avatar.className = 'userAvatar';
            avatar.src = avatarUrl;
            thumbnail.append(avatar);
        }
    }
};

/**
 * Updates the Indicator for dominant speaker.
 *
 * @param isSpeaker indicates the current indicator state
 */
SmallVideo.prototype.updateDominantSpeakerIndicator = function (isSpeaker) {

    if (!this.container) {
        console.warn( "Unable to set dominant speaker indicator - "
            + this.videoSpanId + " does not exist");
        return;
    }

    var indicatorSpan
        = $('#' + this.videoSpanId + '>span.dominantspeakerindicator');

    // If we do not have an indicator for this video.
    if (indicatorSpan.length <= 0) {
        indicatorSpan = document.createElement('span');

        indicatorSpan.innerHTML
            = "<i id='speakerindicatoricon' class='fa fa-bullhorn'></i>";
        indicatorSpan.className = 'dominantspeakerindicator';

        $('#' + this.videoSpanId)[0].appendChild(indicatorSpan);

        // adds a tooltip
        UIUtil.setTooltip(indicatorSpan, "speaker", "left");
        APP.translation.translateElement($(indicatorSpan));
    }

    $(indicatorSpan).css("visibility", isSpeaker ? "visible" : "hidden");
};

export default SmallVideo;
