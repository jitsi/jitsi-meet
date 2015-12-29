/* global $, APP, interfaceConfig */
/* jshint -W101 */
import Avatar from "../avatar/Avatar";
import ToolbarToggler from "../toolbars/ToolbarToggler";
import UIUtil from "../util/UIUtil";
import UIEvents from "../../../service/UI/UIEvents";

var RTCBrowserType = require("../../RTC/RTCBrowserType");

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
function getContainerByState(state) {
    var selector = null;
    switch (state) {
    case "video":
        selector = "#largeVideoWrapper";
        break;
    case "etherpad":
        selector = "#etherpad>iframe";
        break;
    case "prezi":
        selector = "#presentation>iframe";
        break;
    default:
        return null;
    }
    return $(selector);
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
        }, {
            queue: false,
            duration: 500
        });
    } else {
        video.width(width);
        video.height(height);
        video.css({
            top:     verticalIndent,
            bottom:  verticalIndent,
            left:    horizontalIndent,
            right:   horizontalIndent
        });
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

    var filmstrip = $("#remoteVideos");

    if (!filmstrip.hasClass("hidden"))
        videoSpaceHeight -= filmstrip.outerHeight();

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
 * Returns an array of the video dimensions. It respects the
 * VIDEO_LAYOUT_FIT config, to fit the video to the screen, by hiding some parts
 * of it, or to fit it to the height or width.
 *
 * @param videoWidth the original video width
 * @param videoHeight the original video height
 * @param videoSpaceWidth the width of the video space
 * @param videoSpaceHeight the height of the video space
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

    var availableWidth = videoWidth;
    var availableHeight = videoHeight;

    if (interfaceConfig.VIDEO_LAYOUT_FIT == 'height') {
        availableHeight = videoSpaceHeight;
        availableWidth = availableHeight*aspectRatio;
    }
    else if (interfaceConfig.VIDEO_LAYOUT_FIT == 'width') {
        availableWidth = videoSpaceWidth;
        availableHeight = availableWidth/aspectRatio;
    }
    else if (interfaceConfig.VIDEO_LAYOUT_FIT == 'both') {
        availableWidth = Math.max(videoWidth, videoSpaceWidth);
        availableHeight = Math.max(videoHeight, videoSpaceHeight);

        if (availableWidth / aspectRatio < videoSpaceHeight) {
            availableHeight = videoSpaceHeight;
            availableWidth = availableHeight * aspectRatio;
        }

        if (availableHeight * aspectRatio < videoSpaceWidth) {
            availableWidth = videoSpaceWidth;
            availableHeight = availableWidth / aspectRatio;
        }
    }


    return [availableWidth, availableHeight];
}

/**
 * Updates the src of the active speaker avatar
 */
