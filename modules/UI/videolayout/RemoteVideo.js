/* global $, APP, interfaceConfig, JitsiMeetJS */

/* eslint-disable no-unused-vars */
import React from 'react';
import ReactDOM from 'react-dom';

import {
    MuteButton,
    KickButton,
    REMOTE_CONTROL_MENU_STATES,
    RemoteControlButton,
    RemoteVideoMenu,
    VolumeSlider
} from '../../../react/features/remote-video-menu';
/* eslint-enable no-unused-vars */

const logger = require("jitsi-meet-logger").getLogger(__filename);


import SmallVideo from "./SmallVideo";
import UIUtils from "../util/UIUtil";
import UIEvents from '../../../service/UI/UIEvents';
import JitsiPopover from "../util/JitsiPopover";

const MUTED_DIALOG_BUTTON_VALUES = {
    cancel: 0,
    muted: 1
};
const ParticipantConnectionStatus
    = JitsiMeetJS.constants.participantConnectionStatus;

/**
 * Creates new instance of the <tt>RemoteVideo</tt>.
 * @param user {JitsiParticipant} the user for whom remote video instance will
 * be created.
 * @param {VideoLayout} VideoLayout the video layout instance.
 * @param {EventEmitter} emitter the event emitter which will be used by
 * the new instance to emit events.
 * @constructor
 */
function RemoteVideo(user, VideoLayout, emitter) {
    this.user = user;
    this.id = user.getId();
    this.emitter = emitter;
    this.videoSpanId = `participant_${this.id}`;
    SmallVideo.call(this, VideoLayout);
    this._audioStreamElement = null;
    this.hasRemoteVideoMenu = false;
    this._supportsRemoteControl = false;
    this.addRemoteVideoContainer();
    this.updateConnectionIndicator();
    this.setDisplayName();
    this.bindHoverHandler();
    this.flipX = false;
    this.isLocal = false;
    this.popupMenuIsHovered = false;
    /**
     * The flag is set to <tt>true</tt> after the 'onplay' event has been
     * triggered on the current video element. It goes back to <tt>false</tt>
     * when the stream is removed. It is used to determine whether the video
     * playback has ever started.
     * @type {boolean}
     */
    this.wasVideoPlayed = false;
    /**
     * The flag is set to <tt>true</tt> if remote participant's video gets muted
     * during his media connection disruption. This is to prevent black video
     * being render on the thumbnail, because even though once the video has
     * been played the image usually remains on the video element it seems that
     * after longer period of the video element being hidden this image can be
     * lost.
     * @type {boolean}
     */
    this.mutedWhileDisconnected = false;

    // Bind event handlers so they are only bound once for every instance.
    // TODO The event handlers should be turned into actions so changes can be
    // handled through reducers and middleware.
    this._kickHandler = this._kickHandler.bind(this);
    this._muteHandler = this._muteHandler.bind(this);
    this._requestRemoteControlPermissions
        = this._requestRemoteControlPermissions.bind(this);
    this._setAudioVolume = this._setAudioVolume.bind(this);
    this._stopRemoteControl = this._stopRemoteControl.bind(this);
}

RemoteVideo.prototype = Object.create(SmallVideo.prototype);
RemoteVideo.prototype.constructor = RemoteVideo;

RemoteVideo.prototype.addRemoteVideoContainer = function() {
    this.container = RemoteVideo.createContainer(this.videoSpanId);

    this.initBrowserSpecificProperties();

    if (APP.conference.isModerator || this._supportsRemoteControl) {
        this.addRemoteVideoMenu();
    }

    this.VideoLayout.resizeThumbnails(false, true);

    this.addAudioLevelIndicator();

    return this.container;
};

/**
 * Initializes the remote participant popup menu, by specifying previously
 * constructed popupMenuElement, containing all the menu items.
 *
 * @param popupMenuElement a pre-constructed element, containing the menu items
 * to display in the popup
 */
