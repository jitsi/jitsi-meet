/* global $, APP, interfaceConfig */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import Avatar from "../avatar/Avatar";
import {createDeferred} from '../../util/helpers';
import UIUtil from "../util/UIUtil";
import {VideoContainer, VIDEO_CONTAINER_TYPE} from "./VideoContainer";

import AudioLevels from "../audio_levels/AudioLevels";

/**
 * Manager for all Large containers.
 */
export default class LargeVideoManager {
    constructor (emitter) {
        /**
         * The map of <tt>LargeContainer</tt>s where the key is the video
         * container type.
         * @type {Object.<string, LargeContainer>}
         */
        this.containers = {};

        this.state = VIDEO_CONTAINER_TYPE;
        this.videoContainer = new VideoContainer(
            () => this.resizeContainer(VIDEO_CONTAINER_TYPE), emitter);
        this.addContainer(VIDEO_CONTAINER_TYPE, this.videoContainer);

        // use the same video container to handle desktop tracks
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

    /**
     * Called when the media connection has been interrupted.
     */
    onVideoInterrupted () {
        this.enableLocalConnectionProblemFilter(true);
        this._setLocalConnectionMessage("connection.RECONNECTING");
        // Show the message only if the video is currently being displayed
        this.showLocalConnectionMessage(this.state === VIDEO_CONTAINER_TYPE);
    }

    /**
     * Called when the media connection has been restored.
     */
    onVideoRestored () {
        this.enableLocalConnectionProblemFilter(false);
        this.showLocalConnectionMessage(false);
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

        // Include hide()/fadeOut only if we're switching between users
        const isUserSwitch = this.newStreamData.id != this.id;
        const container = this.getContainer(this.state);
        const preUpdate = isUserSwitch ? container.hide() : Promise.resolve();

        preUpdate.then(() => {
            const { id, stream, videoType, resolve } = this.newStreamData;
            this.newStreamData = null;

            logger.info("hover in %s", id);
            this.state = videoType;
            const container = this.getContainer(this.state);
            container.setStream(stream, videoType);

            // change the avatar url on large
            this.updateAvatar(Avatar.getAvatarUrl(id));

            // FIXME that does not really make sense, because the videoType
            // (camera or desktop) is a completely different thing than
            // the video container type (Etherpad, SharedVideo, VideoContainer).
            // ----------------------------------------------------------------
            // If we the continer is VIDEO_CONTAINER_TYPE, we need to check
            // its stream whether exist and is muted to set isVideoMuted
            // in rest of the cases it is false
            let showAvatar
                = (videoType === VIDEO_CONTAINER_TYPE)
                    && (!stream || stream.isMuted());

            // If the user's connection is disrupted then the avatar will be
            // displayed in case we have no video image cached. That is if
            // there was a user switch(image is lost on stream detach) or if
            // the video was not rendered, before the connection has failed.
            const isHavingConnectivityIssues
                = APP.conference.isParticipantConnectionActive(id) === false;
            if (isHavingConnectivityIssues
                    && (isUserSwitch || !container.wasVideoRendered)) {
                showAvatar = true;
            }

            let promise;

            // do not show stream if video is muted
            // but we still should show watermark
            if (showAvatar) {
                this.showWatermark(true);
                // If the intention of this switch is to show the avatar
                // we need to make sure that the video is hidden
                promise = container.hide();
            } else {
                promise = container.show();
            }

            // show the avatar on large if needed
            container.showAvatar(showAvatar);

            // Clean up audio level after previous speaker.
            if (showAvatar) {
                this.updateLargeVideoAudioLevel(0);
            }

            // Make sure no notification about remote failure is shown as
            // its UI conflicts with the one for local connection interrupted.
            this.updateParticipantConnStatusIndication(
                    id,
                    APP.conference.isConnectionInterrupted()
                        || !isHavingConnectivityIssues);

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
     * Shows/hides notification about participant's connectivity issues to be
     * shown on the large video area.
     *
     * @param {string} id the id of remote participant(MUC nickname)
     * @param {boolean} isConnected true if the connection is active or false
     * when the user is having connectivity issues.
     *
     * @private
     */
    updateParticipantConnStatusIndication (id, isConnected) {

        // Apply grey filter on the large video
        this.videoContainer.showRemoteConnectionProblemIndicator(!isConnected);

        if (isConnected) {
            // Hide the message
            this.showRemoteConnectionMessage(false);
        } else {
            // Get user's display name
            let displayName
                = APP.conference.getParticipantDisplayName(id);
            this._setRemoteConnectionMessage(
                "connection.USER_CONNECTION_INTERRUPTED",
                { displayName: displayName });

            // Show it now only if the VideoContainer is on top
            this.showRemoteConnectionMessage(
                this.state === VIDEO_CONTAINER_TYPE);
        }
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
     * Enables/disables the filter indicating a video problem to the user caused
     * by the problems with local media connection.
     *
     * @param enable <tt>true</tt> to enable, <tt>false</tt> to disable
     */
    enableLocalConnectionProblemFilter (enable) {
        this.videoContainer.enableLocalConnectionProblemFilter(enable);
    }

    /**
     * Updates the src of the dominant speaker avatar
     */
    updateAvatar (avatarUrl) {
        $("#dominantSpeakerAvatar").attr('src', avatarUrl);
    }

    /**
     * Updates the audio level indicator of the large video.
     *
     * @param lvl the new audio level to set
     */
    updateLargeVideoAudioLevel (lvl) {
        AudioLevels.updateLargeVideoAudioLevel("dominantSpeaker", lvl);
    }

    /**
     * Show or hide watermark.
     * @param {boolean} show
     */
    showWatermark (show) {
        $('.watermark').css('visibility', show ? 'visible' : 'hidden');
    }

    /**
     * Shows/hides the message indicating problems with local media connection.
     * @param {boolean|null} show(optional) tells whether the message is to be
     * displayed or not. If missing the condition will be based on the value
     * obtained from {@link APP.conference.isConnectionInterrupted}.
     */
    showLocalConnectionMessage (show) {
        if (typeof show !== 'boolean') {
            show = APP.conference.isConnectionInterrupted();
        }

        let id = 'localConnectionMessage';

        UIUtil.setVisible(id, show);

        if (show) {
            // Avatar message conflicts with 'videoConnectionMessage',
            // so it must be hidden
            this.showRemoteConnectionMessage(false);
        }
    }

    /**
     * Shows hides the "avatar" message which is to be displayed either in
     * the middle of the screen or below the avatar image.
     *
     * @param {null|boolean} show (optional) <tt>true</tt> to show the avatar
     * message or <tt>false</tt> to hide it. If not provided then the connection
     * status of the user currently on the large video will be obtained form
     * "APP.conference" and the message will be displayed if the user's
     * connection is interrupted.
     */
    showRemoteConnectionMessage (show) {
        if (typeof show !== 'boolean') {
            show = APP.conference.isParticipantConnectionActive(this.id);
        }

        if (show) {
            $('#remoteConnectionMessage').css({display: "block"});
            // 'videoConnectionMessage' message conflicts with 'avatarMessage',
            // so it must be hidden
            this.showLocalConnectionMessage(false);
        } else {
            $('#remoteConnectionMessage').hide();
        }
    }

    /**
     * Updates the text which describes that the remote user is having
     * connectivity issues.
     *
     * @param {string} msgKey the translation key which will be used to get
     * the message text.
     * @param {object} msgOptions translation options object.
     *
     * @private
     */
    _setRemoteConnectionMessage (msgKey, msgOptions) {
        if (msgKey) {
            $('#remoteConnectionMessage')
                .attr("data-i18n", msgKey)
                .attr("data-i18n-options", JSON.stringify(msgOptions));
            APP.translation.translateElement(
                $('#remoteConnectionMessage'), msgOptions);
        }

        this.videoContainer.positionRemoteConnectionMessage();
    }

    /**
     * Updated the text which is to be shown on the top of large video, when
     * local media connection is interrupted.
     *
     * @param {string} msgKey the translation key which will be used to get
     * the message text to be displayed on the large video.
     *
     * @private
     */
    _setLocalConnectionMessage (msgKey) {
        $('#localConnectionMessage')
            .attr("data-i18n", msgKey);
        APP.translation.translateElement($('#localConnectionMessage'));
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
        // FIXME when video is being replaced with other content we need to hide
        // companion icons/messages. It would be best if the container would
        // be taking care of it by itself, but that is a bigger refactoring
        if (this.state === VIDEO_CONTAINER_TYPE) {
            this.showWatermark(false);
            this.showLocalConnectionMessage(false);
            this.showRemoteConnectionMessage(false);
        }
        oldContainer.hide();

        this.state = type;
        let container = this.getContainer(type);

        return container.show().then(() => {
            if (type === VIDEO_CONTAINER_TYPE) {
                // FIXME when video appears on top of other content we need to
                // show companion icons/messages. It would be best if
                // the container would be taking care of it by itself, but that
                // is a bigger refactoring
                this.showWatermark(true);
                // "avatar" and "video connection" can not be displayed both
                // at the same time, but the latter is of higher priority and it
                // will hide the avatar one if will be displayed.
                this.showRemoteConnectionMessage(/* fet the current state */);
                this.showLocalConnectionMessage(/* fetch the current state */);
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
