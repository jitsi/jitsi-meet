/* global $, APP, interfaceConfig */
/* jshint -W101 */

import UIUtil from "../util/UIUtil";
import UIEvents from "../../../service/UI/UIEvents";
import LargeContainer from './LargeContainer';
import BottomToolbar from '../toolbars/BottomToolbar';
import Avatar from "../avatar/Avatar";
import {createDeferred} from '../../util/helpers';

const RTCBrowserType = require("../../RTC/RTCBrowserType");

const avatarSize = interfaceConfig.DOMINANT_SPEAKER_AVATAR_SIZE;
const FADE_DURATION_MS = 300;

/**
 * Get stream id.
 * @param {JitsiTrack?} stream
 */
function getStreamOwnerId(stream) {
    if (!stream) {
        return;
    }
    if (stream.isLocal()) { // local stream doesn't have method "getParticipantId"
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

    return [ availableWidth, availableHeight ];
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


    return [ availableWidth, availableHeight ];
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

/**
 * Container for user video.
 */
class VideoContainer extends LargeContainer {
    // FIXME: With Temasys we have to re-select everytime
    get $video () {
        return $('#largeVideo');
    }

    get id () {
        return getStreamOwnerId(this.stream);
    }

    constructor (onPlay) {
        super();
        this.stream = null;
        this.videoType = null;

        this.$avatar = $('#dominantSpeaker');
        this.$wrapper = $('#largeVideoWrapper');

        if (!RTCBrowserType.isIExplorer()) {
            this.$video.volume = 0;
        }

        // This does not work with Temasys plugin - has to be a property to be
        // copied between new <object> elements
        //this.$video.on('play', onPlay);
        this.$video[0].onplay = onPlay;
    }

    /**
     * Get size of video element.
     * @returns {{width, height}}
     */
    getStreamSize () {
        let video = this.$video[0];
        return {
            width: video.videoWidth,
            height: video.videoHeight
        };
    }

    /**
     * Calculate optimal video size for specified container size.
     * @param {number} containerWidth container width
     * @param {number} containerHeight container height
     * @returns {{availableWidth, availableHeight}}
     */
    getVideoSize (containerWidth, containerHeight) {
        let { width, height } = this.getStreamSize();
        if (this.stream && this.isScreenSharing()) {
            return getDesktopVideoSize( width,
                                        height,
                                        containerWidth,
                                        containerHeight);
        } else {
            return getCameraVideoSize(  width,
                                        height,
                                        containerWidth,
                                        containerHeight);
        }
    }

    /**
     * Calculate optimal video position (offset for top left corner)
     * for specified video size and container size.
     * @param {number} width video width
     * @param {number} height video height
     * @param {number} containerWidth container width
     * @param {number} containerHeight container height
     * @returns {{horizontalIndent, verticalIndent}}
     */
    getVideoPosition (width, height, containerWidth, containerHeight) {
        if (this.stream && this.isScreenSharing()) {
            return getDesktopVideoPosition( width,
                                            height,
                                            containerWidth,
                                            containerHeight);
        } else {
            return getCameraVideoPosition(  width,
                                            height,
                                            containerWidth,
                                            containerHeight);
        }
    }

    resize (containerWidth, containerHeight, animate = false) {
        let [width, height]
            = this.getVideoSize(containerWidth, containerHeight);
        let { horizontalIndent, verticalIndent }
            = this.getVideoPosition(width, height,
                                    containerWidth, containerHeight);

        // update avatar position
        let top = containerHeight / 2 - avatarSize / 4 * 3;

        this.$avatar.css('top', top);

        this.$wrapper.animate({
            width: width,
            height: height,

            top: verticalIndent,
            bottom: verticalIndent,

            left: horizontalIndent,
            right: horizontalIndent
        }, {
            queue: false,
            duration: animate ? 500 : 0
        });
    }

    /**
     * Update video stream.
     * @param {JitsiTrack?} stream new stream
     * @param {string} videoType video type
     */
    setStream (stream, videoType) {
        this.stream = stream;
        this.videoType = videoType;

        if(!stream)
            return;

        stream.attach(this.$video[0]);

        let flipX = stream.isLocal() && !this.isScreenSharing();
        this.$video.css({
            transform: flipX ? 'scaleX(-1)' : 'none'
        });
    }

    /**
     * Check if current video stream is screen sharing.
     * @returns {boolean}
     */
    isScreenSharing () {
        return this.videoType === 'desktop';
    }

    /**
     * Show or hide user avatar.
     * @param {boolean} show
     */
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
        return new Promise(function(resolve) {
            $wrapper.css({visibility: 'visible'});
            $wrapper.fadeTo(FADE_DURATION_MS, 1, function () {
                $('.watermark').css({visibility: 'visible'});
                resolve();
            });
        });
    }

    hide () {
        let $wrapper = this.$wrapper;

        let id = this.id;
        return new Promise(function(resolve) {
            $wrapper.fadeTo(id ? FADE_DURATION_MS : 1, 0, function () {
                $wrapper.css({visibility: 'hidden'});
                $('.watermark').css({visibility: 'hidden'});
                resolve();
            });
        });
    }
}

/**
 * Manager for all Large containers.
 */
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

    scheduleLargeVideoUpdate () {
        if (this.updateInProcess || !this.newStreamData) {
            return;
        }

        this.updateInProcess = true;

        let container = this.getContainer(this.state);

        container.hide().then(() => {
            let {id, stream, videoType, resolve} = this.newStreamData;
            this.newStreamData = null;

            console.info("hover in %s", id);
            this.state = VideoContainerType;
            this.videoContainer.setStream(stream, videoType);

            // change the avatar url on large
            this.updateAvatar(Avatar.getAvatarUrl(id));

            let isVideoMuted = stream? stream.isMuted() : true;

            // show the avatar on large if needed
            this.videoContainer.showAvatar(isVideoMuted);

            // do not show stream if video is muted
            let promise = isVideoMuted ? Promise.resolve() : this.videoContainer.show();

            // resolve updateLargeVideo promise after everything is done
            promise.then(resolve);

            return promise;
        }).then(() => {
            // after everything is done check again if there are any pending new streams.
            this.updateInProcess = false;
            this.scheduleLargeVideoUpdate();
        });
    }

    /**
     * Update large video.
     * Switches to large video even if previously other container was visible.
     * @param userID the userID of the participant associated with the stream
     * @param {JitsiTrack?} stream new stream
     * @param {string?} videoType new video type
     * @returns {Promise}
     */
    updateLargeVideo (userID, stream, videoType) {
        if (this.newStreamData) {
            this.newStreamData.reject();
        }

        this.newStreamData = createDeferred();
        this.newStreamData.id = userID;
        this.newStreamData.stream = stream;
        this.newStreamData.videoType = videoType;

        this.scheduleLargeVideoUpdate();

        return this.newStreamData.promise;
    }

    /**
     * Update container size optionally taking side bar size into account.
     * @param {boolean} isSideBarVisible if side bar is visible.
     */
    updateContainerSize (isSideBarVisible) {
        this.width = UIUtil.getAvailableVideoWidth(isSideBarVisible);
        this.height = window.innerHeight;
    }

    /**
     * Resize Large container of specified type.
     * @param {string} type type of container which should be resized.
     * @param {boolean} [animate=false] if resize process should be animated.
     */
    resizeContainer (type, animate = false) {
        let container = this.getContainer(type);
        container.resize(this.width, this.height, animate);
    }

    /**
     * Resize all Large containers.
     * @param {boolean} animate if resize process should be animated.
     */
    resize (animate) {
        // resize all containers
        Object.keys(this.containers)
            .forEach(type => this.resizeContainer(type, animate));

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
     * Updates the src of the dominant speaker avatar
     */
    updateAvatar (avatarUrl) {
        $("#dominantSpeakerAvatar").attr('src', avatarUrl);
    }

    /**
     * Show avatar on Large video container or not.
     * @param {boolean} show
     */
    showAvatar (show) {
        this.videoContainer.showAvatar(show);
    }

    /**
     * Add container of specified type.
     * @param {string} type container type
     * @param {LargeContainer} container container to add.
     */
    addContainer (type, container) {
        if (this.containers[type]) {
            throw new Error(`container of type ${type} already exist`);
        }

        this.containers[type] = container;
        this.resizeContainer(type);
    }

    /**
     * Get Large container of specified type.
     * @param {string} type container type.
     * @returns {LargeContainer}
     */
    getContainer (type) {
        let container = this.containers[type];

        if (!container) {
            throw new Error(`container of type ${type} doesn't exist`);
        }

        return container;
    }

    /**
     * Remove Large container of specified type.
     * @param {string} type container type.
     */
    removeContainer (type) {
        if (!this.containers[type]) {
            throw new Error(`container of type ${type} doesn't exist`);
        }

        delete this.containers[type];
    }

    /**
     * Show Large container of specified type.
     * Does nothing if such container is already visible.
     * @param {string} type container type.
     * @returns {Promise}
     */
    showContainer (type) {
        if (this.state === type) {
            return Promise.resolve();
        }

        let oldContainer = this.containers[this.state];
        oldContainer.hide();

        this.state = type;
        let container = this.getContainer(type);

        return container.show();
    }
}
