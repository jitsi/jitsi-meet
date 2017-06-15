/* global APP, $, interfaceConfig, JitsiMeetJS  */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import Filmstrip from "./Filmstrip";
import UIEvents from "../../../service/UI/UIEvents";
import UIUtil from "../util/UIUtil";

import RemoteVideo from "./RemoteVideo";
import LargeVideoManager  from "./LargeVideoManager";
import {VIDEO_CONTAINER_TYPE} from "./VideoContainer";
import LocalVideo from "./LocalVideo";

const ParticipantConnectionStatus
    = JitsiMeetJS.constants.participantConnectionStatus;

var remoteVideos = {};
var localVideoThumbnail = null;

var currentDominantSpeaker = null;

var eventEmitter = null;

/**
 * Currently focused video jid
 * @type {String}
 */
var pinnedId = null;

/**
 * flipX state of the localVideo
 */
let localFlipX = null;

/**
 * On contact list item clicked.
 */
function onContactClicked (id) {
    if (APP.conference.isLocalId(id)) {
        $("#localVideoContainer").click();
        return;
    }

    let remoteVideo = remoteVideos[id];
    if (remoteVideo && remoteVideo.hasVideo()) {
        // It is not always the case that a videoThumb exists (if there is
        // no actual video).
        if (remoteVideo.hasVideoStarted()) {
            // We have a video src, great! Let's update the large video
            // now.
            VideoLayout.handleVideoThumbClicked(id);
        } else {

            // If we don't have a video src for jid, there's absolutely
            // no point in calling handleVideoThumbClicked; Quite
            // simply, it won't work because it needs an src to attach
            // to the large video.
            //
            // Instead, we trigger the pinned endpoint changed event to
            // let the bridge adjust its lastN set for myjid and store
            // the pinned user in the lastNPickupId variable to be
            // picked up later by the lastN changed event handler.
            eventEmitter.emit(UIEvents.PINNED_ENDPOINT, remoteVideo, true);
        }
    }
}

/**
 * Handler for local flip X changed event.
 * @param {Object} val
 */
function onLocalFlipXChanged (val) {
    localFlipX = val;
    if(largeVideo) {
        largeVideo.onLocalFlipXChange(val);
    }
}

/**
 * Returns the corresponding resource id to the given peer container
 * DOM element.
 *
 * @return the corresponding resource id to the given peer container
 * DOM element
 */
function getPeerContainerResourceId (containerElement) {
    if (localVideoThumbnail.container === containerElement) {
        return localVideoThumbnail.id;
    }

    let i = containerElement.id.indexOf('participant_');

    if (i >= 0) {
        return containerElement.id.substring(i + 12);
    }
}

let largeVideo;

