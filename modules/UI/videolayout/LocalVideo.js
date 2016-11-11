/* global $, config, interfaceConfig, APP, JitsiMeetJS */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import ConnectionIndicator from "./ConnectionIndicator";
import UIUtil from "../util/UIUtil";
import UIEvents from "../../../service/UI/UIEvents";
import SmallVideo from "./SmallVideo";

const RTCUIUtils = JitsiMeetJS.util.RTCUIHelper;
const TrackEvents = JitsiMeetJS.events.track;

function LocalVideo(VideoLayout, emitter) {
    this.videoSpanId = "localVideoContainer";
    this.container = $("#localVideoContainer").get(0);
    this.localVideoId = null;
    this.createConnectionIndicator();
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

    var nameSpan = $('#' + this.videoSpanId + ' .displayname');
    var defaultLocalDisplayName = APP.translation.generateTranslationHTML(
        interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);

    var meHTML;
    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        if (nameSpan.text() !== displayName) {
            if (displayName && displayName.length > 0) {
                meHTML = APP.translation.generateTranslationHTML("me");
                $('#localDisplayName').html(
                    `${UIUtil.escapeHtml(displayName)} (${meHTML})`
                );
                $('#editDisplayName').val(
                    `${UIUtil.escapeHtml(displayName)}`
                );
            } else {
                $('#localDisplayName').html(defaultLocalDisplayName);
            }
        }
        this.updateView();
    } else {
        nameSpan = document.createElement('span');
        nameSpan.className = 'displayname';
        document.getElementById(this.videoSpanId)
            .appendChild(nameSpan);


        if (displayName && displayName.length > 0) {
            meHTML = APP.translation.generateTranslationHTML("me");
            nameSpan.innerHTML = UIUtil.escapeHtml(displayName) + meHTML;
        }
        else {
            nameSpan.innerHTML = defaultLocalDisplayName;
        }


        nameSpan.id = 'localDisplayName';
        //translates popover of edit button
        APP.translation.translateElement($("a.displayname"));

        var editableText = document.createElement('input');
        editableText.className = 'editdisplayname';
        editableText.type = 'text';
        editableText.id = 'editDisplayName';

        if (displayName && displayName.length) {
            editableText.value = displayName;
        }

        editableText.setAttribute('style', 'display:none;');
        editableText.setAttribute('data-i18n',
            '[placeholder]defaultNickname');
        editableText.setAttribute("data-i18n-options",
            JSON.stringify({name: "Jane Pink"}));
        APP.translation.translateElement($(editableText));

        this.container
            .appendChild(editableText);

        var self = this;
        $('#localVideoContainer .displayname')
            .bind("click", function (e) {
                let $editDisplayName = $('#editDisplayName');

                e.preventDefault();
                e.stopPropagation();
                // we set display to be hidden
                self.hideDisplayName = true;
                // update the small video vide to hide the display name
                self.updateView();
                // disables further updates in the thumbnail to stay in the
                // edit mode
                self.disableUpdateView = true;

                $editDisplayName.show();
                $editDisplayName.focus();
                $editDisplayName.select();

                $editDisplayName.one("focusout", function () {
                    self.emitter.emit(UIEvents.NICKNAME_CHANGED, this.value);
                    $editDisplayName.hide();
                    // stop editing, display displayName and resume updating
                    // the thumbnail
                    self.hideDisplayName = false;
                    self.disableUpdateView = false;
                    self.updateView();
                });

                $editDisplayName.on('keydown', function (e) {
                    if (e.keyCode === 13) {
                        e.preventDefault();
                        $('#editDisplayName').hide();
                        // focusout handler will save display name
                    }
                });
            });
    }
};

LocalVideo.prototype.createConnectionIndicator = function() {
    if(this.connectionIndicator)
        return;

    this.connectionIndicator = new ConnectionIndicator(this, null);
};

LocalVideo.prototype.changeVideo = function (stream) {
    this.videoStream = stream;

    let localVideoClick = (event) => {
        // FIXME: with Temasys plugin event arg is not an event, but
        // the clicked object itself, so we have to skip this call
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        this.VideoLayout.handleVideoThumbClicked(this.id);
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
        if(this.isCurrentlyOnLargeVideo())
            this.VideoLayout.updateLargeVideo(this.id);
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
