/* global $, JitsiMeetJS, interfaceConfig */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import Avatar from "../avatar/Avatar";
import UIUtil from "../util/UIUtil";
import UIEvents from "../../../service/UI/UIEvents";
import AudioLevels from "../audio_levels/AudioLevels";

const RTCUIHelper = JitsiMeetJS.util.RTCUIHelper;

/**
 * Display mode constant used when video is being displayed on the small video.
 * @type {number}
 * @constant
 */
const DISPLAY_VIDEO = 0;
/**
 * Display mode constant used when the user's avatar is being displayed on
 * the small video.
 * @type {number}
 * @constant
 */
const DISPLAY_AVATAR = 1;
/**
 * Display mode constant used when neither video nor avatar is being displayed
 * on the small video. And we just show the display name.
 * @type {number}
 * @constant
 */
const DISPLAY_BLACKNESS_WITH_NAME = 2;

/**
 * Display mode constant used when video is displayed and display name
 * at the same time.
 * @type {number}
 * @constant
 */
const DISPLAY_VIDEO_WITH_NAME = 3;

/**
 * Display mode constant used when neither video nor avatar is being displayed
 * on the small video. And we just show the display name.
 * @type {number}
 * @constant
 */
const DISPLAY_AVATAR_WITH_NAME = 4;

