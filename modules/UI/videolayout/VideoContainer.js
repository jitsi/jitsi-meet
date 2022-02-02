/* global $, APP, interfaceConfig */

/* eslint-disable no-unused-vars */
import React from 'react';
import ReactDOM from 'react-dom';

import { browser } from '../../../react/features/base/lib-jitsi-meet';
import { isTestModeEnabled } from '../../../react/features/base/testing';
import { ORIENTATION, LargeVideoBackground, updateLastLargeVideoMediaEvent } from '../../../react/features/large-video';
import { LAYOUTS, getCurrentLayout } from '../../../react/features/video-layout';
/* eslint-enable no-unused-vars */
import UIUtil from '../util/UIUtil';

import Filmstrip from './Filmstrip';
import LargeContainer from './LargeContainer';

// FIXME should be 'video'
export const VIDEO_CONTAINER_TYPE = 'camera';

const FADE_DURATION_MS = 300;

/**
 * List of container events that we are going to process, will be added as listener to the
 * container for every event in the list. The latest event will be stored in redux.
 */
const containerEvents = [
    'abort', 'canplay', 'canplaythrough', 'emptied', 'ended', 'error', 'loadeddata', 'loadedmetadata', 'loadstart',
    'pause', 'play', 'playing', 'ratechange', 'stalled', 'suspend', 'waiting'
];

/**
 * Returns an array of the video dimensions, so that it keeps it's aspect
 * ratio and fits available area with it's larger dimension. This method
 * ensures that whole video will be visible and can leave empty areas.
 *
 * @param videoWidth the width of the video to position
 * @param videoHeight the height of the video to position
 * @param videoSpaceWidth the width of the available space
 * @param videoSpaceHeight the height of the available space
 * @return an array with 2 elements, the video width and the video height
 */
function computeDesktopVideoSize( // eslint-disable-line max-params
        videoWidth,
        videoHeight,
        videoSpaceWidth,
        videoSpaceHeight) {
    if (videoWidth === 0 || videoHeight === 0 || videoSpaceWidth === 0 || videoSpaceHeight === 0) {
        // Avoid NaN values caused by division by 0.
        return [ 0, 0 ];
    }

    const aspectRatio = videoWidth / videoHeight;
    let availableWidth = Math.max(videoWidth, videoSpaceWidth);
    let availableHeight = Math.max(videoHeight, videoSpaceHeight);

    if (interfaceConfig.VERTICAL_FILMSTRIP) {
        // eslint-disable-next-line no-param-reassign
        videoSpaceWidth -= Filmstrip.getVerticalFilmstripWidth();
    } else {
        // eslint-disable-next-line no-param-reassign
        videoSpaceHeight -= Filmstrip.getFilmstripHeight();
    }

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
function computeCameraVideoSize( // eslint-disable-line max-params
        videoWidth,
        videoHeight,
        videoSpaceWidth,
        videoSpaceHeight,
        videoLayoutFit) {
    if (videoWidth === 0 || videoHeight === 0 || videoSpaceWidth === 0 || videoSpaceHeight === 0) {
        // Avoid NaN values caused by division by 0.
        return [ 0, 0 ];
    }

    const aspectRatio = videoWidth / videoHeight;
    const videoSpaceRatio = videoSpaceWidth / videoSpaceHeight;

    switch (videoLayoutFit) {
    case 'height':
        return [ videoSpaceHeight * aspectRatio, videoSpaceHeight ];
    case 'width':
        return [ videoSpaceWidth, videoSpaceWidth / aspectRatio ];
    case 'nocrop':
        return computeCameraVideoSize(
            videoWidth,
            videoHeight,
            videoSpaceWidth,
            videoSpaceHeight,
            videoSpaceRatio < aspectRatio ? 'width' : 'height');
    case 'both': {
        const maxZoomCoefficient = interfaceConfig.MAXIMUM_ZOOMING_COEFFICIENT
            || Infinity;

        if (videoSpaceRatio === aspectRatio) {
            return [ videoSpaceWidth, videoSpaceHeight ];
        }

        let [ width, height ] = computeCameraVideoSize(
            videoWidth,
            videoHeight,
            videoSpaceWidth,
            videoSpaceHeight,
            videoSpaceRatio < aspectRatio ? 'height' : 'width');
        const maxWidth = videoSpaceWidth * maxZoomCoefficient;
        const maxHeight = videoSpaceHeight * maxZoomCoefficient;

        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        } else if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        return [ width, height ];
    }
    default:
        return [ videoWidth, videoHeight ];
    }
}

