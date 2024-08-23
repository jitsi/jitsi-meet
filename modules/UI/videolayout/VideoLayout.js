/* global APP */

import Logger from '@jitsi/logger';
import { MEDIA_TYPE, VIDEO_TYPE } from '../../../react/features/base/media/constants';
import {
    getParticipantById,
    getPinnedParticipant,
    isScreenShareParticipantById
} from '../../../react/features/base/participants/functions';
import {
    getTrackByMediaTypeAndParticipant,
    getVideoTrackByParticipant
} from '../../../react/features/base/tracks/functions.any';

import LargeVideoManager from './LargeVideoManager';
import { VIDEO_CONTAINER_TYPE } from './VideoContainer';

const logger = Logger.getLogger(__filename);
let largeVideo;

const VideoLayout = {
    /**
     * Handles local flip X change event.
     * @param {boolean} localFlipX - The new flip X value.
     */
    onLocalFlipXChanged(localFlipX) {
        if (largeVideo) {
            largeVideo.onLocalFlipXChange(localFlipX);
        }
    },

    /**
     * Resets the state of the VideoLayout.
     */
    reset() {
        this._resetLargeVideo();
    },

    /**
     * Initializes the large video manager.
     */
    initLargeVideo() {
        this._resetLargeVideo();
        largeVideo = new LargeVideoManager();

        const { store } = APP;
        const { localFlipX } = store.getState()['features/base/settings'];

        if (typeof localFlipX === 'boolean') {
            largeVideo.onLocalFlipXChange(localFlipX);
        }
        largeVideo.updateContainerSize();
    },

    /**
     * Updates the audio level of the large video if the id matches.
     * @param {string} id - The video identifier.
     * @param {number} lvl - The new audio level.
     */
    setAudioLevel(id, lvl) {
        if (largeVideo && id === largeVideo.id) {
            largeVideo.updateLargeVideoAudioLevel(lvl);
        }
    },

    /**
     * Updates the large video if a participant has no video tracks.
     * @param {string} participantId - The participant ID.
     */
    updateVideoMutedForNoTracks(participantId) {
        const participant = APP.conference.getParticipantById(participantId);
        if (participant && !participant.getTracksByMediaType('video').length) {
            this._updateLargeVideoIfDisplayed(participantId, true);
        }
    },

    /**
     * Gets the remote video type based on the id.
     * @param {string} id - The remote video id.
     * @returns {string} The video type.
     */
    getRemoteVideoType(id) {
        const state = APP.store.getState();
        const participant = getParticipantById(state, id);
        const isScreenShare = isScreenShareParticipantById(state, id);

        if (participant?.fakeParticipant && !isScreenShare) {
            return VIDEO_TYPE.CAMERA;
        }

        if (isScreenShare) {
            return VIDEO_TYPE.DESKTOP;
        }

        const videoTrack = getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, id);
        return videoTrack?.videoType;
    },

    getPinnedId() {
        const { id } = getPinnedParticipant(APP.store.getState()) || {};
        return id || null;
    },

    /**
     * Handles changes in last N endpoints.
     * @param {Array} endpointsLeavingLastN - Endpoints leaving last N.
     * @param {Array} endpointsEnteringLastN - Endpoints entering last N.
     */
    onLastNEndpointsChanged(endpointsLeavingLastN, endpointsEnteringLastN) {
        if (endpointsLeavingLastN) {
            endpointsLeavingLastN.forEach(this._updateLargeVideoIfDisplayed, this);
        }
        if (endpointsEnteringLastN) {
            endpointsEnteringLastN.forEach(this._updateLargeVideoIfDisplayed, this);
        }
    },

    /**
     * Resizes the video area.
     */
    resizeVideoArea() {
        if (largeVideo) {
            largeVideo.updateContainerSize();
            largeVideo.resize(false);
        }
    },

    isLargeVideoVisible() {
        return this.isLargeContainerTypeVisible(VIDEO_CONTAINER_TYPE);
    },

    /**
     * Gets the currently displayed container on large video.
     * @returns {LargeContainer} The large video container.
     */
    getCurrentlyOnLargeContainer() {
        return largeVideo.getCurrentContainer();
    },

    isCurrentlyOnLarge(id) {
        return largeVideo && largeVideo.id === id;
    },

    /**
     * Updates the large video with a new stream if necessary.
     * @param {string} id - The participant id.
     * @param {boolean} forceUpdate - Whether to force an update.
     * @param {boolean} forceStreamToReattach - Whether to force the stream to reattach.
     */
    updateLargeVideo(id, forceUpdate, forceStreamToReattach = false) {
        if (!largeVideo) {
            logger.debug(`Ignoring large video update with user id ${id}: large video not initialized yet!`);
            return;
        }

        const currentContainer = largeVideo.getCurrentContainer();
        const currentContainerType = largeVideo.getCurrentContainerType();
        const isOnLarge = this.isCurrentlyOnLarge(id);
        const state = APP.store.getState();
        const participant = getParticipantById(state, id);
        const videoTrack = getVideoTrackByParticipant(state, participant);
        const videoStream = videoTrack?.jitsiTrack;

        if (videoStream && forceStreamToReattach) {
            videoStream.forceStreamToReattach = forceStreamToReattach;
        }

        if (isOnLarge && !forceUpdate
                && LargeVideoManager.isVideoContainer(currentContainerType)
                && videoStream) {
            const currentStreamId = currentContainer.getStreamID();
            const newStreamId = videoStream?.getId() || null;

            if (currentStreamId !== newStreamId) {
                logger.debug('Enforcing large video update for stream change');
                forceUpdate = true; // eslint-disable-line no-param-reassign
            }
        }

        if (!isOnLarge || forceUpdate) {
            const videoType = this.getRemoteVideoType(id);
            largeVideo.updateLargeVideo(id, videoStream, videoType || VIDEO_TYPE.CAMERA)
                .catch(error => {
                    logger.error('Failed to update large video', error);
                });
        }
    },

    addLargeVideoContainer(type, container) {
        largeVideo && largeVideo.addContainer(type, container);
    },

    removeLargeVideoContainer(type) {
        largeVideo && largeVideo.removeContainer(type);
    },

    /**
     * Shows or hides the large video container based on type.
     * @param {string} type - The container type.
     * @param {boolean} show - Whether to show or hide.
     * @returns {Promise} Resolves when done.
     */
    showLargeVideoContainer(type, show) {
        if (!largeVideo) {
            return Promise.reject(new Error('Large video not initialized'));
        }

        const isVisible = this.isLargeContainerTypeVisible(type);

        if (isVisible === show) {
            return Promise.resolve();
        }

        let containerTypeToShow = type;

        if (!show) {
            const pinnedId = this.getPinnedId();
            if (pinnedId) {
                containerTypeToShow = this.getRemoteVideoType(pinnedId);
            } else {
                containerTypeToShow = VIDEO_CONTAINER_TYPE;
            }
        }

        return largeVideo.showContainer(containerTypeToShow);
    },

    isLargeContainerTypeVisible(type) {
        return largeVideo && largeVideo.state === type;
    },

    /**
     * Gets the id of the current large video.
     * @returns {string|null} The large video id.
     */
    getLargeVideoID() {
        return largeVideo && largeVideo.id;
    },

    /**
     * Gets the current large video instance.
     * @returns {LargeVideoManager|null} The large video instance.
     */
    getLargeVideo() {
        return largeVideo;
    },

    /**
     * Gets the wrapper jquery selector for the large video.
     * @returns {JQuerySelector} The large video wrapper selector.
     */
    getLargeVideoWrapper() {
        return this.getCurrentlyOnLargeContainer().$wrapper;
    },

    /**
     * Refreshes the video layout.
     */
    refreshLayout() {
        this.resizeVideoArea();
    },

    /**
     * Resets the large video instance.
     * @private
     */
    _resetLargeVideo() {
        if (largeVideo) {
            largeVideo.destroy();
        }
        largeVideo = null;
    },

    /**
     * Updates the large video if the participant is displayed on large video.
     * @param {string} participantId - The participant ID.
     * @param {boolean} force - Whether to force an update.
     * @private
     */
    _updateLargeVideoIfDisplayed(participantId, force = false) {
        if (this.isCurrentlyOnLarge(participantId)) {
            this.updateLargeVideo(participantId, force, false);
        }
    },

    /**
     * Handles window resize events.
     */
    onResize() {
        this.resizeVideoArea();
    }
};

export default VideoLayout;