RemoteVideo.prototype._initPopupMenu = function (popupMenuElement) {
    let options = {
        content: popupMenuElement.outerHTML,
        skin: "black",
        hasArrow: false,
        position: interfaceConfig.VERTICAL_FILMSTRIP ? 'left' : 'top'
    };
    let element = $("#" + this.videoSpanId + " .remotevideomenu");
    this.popover = new JitsiPopover(element, options);
    this.popover.addOnHoverPopover(isHovered => {
        this.popupMenuIsHovered = isHovered;
        this.updateView();
    });

    // override popover show method to make sure we will update the content
    // before showing the popover
    let origShowFunc = this.popover.show;
    this.popover.show = function () {
        // update content by forcing it, to finish even if popover
        // is not visible
        this.updateRemoteVideoMenu(this.isAudioMuted, true);
        // call the original show, passing its actual this
        origShowFunc.call(this.popover);
    }.bind(this);
};

/**
 * Checks whether current video is considered hovered. Currently it is hovered
 * if the mouse is over the video, or if the connection indicator or the popup
 * menu is shown(hovered).
 * @private
 * NOTE: extends SmallVideo's method
 */
RemoteVideo.prototype._isHovered = function () {
    let isHovered = SmallVideo.prototype._isHovered.call(this)
        || this.popupMenuIsHovered;
    return isHovered;
};

/**
 * Generates the popup menu content.
 *
 * @returns {Element|*} the constructed element, containing popup menu items
 * @private
 */
RemoteVideo.prototype._generatePopupContent = function () {
    const { controller } = APP.remoteControl;
    let remoteControlState = null;
    let onRemoteControlToggle;

    if (this._supportsRemoteControl) {
        if (controller.getRequestedParticipant() === this.id) {
            onRemoteControlToggle = () => {};
            remoteControlState = REMOTE_CONTROL_MENU_STATES.REQUESTING;
        } else if (!controller.isStarted()) {
            onRemoteControlToggle = this._requestRemoteControlPermissions;
            remoteControlState = REMOTE_CONTROL_MENU_STATES.NOT_STARTED;
        } else {
            onRemoteControlToggle = this._stopRemoteControl;
            remoteControlState = REMOTE_CONTROL_MENU_STATES.STARTED;
        }
    }

    let initialVolumeValue, onVolumeChange;

    // Feature check for volume setting as temasys objects cannot adjust volume.
    if (this._canSetAudioVolume()) {
        initialVolumeValue = this._getAudioElement().volume;
        onVolumeChange = this._setAudioVolume;
    }

    const { isModerator } = APP.conference;
    const participantID = this.id;

    /* jshint ignore:start */
    return (
        <RemoteVideoMenu id = { participantID }>
            { isModerator
                ? <MuteButton
                    isAudioMuted = { this.isAudioMuted }
                    onClick = { this._muteHandler }
                    participantID = { participantID } />
                : null }
            { isModerator
                ? <KickButton
                    onClick = { this._kickHandler }
                    participantID = { participantID } />
                : null }
            { remoteControlState
                ? <RemoteControlButton
                    onClick = { onRemoteControlToggle }
                    participantID = { participantID }
                    remoteControlState = { remoteControlState } />
                : null }
            { onVolumeChange
                ? <VolumeSlider
                    initialValue = { initialVolumeValue }
                    onChange = { onVolumeChange } />
                : null }
        </RemoteVideoMenu>
    );
    /* jshint ignore:end */
};

/**
 * Sets the remote control supported value and initializes or updates the menu
 * depending on the remote control is supported or not.
 * @param {boolean} isSupported
 */
RemoteVideo.prototype.setRemoteControlSupport = function(isSupported = false) {
    if(this._supportsRemoteControl === isSupported) {
        return;
    }
    this._supportsRemoteControl = isSupported;
    if(!isSupported) {
        return;
    }

    if(!this.hasRemoteVideoMenu) {
        //create menu
        this.addRemoteVideoMenu();
    } else {
        //update the content
        this.updateRemoteVideoMenu(this.isAudioMuted, true);
    }

};

/**
 * Requests permissions for remote control session.
 */