/**
 * Returns an array of the video horizontal and vertical indents,
 * so that if fits its parent.
 *
 * @return an array with 2 elements, the horizontal indent and the vertical
 * indent
 */
function getCameraVideoPosition( // eslint-disable-line max-params
        videoWidth,
        videoHeight,
        videoSpaceWidth,
        videoSpaceHeight) {
    // Parent height isn't completely calculated when we position the video in
    // full screen mode and this is why we use the screen height in this case.
    // Need to think it further at some point and implement it properly.
    if (UIUtil.isFullScreen()) {
        // eslint-disable-next-line no-param-reassign
        videoSpaceHeight = window.innerHeight;
    }

    const horizontalIndent = (videoSpaceWidth - videoWidth) / 2;
    const verticalIndent = (videoSpaceHeight - videoHeight) / 2;

    return { horizontalIndent,
        verticalIndent };
}

/**
 * Container for user video.
 */
export class VideoContainer extends LargeContainer {
    /**
     *
     */
    get $video() {
        return $('#largeVideo');
    }

    /**
     *
     */
    get id() {
        return this.userId;
    }

    /**
     * Creates new VideoContainer instance.
     * @param resizeContainer {Function} function that takes care of the size
     * of the video container.
     */
    constructor(resizeContainer) {
        super();
        this.stream = null;
        this.userId = null;
        this.videoType = null;
        this.localFlipX = true;
        this.resizeContainer = resizeContainer;

        /**
         * Whether the background should fit the height of the container
         * (portrait) or fit the width of the container (landscape).
         *
         * @private
         * @type {string|null}
         */
        this._backgroundOrientation = null;

        /**
         * Flag indicates whether or not the background should be rendered.
         * If the background will not be visible then it is hidden to save
         * on performance.
         * @type {boolean}
         */
        this._hideBackground = true;

        this._isHidden = false;

        /**
         * Flag indicates whether or not the avatar is currently displayed.
         * @type {boolean}
         */
        this.avatarDisplayed = false;
        this.$avatar = $('#dominantSpeaker');

        /**
         * A jQuery selector of the remote connection message.
         * @type {jQuery|HTMLElement}
         */
        this.$remoteConnectionMessage = $('#remoteConnectionMessage');

        this.$remotePresenceMessage = $('#remotePresenceMessage');

        this.$wrapper = $('#largeVideoWrapper');

        /**
         * FIXME: currently using parent() because I can't come up with name
         * for id. We'll need to probably refactor the HTML related to the large
         * video anyway.
         */
        this.$wrapperParent = this.$wrapper.parent();
        this.avatarHeight = $('#dominantSpeakerAvatarContainer').height();
        this.$video[0].onplaying = function(event) {
            if (typeof resizeContainer === 'function') {
                resizeContainer(event);
            }
        };

        /**
         * A Set of functions to invoke when the video element resizes.
         *
         * @private
         */
        this._resizeListeners = new Set();

        this.$video[0].onresize = this._onResize.bind(this);

        if (isTestModeEnabled(APP.store.getState())) {
            const cb = name => APP.store.dispatch(updateLastLargeVideoMediaEvent(name));

            containerEvents.forEach(event => {
                this.$video[0].addEventListener(event, cb.bind(this, event));
            });
        }
    }

    /**
     * Adds a function to the known subscribers of video element resize
     * events.
     *
     * @param {Function} callback - The subscriber to notify when the video
     * element resizes.
     * @returns {void}
     */
    addResizeListener(callback) {
        this._resizeListeners.add(callback);
    }

    /**
     * Obtains media stream ID of the underlying {@link JitsiTrack}.
     * @return {string|null}
     */
    getStreamID() {
        return this.stream ? this.stream.getId() : null;
    }