var VideoLayout = {
    init (emitter) {
        eventEmitter = emitter;

        // Unregister listeners in case of reinitialization
        this.unregisterListeners();

        localVideoThumbnail = new LocalVideo(VideoLayout, emitter);
        // sets default video type of local video
        // FIXME container type is totally different thing from the video type
        localVideoThumbnail.setVideoType(VIDEO_CONTAINER_TYPE);
        // if we do not resize the thumbs here, if there is no video device
        // the local video thumb maybe one pixel
        this.resizeThumbnails(false, true);

        this.registerListeners();
    },

    /**
     * Cleans up any existing largeVideo instance.
     *
     * @returns {void}
     */
    resetLargeVideo() {
        if (largeVideo) {
            largeVideo.destroy();
        }
        largeVideo = null;
    },

    /**
     * Registering listeners for UI events in Video layout component.
     *
     * @returns {void}
     */
    registerListeners() {
        eventEmitter.addListener(UIEvents.LOCAL_FLIPX_CHANGED,
            onLocalFlipXChanged);
        eventEmitter.addListener(UIEvents.CONTACT_CLICKED, onContactClicked);
    },

    /**
     * Unregistering listeners for UI events in Video layout component.
     *
     * @returns {void}
     */
    unregisterListeners() {
        eventEmitter.removeListener(UIEvents.CONTACT_CLICKED, onContactClicked);
    },

    initLargeVideo () {
        this.resetLargeVideo();

        largeVideo = new LargeVideoManager(eventEmitter);
        if(localFlipX) {
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
        let smallVideo = this.getSmallVideo(id);
        if (smallVideo)
            smallVideo.updateAudioLevelIndicator(lvl);

        if (largeVideo && id === largeVideo.id)
            largeVideo.updateLargeVideoAudioLevel(lvl);
    },

    changeLocalAudio (stream) {
        let localAudio = document.getElementById('localAudio');
        localAudio = stream.attach(localAudio);

        // Now when Temasys plugin is converting also <audio> elements to
        // plugin's <object>s, in current layout it will capture click events
        // before it reaches the local video object. We hide it here in order
        // to prevent that.
        //if (RTCBrowserType.isIExplorer()) {
            // The issue is not present on Safari. Also if we hide it in Safari
            // then the local audio track will have 'enabled' flag set to false
            // which will result in audio mute issues
            //  $(localAudio).hide();
            localAudio.width = 1;
            localAudio.height = 1;
        //}
    },

    changeLocalVideo (stream) {
        let localId = APP.conference.getMyUserId();
        this.onVideoTypeChanged(localId, stream.videoType);

        localVideoThumbnail.changeVideo(stream);

        /* force update if we're currently being displayed */
        if (this.isCurrentlyOnLarge(localId)) {
            this.updateLargeVideo(localId, true);
        }
    },

    /**
     * Get's the localID of the conference and set it to the local video
     * (small one). This needs to be called as early as possible, when muc is
     * actually joined. Otherwise events can come with information like email
     * and setting them assume the id is already set.
     */
    mucJoined () {
        if (largeVideo && !largeVideo.id) {
            this.updateLargeVideo(APP.conference.getMyUserId(), true);
        }
    },

    /**
     * Adds or removes icons for not available camera and microphone.
     * @param resourceJid the jid of user
     * @param devices available devices
     */
    setDeviceAvailabilityIcons (id, devices) {
        if (APP.conference.isLocalId(id)) {
            localVideoThumbnail.setDeviceAvailabilityIcons(devices);
            return;
        }

        let video = remoteVideos[id];
        if (!video) {
            return;
        }

        video.setDeviceAvailabilityIcons(devices);
    },

    /**
     * Enables/disables device availability icons for the given participant id.
     * The default value is {true}.
     * @param id the identifier of the participant
     * @param enable {true} to enable device availability icons
     */
    enableDeviceAvailabilityIcons (id, enable) {
        let video;
        if (APP.conference.isLocalId(id)) {
            video = localVideoThumbnail;
        }
        else {
            video = remoteVideos[id];
        }

        if (video)
            video.enableDeviceAvailabilityIcons(enable);
    },

    /**
     * Shows/hides local video.
     * @param {boolean} true to make the local video visible, false - otherwise
     */
    setLocalVideoVisible(visible) {
        localVideoThumbnail.setVisible(visible);
    },

    /**
     * Checks if removed video is currently displayed and tries to display
     * another one instead.
     * Uses focusedID if any or dominantSpeakerID if any,
     * otherwise elects new video, in this order.
     */
    updateAfterThumbRemoved (id) {
        // Always trigger an update if large video is empty.
        if (!largeVideo
            || (this.getLargeVideoID() && !this.isCurrentlyOnLarge(id))) {
            return;
        }

        let newId;

        if (pinnedId)
            newId = pinnedId;
        else if (currentDominantSpeaker)
            newId = currentDominantSpeaker;
        else // Otherwise select last visible video
            newId = this.electLastVisibleVideo();

        this.updateLargeVideo(newId);
    },

    electLastVisibleVideo () {
        // pick the last visible video in the row
        // if nobody else is left, this picks the local video
        let remoteThumbs = Filmstrip.getThumbs(true).remoteThumbs;
        let thumbs = remoteThumbs.filter('[id!="mixedstream"]');

        let lastVisible = thumbs.filter(':visible:last');
        if (lastVisible.length) {
            let id = getPeerContainerResourceId(lastVisible[0]);
            if (remoteVideos[id]) {
                logger.info("electLastVisibleVideo: " + id);
                return id;
            }
            // The RemoteVideo was removed (but the DOM elements may still
            // exist).
        }

        logger.info("Last visible video no longer exists");
        thumbs = Filmstrip.getThumbs().remoteThumbs;
        if (thumbs.length) {
            let id = getPeerContainerResourceId(thumbs[0]);
            if (remoteVideos[id]) {
                logger.info("electLastVisibleVideo: " + id);
                return id;
            }
            // The RemoteVideo was removed (but the DOM elements may
            // still exist).
        }

        // Go with local video
        logger.info("Fallback to local video...");

        let id = APP.conference.getMyUserId();
        logger.info("electLastVisibleVideo: " + id);

        return id;
    },

    onRemoteStreamAdded (stream) {
        let id = stream.getParticipantId();
        let remoteVideo = remoteVideos[id];

        if (!remoteVideo)
            return;

        remoteVideo.addRemoteStreamElement(stream);

        // if track is muted make sure we reflect that
        if(stream.isMuted())
        {
            if(stream.getType() === "audio")
                this.onAudioMute(stream.getParticipantId(), true);
            else
                this.onVideoMute(stream.getParticipantId(), true);
        }
    },

    onRemoteStreamRemoved (stream) {
        let id = stream.getParticipantId();
        let remoteVideo = remoteVideos[id];
        // Remote stream may be removed after participant left the conference.
        if (remoteVideo) {
            remoteVideo.removeRemoteStreamElement(stream);
        }
    },

    /**
     * Return the type of the remote video.
     * @param id the id for the remote video
     * @returns {String} the video type video or screen.
     */
    getRemoteVideoType (id) {
        let smallVideo = VideoLayout.getSmallVideo(id);
        return smallVideo ? smallVideo.getVideoType() : null;
    },

    isPinned (id) {
        return (pinnedId) ? (id === pinnedId) : false;
    },

    getPinnedId () {
        return pinnedId;
    },

    /**
     * Handles the click on a video thumbnail.
     *
     * @param id the identifier of the video thumbnail
     */
    handleVideoThumbClicked (id) {
        var smallVideo = VideoLayout.getSmallVideo(id);
        if(pinnedId) {
            var oldSmallVideo = VideoLayout.getSmallVideo(pinnedId);
            if (oldSmallVideo && !interfaceConfig.filmStripOnly) {
                oldSmallVideo.focus(false);
                // as no pinned event will be sent for local video
                // and we will unpin old one, lets signal it
                // otherwise we will just send the new pinned one
                if (smallVideo.isLocal)
                    eventEmitter.emit(
                        UIEvents.PINNED_ENDPOINT, oldSmallVideo, false);
            }
        }

        // Unpin if currently pinned.
        if (pinnedId === id)
        {
            pinnedId = null;
            // Enable the currently set dominant speaker.
            if (currentDominantSpeaker) {
                if(smallVideo && smallVideo.hasVideo()) {
                    this.updateLargeVideo(currentDominantSpeaker);
                }
            } else {
                // if there is no currentDominantSpeaker, it can also be
                // that local participant is the dominant speaker
                // we should act as a participant has left and was on large
                // and we should choose somebody (electLastVisibleVideo)
                this.updateLargeVideo(this.electLastVisibleVideo());
            }

            eventEmitter.emit(UIEvents.PINNED_ENDPOINT, smallVideo, false);

            return;
        }

        // Lock new video
        pinnedId = id;

        // Update focused/pinned interface.
        if (id) {
            if (smallVideo && !interfaceConfig.filmStripOnly)
                smallVideo.focus(true);

            eventEmitter.emit(UIEvents.PINNED_ENDPOINT, smallVideo, true);
        }

        this.updateLargeVideo(id);
    },

    /**
     * Creates or adds a participant container for the given id and smallVideo.
     *
     * @param {JitsiParticipant} user the participant to add
     * @param {SmallVideo} smallVideo optional small video instance to add as a
     * remote video, if undefined <tt>RemoteVideo</tt> will be created
     */
    addParticipantContainer (user, smallVideo) {
        let id = user.getId();
        let remoteVideo;
        if(smallVideo)
            remoteVideo = smallVideo;
        else
            remoteVideo = new RemoteVideo(user, VideoLayout, eventEmitter);
        this._setRemoteControlProperties(user, remoteVideo);
        this.addRemoteVideoContainer(id, remoteVideo);

        const remoteVideosCount = Object.keys(remoteVideos).length;

        if (remoteVideosCount === 1) {
            window.setTimeout(() => {
                const updatedRemoteVideosCount
                    = Object.keys(remoteVideos).length;

                if (updatedRemoteVideosCount === 1 && remoteVideos[id]) {
                    this._maybePlaceParticipantOnLargeVideo(id);
                }
            }, 3000);
        }
    },

    /**
     * Adds remote video container for the given id and <tt>SmallVideo</tt>.
     *
     * @param {string} the id of the video to add
     * @param {SmallVideo} smallVideo the small video instance to add as a
     * remote video
     */
    addRemoteVideoContainer (id, remoteVideo) {
        remoteVideos[id] = remoteVideo;

        if (!remoteVideo.getVideoType()) {
            // make video type the default one (camera)
            // FIXME container type is not a video type
            remoteVideo.setVideoType(VIDEO_CONTAINER_TYPE);
        }

        VideoLayout.resizeThumbnails(false, true);

        // Initialize the view
        remoteVideo.updateView();
    },

    // FIXME: what does this do???
    remoteVideoActive(videoElement, resourceJid) {

        logger.info(resourceJid + " video is now active", videoElement);

        VideoLayout.resizeThumbnails(
            false, false, () => {
                if (videoElement) {
                    $(videoElement).show();
                }
            });

        this._maybePlaceParticipantOnLargeVideo(resourceJid);
    },

    /**
     * Update the large video to the last added video only if there's no current
     * dominant, focused speaker or update it to the current dominant speaker.
     *
     * @params {string} resourceJid - The id of the user to maybe display on
     * large video.
     * @returns {void}
     */
    _maybePlaceParticipantOnLargeVideo(resourceJid) {
        if ((!pinnedId &&
            !currentDominantSpeaker &&
            this.isLargeContainerTypeVisible(VIDEO_CONTAINER_TYPE)) ||
            pinnedId === resourceJid ||
            (!pinnedId && resourceJid &&
                currentDominantSpeaker === resourceJid) ||
            /* Playback started while we're on the stage - may need to update
               video source with the new stream */
            this.isCurrentlyOnLarge(resourceJid)) {

            this.updateLargeVideo(resourceJid, true);
        }
    },

    /**
     * Shows a visual indicator for the moderator of the conference.
     * On local or remote participants.
     */
    showModeratorIndicator () {
        let isModerator = APP.conference.isModerator;
        if (isModerator) {
            localVideoThumbnail.addModeratorIndicator();
        } else {
            localVideoThumbnail.removeModeratorIndicator();
        }

        APP.conference.listMembers().forEach(function (member) {
            let id = member.getId();
            let remoteVideo = remoteVideos[id];
            if (!remoteVideo)
                return;

            if (member.isModerator()) {
                remoteVideo.addModeratorIndicator();
            }

            if (isModerator) {
                // We are moderator, but user is not - add menu
                if(!remoteVideo.hasRemoteVideoMenu) {
                    remoteVideo.addRemoteVideoMenu();
                }
            }
        });
    },

    /*
     * Shows or hides the audio muted indicator over the local thumbnail video.
     * @param {boolean} isMuted
     */
    showLocalAudioIndicator (isMuted) {
        localVideoThumbnail.showAudioIndicator(isMuted);
    },

    /**
     * Shows/hides the indication about local connection being interrupted.
     *
     * @param {boolean} isInterrupted <tt>true</tt> if local connection is
     * currently in the interrupted state or <tt>false</tt> if the connection
     * is fine.
     */
    showLocalConnectionInterrupted (isInterrupted) {
        // Currently local video thumbnail displays only "active" or
        // "interrupted" despite the fact that ConnectionIndicator supports more
        // states.
        const status
            = isInterrupted
                ? ParticipantConnectionStatus.INTERRUPTED
                : ParticipantConnectionStatus.ACTIVE;

        localVideoThumbnail.updateConnectionStatus(status);
    },

    /**
     * Resizes thumbnails.
     */
    resizeThumbnails (  animate = false,
                        forceUpdate = false,
                        onComplete = null) {
        const { localVideo, remoteVideo }
            = Filmstrip.calculateThumbnailSize();

        Filmstrip.resizeThumbnails(localVideo, remoteVideo,
            animate, forceUpdate)
            .then(function () {
                if (onComplete && typeof onComplete === "function")
                    onComplete();
            });

        return { localVideo, remoteVideo };
    },

    /**
     * On audio muted event.
     */
    onAudioMute (id, isMuted) {
        if (APP.conference.isLocalId(id)) {
            localVideoThumbnail.showAudioIndicator(isMuted);
        } else {
            let remoteVideo = remoteVideos[id];
            if (!remoteVideo)
                return;

            remoteVideo.showAudioIndicator(isMuted);
            if (APP.conference.isModerator) {
                remoteVideo.updateRemoteVideoMenu(isMuted);
            }
        }
    },

    /**
     * On video muted event.
     */
    onVideoMute (id, value) {
        if (APP.conference.isLocalId(id)) {
            localVideoThumbnail.setVideoMutedView(value);
        } else {
            let remoteVideo = remoteVideos[id];
            if (remoteVideo)
                remoteVideo.setVideoMutedView(value);
        }

        if (this.isCurrentlyOnLarge(id)) {
            // large video will show avatar instead of muted stream
            this.updateLargeVideo(id, true);
        }
    },

    /**
     * Display name changed.
     */
    onDisplayNameChanged (id, displayName, status) {
        if (id === 'localVideoContainer' ||
            APP.conference.isLocalId(id)) {
            localVideoThumbnail.setDisplayName(displayName);
        } else {
            let remoteVideo = remoteVideos[id];
            if (remoteVideo)
                remoteVideo.setDisplayName(displayName, status);
        }
    },

    /**
     * Sets the "raised hand" status for a participant identified by 'id'.
     */
    setRaisedHandStatus(id, raisedHandStatus) {
        var video
            = APP.conference.isLocalId(id)
                ? localVideoThumbnail : remoteVideos[id];
        if (video) {
            video.showRaisedHandIndicator(raisedHandStatus);
            if (raisedHandStatus) {
                video.showDominantSpeakerIndicator(false);
            }
        }
    },

    /**
     * On dominant speaker changed event.
     */
    onDominantSpeakerChanged (id) {
        if (id === currentDominantSpeaker) {
            return;
        }

        let oldSpeakerRemoteVideo = remoteVideos[currentDominantSpeaker];
        // We ignore local user events, but just unmark remote user as dominant
        // while we are talking
        if (APP.conference.isLocalId(id)) {
            if(oldSpeakerRemoteVideo)
            {
                oldSpeakerRemoteVideo.showDominantSpeakerIndicator(false);
                currentDominantSpeaker = null;
            }
            localVideoThumbnail.showDominantSpeakerIndicator(true);
            return;
        }

        let remoteVideo = remoteVideos[id];
        if (!remoteVideo) {
            return;
        }

        // Update the current dominant speaker.
        remoteVideo.showDominantSpeakerIndicator(true);
        localVideoThumbnail.showDominantSpeakerIndicator(false);

        // let's remove the indications from the remote video if any
        if (oldSpeakerRemoteVideo) {
            oldSpeakerRemoteVideo.showDominantSpeakerIndicator(false);
        }
        currentDominantSpeaker = id;

        // Local video will not have container found, but that's ok
        // since we don't want to switch to local video.
        // Update the large video if the video source is already available,
        // otherwise wait for the "videoactive.jingle" event.
        // FIXME: there is no "videoactive.jingle" event.
        if (!interfaceConfig.filmStripOnly && !pinnedId
            && remoteVideo.hasVideoStarted()
            && !this.getCurrentlyOnLargeContainer().stayOnStage()) {
            this.updateLargeVideo(id);
        }
    },

    /**
     * Shows/hides warning about remote user's connectivity issues.
     *
     * @param {string} id the ID of the remote participant(MUC nickname)
     */
    // eslint-disable-next-line no-unused-vars
    onParticipantConnectionStatusChanged (id) {
        // Show/hide warning on the large video
        if (this.isCurrentlyOnLarge(id)) {
            if (largeVideo) {
                // We have to trigger full large video update to transition from
                // avatar to video on connectivity restored.
                this.updateLargeVideo(id, true /* force update */);
            }
        }
        // Show/hide warning on the thumbnail
        let remoteVideo = remoteVideos[id];
        if (remoteVideo) {
            // Updating only connection status indicator is not enough, because
            // when we the connection is restored while the avatar was displayed
            // (due to 'muted while disconnected' condition) we may want to show
            // the video stream again and in order to do that the display mode
            // must be updated.
            //remoteVideo.updateConnectionStatusIndicator(isActive);
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
    onLastNEndpointsChanged (endpointsLeavingLastN, endpointsEnteringLastN) {
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
            if (remoteVideo.isCurrentlyOnLargeVideo()) {
                this.updateLargeVideo(id, true);
            }
        }
    },

    /**
     * Updates local stats
     * @param percent
     * @param object
     */
    updateLocalConnectionStats (percent, object) {
        const { framerate, resolution } = object;

        // FIXME overwrites 'lib-jitsi-meet' internal object
        // Why library internal objects are passed as event's args ?
        object.resolution = resolution[APP.conference.getMyUserId()];
        object.framerate = framerate[APP.conference.getMyUserId()];
        localVideoThumbnail.updateConnectionStats(percent, object);

        Object.keys(resolution).forEach(function (id) {
            if (APP.conference.isLocalId(id)) {
                return;
            }

            let resolutionValue = resolution[id];
            let remoteVideo = remoteVideos[id];

            if (resolutionValue && remoteVideo) {
                remoteVideo.updateResolution(resolutionValue);
            }
        });

        Object.keys(framerate).forEach(function (id) {
            if (APP.conference.isLocalId(id)) {
                return;
            }

            const framerateValue = framerate[id];
            const remoteVideo = remoteVideos[id];

            if (framerateValue && remoteVideo) {
                remoteVideo.updateFramerate(framerateValue);
            }
        });
    },

    /**
     * Updates remote stats.
     * @param id the id associated with the stats
     * @param percent the connection quality percent
     * @param object the stats data
     */
    updateConnectionStats (id, percent, object) {
        let remoteVideo = remoteVideos[id];
        if (remoteVideo) {
            remoteVideo.updateConnectionStats(percent, object);
        }
    },

    /**
     * Hides the connection indicator
     * @param id
     */
    hideConnectionIndicator (id) {
        let remoteVideo = remoteVideos[id];
        if (remoteVideo)
            remoteVideo.removeConnectionIndicator();
    },

    /**
     * Hides all the indicators
     */
    hideStats () {
        for (var video in remoteVideos) {
            let remoteVideo = remoteVideos[video];
            if (remoteVideo)
                remoteVideo.hideIndicator();
        }
        localVideoThumbnail.hideIndicator();
    },

    removeParticipantContainer (id) {
        // Unlock large video
        if (pinnedId === id) {
            logger.info("Focused video owner has left the conference");
            pinnedId = null;
        }

        if (currentDominantSpeaker === id) {
            logger.info("Dominant speaker has left the conference");
            currentDominantSpeaker = null;
        }

        var remoteVideo = remoteVideos[id];
        if (remoteVideo) {
            // Remove remote video
            logger.info("Removing remote video: " + id);
            delete remoteVideos[id];
            remoteVideo.remove();
        } else {
            logger.warn("No remote video for " + id);
        }

        VideoLayout.resizeThumbnails();
    },

    onVideoTypeChanged (id, newVideoType) {
        if (VideoLayout.getRemoteVideoType(id) === newVideoType) {
            return;
        }

        logger.info("Peer video type changed: ", id, newVideoType);

        var smallVideo;
        if (APP.conference.isLocalId(id)) {
            if (!localVideoThumbnail) {
                logger.warn("Local video not ready yet");
                return;
            }
            smallVideo = localVideoThumbnail;
        } else if (remoteVideos[id]) {
            smallVideo = remoteVideos[id];
        } else {
            return;
        }
        smallVideo.setVideoType(newVideoType);

        if (this.isCurrentlyOnLarge(id)) {
            this.updateLargeVideo(id, true);
        }
    },

    /**
     * Resizes the video area.
     *
     * @param forceUpdate indicates that hidden thumbnails will be shown
     * @param completeFunction a function to be called when the video area is
     * resized.
     */
    resizeVideoArea (forceUpdate = false,
                    animate = false,
                    completeFunction = null) {

        if (largeVideo) {
            largeVideo.updateContainerSize();
            largeVideo.resize(animate);
        }

        // Calculate available width and height.
        let availableHeight = window.innerHeight;
        let availableWidth = UIUtil.getAvailableVideoWidth();

        if (availableWidth < 0 || availableHeight < 0) {
            return;
        }

        // Resize the thumbnails first.
        this.resizeThumbnails(false, forceUpdate);

        // Resize the video area element.
        $('#videospace').animate({
            right: window.innerWidth - availableWidth,
            width: availableWidth,
            height: availableHeight
        }, {
            queue: false,
            duration: animate ? 500 : 1,
            complete: completeFunction
        });
    },

    getSmallVideo (id) {
        if (APP.conference.isLocalId(id)) {
            return localVideoThumbnail;
        } else {
            return remoteVideos[id];
        }
    },

    changeUserAvatar (id, avatarUrl) {
        var smallVideo = VideoLayout.getSmallVideo(id);
        if (smallVideo) {
            smallVideo.avatarChanged(avatarUrl);
        } else {
            logger.warn(
                "Missed avatar update - no small video yet for " + id
            );
        }
        if (this.isCurrentlyOnLarge(id)) {
            largeVideo.updateAvatar(avatarUrl);
        }
    },

    /**
     * Indicates that the video has been interrupted.
     */
    onVideoInterrupted () {
        if (largeVideo) {
            largeVideo.onVideoInterrupted();
        }
    },

    /**
     * Indicates that the video has been restored.
     */
    onVideoRestored () {
        if (largeVideo) {
            largeVideo.onVideoRestored();
        }
    },

    isLargeVideoVisible () {
        return this.isLargeContainerTypeVisible(VIDEO_CONTAINER_TYPE);
    },

    /**
     * @return {LargeContainer} the currently displayed container on large
     * video.
     */
    getCurrentlyOnLargeContainer () {
        return largeVideo.getContainer(largeVideo.state);
    },

    isCurrentlyOnLarge (id) {
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

    updateLargeVideo (id, forceUpdate) {
        if (!largeVideo) {
            return;
        }
        let isOnLarge = this.isCurrentlyOnLarge(id);
        let currentId = largeVideo.id;

        if (!isOnLarge || forceUpdate) {
            let videoType = this.getRemoteVideoType(id);
            // FIXME video type is not the same thing as container type
            if (id !== currentId && videoType === VIDEO_CONTAINER_TYPE) {
                eventEmitter.emit(UIEvents.SELECTED_ENDPOINT, id);
            }

            let smallVideo = this.getSmallVideo(id);
            let oldSmallVideo;
            if (currentId) {
                oldSmallVideo = this.getSmallVideo(currentId);
            }

            smallVideo.waitForResolutionChange();
            if (oldSmallVideo)
                oldSmallVideo.waitForResolutionChange();

            largeVideo.updateLargeVideo(
                id,
                smallVideo.videoStream,
                videoType
            ).then(function() {
                // update current small video and the old one
                smallVideo.updateView();
                oldSmallVideo && oldSmallVideo.updateView();
            }, function () {
                // use clicked other video during update, nothing to do.
            });

        } else if (currentId) {
            let currentSmallVideo = this.getSmallVideo(currentId);
            currentSmallVideo.updateView();
        }
    },

    addLargeVideoContainer (type, container) {
        largeVideo && largeVideo.addContainer(type, container);
    },

    removeLargeVideoContainer (type) {
        largeVideo && largeVideo.removeContainer(type);
    },

    /**
     * @returns Promise
     */
    showLargeVideoContainer (type, show) {
        if (!largeVideo) {
            return Promise.reject();
        }

        let isVisible = this.isLargeContainerTypeVisible(type);
        if (isVisible === show) {
            return Promise.resolve();
        }

        let currentId = largeVideo.id;
        if(currentId) {
            var oldSmallVideo = this.getSmallVideo(currentId);
        }

        let containerTypeToShow = type;
        // if we are hiding a container and there is focusedVideo
        // (pinned remote video) use its video type,
        // if not then use default type - large video
        if (!show) {
            if(pinnedId)
                containerTypeToShow = this.getRemoteVideoType(pinnedId);
            else
                containerTypeToShow = VIDEO_CONTAINER_TYPE;
        }

        return largeVideo.showContainer(containerTypeToShow)
            .then(() => {
                if(oldSmallVideo)
                    oldSmallVideo && oldSmallVideo.updateView();
            });
    },

    isLargeContainerTypeVisible (type) {
        return largeVideo && largeVideo.state === type;
    },

    /**
     * Returns the id of the current video shown on large.
     * Currently used by tests (torture).
     */
    getLargeVideoID () {
        return largeVideo.id;
    },

    /**
     * Returns the the current video shown on large.
     * Currently used by tests (torture).
     */
    getLargeVideo () {
        return largeVideo;
    },

    /**
     * Sets the flipX state of the local video.
     * @param {boolean} true for flipped otherwise false;
     */
    setLocalFlipX (val) {
        this.localFlipX = val;
    },

    getEventEmitter() {return eventEmitter;},

    /**
     * Handles user's features changes.
     */
    onUserFeaturesChanged (user) {
        let video = this.getSmallVideo(user.getId());

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
    _setRemoteControlProperties (user, remoteVideo) {
        APP.remoteControl.checkUserRemoteControlSupport(user).then(result =>
            remoteVideo.setRemoteControlSupport(result));
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
    }
};

export default VideoLayout;