RemoteVideo.prototype._requestRemoteControlPermissions = function () {
    APP.remoteControl.controller.requestPermissions(
        this.id, this.VideoLayout.getLargeVideoWrapper()).then(result => {
        if(result === null) {
            return;
        }
        this.updateRemoteVideoMenu(this.isAudioMuted, true);
        APP.UI.messageHandler.notify(
            "dialog.remoteControlTitle",
            (result === false) ? "dialog.remoteControlDeniedMessage"
                : "dialog.remoteControlAllowedMessage",
            {user: this.user.getDisplayName()
                || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME}
        );
        if(result === true) {//the remote control permissions has been granted
            // pin the controlled participant
            let pinnedId = this.VideoLayout.getPinnedId();
            if(pinnedId !== this.id) {
                this.VideoLayout.handleVideoThumbClicked(this.id);
            }
        }
    }, error => {
        logger.error(error);
        this.updateRemoteVideoMenu(this.isAudioMuted, true);
        APP.UI.messageHandler.notify(
            "dialog.remoteControlTitle",
            "dialog.remoteControlErrorMessage",
            {user: this.user.getDisplayName()
                || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME}
        );
    });
    this.updateRemoteVideoMenu(this.isAudioMuted, true);
};

/**
 * Stops remote control session.
 */
RemoteVideo.prototype._stopRemoteControl = function () {
    // send message about stopping
    APP.remoteControl.controller.stop();
    this.updateRemoteVideoMenu(this.isAudioMuted, true);
};

RemoteVideo.prototype._muteHandler = function () {
    if (this.isAudioMuted)
        return;

    RemoteVideo.showMuteParticipantDialog().then(reason => {
        if(reason === MUTED_DIALOG_BUTTON_VALUES.muted) {
            this.emitter.emit(UIEvents.REMOTE_AUDIO_MUTED, this.id);
        }
    }).catch(e => {
        //currently shouldn't be called
        logger.error(e);
    });

    this.popover.forceHide();
};

RemoteVideo.prototype._kickHandler = function () {
    this.emitter.emit(UIEvents.USER_KICKED, this.id);
    this.popover.forceHide();
};

/**
 * Get the remote participant's audio element.
 *
 * @returns {Element} audio element
 */
RemoteVideo.prototype._getAudioElement = function () {
    return this._audioStreamElement;
};

/**
 * Check if the remote participant's audio can have its volume adjusted.
 *
 * @returns {boolean} true if the volume can be adjusted.
 */
RemoteVideo.prototype._canSetAudioVolume = function () {
    const audioElement = this._getAudioElement();
    return audioElement && audioElement.volume !== undefined;
};

/**
 * Change the remote participant's volume level.
 *
 * @param {int} newVal - The value to set the slider to.
 */
RemoteVideo.prototype._setAudioVolume = function (newVal) {
    if (this._canSetAudioVolume()) {
        this._getAudioElement().volume = newVal;
    }
};

/**
 * Updates the remote video menu.
 *
 * @param isMuted the new muted state to update to
 * @param force to work even if popover is not visible
 */
RemoteVideo.prototype.updateRemoteVideoMenu = function (isMuted, force) {
    this.isAudioMuted = isMuted;

    if (!this.popover) {
        return;
    }

    // generate content, translate it and add it to document only if
    // popover is visible or we force to do so.
    if(this.popover.popoverShown || force) {
        this.popover.updateContent(this._generatePopupContent());
    }
};

/**
 * @inheritDoc
 * @override
 */
RemoteVideo.prototype.setVideoMutedView = function(isMuted) {
    SmallVideo.prototype.setVideoMutedView.call(this, isMuted);
    // Update 'mutedWhileDisconnected' flag
    this._figureOutMutedWhileDisconnected();
};

/**
 * Figures out the value of {@link #mutedWhileDisconnected} flag by taking into
 * account remote participant's network connectivity and video muted status.
 *
 * @private
 */
RemoteVideo.prototype._figureOutMutedWhileDisconnected = function() {
    const isActive = this.isConnectionActive();
    if (!isActive && this.isVideoMuted) {
        this.mutedWhileDisconnected = true;
    } else if (isActive && !this.isVideoMuted) {
        this.mutedWhileDisconnected = false;
    }
};

/**
 * Adds the remote video menu element for the given <tt>id</tt> in the
 * given <tt>parentElement</tt>.
 *
 * @param id the id indicating the video for which we're adding a menu.
 * @param parentElement the parent element where this menu will be added
 */