function updateActiveSpeakerAvatarSrc() {
    let avatar = $("#activeSpeakerAvatar");
    let id = currentSmallVideo.id;
    let url = Avatar.getActiveSpeakerUrl(id);
    if (id && avatar.attr('src') !== url) {
        avatar.attr('src', url);
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
    let largeVideoElement = $('#largeVideo');

    currentSmallVideo.stream.attach(largeVideoElement);

    let flipX = currentSmallVideo.flipX;

    largeVideoElement.css({
        transform: flipX ? "scaleX(-1)" : "none"
    });

    LargeVideo.updateVideoSizeAndPosition(currentSmallVideo.getVideoType());

    // Only if the large video is currently visible.
    if (isVisible) {
        LargeVideo.VideoLayout.largeVideoUpdated(currentSmallVideo);

        $('#largeVideoWrapper').fadeTo(300, 1);
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
            '<div id="largeVideoWrapper">' +
                '<video id="largeVideo" muted="true"' +
                        'autoplay oncontextmenu="return false;"></video>' +
            '</div id="largeVideoWrapper">' +
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
        return $('#largeVideoWrapper').is(':visible');
    },
    /**
     * Returns <tt>true</tt> if the user is currently displayed on large video.
     */
    isCurrentlyOnLarge: function (id) {
        return id && id === this.getId();
    },
    /**
     * Updates the large video with the given new video source.
     */
    updateLargeVideo: function (id, forceUpdate) {
        if(!isEnabled) {
            return;
        }
        let newSmallVideo = this.VideoLayout.getSmallVideo(id);
        console.info(`hover in ${id} , video: `, newSmallVideo);

        if (!newSmallVideo) {
            console.error("Small video not found for: " + id);
            return;
        }

        if (!LargeVideo.isCurrentlyOnLarge(id) || forceUpdate) {
            $('#activeSpeaker').css('visibility', 'hidden');

            let oldId = this.getId();

            currentSmallVideo = newSmallVideo;

            if (oldId !== id) {
                // we want the notification to trigger even if id is undefined,
                // or null.
                this.eventEmitter.emit(UIEvents.SELECTED_ENDPOINT, id);
            }
            // We are doing fadeOut/fadeIn animations on parent div which wraps
            // largeVideo, because when Temasys plugin is in use it replaces
            // <video> elements with plugin <object> tag. In Safari jQuery is
            // unable to store values on this plugin object which breaks all
            // animation effects performed on it directly.
            //
            // If for any reason large video was hidden before calling fadeOut
            // changeVideo will never be called, so we call show() in chain just
            // to be sure
            $('#largeVideoWrapper').show().fadeTo(300, 0,
                changeVideo.bind($('#largeVideo'), this.isLargeVideoVisible()));
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
            $('#largeVideoWrapper').css({visibility: 'visible'});
            $('.watermark').css({visibility: 'visible'});
            if(currentSmallVideo)
                currentSmallVideo.enableDominantSpeaker(true);
        }
        else {
            $('#largeVideoWrapper').css({visibility: 'hidden'});
            $('#activeSpeaker').css('visibility', 'hidden');
            $('.watermark').css({visibility: 'hidden'});
            if(currentSmallVideo)
                currentSmallVideo.enableDominantSpeaker(false);
        }
    },
    onVideoTypeChanged: function (id, newVideoType) {
        if (!isEnabled)
            return;
        if (LargeVideo.isCurrentlyOnLarge(id)) {
            LargeVideo.updateVideoSizeAndPosition(newVideoType);

            this.position(null, null, null, null, true);
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

        positionVideo($('#largeVideoWrapper'),
            largeVideoWidth,
            largeVideoHeight,
            horizontalIndent, verticalIndent, animate);
    },
    /**
     * Resizes the large html elements.
     *
     * @param animate boolean property that indicates whether the resize should
     * be animated or not.
     * @param isSideBarVisible boolean property that indicates whether the chat
     * area is displayed or not.
     * If that parameter is null the method will check the chat panel
     * visibility.
     * @param completeFunction a function to be called when the video space is
     * resized
     * @returns {*[]} array with the current width and height values of the
     * largeVideo html element.
     */
    resize: function (animate, isSideBarVisible, completeFunction) {
        if(!isEnabled)
            return;
        var availableHeight = window.innerHeight;
        var availableWidth = UIUtil.getAvailableVideoWidth(isSideBarVisible);

        if (availableWidth < 0 || availableHeight < 0) return;

        var avatarSize = interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE;
        var top = availableHeight / 2 - avatarSize / 4 * 3;
        $('#activeSpeaker').css('top', top);

        this.VideoLayout
            .resizeVideoSpace(animate, isSideBarVisible, completeFunction);
        if(animate) {
            $('#largeVideoContainer').animate({
                    width: availableWidth,
                    height: availableHeight
                },
                {
                    queue: false,
                    duration: 500
                });
        } else {
            $('#largeVideoContainer').width(availableWidth);
            $('#largeVideoContainer').height(availableHeight);
        }
        return [availableWidth, availableHeight];
    },
    /**
     * Resizes the large video.
     *
     * @param isSideBarVisible indicating if the side bar is visible
     * @param completeFunction the callback function to be executed after the
     * resize
     */
    resizeVideoAreaAnimated: function (isSideBarVisible, completeFunction) {
        if(!isEnabled)
            return;
        var size = this.resize(true, isSideBarVisible, completeFunction);
        this.position(null, null, size[0], size[1], true);
    },
    /**
     * Updates the video size and position.
     *
     * @param videoType the video type indicating if the stream is of type
     * desktop or web cam
     */
    updateVideoSizeAndPosition: function (videoType) {
        if (!videoType)
            videoType = currentSmallVideo.getVideoType();

        var isDesktop = videoType === 'desktop';

        // Change the way we'll be measuring and positioning large video
        getVideoSize = isDesktop ? getDesktopVideoSize : getCameraVideoSize;
        getVideoPosition = isDesktop ? getDesktopVideoPosition :
            getCameraVideoPosition;
    },
    getId: function () {
        return currentSmallVideo ? currentSmallVideo.id : null;
    },
    updateAvatar: function (id) {
        if (!isEnabled) {
            return;
        }
        if (id === this.getId()) {
            updateActiveSpeakerAvatarSrc();
        }
    },
    showAvatar: function (id, show) {
        if (!isEnabled) {
            return;
        }
        if (this.getId() === id && state === "video") {
            $("#largeVideoWrapper").css("visibility", show ? "hidden" : "visible");
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
                $('#largeVideoWrapper').fadeIn(300, function () {
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

export default LargeVideo;
