/* global $, APP, interfaceConfig */

import ConnectionIndicator from './ConnectionIndicator';

import SmallVideo from "./SmallVideo";
import AudioLevels from "../audio_levels/AudioLevels";
import UIUtils from "../util/UIUtil";
import UIEvents from '../../../service/UI/UIEvents';
import JitsiPopover from "../util/JitsiPopover";

function RemoteVideo(id, VideoLayout, emitter) {
    this.id = id;
    this.emitter = emitter;
    this.videoSpanId = `participant_${id}`;
    SmallVideo.call(this, VideoLayout);
    this.addRemoteVideoContainer();
    this.connectionIndicator = new ConnectionIndicator(this, id);
    this.setDisplayName();
    this.bindHoverHandler();
    this.flipX = false;
    this.isLocal = false;
    this.popover = null;
}

RemoteVideo.prototype = Object.create(SmallVideo.prototype);
RemoteVideo.prototype.constructor = RemoteVideo;

RemoteVideo.prototype.addRemoteVideoContainer = function() {
    this.container = RemoteVideo.createContainer(this.videoSpanId);
    if (APP.conference.isModerator) {
        this.addRemoteVideoMenu();
    }
    let {thumbWidth, thumbHeight} = this.VideoLayout.resizeThumbnails();
    AudioLevels.updateAudioLevelCanvas(this.id, thumbWidth, thumbHeight);

    return this.container;
};

/**
 * Adds menu to the this remote video element.
 */
RemoteVideo.prototype.addRemoteVideoMenu = function() {
    if (interfaceConfig.filmStripOnly || this.popover) {
        return;
    }

    let $popup = $(
        `<span class="remotevideomenu">
            <i class="fa fa-angle-down" title="Remote user controls"></i>
         </span>`
    );
    $(this.container).append($popup);
    this.popover = new JitsiPopover($popup, {
        skin: 'black',
        onClick: this.onRemoteVideoMenuClicked.bind(this),
        onShow: () => {
            $(`#${this.getRemoteMenuId()} [data-i18n]`).each(function (i, el) {
                APP.translation.translateElement($(el));
            });
        }
    });
    this.updatePopover();
};

/**
 * Get id of menu element for this remote video element.
 * @returns {string} remote menu element id
 */
RemoteVideo.prototype.getRemoteMenuId = function () {
    return `remote_popupmenu_${this.id}`;
};

/**
 * Generate menu html for this remote video.
 * @returns {string} remote menu html
 */
RemoteVideo.prototype.generateRemoteVideoMenu = function () {
    let muteLabeli18n =
            this.isMuted
            ? 'videothumbnail.muted'
            : 'videothumbnail.domute';
    return `
    <ul id="${this.getRemoteMenuId()}" class="popupmenu">
        <li class="popupmenu-mute">
            <a href="" class="mutelink ${this.isMuted ? 'disabled' : ''}">
                <i class="icon-mic-disabled"></i>
                <span data-i18n="${muteLabeli18n}"></span>
            </a>
        </li>
        <li class="popupmenu-kick">
            <a href="">
                <i class="fa fa-eject"></i>
                <span data-i18n="videothumbnail.kick"></span>
            </a>
        </li>
    </ul>
    `;
};

/**
 * Update remote menu.
 */
RemoteVideo.prototype.updatePopover = function () {
    this.popover.updateContent(this.generateRemoteVideoMenu());
};

/**
 * Click handler for the remote menu.
 */
RemoteVideo.prototype.onRemoteVideoMenuClicked = function (e) {
    e.preventDefault();

    let $target = $(e.target);

    if ($target.parents('.popupmenu-mute').length) {
        this.emitter.emit(UIEvents.REMOTE_AUDIO_MUTED, this.id);
    } else if ($target.parents('.popupmenu-kick').length) {
        this.emitter.emit(UIEvents.USER_KICKED, this.id);
    }

    this.popover.forceHide();
};

/**
 * Removes the remote stream element corresponding to the given stream and
 * parent container.
 *
 * @param stream the MediaStream
 * @param isVideo <tt>true</tt> if given <tt>stream</tt> is a video one.
 */
RemoteVideo.prototype.removeRemoteStreamElement = function (stream) {
    if (!this.container)
        return false;

    var isVideo = stream.isVideoTrack();

    var elementID = SmallVideo.getStreamElementID(stream);
    var select = null;
    if (isVideo) {
        select = $('#' + elementID);
    }
    else
        select = $('#' + this.videoSpanId + '>audio');

    select.remove();

    console.info((isVideo ? "Video" : "Audio") +
                 " removed " + this.id, select);

    if (isVideo)
        this.VideoLayout.updateRemovedVideo(this.id);
};

/**
 * Removes RemoteVideo from the page.
 */
RemoteVideo.prototype.remove = function () {
    console.log("Remove thumbnail", this.id);
    this.removeConnectionIndicator();

    if (this.popover) {
        this.popover.forceHide();
    }

    // Make sure that the large video is updated if are removing its
    // corresponding small video.
    this.VideoLayout.updateRemovedVideo(this.id);
    // Remove whole container
    if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
    }
};

RemoteVideo.prototype.waitForPlayback = function (streamElement, stream) {

    var webRtcStream = stream.getOriginalStream();
    var isVideo = stream.isVideoTrack();
    if (!isVideo || webRtcStream.id === 'mixedmslabel') {
        return;
    }

    var self = this;

    // Register 'onplaying' listener to trigger 'videoactive' on VideoLayout
    // when video playback starts
    var onPlayingHandler = function () {
        self.VideoLayout.videoactive(streamElement, self.id);
        streamElement.onplaying = null;
    };
    streamElement.onplaying = onPlayingHandler;
};

