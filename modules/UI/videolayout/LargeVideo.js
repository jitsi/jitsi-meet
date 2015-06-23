var Avatar = require("../avatar/Avatar");
var UIUtil = require("../util/UIUtil");
var UIEvents = require("../../../service/UI/UIEvents");
var xmpp = require("../../xmpp/xmpp");

var video = $('#largeVideo');

var currentVideoWidth = null;
var currentVideoHeight = null;
// By default we use camera
var getVideoSize = getCameraVideoSize;
var getVideoPosition = getCameraVideoPosition;
var currentSmallVideo = null;
var oldSmallVideo = null;



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
    if(animate)
    {
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
    }
    else
    {
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


function changeVideo(isVisible) {
    Avatar.updateActiveSpeakerAvatarSrc(currentSmallVideo.peerJid);

    APP.RTC.setVideoSrc($('#largeVideo')[0], currentSmallVideo.getSrc());

    var videoTransform = document.getElementById('largeVideo')
        .style.webkitTransform;

    var flipX = currentSmallVideo.flipX;

    if (flipX && videoTransform !== 'scaleX(-1)') {
        document.getElementById('largeVideo').style.webkitTransform
            = "scaleX(-1)";
    }
    else if (!flipX && videoTransform === 'scaleX(-1)') {
        document.getElementById('largeVideo').style.webkitTransform
            = "none";
    }

    var isDesktop = APP.RTC.isVideoSrcDesktop(currentSmallVideo.peerJid);
    // Change the way we'll be measuring and positioning large video

    getVideoSize = isDesktop
        ? getDesktopVideoSize
        : getCameraVideoSize;
    getVideoPosition = isDesktop
        ? getDesktopVideoPosition
        : getCameraVideoPosition;


    // Only if the large video is currently visible.
    // Disable previous dominant speaker video.
    if (oldSmallVideo) {
        oldSmallVideo.enableDominantSpeaker(false);
    }

    // Enable new dominant speaker in the remote videos section.
    if (currentSmallVideo) {
        currentSmallVideo.enableDominantSpeaker(true);
    }

    if (isVisible) {
        // using "this" should be ok because we're called
        // from within the fadeOut event.
        $(this).fadeIn(300);
    }

    if(oldSmallVideo)
        Avatar.showUserAvatar(oldSmallVideo.peerJid);
}

var LargeVideo = {

    init: function (VideoLayout, emitter) {
        this.VideoLayout = VideoLayout;
        this.eventEmitter = emitter;
        var self = this;
        // Listen for large video size updates
        document.getElementById('largeVideo')
            .addEventListener('loadedmetadata', function (e) {
                currentVideoWidth = this.videoWidth;
                currentVideoHeight = this.videoHeight;
                self.position(currentVideoWidth, currentVideoHeight);
            });
    },
    /**
     * Indicates if the large video is currently visible.
     *
     * @return <tt>true</tt> if visible, <tt>false</tt> - otherwise
     */
    isLargeVideoVisible: function() {
        return video.is(':visible');
    },
    /**
     * Updates the large video with the given new video source.
     */
    updateLargeVideo: function(resourceJid, forceUpdate) {
        console.log('hover in', resourceJid);
        var newSmallVideo = this.VideoLayout.getSmallVideo(resourceJid);

        if ((currentSmallVideo && currentSmallVideo.resourceJid !== resourceJid)
            || forceUpdate) {
            $('#activeSpeaker').css('visibility', 'hidden');

            if(currentSmallVideo) {
                oldSmallVideo = currentSmallVideo;
            } else {
                oldSmallVideo = null;
            }

            currentSmallVideo = newSmallVideo;
            var oldJid = null;
            if(oldSmallVideo)
                oldJid = oldSmallVideo.peerJid;

            if (oldJid !== resourceJid) {
                // we want the notification to trigger even if userJid is undefined,
                // or null.
                this.eventEmitter.emit(UIEvents.SELECTED_ENDPOINT,
                    resourceJid);
            }

            video.fadeOut(300, changeVideo.bind(video, this.isLargeVideoVisible()));
        } else {
            var jid = null;
            if(currentSmallVideo)
                jid = currentSmallVideo.peerJid;
            Avatar.showUserAvatar(jid);
        }

    },

    /**
     * Shows/hides the large video.
     */
    setLargeVideoVisible: function(isVisible) {
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
        if(jid && currentSmallVideo && jid === currentSmallVideo.peerJid)
        {
            var isDesktop = APP.RTC.isVideoSrcDesktop(jid);
            getVideoSize = isDesktop
                ? getDesktopVideoSize
                : getCameraVideoSize;
            getVideoPosition = isDesktop
                ? getDesktopVideoPosition
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

    isLargeVideoOnTop: function () {
        var Etherpad = require("../etherpad/Etherpad");
        var Prezi = require("../prezi/Prezi");
        return !Prezi.isPresentationVisible() && !Etherpad.isVisible();
    },
    resize: function (animate, isVisible, completeFunction) {
        var availableHeight = window.innerHeight;
        var availableWidth = UIUtil.getAvailableVideoWidth(isVisible);

        if (availableWidth < 0 || availableHeight < 0) return;

        var avatarSize = interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE;
        var top = availableHeight / 2 - avatarSize / 4 * 3;
        $('#activeSpeaker').css('top', top);

        if(animate)
        {
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


        }
        else
        {
            $('#videospace').width(availableWidth);
            $('#videospace').height(availableHeight);
            $('#largeVideoContainer').width(availableWidth);
            $('#largeVideoContainer').height(availableHeight);
        }
        return [availableWidth, availableHeight];

    },
    resizeVideoAreaAnimated: function (isVisible, completeFunction) {
        var size = this.resize(true, isVisible, completeFunction);
        this.position(null, null, size[0], size[1], true);
    },
    getResourceJid: function () {
        if(!currentSmallVideo)
            return null;
        return currentSmallVideo.peerJid;
    }

}


module.exports = LargeVideo;