    /**
     * Get size of video element.
     * @returns {{width, height}}
     */
    getStreamSize() {
        const video = this.$video[0];


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
    _getVideoSize(containerWidth, containerHeight) {
        const { width, height } = this.getStreamSize();

        if (this.stream && this.isScreenSharing()) {
            return computeDesktopVideoSize(width,
                height,
                containerWidth,
                containerHeight);
        }

        return computeCameraVideoSize(width,
            height,
            containerWidth,
            containerHeight,
            interfaceConfig.VIDEO_LAYOUT_FIT);
    }

    /* eslint-disable max-params */
    /**
     * Calculate optimal video position (offset for top left corner)
     * for specified video size and container size.
     * @param {number} width video width
     * @param {number} height video height
     * @param {number} containerWidth container width
     * @param {number} containerHeight container height
     * @returns {{horizontalIndent, verticalIndent}}
     */
    getVideoPosition(width, height, containerWidth, containerHeight) {
        let containerWidthToUse = containerWidth;

        /* eslint-enable max-params */
        if (this.stream && this.isScreenSharing()) {
            if (interfaceConfig.VERTICAL_FILMSTRIP) {
                containerWidthToUse -= Filmstrip.getVerticalFilmstripWidth();
            }

            return getCameraVideoPosition(width,
                height,
                containerWidthToUse,
                containerHeight);
        }

        return getCameraVideoPosition(width,
                height,
                containerWidthToUse,
                containerHeight);

    }

    /**
     * Updates the positioning of the remote connection presence message and the
     * connection status message which escribes that the remote user is having
     * connectivity issues.
     *
     * @returns {void}
     */
    positionRemoteStatusMessages() {
        this._positionParticipantStatus(this.$remoteConnectionMessage);
        this._positionParticipantStatus(this.$remotePresenceMessage);
    }

    /**
     * Modifies the position of the passed in jQuery object so it displays
     * in the middle of the video container or below the avatar.
     *
     * @private
     * @returns {void}
     */
    _positionParticipantStatus($element) {
        if (this.avatarDisplayed) {
            const $avatarImage = $('#dominantSpeakerAvatarContainer');

            $element.css(
                'top',
                $avatarImage.offset().top + $avatarImage.height() + 10);
        } else {
            const height = $element.height();
            const parentHeight = $element.parent().height();

            $element.css('top', (parentHeight / 2) - (height / 2));
        }
    }

    /**
     *
     */
    resize(containerWidth, containerHeight, animate = false) {
        // XXX Prevent TypeError: undefined is not an object when the Web
        // browser does not support WebRTC (yet).
        if (this.$video.length === 0) {
            return;
        }
        const currentLayout = getCurrentLayout(APP.store.getState());

        if (currentLayout === LAYOUTS.TILE_VIEW) {
            // We don't need to resize the large video since it won't be displayed and we'll resize when returning back
            // to stage view.
            return;
        }

        this.positionRemoteStatusMessages();

        const [ width, height ] = this._getVideoSize(containerWidth, containerHeight);

        if (width === 0 || height === 0) {
            // We don't need to set 0 for width or height since the visibility is controlled by the visibility css prop
            // on the largeVideoElementsContainer. Also if the width/height of the video element is 0 the attached
            // stream won't be played. Normally if we attach a new stream we won't resize the video element until the
            // stream has been played. But setting width/height to 0 will prevent the video from playing.

            return;
        }

        if ((containerWidth > width) || (containerHeight > height)) {
            this._backgroundOrientation = containerWidth > width ? ORIENTATION.LANDSCAPE : ORIENTATION.PORTRAIT;
            this._hideBackground = false;
        } else {
            this._hideBackground = true;
        }

        this._updateBackground();

        const { horizontalIndent, verticalIndent }
            = this.getVideoPosition(width, height, containerWidth, containerHeight);

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

    /**
     * Removes a function from the known subscribers of video element resize
     * events.
     *
     * @param {Function} callback - The callback to remove from known
     * subscribers of video resize events.
     * @returns {void}
     */
    removeResizeListener(callback) {
        this._resizeListeners.delete(callback);
    }

    /**
     * Update video stream.
     * @param {string} userID
     * @param {JitsiTrack?} stream new stream
     * @param {string} videoType video type
     */
    setStream(userID, stream, videoType) {
        this.userId = userID;
        if (this.stream === stream) {
            // Handles the use case for the remote participants when the
            // videoType is received with delay after turning on/off the
            // desktop sharing.
            if (this.videoType !== videoType) {
                this.videoType = videoType;
                this.resizeContainer();
            }

            return;
        }

        // detach old stream
        if (this.stream) {
            this.stream.detach(this.$video[0]);
        }

        this.stream = stream;
        this.videoType = videoType;

        if (!stream) {
            return;
        }

        stream.attach(this.$video[0]);

        // Ensure large video gets play() called on it when a new stream is attached to it. This is necessary in the
        // case of Safari as autoplay doesn't kick-in automatically on Safari 15 and newer versions.
        browser.isWebKitBased() && this.$video[0].play();

        const flipX = stream.isLocal() && this.localFlipX && !this.isScreenSharing();

        this.$video.css({
            transform: flipX ? 'scaleX(-1)' : 'none'
        });

        this._updateBackground();
    }

    /**
     * Changes the flipX state of the local video.
     * @param val {boolean} true if flipped.
     */
    setLocalFlipX(val) {
        this.localFlipX = val;
        if (!this.$video || !this.stream || !this.stream.isLocal()) {
            return;
        }
        this.$video.css({
            transform: this.localFlipX ? 'scaleX(-1)' : 'none'
        });

        this._updateBackground();
    }


    /**
     * Check if current video stream is screen sharing.
     * @returns {boolean}
     */
    isScreenSharing() {
        return this.videoType === 'desktop';
    }

    /**
     * Show or hide user avatar.
     * @param {boolean} show
     */
    showAvatar(show) {
        this.$avatar.css('visibility', show ? 'visible' : 'hidden');
        this.avatarDisplayed = show;

        APP.API.notifyLargeVideoVisibilityChanged(show);
    }

    /**
     * We are doing fadeOut/fadeIn animations on parent div which wraps
     * largeVideo, because when Temasys plugin is in use it replaces
     * <video> elements with plugin <object> tag. In Safari jQuery is
     * unable to store values on this plugin object which breaks all
     * animation effects performed on it directly.
     *
     * TODO: refactor this since Temasys is no longer supported.
     */
    show() {
        return new Promise(resolve => {
            this.$wrapperParent.css('visibility', 'visible').fadeTo(
                FADE_DURATION_MS,
                1,
                () => {
                    this._isHidden = false;
                    this._updateBackground();
                    resolve();
                }
            );
        });
    }

    /**
     *
     */
    hide() {
        // as the container is hidden/replaced by another container
        // hide its avatar
        this.showAvatar(false);

        return new Promise(resolve => {
            this.$wrapperParent.fadeTo(FADE_DURATION_MS, 0, () => {
                this.$wrapperParent.css('visibility', 'hidden');
                this._isHidden = true;
                this._updateBackground();
                resolve();
            });
        });
    }

    /**
     * @return {boolean} switch on dominant speaker event if on stage.
     */
    stayOnStage() {
        return false;
    }

    /**
     * Callback invoked when the video element changes dimensions.
     *
     * @private
     * @returns {void}
     */
    _onResize() {
        this._resizeListeners.forEach(callback => callback());
    }

    /**
     * Attaches and/or updates a React Component to be used as a background for
     * the large video, to display blurred video and fill up empty space not
     * taken up by the large video.
     *
     * @private
     * @returns {void}
     */
    _updateBackground() {
        // Do not the background display on browsers that might experience
        // performance issues from the presence of the background or if
        // explicitly disabled.
        if (interfaceConfig.DISABLE_VIDEO_BACKGROUND
                || browser.isFirefox()
                || browser.isWebKitBased()) {
            return;
        }

        ReactDOM.render(
            <LargeVideoBackground
                hidden = { this._hideBackground || this._isHidden }
                mirror = {
                    this.stream
                    && this.stream.isLocal()
                    && this.localFlipX
                }
                orientationFit = { this._backgroundOrientation }
                videoElement = { this.$video && this.$video[0] }
                videoTrack = { this.stream } />,
            document.getElementById('largeVideoBackgroundContainer')
        );
    }
}
