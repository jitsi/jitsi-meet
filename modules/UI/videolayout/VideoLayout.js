/* global config, APP, $, interfaceConfig */
/* jshint -W101 */

import AudioLevels from "../audio_levels/AudioLevels";
import ContactList from "../side_pannels/contactlist/ContactList";

import UIEvents from "../../../service/UI/UIEvents";
import UIUtil from "../util/UIUtil";

import RemoteVideo from "./RemoteVideo";
import LargeVideo from "./LargeVideo";
import LocalVideo from "./LocalVideo";

var MediaStreamType = require("../../../service/RTC/MediaStreamTypes");
var RTCBrowserType = require('../../RTC/RTCBrowserType');

var remoteVideos = {};
var remoteVideoTypes = {};
var localVideoThumbnail = null;

var currentDominantSpeaker = null;
var lastNCount = config.channelLastN;
var localLastNCount = config.channelLastN;
var localLastNSet = [];
var lastNEndpointsCache = [];
var lastNPickupId = null;

var eventEmitter = null;

/**
 * Currently focused video jid
 * @type {String}
 */
var focusedVideoResourceJid = null;

/**
 * On contact list item clicked.
 */
$(ContactList).bind('contactclicked', function(event, id) {
    if (!id) {
        return;
    }

    if (APP.conference.isLocalId(id)) {
        $("#localVideoContainer").click();
        return;
    }

    var remoteVideo = remoteVideos[id];
    if (remoteVideo && remoteVideo.selectVideoElement().length) {
        var videoThumb = remoteVideo.selectVideoElement()[0];
        // It is not always the case that a videoThumb exists (if there is
        // no actual video).
        if (RTC.getVideoSrc(videoThumb)) {

            // We have a video src, great! Let's update the large video
            // now.
            VideoLayout.handleVideoThumbClicked(false, id);
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

            lastNPickupId = id;
            eventEmitter.emit(UIEvents.PINNED_ENDPOINT, id);
        }
    }
});