function SmallVideo(VideoLayout) {
    this.isAudioMuted = false;
    this.hasAvatar = false;
    this.isVideoMuted = false;
    this.videoStream = null;
    this.audioStream = null;
    this.VideoLayout = VideoLayout;
    this.videoIsHovered = false;
    this.hideDisplayName = false;
    // we can stop updating the thumbnail
    this.disableUpdateView = false;
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
 * Note that this is a string without clearly defined or checked values, and
 * it is NOT one of the strings defined in service/RTC/VideoType in
 * lib-jitsi-meet.
 * @param videoType 'camera' or 'desktop', or 'sharedvideo'.
 */
SmallVideo.prototype.setVideoType = function (videoType) {
    this.videoType = videoType;
};

/**
 * Returns the type of the video displayed by this instance.
 * Note that this is a string without clearly defined or checked values, and
 * it is NOT one of the strings defined in service/RTC/VideoType in
 * lib-jitsi-meet.
 * @returns {String} 'camera', 'screen', 'sharedvideo', or undefined.
 */
SmallVideo.prototype.getVideoType = function () {
    return this.videoType;
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
 * Configures hoverIn/hoverOut handlers. Depends on connection indicator.
 */
SmallVideo.prototype.bindHoverHandler = function () {
    // Add hover handler
    $(this.container).hover(
        () => {
            this.videoIsHovered = true;
            this.updateView();
        },
        () => {
            this.videoIsHovered = false;
            this.updateView();
        }
    );
    if (this.connectionIndicator) {
        this.connectionIndicator.addPopoverHoverListener(
            () => {
                this.updateView();
            });
    }
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
 * Shows / hides the audio muted indicator over small videos.
 *
 * @param {boolean} isMuted indicates if the muted element should be shown
 * or hidden
 */
SmallVideo.prototype.showAudioIndicator = function (isMuted) {
    let mutedIndicator = this.getAudioMutedIndicator();

    UIUtil.setVisible(mutedIndicator, isMuted);

    this.isAudioMuted = isMuted;
};

/**
 * Returns the audio muted indicator jquery object. If it doesn't exists -
 * creates it.
 *
 * @returns {HTMLElement} the audio muted indicator
 */
SmallVideo.prototype.getAudioMutedIndicator = function () {
    let selector = '#' + this.videoSpanId + ' .audioMuted';
    let audioMutedSpan = document.querySelector(selector);

    if (audioMutedSpan) {
        return audioMutedSpan;
    }

    audioMutedSpan = document.createElement('span');
    audioMutedSpan.className = 'audioMuted toolbar-icon';

    UIUtil.setTooltip(audioMutedSpan,
        "videothumbnail.mute",
        "top");

    let mutedIndicator = document.createElement('i');
    mutedIndicator.className = 'icon-mic-disabled';
    audioMutedSpan.appendChild(mutedIndicator);

    this.container
        .querySelector('.videocontainer__toolbar')
        .appendChild(audioMutedSpan);

    return audioMutedSpan;
};

/**
 * Shows video muted indicator over small videos and disables/enables avatar
 * if video muted.
 *
 * @param {boolean} isMuted indicates if we should set the view to muted view
 * or not
 */
SmallVideo.prototype.setVideoMutedView = function(isMuted) {
    this.isVideoMuted = isMuted;
    this.updateView();

    let element = this.getVideoMutedIndicator();

    UIUtil.setVisible(element, isMuted);
};

/**
 * Returns the video muted indicator jquery object. If it doesn't exists -
 * creates it.
 *
 * @returns {jQuery|HTMLElement} the video muted indicator
 */
SmallVideo.prototype.getVideoMutedIndicator = function () {
    var selector = '#' + this.videoSpanId + ' .videoMuted';
    var videoMutedSpan = document.querySelector(selector);

    if (videoMutedSpan) {
        return videoMutedSpan;
    }

    videoMutedSpan = document.createElement('span');
    videoMutedSpan.className = 'videoMuted toolbar-icon';

    this.container
        .querySelector('.videocontainer__toolbar')
        .appendChild(videoMutedSpan);

    var mutedIndicator = document.createElement('i');
    mutedIndicator.className = 'icon-camera-disabled';

    UIUtil.setTooltip(mutedIndicator,
        "videothumbnail.videomute",
        "top");

    videoMutedSpan.appendChild(mutedIndicator);

    return videoMutedSpan;
};

/**
 * Adds the element indicating the moderator(owner) of the conference.
 */
SmallVideo.prototype.addModeratorIndicator = function () {

    // Don't create moderator indicator if DISABLE_FOCUS_INDICATOR is true
    if (interfaceConfig.DISABLE_FOCUS_INDICATOR)
        return false;

    // Show moderator indicator
    var indicatorSpan = $('#' + this.videoSpanId + ' .focusindicator');

    if (indicatorSpan.length) {
        return;
    }

    indicatorSpan = document.createElement('span');
    indicatorSpan.className = 'focusindicator toolbar-icon right';

    this.container
        .querySelector('.videocontainer__toolbar')
        .appendChild(indicatorSpan);

    var moderatorIndicator = document.createElement('i');
    moderatorIndicator.className = 'icon-star';

    UIUtil.setTooltip(moderatorIndicator,
        "videothumbnail.moderator",
        "top-left");

    indicatorSpan.appendChild(moderatorIndicator);
};

/**
 * Adds the element indicating the audio level of the participant.
 */
SmallVideo.prototype.addAudioLevelIndicator = function () {
    var audioSpan = $('#' + this.videoSpanId + ' .audioindicator');

    if (audioSpan.length) {
        return;
    }

    this.container.appendChild(
        AudioLevels.createThumbnailAudioLevelIndicator());
};

/**
 * Updates the audio level for this small video.
 *
 * @param lvl the new audio level to set
 */
SmallVideo.prototype.updateAudioLevelIndicator = function (lvl) {
    AudioLevels.updateThumbnailAudioLevel(this.videoSpanId, lvl);
};

/**
 * Removes the element indicating the moderator(owner) of the conference.
 */
SmallVideo.prototype.removeModeratorIndicator = function () {
    $('#' + this.videoSpanId + ' .focusindicator').remove();
};

/**
 * This is an especially interesting function. A naive reader might think that
 * it returns this SmallVideo's "video" element. But it is much more exciting.
 * It first finds this video's parent element using jquery, then uses a utility
 * from lib-jitsi-meet to extract the video element from it (with two more
 * jquery calls), and finally uses jquery again to encapsulate the video element
 * in an array. This last step allows (some might prefer "forces") users of
 * this function to access the video element via the 0th element of the returned
 * array (after checking its length of course!).
 */
SmallVideo.prototype.selectVideoElement = function () {
    return $(RTCUIHelper.findVideoElement($('#' + this.videoSpanId)[0]));
};

/**
 * Selects the HTML image element which displays user's avatar.
 *
 * @return {jQuery|HTMLElement} a jQuery selector pointing to the HTML image
 * element which displays the user's avatar.
 */
SmallVideo.prototype.$avatar = function () {
    return $('#' + this.videoSpanId + ' .userAvatar');
};

/**
 * Returns the display name element, which appears on the video thumbnail.
 *
 * @return {jQuery} a jQuery selector pointing to the display name element of
 * the video thumbnail
 */
SmallVideo.prototype.$displayName = function () {
    return $('#' + this.videoSpanId + ' .displayname');
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
 * Checks whether the user associated with this <tt>SmallVideo</tt> is currently
 * being displayed on the "large video".
 *
 * @return {boolean} <tt>true</tt> if the user is displayed on the large video
 * or <tt>false</tt> otherwise.
 */
SmallVideo.prototype.isCurrentlyOnLargeVideo = function () {
    return this.VideoLayout.isCurrentlyOnLarge(this.id);
};

/**
 * Checks whether there is a playable video stream available for the user
 * associated with this <tt>SmallVideo</tt>.
 *
 * @return {boolean} <tt>true</tt> if there is a playable video stream available
 * or <tt>false</tt> otherwise.
 */
SmallVideo.prototype.isVideoPlayable = function() {
    return this.videoStream // Is there anything to display ?
        && !this.isVideoMuted && !this.videoStream.isMuted() // Muted ?
        && (this.isLocal || this.VideoLayout.isInLastN(this.id));
};

/**
 * Determines what should be display on the thumbnail.
 *
 * @return {number} one of <tt>DISPLAY_VIDEO</tt>,<tt>DISPLAY_AVATAR</tt>
 * or <tt>DISPLAY_BLACKNESS_WITH_NAME</tt>.
 */
SmallVideo.prototype.selectDisplayMode = function() {
    // Display name is always and only displayed when user is on the stage
    if (this.isCurrentlyOnLargeVideo()) {
        return DISPLAY_BLACKNESS_WITH_NAME;
    } else if (this.isVideoPlayable() && this.selectVideoElement().length) {
        // check hovering and change state to video with name
        return this._isHovered() ?
            DISPLAY_VIDEO_WITH_NAME : DISPLAY_VIDEO;
    } else {
        // check hovering and change state to avatar with name
        return this._isHovered() ?
            DISPLAY_AVATAR_WITH_NAME : DISPLAY_AVATAR;
    }
};

/**
 * Checks whether current video is considered hovered. Currently it is hovered
 * if the mouse is over the video, or if the connection
 * indicator is shown(hovered).
 * @private
 */
SmallVideo.prototype._isHovered = function () {
    return this.videoIsHovered
        || (this.connectionIndicator
            && this.connectionIndicator.popover.popoverIsHovered);
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
    if (this.disableUpdateView)
        return;

    if (!this.hasAvatar) {
        if (this.id) {
            // Init avatar
            this.avatarChanged(Avatar.getAvatarUrl(this.id));
        } else {
            logger.error("Unable to init avatar - no id", this);
            return;
        }
    }

    // Determine whether video, avatar or blackness should be displayed
    let displayMode = this.selectDisplayMode();
    // Show/hide video.
    UIUtil.setVisibleBySelector(this.selectVideoElement(),
                                (displayMode === DISPLAY_VIDEO
                                || displayMode === DISPLAY_VIDEO_WITH_NAME));
    // Show/hide the avatar.
    UIUtil.setVisibleBySelector(this.$avatar(),
                                (displayMode === DISPLAY_AVATAR
                                || displayMode === DISPLAY_AVATAR_WITH_NAME));
    // Show/hide the display name.
    UIUtil.setVisibleBySelector(this.$displayName(),
                                !this.hideDisplayName
                                && (displayMode === DISPLAY_BLACKNESS_WITH_NAME
                                || displayMode === DISPLAY_VIDEO_WITH_NAME
                                || displayMode === DISPLAY_AVATAR_WITH_NAME));
    // show hide overlay when there is a video or avatar under
    // the display name
    UIUtil.setVisibleBySelector($('#' + this.videoSpanId
                                + ' .videocontainer__hoverOverlay'),
                                (displayMode === DISPLAY_AVATAR_WITH_NAME
                                || displayMode === DISPLAY_VIDEO_WITH_NAME));
};

SmallVideo.prototype.avatarChanged = function (avatarUrl) {
    var thumbnail = $('#' + this.videoSpanId);
    var avatarSel = this.$avatar();
    this.hasAvatar = true;

    // set the avatar in the thumbnail
    if (avatarSel && avatarSel.length > 0) {
        avatarSel[0].src = avatarUrl;
    } else {
        if (thumbnail && thumbnail.length > 0) {
            var avatarElement = document.createElement('img');
            avatarElement.className = 'userAvatar';
            avatarElement.src = avatarUrl;
            thumbnail.append(avatarElement);
        }
    }
};

/**
 * Shows or hides the dominant speaker indicator.
 * @param show whether to show or hide.
 */
SmallVideo.prototype.showDominantSpeakerIndicator = function (show) {
    // Don't create and show dominant speaker indicator if
    // DISABLE_DOMINANT_SPEAKER_INDICATOR is true
    if (interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR)
        return;

    if (!this.container) {
        logger.warn( "Unable to set dominant speaker indicator - "
            + this.videoSpanId + " does not exist");
        return;
    }

    let indicatorSpanId = "dominantspeakerindicator";
    let content = `<i id="indicatoricon"
        '             class="indicatoricon fa fa-bullhorn"></i>`;
    let indicatorSpan = UIUtil.getVideoThumbnailIndicatorSpan({
        videoSpanId: this.videoSpanId,
        indicatorId: indicatorSpanId,
        content,
        tooltip: 'speaker'
    });

    UIUtil.setVisible(indicatorSpan, show);
};

/**
 * Shows or hides the raised hand indicator.
 * @param show whether to show or hide.
 */
SmallVideo.prototype.showRaisedHandIndicator = function (show) {
    if (!this.container) {
        logger.warn( "Unable to raised hand indication - "
            + this.videoSpanId + " does not exist");
        return;
    }

    let indicatorSpanId = "raisehandindicator";
    let content = `<i id="indicatoricon"
                      class="icon-raised-hand indicatoricon"></i>`;
    let indicatorSpan = UIUtil.getVideoThumbnailIndicatorSpan({
        indicatorId: indicatorSpanId,
        videoSpanId: this.videoSpanId,
        content,
        tooltip: 'raisedHand'
    });

    UIUtil.setVisible(indicatorSpan, show);
};

/**
 * Adds a listener for onresize events for this video, which will monitor for
 * resolution changes, will calculate the delay since the moment the listened
 * is added, and will fire a RESOLUTION_CHANGED event.
 */
SmallVideo.prototype.waitForResolutionChange = function() {
    let beforeChange = window.performance.now();
    let videos = this.selectVideoElement();
    if (!videos || !videos.length || videos.length <= 0)
        return;
    let video = videos[0];
    let oldWidth = video.videoWidth;
    let oldHeight = video.videoHeight;
    video.onresize = () => {
        if (video.videoWidth != oldWidth || video.videoHeight != oldHeight) {
            // Only run once.
            video.onresize = null;

            let delay = window.performance.now() - beforeChange;
            let emitter = this.VideoLayout.getEventEmitter();
            if (emitter) {
                emitter.emit(
                        UIEvents.RESOLUTION_CHANGED,
                        this.getId(),
                        oldWidth + "x" + oldHeight,
                        video.videoWidth + "x" + video.videoHeight,
                        delay);
            }
        }
    };
};

/**
 * Initalizes any browser specific properties. Currently sets the overflow
 * property for Qt browsers on Windows to hidden, thus fixing the following
 * problem:
 * Some browsers don't have full support of the object-fit property for the
 * video element and when we set video object-fit to "cover" the video
 * actually overflows the boundaries of its container, so it's important
 * to indicate that the "overflow" should be hidden.
 *
 * Setting this property for all browsers will result in broken audio levels,
 * which makes this a temporary solution, before reworking audio levels.
 */
SmallVideo.prototype.initBrowserSpecificProperties = function() {

    var userAgent = window.navigator.userAgent;
    if (userAgent.indexOf("QtWebEngine") > -1
        && (userAgent.indexOf("Windows") > -1
            || userAgent.indexOf("Linux") > -1)) {
        $('#' + this.videoSpanId).css("overflow", "hidden");
    }
};

export default SmallVideo;
