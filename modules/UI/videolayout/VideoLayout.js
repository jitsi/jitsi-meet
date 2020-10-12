/* global APP, $, interfaceConfig  */

import Logger from 'jitsi-meet-logger';

import { MEDIA_TYPE, VIDEO_TYPE } from '../../../react/features/base/media';
import {
    getLocalParticipant as getLocalParticipantFromStore,
    getPinnedParticipant,
    getParticipantById,
    pinParticipant
} from '../../../react/features/base/participants';
import { getTrackByMediaTypeAndParticipant } from '../../../react/features/base/tracks';
import UIEvents from '../../../service/UI/UIEvents';
import { SHARED_VIDEO_CONTAINER_TYPE } from '../shared_video/SharedVideo';
import SharedVideoThumb from '../shared_video/SharedVideoThumb';

import LargeVideoManager from './LargeVideoManager';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';
import { VIDEO_CONTAINER_TYPE } from './VideoContainer';

const logger = Logger.getLogger(__filename);

const remoteVideos = {};
let localVideoThumbnail = null;

let eventEmitter = null;

let largeVideo;

/**
 * flipX state of the localVideo
 */
let localFlipX = null;

/**
 * Handler for local flip X changed event.
 * @param {Object} val
 */
function onLocalFlipXChanged(val) {
    localFlipX = val;
    if (largeVideo) {
        largeVideo.onLocalFlipXChange(val);
    }
}

/**
 * Returns an array of all thumbnails in the filmstrip.
 *
 * @private
 * @returns {Array}
 */
function getAllThumbnails() {
    return [
        ...localVideoThumbnail ? [ localVideoThumbnail ] : [],
        ...Object.values(remoteVideos)
    ];
}

/**
 * Private helper to get the redux representation of the local participant.
 *
 * @private
 * @returns {Object}
 */
function getLocalParticipant() {
    return getLocalParticipantFromStore(APP.store.getState());
}

