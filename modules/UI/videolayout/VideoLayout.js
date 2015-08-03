/* global config, APP, $, Strophe, require, interfaceConfig */
var AudioLevels = require("../audio_levels/AudioLevels");
var ContactList = require("../side_pannels/contactlist/ContactList");
var MediaStreamType = require("../../../service/RTC/MediaStreamTypes");
var UIEvents = require("../../../service/UI/UIEvents");

var RTC = require("../../RTC/RTC");
var RTCBrowserType = require('../../RTC/RTCBrowserType');

var RemoteVideo = require("./RemoteVideo");
var LargeVideo = require("./LargeVideo");
var LocalVideo = require("./LocalVideo");

var remoteVideos = {};
var localVideoThumbnail = null;

var currentDominantSpeaker = null;
var lastNCount = config.channelLastN;
var localLastNCount = config.channelLastN;
var localLastNSet = [];
var lastNEndpointsCache = [];
var lastNPickupJid = null;

var eventEmitter = null;

/**
 * Currently focused video jid
 * @type {String}
 */
var focusedVideoResourceJid = null;

var VideoLayout = (function (my) {
    my.init = function (emitter) {
        eventEmitter = emitter;
        localVideoThumbnail = new LocalVideo(VideoLayout);

        LargeVideo.init(VideoLayout, emitter);
        VideoLayout.resizeLargeVideoContainer();

    };

    my.isInLastN = function(resource) {
        return lastNCount < 0 || // lastN is disabled
             // lastNEndpoints cache not built yet
            (lastNCount > 0 && lastNEndpointsCache.length == 0) ||
            (lastNEndpointsCache &&
                lastNEndpointsCache.indexOf(resource) !== -1);
    };

    my.changeLocalStream = function (stream, isMuted) {
        VideoLayout.changeLocalVideo(stream, isMuted);
    };

    my.changeLocalAudio = function(stream, isMuted) {
        if (isMuted)
            APP.UI.setAudioMuted(true, true);
        APP.RTC.attachMediaStream($('#localAudio'), stream.getOriginalStream());
        var localAudio = document.getElementById('localAudio');
        // Writing volume not allowed in IE
        if (!RTCBrowserType.isIExplorer()) {
            localAudio.autoplay = true;
            localAudio.volume = 0;
        }
    };

    my.changeLocalVideo = function(stream, isMuted) {
        // Set default display name.
        localVideoThumbnail.setDisplayName();
        localVideoThumbnail.createConnectionIndicator();

        AudioLevels.updateAudioLevelCanvas(null, VideoLayout);

        localVideoThumbnail.changeVideo(stream, isMuted);

        /* force update if we're currently being displayed */
        if (LargeVideo.isCurrentlyOnLarge(APP.xmpp.myResource())) {
            LargeVideo.updateLargeVideo(APP.xmpp.myResource(), true);
        }
    };

    my.mucJoined = function () {
        var myResourceJid = APP.xmpp.myResource();
        localVideoThumbnail.joined(APP.xmpp.myJid());

        if (!LargeVideo.getResourceJid())
            LargeVideo.updateLargeVideo(myResourceJid, true);
    };

    /**
     * Adds or removes icons for not available camera and microphone.
     * @param resourceJid the jid of user
     * @param devices available devices
     */
    my.setDeviceAvailabilityIcons = function (resourceJid, devices) {
        if(!devices)
            return;

        if(!resourceJid) {
            localVideoThumbnail.setDeviceAvailabilityIcons(devices);
        } else {
            if(remoteVideos[resourceJid])
                remoteVideos[resourceJid].setDeviceAvailabilityIcons(devices);
        }
    };

    /**
     * Checks if removed video is currently displayed and tries to display
     * another one instead.
     * @param removedVideoSrc src stream identifier of the video.
     */
    my.updateRemovedVideo = function(resourceJid) {

        if (resourceJid === LargeVideo.getResourceJid()) {
            var newResourceJid;
            // We'll show user's avatar if he is the dominant speaker or if
            // his video thumbnail is pinned
            if (remoteVideos[resourceJid] &&
                resourceJid === focusedVideoResourceJid ||
                resourceJid === currentDominantSpeaker) {
                newResourceJid = resourceJid;
            } else {
                // Otherwise select last visible video
                newResourceJid = this.electLastVisibleVideo();
            }
            LargeVideo.updateLargeVideo(newResourceJid);
        }
    };

    my.electLastVisibleVideo = function() {
        // pick the last visible video in the row
        // if nobody else is left, this picks the local video
        var jid;
        var videoElem = RTC.getVideoElementName();
        var pick = $('#remoteVideos>span[id!="mixedstream"]:visible:last>' + videoElem);
        if (pick.length && APP.RTC.getVideoSrc(pick[0])) {
            jid = VideoLayout.getPeerContainerResourceJid(pick[0].parentNode);
        } else {
            console.info("Last visible video no longer exists");
            pick = $('#remoteVideos>span[id!="mixedstream"]>' + videoElem);
            if (pick.length && APP.RTC.getVideoSrc(pick[0])) {
                jid = VideoLayout.getPeerContainerResourceJid(pick[0].parentNode);
            } else {
                // Try local video
                console.info("Fallback to local video...");
                jid = APP.xmpp.myResource();
            }
        }
        console.info("electLastVisibleVideo: " + jid);
        return jid;
    };
    
    my.onRemoteStreamAdded = function (stream) {
        if (stream.peerjid) {
            VideoLayout.ensurePeerContainerExists(stream.peerjid);

            var resourceJid = Strophe.getResourceFromJid(stream.peerjid);
            remoteVideos[resourceJid].addRemoteStreamElement(
                stream.sid,
                stream.getOriginalStream(),
                stream.ssrc);
        }
    };

    my.getLargeVideoJid = function () {
        return LargeVideo.getResourceJid();
    };

    /**
     * Called when large video update is finished
     * @param currentSmallVideo small video currently displayed on large video
     */
    my.largeVideoUpdated = function (currentSmallVideo) {
        // Makes sure that dominant speaker UI
        // is enabled only on current small video
        localVideoThumbnail.enableDominantSpeaker(
            localVideoThumbnail === currentSmallVideo);
        Object.keys(remoteVideos).forEach(
            function (resourceJid) {
                var remoteVideo = remoteVideos[resourceJid];
                if (remoteVideo) {
                    remoteVideo.enableDominantSpeaker(
                        remoteVideo === currentSmallVideo);
                }
            }
        );
    };

    my.handleVideoThumbClicked = function(noPinnedEndpointChangedEvent,
                                          resourceJid) {
        if(focusedVideoResourceJid) {
            var oldSmallVideo = VideoLayout.getSmallVideo(focusedVideoResourceJid);
            if(oldSmallVideo)
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
            if(smallVideo)
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
    };


    /**
     * Checks if container for participant identified by given peerJid exists
     * in the document and creates it eventually.
     * 
     * @param peerJid peer Jid to check.
     * 
     * @return Returns <tt>true</tt> if the peer container exists,
     * <tt>false</tt> - otherwise
     */
    my.ensurePeerContainerExists = function(peerJid) {
        ContactList.ensureAddContact(peerJid);

        var resourceJid = Strophe.getResourceFromJid(peerJid);

        if(!remoteVideos[resourceJid]) {
            remoteVideos[resourceJid] = new RemoteVideo(peerJid, VideoLayout);

            // In case this is not currently in the last n we don't show it.
            if (localLastNCount &&
                localLastNCount > 0 &&
                $('#remoteVideos>span').length >= localLastNCount + 2) {
                remoteVideos[resourceJid].showPeerContainer('hide');
            }
            else
                VideoLayout.resizeThumbnails();
        }
    };


    my.inputDisplayNameHandler = function (name) {
        localVideoThumbnail.inputDisplayNameHandler(name);
    };

    my.videoactive = function (videoelem, resourceJid) {

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
    };

    /**
     * Shows the presence status message for the given video.
     */
    my.setPresenceStatus = function (resourceJid, statusMsg) {
        remoteVideos[resourceJid].setPresenceStatus(statusMsg);
    };

    /**
     * Shows a visual indicator for the moderator of the conference.
     */
    my.showModeratorIndicator = function () {

        var isModerator = APP.xmpp.isModerator();
        if (isModerator) {
            localVideoThumbnail.createModeratorIndicatorElement();
        }

        var members = APP.xmpp.getMembers();

        Object.keys(members).forEach(function (jid) {

            if (Strophe.getResourceFromJid(jid) === 'focus') {
                // Skip server side focus
                return;
            }

            var resourceJid = Strophe.getResourceFromJid(jid);
            var member = members[jid];

            if (member.role === 'moderator') {
                remoteVideos[resourceJid].removeRemoteVideoMenu();
                remoteVideos[resourceJid].createModeratorIndicatorElement();
            } else if (isModerator) {
                // We are moderator, but user is not - add menu
                if ($('#remote_popupmenu_' + resourceJid).length <= 0) {
                    remoteVideos[resourceJid].addRemoteVideoMenu();
                }
            }
        });
    };

    /*
     * Shows or hides the audio muted indicator over the local thumbnail video.
     * @param {boolean} isMuted
     */
    my.showLocalAudioIndicator = function(isMuted) {
        localVideoThumbnail.showAudioIndicator(isMuted);
    };

    /**
     * Resizes the large video container.
     */
    my.resizeLargeVideoContainer = function () {
        LargeVideo.resize();
        VideoLayout.resizeThumbnails();
        LargeVideo.position();
    };

    /**
     * Resizes thumbnails.
     */
    my.resizeThumbnails = function(animate) {
        var videoSpaceWidth = $('#remoteVideos').width();

        var thumbnailSize = VideoLayout.calculateThumbnailSize(videoSpaceWidth);
        var width = thumbnailSize[0];
        var height = thumbnailSize[1];

        $('.userAvatar').css('left', (width - height) / 2);

        if(animate) {
            $('#remoteVideos').animate({
                    height: height
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
            $('#remoteVideos').height(height);
            $('#remoteVideos>span').width(width);
            $('#remoteVideos>span').height(height);

            $(document).trigger("remotevideo.resized", [width, height]);
        }
    };

    /**
     * Calculates the thumbnail size.
     *
     * @param videoSpaceWidth the width of the video space
     */
    my.calculateThumbnailSize = function (videoSpaceWidth) {
        // Calculate the available height, which is the inner window height minus
       // 39px for the header minus 2px for the delimiter lines on the top and
       // bottom of the large video, minus the 36px space inside the remoteVideos
       // container used for highlighting shadow.
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
       availableHeight = Math.min(maxHeight, availableWidth / aspectRatio);
       if (availableHeight < availableWidth / aspectRatio) {
           availableWidth = Math.floor(availableHeight * aspectRatio);
       }

       return [availableWidth, availableHeight];
   };

    /**
     * Returns the corresponding resource jid to the given peer container
     * DOM element.
     *
     * @return the corresponding resource jid to the given peer container
     * DOM element
     */
    my.getPeerContainerResourceJid = function (containerElement) {
        var i = containerElement.id.indexOf('participant_');

        if (i >= 0)
            return containerElement.id.substring(i + 12); 
    };

    my.getPeerVideoSel = function (peerResourceJid) {
        return $('#participant_'  + peerResourceJid +
                 '>' + APP.RTC.getVideoElementName());
    };

    /**
     * On contact list item clicked.
     */
    $(ContactList).bind('contactclicked', function(event, jid) {
        if (!jid) {
            return;
        }

        if (jid === APP.xmpp.myJid()) {
            $("#localVideoContainer").click();
            return;
        }

        var resource = Strophe.getResourceFromJid(jid);
        var videoSel = VideoLayout.getPeerVideoSel(resource);
        if (videoSel.length > 0) {
            var videoThumb = videoSel[0];
            // It is not always the case that a videoThumb exists (if there is
            // no actual video).
            if (RTC.getVideoSrc(videoThumb)) {

                // We have a video src, great! Let's update the large video
                // now.
                VideoLayout.handleVideoThumbClicked(
                    false,
                    Strophe.getResourceFromJid(jid));
            } else {

                // If we don't have a video src for jid, there's absolutely
                // no point in calling handleVideoThumbClicked; Quite
                // simply, it won't work because it needs an src to attach
                // to the large video.
                //
                // Instead, we trigger the pinned endpoint changed event to
                // let the bridge adjust its lastN set for myjid and store
                // the pinned user in the lastNPickupJid variable to be
                // picked up later by the lastN changed event handler.

                lastNPickupJid = jid;
                eventEmitter.emit(UIEvents.PINNED_ENDPOINT,
                    Strophe.getResourceFromJid(jid));
            }
        }
    });

    /**
     * On audio muted event.
     */
    my.onAudioMute = function (jid, isMuted) {
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
    };

    /**
     * On video muted event.
     */
    my.onVideoMute = function (jid, value) {
        if (jid !== APP.xmpp.myJid() &&
            !APP.RTC.muteRemoteVideoStream(jid, value))
            return;

        if (jid === APP.xmpp.myJid()) {
            localVideoThumbnail.showVideoIndicator(value);
        } else {
            var resource = Strophe.getResourceFromJid(jid);

            VideoLayout.ensurePeerContainerExists(jid);
            remoteVideos[resource].showVideoIndicator(value);

            var el = VideoLayout.getPeerVideoSel(resource);
            if (!value)
                el.show();
            else
                el.hide();
        }
    };

    /**
     * Display name changed.
     */
    my.onDisplayNameChanged =
                    function (jid, displayName, status) {
        if (jid === 'localVideoContainer' ||
            jid === APP.xmpp.myJid()) {
            localVideoThumbnail.setDisplayName(displayName);
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            remoteVideos[Strophe.getResourceFromJid(jid)].setDisplayName(
                displayName,
                status);
        }
    };

    /**
     * On dominant speaker changed event.
     */
    my.onDominantSpeakerChanged = function (resourceJid) {
        // We ignore local user events.
        if (resourceJid === APP.xmpp.myResource())
            return;

        var members = APP.xmpp.getMembers();
        // Update the current dominant speaker.
        if (resourceJid !== currentDominantSpeaker) {
            var currentJID = APP.xmpp.findJidFromResource(currentDominantSpeaker);
            var newJID = APP.xmpp.findJidFromResource(resourceJid);
            if(currentDominantSpeaker && (!members || !members[currentJID] ||
                !members[currentJID].displayName) && remoteVideos[resourceJid]) {
                remoteVideos[resourceJid].setDisplayName(null);
            }
            if(resourceJid && (!members || !members[newJID] ||
                !members[newJID].displayName) && remoteVideos[resourceJid]) {
                remoteVideos[resourceJid].setDisplayName(null,
                    interfaceConfig.DEFAULT_DOMINANT_SPEAKER_DISPLAY_NAME);
            }
            currentDominantSpeaker = resourceJid;
        } else {
            return;
        }

        // Obtain container for new dominant speaker.
        var videoSel  = VideoLayout.getPeerVideoSel(resourceJid);

        // Local video will not have container found, but that's ok
        // since we don't want to switch to local video.
        if (!focusedVideoResourceJid && videoSel.length) {
            // Update the large video if the video source is already available,
            // otherwise wait for the "videoactive.jingle" event.
            if (videoSel[0].currentTime > 0) {
                LargeVideo.updateLargeVideo(resourceJid);
            }
        }
    };

    /**
     * On last N change event.
     *
     * @param lastNEndpoints the list of last N endpoints
     * @param endpointsEnteringLastN the list currently entering last N
     * endpoints
     */
    my.onLastNEndpointsChanged = function (lastNEndpoints,
                                           endpointsEnteringLastN,
                                           stream) {
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

            var isReceived = true;
            if (resourceJid &&
                lastNEndpoints.indexOf(resourceJid) < 0 &&
                localLastNSet.indexOf(resourceJid) < 0) {
                console.log("Remove from last N", resourceJid);
                remoteVideos[resourceJid].showPeerContainer('hide');
                isReceived = false;
            } else if (resourceJid &&
                $('#participant_' + resourceJid).is(':visible') &&
                lastNEndpoints.indexOf(resourceJid) < 0 &&
                localLastNSet.indexOf(resourceJid) >= 0) {
                remoteVideos[resourceJid].showPeerContainer('avatar');
                isReceived = false;
            }

            if (!isReceived) {
                // resourceJid has dropped out of the server side lastN set, so
                // it is no longer being received. If resourceJid was being
                // displayed in the large video we have to switch to another
                // user.
                if (!updateLargeVideo &&
                    resourceJid === LargeVideo.getResourceJid()) {
                    updateLargeVideo = true;
                }
            }
        });

        if (!endpointsEnteringLastN || endpointsEnteringLastN.length < 0)
            endpointsEnteringLastN = lastNEndpoints;

        if (endpointsEnteringLastN && endpointsEnteringLastN.length > 0) {
            endpointsEnteringLastN.forEach(function (resourceJid) {

                var isVisible = $('#participant_' + resourceJid).is(':visible');
                remoteVideos[resourceJid].showPeerContainer('show');
                if (!isVisible) {
                    console.log("Add to last N", resourceJid);

                    var jid = APP.xmpp.findJidFromResource(resourceJid);
                    var mediaStream =
                        APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
                    var sel = VideoLayout.getPeerVideoSel(resourceJid);

                    APP.RTC.attachMediaStream(sel, mediaStream.stream);
                    if (lastNPickupJid == mediaStream.peerjid) {
                        // Clean up the lastN pickup jid.
                        lastNPickupJid = null;

                        // Don't fire the events again, they've already
                        // been fired in the contact list click handler.
                        VideoLayout.handleVideoThumbClicked(
                            false,
                            Strophe.getResourceFromJid(mediaStream.peerjid));

                        updateLargeVideo = false;
                    }
                    remoteVideos[resourceJid].
                        waitForPlayback(sel, mediaStream.stream);
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
    };

    /**
     * Updates local stats
     * @param percent
     * @param object
     */
    my.updateLocalConnectionStats = function (percent, object) {
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
    };

    /**
     * Updates remote stats.
     * @param jid the jid associated with the stats
     * @param percent the connection quality percent
     * @param object the stats data
     */
    my.updateConnectionStats = function (jid, percent, object) {
        var resourceJid = Strophe.getResourceFromJid(jid);

        if (remoteVideos[resourceJid])
            remoteVideos[resourceJid].updateStatsIndicator(percent, object);
    };

    /**
     * Hides the connection indicator
     * @param jid
     */
    my.hideConnectionIndicator = function (jid) {
        remoteVideos[Strophe.getResourceFromJid(jid)].hideConnectionIndicator();
    };

    /**
     * Hides all the indicators
     */
    my.onStatsStop = function () {
        for(var video in remoteVideos) {
            remoteVideos[video].hideIndicator();
        }
        localVideoThumbnail.hideIndicator();
    };

    my.participantLeft = function (jid) {
        // Unlock large video
        var resourceJid = Strophe.getResourceFromJid(jid);
        if (focusedVideoResourceJid === resourceJid) {
            console.info("Focused video owner has left the conference");
            focusedVideoResourceJid = null;
        }

        if (currentDominantSpeaker === resourceJid)
        {
            console.info("Dominant speaker has left the conference");
            currentDominantSpeaker = null;
        }

        var remoteVideo = remoteVideos[resourceJid];
        if (remoteVideo) {
            // Remove remote video
            console.info("Removing remote video: " + resourceJid);
            remoteVideo.remove();
            delete remoteVideos[resourceJid];
        } else {
            console.warn("No remote video for " + resourceJid);
        }

        VideoLayout.resizeThumbnails();
    };
    
    my.onVideoTypeChanged = function (jid) {
        LargeVideo.onVideoTypeChanged(jid);
    };

    my.showMore = function (jid) {
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
    };

    my.addPreziContainer = function (id) {
        var container = RemoteVideo.createContainer(id);
        VideoLayout.resizeThumbnails();
        return container;
    };

    my.setLargeVideoVisible = function (isVisible) {
        LargeVideo.setLargeVideoVisible(isVisible);
        if(!isVisible && focusedVideoResourceJid) {
            var smallVideo = VideoLayout.getSmallVideo(focusedVideoResourceJid);
            if(smallVideo) {
                smallVideo.focus(false);
                smallVideo.showAvatar();
            }
            focusedVideoResourceJid = null;
        }
    };

    /**
     * Resizes the video area
     * @param callback a function to be called when the video space is
     * resized.
     */
    my.resizeVideoArea = function(isVisible, callback) {
        LargeVideo.resizeVideoAreaAnimated(isVisible, callback);
        VideoLayout.resizeThumbnails(true);
    };

    my.getSmallVideo = function (resourceJid) {
        if(resourceJid == APP.xmpp.myResource()) {
            return localVideoThumbnail;
        } else {
            if(!remoteVideos[resourceJid])
                return null;
            return remoteVideos[resourceJid];
        }
    };

    my.userAvatarChanged = function(resourceJid, thumbUrl) {
        var smallVideo = VideoLayout.getSmallVideo(resourceJid);
        if(smallVideo)
            smallVideo.avatarChanged(thumbUrl);
        else
            console.warn(
                "Missed avatar update - no small video yet for " + resourceJid);
        LargeVideo.updateAvatar(resourceJid, thumbUrl);
    };

    my.createEtherpadIframe = function(src, onloadHandler)
    {
        return LargeVideo.createEtherpadIframe(src, onloadHandler);
    };

    my.setLargeVideoState = function (state) {
        LargeVideo.setState(state);
    };

    my.getLargeVideoState = function () {
        return LargeVideo.getState();
    };

    my.setLargeVideoHover = function (inHandler, outHandler) {
        LargeVideo.setHover(inHandler, outHandler);
    };

    /**
     * Indicates that the video has been interrupted.
     */
    my.onVideoInterrupted = function () {
        LargeVideo.enableVideoProblemFilter(true);
        var reconnectingKey = "connection.RECONNECTING";
        $('#videoConnectionMessage').attr("data-i18n", reconnectingKey);
        $('#videoConnectionMessage').text(APP.translation.translateString(reconnectingKey));
        $('#videoConnectionMessage').css({display: "block"});
    };

    /**
     * Indicates that the video has been restored.
     */
    my.onVideoRestored = function () {
        LargeVideo.enableVideoProblemFilter(false);
        $('#videoConnectionMessage').css({display: "none"});
    };

    return my;
}(VideoLayout || {}));

module.exports = VideoLayout;