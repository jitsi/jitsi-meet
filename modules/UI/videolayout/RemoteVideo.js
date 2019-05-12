/* global $, APP, interfaceConfig */

/* eslint-disable no-unused-vars */
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { AtlasKitThemeProvider } from '@atlaskit/theme';

import { i18next } from '../../../react/features/base/i18n';
import {
    JitsiParticipantConnectionStatus
} from '../../../react/features/base/lib-jitsi-meet';
import {
    getPinnedParticipant,
    pinParticipant
} from '../../../react/features/base/participants';
import { PresenceLabel } from '../../../react/features/presence-status';
import {
    REMOTE_CONTROL_MENU_STATES,
    RemoteVideoMenuTriggerButton
} from '../../../react/features/remote-video-menu';
import {
    LAYOUTS,
    getCurrentLayout
} from '../../../react/features/video-layout';
/* eslint-enable no-unused-vars */

const logger = require('jitsi-meet-logger').getLogger(__filename);


import SmallVideo from './SmallVideo';
import UIUtils from '../util/UIUtil';

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
    this._supportsRemoteControl = false;
    this.statsPopoverLocation = interfaceConfig.VERTICAL_FILMSTRIP
        ? 'left bottom' : 'top center';
    this.addRemoteVideoContainer();
    this.updateIndicators();
    this.updateDisplayName();
    this.bindHoverHandler();
    this.flipX = false;
    this.isLocal = false;
    this.popupMenuIsHovered = false;
    this._isRemoteControlSessionActive = false;

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
    this._requestRemoteControlPermissions
        = this._requestRemoteControlPermissions.bind(this);
    this._setAudioVolume = this._setAudioVolume.bind(this);
    this._stopRemoteControl = this._stopRemoteControl.bind(this);

    this.container.onclick = this._onContainerClick;
    this.container.ondblclick = this._onContainerDoubleClick;
}

RemoteVideo.prototype = Object.create(SmallVideo.prototype);
RemoteVideo.prototype.constructor = RemoteVideo;

RemoteVideo.prototype.addRemoteVideoContainer = function() {
    this.container = RemoteVideo.createContainer(this.videoSpanId);
    this.$container = $(this.container);

    this.initBrowserSpecificProperties();

    this.updateRemoteVideoMenu();

    this.VideoLayout.resizeThumbnails(true);

    this.addAudioLevelIndicator();

    this.addPresenceLabel();

    return this.container;
};

/**
 * Checks whether current video is considered hovered. Currently it is hovered
 * if the mouse is over the video, or if the connection indicator or the popup
 * menu is shown(hovered).
 * @private
 * NOTE: extends SmallVideo's method
 */
RemoteVideo.prototype._isHovered = function() {
    const isHovered = SmallVideo.prototype._isHovered.call(this)
        || this.popupMenuIsHovered;


    return isHovered;
};

/**
 * Generates the popup menu content.
 *
 * @returns {Element|*} the constructed element, containing popup menu items
 * @private
 */
