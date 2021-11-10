/* global APP  */

import Logger from '@jitsi/logger';

import { MEDIA_TYPE, VIDEO_TYPE } from '../../../react/features/base/media';
import {
    getPinnedParticipant,
    getParticipantById
} from '../../../react/features/base/participants';
import { getTrackByMediaTypeAndParticipant } from '../../../react/features/base/tracks';

import LargeVideoManager from './LargeVideoManager';
import { VIDEO_CONTAINER_TYPE } from './VideoContainer';

const logger = Logger.getLogger(__filename);
let largeVideo;

const VideoLayout = {
    /**
     * Handler for local flip X changed event.
     */
    onLocalFlipXChanged() {
        if (largeVideo) {
            const { store } = APP;
            const { localFlipX } = store.getState()['features/base/settings'];

            largeVideo.onLocalFlipXChange(localFlipX);
        }
    },

    /**
     * Cleans up state of this singleton {@code VideoLayout}.
     *
     * @returns {void}
     */
    reset() {
        this._resetLargeVideo();
    },

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
     * Sets the audio level of the video elements associated to the given id.
     *
     * @param id the video identifier in the form it comes from the library
     * @param lvl the new audio level to update to
     */
    setAudioLevel(id, lvl) {
        if (largeVideo && id === largeVideo.id) {
            largeVideo.updateLargeVideoAudioLevel(lvl);
        }
    },

    /**
     * FIXME get rid of this method once muted indicator are reactified (by
     * making sure that user with no tracks is displayed as muted )
     *
     * If participant has no tracks will make the UI display muted status.
     * @param {string} participantId
     */
    updateVideoMutedForNoTracks(participantId) {
        const participant = APP.conference.getParticipantById(participantId);

        if (participant && !participant.getTracksByMediaType('video').length) {
            VideoLayout._updateLargeVideoIfDisplayed(participantId, true);
        }
    },

    /**
     * Return the type of the remote video.
     * @param id the id for the remote video
     * @returns {String} the video type video or screen.
     */
    getRemoteVideoType(id) {
        const state = APP.store.getState();
        const participant = getParticipantById(state, id);

        if (participant?.isFakeParticipant) {
            return VIDEO_TYPE.CAMERA;
        }

        const videoTrack = getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, id);

        return videoTrack?.videoType;
    },

    getPinnedId() {
        const { id } = getPinnedParticipant(APP.store.getState()) || {};

        return id || null;
    },

    /**
     * Shows/hides warning about a user's connectivity issues.
     *
     * @param {string} id - The ID of the remote participant(MUC nickname).
     * @returns {void}
     */
    onParticipantConnectionStatusChanged(id) {
        if (APP.conference.isLocalId(id)) {

            return;
        }

        // We have to trigger full large video update to transition from
        // avatar to video on connectivity restored.
        this._updateLargeVideoIfDisplayed(id, true);
    },

    /**
     * On last N change event.
     *
     * @param endpointsLeavingLastN the list currently leaving last N
     * endpoints
     * @param endpointsEnteringLastN the list currently entering last N
     * endpoints
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

    changeUserAvatar(id, avatarUrl) {
        if (this.isCurrentlyOnLarge(id)) {
            largeVideo.updateAvatar(avatarUrl);
        }
    },

    isLargeVideoVisible() {
        return this.isLargeContainerTypeVisible(VIDEO_CONTAINER_TYPE);
    },

    /**
     * @return {LargeContainer} the currently displayed container on large
     * video.
     */
    getCurrentlyOnLargeContainer() {
        return largeVideo.getCurrentContainer();
    },

    isCurrentlyOnLarge(id) {
        return largeVideo && largeVideo.id === id;
    },

    updateLargeVideo(id, forceUpdate) {
        if (!largeVideo) {
            return;
        }
        const currentContainer = largeVideo.getCurrentContainer();
        const currentContainerType = largeVideo.getCurrentContainerType();
        const isOnLarge = this.isCurrentlyOnLarge(id);
        const state = APP.store.getState();
        const videoTrack = getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, id);
        const videoStream = videoTrack?.jitsiTrack;

        if (isOnLarge && !forceUpdate
                && LargeVideoManager.isVideoContainer(currentContainerType)
                && videoStream) {
            const currentStreamId = currentContainer.getStreamID();
            const newStreamId = videoStream?.getId() || null;

            // FIXME it might be possible to get rid of 'forceUpdate' argument
            if (currentStreamId !== newStreamId) {
                logger.debug('Enforcing large video update for stream change');
                forceUpdate = true; // eslint-disable-line no-param-reassign
            }
        }

        if (!isOnLarge || forceUpdate) {
            const videoType = this.getRemoteVideoType(id);


            largeVideo.updateLargeVideo(
                id,
                videoStream,
                videoType || VIDEO_TYPE.CAMERA
            ).catch(() => {
                // do nothing
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
     * @returns Promise
     */
    showLargeVideoContainer(type, show) {
        if (!largeVideo) {
            return Promise.reject();
        }

        const isVisible = this.isLargeContainerTypeVisible(type);

        if (isVisible === show) {
            return Promise.resolve();
        }

        let containerTypeToShow = type;

        // if we are hiding a container and there is focusedVideo
        // (pinned remote video) use its video type,
        // if not then use default type - large video

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
     * Returns the id of the current video shown on large.
     * Currently used by tests (torture).
     */
    getLargeVideoID() {
        return largeVideo && largeVideo.id;
    },

    /**
     * Returns the the current video shown on large.
     * Currently used by tests (torture).
     */
    getLargeVideo() {
        return largeVideo;
    },

    /**
     * Returns the wrapper jquery selector for the largeVideo
     * @returns {JQuerySelector} the wrapper jquery selector for the largeVideo
     */
    getLargeVideoWrapper() {
        return this.getCurrentlyOnLargeContainer().$wrapper;
    },

    /**
     * Helper method to invoke when the video layout has changed and elements
     * have to be re-arranged and resized.
     *
     * @returns {void}
     */
    refreshLayout() {
        VideoLayout.resizeVideoArea();
    },

    /**
     * Cleans up any existing largeVideo instance.
     *
     * @private
     * @returns {void}
     */
    _resetLargeVideo() {
        if (largeVideo) {
            largeVideo.destroy();
        }

        largeVideo = null;
    },

    /**
     * Triggers an update of large video if the passed in participant is
     * currently displayed on large video.
     *
     * @param {string} participantId - The participant ID that should trigger an
     * update of large video if displayed.
     * @param {boolean} force - Whether or not the large video update should
     * happen no matter what.
     * @returns {void}
     */
    _updateLargeVideoIfDisplayed(participantId, force = false) {
        if (this.isCurrentlyOnLarge(participantId)) {
            this.updateLargeVideo(participantId, force);
        }
    },

    /**
     * Handles window resizes.
     */
    onResize() {
        VideoLayout.resizeVideoArea();
    }
};

export default VideoLayout;
