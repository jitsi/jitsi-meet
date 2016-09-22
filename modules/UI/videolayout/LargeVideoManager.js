/* global $, APP, interfaceConfig */
/* jshint -W101 */

import Avatar from "../avatar/Avatar";
import {createDeferred} from '../../util/helpers';
import UIUtil from "../util/UIUtil";
import {VideoContainer, VIDEO_CONTAINER_TYPE} from "./VideoContainer";

/**
 * Manager for all Large containers.
 */
export default class LargeVideoManager {
    constructor (emitter) {
        this.containers = {};

        this.state = VIDEO_CONTAINER_TYPE;
        this.videoContainer = new VideoContainer(
            () => this.resizeContainer(VIDEO_CONTAINER_TYPE), emitter);
        this.addContainer(VIDEO_CONTAINER_TYPE, this.videoContainer);

        // use the same video container to handle and desktop tracks
        this.addContainer("desktop", this.videoContainer);

        this.width = 0;
        this.height = 0;

        this.$container = $('#largeVideoContainer');

        this.$container.css({
            display: 'inline-block'
        });

        if (interfaceConfig.SHOW_JITSI_WATERMARK) {
            let leftWatermarkDiv
                = this.$container.find("div.watermark.leftwatermark");

            leftWatermarkDiv.css({display: 'block'});

            UIUtil.setLinkHref(
                leftWatermarkDiv.parent(),
                interfaceConfig.JITSI_WATERMARK_LINK);
        }

        if (interfaceConfig.SHOW_BRAND_WATERMARK) {
            let rightWatermarkDiv
                = this.$container.find("div.watermark.rightwatermark");

            rightWatermarkDiv.css({
                display: 'block',
                backgroundImage: 'url(images/rightwatermark.png)'
            });

            UIUtil.setLinkHref(
                rightWatermarkDiv.parent(),
                interfaceConfig.BRAND_WATERMARK_LINK);
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
        let container = this.getContainer(this.state);
        return container.id;
    }

    scheduleLargeVideoUpdate () {
        if (this.updateInProcess || !this.newStreamData) {
            return;
        }

        this.updateInProcess = true;

        let container = this.getContainer(this.state);

        // Include hide()/fadeOut only if we're switching between users
        let preUpdate;
        if (this.newStreamData.id != this.id) {
            preUpdate = container.hide();
        } else {
            preUpdate = Promise.resolve();
        }

        preUpdate.then(() => {
            let {id, stream, videoType, resolve} = this.newStreamData;
            this.newStreamData = null;

            console.info("hover in %s", id);
            this.state = videoType;
            let container = this.getContainer(this.state);
            container.setStream(stream, videoType);

            // change the avatar url on large
            this.updateAvatar(Avatar.getAvatarUrl(id));

            // If we the continer is VIDEO_CONTAINER_TYPE, we need to check
            // its stream whether exist and is muted to set isVideoMuted
            // in rest of the cases it is false
            let isVideoMuted = false;
            if (videoType == VIDEO_CONTAINER_TYPE)
                isVideoMuted = stream ? stream.isMuted() : true;

            // show the avatar on large if needed
            container.showAvatar(isVideoMuted);

            let promise;

            // do not show stream if video is muted
            // but we still should show watermark
            if (isVideoMuted) {
                this.showWatermark(true);
                promise = Promise.resolve();
            } else {
                promise = container.show();
            }

            // resolve updateLargeVideo promise after everything is done
            promise.then(resolve);

            return promise;
        }).then(() => {
            // after everything is done check again if there are any pending
            // new streams.
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
     * Update container size.
     */
    updateContainerSize () {
        this.width = UIUtil.getAvailableVideoWidth();
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
        this.videoContainer.enableVideoProblemFilter(enable);
    }

    /**
     * Updates the src of the dominant speaker avatar
     */
    updateAvatar (avatarUrl) {
        $("#dominantSpeakerAvatar").attr('src', avatarUrl);
    }

    /**
     * Show or hide watermark.
     * @param {boolean} show
     */
    showWatermark (show) {
        $('.watermark').css('visibility', show ? 'visible' : 'hidden');
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
        if (this.state === VIDEO_CONTAINER_TYPE) {
            this.showWatermark(false);
        }
        oldContainer.hide();

        this.state = type;
        let container = this.getContainer(type);

        return container.show().then(() => {
            if (type === VIDEO_CONTAINER_TYPE) {
                this.showWatermark(true);
            }
        });
    }

    /**
     * Changes the flipX state of the local video.
     * @param val {boolean} true if flipped.
     */
    onLocalFlipXChange(val) {
        this.videoContainer.setLocalFlipX(val);
    }
}
