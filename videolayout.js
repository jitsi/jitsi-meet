var VideoLayout = (function (my) {
    var currentDominantSpeaker = null;
    var lastNCount = config.channelLastN;
    var localLastNCount = config.channelLastN;
    var localLastNSet = [];
    var lastNEndpointsCache = [];
    var lastNPickupJid = null;
    var largeVideoState = {
        updateInProgress: false,
        newSrc: ''
    };

    var defaultLocalDisplayName = "Me";

    my.connectionIndicators = {};

    my.isInLastN = function(resource) {
        return lastNCount < 0 // lastN is disabled, return true
            || (lastNCount > 0 && lastNEndpointsCache.length == 0) // lastNEndpoints cache not built yet, return true
            || (lastNEndpointsCache && lastNEndpointsCache.indexOf(resource) !== -1);
    };

    my.changeLocalStream = function (stream) {
        connection.jingle.localAudio = stream;
        VideoLayout.changeLocalVideo(stream, true);
    };

    my.changeLocalAudio = function(stream) {
        connection.jingle.localAudio = stream;
        RTC.attachMediaStream($('#localAudio'), stream);
        document.getElementById('localAudio').autoplay = true;
        document.getElementById('localAudio').volume = 0;
        if (preMuted) {
            setAudioMuted(true);
            preMuted = false;
        }
    };

    my.changeLocalVideo = function(stream, flipX) {
        connection.jingle.localVideo = stream;

        var localVideo = document.createElement('video');
        localVideo.id = 'localVideo_' + RTC.getStreamID(stream);
        localVideo.autoplay = true;
        localVideo.volume = 0; // is it required if audio is separated ?
        localVideo.oncontextmenu = function () { return false; };

        var localVideoContainer = document.getElementById('localVideoWrapper');
        localVideoContainer.appendChild(localVideo);

        // Set default display name.
        setDisplayName('localVideoContainer');

        if(!VideoLayout.connectionIndicators["localVideoContainer"]) {
            VideoLayout.connectionIndicators["localVideoContainer"]
                = new ConnectionIndicator($("#localVideoContainer")[0], null);
        }

        AudioLevels.updateAudioLevelCanvas();

        var localVideoSelector = $('#' + localVideo.id);
        // Add click handler to both video and video wrapper elements in case
        // there's no video.
        localVideoSelector.click(function (event) {
            event.stopPropagation();
            VideoLayout.handleVideoThumbClicked(
                RTC.getVideoSrc(localVideo),
                false,
                Strophe.getResourceFromJid(connection.emuc.myroomjid));
        });
        $('#localVideoContainer').click(function (event) {
            event.stopPropagation();
            VideoLayout.handleVideoThumbClicked(
                RTC.getVideoSrc(localVideo),
                false,
                Strophe.getResourceFromJid(connection.emuc.myroomjid));
        });

        // Add hover handler
        $('#localVideoContainer').hover(
            function() {
                VideoLayout.showDisplayName('localVideoContainer', true);
            },
            function() {
                if (!VideoLayout.isLargeVideoVisible()
                        || RTC.getVideoSrc(localVideo) !== RTC.getVideoSrc($('#largeVideo')[0]))
                    VideoLayout.showDisplayName('localVideoContainer', false);
            }
        );
        // Add stream ended handler
        stream.onended = function () {
            localVideoContainer.removeChild(localVideo);
            VideoLayout.updateRemovedVideo(RTC.getVideoSrc(localVideo));
        };
        // Flip video x axis if needed
        flipXLocalVideo = flipX;
        if (flipX) {
            localVideoSelector.addClass("flipVideoX");
        }
        // Attach WebRTC stream
        var videoStream = simulcast.getLocalVideoStream();
        RTC.attachMediaStream(localVideoSelector, videoStream);

        localVideoSrc = RTC.getVideoSrc(localVideo);

        var myResourceJid = null;
        if(connection.emuc.myroomjid)
        {
           myResourceJid = Strophe.getResourceFromJid(connection.emuc.myroomjid);
        }
        VideoLayout.updateLargeVideo(localVideoSrc, 0,
            myResourceJid);

    };

    /**
     * Checks if removed video is currently displayed and tries to display
     * another one instead.
     * @param removedVideoSrc src stream identifier of the video.
     */
    my.updateRemovedVideo = function(removedVideoSrc) {
        if (removedVideoSrc === RTC.getVideoSrc($('#largeVideo')[0])) {
            // this is currently displayed as large
            // pick the last visible video in the row
            // if nobody else is left, this picks the local video
            var pick
                = $('#remoteVideos>span[id!="mixedstream"]:visible:last>video')
                    .get(0);

            if (!pick) {
                console.info("Last visible video no longer exists");
                pick = $('#remoteVideos>span[id!="mixedstream"]>video').get(0);

                if (!pick || !RTC.getVideoSrc(pick)) {
                    // Try local video
                    console.info("Fallback to local video...");
                    pick = $('#remoteVideos>span>span>video').get(0);
                }
            }

            // mute if localvideo
            if (pick) {
                var container = pick.parentNode;
                var jid = null;
                if(container)
                {
                    if(container.id == "localVideoWrapper")
                    {
                        jid = Strophe.getResourceFromJid(connection.emuc.myroomjid);
                    }
                    else
                    {
                        jid = VideoLayout.getPeerContainerResourceJid(container);
                    }
                }

                VideoLayout.updateLargeVideo(RTC.getVideoSrc(pick), pick.volume, jid);
            } else {
                console.warn("Failed to elect large video");
            }
        }
    };

    my.getLargeVideoState = function () {
        return largeVideoState;
    };

    /**
     * Updates the large video with the given new video source.
     */
    my.updateLargeVideo = function(newSrc, vol, resourceJid) {
        console.log('hover in', newSrc);

        if (RTC.getVideoSrc($('#largeVideo')[0]) !== newSrc) {

            $('#activeSpeakerAvatar').css('visibility', 'hidden');
            // Due to the simulcast the localVideoSrc may have changed when the
            // fadeOut event triggers. In that case the getJidFromVideoSrc and
            // isVideoSrcDesktop methods will not function correctly.
            //
            // Also, again due to the simulcast, the updateLargeVideo method can
            // be called multiple times almost simultaneously. Therefore, we
            // store the state here and update only once.

            largeVideoState.newSrc = newSrc;
            largeVideoState.isVisible = $('#largeVideo').is(':visible');
            largeVideoState.isDesktop = isVideoSrcDesktop(resourceJid);
            if(jid2Ssrc[largeVideoState.userResourceJid] ||
                (connection && connection.emuc.myroomjid &&
                    largeVideoState.userResourceJid ===
                    Strophe.getResourceFromJid(connection.emuc.myroomjid))) {
                largeVideoState.oldResourceJid = largeVideoState.userResourceJid;
            } else {
                largeVideoState.oldResourceJid = null;
            }
            largeVideoState.userResourceJid = resourceJid;

            // Screen stream is already rotated
            largeVideoState.flipX = (newSrc === localVideoSrc) && flipXLocalVideo;

            var userChanged = false;
            if (largeVideoState.oldResourceJid !== largeVideoState.userResourceJid) {
                userChanged = true;
                // we want the notification to trigger even if userJid is undefined,
                // or null.
                $(document).trigger("selectedendpointchanged", [largeVideoState.userResourceJid]);
            }

            if (!largeVideoState.updateInProgress) {
                largeVideoState.updateInProgress = true;

                var doUpdate = function () {

                    Avatar.updateActiveSpeakerAvatarSrc(
                        connection.emuc.findJidFromResource(
                            largeVideoState.userResourceJid));

                    if (!userChanged && largeVideoState.preload &&
                        largeVideoState.preload !== null &&
                        RTC.getVideoSrc($(largeVideoState.preload)[0]) === newSrc)
                    {

                        console.info('Switching to preloaded video');
                        var attributes = $('#largeVideo').prop("attributes");

                        // loop through largeVideo attributes and apply them on
                        // preload.
                        $.each(attributes, function () {
                            if (this.name !== 'id' && this.name !== 'src') {
                                largeVideoState.preload.attr(this.name, this.value);
                            }
                        });

                        largeVideoState.preload.appendTo($('#largeVideoContainer'));
                        $('#largeVideo').attr('id', 'previousLargeVideo');
                        largeVideoState.preload.attr('id', 'largeVideo');
                        $('#previousLargeVideo').remove();

                        largeVideoState.preload.on('loadedmetadata', function (e) {
                            currentVideoWidth = this.videoWidth;
                            currentVideoHeight = this.videoHeight;
                            VideoLayout.positionLarge(currentVideoWidth, currentVideoHeight);
                        });
                        largeVideoState.preload = null;
                        largeVideoState.preload_ssrc = 0;
                    } else {
                        RTC.setVideoSrc($('#largeVideo')[0], largeVideoState.newSrc);
                    }

                    var videoTransform = document.getElementById('largeVideo')
                        .style.webkitTransform;

                    if (largeVideoState.flipX && videoTransform !== 'scaleX(-1)') {
                        document.getElementById('largeVideo').style.webkitTransform
                            = "scaleX(-1)";
                    }
                    else if (!largeVideoState.flipX && videoTransform === 'scaleX(-1)') {
                        document.getElementById('largeVideo').style.webkitTransform
                            = "none";
                    }

                    // Change the way we'll be measuring and positioning large video

                    getVideoSize = largeVideoState.isDesktop
                        ? getDesktopVideoSize
                        : getCameraVideoSize;
                    getVideoPosition = largeVideoState.isDesktop
                        ? getDesktopVideoPosition
                        : getCameraVideoPosition;


                    // Only if the large video is currently visible.
                    // Disable previous dominant speaker video.
                    if (largeVideoState.oldResourceJid) {
                        VideoLayout.enableDominantSpeaker(
                            largeVideoState.oldResourceJid,
                            false);
                    }

                    // Enable new dominant speaker in the remote videos section.
                    if (largeVideoState.userResourceJid) {
                        VideoLayout.enableDominantSpeaker(
                            largeVideoState.userResourceJid,
                            true);
                    }

                    if (userChanged && largeVideoState.isVisible) {
                        // using "this" should be ok because we're called
                        // from within the fadeOut event.
                        $(this).fadeIn(300);
                    }

                    if(userChanged) {
                        Avatar.showUserAvatar(
                            connection.emuc.findJidFromResource(
                                largeVideoState.oldResourceJid));
                    }

                    largeVideoState.updateInProgress = false;
                };

                if (userChanged) {
                    $('#largeVideo').fadeOut(300, doUpdate);
                } else {
                    doUpdate();
                }
            }
        } else {
            Avatar.showUserAvatar(
                connection.emuc.findJidFromResource(
                    largeVideoState.userResourceJid));
        }

    };

    my.handleVideoThumbClicked = function(videoSrc,
                                          noPinnedEndpointChangedEvent, 
                                          resourceJid) {
        // Restore style for previously focused video
        var oldContainer = null;
        if(focusedVideoInfo) {
            var focusResourceJid = focusedVideoInfo.resourceJid;
            oldContainer = getParticipantContainer(focusResourceJid);
        }

        if (oldContainer) {
            oldContainer.removeClass("videoContainerFocused");
        }

        // Unlock current focused.
        if (focusedVideoInfo && focusedVideoInfo.src === videoSrc)
        {
            focusedVideoInfo = null;
            var dominantSpeakerVideo = null;
            // Enable the currently set dominant speaker.
            if (currentDominantSpeaker) {
                dominantSpeakerVideo
                    = $('#participant_' + currentDominantSpeaker + '>video')
                        .get(0);

                if (dominantSpeakerVideo) {
                    VideoLayout.updateLargeVideo(
                        RTC.getVideoSrc(dominantSpeakerVideo),
                        1,
                        currentDominantSpeaker);
                }
            }

            if (!noPinnedEndpointChangedEvent) {
                $(document).trigger("pinnedendpointchanged");
            }
            return;
        }

        // Lock new video
        focusedVideoInfo = {
            src: videoSrc,
            resourceJid: resourceJid
        };

        // Update focused/pinned interface.
        if (resourceJid)
        {
            var container = getParticipantContainer(resourceJid);
            container.addClass("videoContainerFocused");

            if (!noPinnedEndpointChangedEvent) {
                $(document).trigger("pinnedendpointchanged", [resourceJid]);
            }
        }

        if ($('#largeVideo').attr('src') === videoSrc &&
            VideoLayout.isLargeVideoOnTop()) {
            return;
        }

        // Triggers a "video.selected" event. The "false" parameter indicates
        // this isn't a prezi.
        $(document).trigger("video.selected", [false]);

        VideoLayout.updateLargeVideo(videoSrc, 1, resourceJid);

        $('audio').each(function (idx, el) {
            if (el.id.indexOf('mixedmslabel') !== -1) {
                el.volume = 0;
                el.volume = 1;
            }
        });
    };

    /**
     * Positions the large video.
     *
     * @param videoWidth the stream video width
     * @param videoHeight the stream video height
     */
    my.positionLarge = function (videoWidth, videoHeight) {
        var videoSpaceWidth = $('#videospace').width();
        var videoSpaceHeight = window.innerHeight;

        var videoSize = getVideoSize(videoWidth,
                                     videoHeight,
                                     videoSpaceWidth,
                                     videoSpaceHeight);

        var largeVideoWidth = videoSize[0];
        var largeVideoHeight = videoSize[1];

        var videoPosition = getVideoPosition(largeVideoWidth,
                                             largeVideoHeight,
                                             videoSpaceWidth,
                                             videoSpaceHeight);

        var horizontalIndent = videoPosition[0];
        var verticalIndent = videoPosition[1];

        positionVideo($('#largeVideo'),
                      largeVideoWidth,
                      largeVideoHeight,
                      horizontalIndent, verticalIndent);
    };

    /**
     * Shows/hides the large video.
     */
    my.setLargeVideoVisible = function(isVisible) {
        var resourceJid = largeVideoState.userResourceJid;

        if (isVisible) {
            $('#largeVideo').css({visibility: 'visible'});
            $('.watermark').css({visibility: 'visible'});
            VideoLayout.enableDominantSpeaker(resourceJid, true);
        }
        else {
            $('#largeVideo').css({visibility: 'hidden'});
            $('.watermark').css({visibility: 'hidden'});
            VideoLayout.enableDominantSpeaker(resourceJid, false);
            if(focusedVideoInfo) {
                var focusResourceJid = focusedVideoInfo.resourceJid;
                var oldContainer = getParticipantContainer(focusResourceJid);

                if (oldContainer && oldContainer.length > 0) {
                    oldContainer.removeClass("videoContainerFocused");
                }
                focusedVideoInfo = null;
                if(focusResourceJid) {
                    Avatar.showUserAvatar(
                        connection.emuc.findJidFromResource(focusResourceJid));
                }
            }
        }
    };

    /**
     * Indicates if the large video is currently visible.
     *
     * @return <tt>true</tt> if visible, <tt>false</tt> - otherwise
     */
    my.isLargeVideoVisible = function() {
        return $('#largeVideo').is(':visible');
    };

    my.isLargeVideoOnTop = function () {
        return !Prezi.isPresentationVisible() && !Etherpad.isVisible();
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

        var videoSpanId = 'participant_' + resourceJid;

        if ($('#' + videoSpanId).length > 0) {
            // If there's been a focus change, make sure we add focus related
            // interface!!
            if (Moderator.isModerator() && $('#remote_popupmenu_' + resourceJid).length <= 0) {
                addRemoteVideoMenu(peerJid,
                    document.getElementById(videoSpanId));
            }
        }
        else {
            var container =
                VideoLayout.addRemoteVideoContainer(peerJid, videoSpanId, userId);
            Avatar.setUserAvatar(peerJid, userId);
            // Set default display name.
            setDisplayName(videoSpanId);

            VideoLayout.connectionIndicators[videoSpanId] = new ConnectionIndicator(container, peerJid);

            var nickfield = document.createElement('span');
            nickfield.className = "nick";
            nickfield.appendChild(document.createTextNode(resourceJid));
            container.appendChild(nickfield);

            // In case this is not currently in the last n we don't show it.
            if (localLastNCount
                && localLastNCount > 0
                && $('#remoteVideos>span').length >= localLastNCount + 2) {
                showPeerContainer(resourceJid, 'hide');
            }
            else
                VideoLayout.resizeThumbnails();
        }
    };

    my.addRemoteVideoContainer = function(peerJid, spanId) {
        var container = document.createElement('span');
        container.id = spanId;
        container.className = 'videocontainer';
        var remotes = document.getElementById('remoteVideos');

        // If the peerJid is null then this video span couldn't be directly
        // associated with a participant (this could happen in the case of prezi).
        if (Moderator.isModerator() && peerJid !== null)
            addRemoteVideoMenu(peerJid, container);

        remotes.appendChild(container);
        AudioLevels.updateAudioLevelCanvas(peerJid);

        return container;
    };

    /**
     * Creates an audio or video stream element.
     */
    my.createStreamElement = function (sid, stream) {
        var isVideo = stream.getVideoTracks().length > 0;

        var element = isVideo
                        ? document.createElement('video')
                        : document.createElement('audio');
        var id = (isVideo ? 'remoteVideo_' : 'remoteAudio_')
                    + sid + '_' + RTC.getStreamID(stream);

        element.id = id;
        element.autoplay = true;
        element.oncontextmenu = function () { return false; };

        return element;
    };

    my.addRemoteStreamElement
        = function (container, sid, stream, peerJid, thessrc) {
        var newElementId = null;

        var isVideo = stream.getVideoTracks().length > 0;

        if (container) {
            var streamElement = VideoLayout.createStreamElement(sid, stream);
            newElementId = streamElement.id;

            container.appendChild(streamElement);

            var sel = $('#' + newElementId);
            sel.hide();

            // If the container is currently visible we attach the stream.
            if (!isVideo
                || (container.offsetParent !== null && isVideo)) {
                var videoStream = simulcast.getReceivingVideoStream(stream);
                RTC.attachMediaStream(sel, videoStream);

                if (isVideo)
                    waitForRemoteVideo(sel, thessrc, stream, peerJid);
            }

            stream.onended = function () {
                console.log('stream ended', this);

                VideoLayout.removeRemoteStreamElement(
                    stream, isVideo, container);

                // NOTE(gp) it seems that under certain circumstances, the
                // onended event is not fired and thus the contact list is not
                // updated.
                //
                // The onended event of a stream should be fired when the SSRCs
                // corresponding to that stream are removed from the SDP; but
                // this doesn't seem to always be the case, resulting in ghost
                // contacts.
                //
                // In an attempt to fix the ghost contacts problem, I'm moving
                // the removeContact() method call in app.js, inside the
                // 'muc.left' event handler.

                //if (peerJid)
                //    ContactList.removeContact(peerJid);
            };

            // Add click handler.
            container.onclick = function (event) {
                /*
                 * FIXME It turns out that videoThumb may not exist (if there is
                 * no actual video).
                 */
                var videoThumb = $('#' + container.id + '>video').get(0);
                if (videoThumb) {
                    VideoLayout.handleVideoThumbClicked(
                        RTC.getVideoSrc(videoThumb),
                        false,
                        Strophe.getResourceFromJid(peerJid));
                }

                event.stopPropagation();
                event.preventDefault();
                return false;
            };

            // Add hover handler
            $(container).hover(
                function() {
                    VideoLayout.showDisplayName(container.id, true);
                },
                function() {
                    var videoSrc = null;
                    if ($('#' + container.id + '>video')
                            && $('#' + container.id + '>video').length > 0) {
                        videoSrc = RTC.getVideoSrc($('#' + container.id + '>video').get(0));
                    }

                    // If the video has been "pinned" by the user we want to
                    // keep the display name on place.
                    if (!VideoLayout.isLargeVideoVisible()
                            || videoSrc !== RTC.getVideoSrc($('#largeVideo')[0]))
                        VideoLayout.showDisplayName(container.id, false);
                }
            );
        }

        return newElementId;
    };

    /**
     * Removes the remote stream element corresponding to the given stream and
     * parent container.
     * 
     * @param stream the stream
     * @param isVideo <tt>true</tt> if given <tt>stream</tt> is a video one.
     * @param container
     */
    my.removeRemoteStreamElement = function (stream, isVideo, container) {
        if (!container)
            return;

        var select = null;
        var removedVideoSrc = null;
        if (isVideo) {
            select = $('#' + container.id + '>video');
            removedVideoSrc = RTC.getVideoSrc(select.get(0));
        }
        else
            select = $('#' + container.id + '>audio');


        // Mark video as removed to cancel waiting loop(if video is removed
        // before has started)
        select.removed = true;
        select.remove();

        var audioCount = $('#' + container.id + '>audio').length;
        var videoCount = $('#' + container.id + '>video').length;

        if (!audioCount && !videoCount) {
            console.log("Remove whole user", container.id);
            if(VideoLayout.connectionIndicators[container.id])
                VideoLayout.connectionIndicators[container.id].remove();
            // Remove whole container
            container.remove();

            Util.playSoundNotification('userLeft');
            VideoLayout.resizeThumbnails();
        }

        if (removedVideoSrc)
            VideoLayout.updateRemovedVideo(removedVideoSrc);
    };

    /**
     * Show/hide peer container for the given resourceJid.
     */
    function showPeerContainer(resourceJid, state) {
        var peerContainer = $('#participant_' + resourceJid);

        if (!peerContainer)
            return;

        var isHide = state === 'hide';
        var resizeThumbnails = false;

        if (!isHide) {
            if (!peerContainer.is(':visible')) {
                resizeThumbnails = true;
                peerContainer.show();
            }

            if (state == 'show')
            {
                // peerContainer.css('-webkit-filter', '');
                var jid = connection.emuc.findJidFromResource(resourceJid);
                Avatar.showUserAvatar(jid, false);
            }
            else // if (state == 'avatar')
            {
                // peerContainer.css('-webkit-filter', 'grayscale(100%)');
                var jid = connection.emuc.findJidFromResource(resourceJid);
                Avatar.showUserAvatar(jid, true);
            }
        }
        else if (peerContainer.is(':visible') && isHide)
        {
            resizeThumbnails = true;
            peerContainer.hide();
            if(VideoLayout.connectionIndicators['participant_' + resourceJid])
                VideoLayout.connectionIndicators['participant_' + resourceJid].hide();
        }

        if (resizeThumbnails) {
            VideoLayout.resizeThumbnails();
        }

        // We want to be able to pin a participant from the contact list, even
        // if he's not in the lastN set!
        // ContactList.setClickable(resourceJid, !isHide);

    };

    /**
     * Sets the display name for the given video span id.
     */
    function setDisplayName(videoSpanId, displayName) {
        var nameSpan = $('#' + videoSpanId + '>span.displayname');
        var defaultLocalDisplayName = interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME;

        // If we already have a display name for this video.
        if (nameSpan.length > 0) {
            var nameSpanElement = nameSpan.get(0);

            if (nameSpanElement.id === 'localDisplayName' &&
                $('#localDisplayName').text() !== displayName) {
                if (displayName && displayName.length > 0)
                    $('#localDisplayName').text(displayName + ' (me)');
                else
                    $('#localDisplayName').text(defaultLocalDisplayName);
            } else {
                if (displayName && displayName.length > 0)
                    $('#' + videoSpanId + '_name').text(displayName);
                else
                    $('#' + videoSpanId + '_name').text(interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME);
            }
        } else {
            var editButton = null;

            nameSpan = document.createElement('span');
            nameSpan.className = 'displayname';
            $('#' + videoSpanId)[0].appendChild(nameSpan);

            if (videoSpanId === 'localVideoContainer') {
                editButton = createEditDisplayNameButton();
                nameSpan.innerText = defaultLocalDisplayName;
            }
            else {
                nameSpan.innerText = interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
            }

            if (displayName && displayName.length > 0) {
                nameSpan.innerText = displayName;
            }

            if (!editButton) {
                nameSpan.id = videoSpanId + '_name';
            } else {
                nameSpan.id = 'localDisplayName';
                $('#' + videoSpanId)[0].appendChild(editButton);

                var editableText = document.createElement('input');
                editableText.className = 'displayname';
                editableText.type = 'text';
                editableText.id = 'editDisplayName';

                if (displayName && displayName.length) {
                    editableText.value
                        = displayName.substring(0, displayName.indexOf(' (me)'));
                }

                editableText.setAttribute('style', 'display:none;');
                editableText.setAttribute('placeholder', 'ex. Jane Pink');
                $('#' + videoSpanId)[0].appendChild(editableText);

                $('#localVideoContainer .displayname')
                    .bind("click", function (e) {

                    e.preventDefault();
                    e.stopPropagation();
                    $('#localDisplayName').hide();
                    $('#editDisplayName').show();
                    $('#editDisplayName').focus();
                    $('#editDisplayName').select();

                    $('#editDisplayName').one("focusout", function (e) {
                        VideoLayout.inputDisplayNameHandler(this.value);
                    });

                    $('#editDisplayName').on('keydown', function (e) {
                        if (e.keyCode === 13) {
                            e.preventDefault();
                            VideoLayout.inputDisplayNameHandler(this.value);
                        }
                    });
                });
            }
        }
    }

    my.inputDisplayNameHandler = function (name) {
        if (nickname !== name) {
            nickname = name;
            window.localStorage.displayname = nickname;
            connection.emuc.addDisplayNameToPresence(nickname);
            connection.emuc.sendPresence();

            Chat.setChatConversationMode(true);
        }

        if (!$('#localDisplayName').is(":visible")) {
            if (nickname)
                $('#localDisplayName').text(nickname + " (me)");
            else
                $('#localDisplayName')
                    .text(interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);
            $('#localDisplayName').show();
        }

        $('#editDisplayName').hide();
    };

    /**
     * Shows/hides the display name on the remote video.
     * @param videoSpanId the identifier of the video span element
     * @param isShow indicates if the display name should be shown or hidden
     */
    my.showDisplayName = function(videoSpanId, isShow) {
        var nameSpan = $('#' + videoSpanId + '>span.displayname').get(0);
        if (isShow) {
            if (nameSpan && nameSpan.innerHTML && nameSpan.innerHTML.length) 
                nameSpan.setAttribute("style", "display:inline-block;");
        }
        else {
            if (nameSpan)
                nameSpan.setAttribute("style", "display:none;");
        }
    };

    /**
     * Shows the presence status message for the given video.
     */
    my.setPresenceStatus = function (videoSpanId, statusMsg) {

        if (!$('#' + videoSpanId).length) {
            // No container
            return;
        }

        var statusSpan = $('#' + videoSpanId + '>span.status');
        if (!statusSpan.length) {
            //Add status span
            statusSpan = document.createElement('span');
            statusSpan.className = 'status';
            statusSpan.id = videoSpanId + '_status';
            $('#' + videoSpanId)[0].appendChild(statusSpan);

            statusSpan = $('#' + videoSpanId + '>span.status');
        }

        // Display status
        if (statusMsg && statusMsg.length) {
            $('#' + videoSpanId + '_status').text(statusMsg);
            statusSpan.get(0).setAttribute("style", "display:inline-block;");
        }
        else {
            // Hide
            statusSpan.get(0).setAttribute("style", "display:none;");
        }
    };

    /**
     * Shows a visual indicator for the moderator of the conference.
     */
    my.showModeratorIndicator = function () {
        if (Moderator.isModerator()) {
            var indicatorSpan = $('#localVideoContainer .focusindicator');

            if (indicatorSpan.children().length === 0)
            {
                createModeratorIndicatorElement(indicatorSpan[0]);
            }
        } else {
            Object.keys(connection.emuc.members).forEach(function (jid) {
                var member = connection.emuc.members[jid];
                if (member.role === 'moderator') {
                    var moderatorId
                        = 'participant_' + Strophe.getResourceFromJid(jid);

                    var moderatorContainer
                        = document.getElementById(moderatorId);

                    if (Strophe.getResourceFromJid(jid) === 'focus') {
                        // Skip server side focus
                        return;
                    }
                    if (!moderatorContainer) {
                        console.error("No moderator container for " + jid);
                        return;
                    }
                    var indicatorSpan
                        = $('#' + moderatorId + ' .focusindicator');

                    if (!indicatorSpan || indicatorSpan.length === 0) {
                        indicatorSpan = document.createElement('span');
                        indicatorSpan.className = 'focusindicator';

                        moderatorContainer.appendChild(indicatorSpan);

                        createModeratorIndicatorElement(indicatorSpan);
                    }
                }
            });
        }
    };

    /**
     * Shows video muted indicator over small videos.
     */
    my.showVideoIndicator = function(videoSpanId, isMuted) {
        var videoMutedSpan = $('#' + videoSpanId + '>span.videoMuted');

        if (isMuted === 'false') {
            if (videoMutedSpan.length > 0) {
                videoMutedSpan.remove();
            }
        }
        else {
            if(videoMutedSpan.length == 0) {
                videoMutedSpan = document.createElement('span');
                videoMutedSpan.className = 'videoMuted';

                $('#' + videoSpanId)[0].appendChild(videoMutedSpan);

                var mutedIndicator = document.createElement('i');
                mutedIndicator.className = 'icon-camera-disabled';
                Util.setTooltip(mutedIndicator,
                    "Participant has<br/>stopped the camera.",
                    "top");
                videoMutedSpan.appendChild(mutedIndicator);
            }

            VideoLayout.updateMutePosition(videoSpanId);

        }
    };

    my.updateMutePosition = function (videoSpanId) {
        var audioMutedSpan = $('#' + videoSpanId + '>span.audioMuted');
        var connectionIndicator = $('#' + videoSpanId + '>div.connectionindicator');
        var videoMutedSpan = $('#' + videoSpanId + '>span.videoMuted');
        if(connectionIndicator.length > 0
            && connectionIndicator[0].style.display != "none") {
            audioMutedSpan.css({right: "23px"});
            videoMutedSpan.css({right: ((audioMutedSpan.length > 0? 23 : 0) + 30) + "px"});
        }
        else
        {
            audioMutedSpan.css({right: "0px"});
            videoMutedSpan.css({right: (audioMutedSpan.length > 0? 30 : 0) + "px"});
        }
    }
    /**
     * Shows audio muted indicator over small videos.
     * @param {string} isMuted
     */
    my.showAudioIndicator = function(videoSpanId, isMuted) {
        var audioMutedSpan = $('#' + videoSpanId + '>span.audioMuted');

        if (isMuted === 'false') {
            if (audioMutedSpan.length > 0) {
                audioMutedSpan.popover('hide');
                audioMutedSpan.remove();
            }
        }
        else {
            if(audioMutedSpan.length == 0 ) {
                audioMutedSpan = document.createElement('span');
                audioMutedSpan.className = 'audioMuted';
                Util.setTooltip(audioMutedSpan,
                    "Participant is muted",
                    "top");

                $('#' + videoSpanId)[0].appendChild(audioMutedSpan);
                var mutedIndicator = document.createElement('i');
                mutedIndicator.className = 'icon-mic-disabled';
                audioMutedSpan.appendChild(mutedIndicator);

            }
            VideoLayout.updateMutePosition(videoSpanId);
        }
    };

    /*
     * Shows or hides the audio muted indicator over the local thumbnail video.
     * @param {boolean} isMuted
     */
    my.showLocalAudioIndicator = function(isMuted) {
        VideoLayout.showAudioIndicator('localVideoContainer', isMuted.toString());
    };

    /**
     * Resizes the large video container.
     */
    my.resizeLargeVideoContainer = function () {
        Chat.resizeChat();
        var availableHeight = window.innerHeight;
        var availableWidth = Util.getAvailableVideoWidth();

        if (availableWidth < 0 || availableHeight < 0) return;

        $('#videospace').width(availableWidth);
        $('#videospace').height(availableHeight);
        $('#largeVideoContainer').width(availableWidth);
        $('#largeVideoContainer').height(availableHeight);


        $('#activeSpeakerAvatar').css('top',
            (availableHeight - interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE) / 2);

        VideoLayout.resizeThumbnails();
    };

    /**
     * Resizes thumbnails.
     */
    my.resizeThumbnails = function() {
        var videoSpaceWidth = $('#remoteVideos').width();

        var thumbnailSize = VideoLayout.calculateThumbnailSize(videoSpaceWidth);
        var width = thumbnailSize[0];
        var height = thumbnailSize[1];

        // size videos so that while keeping AR and max height, we have a
        // nice fit
        $('#remoteVideos').height(height);
        $('#remoteVideos>span').width(width);
        $('#remoteVideos>span').height(height);

        $('.userAvatar').css('left', (width - height) / 2);

        $(document).trigger("remotevideo.resized", [width, height]);
    };

    /**
     * Enables the dominant speaker UI.
     *
     * @param resourceJid the jid indicating the video element to
     * activate/deactivate
     * @param isEnable indicates if the dominant speaker should be enabled or
     * disabled
     */
    my.enableDominantSpeaker = function(resourceJid, isEnable) {

        var videoSpanId = null;
        var videoContainerId = null;
        if (resourceJid
                === Strophe.getResourceFromJid(connection.emuc.myroomjid)) {
            videoSpanId = 'localVideoWrapper';
            videoContainerId = 'localVideoContainer';
        }
        else {
            videoSpanId = 'participant_' + resourceJid;
            videoContainerId = videoSpanId;
        }

        var displayName = resourceJid;
        var nameSpan = $('#' + videoContainerId + '>span.displayname');
        if (nameSpan.length > 0)
            displayName = nameSpan.text();

        console.log("UI enable dominant speaker",
            displayName,
            resourceJid,
            isEnable);

        videoSpan = document.getElementById(videoContainerId);

        if (!videoSpan) {
            return;
        }

        var video = $('#' + videoSpanId + '>video');

        if (video && video.length > 0) {
            if (isEnable) {
                var isLargeVideoVisible = VideoLayout.isLargeVideoOnTop();
                VideoLayout.showDisplayName(videoContainerId, isLargeVideoVisible);

                if (!videoSpan.classList.contains("dominantspeaker"))
                    videoSpan.classList.add("dominantspeaker");
            }
            else {
                VideoLayout.showDisplayName(videoContainerId, false);

                if (videoSpan.classList.contains("dominantspeaker"))
                    videoSpan.classList.remove("dominantspeaker");
            }

            Avatar.showUserAvatar(
                connection.emuc.findJidFromResource(resourceJid));
        }
    };

    /**
     * Gets the selector of video thumbnail container for the user identified by
     * given <tt>userJid</tt>
     * @param resourceJid user's Jid for whom we want to get the video container.
     */
    function getParticipantContainer(resourceJid)
    {
        if (!resourceJid)
            return null;

        if (resourceJid === Strophe.getResourceFromJid(connection.emuc.myroomjid))
            return $("#localVideoContainer");
        else
            return $("#participant_" + resourceJid);
    }

    /**
     * Sets the size and position of the given video element.
     *
     * @param video the video element to position
     * @param width the desired video width
     * @param height the desired video height
     * @param horizontalIndent the left and right indent
     * @param verticalIndent the top and bottom indent
     */
    function positionVideo(video,
                           width,
                           height,
                           horizontalIndent,
                           verticalIndent) {
        video.width(width);
        video.height(height);
        video.css({  top: verticalIndent + 'px',
                     bottom: verticalIndent + 'px',
                     left: horizontalIndent + 'px',
                     right: horizontalIndent + 'px'});
    }

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
    * Returns an array of the video dimensions, so that it keeps it's aspect
    * ratio and fits available area with it's larger dimension. This method
    * ensures that whole video will be visible and can leave empty areas.
    *
    * @return an array with 2 elements, the video width and the video height
    */
   function getDesktopVideoSize(videoWidth,
                                videoHeight,
                                videoSpaceWidth,
                                videoSpaceHeight) {
       if (!videoWidth)
           videoWidth = currentVideoWidth;
       if (!videoHeight)
           videoHeight = currentVideoHeight;

       var aspectRatio = videoWidth / videoHeight;

       var availableWidth = Math.max(videoWidth, videoSpaceWidth);
       var availableHeight = Math.max(videoHeight, videoSpaceHeight);

       videoSpaceHeight -= $('#remoteVideos').outerHeight();

       if (availableWidth / aspectRatio >= videoSpaceHeight)
       {
           availableHeight = videoSpaceHeight;
           availableWidth = availableHeight * aspectRatio;
       }

       if (availableHeight * aspectRatio >= videoSpaceWidth)
       {
           availableWidth = videoSpaceWidth;
           availableHeight = availableWidth / aspectRatio;
       }

       return [availableWidth, availableHeight];
   }

   /**
    * Creates the edit display name button.
    * 
    * @returns the edit button
    */
    function createEditDisplayNameButton() {
        var editButton = document.createElement('a');
        editButton.className = 'displayname';
        Util.setTooltip(editButton,
                        'Click to edit your<br/>display name',
                        "top");
        editButton.innerHTML = '<i class="fa fa-pencil"></i>';

        return editButton;
    }

    /**
     * Creates the element indicating the moderator(owner) of the conference.
     *
     * @param parentElement the parent element where the owner indicator will
     * be added
     */
    function createModeratorIndicatorElement(parentElement) {
        var moderatorIndicator = document.createElement('i');
        moderatorIndicator.className = 'fa fa-star';
        parentElement.appendChild(moderatorIndicator);

        Util.setTooltip(parentElement,
                "The owner of<br/>this conference",
                "top");
    }

    /**
     * Updates the remote video menu.
     *
     * @param jid the jid indicating the video for which we're adding a menu.
     * @param isMuted indicates the current mute state
     */
    my.updateRemoteVideoMenu = function(jid, isMuted) {
        var muteMenuItem
            = $('#remote_popupmenu_'
                    + Strophe.getResourceFromJid(jid)
                    + '>li>a.mutelink');

        var mutedIndicator = "<i class='icon-mic-disabled'></i>";

        if (muteMenuItem.length) {
            var muteLink = muteMenuItem.get(0);

            if (isMuted === 'true') {
                muteLink.innerHTML = mutedIndicator + ' Muted';
                muteLink.className = 'mutelink disabled';
            }
            else {
                muteLink.innerHTML = mutedIndicator + ' Mute';
                muteLink.className = 'mutelink';
            }
        }
    };

    /**
     * Returns the current dominant speaker resource jid.
     */
    my.getDominantSpeakerResourceJid = function () {
        return currentDominantSpeaker;
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
     * Adds the remote video menu element for the given <tt>jid</tt> in the
     * given <tt>parentElement</tt>.
     *
     * @param jid the jid indicating the video for which we're adding a menu.
     * @param parentElement the parent element where this menu will be added
     */
    function addRemoteVideoMenu(jid, parentElement) {
        var spanElement = document.createElement('span');
        spanElement.className = 'remotevideomenu';

        parentElement.appendChild(spanElement);

        var menuElement = document.createElement('i');
        menuElement.className = 'fa fa-angle-down';
        menuElement.title = 'Remote user controls';
        spanElement.appendChild(menuElement);

//        <ul class="popupmenu">
//        <li><a href="#">Mute</a></li>
//        <li><a href="#">Eject</a></li>
//        </ul>

        var popupmenuElement = document.createElement('ul');
        popupmenuElement.className = 'popupmenu';
        popupmenuElement.id
            = 'remote_popupmenu_' + Strophe.getResourceFromJid(jid);
        spanElement.appendChild(popupmenuElement);

        var muteMenuItem = document.createElement('li');
        var muteLinkItem = document.createElement('a');

        var mutedIndicator = "<i class='icon-mic-disabled'></i>";

        if (!mutedAudios[jid]) {
            muteLinkItem.innerHTML = mutedIndicator + 'Mute';
            muteLinkItem.className = 'mutelink';
        }
        else {
            muteLinkItem.innerHTML = mutedIndicator + ' Muted';
            muteLinkItem.className = 'mutelink disabled';
        }

        muteLinkItem.onclick = function(){
            if ($(this).attr('disabled') != undefined) {
                event.preventDefault();
            }
            var isMute = mutedAudios[jid] == true;
            connection.moderate.setMute(jid, !isMute);
            popupmenuElement.setAttribute('style', 'display:none;');

            if (isMute) {
                this.innerHTML = mutedIndicator + ' Muted';
                this.className = 'mutelink disabled';
            }
            else {
                this.innerHTML = mutedIndicator + ' Mute';
                this.className = 'mutelink';
            }
        };

        muteMenuItem.appendChild(muteLinkItem);
        popupmenuElement.appendChild(muteMenuItem);

        var ejectIndicator = "<i class='fa fa-eject'></i>";

        var ejectMenuItem = document.createElement('li');
        var ejectLinkItem = document.createElement('a');
        ejectLinkItem.innerHTML = ejectIndicator + ' Kick out';
        ejectLinkItem.onclick = function(){
            connection.moderate.eject(jid);
            popupmenuElement.setAttribute('style', 'display:none;');
        };

        ejectMenuItem.appendChild(ejectLinkItem);
        popupmenuElement.appendChild(ejectMenuItem);

        var paddingSpan = document.createElement('span');
        paddingSpan.className = 'popupmenuPadding';
        popupmenuElement.appendChild(paddingSpan);
    }

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
                        videoThumb.src,
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
                    $(document).trigger("pinnedendpointchanged", [jid]);
                }
            } else if (jid == connection.emuc.myroomjid) {
                $("#localVideoContainer").click();
            }
        }
    });

    /**
     * On audio muted event.
     */
    $(document).bind('audiomuted.muc', function (event, jid, isMuted) {
        /*
         // FIXME: but focus can not mute in this case ? - check
        if (jid === connection.emuc.myroomjid) {

            // The local mute indicator is controlled locally
            return;
        }*/
        var videoSpanId = null;
        if (jid === connection.emuc.myroomjid) {
            videoSpanId = 'localVideoContainer';
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
        }

        mutedAudios[jid] = isMuted;

        if (Moderator.isModerator()) {
            VideoLayout.updateRemoteVideoMenu(jid, isMuted);
        }

        if (videoSpanId)
            VideoLayout.showAudioIndicator(videoSpanId, isMuted);
    });

    /**
     * On video muted event.
     */
    $(document).bind('videomuted.muc', function (event, jid, isMuted) {
        var videoSpanId = null;
        if (jid === connection.emuc.myroomjid) {
            videoSpanId = 'localVideoContainer';
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
        }

        if (videoSpanId)
            VideoLayout.showVideoIndicator(videoSpanId, isMuted);
    });

    /**
     * Display name changed.
     */
    $(document).bind('displaynamechanged',
                    function (event, jid, displayName, status) {
        var name = null;
        if (jid === 'localVideoContainer'
            || jid === connection.emuc.myroomjid) {
            name = nickname;
            setDisplayName('localVideoContainer',
                           displayName);
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            name = $('#participant_' + Strophe.getResourceFromJid(jid) + "_name").text();
            setDisplayName(
                'participant_' + Strophe.getResourceFromJid(jid),
                displayName,
                status);
        }

        if(APIConnector.isEnabled() && APIConnector.isEventEnabled("displayNameChange"))
        {
            if(jid === 'localVideoContainer')
                jid = connection.emuc.myroomjid;
            if(!name || name != displayName)
                APIConnector.triggerEvent("displayNameChange",{jid: jid, displayname: displayName});
        }
    });

    /**
     * On dominant speaker changed event.
     */
    $(document).bind('dominantspeakerchanged', function (event, resourceJid) {
        // We ignore local user events.
        if (resourceJid
                === Strophe.getResourceFromJid(connection.emuc.myroomjid))
            return;

        // Update the current dominant speaker.
        if (resourceJid !== currentDominantSpeaker) {
            var oldSpeakerVideoSpanId = "participant_" + currentDominantSpeaker,
                newSpeakerVideoSpanId = "participant_" + resourceJid;
            if($("#" + oldSpeakerVideoSpanId + ">span.displayname").text() ===
                interfaceConfig.DEFAULT_DOMINANT_SPEAKER_DISPLAY_NAME) {
                setDisplayName(oldSpeakerVideoSpanId, null);
            }
            if($("#" + newSpeakerVideoSpanId + ">span.displayname").text() ===
                interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME) {
                setDisplayName(newSpeakerVideoSpanId,
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
        if (container && !focusedVideoInfo)
        {
            var video = container.getElementsByTagName("video");

            // Update the large video if the video source is already available,
            // otherwise wait for the "videoactive.jingle" event.
            if (video.length && video[0].currentTime > 0)
                VideoLayout.updateLargeVideo(RTC.getVideoSrc(video[0]), resourceJid);
        }
    });

    /**
     * On last N change event.
     *
     * @param event the event that notified us
     * @param lastNEndpoints the list of last N endpoints
     * @param endpointsEnteringLastN the list currently entering last N
     * endpoints
     */
    $(document).bind('lastnchanged', function ( event,
                                                lastNEndpoints,
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
                showPeerContainer(resourceJid, 'hide');
                isReceived = false;
            } else if (resourceJid
                && $('#participant_' + resourceJid).is(':visible')
                && lastNEndpoints.indexOf(resourceJid) < 0
                && localLastNSet.indexOf(resourceJid) >= 0) {
                showPeerContainer(resourceJid, 'avatar');
                isReceived = false;
            }

            if (!isReceived) {
                // resourceJid has dropped out of the server side lastN set, so
                // it is no longer being received. If resourceJid was being
                // displayed in the large video we have to switch to another
                // user.
                var largeVideoResource = largeVideoState.userResourceJid;
                if (!updateLargeVideo && resourceJid === largeVideoResource) {
                    updateLargeVideo = true;
                }
            }
        });

        if (!endpointsEnteringLastN || endpointsEnteringLastN.length < 0)
            endpointsEnteringLastN = lastNEndpoints;

        if (endpointsEnteringLastN && endpointsEnteringLastN.length > 0) {
            endpointsEnteringLastN.forEach(function (resourceJid) {

                var isVisible = $('#participant_' + resourceJid).is(':visible');
                showPeerContainer(resourceJid, 'show');
                if (!isVisible) {
                    console.log("Add to last N", resourceJid);

                    var jid = connection.emuc.findJidFromResource(resourceJid);
                    var mediaStream = mediaStreams[jid][MediaStream.VIDEO_TYPE];
                    var sel = $('#participant_' + resourceJid + '>video');

                    var videoStream = simulcast.getReceivingVideoStream(
                        mediaStream.stream);
                    RTC.attachMediaStream(sel, videoStream);
                    if (lastNPickupJid == mediaStream.peerjid) {
                        // Clean up the lastN pickup jid.
                        lastNPickupJid = null;

                        // Don't fire the events again, they've already
                        // been fired in the contact list click handler.
                        VideoLayout.handleVideoThumbClicked(
                            $(sel).attr('src'),
                            false,
                            Strophe.getResourceFromJid(mediaStream.peerjid));

                        updateLargeVideo = false;
                    }
                    waitForRemoteVideo(sel, mediaStream.ssrc, mediaStream.stream, resourceJid);
                }
            })
        }

        // The endpoint that was being shown in the large video has dropped out
        // of the lastN set and there was no lastN pickup jid. We need to update
        // the large video now.

        if (updateLargeVideo) {

            var resource, container, src;
            var myResource
                = Strophe.getResourceFromJid(connection.emuc.myroomjid);

            // Find out which endpoint to show in the large video.
            for (var i = 0; i < lastNEndpoints.length; i++) {
                resource = lastNEndpoints[i];
                if (!resource || resource === myResource)
                    continue;

                container = $("#participant_" + resource);
                if (container.length == 0)
                    continue;

                src = $('video', container).attr('src');
                if (!src)
                    continue;

                // videoSrcToSsrc needs to be update for this call to succeed.
                VideoLayout.updateLargeVideo(src);
                break;

            }
        }
    });

    $(document).bind('videoactive.jingle', function (event, videoelem) {
        if (videoelem.attr('id').indexOf('mixedmslabel') === -1) {
            // ignore mixedmslabela0 and v0

            videoelem.show();
            VideoLayout.resizeThumbnails();

            var videoParent = videoelem.parent();
            var parentResourceJid = null;
            if (videoParent)
                parentResourceJid
                    = VideoLayout.getPeerContainerResourceJid(videoParent[0]);

            // Update the large video to the last added video only if there's no
            // current dominant, focused speaker or prezi playing or update it to
            // the current dominant speaker.
            if ((!focusedVideoInfo &&
                !VideoLayout.getDominantSpeakerResourceJid() &&
                !Prezi.isPresentationVisible()) ||
                (parentResourceJid &&
                VideoLayout.getDominantSpeakerResourceJid() === parentResourceJid)) {
                VideoLayout.updateLargeVideo(
                    RTC.getVideoSrc(videoelem[0]),
                    1,
                    parentResourceJid);
            }

            VideoLayout.showModeratorIndicator();
        }
    });

    $(document).bind('simulcastlayerschanging', function (event, endpointSimulcastLayers) {
        endpointSimulcastLayers.forEach(function (esl) {

            var resource = esl.endpoint;

            // if lastN is enabled *and* the endpoint is *not* in the lastN set,
            // then ignore the event (= do not preload anything).
            //
            // The bridge could probably stop sending this message if it's for
            // an endpoint that's not in lastN.

            if (lastNCount != -1
                && (lastNCount < 1 || lastNEndpointsCache.indexOf(resource) === -1)) {
                return;
            }

            var primarySSRC = esl.simulcastLayer.primarySSRC;

            // Get session and stream from primary ssrc.
            var res = simulcast.getReceivingVideoStreamBySSRC(primarySSRC);
            var session = res.session;
            var electedStream = res.stream;

            if (session && electedStream) {
                var msid = simulcast.getRemoteVideoStreamIdBySSRC(primarySSRC);

                console.info([esl, primarySSRC, msid, session, electedStream]);

                var msidParts = msid.split(' ');

                var preload = (Strophe.getResourceFromJid(ssrc2jid[primarySSRC]) == largeVideoState.userResourceJid);

                if (preload) {
                    if (largeVideoState.preload)
                    {
                        $(largeVideoState.preload).remove();
                    }
                    console.info('Preloading remote video');
                    largeVideoState.preload = $('<video autoplay></video>');
                    // ssrcs are unique in an rtp session
                    largeVideoState.preload_ssrc = primarySSRC;

                    RTC.attachMediaStream(largeVideoState.preload, electedStream)
                }

            } else {
                console.error('Could not find a stream or a session.', session, electedStream);
            }
        });
    });

    /**
     * On simulcast layers changed event.
     */
    $(document).bind('simulcastlayerschanged', function (event, endpointSimulcastLayers) {
        endpointSimulcastLayers.forEach(function (esl) {

            var resource = esl.endpoint;

            // if lastN is enabled *and* the endpoint is *not* in the lastN set,
            // then ignore the event (= do not change large video/thumbnail
            // SRCs).
            //
            // Note that even if we ignore the "changed" event in this event
            // handler, the bridge must continue sending these events because
            // the simulcast code in simulcast.js uses it to know what's going
            // to be streamed by the bridge when/if the endpoint gets back into
            // the lastN set.

            if (lastNCount != -1
                && (lastNCount < 1 || lastNEndpointsCache.indexOf(resource) === -1)) {
                return;
            }

            var primarySSRC = esl.simulcastLayer.primarySSRC;

            // Get session and stream from primary ssrc.
            var res = simulcast.getReceivingVideoStreamBySSRC(primarySSRC);
            var session = res.session;
            var electedStream = res.stream;

            if (session && electedStream) {
                var msid = simulcast.getRemoteVideoStreamIdBySSRC(primarySSRC);

                console.info('Switching simulcast substream.');
                console.info([esl, primarySSRC, msid, session, electedStream]);

                var msidParts = msid.split(' ');
                var selRemoteVideo = $(['#', 'remoteVideo_', session.sid, '_', msidParts[0]].join(''));

                var updateLargeVideo = (Strophe.getResourceFromJid(ssrc2jid[primarySSRC])
                    == largeVideoState.userResourceJid);
                var updateFocusedVideoSrc = (focusedVideoInfo && focusedVideoInfo.src && focusedVideoInfo.src != '' &&
                    (RTC.getVideoSrc(selRemoteVideo[0]) == focusedVideoInfo.src));

                var electedStreamUrl;
                if (largeVideoState.preload_ssrc == primarySSRC)
                {
                    RTC.setVideoSrc(selRemoteVideo[0], RTC.getVideoSrc(largeVideoState.preload[0]));
                }
                else
                {
                    if (largeVideoState.preload
                        && largeVideoState.preload != null) {
                        $(largeVideoState.preload).remove();
                    }

                    largeVideoState.preload_ssrc = 0;

                    RTC.attachMediaStream(selRemoteVideo, electedStream);
                }

                var jid = ssrc2jid[primarySSRC];
                jid2Ssrc[jid] = primarySSRC;

                if (updateLargeVideo) {
                    VideoLayout.updateLargeVideo(RTC.getVideoSrc(selRemoteVideo[0]), null,
                        Strophe.getResourceFromJid(jid));
                }

                if (updateFocusedVideoSrc) {
                    focusedVideoInfo.src = RTC.getVideoSrc(selRemoteVideo[0]);
                }

                var videoId;
                if(resource == Strophe.getResourceFromJid(connection.emuc.myroomjid))
                {
                    videoId = "localVideoContainer";
                }
                else
                {
                    videoId = "participant_" + resource;
                }
                var connectionIndicator = VideoLayout.connectionIndicators[videoId];
                if(connectionIndicator)
                    connectionIndicator.updatePopoverData();

            } else {
                console.error('Could not find a stream or a session.', session, electedStream);
            }
        });
    });

    /**
     * Constructs new connection indicator.
     * @param videoContainer the video container associated with the indicator.
     * @constructor
     */
    function ConnectionIndicator(videoContainer, jid)
    {
        this.videoContainer = videoContainer;
        this.bandwidth = null;
        this.packetLoss = null;
        this.bitrate = null;
        this.showMoreValue = false;
        this.resolution = null;
        this.transport = [];
        this.popover = null;
        this.jid = jid;
        this.create();
    }

    /**
     * Values for the connection quality
     * @type {{98: string, 81: string, 64: string, 47: string, 30: string, 0: string}}
     */
    ConnectionIndicator.connectionQualityValues = {
        98: "18px", //full
        81: "15px",//4 bars
        64: "11px",//3 bars
        47: "7px",//2 bars
        30: "3px",//1 bar
        0: "0px"//empty
    };

    ConnectionIndicator.getIP = function(value)
    {
        return value.substring(0, value.lastIndexOf(":"));
    };

    ConnectionIndicator.getPort = function(value)
    {
        return value.substring(value.lastIndexOf(":") + 1, value.length);
    };

    ConnectionIndicator.getStringFromArray = function (array) {
        var res = "";
        for(var i = 0; i < array.length; i++)
        {
            res += (i == 0? "" : ", ") + array[i];
        }
        return res;
    }
    /**
     * Generates the html content.
     * @returns {string} the html content.
     */
    ConnectionIndicator.prototype.generateText = function () {
        var downloadBitrate, uploadBitrate, packetLoss, resolution;

        if(this.bitrate === null)
        {
            downloadBitrate = "N/A";
            uploadBitrate = "N/A";
        }
        else
        {
            downloadBitrate = this.bitrate.download? this.bitrate.download + " Kbps" : "N/A";
            uploadBitrate = this.bitrate.upload? this.bitrate.upload + " Kbps" : "N/A";
        }

        if(this.packetLoss === null)
        {
            packetLoss = "N/A";
        }
        else
        {

            packetLoss = "<span class='jitsipopover_green'>&darr;</span>" +
                (this.packetLoss.download != null? this.packetLoss.download : "N/A") +
                "% <span class='jitsipopover_orange'>&uarr;</span>" +
                (this.packetLoss.upload != null? this.packetLoss.upload : "N/A") + "%";
        }

        var resolutionValue = null;
        if(this.resolution)
        {
            var keys = Object.keys(this.resolution);
            if(keys.length == 1)
            {
                for(var ssrc in this.resolution)
                {
                    resolutionValue = this.resolution[ssrc];
                }
            }
            else if(keys.length > 1)
            {
                var displayedSsrc = simulcast.getReceivingSSRC(this.jid);
                resolutionValue = this.resolution[displayedSsrc];
            }
        }

        if(this.jid==null)
        {
            resolution = "";
            if(this.resolution == null || !Object.keys(this.resolution)
                || Object.keys(this.resolution).length == 0)
            {
                resolution = "N/A";
            }
            else
                for(var i in this.resolution)
                {
                    resolutionValue = this.resolution[i];
                    if(resolutionValue)
                    {
                        if(resolutionValue.height &&
                            resolutionValue.width)
                        {
                            resolution += (resolution == ""? "" : ", ")
                                + resolutionValue.width + "x" + resolutionValue.height;
                        }
                    }
                }
        }
        else if(!resolutionValue ||
            !resolutionValue.height ||
            !resolutionValue.width)
        {
            resolution = "N/A";
        }
        else
        {
            resolution = resolutionValue.width + "x" + resolutionValue.height;
        }

        var result = "<table style='width:100%'><tr><td><span class='jitsipopover_blue'>Bitrate:</span></td><td><span class='jitsipopover_green'>&darr;</span>" +
            downloadBitrate + " <span class='jitsipopover_orange'>&uarr;</span>" +
            uploadBitrate + "</td></tr><tr><td>" +
            "<tr><td><span class='jitsipopover_blue'>Packet loss: </span></td><td>" + packetLoss  + "</td></tr><tr><td>" +
            "<span class='jitsipopover_blue'>Resolution:</span></td><td>" + resolution + "</td></tr></table>";

        if(this.videoContainer.id == "localVideoContainer")
            result += "<div class=\"jitsipopover_showmore\" onclick = \"VideoLayout.connectionIndicators['" +
                 this.videoContainer.id + "'].showMore()\">" + (this.showMoreValue? "Show less" : "Show More") + "</div><br />";

        if(this.showMoreValue)
        {
            var downloadBandwidth, uploadBandwidth, transport;
            if(this.bandwidth === null)
            {
                downloadBandwidth = "N/A";
                uploadBandwidth = "N/A";
            }
            else
            {
                downloadBandwidth = this.bandwidth.download? this.bandwidth.download + " Kbps" : "N/A";
                uploadBandwidth = this.bandwidth.upload? this.bandwidth.upload + " Kbps" : "N/A";
            }

            if(!this.transport || this.transport.length === 0)
            {
                transport = "<tr><td><span class='jitsipopover_blue'>Address:</span></td><td> N/A</td></tr>";
            }
            else
            {
                var data = {remoteIP: [], localIP:[], remotePort:[], localPort:[]};
                for(var i = 0; i < this.transport.length; i++)
                {
                    var ip =  ConnectionIndicator.getIP(this.transport[i].ip);
                    var port = ConnectionIndicator.getPort(this.transport[i].ip);
                    var localIP = ConnectionIndicator.getIP(this.transport[i].localip);
                    var localPort = ConnectionIndicator.getPort(this.transport[i].localip);
                    if(data.remoteIP.indexOf(ip) == -1)
                    {
                       data.remoteIP.push(ip);
                    }

                    if(data.remotePort.indexOf(port) == -1)
                    {
                        data.remotePort.push(port);
                    }

                    if(data.localIP.indexOf(localIP) == -1)
                    {
                        data.localIP.push(localIP);
                    }

                    if(data.localPort.indexOf(localPort) == -1)
                    {
                        data.localPort.push(localPort);
                    }

                }
                var localTransport = "<tr><td><span class='jitsipopover_blue'>Local address" +
                    (data.localIP.length > 1? "es" : "") + ": </span></td><td> " +
                     ConnectionIndicator.getStringFromArray(data.localIP) + "</td></tr>";
                transport = "<tr><td><span class='jitsipopover_blue'>Remote address"+
                    (data.remoteIP.length > 1? "es" : "") + ":</span></td><td> " +
                    ConnectionIndicator.getStringFromArray(data.remoteIP) + "</td></tr>";
                if(this.transport.length > 1)
                {
                    transport += "<tr><td><span class='jitsipopover_blue'>Remote ports:</span></td><td>";
                    localTransport += "<tr><td><span class='jitsipopover_blue'>Local ports:</span></td><td>";
                }
                else
                {
                    transport += "<tr><td><span class='jitsipopover_blue'>Remote port:</span></td><td>";
                    localTransport += "<tr><td><span class='jitsipopover_blue'>Local port:</span></td><td>";
                }

                transport += ConnectionIndicator.getStringFromArray(data.remotePort);
                localTransport += ConnectionIndicator.getStringFromArray(data.localPort);
                transport += "</td></tr>";
                transport += localTransport + "</td></tr>";
                transport +="<tr><td><span class='jitsipopover_blue'>Transport:</span></td><td>" + this.transport[0].type + "</td></tr>";

            }

            result += "<table  style='width:100%'><tr><td><span class='jitsipopover_blue'>Estimated bandwidth:</span> </td><td>" +
                "<span class='jitsipopover_green'>&darr;</span>" + downloadBandwidth +
                " <span class='jitsipopover_orange'>&uarr;</span>" +
                uploadBandwidth + "</td></tr>";

            result += transport + "</table>";

        }

        return result;
    };

    /**
     * Shows or hide the additional information.
     */
    ConnectionIndicator.prototype.showMore = function () {
        this.showMoreValue = !this.showMoreValue;
        this.updatePopoverData();
    };

    /**
     * Creates the indicator
     */
    ConnectionIndicator.prototype.create = function () {
        this.connectionIndicatorContainer = document.createElement("div");
        this.connectionIndicatorContainer.className = "connectionindicator";
        this.connectionIndicatorContainer.style.display = "none";
        this.videoContainer.appendChild(this.connectionIndicatorContainer);
        this.popover = new JitsiPopover($("#" + this.videoContainer.id + " > .connectionindicator"),
            {content: "<div class=\"connection_info\">Come back here for " +
                "connection information once the conference starts</div>", skin: "black"});

        function createIcon(classes)
        {
            var icon = document.createElement("span");
            for(var i in classes)
            {
                icon.classList.add(classes[i]);
            }
            icon.appendChild(document.createElement("i")).classList.add("icon-connection");
            return icon;
        }
        this.emptyIcon = this.connectionIndicatorContainer.appendChild(
            createIcon(["connection", "connection_empty"]));
        this.fullIcon = this.connectionIndicatorContainer.appendChild(
            createIcon(["connection", "connection_full"]));

    };

    /**
     * Removes the indicator
     */
    ConnectionIndicator.prototype.remove = function()
    {
        this.connectionIndicatorContainer.remove();
        this.popover.forceHide();

    };

    /**
     * Updates the data of the indicator
     * @param percent the percent of connection quality
     * @param object the statistics data.
     */
    ConnectionIndicator.prototype.updateConnectionQuality = function (percent, object) {

        if(percent === null)
        {
            this.connectionIndicatorContainer.style.display = "none";
            this.popover.forceHide();
            return;
        }
        else
        {
            if(this.connectionIndicatorContainer.style.display == "none") {
                this.connectionIndicatorContainer.style.display = "block";
                VideoLayout.updateMutePosition(this.videoContainer.id);
            }
        }
        this.bandwidth = object.bandwidth;
        this.bitrate = object.bitrate;
        this.packetLoss = object.packetLoss;
        this.transport = object.transport;
        if(object.resolution)
        {
            this.resolution = object.resolution;
        }
        for(var quality in ConnectionIndicator.connectionQualityValues)
        {
            if(percent >= quality)
            {
                this.fullIcon.style.width = ConnectionIndicator.connectionQualityValues[quality];
            }
        }
        this.updatePopoverData();
    };

    /**
     * Updates the resolution
     * @param resolution the new resolution
     */
    ConnectionIndicator.prototype.updateResolution = function (resolution) {
        this.resolution = resolution;
        this.updatePopoverData();
    };

    /**
     * Updates the content of the popover
     */
    ConnectionIndicator.prototype.updatePopoverData = function () {
        this.popover.updateContent("<div class=\"connection_info\">" + this.generateText() + "</div>");
    };

    /**
     * Hides the popover
     */
    ConnectionIndicator.prototype.hide = function () {
        this.popover.forceHide();
    };

    /**
     * Hides the indicator
     */
    ConnectionIndicator.prototype.hideIndicator = function () {
        this.connectionIndicatorContainer.style.display = "none";
        if(this.popover)
            this.popover.forceHide();
    };

    /**
     * Updates the data for the indicator
     * @param id the id of the indicator
     * @param percent the percent for connection quality
     * @param object the data
     */
    function updateStatsIndicator(id, percent, object) {
        if(VideoLayout.connectionIndicators[id])
            VideoLayout.connectionIndicators[id].updateConnectionQuality(percent, object);
    }

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
            object.resolution = resolution[connection.emuc.myroomjid];
            delete resolution[connection.emuc.myroomjid];
        }
        updateStatsIndicator("localVideoContainer", percent, object);
        for(var jid in resolution)
        {
            if(resolution[jid] === null)
                continue;
            var id = 'participant_' + Strophe.getResourceFromJid(jid);
            if(VideoLayout.connectionIndicators[id])
            {
                VideoLayout.connectionIndicators[id].updateResolution(resolution[jid]);
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

        var videoSpanId = 'participant_' + resourceJid;
        updateStatsIndicator(videoSpanId, percent, object);
    };

    /**
     * Removes the connection
     * @param jid
     */
    my.removeConnectionIndicator = function (jid) {
        if(VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)])
            VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)].remove();
    };

    /**
     * Hides the connection indicator
     * @param jid
     */
    my.hideConnectionIndicator = function (jid) {
        if(VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)])
            VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)].hide();
    };

    /**
     * Hides all the indicators
     */
    my.onStatsStop = function () {
        for(var indicator in VideoLayout.connectionIndicators)
        {
            VideoLayout.connectionIndicators[indicator].hideIndicator();
        }
    };

    return my;
}(VideoLayout || {}));
