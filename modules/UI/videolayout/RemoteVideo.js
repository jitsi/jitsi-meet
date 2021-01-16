/* global $, APP, interfaceConfig */

/* eslint-disable no-unused-vars */
import { AtlasKitThemeProvider } from '@atlaskit/theme';
import Logger from 'jitsi-meet-logger';
import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import { i18next } from '../../../react/features/base/i18n';
import {
    JitsiParticipantConnectionStatus
} from '../../../react/features/base/lib-jitsi-meet';
import { getParticipantById } from '../../../react/features/base/participants';
import { isTestModeEnabled } from '../../../react/features/base/testing';
import { updateLastTrackVideoMediaEvent } from '../../../react/features/base/tracks';
import { PresenceLabel } from '../../../react/features/presence-status';
import { stopController, requestRemoteControl } from '../../../react/features/remote-control';
import { RemoteVideoMenuTriggerButton } from '../../../react/features/remote-video-menu';
/* eslint-enable no-unused-vars */
import UIUtils from '../util/UIUtil';

import SmallVideo from './SmallVideo';

const logger = Logger.getLogger(__filename);

/**
 * List of container events that we are going to process, will be added as listener to the
 * container for every event in the list. The latest event will be stored in redux.
 */
const containerEvents = [
    'abort', 'canplay', 'canplaythrough', 'emptied', 'ended', 'error', 'loadeddata', 'loadedmetadata', 'loadstart',
    'pause', 'play', 'playing', 'ratechange', 'stalled', 'suspend', 'waiting'
];

/**
 *
 * @param {*} spanId
 */
function createContainer(spanId) {
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
}

/**
 *
 */
export default class RemoteVideo extends SmallVideo {
    /**
     * Creates new instance of the <tt>RemoteVideo</tt>.
     * @param user {JitsiParticipant} the user for whom remote video instance will
     * be created.
     * @param {VideoLayout} VideoLayout the video layout instance.
     * @constructor
     */
    constructor(user, VideoLayout) {
        super(VideoLayout);

        this.user = user;
        this.id = user.getId();
        this.videoSpanId = `participant_${this.id}`;

        this._audioStreamElement = null;
        this.statsPopoverLocation = interfaceConfig.VERTICAL_FILMSTRIP ? 'left bottom' : 'top center';
        this.addRemoteVideoContainer();
        this.updateIndicators();
        this.updateDisplayName();
        this.bindHoverHandler();
        this.flipX = false;
        this.isLocal = false;

        /**
         * The flag is set to <tt>true</tt> after the 'canplay' event has been
         * triggered on the current video element. It goes back to <tt>false</tt>
         * when the stream is removed. It is used to determine whether the video
         * playback has ever started.
         * @type {boolean}
         */
        this._canPlayEventReceived = false;

        // Bind event handlers so they are only bound once for every instance.
        // TODO The event handlers should be turned into actions so changes can be
        // handled through reducers and middleware.
        this._setAudioVolume = this._setAudioVolume.bind(this);

        this.container.onclick = this._onContainerClick;
    }

    /**
     *
     */
    addRemoteVideoContainer() {
        this.container = createContainer(this.videoSpanId);
        this.$container = $(this.container);
        this.initializeAvatar();
        this._setThumbnailSize();
        this.initBrowserSpecificProperties();
        this.updateRemoteVideoMenu();
        this.updateStatusBar();
        this.addAudioLevelIndicator();
        this.addPresenceLabel();

        return this.container;
    }

