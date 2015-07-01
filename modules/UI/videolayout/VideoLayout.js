var AudioLevels = require("../audio_levels/AudioLevels");
var Avatar = require("../avatar/Avatar");
var ContactList = require("../side_pannels/contactlist/ContactList");
var MediaStreamType = require("../../../service/RTC/MediaStreamTypes");
var UIEvents = require("../../../service/UI/UIEvents");
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
        VideoLayout.resizeLargeVideoContainer();
        LargeVideo.init(VideoLayout, emitter);
    };

    my.isInLastN = function(resource) {
        return lastNCount < 0 // lastN is disabled, return true
            || (lastNCount > 0 && lastNEndpointsCache.length == 0) // lastNEndpoints cache not built yet, return true
            || (lastNEndpointsCache && lastNEndpointsCache.indexOf(resource) !== -1);
    };

    my.changeLocalStream = function (stream, isMuted) {
        VideoLayout.changeLocalVideo(stream, isMuted);
    };

    my.changeLocalAudio = function(stream, isMuted) {
        if(isMuted)
            APP.UI.setAudioMuted(true, true);
        APP.RTC.attachMediaStream($('#localAudio'), stream.getOriginalStream());
        document.getElementById('localAudio').autoplay = true;
        document.getElementById('localAudio').volume = 0;
    };

    my.changeLocalVideo = function(stream, isMuted) {
        // Set default display name.
        localVideoThumbnail.setDisplayName();
        localVideoThumbnail.createConnectionIndicator();

        AudioLevels.updateAudioLevelCanvas(null, VideoLayout);

        localVideoThumbnail.changeVideo(stream, isMuted);

        LargeVideo.updateLargeVideo(APP.xmpp.myResource());

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

        if(!resourceJid)
        {
            localVideoThumbnail.setDeviceAvailabilityIcons(devices);
        }
        else
        {
            if(remoteVideos[resourceJid])
                remoteVideos[resourceJid].setDeviceAvailabilityIcons(devices);
        }


    }

    /**
     * Checks if removed video is currently displayed and tries to display
     * another one instead.
     * @param removedVideoSrc src stream identifier of the video.
     */
    my.updateRemovedVideo = function(resourceJid) {
        if (resourceJid === LargeVideo.getResourceJid()) {
            // this is currently displayed as large
            // pick the last visible video in the row
            // if nobody else is left, this picks the local video
            var pick
                = $('#remoteVideos>span[id!="mixedstream"]:visible:last>video')
                    .get(0);

            if (!pick) {
                console.info("Last visible video no longer exists");
                pick = $('#remoteVideos>span[id!="mixedstream"]>video').get(0);

                if (!pick || !APP.RTC.getVideoSrc(pick)) {
                    // Try local video
                    console.info("Fallback to local video...");
                    pick = $('#remoteVideos>span>span>video').get(0);
                }
            }

            // mute if localvideo
            if (pick) {
                var container = pick.parentNode;
            } else {
                console.warn("Failed to elect large video");
                container = $('#remoteVideos>span[id!="mixedstream"]:visible:last').get(0);

            }

            var jid = null;
            if(container)
            {
                if(container.id == "localVideoWrapper")
                {
                    jid = APP.xmpp.myResource();
                }
                else
                {
                    jid = VideoLayout.getPeerContainerResourceJid(container);
                }
            }
            else
                return;

            LargeVideo.updateLargeVideo(jid);
        }
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
                if(smallVideo && smallVideo.hasVideo())
                {
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
        if (resourceJid)
        {
            if(smallVideo)
                smallVideo.focus(true);

            if (!noPinnedEndpointChangedEvent) {
                eventEmitter.emit(UIEvents.PINNED_ENDPOINT, resourceJid);
            }
        }

        if (LargeVideo.getResourceJid() === resourceJid &&
            LargeVideo.isLargeVideoOnTop()) {
            return;
        }

        // Triggers a "video.selected" event. The "false" parameter indicates
        // this isn't a prezi.
        $(document).trigger("video.selected", [false]);

        LargeVideo.updateLargeVideo(resourceJid);

        $('audio').each(function (idx, el) {
            el.volume = 0;
            el.volume = 1;
        });
    };


    /**
     * Checks if container for participant identified by given peerJid exists
     * in the document and creates it eventually.
     * 
     * @param peerJid peer Jid to check.
     * @param userId user email or id for setting the avatar
     * 
     * @return Returns <tt>true</tt> if the peer container exists,
     * <tt>false</tt> - otherwise
     */
    my.ensurePeerContainerExists = function(peerJid, userId) {
        ContactList.ensureAddContact(peerJid, userId);

        var resourceJid = Strophe.getResourceFromJid(peerJid);

        if(!remoteVideos[resourceJid])
        {
            remoteVideos[resourceJid] = new RemoteVideo(peerJid, VideoLayout);
            Avatar.setUserAvatar(peerJid, userId);

            // In case this is not currently in the last n we don't show it.
            if (localLastNCount
                && localLastNCount > 0
                && $('#remoteVideos>span').length >= localLastNCount + 2) {
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
        videoelem.show();
        VideoLayout.resizeThumbnails();

        // Update the large video to the last added video only if there's no
        // current dominant, focused speaker or prezi playing or update it to
        // the current dominant speaker.
        if ((!focusedVideoResourceJid &&
            !currentDominantSpeaker &&
            !require("../prezi/Prezi").isPresentationVisible()) ||
            (resourceJid &&
                currentDominantSpeaker === resourceJid)) {
            LargeVideo.updateLargeVideo(resourceJid, true);
        }
    }

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

        if(animate)
        {
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

        }
        else
        {
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

    /**
     * On contact list item clicked.
     */
    $(ContactList).bind('contactclicked', function(event, jid) {
        if (!jid) {
            return;
        }

        var resource = Strophe.getResourceFromJid(jid);
        var videoContainer = $("#participant_" + resource);
        if (videoContainer.length > 0) {
            var videoThumb = $('video', videoContainer).get(0);
            // It is not always the case that a videoThumb exists (if there is
            // no actual video).
            if (videoThumb) {
                if (videoThumb.src && videoThumb.src != '') {

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
            } else if (jid == APP.xmpp.myJid()) {
                $("#localVideoContainer").click();
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
        if(jid !== APP.xmpp.myJid() && !APP.RTC.muteRemoteVideoStream(jid, value))
            return;

        if (jid === APP.xmpp.myJid()) {
            localVideoThumbnail.showVideoIndicator(value);
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            remoteVideos[Strophe.getResourceFromJid(jid)].showVideoIndicator(value);
        }
    };

    /**
     * Display name changed.
     */
    my.onDisplayNameChanged =
                    function (jid, displayName, status) {
        if (jid === 'localVideoContainer'
            || jid === APP.xmpp.myJid()) {
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
                !members[currentJID].displayName)) {
                remoteVideos[resourceJid].setDisplayName(null);
            }
            if(resourceJid && (!members || !members[newJID] ||
                !members[newJID].displayName)) {
                remoteVideos[resourceJid].setDisplayName(null,
                    interfaceConfig.DEFAULT_DOMINANT_SPEAKER_DISPLAY_NAME);
            }
            currentDominantSpeaker = resourceJid;
        } else {
            return;
        }

        // Obtain container for new dominant speaker.
        var container  = document.getElementById(
                'participant_' + resourceJid);

        // Local video will not have container found, but that's ok
        // since we don't want to switch to local video.
        if (container && !focusedVideoResourceJid)
        {
            var video = container.getElementsByTagName("video");

            // Update the large video if the video source is already available,
            // otherwise wait for the "videoactive.jingle" event.
            if (video.length && video[0].currentTime > 0) {
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
    my.onLastNEndpointsChanged = function ( lastNEndpoints,
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
            if (resourceJid
                && lastNEndpoints.indexOf(resourceJid) < 0
                && localLastNSet.indexOf(resourceJid) < 0) {
                console.log("Remove from last N", resourceJid);
                remoteVideos[resourceJid].showPeerContainer('hide');
                isReceived = false;
            } else if (resourceJid
                && $('#participant_' + resourceJid).is(':visible')
                && lastNEndpoints.indexOf(resourceJid) < 0
                && localLastNSet.indexOf(resourceJid) >= 0) {
                remoteVideos[resourceJid].showPeerContainer('avatar');
                isReceived = false;
            }

            if (!isReceived) {
                // resourceJid has dropped out of the server side lastN set, so
                // it is no longer being received. If resourceJid was being
                // displayed in the large video we have to switch to another
                // user.
                if (!updateLargeVideo && resourceJid === LargeVideo.getResourceJid()) {
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
                    var mediaStream = APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
                    var sel = $('#participant_' + resourceJid + '>video');

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
                    remoteVideos[resourceJid].waitForRemoteVideo(sel, mediaStream.ssrc, mediaStream.stream);
                }
            });
        }

        // The endpoint that was being shown in the large video has dropped out
        // of the lastN set and there was no lastN pickup jid. We need to update
        // the large video now.

        if (updateLargeVideo) {

            var resource, container, src;
            var myResource
                = APP.xmpp.myResource();

            // Find out which endpoint to show in the large video.
            for (var i = 0; i < lastNEndpoints.length; i++) {
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
        if(object.resolution !== null)
        {
            resolution = object.resolution;
            object.resolution = resolution[APP.xmpp.myJid()];
            delete resolution[APP.xmpp.myJid()];
        }
        localVideoThumbnail.updateStatsIndicator(percent, object);
        for(var jid in resolution)
        {
            if(resolution[jid] === null)
                continue;
            var resourceJid = Strophe.getResourceFromJid(jid);
            if(remoteVideos[resourceJid] && remoteVideos[resourceJid].connectionIndicator)
            {
                remoteVideos[resourceJid].connectionIndicator.updateResolution(resolution[jid]);
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

        if(remoteVideos[resourceJid])
            remoteVideos[resourceJid].updateStatsIndicator(percent, object);
    };

    /**
     * Removes the connection
     * @param jid
     */
    my.removeConnectionIndicator = function (jid) {
        remoteVideos[Strophe.getResourceFromJid(jid)].removeConnectionIndicator();
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
        for(var video in remoteVideos)
        {
            remoteVideos[video].hideIndicator();
        }
        localVideoThumbnail.hideIndicator();
    };

    my.participantLeft = function (jid) {
        // Unlock large video
        var resourceJid = Strophe.getResourceFromJid(jid);
        if (focusedVideoResourceJid === resourceJid)
        {
            console.info("Focused video owner has left the conference");
            focusedVideoResourceJid = null;
        }
    };
    
    my.onVideoTypeChanged = function (jid) {
        LargeVideo.onVideoTypeChanged(jid);
    };

    my.showMore = function (jid) {
        if(APP.xmpp.myJid = jid)
        {
            localVideoThumbnail.connectionIndicator.showMore();
        }
        else
        {
            remoteVideos[Strophe.getResourceFromJid(jid)].connectionIndicator.showMore();
        }

    };

    my.addPreziContainer = function (id) {
        return RemoteVideo.createContainer(id);
    };

    my.setLargeVideoVisible = function (isVisible) {
        LargeVideo.setLargeVideoVisible(isVisible);
        if(!isVisible && focusedVideoResourceJid)
        {
            var smallVideo = VideoLayout.getSmallVideo(focusedVideoResourceJid);
            if(smallVideo)
                smallVideo.focus(false);
            smallVideo.showAvatar();
            focusedVideoResourceJid = null;
        }
    };


    /**
     * Resizes the video area
     * @param completeFunction a function to be called when the video space is resized
     */
    my.resizeVideoArea = function(isVisible, completeFunction) {
        LargeVideo.resizeVideoAreaAnimated(isVisible, completeFunction);
        VideoLayout.resizeThumbnails(true);

    };

    my.getSmallVideo = function (resourceJid) {
        if(resourceJid == APP.xmpp.myResource())
        {
            return localVideoThumbnail;
        }
        else
        {
            if(!remoteVideos[resourceJid])
                return null;
            return remoteVideos[resourceJid];
        }
    };

    my.userAvatarChanged = function(resourceJid, thumbUrl)
    {
        var smallVideo = VideoLayout.getSmallVideo(resourceJid);
        if(smallVideo)
            smallVideo.avatarChanged(thumbUrl);
        LargeVideo.updateAvatar(resourceJid, thumbUrl);
    };

    return my;
}(VideoLayout || {}));

module.exports = VideoLayout;