/* global $, config, interfaceConfig, APP, JitsiMeetJS */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import UIUtil from "../util/UIUtil";
import UIEvents from "../../../service/UI/UIEvents";
import SmallVideo from "./SmallVideo";

const RTCUIUtils = JitsiMeetJS.util.RTCUIHelper;
const TrackEvents = JitsiMeetJS.events.track;

function LocalVideo(VideoLayout, emitter) {
    this.videoSpanId = "localVideoContainer";
    this.container = $("#localVideoContainer").get(0);
    this.localVideoId = null;
    this.bindHoverHandler();
    if(config.enableLocalVideoFlip)
        this._buildContextMenu();
    this.isLocal = true;
    this.emitter = emitter;
    Object.defineProperty(this, 'id', {
        get: function () {
            return APP.conference.getMyUserId();
        }
    });
    this.initBrowserSpecificProperties();

    SmallVideo.call(this, VideoLayout);

    // Set default display name.
    this.setDisplayName();

    this.addAudioLevelIndicator();
    this.updateConnectionIndicator();
}

LocalVideo.prototype = Object.create(SmallVideo.prototype);
LocalVideo.prototype.constructor = LocalVideo;

/**
 * Sets the display name for the given video span id.
 */
LocalVideo.prototype.setDisplayName = function(displayName) {
    if (!this.container) {
        logger.warn(
                "Unable to set displayName - " + this.videoSpanId +
                " does not exist");
        return;
    }

    this.updateDisplayName({
        allowEditing: true,
        displayName: displayName,
        displayNameSuffix: interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME,
        elementID: 'localDisplayName',
        participantID: this.id
    });
};

LocalVideo.prototype.changeVideo = function (stream) {
    this.videoStream = stream;

    let localVideoClick = (event) => {
        // TODO Checking the classList is a workround to allow events to bubble
        // into the DisplayName component if it was clicked. React's synthetic
        // events will fire after jQuery handlers execute, so stop propogation
        // at this point will prevent DisplayName from getting click events.
        // This workaround should be removeable once LocalVideo is a React
        // Component because then the components share the same eventing system.
        const { classList } = event.target;
        const clickedOnDisplayName = classList.contains('displayname')
            || classList.contains('editdisplayname');

        // FIXME: with Temasys plugin event arg is not an event, but
        // the clicked object itself, so we have to skip this call
        if (event.stopPropagation && !clickedOnDisplayName) {
            event.stopPropagation();
        }

        if (!clickedOnDisplayName) {
            this.VideoLayout.handleVideoThumbClicked(this.id);
        }
    };

    let localVideoContainerSelector = $('#localVideoContainer');
    localVideoContainerSelector.off('click');
    localVideoContainerSelector.on('click', localVideoClick);

    let localVideo = document.createElement('video');
    localVideo.id = this.localVideoId = 'localVideo_' + stream.getId();

    RTCUIUtils.setAutoPlay(localVideo, true);
    RTCUIUtils.setVolume(localVideo, 0);

    var localVideoContainer = document.getElementById('localVideoWrapper');
    // Put the new video always in front
    UIUtil.prependChild(localVideoContainer, localVideo);

    // Add click handler to both video and video wrapper elements in case
    // there's no video.

    // onclick has to be used with Temasys plugin
    localVideo.onclick = localVideoClick;

    let isVideo = stream.videoType != "desktop";
    this._enableDisableContextMenu(isVideo);
    this.setFlipX(isVideo? APP.settings.getLocalFlipX() : false);

    // Attach WebRTC stream
    localVideo = stream.attach(localVideo);

    let endedHandler = () => {
        localVideoContainer.removeChild(localVideo);
        // when removing only the video element and we are on stage
        // update the stage
        if (this.isCurrentlyOnLargeVideo()) {
            this.VideoLayout.updateLargeVideo(
                this.id,
                true /* force - stream removed for the same user ID */);
        }
        stream.off(TrackEvents.LOCAL_TRACK_STOPPED, endedHandler);
    };
    stream.on(TrackEvents.LOCAL_TRACK_STOPPED, endedHandler);
};

/**
 * Shows or hides the local video container.
 * @param {boolean} true to make the local video container visible, false
 * otherwise
 */
LocalVideo.prototype.setVisible = function(visible) {

    // We toggle the hidden class as an indication to other interested parties
    // that this container has been hidden on purpose.
    $("#localVideoContainer").toggleClass("hidden");

    // We still show/hide it as we need to overwrite the style property if we
    // want our action to take effect. Toggling the display property through
    // the above css class didn't succeed in overwriting the style.
    if (visible) {
        $("#localVideoContainer").show();
    }
    else {
        $("#localVideoContainer").hide();
    }
};

/**
 * Sets the flipX state of the video.
 * @param val {boolean} true for flipped otherwise false;
 */
LocalVideo.prototype.setFlipX = function (val) {
    this.emitter.emit(UIEvents.LOCAL_FLIPX_CHANGED, val);
    if(!this.localVideoId)
        return;
    if(val) {
        this.selectVideoElement().addClass("flipVideoX");
    } else {
        this.selectVideoElement().removeClass("flipVideoX");
    }
};

/**
 * Builds the context menu for the local video.
 */
LocalVideo.prototype._buildContextMenu = function () {
    $.contextMenu({
        selector: '#' + this.videoSpanId,
        zIndex: 10000,
        items: {
            flip: {
                name: "Flip",
                callback: () => {
                    let val = !APP.settings.getLocalFlipX();
                    this.setFlipX(val);
                    APP.settings.setLocalFlipX(val);
                }
            }
        },
        events: {
            show : function(options){
                options.items.flip.name =
                    APP.translation.generateTranslationHTML(
                        "videothumbnail.flip");
            }
        }
    });
};

/**
 * Enables or disables the context menu for the local video.
 * @param enable {boolean} true for enable, false for disable
 */
LocalVideo.prototype._enableDisableContextMenu = function (enable) {
    if($('#' + this.videoSpanId).contextMenu)
        $('#' + this.videoSpanId).contextMenu(enable);
};

export default LocalVideo;