RemoteVideo.prototype._generatePopupContent = function() {
    if (interfaceConfig.filmStripOnly) {
        return;
    }

    const remoteVideoMenuContainer
        = this.container.querySelector('.remotevideomenu');

    if (!remoteVideoMenuContainer) {
        return;
    }

    const { controller } = APP.remoteControl;
    let remoteControlState = null;
    let onRemoteControlToggle;

    if (this._supportsRemoteControl
        && ((!APP.remoteControl.active && !this._isRemoteControlSessionActive)
            || APP.remoteControl.controller.activeParticipant === this.id)) {
        if (controller.getRequestedParticipant() === this.id) {
            remoteControlState = REMOTE_CONTROL_MENU_STATES.REQUESTING;
        } else if (controller.isStarted()) {
            onRemoteControlToggle = this._stopRemoteControl;
            remoteControlState = REMOTE_CONTROL_MENU_STATES.STARTED;
        } else {
            onRemoteControlToggle = this._requestRemoteControlPermissions;
            remoteControlState = REMOTE_CONTROL_MENU_STATES.NOT_STARTED;
        }
    }

    const initialVolumeValue
        = this._audioStreamElement && this._audioStreamElement.volume;
    const onVolumeChange = this._setAudioVolume;
    const { isModerator } = APP.conference;
    const participantID = this.id;

    const currentLayout = getCurrentLayout(APP.store.getState());
    let remoteMenuPosition;

    if (currentLayout === LAYOUTS.TILE_VIEW) {
        remoteMenuPosition = 'left top';
    } else if (currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW) {
        remoteMenuPosition = 'left bottom';
    } else {
        remoteMenuPosition = 'top center';
    }

    ReactDOM.render(
        <Provider store = { APP.store }>
            <I18nextProvider i18n = { i18next }>
                <AtlasKitThemeProvider mode = 'dark'>
                    <RemoteVideoMenuTriggerButton
                        initialVolumeValue = { initialVolumeValue }
                        isAudioMuted = { this.isAudioMuted }
                        isModerator = { isModerator }
                        menuPosition = { remoteMenuPosition }
                        onMenuDisplay
                            = {this._onRemoteVideoMenuDisplay.bind(this)}
                        onRemoteControlToggle = { onRemoteControlToggle }
                        onVolumeChange = { onVolumeChange }
                        participantID = { participantID }
                        remoteControlState = { remoteControlState } />
                </AtlasKitThemeProvider>
            </I18nextProvider>
        </Provider>,
        remoteVideoMenuContainer);
};

RemoteVideo.prototype._onRemoteVideoMenuDisplay = function() {
    this.updateRemoteVideoMenu();
};

/**
 * Sets the remote control active status for the remote video.
 *
 * @param {boolean} isActive - The new remote control active status.
 * @returns {void}
 */
RemoteVideo.prototype.setRemoteControlActiveStatus = function(isActive) {
    this._isRemoteControlSessionActive = isActive;
    this.updateRemoteVideoMenu();
};

/**
 * Sets the remote control supported value and initializes or updates the menu
 * depending on the remote control is supported or not.
 * @param {boolean} isSupported
 */
RemoteVideo.prototype.setRemoteControlSupport = function(isSupported = false) {
    if (this._supportsRemoteControl === isSupported) {
        return;
    }
    this._supportsRemoteControl = isSupported;
    this.updateRemoteVideoMenu();
};

/**
 * Requests permissions for remote control session.
 */
RemoteVideo.prototype._requestRemoteControlPermissions = function() {
    APP.remoteControl.controller.requestPermissions(
        this.id, this.VideoLayout.getLargeVideoWrapper()).then(result => {
        if (result === null) {
            return;
        }
        this.updateRemoteVideoMenu();
        APP.UI.messageHandler.notify(
            'dialog.remoteControlTitle',
            result === false ? 'dialog.remoteControlDeniedMessage'
                : 'dialog.remoteControlAllowedMessage',
            { user: this.user.getDisplayName()
                || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME }
        );
        if (result === true) {
            // the remote control permissions has been granted
            // pin the controlled participant
            const pinnedParticipant
                = getPinnedParticipant(APP.store.getState()) || {};
            const pinnedId = pinnedParticipant.id;

            if (pinnedId !== this.id) {
                APP.store.dispatch(pinParticipant(this.id));
            }
        }
    }, error => {
        logger.error(error);
        this.updateRemoteVideoMenu();
        APP.UI.messageHandler.notify(
            'dialog.remoteControlTitle',
            'dialog.remoteControlErrorMessage',
            { user: this.user.getDisplayName()
                || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME }
        );
    });
    this.updateRemoteVideoMenu();
};

/**
 * Stops remote control session.
 */