const VideoLayout = {
    init(emitter) {
        eventEmitter = emitter;

        localVideoThumbnail = new LocalVideo(
            VideoLayout,
            emitter,
            this._updateLargeVideoIfDisplayed.bind(this));

        this.registerListeners();
    },

    /**
     * Registering listeners for UI events in Video layout component.
     *
     * @returns {void}
     */
    registerListeners() {
        eventEmitter.addListener(UIEvents.LOCAL_FLIPX_CHANGED,
            onLocalFlipXChanged);
    },

    /**
     * Cleans up state of this singleton {@code VideoLayout}.
     *
     * @returns {void}
     */
    reset() {
        this._resetLargeVideo();
        this._resetFilmstrip();
    },

    initLargeVideo() {
        this._resetLargeVideo();

        largeVideo = new LargeVideoManager(eventEmitter);
        if (localFlipX) {
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
        const smallVideo = this.getSmallVideo(id);

        if (smallVideo) {
            smallVideo.updateAudioLevelIndicator(lvl);
        }

        if (largeVideo && id === largeVideo.id) {
            largeVideo.updateLargeVideoAudioLevel(lvl);
        }
    },

    changeLocalVideo(stream) {
        const localId = getLocalParticipant().id;

        this.onVideoTypeChanged(localId, stream.videoType);

        localVideoThumbnail.changeVideo(stream);

        this._updateLargeVideoIfDisplayed(localId);
    },

    /**
     * Get's the localID of the conference and set it to the local video
     * (small one). This needs to be called as early as possible, when muc is
     * actually joined. Otherwise events can come with information like email
     * and setting them assume the id is already set.
     */
    mucJoined() {
        // FIXME: replace this call with a generic update call once SmallVideo
        // only contains a ReactElement. Then remove this call once the
        // Filmstrip is fully in React.
        localVideoThumbnail.updateIndicators();
    },

    /**
     * Shows/hides local video.
     * @param {boolean} true to make the local video visible, false - otherwise
     */
    setLocalVideoVisible(visible) {
        localVideoThumbnail.setVisible(visible);
    },

    onRemoteStreamAdded(stream) {
        const id = stream.getParticipantId();
        const remoteVideo = remoteVideos[id];

        logger.debug(`Received a new ${stream.getType()} stream for ${id}`);

        if (!remoteVideo) {
            logger.debug('No remote video element to add stream');

            return;
        }

        remoteVideo.addRemoteStreamElement(stream);

        // Make sure track's muted state is reflected
        if (stream.getType() === 'audio') {
            this.onAudioMute(id, stream.isMuted());
        } else {
            this.onVideoMute(id, stream.isMuted());
            remoteVideo.setScreenSharing(stream.videoType === 'desktop');
        }
    },

    onRemoteStreamRemoved(stream) {
        const id = stream.getParticipantId();
        const remoteVideo = remoteVideos[id];

        // Remote stream may be removed after participant left the conference.

        if (remoteVideo) {
            remoteVideo.removeRemoteStreamElement(stream);
            remoteVideo.setScreenSharing(false);
        }

        this.updateMutedForNoTracks(id, stream.getType());
    },

    /**
     * FIXME get rid of this method once muted indicator are reactified (by
     * making sure that user with no tracks is displayed as muted )
     *
     * If participant has no tracks will make the UI display muted status.
     * @param {string} participantId
     * @param {string} mediaType 'audio' or 'video'
     */
    updateMutedForNoTracks(participantId, mediaType) {
        const participant = APP.conference.getParticipantById(participantId);

        if (participant && !participant.getTracksByMediaType(mediaType).length) {
            if (mediaType === 'audio') {
                APP.UI.setAudioMuted(participantId, true);
            } else if (mediaType === 'video') {
                APP.UI.setVideoMuted(participantId, true);
            } else {
                logger.error(`Unsupported media type: ${mediaType}`);
            }
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
            return SHARED_VIDEO_CONTAINER_TYPE;
        }

        const videoTrack = getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, id);

        return videoTrack?.videoType;
    },

    isPinned(id) {
        return id === this.getPinnedId();
    },

    getPinnedId() {
        const { id } = getPinnedParticipant(APP.store.getState()) || {};

        return id || null;
    },

    /**
     * Triggers a thumbnail to pin or unpin itself.
     *
     * @param {number} videoNumber - The index of the video to toggle pin on.
     * @private
     */
    togglePin(videoNumber) {
        const videos = getAllThumbnails();
        const videoView = videos[videoNumber];

        videoView && videoView.togglePin();
    },

    /**
     * Callback invoked to update display when the pin participant has changed.
     *
     * @paramn {string|null} pinnedParticipantID - The participant ID of the
     * participant that is pinned or null if no one is pinned.
     * @returns {void}
     */
    onPinChange(pinnedParticipantID) {
        if (interfaceConfig.filmStripOnly) {
            return;
        }

        getAllThumbnails().forEach(thumbnail =>
            thumbnail.focus(pinnedParticipantID === thumbnail.getId()));
    },

    /**
     * Creates a participant container for the given id.
     *
     * @param {Object} participant - The redux representation of a remote
     * participant.
     * @returns {void}
     */
    addRemoteParticipantContainer(participant) {
        if (!participant || participant.local) {
            return;
        } else if (participant.isFakeParticipant) {
            const sharedVideoThumb = new SharedVideoThumb(
                participant,
                SHARED_VIDEO_CONTAINER_TYPE,
                VideoLayout);

            this.addRemoteVideoContainer(participant.id, sharedVideoThumb);

            return;
        }

        const id = participant.id;
        const jitsiParticipant = APP.conference.getParticipantById(id);
        const remoteVideo = new RemoteVideo(jitsiParticipant, VideoLayout);

        this._setRemoteControlProperties(jitsiParticipant, remoteVideo);
        this.addRemoteVideoContainer(id, remoteVideo);

        this.updateMutedForNoTracks(id, 'audio');
        this.updateMutedForNoTracks(id, 'video');
    },

    /**
     * Adds remote video container for the given id and <tt>SmallVideo</tt>.
     *
     * @param {string} the id of the video to add
     * @param {SmallVideo} smallVideo the small video instance to add as a
     * remote video
     */
    addRemoteVideoContainer(id, remoteVideo) {
        remoteVideos[id] = remoteVideo;

        // Initialize the view
        remoteVideo.updateView();
    },

    // FIXME: what does this do???
    remoteVideoActive(videoElement, resourceJid) {
        logger.info(`${resourceJid} video is now active`, videoElement);
        if (videoElement) {
            $(videoElement).show();
        }
        this._updateLargeVideoIfDisplayed(resourceJid, true);
    },

    /**
     * On audio muted event.
     */
    onAudioMute(id, isMuted) {
        if (APP.conference.isLocalId(id)) {
            localVideoThumbnail.showAudioIndicator(isMuted);
        } else {
            const remoteVideo = remoteVideos[id];

            if (!remoteVideo) {
                return;
            }

            remoteVideo.showAudioIndicator(isMuted);
            remoteVideo.updateRemoteVideoMenu();
        }
    },

    /**
     * On video muted event.
     */
    onVideoMute(id, value) {
        if (APP.conference.isLocalId(id)) {
            localVideoThumbnail && localVideoThumbnail.setVideoMutedView(value);
        } else {
            const remoteVideo = remoteVideos[id];

            if (remoteVideo) {
                remoteVideo.setVideoMutedView(value);
            }
        }

        // large video will show avatar instead of muted stream
        this._updateLargeVideoIfDisplayed(id, true);
    },

    /**
     * Display name changed.
     */
    onDisplayNameChanged(id) {
        if (id === 'localVideoContainer'
            || APP.conference.isLocalId(id)) {
            localVideoThumbnail.updateDisplayName();
        } else {
            const remoteVideo = remoteVideos[id];

            if (remoteVideo) {
                remoteVideo.updateDisplayName();
            }
        }
    },

    /**
     * On dominant speaker changed event.
     *
     * @param {string} id - The participant ID of the new dominant speaker.
     * @returns {void}
     */
    onDominantSpeakerChanged(id) {
        getAllThumbnails().forEach(thumbnail =>
            thumbnail.showDominantSpeakerIndicator(id === thumbnail.getId()));
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

        const remoteVideo = remoteVideos[id];

        if (remoteVideo) {
            // Updating only connection status indicator is not enough, because
            // when we the connection is restored while the avatar was displayed
            // (due to 'muted while disconnected' condition) we may want to show
            // the video stream again and in order to do that the display mode
            // must be updated.
            // remoteVideo.updateConnectionStatusIndicator(isActive);
            remoteVideo.updateView();
        }
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
            endpointsLeavingLastN.forEach(this._updateRemoteVideo, this);
        }

        if (endpointsEnteringLastN) {
            endpointsEnteringLastN.forEach(this._updateRemoteVideo, this);
        }
    },

    /**
     * Updates remote video by id if it exists.
     * @param {string} id of the remote video
     * @private
     */
    _updateRemoteVideo(id) {
        const remoteVideo = remoteVideos[id];

        if (remoteVideo) {
            remoteVideo.updateView();
            this._updateLargeVideoIfDisplayed(id);
        }
    },

    /**
     * Hides all the indicators
     */
    hideStats() {
        for (const video in remoteVideos) { // eslint-disable-line guard-for-in
            const remoteVideo = remoteVideos[video];

            if (remoteVideo) {
                remoteVideo.removeConnectionIndicator();
            }
        }
        localVideoThumbnail.removeConnectionIndicator();
    },

    removeParticipantContainer(id) {
        // Unlock large video
        if (this.getPinnedId() === id) {
            logger.info('Focused video owner has left the conference');
            APP.store.dispatch(pinParticipant(null));
        }

        const remoteVideo = remoteVideos[id];

        if (remoteVideo) {
            // Remove remote video
            logger.info(`Removing remote video: ${id}`);
            delete remoteVideos[id];
            remoteVideo.remove();
        } else {
            logger.warn(`No remote video for ${id}`);
        }
    },

    onVideoTypeChanged(id, newVideoType) {
        const remoteVideo = remoteVideos[id];

        if (!remoteVideo) {
            return;
        }

        logger.info('Peer video type changed: ', id, newVideoType);
        remoteVideo.setScreenSharing(newVideoType === 'desktop');
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

    getSmallVideo(id) {
        if (APP.conference.isLocalId(id)) {
            return localVideoThumbnail;
        }

        return remoteVideos[id];

    },

    changeUserAvatar(id, avatarUrl) {
        const smallVideo = VideoLayout.getSmallVideo(id);

        if (smallVideo) {
            smallVideo.initializeAvatar();
        } else {
            logger.warn(
                `Missed avatar update - no small video yet for ${id}`
            );
        }
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

    /**
     * Triggers an update of remote video and large video displays so they may
     * pick up any state changes that have occurred elsewhere.
     *
     * @returns {void}
     */
    updateAllVideos() {
        const displayedUserId = this.getLargeVideoID();

        if (displayedUserId) {
            this.updateLargeVideo(displayedUserId, true);
        }

        Object.keys(remoteVideos).forEach(video => {
            remoteVideos[video].updateView();
        });
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

        const currentId = largeVideo.id;
        let oldSmallVideo;

        if (currentId) {
            oldSmallVideo = this.getSmallVideo(currentId);
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

        return largeVideo.showContainer(containerTypeToShow)
            .then(() => {
                if (oldSmallVideo) {
                    oldSmallVideo && oldSmallVideo.updateView();
                }
            });
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
     * Sets the flipX state of the local video.
     * @param {boolean} true for flipped otherwise false;
     */
    setLocalFlipX(val) {
        this.localFlipX = val;
    },

    /**
     * Handles user's features changes.
     */
    onUserFeaturesChanged(user) {
        const video = this.getSmallVideo(user.getId());

        if (!video) {
            return;
        }
        this._setRemoteControlProperties(user, video);
    },

    /**
     * Sets the remote control properties (checks whether remote control
     * is supported and executes remoteVideo.setRemoteControlSupport).
     * @param {JitsiParticipant} user the user that will be checked for remote
     * control support.
     * @param {RemoteVideo} remoteVideo the remoteVideo on which the properties
     * will be set.
     */
    _setRemoteControlProperties(user, remoteVideo) {
        APP.remoteControl.checkUserRemoteControlSupport(user)
            .then(result => remoteVideo.setRemoteControlSupport(result))
            .catch(error =>
                logger.warn(`could not get remote control properties for: ${user.getJid()}`, error));
    },

    /**
     * Returns the wrapper jquery selector for the largeVideo
     * @returns {JQuerySelector} the wrapper jquery selector for the largeVideo
     */
    getLargeVideoWrapper() {
        return this.getCurrentlyOnLargeContainer().$wrapper;
    },

    /**
     * Returns the number of remove video ids.
     *
     * @returns {number} The number of remote videos.
     */
    getRemoteVideosCount() {
        return Object.keys(remoteVideos).length;
    },

    /**
     * Sets the remote control active status for a remote participant.
     *
     * @param {string} participantID - The id of the remote participant.
     * @param {boolean} isActive - The new remote control active status.
     * @returns {void}
     */
    setRemoteControlActiveStatus(participantID, isActive) {
        remoteVideos[participantID].setRemoteControlActiveStatus(isActive);
    },

    /**
     * Sets the remote control active status for the local participant.
     *
     * @returns {void}
     */
    setLocalRemoteControlActiveChanged() {
        Object.values(remoteVideos).forEach(
            remoteVideo => remoteVideo.updateRemoteVideoMenu()
        );
    },

    /**
     * Helper method to invoke when the video layout has changed and elements
     * have to be re-arranged and resized.
     *
     * @returns {void}
     */
    refreshLayout() {
        localVideoThumbnail && localVideoThumbnail.updateDOMLocation();
        VideoLayout.resizeVideoArea();

        // Rerender the thumbnails since they are dependant on the layout because of the tooltip positioning.
        localVideoThumbnail && localVideoThumbnail.rerender();
        Object.values(remoteVideos).forEach(remoteVideoThumbnail => remoteVideoThumbnail.rerender());
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
     * Cleans up filmstrip state. While a separate {@code Filmstrip} exists, its
     * implementation is mainly for querying and manipulating the DOM while
     * state mostly remains in {@code VideoLayout}.
     *
     * @private
     * @returns {void}
     */
    _resetFilmstrip() {
        Object.keys(remoteVideos).forEach(remoteVideoId => {
            this.removeParticipantContainer(remoteVideoId);
            delete remoteVideos[remoteVideoId];
        });

        if (localVideoThumbnail) {
            localVideoThumbnail.remove();
            localVideoThumbnail = null;
        }
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