RemoteVideo.prototype.addRemoteVideoMenu = function () {
    if (interfaceConfig.filmStripOnly) {
        return;
    }
    var spanElement = document.createElement('span');
    spanElement.className = 'remotevideomenu';

    this.container.appendChild(spanElement);

    var menuElement = document.createElement('i');
    menuElement.className = 'icon-menu-up';
    menuElement.title = 'Remote user controls';
    spanElement.appendChild(menuElement);

    this._initPopupMenu(this._generatePopupContent());
    this.hasRemoteVideoMenu = true;
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
    var select = $('#' + elementID);
    select.remove();

    if (isVideo) {
        this.wasVideoPlayed = false;
    }

    logger.info((isVideo ? "Video" : "Audio") +
                 " removed " + this.id, select);

    // when removing only the video element and we are on stage
    // update the stage
    if (isVideo && this.isCurrentlyOnLargeVideo())
        this.VideoLayout.updateLargeVideo(this.id);
    else
        // Missing video stream will affect display mode
        this.updateView();
};

/**
 * Checks whether the remote user associated with this <tt>RemoteVideo</tt>
 * has connectivity issues.
 *
 * @return {boolean} <tt>true</tt> if the user's connection is fine or
 * <tt>false</tt> otherwise.
 */
RemoteVideo.prototype.isConnectionActive = function() {
    return this.user.getConnectionStatus()
        === ParticipantConnectionStatus.ACTIVE;
};

/**
 * The remote video is considered "playable" once the stream has started
 * according to the {@link #hasVideoStarted} result.
 * It will be allowed to display video also in
 * {@link ParticipantConnectionStatus.INTERRUPTED} if the video was ever played
 * and was not muted while not in ACTIVE state. This basically means that there
 * is stalled video image cached that could be displayed. It's used to show
 * "grey video image" in user's thumbnail when there are connectivity issues.
 *
 * @inheritdoc
 * @override
 */
RemoteVideo.prototype.isVideoPlayable = function () {
    const connectionState
        = APP.conference.getParticipantConnectionStatus(this.id);

    return SmallVideo.prototype.isVideoPlayable.call(this)
        && this.hasVideoStarted()
        && (connectionState === ParticipantConnectionStatus.ACTIVE
            || (connectionState === ParticipantConnectionStatus.INTERRUPTED
                    && !this.mutedWhileDisconnected));
};

/**
 * @inheritDoc
 */
RemoteVideo.prototype.updateView = function () {
    $(this.container).toggleClass('audio-only', APP.conference.isAudioOnly());

    this.updateConnectionStatusIndicator();

    // This must be called after 'updateConnectionStatusIndicator' because it
    // affects the display mode by modifying 'mutedWhileDisconnected' flag
    SmallVideo.prototype.updateView.call(this);
};

/**
 * Updates the UI to reflect user's connectivity status.
 */
RemoteVideo.prototype.updateConnectionStatusIndicator = function () {
    const connectionStatus = this.user.getConnectionStatus();

    logger.debug(`${this.id} thumbnail connection status: ${connectionStatus}`);

    // FIXME rename 'mutedWhileDisconnected' to 'mutedWhileNotRendering'
    // Update 'mutedWhileDisconnected' flag
    this._figureOutMutedWhileDisconnected();
    this.updateConnectionStatus(connectionStatus);

    const isInterrupted
        = connectionStatus === ParticipantConnectionStatus.INTERRUPTED;
    // Toggle thumbnail video problem filter
    this.selectVideoElement().toggleClass(
        "videoThumbnailProblemFilter", isInterrupted);
    this.$avatar().toggleClass(
        "videoThumbnailProblemFilter", isInterrupted);
};

/**
 * Removes RemoteVideo from the page.
 */
RemoteVideo.prototype.remove = function () {
    logger.log("Remove thumbnail", this.id);

    this.removeAudioLevelIndicator();

    const toolbarContainer
        = this.container.querySelector('.videocontainer__toolbar');

    if (toolbarContainer) {
        ReactDOM.unmountComponentAtNode(toolbarContainer);
    }

    this.removeConnectionIndicator();

    this.removeDisplayName();

    this.removeAvatar();

    this._unmountIndicators();

    // Make sure that the large video is updated if are removing its
    // corresponding small video.
    this.VideoLayout.updateAfterThumbRemoved(this.id);
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

    // Triggers when video playback starts
    var onPlayingHandler = function () {
        self.wasVideoPlayed = true;
        self.VideoLayout.remoteVideoActive(streamElement, self.id);
        streamElement.onplaying = null;
        // Refresh to show the video
        self.updateView();
    };
    streamElement.onplaying = onPlayingHandler;
};