RemoteVideo.prototype._stopRemoteControl = function() {
    // send message about stopping
    APP.remoteControl.controller.stop();
    this.updateRemoteVideoMenu();
};

/**
 * Change the remote participant's volume level.
 *
 * @param {int} newVal - The value to set the slider to.
 */
RemoteVideo.prototype._setAudioVolume = function(newVal) {
    if (this._audioStreamElement) {
        this._audioStreamElement.volume = newVal;
    }
};

/**
 * Updates the remote video menu.
 *
 * @param isMuted the new muted state to update to
 */
RemoteVideo.prototype.updateRemoteVideoMenu = function(isMuted) {

    if (typeof isMuted !== 'undefined') {
        this.isAudioMuted = isMuted;
    }

    this._generatePopupContent();
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
 * Removes the remote stream element corresponding to the given stream and
 * parent container.
 *
 * @param stream the MediaStream
 * @param isVideo <tt>true</tt> if given <tt>stream</tt> is a video one.
 */
RemoteVideo.prototype.removeRemoteStreamElement = function(stream) {
    if (!this.container) {
        return false;
    }

    const isVideo = stream.isVideoTrack();

    const elementID = SmallVideo.getStreamElementID(stream);
    const select = $(`#${elementID}`);

    select.remove();

    if (isVideo) {
        this.wasVideoPlayed = false;
    }

    logger.info(`${isVideo ? 'Video' : 'Audio'
    } removed ${this.id}`, select);

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
        === JitsiParticipantConnectionStatus.ACTIVE;
};

/**
 * The remote video is considered "playable" once the stream has started
 * according to the {@link #hasVideoStarted} result.
 * It will be allowed to display video also in
 * {@link JitsiParticipantConnectionStatus.INTERRUPTED} if the video was ever
 *  played and was not muted while not in ACTIVE state. This basically means
 * that there is stalled video image cached that could be displayed. It's used
 * to show "grey video image" in user's thumbnail when there are connectivity
 * issues.
 *
 * @inheritdoc
 * @override
 */
RemoteVideo.prototype.isVideoPlayable = function() {
    const connectionState
        = APP.conference.getParticipantConnectionStatus(this.id);

    return SmallVideo.prototype.isVideoPlayable.call(this)
        && this.hasVideoStarted()
        && (connectionState === JitsiParticipantConnectionStatus.ACTIVE
            || (connectionState === JitsiParticipantConnectionStatus.INTERRUPTED
                    && !this.mutedWhileDisconnected));
};

/**
 * @inheritDoc
 */
RemoteVideo.prototype.updateView = function() {
    this.$container.toggleClass('audio-only', APP.conference.isAudioOnly());

    this.updateConnectionStatusIndicator();

    // This must be called after 'updateConnectionStatusIndicator' because it
    // affects the display mode by modifying 'mutedWhileDisconnected' flag
    SmallVideo.prototype.updateView.call(this);
};

/**
 * Updates the UI to reflect user's connectivity status.
 */
RemoteVideo.prototype.updateConnectionStatusIndicator = function() {
    const connectionStatus = this.user.getConnectionStatus();

    logger.debug(`${this.id} thumbnail connection status: ${connectionStatus}`);

    // FIXME rename 'mutedWhileDisconnected' to 'mutedWhileNotRendering'
    // Update 'mutedWhileDisconnected' flag
    this._figureOutMutedWhileDisconnected();
    this.updateConnectionStatus(connectionStatus);

    const isInterrupted
        = connectionStatus === JitsiParticipantConnectionStatus.INTERRUPTED;

    // Toggle thumbnail video problem filter

    this.selectVideoElement().toggleClass(
        'videoThumbnailProblemFilter', isInterrupted);
    this.$avatar().toggleClass(
        'videoThumbnailProblemFilter', isInterrupted);
};

/**
 * Removes RemoteVideo from the page.
 */
RemoteVideo.prototype.remove = function() {
    SmallVideo.prototype.remove.call(this);

    this.removePresenceLabel();
    this.removeRemoteVideoMenu();
};

RemoteVideo.prototype.waitForPlayback = function(streamElement, stream) {

    const webRtcStream = stream.getOriginalStream();
    const isVideo = stream.isVideoTrack();

    if (!isVideo || webRtcStream.id === 'mixedmslabel') {
        return;
    }

    const self = this;

    // Triggers when video playback starts
    const onPlayingHandler = function() {
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
RemoteVideo.prototype.hasVideoStarted = function() {
    return this.wasVideoPlayed;
};

RemoteVideo.prototype.addRemoteStreamElement = function(stream) {
    if (!this.container) {
        return;
    }

    const isVideo = stream.isVideoTrack();

    isVideo ? this.videoStream = stream : this.audioStream = stream;

    if (isVideo) {
        this.setVideoType(stream.videoType);
    }

    if (!stream.getOriginalStream()) {
        return;
    }

    const streamElement = SmallVideo.createStreamElement(stream);

    // Put new stream element always in front
    UIUtils.prependChild(this.container, streamElement);

    $(streamElement).hide();

    // If the container is currently visible
    // we attach the stream to the element.
    if (!isVideo || (this.container.offsetParent !== null && isVideo)) {
        this.waitForPlayback(streamElement, stream);
        stream.attach(streamElement);
    }

    if (!isVideo) {
        this._audioStreamElement = streamElement;

        // If the remote video menu was created before the audio stream was
        // attached we need to update the menu in order to show the volume
        // slider.
        this.updateRemoteVideoMenu();
    }
};

/**
 * Triggers re-rendering of the display name using current instance state.
 *
 * @returns {void}
 */
RemoteVideo.prototype.updateDisplayName = function() {
    if (!this.container) {
        logger.warn(`Unable to set displayName - ${this.videoSpanId
        } does not exist`);

        return;
    }

    this._renderDisplayName({
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
    const menuSpan = this.$container.find('.remotevideomenu');

    if (menuSpan.length) {
        ReactDOM.unmountComponentAtNode(menuSpan.get(0));
        menuSpan.remove();
    }
};

/**
 * Mounts the {@code PresenceLabel} for displaying the participant's current
 * presence status.
 *
 * @return {void}
 */
RemoteVideo.prototype.addPresenceLabel = function() {
    const presenceLabelContainer
        = this.container.querySelector('.presence-label-container');

    if (presenceLabelContainer) {
        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <PresenceLabel
                        participantID = { this.id }
                        className = 'presence-label' />
                </I18nextProvider>
            </Provider>,
            presenceLabelContainer);
    }
};

/**
 * Unmounts the {@code PresenceLabel} component.
 *
 * @return {void}
 */
RemoteVideo.prototype.removePresenceLabel = function() {
    const presenceLabelContainer
        = this.container.querySelector('.presence-label-container');

    if (presenceLabelContainer) {
        ReactDOM.unmountComponentAtNode(presenceLabelContainer);
    }
};

RemoteVideo.createContainer = function(spanId) {
    const container = document.createElement('span');

    container.id = spanId;
    container.className = 'videocontainer';

    container.innerHTML = `
        <div class = 'videocontainer__background'></div>
        <div class = 'videocontainer__toptoolbar'></div>
        <div class = 'videocontainer__toolbar'></div>
        <div class = 'videocontainer__hoverOverlay'></div>
        <div class = 'displayNameContainer'></div>
        <div class = 'avatar-container'></div>
        <div class ='presence-label-container'></div>
        <span class = 'remotevideomenu'></span>`;

    const remoteVideosContainer
        = document.getElementById('filmstripRemoteVideosContainer');
    const localVideoContainer
        = document.getElementById('localVideoTileViewContainer');

    remoteVideosContainer.insertBefore(container, localVideoContainer);

    return container;
};

export default RemoteVideo;
