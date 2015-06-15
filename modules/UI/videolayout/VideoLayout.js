var AudioLevels = require("../audio_levels/AudioLevels");
var Avatar = require("../avatar/Avatar");
var Chat = require("../side_pannels/chat/Chat");
var ContactList = require("../side_pannels/contactlist/ContactList");
var UIUtil = require("../util/UIUtil");
var ConnectionIndicator = require("./ConnectionIndicator");
var NicknameHandler = require("../util/NicknameHandler");
var MediaStreamType = require("../../../service/RTC/MediaStreamTypes");
var UIEvents = require("../../../service/UI/UIEvents");

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

var eventEmitter = null;

/**
 * Currently focused video "src"(displayed in large video).
 * @type {String}
 */
var focusedVideoInfo = null;

var mutedAudios = {};

var flipXLocalVideo = true;
var currentVideoWidth = null;
var currentVideoHeight = null;

var localVideoSrc = null;

function videoactive( videoelem) {
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
            !require("../prezi/Prezi").isPresentationVisible()) ||
            (parentResourceJid &&
                VideoLayout.getDominantSpeakerResourceJid() === parentResourceJid)) {
            VideoLayout.updateLargeVideo(
                APP.RTC.getVideoSrc(videoelem[0]),
                1,
                parentResourceJid);
        }

        VideoLayout.showModeratorIndicator();
    }
}

function waitForRemoteVideo(selector, ssrc, stream, jid) {
    // XXX(gp) so, every call to this function is *always* preceded by a call
    // to the RTC.attachMediaStream() function but that call is *not* followed
    // by an update to the videoSrcToSsrc map!
    //
    // The above way of doing things results in video SRCs that don't correspond
    // to any SSRC for a short period of time (to be more precise, for as long
    // the waitForRemoteVideo takes to complete). This causes problems (see
    // bellow).
    //
    // I'm wondering why we need to do that; i.e. why call RTC.attachMediaStream()
    // a second time in here and only then update the videoSrcToSsrc map? Why
    // not simply update the videoSrcToSsrc map when the RTC.attachMediaStream()
    // is called the first time? I actually do that in the lastN changed event
    // handler because the "orphan" video SRC is causing troubles there. The
    // purpose of this method would then be to fire the "videoactive.jingle".
    //
    // Food for though I guess :-)

    if (selector.removed || !selector.parent().is(":visible")) {
        console.warn("Media removed before had started", selector);
        return;
    }

    if (stream.id === 'mixedmslabel') return;

    if (selector[0].currentTime > 0) {
        APP.RTC.attachMediaStream(selector, stream); // FIXME: why do i have to do this for FF?
        videoactive(selector);
    } else {
        setTimeout(function () {
            waitForRemoteVideo(selector, ssrc, stream, jid);
        }, 250);
    }
}

/**
 * Returns an array of the video horizontal and vertical indents,
 * so that if fits its parent.
 *
 * @return an array with 2 elements, the horizontal indent and the vertical
 * indent
 */
function getCameraVideoPosition(videoWidth,
                                videoHeight,
                                videoSpaceWidth,
                                videoSpaceHeight) {
    // Parent height isn't completely calculated when we position the video in
    // full screen mode and this is why we use the screen height in this case.
    // Need to think it further at some point and implement it properly.
    var isFullScreen = document.fullScreen ||
        document.mozFullScreen ||
        document.webkitIsFullScreen;
    if (isFullScreen)
        videoSpaceHeight = window.innerHeight;

    var horizontalIndent = (videoSpaceWidth - videoWidth) / 2;
    var verticalIndent = (videoSpaceHeight - videoHeight) / 2;

    return [horizontalIndent, verticalIndent];
}

/**
 * Returns an array of the video horizontal and vertical indents.
 * Centers horizontally and top aligns vertically.
 *
 * @return an array with 2 elements, the horizontal indent and the vertical
 * indent
 */
function getDesktopVideoPosition(videoWidth,
                                 videoHeight,
                                 videoSpaceWidth,
                                 videoSpaceHeight) {

    var horizontalIndent = (videoSpaceWidth - videoWidth) / 2;

    var verticalIndent = 0;// Top aligned

    return [horizontalIndent, verticalIndent];
}