/**
 * Checks whether or not video stream exists and has started for this
 * RemoteVideo instance. This is checked by trying to select video element in
 * this container and checking if 'currentTime' field's value is greater than 0.
 *
 * @returns {*|boolean} true if this RemoteVideo has active video stream running
 */
RemoteVideo.prototype.hasVideoStarted = function () {
    var videoSelector = this.selectVideoElement();
    return videoSelector.length && videoSelector[0].currentTime > 0;
};

RemoteVideo.prototype.addRemoteStreamElement = function (stream) {
    if (!this.container) {
        return;
    }

    let isVideo = stream.isVideoTrack();
    isVideo ? this.videoStream = stream : this.audioStream = stream;

    // Add click handler.
    let onClickHandler = (event) => {
        let source = event.target || event.srcElement;

        this.VideoLayout.handleVideoThumbClicked(false, this.id);

        // On IE we need to populate this handler on video <object>
        // and it does not give event instance as an argument,
        // so we check here for methods.
        if (event.stopPropagation && event.preventDefault) {
            event.stopPropagation();
            event.preventDefault();
        }
        return false;
    };
    this.container.onclick = onClickHandler;

    if(!stream.getOriginalStream())
        return;

    let streamElement = SmallVideo.createStreamElement(stream);
    let newElementId = streamElement.id;

    // Put new stream element always in front
    UIUtils.prependChild(this.container, streamElement);

    // If we hide element when Temasys plugin is used then
    // we'll never receive 'onplay' event and other logic won't work as expected
    // NOTE: hiding will not have effect when Temasys plugin is in use, as
    // calling attach will show it back
    $(streamElement).hide();

    // If the container is currently visible
    // we attach the stream to the element.
    if (!isVideo || (this.container.offsetParent !== null && isVideo)) {
        this.waitForPlayback(streamElement, stream);

        streamElement = stream.attach(streamElement);
    }

    $(streamElement).click(onClickHandler);
},

/**
 * Show/hide peer container for the given id.
 */
RemoteVideo.prototype.showPeerContainer = function (state) {
    if (!this.container)
        return;

    var isHide = state === 'hide';
    var resizeThumbnails = false;

    if (!isHide) {
        if (!$(this.container).is(':visible')) {
            resizeThumbnails = true;
            $(this.container).show();
        }
        // Call updateView, so that we'll figure out if avatar
        // should be displayed based on video muted status and whether or not
        // it's in the lastN set
        this.updateView();
    }
    else if ($(this.container).is(':visible') && isHide)
    {
        resizeThumbnails = true;
        $(this.container).hide();
        if(this.connectionIndicator)
            this.connectionIndicator.hide();
    }

    if (resizeThumbnails) {
        this.VideoLayout.resizeThumbnails();
    }

    // We want to be able to pin a participant from the contact list, even
    // if he's not in the lastN set!
    // ContactList.setClickable(id, !isHide);

};

RemoteVideo.prototype.updateResolution = function (resolution) {
    if (this.connectionIndicator) {
        this.connectionIndicator.updateResolution(resolution);
    }
};

RemoteVideo.prototype.removeConnectionIndicator = function () {
    if (this.connectionIndicator)
        this.connectionIndicator.remove();
};

RemoteVideo.prototype.hideConnectionIndicator = function () {
    if (this.connectionIndicator)
        this.connectionIndicator.hide();
};

/**
 * Updates the remote video menu.
 *
 * @param isMuted indicates the current mute state
 */
RemoteVideo.prototype.updateRemoteVideoMenu = function (isMuted) {
    this.isMuted = isMuted;
    this.updatePopover();
};

/**
 * Sets the display name for the given video span id.
 */
RemoteVideo.prototype.setDisplayName = function(displayName, key) {

    if (!this.container) {
        console.warn( "Unable to set displayName - " + this.videoSpanId +
                " does not exist");
        return;
    }

    var nameSpan = $('#' + this.videoSpanId + '>span.displayname');

    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        if (displayName && displayName.length > 0) {
            $('#' + this.videoSpanId + '_name').text(displayName);
        }
        else if (key && key.length > 0) {
            var nameHtml = APP.translation.generateTranslationHTML(key);
            $('#' + this.videoSpanId + '_name').html(nameHtml);
        }
        else
            $('#' + this.videoSpanId + '_name').text(
                interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME);
    } else {
        nameSpan = document.createElement('span');
        nameSpan.className = 'displayname';
        $('#' + this.videoSpanId)[0].appendChild(nameSpan);

        if (displayName && displayName.length > 0) {
            $(nameSpan).text(displayName);
        } else {
            nameSpan.innerHTML = interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
        }
        nameSpan.id = this.videoSpanId + '_name';
    }
};

/**
 * Removes remote video menu element from video element identified by
 * given <tt>videoElementId</tt>.
 *
 * @param videoElementId the id of local or remote video element.
 */
RemoteVideo.prototype.removeRemoteVideoMenu = function() {
    var menuSpan = $('#' + this.videoSpanId + '>span.remotevideomenu');
    if (menuSpan.length) {
        menuSpan.remove();
    }
};

RemoteVideo.createContainer = function (spanId) {
    var container = document.createElement('span');
    container.id = spanId;
    container.className = 'videocontainer';
    var remotes = document.getElementById('remoteVideos');
    return remotes.appendChild(container);
};


export default RemoteVideo;
