/* global $, APP, config */

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
import { Thumbnail, isVideoPlayable } from '../../../react/features/filmstrip';
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
     * @constructor
     */
    constructor(user) {
        super();

        this.user = user;
        this.id = user.getId();
        this.videoSpanId = `participant_${this.id}`;

        this.addRemoteVideoContainer();
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

        this.container.onclick = this._onContainerClick;
    }

    /**
     *
     */
    addRemoteVideoContainer() {
        this.container = createContainer(this.videoSpanId);
        this.$container = $(this.container);
        this.renderThumbnail();
        this._setThumbnailSize();
        this.initBrowserSpecificProperties();

        return this.container;
    }

    /**
     * Renders the thumbnail.
     */
    renderThumbnail(isHovered = false) {
        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <Thumbnail participantID = { this.id } isHovered = { isHovered } />
                </I18nextProvider>
            </Provider>, this.container);
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
        const elementID = `remoteVideo_${stream.getId()}`;
        const select = $(`#${elementID}`);

        select.remove();
        if (isVideo) {
            this._canPlayEventReceived = false;
        }

        logger.info(`Video removed ${this.id}`, select);

        this.updateView();
    }

    /**
     * The remote video is considered "playable" once the can play event has been received.
     *
     * @inheritdoc
     * @override
     */
    isVideoPlayable() {
        return isVideoPlayable(APP.store.getState(), this.id) && this._canPlayEventReceived;
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
        ReactDOM.unmountComponentAtNode(this.container);
        super.remove();
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

        if (!stream.getOriginalStream()) {
            logger.debug('Remote video stream has no original stream');

            return;
        }

        let streamElement = document.createElement('video');

        streamElement.autoplay = !config.testing?.noAutoPlayVideo;
        streamElement.id = `remoteVideo_${stream.getId()}`;

        // Put new stream element always in front
        streamElement = UIUtils.prependChild(this.container, streamElement);

        this.waitForPlayback(streamElement, stream);
        stream.attach(streamElement);

        if (isVideo && isTestModeEnabled(APP.store.getState())) {

            const cb = name => APP.store.dispatch(updateLastTrackVideoMediaEvent(stream, name));

            containerEvents.forEach(event => {
                streamElement.addEventListener(event, cb.bind(this, event));
            });
        }
    }
}