    /**
     * Generates the popup menu content.
     *
     * @returns {Element|*} the constructed element, containing popup menu items
     * @private
     */
    _generatePopupContent() {
        const remoteVideoMenuContainer
            = this.container.querySelector('.remotevideomenu');

        if (!remoteVideoMenuContainer) {
            return;
        }

        const initialVolumeValue = this._audioStreamElement && this._audioStreamElement.volume;

        // hide volume when in silent mode
        const onVolumeChange
            = APP.store.getState()['features/base/config'].startSilent ? undefined : this._setAudioVolume;

        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <AtlasKitThemeProvider mode = 'dark'>
                        <RemoteVideoMenuTriggerButton
                            initialVolumeValue = { initialVolumeValue }
                            onMenuDisplay
                                = {this._onRemoteVideoMenuDisplay.bind(this)}
                            onVolumeChange = { onVolumeChange }
                            participantID = { this.id } />
                    </AtlasKitThemeProvider>
                </I18nextProvider>
            </Provider>,
            remoteVideoMenuContainer);
    }

    /**
     *
     */
    _onRemoteVideoMenuDisplay() {
        this.updateRemoteVideoMenu();
    }

    /**
     * Change the remote participant's volume level.
     *
     * @param {int} newVal - The value to set the slider to.
     */
    _setAudioVolume(newVal) {
        if (this._audioStreamElement) {
            this._audioStreamElement.volume = newVal;
        }
    }

    /**
     * Updates the remote video menu.
     */
    updateRemoteVideoMenu() {
        this._generatePopupContent();
    }

    /**
     * Removes the remote stream element corresponding to the given stream and
     * parent container.
     *
     * @param stream the MediaStream
     * @param isVideo <tt>true</tt> if given <tt>stream</tt> is a video one.
     */
    removeRemoteStreamElement(stream) {
        if (!this.container) {
            return false;
        }

        const isVideo = stream.isVideoTrack();
        const elementID = SmallVideo.getStreamElementID(stream);
        const select = $(`#${elementID}`);

        select.remove();
        if (isVideo) {
            this._canPlayEventReceived = false;
        }

        logger.info(`${isVideo ? 'Video' : 'Audio'} removed ${this.id}`, select);

        if (stream === this.videoStream) {
            this.videoStream = null;
        }

        this.updateView();
    }

    /**
     * The remote video is considered "playable" once the can play event has been received.
     *
     * @inheritdoc
     * @override
     */
    isVideoPlayable() {
        const participant = getParticipantById(APP.store.getState(), this.id);
        const { connectionStatus } = participant || {};

        return (
            super.isVideoPlayable()
                && this._canPlayEventReceived
                && connectionStatus === JitsiParticipantConnectionStatus.ACTIVE
        );
    }

    /**
     * @inheritDoc
     */
    updateView() {
        this.$container.toggleClass('audio-only', APP.conference.isAudioOnly());
        super.updateView();
    }

    /**
     * Removes RemoteVideo from the page.
     */
    remove() {
        super.remove();
        this.removePresenceLabel();
        this.removeRemoteVideoMenu();
    }

    /**
     *
     * @param {*} streamElement
     * @param {*} stream
     */
    waitForPlayback(streamElement, stream) {
        $(streamElement).hide();

        const webRtcStream = stream.getOriginalStream();
        const isVideo = stream.isVideoTrack();

        if (!isVideo || webRtcStream.id === 'mixedmslabel') {
            return;
        }

        const listener = () => {
            this._canPlayEventReceived = true;

            logger.info(`${this.id} video is now active`, streamElement);
            if (streamElement) {
                $(streamElement).show();
            }

            streamElement.removeEventListener('canplay', listener);

            // Refresh to show the video
            this.updateView();
        };

        streamElement.addEventListener('canplay', listener);
    }

    /**
     *
     * @param {*} stream
     */
    addRemoteStreamElement(stream) {
        if (!this.container) {
            logger.debug('Not attaching remote stream due to no container');

            return;
        }

        const isVideo = stream.isVideoTrack();

        if (isVideo) {
            this.videoStream = stream;
        } else {
            this.audioStream = stream;
        }

        if (!stream.getOriginalStream()) {
            logger.debug('Remote video stream has no original stream');

            return;
        }

        let streamElement = SmallVideo.createStreamElement(stream);

        // Put new stream element always in front
        streamElement = UIUtils.prependChild(this.container, streamElement);

        this.waitForPlayback(streamElement, stream);
        stream.attach(streamElement);

        if (!isVideo) {
            this._audioStreamElement = streamElement;

            // If the remote video menu was created before the audio stream was
            // attached we need to update the menu in order to show the volume
            // slider.
            this.updateRemoteVideoMenu();
        } else if (isTestModeEnabled(APP.store.getState())) {

            const cb = name => APP.store.dispatch(updateLastTrackVideoMediaEvent(stream, name));

            containerEvents.forEach(event => {
                streamElement.addEventListener(event, cb.bind(this, event));
            });
        }
    }

    /**
     * Triggers re-rendering of the display name using current instance state.
     *
     * @returns {void}
     */
    updateDisplayName() {
        if (!this.container) {
            logger.warn(`Unable to set displayName - ${this.videoSpanId} does not exist`);

            return;
        }

        this._renderDisplayName({
            elementID: `${this.videoSpanId}_name`,
            participantID: this.id
        });
    }

    /**
     * Removes remote video menu element from video element identified by
     * given <tt>videoElementId</tt>.
     *
     * @param videoElementId the id of local or remote video element.
     */
    removeRemoteVideoMenu() {
        const menuSpan = this.$container.find('.remotevideomenu');

        if (menuSpan.length) {
            ReactDOM.unmountComponentAtNode(menuSpan.get(0));
            menuSpan.remove();
        }
    }

    /**
     * Mounts the {@code PresenceLabel} for displaying the participant's current
     * presence status.
     *
     * @return {void}
     */
    addPresenceLabel() {
        const presenceLabelContainer = this.container.querySelector('.presence-label-container');

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
    }

    /**
     * Unmounts the {@code PresenceLabel} component.
     *
     * @return {void}
     */
    removePresenceLabel() {
        const presenceLabelContainer = this.container.querySelector('.presence-label-container');

        if (presenceLabelContainer) {
            ReactDOM.unmountComponentAtNode(presenceLabelContainer);
        }
    }
}