var VideoLayout = {
    init (emitter) {
        eventEmitter = emitter;
        localVideoThumbnail = new LocalVideo(VideoLayout, emitter);
        if (interfaceConfig.filmStripOnly) {
            LargeVideo.disable();
        } else {
            LargeVideo.init(VideoLayout, emitter);
        }

        VideoLayout.resizeLargeVideoContainer();

    },

    isInLastN (resource) {
        return lastNCount < 0 || // lastN is disabled
             // lastNEndpoints cache not built yet
            (lastNCount > 0 && !lastNEndpointsCache.length) ||
            (lastNEndpointsCache &&
                lastNEndpointsCache.indexOf(resource) !== -1);
    },

    changeLocalAudio (stream) {
        let localAudio = document.getElementById('localAudio');
        stream.attach($(localAudio));

        return; // FIXME maybe move this into the library?
        // Writing volume not allowed in IE
        if (!RTCBrowserType.isIExplorer()) {
            localAudio.autoplay = true;
            localAudio.volume = 0;
        }
        // Now when Temasys plugin is converting also <audio> elements to
        // plugin's <object>s, in current layout it will capture click events
        // before it reaches the local video object. We hide it here in order
        // to prevent that.
        if (RTCBrowserType.isIExplorer()) {
            // The issue is not present on Safari. Also if we hide it in Safari
            // then the local audio track will have 'enabled' flag set to false
            // which will result in audio mute issues
            $('#localAudio').hide();
        }
    },

    changeLocalVideo (stream) {
        // Set default display name.
        localVideoThumbnail.setDisplayName();
        localVideoThumbnail.createConnectionIndicator();

        let localId = APP.conference.localId;
        this.onVideoTypeChanged(localId, stream.getType());

        AudioLevels.updateAudioLevelCanvas(null, VideoLayout);

        localVideoThumbnail.changeVideo(stream);

        /* force update if we're currently being displayed */
        if (LargeVideo.isCurrentlyOnLarge(localId)) {
            LargeVideo.updateLargeVideo(localId, true);
        }
    },

    mucJoined () {
        let id = APP.conference.localId;
        localVideoThumbnail.joined(id);

        if (!LargeVideo.id) {
            LargeVideo.updateLargeVideo(id, true);
        }
    },

    /**
     * Adds or removes icons for not available camera and microphone.
     * @param resourceJid the jid of user
     * @param devices available devices
     */
    setDeviceAvailabilityIcons (resourceJid, devices) {
        if(!devices)
            return;

        if(!resourceJid) {
            localVideoThumbnail.setDeviceAvailabilityIcons(devices);
        } else {
            if(remoteVideos[resourceJid])
                remoteVideos[resourceJid].setDeviceAvailabilityIcons(devices);
        }
    },

    /**
     * Checks if removed video is currently displayed and tries to display
     * another one instead.
     */
    updateRemovedVideo (id) {
        let newId;

        if (id === LargeVideo.getId()) {
            // We'll show user's avatar if he is the dominant speaker or if
            // his video thumbnail is pinned
            if (remoteVideos[id] &&
                id === focusedVideoResourceJid ||
                id === currentDominantSpeaker) {
                newId = id;
            } else {
                // Otherwise select last visible video
                newId = this.electLastVisibleVideo();
            }
            LargeVideo.updateLargeVideo(id);
        }
    },

    electLastVisibleVideo () {
        // pick the last visible video in the row
        // if nobody else is left, this picks the local video
        var jid;
        var pick = $('#remoteVideos>span[id!="mixedstream"]:visible:last');
        if (pick.length) {
            jid = VideoLayout.getPeerContainerResourceJid(pick[0]);
            if (!remoteVideos[jid]) {
                // The RemoteVideo was removed (but the DOM elements may still
                // exist).
                jid = null;
            }
        }

        if (!jid) {
            console.info("Last visible video no longer exists");
            pick = $('#remoteVideos>span[id!="mixedstream"]');
            if (pick.length) {
                jid = VideoLayout.getPeerContainerResourceJid(pick[0]);
                if (!remoteVideos[jid]) {
                    // The RemoteVideo was removed (but the DOM elements may
                    // still exist).
                    jid = null;
                }
            }
        }

        if (!jid) {
            // Go with local video
            console.info("Fallback to local video...");
            jid = APP.xmpp.myResource();
        }

        console.info("electLastVisibleVideo: " + jid);
        return jid;
    },

    onRemoteStreamAdded (stream) {
        let id = stream.getParticipantId();
        VideoLayout.ensurePeerContainerExists(id);

        remoteVideos[id].addRemoteStreamElement(stream);
    },

    getLargeVideoId () {
        return LargeVideo.getId();
    },

    /**
     * Return the type of the remote video.
     * @param id the id for the remote video
     * @returns the video type video or screen.
     */
    getRemoteVideoType (id) {
        return remoteVideoTypes[id];
    },

    /**
     * Called when large video update is finished
     * @param currentSmallVideo small video currently displayed on large video
     */
    largeVideoUpdated (currentSmallVideo) {
        // Makes sure that dominant speaker UI
        // is enabled only on current small video
        localVideoThumbnail.enableDominantSpeaker(localVideoThumbnail === currentSmallVideo);
        Object.keys(remoteVideos).forEach(
            function (resourceJid) {
                var remoteVideo = remoteVideos[resourceJid];
                if (remoteVideo) {
                    remoteVideo.enableDominantSpeaker(
                        remoteVideo === currentSmallVideo);
                }
            }
        );
    },

    handleVideoThumbClicked (noPinnedEndpointChangedEvent,
                                          resourceJid) {
        if(focusedVideoResourceJid) {
            var oldSmallVideo
                    = VideoLayout.getSmallVideo(focusedVideoResourceJid);
            if (oldSmallVideo && !interfaceConfig.filmStripOnly)
                oldSmallVideo.focus(false);
        }

        var smallVideo = VideoLayout.getSmallVideo(resourceJid);
        // Unlock current focused.
        if (focusedVideoResourceJid === resourceJid)
        {
            focusedVideoResourceJid = null;
            // Enable the currently set dominant speaker.
            if (currentDominantSpeaker) {
                if(smallVideo && smallVideo.hasVideo()) {
                    LargeVideo.updateLargeVideo(currentDominantSpeaker);
                }
            }

            if (!noPinnedEndpointChangedEvent) {
                eventEmitter.emit(UIEvents.PINNED_ENDPOINT);
            }
            return;
        }

        // Lock new video
        focusedVideoResourceJid = resourceJid;

        // Update focused/pinned interface.
        if (resourceJid) {
            if (smallVideo && !interfaceConfig.filmStripOnly)
                smallVideo.focus(true);

            if (!noPinnedEndpointChangedEvent) {
                eventEmitter.emit(UIEvents.PINNED_ENDPOINT, resourceJid);
            }
        }

        LargeVideo.setState("video");

        LargeVideo.updateLargeVideo(resourceJid);

        // Writing volume not allowed in IE
        if (!RTCBrowserType.isIExplorer()) {
            $('audio').each(function (idx, el) {
                el.volume = 0;
                el.volume = 1;
            });
        }
    },


    /**
     * Checks if container for participant identified by given id exists
     * in the document and creates it eventually.
     *
     * @return Returns <tt>true</tt> if the peer container exists,
     * <tt>false</tt> - otherwise
     */
    ensurePeerContainerExists (id) {
        ContactList.ensureAddContact(id);

        if (remoteVideos[id]) {
            return;
        }

        let remoteVideo = new RemoteVideo(id, VideoLayout, eventEmitter);
        remoteVideos[id] = remoteVideo;

        let videoType = remoteVideoTypes[id];
        if (videoType) {
            remoteVideo.setVideoType(videoType);
        }

        // In case this is not currently in the last n we don't show it.
        if (localLastNCount && localLastNCount > 0 &&
            $('#remoteVideos>span').length >= localLastNCount + 2) {
            remoteVideo.showPeerContainer('hide');
        } else {
            VideoLayout.resizeThumbnails();
        }
    },


    inputDisplayNameHandler (name) {
        localVideoThumbnail.inputDisplayNameHandler(name);
    },

    videoactive (videoelem, resourceJid) {

        console.info(resourceJid + " video is now active");

        videoelem.show();
        VideoLayout.resizeThumbnails();

        // Update the large video to the last added video only if there's no
        // current dominant, focused speaker or prezi playing or update it to
        // the current dominant speaker.
        if ((!focusedVideoResourceJid &&
            !currentDominantSpeaker &&
            !require("../prezi/Prezi").isPresentationVisible()) ||
            focusedVideoResourceJid === resourceJid ||
            (resourceJid &&
                currentDominantSpeaker === resourceJid)) {
            LargeVideo.updateLargeVideo(resourceJid, true);
        }
    },

    /**
     * Shows the presence status message for the given video.
     */
    setPresenceStatus (resourceJid, statusMsg) {
        remoteVideos[resourceJid].setPresenceStatus(statusMsg);
    },

    /**
     * Shows a visual indicator for the moderator of the conference.
     */
    showModeratorIndicator () {
        let isModerator = APP.conference.isModerator;
        if (isModerator) {
            localVideoThumbnail.createModeratorIndicatorElement();
        }

        APP.conference.listMembers().forEach(function (member) {
            let id = member.getId();
            if (member.isModerator()) {
                remoteVideos[id].removeRemoteVideoMenu();
                remoteVideos[id].createModeratorIndicatorElement();
            } else if (isModerator) {
                // We are moderator, but user is not - add menu
                if ($(`#remote_popupmenu_${id}`).length <= 0) {
                    remoteVideos[id].addRemoteVideoMenu();
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
     * Resizes the large video container.
     */
    resizeLargeVideoContainer () {
        if(LargeVideo.isEnabled()) {
            LargeVideo.resize();
        } else {
            VideoLayout.resizeVideoSpace();
        }
        VideoLayout.resizeThumbnails();
        LargeVideo.position();
    },

    /**
     * Resizes thumbnails.
     */
    resizeThumbnails (animate) {
        var videoSpaceWidth = $('#remoteVideos').width();

        var thumbnailSize = VideoLayout.calculateThumbnailSize(videoSpaceWidth);
        var width = thumbnailSize[0];
        var height = thumbnailSize[1];

        $('.userAvatar').css('left', (width - height) / 2);

        if(animate) {
            $('#remoteVideos').animate({
                    // adds 2 px because of small video 1px border
                    height: height + 2
                },
                {
                    queue: false,
                    duration: 500
                });

            $('#remoteVideos>span').animate({
                    height: height,
                    width: width
                },
                {
                    queue: false,
                    duration: 500,
                    complete: function () {
                        $(document).trigger(
                            "remotevideo.resized",
                            [width,
                                height]);
                    }
                });

        } else {
            // size videos so that while keeping AR and max height, we have a
            // nice fit
            // adds 2 px because of small video 1px border
            $('#remoteVideos').height(height + 2);
            $('#remoteVideos>span').width(width);
            $('#remoteVideos>span').height(height);

            $(document).trigger("remotevideo.resized", [width, height]);
        }
    },

    /**
     * Calculates the thumbnail size.
     *
     * @param videoSpaceWidth the width of the video space
     */
    calculateThumbnailSize (videoSpaceWidth) {
        // Calculate the available height, which is the inner window height
        // minus 39px for the header minus 2px for the delimiter lines on the
        // top and bottom of the large video, minus the 36px space inside the
        // remoteVideos container used for highlighting shadow.
       var availableHeight = 100;

        var numvids = $('#remoteVideos>span:visible').length;
        if (localLastNCount && localLastNCount > 0) {
            numvids = Math.min(localLastNCount + 1, numvids);
        }

       // Remove the 3px borders arround videos and border around the remote
       // videos area and the 4 pixels between the local video and the others
       //TODO: Find out where the 4 pixels come from and remove them
       var availableWinWidth = videoSpaceWidth - 2 * 3 * numvids - 70 - 4;

       var availableWidth = availableWinWidth / numvids;
       var aspectRatio = 16.0 / 9.0;
       var maxHeight = Math.min(160, availableHeight);
       availableHeight
           = Math.min(  maxHeight,
                        availableWidth / aspectRatio,
                        window.innerHeight - 18);

       if (availableHeight < availableWidth / aspectRatio) {
           availableWidth = Math.floor(availableHeight * aspectRatio);
       }

       return [availableWidth, availableHeight];
   },

    /**
     * Returns the corresponding resource jid to the given peer container
     * DOM element.
     *
     * @return the corresponding resource jid to the given peer container
     * DOM element
     */
    getPeerContainerResourceJid (containerElement) {
        if (localVideoThumbnail.container === containerElement) {
            return localVideoThumbnail.getId();
        }

        var i = containerElement.id.indexOf('participant_');

        if (i >= 0)
            return containerElement.id.substring(i + 12);
    },

    /**
     * On audio muted event.
     */
    onAudioMute (jid, isMuted) {
        var resourceJid = Strophe.getResourceFromJid(jid);
        if (resourceJid === APP.xmpp.myResource()) {
            localVideoThumbnail.showAudioIndicator(isMuted);
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            remoteVideos[resourceJid].showAudioIndicator(isMuted);
            if (APP.xmpp.isModerator()) {
                remoteVideos[resourceJid].updateRemoteVideoMenu(isMuted);
            }
        }
    },

    /**
     * On video muted event.
     */
    onVideoMute (jid, value) {
        if (jid !== APP.xmpp.myJid() &&
            !APP.RTC.muteRemoteVideoStream(jid, value))
            return;

        if (jid === APP.xmpp.myJid()) {
            localVideoThumbnail.showVideoIndicator(value);
        } else {
            var resource = Strophe.getResourceFromJid(jid);

            VideoLayout.ensurePeerContainerExists(jid);
            var remoteVideo = remoteVideos[resource];
            remoteVideo.showVideoIndicator(value);

            var el = remoteVideo.selectVideoElement();
            if (!value)
                el.show();
            else
                el.hide();
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
            VideoLayout.ensurePeerContainerExists(id);
            remoteVideos[id].setDisplayName(displayName, status);
        }
    },

    /**
     * On dominant speaker changed event.
     */
    onDominantSpeakerChanged (id) {
        // We ignore local user events.
        if (APP.conference.isLocalId(id)) {
            return;
        }

        if (id === currentDominantSpeaker) {
            return;
        }

        let remoteVideo = remoteVideos[id];

        if (!remoteVideo) {
            return;
        }

        // Update the current dominant speaker.
        remoteVideo.updateDominantSpeakerIndicator(true);

        // let's remove the indications from the remote video if any
        let oldSpeakerRemoteVideo = remoteVideos[currentDominantSpeaker];
        if (oldSpeakerRemoteVideo) {
            oldSpeakerRemoteVideo.updateDominantSpeakerIndicator(false);
        }
        currentDominantSpeaker = id;

        // Obtain container for new dominant speaker.
        let videoSel = remoteVideo.selectVideoElement();

        // Local video will not have container found, but that's ok
        // since we don't want to switch to local video.
        if (!focusedVideoResourceJid && videoSel.length) {
            // Update the large video if the video source is already available,
            // otherwise wait for the "videoactive.jingle" event.
            if (videoSel[0].currentTime > 0) {
                LargeVideo.updateLargeVideo(id);
            }
        }
    },

    /**
     * On last N change event.
     *
     * @param lastNEndpoints the list of last N endpoints
     * @param endpointsEnteringLastN the list currently entering last N
     * endpoints
     */
    onLastNEndpointsChanged (lastNEndpoints, endpointsEnteringLastN) {
        if (lastNCount !== lastNEndpoints.length)
            lastNCount = lastNEndpoints.length;

        lastNEndpointsCache = lastNEndpoints;

        // Say A, B, C, D, E, and F are in a conference and LastN = 3.
        //
        // If LastN drops to, say, 2, because of adaptivity, then E should see
        // thumbnails for A, B and C. A and B are in E's server side LastN set,
        // so E sees them. C is only in E's local LastN set.
        //
        // If F starts talking and LastN = 3, then E should see thumbnails for
        // F, A, B. B gets "ejected" from E's server side LastN set, but it
        // enters E's local LastN ejecting C.

        // Increase the local LastN set size, if necessary.
        if (lastNCount > localLastNCount) {
            localLastNCount = lastNCount;
        }

        // Update the local LastN set preserving the order in which the
        // endpoints appeared in the LastN/local LastN set.

        var nextLocalLastNSet = lastNEndpoints.slice(0);
        for (var i = 0; i < localLastNSet.length; i++) {
            if (nextLocalLastNSet.length >= localLastNCount) {
                break;
            }

            var resourceJid = localLastNSet[i];
            if (nextLocalLastNSet.indexOf(resourceJid) === -1) {
                nextLocalLastNSet.push(resourceJid);
            }
        }

        localLastNSet = nextLocalLastNSet;
        var updateLargeVideo = false;

        // Handle LastN/local LastN changes.
        $('#remoteVideos>span').each(function( index, element ) {
            var resourceJid = VideoLayout.getPeerContainerResourceJid(element);

            // We do not want to process any logic for our own(local) video
            // because the local participant is never in the lastN set.
            // The code of this function might detect that the local participant
            // has been dropped out of the lastN set and will update the large
            // video
            // Detected from avatar tests, where lastN event override
            // local video pinning
            if(resourceJid == APP.xmpp.myResource())
                return;

            var isReceived = true;
            if (resourceJid &&
                lastNEndpoints.indexOf(resourceJid) < 0 &&
                localLastNSet.indexOf(resourceJid) < 0) {
                console.log("Remove from last N", resourceJid);
                if (remoteVideos[resourceJid])
                    remoteVideos[resourceJid].showPeerContainer('hide');
                else if (APP.xmpp.myResource() !== resourceJid)
                    console.error("No remote video for: " + resourceJid);
                isReceived = false;
            } else if (resourceJid &&
                $('#participant_' + resourceJid).is(':visible') &&
                lastNEndpoints.indexOf(resourceJid) < 0 &&
                localLastNSet.indexOf(resourceJid) >= 0) {
                if (remoteVideos[resourceJid])
                    remoteVideos[resourceJid].showPeerContainer('avatar');
                else if (APP.xmpp.myResource() !== resourceJid)
                    console.error("No remote video for: " + resourceJid);
                isReceived = false;
            }

            if (!isReceived) {
                // resourceJid has dropped out of the server side lastN set, so
                // it is no longer being received. If resourceJid was being
                // displayed in the large video we have to switch to another
                // user.
                if (!updateLargeVideo &&
                    resourceJid === LargeVideo.getId()) {
                    updateLargeVideo = true;
                }
            }
        });

        if (!endpointsEnteringLastN || endpointsEnteringLastN.length < 0)
            endpointsEnteringLastN = lastNEndpoints;

        if (endpointsEnteringLastN && endpointsEnteringLastN.length > 0) {
            endpointsEnteringLastN.forEach(function (resourceJid) {

                var isVisible = $('#participant_' + resourceJid).is(':visible');
                var remoteVideo = remoteVideos[resourceJid];
                remoteVideo.showPeerContainer('show');
                if (!isVisible) {
                    console.log("Add to last N", resourceJid);

                    var jid = APP.xmpp.findJidFromResource(resourceJid);
                    var mediaStream =
                        APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
                    var sel = remoteVideo.selectVideoElement();

                    APP.RTC.attachMediaStream(sel, mediaStream.stream);
                    if (lastNPickupId == mediaStream.peerjid) {
                        // Clean up the lastN pickup id.
                        lastNPickupId = null;

                        // Don't fire the events again, they've already
                        // been fired in the contact list click handler.
                        VideoLayout.handleVideoThumbClicked(
                            false,
                            Strophe.getResourceFromJid(mediaStream.peerjid));

                        updateLargeVideo = false;
                    }
                    remoteVideos[resourceJid].
                        waitForPlayback(sel, mediaStream);
                }
            });
        }

        // The endpoint that was being shown in the large video has dropped out
        // of the lastN set and there was no lastN pickup jid. We need to update
        // the large video now.

        if (updateLargeVideo) {
            var resource;
            var myResource
                = APP.xmpp.myResource();

            // Find out which endpoint to show in the large video.
            for (i = 0; i < lastNEndpoints.length; i++) {
                resource = lastNEndpoints[i];
                if (!resource || resource === myResource)
                    continue;

                // videoSrcToSsrc needs to be update for this call to succeed.
                LargeVideo.updateLargeVideo(resource);
                break;
            }
        }
    },

    /**
     * Updates local stats
     * @param percent
     * @param object
     */
    updateLocalConnectionStats (percent, object) {
        var resolution = null;
        if (object.resolution !== null) {
            resolution = object.resolution;
            object.resolution = resolution[APP.xmpp.myJid()];
            delete resolution[APP.xmpp.myJid()];
        }
        localVideoThumbnail.updateStatsIndicator(percent, object);
        for (var jid in resolution) {
            if (resolution[jid] === null)
                continue;
            var resourceJid = Strophe.getResourceFromJid(jid);
            if (remoteVideos[resourceJid] &&
                remoteVideos[resourceJid].connectionIndicator) {
                remoteVideos[resourceJid].connectionIndicator.
                    updateResolution(resolution[jid]);
            }
        }
    },

    /**
     * Updates remote stats.
     * @param jid the jid associated with the stats
     * @param percent the connection quality percent
     * @param object the stats data
     */
    updateConnectionStats (jid, percent, object) {
        var resourceJid = Strophe.getResourceFromJid(jid);

        if (remoteVideos[resourceJid])
            remoteVideos[resourceJid].updateStatsIndicator(percent, object);
    },

    /**
     * Hides the connection indicator
     * @param jid
     */
    hideConnectionIndicator (jid) {
        remoteVideos[Strophe.getResourceFromJid(jid)].hideConnectionIndicator();
    },

    /**
     * Hides all the indicators
     */
    hideStats () {
        for(var video in remoteVideos) {
            remoteVideos[video].hideIndicator();
        }
        localVideoThumbnail.hideIndicator();
    },

    participantLeft (id) {
        // Unlock large video
        if (focusedVideoResourceJid === id) {
            console.info("Focused video owner has left the conference");
            focusedVideoResourceJid = null;
        }

        if (currentDominantSpeaker === id) {
            console.info("Dominant speaker has left the conference");
            currentDominantSpeaker = null;
        }

        var remoteVideo = remoteVideos[id];
        if (remoteVideo) {
            // Remove remote video
            console.info("Removing remote video: " + id);
            delete remoteVideos[id];
            remoteVideo.remove();
        } else {
            console.warn("No remote video for " + id);
        }

        VideoLayout.resizeThumbnails();
    },

    onVideoTypeChanged (id, newVideoType) {
        if (remoteVideoTypes[id] === newVideoType) {
            return;
        }

        console.info("Peer video type changed: ", id, newVideoType);
        remoteVideoTypes[id] = newVideoType;

        var smallVideo;
        if (APP.conference.isLocalId(id)) {
            if (!localVideoThumbnail) {
                console.warn("Local video not ready yet");
                return;
            }
            smallVideo = localVideoThumbnail;
        } else if (remoteVideos[id]) {
            smallVideo = remoteVideos[id];
        } else {
            return;
        }

        smallVideo.setVideoType(newVideoType);
        LargeVideo.onVideoTypeChanged(id, newVideoType);
    },

    /**
     * Updates the video size and position.
     */
    updateLargeVideoSize () {
        LargeVideo.updateVideoSizeAndPosition();
        LargeVideo.position(null, null, null, null, true);
    },

    showMore (jid) {
        if (jid === 'local') {
            localVideoThumbnail.connectionIndicator.showMore();
        } else {
            var remoteVideo = remoteVideos[Strophe.getResourceFromJid(jid)];
            if (remoteVideo) {
                remoteVideo.connectionIndicator.showMore();
            } else {
                console.info("Error - no remote video for jid: " + jid);
            }
        }
    },

    addPreziContainer (id) {
        var container = RemoteVideo.createContainer(id);
        VideoLayout.resizeThumbnails();
        return container;
    },

    setLargeVideoVisible (isVisible) {
        LargeVideo.setLargeVideoVisible(isVisible);
        if(!isVisible && focusedVideoResourceJid) {
            var smallVideo = VideoLayout.getSmallVideo(focusedVideoResourceJid);
            if(smallVideo) {
                smallVideo.focus(false);
                smallVideo.showAvatar();
            }
            focusedVideoResourceJid = null;
        }
    },

    /**
     * Resizes the video area.
     *
     * @param isSideBarVisible indicates if the side bar is currently visible
     * @param callback a function to be called when the video space is
     * resized.
     */
    resizeVideoArea (isSideBarVisible, callback) {
        LargeVideo.resizeVideoAreaAnimated(isSideBarVisible, callback);
        VideoLayout.resizeThumbnails(true);
    },

    /**
     * Resizes the #videospace html element
     * @param animate boolean property that indicates whether the resize should
     * be animated or not.
     * @param isChatVisible boolean property that indicates whether the chat
     * area is displayed or not.
     * If that parameter is null the method will check the chat panel
     * visibility.
     * @param completeFunction a function to be called when the video space
     * is resized.
     */
    resizeVideoSpace (animate, isChatVisible, completeFunction) {
        var availableHeight = window.innerHeight;
        var availableWidth = UIUtil.getAvailableVideoWidth(isChatVisible);

        if (availableWidth < 0 || availableHeight < 0) return;

        if(animate) {
            $('#videospace').animate({
                    right: window.innerWidth - availableWidth,
                    width: availableWidth,
                    height: availableHeight
                },
                {
                    queue: false,
                    duration: 500,
                    complete: completeFunction
                });
        } else {
            $('#videospace').width(availableWidth);
            $('#videospace').height(availableHeight);
        }

    },

    getSmallVideo (id) {
        if (APP.conference.isLocalId(id)) {
            return localVideoThumbnail;
        } else {
            return remoteVideos[id];
        }
    },

    changeUserAvatar (id, thumbUrl) {
        var smallVideo = VideoLayout.getSmallVideo(id);
        if (smallVideo) {
            smallVideo.avatarChanged(thumbUrl);
        } else {
            console.warn(
                "Missed avatar update - no small video yet for " + id
            );
        }
        LargeVideo.updateAvatar(id, thumbUrl);
    },

    createEtherpadIframe (src, onloadHandler) {
        return LargeVideo.createEtherpadIframe(src, onloadHandler);
    },

    setLargeVideoState (state) {
        LargeVideo.setState(state);
    },

    getLargeVideoState () {
        return LargeVideo.getState();
    },

    setLargeVideoHover (inHandler, outHandler) {
        LargeVideo.setHover(inHandler, outHandler);
    },

    /**
     * Indicates that the video has been interrupted.
     */
    onVideoInterrupted () {
        LargeVideo.enableVideoProblemFilter(true);
        var reconnectingKey = "connection.RECONNECTING";
        $('#videoConnectionMessage').attr("data-i18n", reconnectingKey);
        $('#videoConnectionMessage')
            .text(APP.translation.translateString(reconnectingKey));
        $('#videoConnectionMessage').css({display: "block"});
    },

    /**
     * Indicates that the video has been restored.
     */
    onVideoRestored () {
        LargeVideo.enableVideoProblemFilter(false);
        $('#videoConnectionMessage').css({display: "none"});
    }
};

export default VideoLayout;
