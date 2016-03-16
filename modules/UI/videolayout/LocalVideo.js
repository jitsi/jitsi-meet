/* global $, interfaceConfig, APP, JitsiMeetJS */
import ConnectionIndicator from "./ConnectionIndicator";
import UIUtil from "../util/UIUtil";
import UIEvents from "../../../service/UI/UIEvents";
import SmallVideo from "./SmallVideo";

var LargeVideo = require("./LargeVideo");

const RTCUIUtils = JitsiMeetJS.util.RTCUIHelper;
const TrackEvents = JitsiMeetJS.events.track;

function LocalVideo(VideoLayout, emitter) {
    this.videoSpanId = "localVideoContainer";
    this.container = $("#localVideoContainer").get(0);
    this.bindHoverHandler();
    this.VideoLayout = VideoLayout;
    this.flipX = true;
    this.isLocal = true;
    this.emitter = emitter;
    Object.defineProperty(this, 'id', {
        get: function () {
            return APP.conference.localId;
        }
    });
    SmallVideo.call(this);
}

LocalVideo.prototype = Object.create(SmallVideo.prototype);
LocalVideo.prototype.constructor = LocalVideo;

/**
 * Creates the edit display name button.
 *
 * @returns {object} the edit button
 */
function createEditDisplayNameButton() {
    var editButton = document.createElement('a');
    editButton.className = 'displayname';
    UIUtil.setTooltip(editButton,
        "videothumbnail.editnickname",
        "top");
    editButton.innerHTML = '<i class="fa fa-pencil"></i>';

    return editButton;
}

/**
 * Sets the display name for the given video span id.
 */
LocalVideo.prototype.setDisplayName = function(displayName, key) {
    if (!this.container) {
        console.warn(
                "Unable to set displayName - " + this.videoSpanId +
                " does not exist");
        return;
    }

    var nameSpan = $('#' + this.videoSpanId + '>span.displayname');
    var defaultLocalDisplayName = APP.translation.generateTranslationHTML(
        interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);

    var meHTML;
    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        if (nameSpan.text() !== displayName) {
            if (displayName && displayName.length > 0) {
                meHTML = APP.translation.generateTranslationHTML("me");
                $('#localDisplayName').html(
                    UIUtil.escapeHtml(displayName) + ' (' + meHTML + ')'
                );
            } else {
                $('#localDisplayName').html(defaultLocalDisplayName);
            }
        }
        this.updateView();
    } else {
        var editButton = createEditDisplayNameButton();

        nameSpan = document.createElement('span');
        nameSpan.className = 'displayname';
        $('#' + this.videoSpanId)[0].appendChild(nameSpan);


        if (displayName && displayName.length > 0) {
            meHTML = APP.translation.generateTranslationHTML("me");
            nameSpan.innerHTML = UIUtil.escapeHtml(displayName) + meHTML;
        }
        else {
            nameSpan.innerHTML = defaultLocalDisplayName;
        }


        nameSpan.id = 'localDisplayName';
        this.container.appendChild(editButton);
        //translates popover of edit button
        APP.translation.translateElement($("a.displayname"));

        var editableText = document.createElement('input');
        editableText.className = 'displayname';
        editableText.type = 'text';
        editableText.id = 'editDisplayName';

        if (displayName && displayName.length) {
            editableText.value = displayName;
        }

        var defaultNickname = APP.translation.translateString(
            "defaultNickname", {name: "Jane Pink"});
        editableText.setAttribute('style', 'display:none;');
        editableText.setAttribute('data-18n',
            '[placeholder]defaultNickname');
        editableText.setAttribute("data-i18n-options",
            JSON.stringify({name: "Jane Pink"}));
        editableText.setAttribute("placeholder", defaultNickname);

        this.container.appendChild(editableText);

        var self = this;
        $('#localVideoContainer .displayname')
            .bind("click", function (e) {

                var editDisplayName = $('#editDisplayName');
                e.preventDefault();
                e.stopPropagation();
                $('#localDisplayName').hide();
                editDisplayName.show();
                editDisplayName.focus();
                editDisplayName.select();

                editDisplayName.one("focusout", function (e) {
                    self.emitter.emit(UIEvents.NICKNAME_CHANGED, this.value);
                    $('#editDisplayName').hide();
                });

                editDisplayName.on('keydown', function (e) {
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
        this.VideoLayout.handleVideoThumbClicked(true, this.id);
    };

    let localVideoContainerSelector = $('#localVideoContainer');
    localVideoContainerSelector.off('click');
    localVideoContainerSelector.on('click', localVideoClick);

    this.flipX = stream.videoType != "desktop";
    let localVideo = document.createElement('video');
    localVideo.id = 'localVideo_' + stream.getId();

    RTCUIUtils.setAutoPlay(localVideo, true);
    RTCUIUtils.setVolume(localVideo, 0);

    var localVideoContainer = document.getElementById('localVideoWrapper');
    // Put the new video always in front
    UIUtil.prependChild(localVideoContainer, localVideo);

    // Add click handler to both video and video wrapper elements in case
    // there's no video.

    // onclick has to be used with Temasys plugin
    localVideo.onclick = localVideoClick;

    if (this.flipX) {
        $(localVideo).addClass("flipVideoX");
    }

    // Attach WebRTC stream
    localVideo = stream.attach(localVideo);

    let endedHandler = () => {
        localVideoContainer.removeChild(localVideo);
        this.VideoLayout.updateRemovedVideo(this.id);
        stream.off(TrackEvents.LOCAL_TRACK_STOPPED, endedHandler);
    };
    stream.on(TrackEvents.LOCAL_TRACK_STOPPED, endedHandler);
};

export default LocalVideo;
