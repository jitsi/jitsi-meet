/* global APP, $, interfaceConfig  */
const logger = require('jitsi-meet-logger').getLogger(__filename);

import {
    getNearestReceiverVideoQualityLevel,
    setMaxReceiverVideoQuality
} from '../../../react/features/base/conference';
import {
    JitsiParticipantConnectionStatus
} from '../../../react/features/base/lib-jitsi-meet';
import { VIDEO_TYPE } from '../../../react/features/base/media';
import {
    getLocalParticipant as getLocalParticipantFromStore,
    getPinnedParticipant,
    pinParticipant
} from '../../../react/features/base/participants';
import {
    shouldDisplayTileView
} from '../../../react/features/video-layout';
import { SHARED_VIDEO_CONTAINER_TYPE } from '../shared_video/SharedVideo';
import SharedVideoThumb from '../shared_video/SharedVideoThumb';

import Filmstrip from './Filmstrip';
import UIEvents from '../../../service/UI/UIEvents';
import UIUtil from '../util/UIUtil';

import RemoteVideo from './RemoteVideo';
import LargeVideoManager from './LargeVideoManager';
import { VIDEO_CONTAINER_TYPE } from './VideoContainer';

import LocalVideo from './LocalVideo';

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
        localVideoThumbnail,
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

        // sets default video type of local video
        // FIXME container type is totally different thing from the video type
        localVideoThumbnail.setVideoType(VIDEO_CONTAINER_TYPE);

        // if we do not resize the thumbs here, if there is no video device
        // the local video thumb maybe one pixel
        this.resizeThumbnails(true);

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
     * Adds or removes icons for not available camera and microphone.
     * @param resourceJid the jid of user
     * @param devices available devices
     */
    setDeviceAvailabilityIcons(id, devices) {
        if (APP.conference.isLocalId(id)) {
            localVideoThumbnail.setDeviceAvailabilityIcons(devices);

            return;
        }

        const video = remoteVideos[id];

        if (!video) {
            return;
        }

        video.setDeviceAvailabilityIcons(devices);
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
            this.onAudioMute(stream.getParticipantId(), stream.isMuted());
        } else {
            this.onVideoMute(stream.getParticipantId(), stream.isMuted());
        }
    },

    onRemoteStreamRemoved(stream) {
        const id = stream.getParticipantId();
        const remoteVideo = remoteVideos[id];

        // Remote stream may be removed after participant left the conference.

        if (remoteVideo) {
            remoteVideo.removeRemoteStreamElement(stream);
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

        if (participant
                && !participant.getTracksByMediaType(mediaType).length) {
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
        const smallVideo = VideoLayout.getSmallVideo(id);


        return smallVideo ? smallVideo.getVideoType() : null;
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
        const remoteVideo
            = new RemoteVideo(jitsiParticipant, VideoLayout, eventEmitter);

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

        if (!remoteVideo.getVideoType()) {
            // make video type the default one (camera)
            // FIXME container type is not a video type
            remoteVideo.setVideoType(VIDEO_CONTAINER_TYPE);
        }

        VideoLayout.resizeThumbnails(true);

        // Initialize the view
        remoteVideo.updateView();
    },

    // FIXME: what does this do???
    remoteVideoActive(videoElement, resourceJid) {
        logger.info(`${resourceJid} video is now active`, videoElement);
        VideoLayout.resizeThumbnails(
            false, () => {
                if (videoElement) {
                    $(videoElement).show();
                }
            });
        this._updateLargeVideoIfDisplayed(resourceJid, true);
    },

    /**
     * Shows a visual indicator for the moderator of the conference.
     * On local or remote participants.
     */
    showModeratorIndicator() {
        const isModerator = APP.conference.isModerator;

        if (isModerator) {
            localVideoThumbnail.addModeratorIndicator();
        } else {
            localVideoThumbnail.removeModeratorIndicator();
        }

        APP.conference.listMembers().forEach(member => {
            const id = member.getId();
            const remoteVideo = remoteVideos[id];

            if (!remoteVideo) {
                return;
            }

            if (member.isModerator()) {
                remoteVideo.addModeratorIndicator();
            }

            remoteVideo.updateRemoteVideoMenu();
        });
    },

    /*
     * Shows or hides the audio muted indicator over the local thumbnail video.
     * @param {boolean} isMuted
     */
    showLocalAudioIndicator(isMuted) {
        localVideoThumbnail.showAudioIndicator(isMuted);
    },

    /**
     * Resizes thumbnails.
     */
    resizeThumbnails(
            forceUpdate = false,
            onComplete = null) {
        const { localVideo, remoteVideo }
            = Filmstrip.calculateThumbnailSize();

        Filmstrip.resizeThumbnails(localVideo, remoteVideo, forceUpdate);

        if (shouldDisplayTileView(APP.store.getState())) {
            const height
                = (localVideo && localVideo.thumbHeight)
                || (remoteVideo && remoteVideo.thumbnHeight)
                || 0;
            const qualityLevel = getNearestReceiverVideoQualityLevel(height);

            APP.store.dispatch(setMaxReceiverVideoQuality(qualityLevel));
        }

        localVideoThumbnail && localVideoThumbnail.rerender();
        Object.values(remoteVideos).forEach(
            remoteVideoThumbnail => remoteVideoThumbnail.rerender());

        if (onComplete && typeof onComplete === 'function') {
            onComplete();
        }
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
            remoteVideo.updateRemoteVideoMenu(isMuted);
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
     * @param {status} status - The new connection status.
     * @returns {void}
     */
    onParticipantConnectionStatusChanged(id, status) {
        if (APP.conference.isLocalId(id)) {
            // Maintain old logic of passing in either interrupted or active
            // to updateConnectionStatus.
            localVideoThumbnail.updateConnectionStatus(status);

            if (status === JitsiParticipantConnectionStatus.INTERRUPTED) {
                largeVideo && largeVideo.onVideoInterrupted();
            } else {
                largeVideo && largeVideo.onVideoRestored();
            }

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
     * Hides the connection indicator
     * @param id
     */
    hideConnectionIndicator(id) {
        const remoteVideo = remoteVideos[id];

        if (remoteVideo) {
            remoteVideo.removeConnectionIndicator();
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

        VideoLayout.resizeThumbnails();
    },

    onVideoTypeChanged(id, newVideoType) {
        if (VideoLayout.getRemoteVideoType(id) === newVideoType) {
            return;
        }

        logger.info('Peer video type changed: ', id, newVideoType);

        let smallVideo;

        if (APP.conference.isLocalId(id)) {
            if (!localVideoThumbnail) {
                logger.warn('Local video not ready yet');

                return;
            }
            smallVideo = localVideoThumbnail;
        } else if (remoteVideos[id]) {
            smallVideo = remoteVideos[id];
        } else {
            return;
        }
        smallVideo.setVideoType(newVideoType);

        this._updateLargeVideoIfDisplayed(id, true);
    },

    /**
     * Resizes the video area.
     *
     * TODO: Remove the "animate" param as it is no longer passed in as true.
     *
     * @param forceUpdate indicates that hidden thumbnails will be shown
     */
    resizeVideoArea(
            forceUpdate = false,
            animate = false) {
        // Resize the thumbnails first.
        this.resizeThumbnails(forceUpdate);

        if (largeVideo) {
            largeVideo.updateContainerSize();
            largeVideo.resize(animate);
        }

        // Calculate available width and height.
        const availableHeight = window.innerHeight;
        const availableWidth = UIUtil.getAvailableVideoWidth();

        if (availableWidth < 0 || availableHeight < 0) {
            return;
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
        const currentId = largeVideo.id;
        const isOnLarge = this.isCurrentlyOnLarge(id);
        const smallVideo = this.getSmallVideo(id);

        if (isOnLarge && !forceUpdate
                && LargeVideoManager.isVideoContainer(currentContainerType)
                && smallVideo) {
            const currentStreamId = currentContainer.getStreamID();
            const newStreamId
                = smallVideo.videoStream
                    ? smallVideo.videoStream.getId() : null;

            // FIXME it might be possible to get rid of 'forceUpdate' argument
            if (currentStreamId !== newStreamId) {
                logger.debug('Enforcing large video update for stream change');
                forceUpdate = true; // eslint-disable-line no-param-reassign
            }
        }

        if ((!isOnLarge || forceUpdate) && smallVideo) {
            const videoType = this.getRemoteVideoType(id);

            // FIXME video type is not the same thing as container type

            if (id !== currentId && videoType === VIDEO_CONTAINER_TYPE) {
                APP.API.notifyOnStageParticipantChanged(id);
            }

            let oldSmallVideo;

            if (currentId) {
                oldSmallVideo = this.getSmallVideo(currentId);
            }

            smallVideo.waitForResolutionChange();
            if (oldSmallVideo) {
                oldSmallVideo.waitForResolutionChange();
            }

            largeVideo.updateLargeVideo(
                id,
                smallVideo.videoStream,
                videoType || VIDEO_TYPE.CAMERA
            ).then(() => {
                // update current small video and the old one
                smallVideo.updateView();
                oldSmallVideo && oldSmallVideo.updateView();
            }, () => {
                // use clicked other video during update, nothing to do.
            });

        } else if (currentId) {
            const currentSmallVideo = this.getSmallVideo(currentId);

            currentSmallVideo && currentSmallVideo.updateView();
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

    getEventEmitter() {
        return eventEmitter;
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
                logger.warn('could not get remote control properties', error));
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
    }
};

export default VideoLayout;
