/* global $, APP, Strophe, interfaceConfig */
var Avatar = require("../avatar/Avatar");
var RTCBrowserType = require("../../RTC/RTCBrowserType");
var UIUtil = require("../util/UIUtil");
var UIEvents = require("../../../service/UI/UIEvents");
var xmpp = require("../../xmpp/xmpp");
var ToolbarToggler = require("../toolbars/ToolbarToggler");

// FIXME: With Temasys we have to re-select everytime
//var video = $('#largeVideo');

var currentVideoWidth = null;
var currentVideoHeight = null;
// By default we use camera
var getVideoSize = getCameraVideoSize;
var getVideoPosition = getCameraVideoPosition;
/**
 * The small video instance that is displayed in the large video
 * @type {SmallVideo}
 */
var currentSmallVideo = null;
/**
 * Indicates whether the large video is enabled.
 * @type {boolean}
 */
var isEnabled = true;
/**
 * Current large video state.
 * Possible values - video, prezi or etherpad.
 * @type {string}
 */
var state = "video";

/**
 * Returns the html element associated with the passed state of large video
 * @param state the state.
 * @returns {JQuery|*|jQuery|HTMLElement} the container.
 */
function getContainerByState(state)
{
    var selector = null;
    switch (state)
    {
        case "video":
            selector = "#largeVideo";
            break;
        case "etherpad":
            selector = "#etherpad>iframe";
            break;
        case "prezi":
            selector = "#presentation>iframe";
            break;
    }
    return (selector !== null)? $(selector) : null;
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
                       verticalIndent,
                       animate) {
    if (animate) {
        video.animate({
                width: width,
                height: height,
                top: verticalIndent,
                bottom: verticalIndent,
                left: horizontalIndent,
                right: horizontalIndent
            },
            {
                queue: false,
                duration: 500
            });
    } else {
        video.width(width);
        video.height(height);
        video.css({  top: verticalIndent + 'px',
            bottom: verticalIndent + 'px',
            left: horizontalIndent + 'px',
            right: horizontalIndent + 'px'});
    }

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
 * Updates the src of the active speaker avatar
 * @param jid of the current active speaker
 */
function updateActiveSpeakerAvatarSrc() {
    var avatar = $("#activeSpeakerAvatar")[0];
    var jid = currentSmallVideo.peerJid;
    var url = Avatar.getActiveSpeakerUrl(jid);
    if (avatar.src === url)
        return;
    if (jid) {
        avatar.src = url;
        currentSmallVideo.showAvatar();
    }
}

/**
 * Change the video source of the large video.
 * @param isVisible
 */
function changeVideo(isVisible) {

    if (!currentSmallVideo) {
        console.error("Unable to change large video - no 'currentSmallVideo'");
        return;
    }

    updateActiveSpeakerAvatarSrc();

    APP.RTC.setVideoSrc($('#largeVideo')[0], currentSmallVideo.getSrc());

    var videoTransform = document.getElementById('largeVideo')
        .style.webkitTransform;

    var flipX = currentSmallVideo.flipX;

    if (flipX && videoTransform !== 'scaleX(-1)') {
        document.getElementById('largeVideo').style.webkitTransform =
            "scaleX(-1)";
    } else if (!flipX && videoTransform === 'scaleX(-1)') {
        document.getElementById('largeVideo').style.webkitTransform =
            "none";
    }

    var isDesktop = APP.RTC.isVideoSrcDesktop(currentSmallVideo.peerJid);
    // Change the way we'll be measuring and positioning large video

    getVideoSize = isDesktop ? getDesktopVideoSize : getCameraVideoSize;
    getVideoPosition = isDesktop ? getDesktopVideoPosition :
        getCameraVideoPosition;


    // Only if the large video is currently visible.
    if (isVisible) {
        LargeVideo.VideoLayout.largeVideoUpdated(currentSmallVideo);

        $('#largeVideo').fadeIn(300);
    }
}

/**
 * Creates the html elements for the large video.
 */
function createLargeVideoHTML()
{
    var html = '<div id="largeVideoContainer" class="videocontainer">';
    html += '<div id="presentation"></div>' +
            '<div id="etherpad"></div>' +
            '<a target="_new"><div class="watermark leftwatermark"></div></a>' +
            '<a target="_new"><div class="watermark rightwatermark"></div></a>' +
            '<a class="poweredby" href="http://jitsi.org" target="_new" >' +
                '<span data-i18n="poweredby"></span> jitsi.org' +
            '</a>'+
            '<div id="activeSpeaker">' +
                '<img id="activeSpeakerAvatar" src=""/>' +
                '<canvas id="activeSpeakerAudioLevel"></canvas>' +
            '</div>' +
            '<video id="largeVideo" autoplay oncontextmenu="return false;"></video>' +
            '<span id="videoConnectionMessage"></span>';
    html += '</div>';
    $(html).prependTo("#videospace");

    if (interfaceConfig.SHOW_JITSI_WATERMARK) {
        var leftWatermarkDiv
            = $("#largeVideoContainer div[class='watermark leftwatermark']");

        leftWatermarkDiv.css({display: 'block'});
        leftWatermarkDiv.parent().get(0).href
            = interfaceConfig.JITSI_WATERMARK_LINK;
    }

    if (interfaceConfig.SHOW_BRAND_WATERMARK) {
        var rightWatermarkDiv
            = $("#largeVideoContainer div[class='watermark rightwatermark']");

        rightWatermarkDiv.css({display: 'block'});
        rightWatermarkDiv.parent().get(0).href
            = interfaceConfig.BRAND_WATERMARK_LINK;
        rightWatermarkDiv.get(0).style.backgroundImage
            = "url(images/rightwatermark.png)";
    }

    if (interfaceConfig.SHOW_POWERED_BY) {
        $("#largeVideoContainer>a[class='poweredby']").css({display: 'block'});
    }

    if (!RTCBrowserType.isIExplorer()) {
        $('#largeVideo').volume = 0;
    }
}

var LargeVideo = {

    init: function (VideoLayout, emitter) {
        if(!isEnabled)
            return;
        createLargeVideoHTML();

        this.VideoLayout = VideoLayout;
        this.eventEmitter = emitter;
        this.eventEmitter.emit(UIEvents.LARGEVIDEO_INIT);
        var self = this;
        // Listen for large video size updates
        var largeVideo = $('#largeVideo')[0];
        var onplaying = function (arg1, arg2, arg3) {
            // re-select
            if (RTCBrowserType.isTemasysPluginUsed())
                largeVideo = $('#largeVideo')[0];
            currentVideoWidth = largeVideo.videoWidth;
            currentVideoHeight = largeVideo.videoHeight;
            self.position(currentVideoWidth, currentVideoHeight);
        };
        largeVideo.onplaying = onplaying;
    },
    /**
     * Indicates if the large video is currently visible.
     *
     * @return <tt>true</tt> if visible, <tt>false</tt> - otherwise
     */
    isLargeVideoVisible: function() {
        return $('#largeVideo').is(':visible');
    },
    /**
     * Returns <tt>true</tt> if the user is currently displayed on large video.
     */
    isCurrentlyOnLarge: function (resourceJid) {
        return currentSmallVideo && resourceJid &&
            currentSmallVideo.getResourceJid() === resourceJid;
    },
    /**
     * Updates the large video with the given new video source.
     */
    updateLargeVideo: function (resourceJid, forceUpdate) {
        if(!isEnabled)
            return;
        var newSmallVideo = this.VideoLayout.getSmallVideo(resourceJid);
        console.log('hover in ' + resourceJid + ', video: ', newSmallVideo);

        if (!LargeVideo.isCurrentlyOnLarge(resourceJid) || forceUpdate) {
            $('#activeSpeaker').css('visibility', 'hidden');

            var oldSmallVideo = null;
            if (currentSmallVideo) {
                oldSmallVideo = currentSmallVideo;
            }
            currentSmallVideo = newSmallVideo;

            var oldJid = null;
            if (oldSmallVideo)
                oldJid = oldSmallVideo.peerJid;
            if (oldJid !== resourceJid) {
                // we want the notification to trigger even if userJid is undefined,
                // or null.
                this.eventEmitter.emit(UIEvents.SELECTED_ENDPOINT, resourceJid);
            }
            if (RTCBrowserType.isSafari()) {
                // FIXME In Safari fadeOut works only for the first time
                changeVideo(this.isLargeVideoVisible());
            } else {
                $('#largeVideo').fadeOut(300,
                    changeVideo.bind($('#largeVideo'), this.isLargeVideoVisible()));
            }
        } else {
            if (currentSmallVideo) {
                currentSmallVideo.showAvatar();
            }
        }

    },

    /**
     * Shows/hides the large video.
     */
    setLargeVideoVisible: function(isVisible) {
        if(!isEnabled)
            return;
        if (isVisible) {
            $('#largeVideo').css({visibility: 'visible'});
            $('.watermark').css({visibility: 'visible'});
            if(currentSmallVideo)
                currentSmallVideo.enableDominantSpeaker(true);
        }
        else {
            $('#largeVideo').css({visibility: 'hidden'});
            $('#activeSpeaker').css('visibility', 'hidden');
            $('.watermark').css({visibility: 'hidden'});
            if(currentSmallVideo)
                currentSmallVideo.enableDominantSpeaker(false);
        }
    },
    onVideoTypeChanged: function (jid) {
        if(!isEnabled)
            return;
        var resourceJid = Strophe.getResourceFromJid(jid);
        if (LargeVideo.isCurrentlyOnLarge(resourceJid))
        {
            var isDesktop = APP.RTC.isVideoSrcDesktop(jid);
            getVideoSize = isDesktop ? getDesktopVideoSize : getCameraVideoSize;
            getVideoPosition = isDesktop ? getDesktopVideoPosition
                : getCameraVideoPosition;
            this.position(null, null);
        }
    },
    /**
     * Positions the large video.
     *
     * @param videoWidth the stream video width
     * @param videoHeight the stream video height
     */
    position: function (videoWidth, videoHeight,
                        videoSpaceWidth, videoSpaceHeight, animate) {
        if(!isEnabled)
            return;
        if(!videoSpaceWidth)
            videoSpaceWidth = $('#videospace').width();
        if(!videoSpaceHeight)
            videoSpaceHeight = window.innerHeight;

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
            horizontalIndent, verticalIndent, animate);
    },
    resize: function (animate, isVisible, completeFunction) {
        if(!isEnabled)
            return;
        var availableHeight = window.innerHeight;
        var availableWidth = UIUtil.getAvailableVideoWidth(isVisible);

        if (availableWidth < 0 || availableHeight < 0) return;

        var avatarSize = interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE;
        var top = availableHeight / 2 - avatarSize / 4 * 3;
        $('#activeSpeaker').css('top', top);

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

            $('#largeVideoContainer').animate({
                    width: availableWidth,
                    height: availableHeight
                },
                {
                    queue: false,
                    duration: 500
                });
        } else {
            $('#videospace').width(availableWidth);
            $('#videospace').height(availableHeight);
            $('#largeVideoContainer').width(availableWidth);
            $('#largeVideoContainer').height(availableHeight);
        }
        return [availableWidth, availableHeight];
    },
    resizeVideoAreaAnimated: function (isVisible, completeFunction) {
        if(!isEnabled)
            return;
        var size = this.resize(true, isVisible, completeFunction);
        this.position(null, null, size[0], size[1], true);
    },
    getResourceJid: function () {
        return currentSmallVideo ? currentSmallVideo.getResourceJid() : null;
    },
    updateAvatar: function (resourceJid) {
        if(!isEnabled)
            return;
        if (resourceJid === this.getResourceJid()) {
            updateActiveSpeakerAvatarSrc();
        }
    },
    showAvatar: function (resourceJid, show) {
        if(!isEnabled)
            return;
        if(this.getResourceJid() === resourceJid && state === "video") {
            $("#largeVideo").css("visibility", show ? "hidden" : "visible");
            $('#activeSpeaker').css("visibility", show ? "visible" : "hidden");
            return true;
        }
        return false;
    },
    /**
     * Disables the large video
     */
    disable: function () {
        isEnabled = false;
    },
    /**
     * Enables the large video
     */
    enable: function () {
        isEnabled = true;
    },
    /**
     * Returns true if the video is enabled.
     */
    isEnabled: function () {
        return isEnabled;
    },
    /**
     * Creates the iframe used by the etherpad
     * @param src the value for src attribute
     * @param onloadHandler handler executed when the iframe loads it content
     * @returns {HTMLElement} the iframe
     */
    createEtherpadIframe: function (src, onloadHandler) {
        if(!isEnabled)
            return;

        var etherpadIFrame = document.createElement('iframe');
        etherpadIFrame.src = src;
        etherpadIFrame.frameBorder = 0;
        etherpadIFrame.scrolling = "no";
        etherpadIFrame.width = $('#largeVideoContainer').width() || 640;
        etherpadIFrame.height = $('#largeVideoContainer').height() || 480;
        etherpadIFrame.setAttribute('style', 'visibility: hidden;');

        document.getElementById('etherpad').appendChild(etherpadIFrame);

        etherpadIFrame.onload = onloadHandler;

        return etherpadIFrame;
    },
    /**
     * Changes the state of the large video.
     * Possible values - video, prezi, etherpad.
     * @param newState - the new state
     */
    setState: function (newState) {
        if(state === newState)
            return;
        var currentContainer = getContainerByState(state);
        if(!currentContainer)
            return;

        var self = this;
        var oldState = state;

        switch (newState)
        {
            case "etherpad":
                $('#activeSpeaker').css('visibility', 'hidden');
                currentContainer.fadeOut(300, function () {
                    if (oldState === "prezi") {
                        currentContainer.css({opacity: '0'});
                        $('#reloadPresentation').css({display: 'none'});
                    }
                    else {
                        self.setLargeVideoVisible(false);
                    }
                });

                $('#etherpad>iframe').fadeIn(300, function () {
                    document.body.style.background = '#eeeeee';
                    $('#etherpad>iframe').css({visibility: 'visible'});
                    $('#etherpad').css({zIndex: 2});
                });
                break;
            case "prezi":
                var prezi = $('#presentation>iframe');
                currentContainer.fadeOut(300, function() {
                    document.body.style.background = 'black';
                });
                prezi.fadeIn(300, function() {
                    prezi.css({opacity:'1'});
                    ToolbarToggler.dockToolbar(true);//fix that
                    self.setLargeVideoVisible(false);
                    $('#etherpad>iframe').css({visibility: 'hidden'});
                    $('#etherpad').css({zIndex: 0});
                });
                $('#activeSpeaker').css('visibility', 'hidden');
                break;

            case "video":
                currentContainer.fadeOut(300, function () {
                    $('#presentation>iframe').css({opacity:'0'});
                    $('#reloadPresentation').css({display:'none'});
                    $('#etherpad>iframe').css({visibility: 'hidden'});
                    $('#etherpad').css({zIndex: 0});
                    document.body.style.background = 'black';
                    ToolbarToggler.dockToolbar(false);//fix that
                });
                $('#largeVideo').fadeIn(300, function () {
                    self.setLargeVideoVisible(true);
                });
                break;
        }

        state = newState;

    },
    /**
     * Returns the current state of the large video.
     * @returns {string} the current state - video, prezi or etherpad.
     */
    getState: function () {
        return state;
    },
    /**
     * Sets hover handlers for the large video container div.
     *
     * @param inHandler
     * @param outHandler
     */
    setHover: function(inHandler, outHandler)
    {
        $('#largeVideoContainer').hover(inHandler, outHandler);
    },

    /**
     * Enables/disables the filter indicating a video problem to the user.
     *
     * @param enable <tt>true</tt> to enable, <tt>false</tt> to disable
     */
    enableVideoProblemFilter: function (enable) {
        $("#largeVideo").toggleClass("videoProblemFilter", enable);
    }
};

module.exports = LargeVideo;