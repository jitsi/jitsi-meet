/* global $, APP, interfaceConfig */
/* jshint -W101 */

import UIUtil from "../util/UIUtil";
import UIEvents from "../../../service/UI/UIEvents";
import LargeContainer from './LargeContainer';
import BottomToolbar from '../toolbars/BottomToolbar';

const RTCBrowserType = require("../../RTC/RTCBrowserType");

const avatarSize = interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE;

function getStreamId(stream) {
    if(!stream)
        return;
    if (stream.isLocal()) {
        return APP.conference.localId;
    } else {
        return stream.getParticipantId();
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

    let aspectRatio = videoWidth / videoHeight;

    let availableWidth = Math.max(videoWidth, videoSpaceWidth);
    let availableHeight = Math.max(videoHeight, videoSpaceHeight);

    videoSpaceHeight -= BottomToolbar.getFilmStripHeight();

    if (availableWidth / aspectRatio >= videoSpaceHeight) {
        availableHeight = videoSpaceHeight;
        availableWidth = availableHeight * aspectRatio;
    }

    if (availableHeight * aspectRatio >= videoSpaceWidth) {
        availableWidth = videoSpaceWidth;
        availableHeight = availableWidth / aspectRatio;
    }

    return { availableWidth, availableHeight };
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

    let aspectRatio = videoWidth / videoHeight;

    let availableWidth = videoWidth;
    let availableHeight = videoHeight;

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


    return { availableWidth, availableHeight };
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
    if (UIUtil.isFullScreen()) {
        videoSpaceHeight = window.innerHeight;
    }

    let horizontalIndent = (videoSpaceWidth - videoWidth) / 2;
    let verticalIndent = (videoSpaceHeight - videoHeight) / 2;

    return { horizontalIndent, verticalIndent };
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

    let horizontalIndent = (videoSpaceWidth - videoWidth) / 2;

    let verticalIndent = 0;// Top aligned

    return { horizontalIndent, verticalIndent };
}

export const VideoContainerType = "video";

class VideoContainer extends LargeContainer {
    // FIXME: With Temasys we have to re-select everytime
    get $video () {
        return $('#largeVideo');
    }

    get id () {
        if (this.stream) {
            return getStreamId(this.stream);
        }
    }

    constructor (onPlay) {
        super();
        this.stream = null;
        this.videoType = null;

        this.$avatar = $('#activeSpeaker');
        this.$wrapper = $('#largeVideoWrapper');

        if (!RTCBrowserType.isIExplorer()) {
            this.$video.volume = 0;
        }

        this.$video.on('play', onPlay);
    }

    getStreamSize () {
        let video = this.$video[0];
        return {
            width: video.videoWidth,
            height: video.videoHeight
        };
    }

    getVideoSize (containerWidth, containerHeight) {
        let { width, height } = this.getStreamSize();
        if (this.stream && this.isScreenSharing()) {
            return getDesktopVideoSize(width, height, containerWidth, containerHeight);
        } else {
            return getCameraVideoSize(width, height, containerWidth, containerHeight);
        }
    }

    getVideoPosition (width, height, containerWidth, containerHeight) {
        if (this.stream && this.isScreenSharing()) {
            return getDesktopVideoPosition(width, height, containerWidth, containerHeight);
        } else {
            return getCameraVideoPosition(width, height, containerWidth, containerHeight);
        }
    }

    resize (containerWidth, containerHeight, animate = false) {
        let { width, height } = this.getVideoSize(containerWidth, containerHeight);
        let { horizontalIndent, verticalIndent } = this.getVideoPosition(width, height, containerWidth, containerHeight);

        // update avatar position
        let top = containerHeight / 2 - avatarSize / 4 * 3;

        this.$avatar.css('top', top);

        this.$wrapper.animate({
            width,
            height,

            top: verticalIndent,
            bottom: verticalIndent,

            left: horizontalIndent,
            right: horizontalIndent
        }, {
            queue: false,
            duration: animate ? 500 : 0
        });
    }

    setStream (stream, videoType) {
        this.stream = stream;
        this.videoType = videoType;

        stream.attach(this.$video);

        let flipX = stream.isLocal() && !this.isScreenSharing();
        this.$video.css({
            transform: flipX ? 'scaleX(-1)' : 'none'
        });
    }

    isScreenSharing () {
        return this.videoType === 'desktop';
    }

    showAvatar (show) {
        this.$avatar.css("visibility", show ? "visible" : "hidden");
    }

    // We are doing fadeOut/fadeIn animations on parent div which wraps
    // largeVideo, because when Temasys plugin is in use it replaces
    // <video> elements with plugin <object> tag. In Safari jQuery is
    // unable to store values on this plugin object which breaks all
    // animation effects performed on it directly.

    show () {
        let $wrapper = this.$wrapper;
        return new Promise(resolve => {
            $wrapper.fadeIn(300, function () {
                $wrapper.css({visibility: 'visible'});
                $('.watermark').css({visibility: 'visible'});
            });
            resolve();
        });
    }

    hide () {
        this.showAvatar(false);

        let $wrapper = this.$wrapper;

        return new Promise(resolve => {
            $wrapper.fadeOut(300, function () {
                $wrapper.css({visibility: 'hidden'});
                $('.watermark').css({visibility: 'hidden'});
                resolve();
            });
        });
    }
}


export default class LargeVideoManager {
    constructor () {
        this.containers = {};

        this.state = VideoContainerType;
        this.videoContainer = new VideoContainer(() => this.resizeContainer(VideoContainerType));
        this.addContainer(VideoContainerType, this.videoContainer);

        this.width = 0;
        this.height = 0;

        this.$container = $('#largeVideoContainer');

        this.$container.css({
            display: 'inline-block'
        });

        if (interfaceConfig.SHOW_JITSI_WATERMARK) {
            let leftWatermarkDiv = this.$container.find("div.watermark.leftwatermark");

            leftWatermarkDiv.css({display: 'block'});

            leftWatermarkDiv.parent().attr('href', interfaceConfig.JITSI_WATERMARK_LINK);
        }

        if (interfaceConfig.SHOW_BRAND_WATERMARK) {
            let rightWatermarkDiv = this.$container.find("div.watermark.rightwatermark");

            rightWatermarkDiv.css({
                display: 'block',
                backgroundImage: 'url(images/rightwatermark.png)'
            });

            rightWatermarkDiv.parent().attr('href', interfaceConfig.BRAND_WATERMARK_LINK);
        }

        if (interfaceConfig.SHOW_POWERED_BY) {
            this.$container.children("a.poweredby").css({display: 'block'});
        }

        this.$container.hover(
            e => this.onHoverIn(e),
            e => this.onHoverOut(e)
        );
    }

    onHoverIn (e) {
        if (!this.state) {
            return;
        }
        let container = this.getContainer(this.state);
        container.onHoverIn(e);
    }

    onHoverOut (e) {
        if (!this.state) {
            return;
        }
        let container = this.getContainer(this.state);
        container.onHoverOut(e);
    }

    get id () {
        return this.videoContainer.id;
    }

    updateLargeVideo (stream, videoType) {
        let id = getStreamId(stream);

        let container = this.getContainer(this.state);

        container.hide().then(() => {
            console.info("hover in %s", id);
            this.state = VideoContainerType;
            this.videoContainer.setStream(stream, videoType);
            this.videoContainer.show();
        });
    }

    updateContainerSize (isSideBarVisible) {
        this.width = UIUtil.getAvailableVideoWidth(isSideBarVisible);
        this.height = window.innerHeight;
    }

    resizeContainer (type, animate = false) {
        let container = this.getContainer(type);
        container.resize(this.width, this.height, animate);
    }

    resize (animate) {
        // resize all containers
        Object.keys(this.containers).forEach(type => this.resizeContainer(type, animate));

        this.$container.animate({
            width: this.width,
            height: this.height
        }, {
            queue: false,
            duration: animate ? 500 : 0
        });
    }

    /**
     * Enables/disables the filter indicating a video problem to the user.
     *
     * @param enable <tt>true</tt> to enable, <tt>false</tt> to disable
     */
    enableVideoProblemFilter (enable) {
        this.videoContainer.$video.toggleClass("videoProblemFilter", enable);
    }

    /**
     * Updates the src of the active speaker avatar
     */
    updateAvatar (thumbUrl) {
        $("#activeSpeakerAvatar").attr('src', thumbUrl);
    }

    showAvatar (show) {
        this.videoContainer.showAvatar(show);
    }

    addContainer (type, container) {
        if (this.containers[type]) {
            throw new Error(`container of type ${type} already exist`);
        }

        this.containers[type] = container;
        this.resizeContainer(type);
    }

    getContainer (type) {
        let container = this.containers[type];

        if (!container) {
            throw new Error(`container of type ${type} doesn't exist`);
        }

        return container;
    }

    removeContainer (type) {
        if (!this.containers[type]) {
            throw new Error(`container of type ${type} doesn't exist`);
        }

        delete this.containers[type];
    }

    showContainer (type) {
        if (this.state === type) {
            return Promise.resolve();
        }

        let container = this.getContainer(type);

        if (this.state) {
            let oldContainer = this.containers[this.state];
            if (oldContainer) {
                oldContainer.hide();
            }
        }

        this.state = type;

        return container.show();
    }
}