/**
 * Returns an array of the video dimensions, so that it covers the screen.
 * It leaves no empty areas, but some parts of the video might not be visible.
 *
 * @return an array with 2 elements, the video width and the video height
 */
function getCameraVideoSize(videoWidth,
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

    if (availableWidth / aspectRatio < videoSpaceHeight) {
        availableHeight = videoSpaceHeight;
        availableWidth = availableHeight * aspectRatio;
    }

    if (availableHeight * aspectRatio < videoSpaceWidth) {
        availableWidth = videoSpaceWidth;
        availableHeight = availableWidth / aspectRatio;
    }

    return [availableWidth, availableHeight];
}

/**
 * Sets the display name for the given video span id.
 */
function setDisplayName(videoSpanId, displayName, key) {

    if (!$('#' + videoSpanId).length) {
        console.warn(
            "Unable to set displayName - " + videoSpanId + " does not exist");
        return;
    }

    var nameSpan = $('#' + videoSpanId + '>span.displayname');
    var defaultLocalDisplayName = APP.translation.generateTranslatonHTML(
        interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);

    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        var nameSpanElement = nameSpan.get(0);

        if (nameSpanElement.id === 'localDisplayName' &&
            $('#localDisplayName').text() !== displayName) {
            if (displayName && displayName.length > 0)
            {
                var meHTML = APP.translation.generateTranslatonHTML("me");
                $('#localDisplayName').html(displayName + ' (' + meHTML + ')');
            }
            else
                $('#localDisplayName').html(defaultLocalDisplayName);
        } else {
            if (displayName && displayName.length > 0)
            {
                $('#' + videoSpanId + '_name').html(displayName);
            }
            else if (key && key.length > 0)
            {
                var nameHtml = APP.translation.generateTranslatonHTML(key);
                $('#' + videoSpanId + '_name').html(nameHtml);
            }
            else
                $('#' + videoSpanId + '_name').text(
                    interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME);
        }
    } else {
        var editButton = null;

        nameSpan = document.createElement('span');
        nameSpan.className = 'displayname';
        $('#' + videoSpanId)[0].appendChild(nameSpan);

        if (videoSpanId === 'localVideoContainer') {
            editButton = createEditDisplayNameButton();
            if (displayName && displayName.length > 0) {
                var meHTML = APP.translation.generateTranslatonHTML("me");
                nameSpan.innerHTML = displayName + meHTML;
            }
            else
                nameSpan.innerHTML = defaultLocalDisplayName;
        }
        else {
            if (displayName && displayName.length > 0) {

                nameSpan.innerText = displayName;
            }
            else
                nameSpan.innerText = interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
        }


        if (!editButton) {
            nameSpan.id = videoSpanId + '_name';
        } else {
            nameSpan.id = 'localDisplayName';
            $('#' + videoSpanId)[0].appendChild(editButton);
            //translates popover of edit button
            APP.translation.translateElement($("a.displayname"));

            var editableText = document.createElement('input');
            editableText.className = 'displayname';
            editableText.type = 'text';
            editableText.id = 'editDisplayName';

            if (displayName && displayName.length) {
                editableText.value
                    = displayName;
            }

            var defaultNickname = APP.translation.translateString(
                "defaultNickname", {name: "Jane Pink"});
            editableText.setAttribute('style', 'display:none;');
            editableText.setAttribute('data-18n',
                '[placeholder]defaultNickname');
            editableText.setAttribute("data-i18n-options",
                JSON.stringify({name: "Jane Pink"}));
            editableText.setAttribute("placeholder", defaultNickname);

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

/**
 * Gets the selector of video thumbnail container for the user identified by
 * given <tt>userJid</tt>
 * @param resourceJid user's Jid for whom we want to get the video container.
 */
function getParticipantContainer(resourceJid)
{
    if (!resourceJid)
        return null;

    if (resourceJid === APP.xmpp.myResource())
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

    var mutedIndicator = "<i style='float:left;' class='icon-mic-disabled'></i>";

    if (!mutedAudios[jid]) {
        muteLinkItem.innerHTML = mutedIndicator +
            " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.domute'></div>";
        muteLinkItem.className = 'mutelink';
    }
    else {
        muteLinkItem.innerHTML = mutedIndicator +
            " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.muted'></div>";
        muteLinkItem.className = 'mutelink disabled';
    }

    muteLinkItem.onclick = function(){
        if ($(this).attr('disabled') != undefined) {
            event.preventDefault();
        }
        var isMute = mutedAudios[jid] == true;
        APP.xmpp.setMute(jid, !isMute);

        popupmenuElement.setAttribute('style', 'display:none;');

        if (isMute) {
            this.innerHTML = mutedIndicator +
                " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.muted'></div>";
            this.className = 'mutelink disabled';
        }
        else {
            this.innerHTML = mutedIndicator +
                " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.domute'></div>";
            this.className = 'mutelink';
        }
    };

    muteMenuItem.appendChild(muteLinkItem);
    popupmenuElement.appendChild(muteMenuItem);

    var ejectIndicator = "<i style='float:left;' class='fa fa-eject'></i>";

    var ejectMenuItem = document.createElement('li');
    var ejectLinkItem = document.createElement('a');
    var ejectText = "<div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.kick'>&nbsp;</div>";
    ejectLinkItem.innerHTML = ejectIndicator + ' ' + ejectText;
    ejectLinkItem.onclick = function(){
        APP.xmpp.eject(jid);
        popupmenuElement.setAttribute('style', 'display:none;');
    };

    ejectMenuItem.appendChild(ejectLinkItem);
    popupmenuElement.appendChild(ejectMenuItem);

    var paddingSpan = document.createElement('span');
    paddingSpan.className = 'popupmenuPadding';
    popupmenuElement.appendChild(paddingSpan);
    APP.translation.translateElement($("#" + popupmenuElement.id + " > li > a > div"));
}

/**
 * Removes remote video menu element from video element identified by
 * given <tt>videoElementId</tt>.
 *
 * @param videoElementId the id of local or remote video element.
 */
function removeRemoteVideoMenu(videoElementId) {
    var menuSpan = $('#' + videoElementId + '>span.remotevideomenu');
    if (menuSpan.length) {
        menuSpan.remove();
    }
}

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
    UIUtil.setTooltip(editButton,
        "videothumbnail.editnickname",
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

    UIUtil.setTooltip(parentElement,
        "videothumbnail.moderator",
        "top");
}


var VideoLayout = (function (my) {
    my.connectionIndicators = {};

    // By default we use camera
    my.getVideoSize = getCameraVideoSize;
    my.getVideoPosition = getCameraVideoPosition;

    my.init = function (emitter) {
        // Listen for large video size updates
        document.getElementById('largeVideo')
            .addEventListener('loadedmetadata', function (e) {
                currentVideoWidth = this.videoWidth;
                currentVideoHeight = this.videoHeight;
                VideoLayout.positionLarge(currentVideoWidth, currentVideoHeight);
            });
        eventEmitter = emitter;
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
        setDisplayName('localVideoContainer');

        if(!VideoLayout.connectionIndicators["localVideoContainer"]) {
            VideoLayout.connectionIndicators["localVideoContainer"]
                = new ConnectionIndicator($("#localVideoContainer")[0], null, VideoLayout);
        }

        AudioLevels.updateAudioLevelCanvas(null, VideoLayout);

        var localVideo = null;

        function localVideoClick(event) {
            event.stopPropagation();
            VideoLayout.handleVideoThumbClicked(
                APP.RTC.getVideoSrc(localVideo),
                false,
                APP.xmpp.myResource());
        }

        $('#localVideoContainer').click(localVideoClick);

        // Add hover handler
        $('#localVideoContainer').hover(
            function() {
                VideoLayout.showDisplayName('localVideoContainer', true);
            },
            function() {
                if (!VideoLayout.isLargeVideoVisible()
                    || APP.RTC.getVideoSrc(localVideo) !== APP.RTC.getVideoSrc($('#largeVideo')[0]))
                    VideoLayout.showDisplayName('localVideoContainer', false);
            }
        );

        if(isMuted)
        {
            APP.UI.setVideoMute(true);
            return;
        }
        var flipX = true;
        if(stream.videoType == "screen")
            flipX = false;
        var localVideo = document.createElement('video');
        localVideo.id = 'localVideo_' +
            APP.RTC.getStreamID(stream.getOriginalStream());
        localVideo.autoplay = true;
        localVideo.volume = 0; // is it required if audio is separated ?
        localVideo.oncontextmenu = function () { return false; };

        var localVideoContainer = document.getElementById('localVideoWrapper');
        localVideoContainer.appendChild(localVideo);

        var localVideoSelector = $('#' + localVideo.id);

        // Add click handler to both video and video wrapper elements in case
        // there's no video.
        localVideoSelector.click(localVideoClick);

        // Flip video x axis if needed
        flipXLocalVideo = flipX;
        if (flipX) {
            localVideoSelector.addClass("flipVideoX");
        }

        // Attach WebRTC stream
        APP.RTC.attachMediaStream(localVideoSelector, stream.getOriginalStream());

        // Add stream ended handler
        stream.getOriginalStream().onended = function () {
            localVideoContainer.removeChild(localVideo);
            VideoLayout.updateRemovedVideo(APP.RTC.getVideoSrc(localVideo));
        };


        localVideoSrc = APP.RTC.getVideoSrc(localVideo);

        var myResourceJid = APP.xmpp.myResource();

        VideoLayout.updateLargeVideo(localVideoSrc, 0, myResourceJid);

    };

    my.mucJoined = function () {
        var myResourceJid = APP.xmpp.myResource();

        if (!largeVideoState.userResourceJid)
            VideoLayout.updateLargeVideo(localVideoSrc, 0, myResourceJid, true);
    };

    /**
     * Adds or removes icons for not available camera and microphone.
     * @param resourceJid the jid of user
     * @param devices available devices
     */
    my.setDeviceAvailabilityIcons = function (resourceJid, devices) {
        if(!devices)
            return;

        var container = null
        if(!resourceJid)
        {
            container = $("#localVideoContainer")[0];
        }
        else
        {
            container = $("#participant_" + resourceJid)[0];
        }

        if(!container)
            return;

        $("#" + container.id + " > .noMic").remove();
        $("#" + container.id + " > .noVideo").remove();
        if(!devices.audio)
        {
            container.appendChild(document.createElement("div")).setAttribute("class","noMic");
        }

        if(!devices.video)
        {
            container.appendChild(document.createElement("div")).setAttribute("class","noVideo");
        }

        if(!devices.audio && !devices.video)
        {
            $("#" + container.id + " > .noMic").css("background-position", "75%");
            $("#" + container.id + " > .noVideo").css("background-position", "25%");
            $("#" + container.id + " > .noVideo").css("background-color", "transparent");
        }
    }

    /**
     * Checks if removed video is currently displayed and tries to display
     * another one instead.
     * @param removedVideoSrc src stream identifier of the video.
     */
    my.updateRemovedVideo = function(removedVideoSrc) {
        if (removedVideoSrc === APP.RTC.getVideoSrc($('#largeVideo')[0])) {
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

            var src = null, volume = null;
            // mute if localvideo
            if (pick) {
                var container = pick.parentNode;
                src = APP.RTC.getVideoSrc(pick);
                volume = pick.volume;
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

            VideoLayout.updateLargeVideo(src, volume, jid);
        }
    };
    
    my.onRemoteStreamAdded = function (stream) {
        var container;
        var remotes = document.getElementById('remoteVideos');

        if (stream.peerjid) {
            VideoLayout.ensurePeerContainerExists(stream.peerjid);

            container  = document.getElementById(
                    'participant_' + Strophe.getResourceFromJid(stream.peerjid));
        } else {
            var id = stream.getOriginalStream().id;
            if (id !== 'mixedmslabel'
                // FIXME: default stream is added always with new focus
                // (to be investigated)
                && id !== 'default') {
                console.error('can not associate stream',
                    id,
                    'with a participant');
                // We don't want to add it here since it will cause troubles
                return;
            }
            // FIXME: for the mixed ms we dont need a video -- currently
            container = document.createElement('span');
            container.id = 'mixedstream';
            container.className = 'videocontainer';
            remotes.appendChild(container);
        }

        if (container) {
            VideoLayout.addRemoteStreamElement( container,
                stream.sid,
                stream.getOriginalStream(),
                stream.peerjid,
                stream.ssrc);
        }
    }

    my.getLargeVideoState = function () {
        return largeVideoState;
    };

    /**
     * Updates the large video with the given new video source.
     */
    my.updateLargeVideo = function(newSrc, vol, resourceJid, forceUpdate) {
        console.log('hover in', newSrc, resourceJid);

        if (APP.RTC.getVideoSrc($('#largeVideo')[0]) !== newSrc || forceUpdate) {
            $('#activeSpeaker').css('visibility', 'hidden');
            // Due to the simulcast the localVideoSrc may have changed when the
            // fadeOut event triggers. In that case the getJidFromVideoSrc and
            // isVideoSrcDesktop methods will not function correctly.
            //
            // Also, again due to the simulcast, the updateLargeVideo method can
            // be called multiple times almost simultaneously. Therefore, we
            // store the state here and update only once.

            largeVideoState.newSrc = newSrc;
            largeVideoState.isVisible = $('#largeVideo').is(':visible');
            largeVideoState.isDesktop = APP.RTC.isVideoSrcDesktop(
                APP.xmpp.findJidFromResource(resourceJid));

            if(largeVideoState.userResourceJid) {
                largeVideoState.oldResourceJid = largeVideoState.userResourceJid;
            } else {
                largeVideoState.oldResourceJid = null;
            }
            largeVideoState.userResourceJid = resourceJid;

            // Screen stream is already rotated
            largeVideoState.flipX = (newSrc === localVideoSrc) && flipXLocalVideo;

            if (largeVideoState.oldResourceJid !== largeVideoState.userResourceJid) {
                // we want the notification to trigger even if userJid is undefined,
                // or null.
                eventEmitter.emit(UIEvents.SELECTED_ENDPOINT,
                    largeVideoState.userResourceJid);
            }

            $('#largeVideo').fadeOut(300, function () {
                Avatar.updateActiveSpeakerAvatarSrc(
                    APP.xmpp.findJidFromResource(
                        largeVideoState.userResourceJid));

                APP.RTC.setVideoSrc($('#largeVideo')[0], largeVideoState.newSrc);

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

                VideoLayout.getVideoSize = largeVideoState.isDesktop
                    ? getDesktopVideoSize
                    : getCameraVideoSize;
                VideoLayout.getVideoPosition = largeVideoState.isDesktop
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

                if (largeVideoState.isVisible) {
                    // using "this" should be ok because we're called
                    // from within the fadeOut event.
                    $(this).fadeIn(300);
                }

                Avatar.showUserAvatar(
                    APP.xmpp.findJidFromResource(
                        largeVideoState.oldResourceJid));
            });
        } else {
            Avatar.showUserAvatar(
                APP.xmpp.findJidFromResource(
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
                        APP.RTC.getVideoSrc(dominantSpeakerVideo),
                        1,
                        currentDominantSpeaker);
                }
            }

            if (!noPinnedEndpointChangedEvent) {
                eventEmitter.emit(UIEvents.PINNED_ENDPOINT);
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
                eventEmitter.emit(UIEvents.PINNED_ENDPOINT, resourceJid);
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

        var videoSize = VideoLayout.getVideoSize(videoWidth,
                                     videoHeight,
                                     videoSpaceWidth,
                                     videoSpaceHeight);

        var largeVideoWidth = videoSize[0];
        var largeVideoHeight = videoSize[1];

        var videoPosition = VideoLayout.getVideoPosition(largeVideoWidth,
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
            $('#activeSpeaker').css('visibility', 'hidden');
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
                        APP.xmpp.findJidFromResource(focusResourceJid));
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
        var Etherpad = require("../etherpad/Etherpad");
        var Prezi = require("../prezi/Prezi");
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

        if (!$('#' + videoSpanId).length) {
            var container =
                VideoLayout.addRemoteVideoContainer(peerJid, videoSpanId, userId);
            Avatar.setUserAvatar(peerJid, userId);
            // Set default display name.
            setDisplayName(videoSpanId);

            VideoLayout.connectionIndicators[videoSpanId] =
                new ConnectionIndicator(container, peerJid, VideoLayout);

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
        remotes.appendChild(container);
        // If the peerJid is null then this video span couldn't be directly
        // associated with a participant (this could happen in the case of prezi).
        if (APP.xmpp.isModerator() && peerJid !== null)
            addRemoteVideoMenu(peerJid, container);
        AudioLevels.updateAudioLevelCanvas(peerJid, VideoLayout);

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
                    + sid + '_' + APP.RTC.getStreamID(stream);

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
                APP.RTC.attachMediaStream(sel, stream);

                if (isVideo)
                    waitForRemoteVideo(sel, thessrc, stream, peerJid);
            }

            stream.onended = function () {
                console.log('stream ended', this);

                VideoLayout.removeRemoteStreamElement(
                    stream, isVideo, container, newElementId);

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
                        APP.RTC.getVideoSrc(videoThumb),
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
                        videoSrc = APP.RTC.getVideoSrc($('#' + container.id + '>video').get(0));
                    }

                    // If the video has been "pinned" by the user we want to
                    // keep the display name on place.
                    if (!VideoLayout.isLargeVideoVisible()
                            || videoSrc !== APP.RTC.getVideoSrc($('#largeVideo')[0]))
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
    my.removeRemoteStreamElement = function (stream, isVideo, container, id) {
        if (!container)
            return;

        var select = null;
        var removedVideoSrc = null;
        if (isVideo) {
            select = $('#' + id);
            removedVideoSrc = APP.RTC.getVideoSrc(select.get(0));
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

            var jid = APP.xmpp.findJidFromResource(resourceJid);
            if (state == 'show')
            {
                // peerContainer.css('-webkit-filter', '');

                Avatar.showUserAvatar(jid, false);
            }
            else // if (state == 'avatar')
            {
                // peerContainer.css('-webkit-filter', 'grayscale(100%)');
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

    my.inputDisplayNameHandler = function (name) {
        NicknameHandler.setNickname(name);

        if (!$('#localDisplayName').is(":visible")) {
            if (NicknameHandler.getNickname())
            {
                var meHTML = APP.translation.generateTranslatonHTML("me");
                $('#localDisplayName').html(NicknameHandler.getNickname() + " (" + meHTML + ")");
            }
            else
            {
                var defaultHTML = APP.translation.generateTranslatonHTML(
                    interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);
                $('#localDisplayName')
                    .html(defaultHTML);
            }
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

        var isModerator = APP.xmpp.isModerator();
        if (isModerator) {
            var indicatorSpan = $('#localVideoContainer .focusindicator');

            if (indicatorSpan.children().length === 0)
            {
                createModeratorIndicatorElement(indicatorSpan[0]);
                //translates text in focus indicator
                APP.translation.translateElement($('#localVideoContainer .focusindicator'));
            }
        }

        var members = APP.xmpp.getMembers();

        Object.keys(members).forEach(function (jid) {

            if (Strophe.getResourceFromJid(jid) === 'focus') {
                // Skip server side focus
                return;
            }

            var resourceJid = Strophe.getResourceFromJid(jid);
            var videoSpanId = 'participant_' + resourceJid;
            var videoContainer = document.getElementById(videoSpanId);

            if (!videoContainer) {
                console.error("No video container for " + jid);
                return;
            }

            var member = members[jid];

            if (member.role === 'moderator') {
                // Remove menu if peer is moderator
                var menuSpan = $('#' + videoSpanId + '>span.remotevideomenu');
                if (menuSpan.length) {
                    removeRemoteVideoMenu(videoSpanId);
                }
                // Show moderator indicator
                var indicatorSpan
                    = $('#' + videoSpanId + ' .focusindicator');

                if (!indicatorSpan || indicatorSpan.length === 0) {
                    indicatorSpan = document.createElement('span');
                    indicatorSpan.className = 'focusindicator';

                    videoContainer.appendChild(indicatorSpan);

                    createModeratorIndicatorElement(indicatorSpan);
                    //translates text in focus indicators
                    APP.translation.translateElement($('#' + videoSpanId + ' .focusindicator'));
                }
            } else if (isModerator) {
                // We are moderator, but user is not - add menu
                if ($('#remote_popupmenu_' + resourceJid).length <= 0) {
                    addRemoteVideoMenu(
                        jid,
                        document.getElementById('participant_' + resourceJid));
                }
            }
        });
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
                UIUtil.setTooltip(mutedIndicator,
                    "videothumbnail.videomute",
                    "top");
                videoMutedSpan.appendChild(mutedIndicator);
                //translate texts for muted indicator
                APP.translation.translateElement($('#' + videoSpanId  + " > span > i"));
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
                UIUtil.setTooltip(audioMutedSpan,
                    "videothumbnail.mute",
                    "top");

                $('#' + videoSpanId)[0].appendChild(audioMutedSpan);
                APP.translation.translateElement($('#' + videoSpanId + " > span"));
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
        var availableWidth = UIUtil.getAvailableVideoWidth();

        if (availableWidth < 0 || availableHeight < 0) return;

        $('#videospace').width(availableWidth);
        $('#videospace').height(availableHeight);
        $('#largeVideoContainer').width(availableWidth);
        $('#largeVideoContainer').height(availableHeight);

        var avatarSize = interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE;
        var top = availableHeight / 2 - avatarSize / 4 * 3;
        $('#activeSpeaker').css('top', top);

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
                === APP.xmpp.myResource()) {
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
            displayName = nameSpan.html();

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
        }
        Avatar.showUserAvatar(
            APP.xmpp.findJidFromResource(resourceJid));
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
    $(document).bind('audiomuted.muc', function (event, jid, isMuted) {
        /*
         // FIXME: but focus can not mute in this case ? - check
        if (jid === xmpp.myJid()) {

            // The local mute indicator is controlled locally
            return;
        }*/
        var videoSpanId = null;
        if (jid === APP.xmpp.myJid()) {
            videoSpanId = 'localVideoContainer';
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
        }

        mutedAudios[jid] = isMuted;

        if (APP.xmpp.isModerator()) {
            VideoLayout.updateRemoteVideoMenu(jid, isMuted);
        }

        if (videoSpanId)
            VideoLayout.showAudioIndicator(videoSpanId, isMuted);
    });

    /**
     * On video muted event.
     */
    $(document).bind('videomuted.muc', function (event, jid, value) {
        var isMuted = (value === "true");
        if(jid !== APP.xmpp.myJid() && !APP.RTC.muteRemoteVideoStream(jid, isMuted))
            return;

        Avatar.showUserAvatar(jid, isMuted);
        var videoSpanId = null;
        if (jid === APP.xmpp.myJid()) {
            videoSpanId = 'localVideoContainer';
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
        }

        if (videoSpanId)
            VideoLayout.showVideoIndicator(videoSpanId, value);
    });

    /**
     * Display name changed.
     */
    my.onDisplayNameChanged =
                    function (jid, displayName, status) {
        if (jid === 'localVideoContainer'
            || jid === APP.xmpp.myJid()) {
            setDisplayName('localVideoContainer',
                           displayName);
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            setDisplayName(
                'participant_' + Strophe.getResourceFromJid(jid),
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
            var oldSpeakerVideoSpanId = "participant_" + currentDominantSpeaker,
                newSpeakerVideoSpanId = "participant_" + resourceJid;
            var currentJID = APP.xmpp.findJidFromResource(currentDominantSpeaker);
            var newJID = APP.xmpp.findJidFromResource(resourceJid);
            if(currentDominantSpeaker && (!members || !members[currentJID] ||
                !members[currentJID].displayName)) {
                setDisplayName(oldSpeakerVideoSpanId, null);
            }
            if(resourceJid && (!members || !members[newJID] ||
                !members[newJID].displayName)) {
                setDisplayName(newSpeakerVideoSpanId, null,
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
            if (video.length && video[0].currentTime > 0) {
                VideoLayout.updateLargeVideo(
                        APP.RTC.getVideoSrc(video[0]), 1, resourceJid);
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
                = APP.xmpp.myResource();

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
                VideoLayout.updateLargeVideo(src, 1, resource);
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

    my.participantLeft = function (jid) {
        // Unlock large video
        var resourceJid = Strophe.getResourceFromJid(jid);
        if (focusedVideoInfo && focusedVideoInfo.resourceJid === resourceJid)
        {
            console.info("Focused video owner has left the conference");
            focusedVideoInfo = null;
        }
    }
    
    my.onVideoTypeChanged = function (jid) {
        if(jid &&
            Strophe.getResourceFromJid(jid) === largeVideoState.userResourceJid)
        {
            largeVideoState.isDesktop = APP.RTC.isVideoSrcDesktop(jid);
            VideoLayout.getVideoSize = largeVideoState.isDesktop
                ? getDesktopVideoSize
                : getCameraVideoSize;
            VideoLayout.getVideoPosition = largeVideoState.isDesktop
                ? getDesktopVideoPosition
                : getCameraVideoPosition;
            VideoLayout.positionLarge(null, null);
        }
    }

    return my;
}(VideoLayout || {}));

module.exports = VideoLayout;