/**
 * Checks whether the video stream has started for this RemoteVideo instance.
 *
 * @returns {boolean} true if this RemoteVideo has a video stream for which
 * the playback has been started.
 */
RemoteVideo.prototype.hasVideoStarted = function () {
    return this.wasVideoPlayed;
};

RemoteVideo.prototype.addRemoteStreamElement = function (stream) {
    if (!this.container) {
        return;
    }

    let isVideo = stream.isVideoTrack();
    isVideo ? this.videoStream = stream : this.audioStream = stream;

    if (isVideo)
        this.setVideoType(stream.videoType);

    // Add click handler.
    let onClickHandler = (event) => {
        let source = event.target || event.srcElement;

        // ignore click if it was done in popup menu
        if ($(source).parents('.popupmenu').length === 0) {
            this.VideoLayout.handleVideoThumbClicked(this.id);
        }

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

    if (!isVideo) {
        this._audioStreamElement = streamElement;
    }
};

RemoteVideo.prototype.updateResolution = function (resolution) {
    this.updateConnectionIndicator({ resolution });
};

/**
 * Updates this video framerate indication.
 * @param framerate the value to update
 */
RemoteVideo.prototype.updateFramerate = function (framerate) {
    this.updateConnectionIndicator({ framerate });
};

/**
 * Sets the display name for the given video span id.
 *
 * @param displayName the display name to set
 */
RemoteVideo.prototype.setDisplayName = function(displayName) {
    if (!this.container) {
        logger.warn( "Unable to set displayName - " + this.videoSpanId +
                " does not exist");
        return;
    }

    this.updateDisplayName({
        displayName: displayName || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME,
        elementID: `${this.videoSpanId}_name`,
        participantID: this.id
    });
};

/**
 * Removes remote video menu element from video element identified by
 * given <tt>videoElementId</tt>.
 *
 * @param videoElementId the id of local or remote video element.
 */
RemoteVideo.prototype.removeRemoteVideoMenu = function() {
    var menuSpan = $('#' + this.videoSpanId + '> .remotevideomenu');
    if (menuSpan.length) {
        this.popover.forceHide();
        menuSpan.remove();
        this.hasRemoteVideoMenu = false;
    }
};

RemoteVideo.createContainer = function (spanId) {
    let container = document.createElement('span');
    container.id = spanId;
    container.className = 'videocontainer';

    let wrapper = document.createElement('div');
    wrapper.className = 'videocontainer__background';
    container.appendChild(wrapper);

    let indicatorBar = document.createElement('div');
    indicatorBar.className = "videocontainer__toptoolbar";
    container.appendChild(indicatorBar);

    let toolbar = document.createElement('div');
    toolbar.className = "videocontainer__toolbar";
    container.appendChild(toolbar);

    let overlay = document.createElement('div');
    overlay.className = "videocontainer__hoverOverlay";
    container.appendChild(overlay);

    const displayNameContainer = document.createElement('div');
    displayNameContainer.className = 'displayNameContainer';
    container.appendChild(displayNameContainer);

    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'avatar-container';
    container.appendChild(avatarContainer);

    var remotes = document.getElementById('filmstripRemoteVideosContainer');
    return remotes.appendChild(container);
};

/**
 * Shows 2 button dialog for confirmation from the user for muting remote
 * participant.
 */
RemoteVideo.showMuteParticipantDialog = function () {
    return new Promise(resolve => {
        APP.UI.messageHandler.openTwoButtonDialog({
            titleKey : "dialog.muteParticipantTitle",
            msgString: "<div data-i18n='dialog.muteParticipantBody'></div>",
            leftButtonKey: "dialog.muteParticipantButton",
            dontShowAgain: {
                id: "dontShowMuteParticipantDialog",
                textKey: "dialog.doNotShowMessageAgain",
                checked: true,
                buttonValues: [true]
            },
            submitFunction: () => resolve(MUTED_DIALOG_BUTTON_VALUES.muted),
            closeFunction: () => resolve(MUTED_DIALOG_BUTTON_VALUES.cancel)
        });
    });
};

export default RemoteVideo;
