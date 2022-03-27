/* global $, APP */
/* eslint-disable no-unused-vars */
import Logger from '@jitsi/logger';
import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import { createScreenSharingIssueEvent, sendAnalytics } from '../../../react/features/analytics';
import { Avatar } from '../../../react/features/base/avatar';
import theme from '../../../react/features/base/components/themes/participantsPaneTheme.json';
import { getSourceNameSignalingFeatureFlag } from '../../../react/features/base/config';
import { i18next } from '../../../react/features/base/i18n';
import { VIDEO_TYPE } from '../../../react/features/base/media';
import {
    getParticipantById,
    getParticipantDisplayName
} from '../../../react/features/base/participants';
import {
    getVideoTrackByParticipant
} from '../../../react/features/base/tracks';
import { CHAT_SIZE } from '../../../react/features/chat';
import {
    isParticipantConnectionStatusActive,
    isParticipantConnectionStatusInactive,
    isParticipantConnectionStatusInterrupted,
    isTrackStreamingStatusActive,
    isTrackStreamingStatusInactive,
    isTrackStreamingStatusInterrupted
} from '../../../react/features/connection-indicator/functions';
import { FILMSTRIP_BREAKPOINT, isFilmstripResizable, getVerticalViewMaxWidth } from '../../../react/features/filmstrip';
import {
    updateKnownLargeVideoResolution
} from '../../../react/features/large-video/actions';
import { getParticipantsPaneOpen } from '../../../react/features/participants-pane/functions';
import { PresenceLabel } from '../../../react/features/presence-status';
import { shouldDisplayTileView } from '../../../react/features/video-layout';
/* eslint-enable no-unused-vars */
import { createDeferred } from '../../util/helpers';
import AudioLevels from '../audio_levels/AudioLevels';

import { VideoContainer, VIDEO_CONTAINER_TYPE } from './VideoContainer';

const logger = Logger.getLogger(__filename);

const DESKTOP_CONTAINER_TYPE = 'desktop';

/**
 * Manager for all Large containers.
 */
export default class LargeVideoManager {
    /**
     * Checks whether given container is a {@link VIDEO_CONTAINER_TYPE}.
     * FIXME currently this is a workaround for the problem where video type is
     * mixed up with container type.
     * @param {string} containerType
     * @return {boolean}
     */
    static isVideoContainer(containerType) {
        return containerType === VIDEO_CONTAINER_TYPE
            || containerType === DESKTOP_CONTAINER_TYPE;
    }

    /**
     *
     */
    constructor() {
        /**
         * The map of <tt>LargeContainer</tt>s where the key is the video
         * container type.
         * @type {Object.<string, LargeContainer>}
         */
        this.containers = {};

        this.state = VIDEO_CONTAINER_TYPE;

        // FIXME: We are passing resizeContainer as parameter which is calling
        // Container.resize. Probably there's better way to implement this.
        this.videoContainer = new VideoContainer(() => this.resizeContainer(VIDEO_CONTAINER_TYPE));
        this.addContainer(VIDEO_CONTAINER_TYPE, this.videoContainer);

        // use the same video container to handle desktop tracks
        this.addContainer(DESKTOP_CONTAINER_TYPE, this.videoContainer);

        /**
         * The preferred width passed as an argument to {@link updateContainerSize}.
         *
         * @type {number|undefined}
         */
        this.preferredWidth = undefined;

        /**
         * The preferred height passed as an argument to {@link updateContainerSize}.
         *
         * @type {number|undefined}
         */
        this.preferredHeight = undefined;

        /**
         * The calculated width that will be used for the large video.
         * @type {number}
         */
        this.width = 0;

        /**
         * The calculated height that will be used for the large video.
         * @type {number}
         */
        this.height = 0;

        /**
         * Cache the aspect ratio of the video displayed to detect changes to
         * the aspect ratio on video resize events.
         *
         * @type {number}
         */
        this._videoAspectRatio = 0;

        this.$container = $('#largeVideoContainer');

        this.$container.css({
            display: 'inline-block'
        });

        this.$container.hover(
            e => this.onHoverIn(e),
            e => this.onHoverOut(e)
        );

        // Bind event handler so it is only bound once for every instance.
        this._onVideoResolutionUpdate
            = this._onVideoResolutionUpdate.bind(this);

        this.videoContainer.addResizeListener(this._onVideoResolutionUpdate);

        this._dominantSpeakerAvatarContainer
            = document.getElementById('dominantSpeakerAvatarContainer');
    }

    /**
     * Removes any listeners registered on child components, including
     * React Components.
     *
     * @returns {void}
     */
    destroy() {
        this.videoContainer.removeResizeListener(
            this._onVideoResolutionUpdate);

        this.removePresenceLabel();

        ReactDOM.unmountComponentAtNode(this._dominantSpeakerAvatarContainer);

        this.$container.css({ display: 'none' });
    }

    /**
     *
     */
    onHoverIn(e) {
        if (!this.state) {
            return;
        }
        const container = this.getCurrentContainer();

        container.onHoverIn(e);
    }

    /**
     *
     */
    onHoverOut(e) {
        if (!this.state) {
            return;
        }
        const container = this.getCurrentContainer();

        container.onHoverOut(e);
    }

    /**
     *
     */
    get id() {
        const container = this.getCurrentContainer();

        // If a user switch for large video is in progress then provide what
        // will be the end result of the update.
        if (this.updateInProcess
            && this.newStreamData
            && this.newStreamData.id !== container.id) {
            return this.newStreamData.id;
        }

        return container.id;
    }

    /**
     *
     */
    scheduleLargeVideoUpdate() {
        if (this.updateInProcess || !this.newStreamData) {
            return;
        }

        this.updateInProcess = true;

        // Include hide()/fadeOut only if we're switching between users
        // eslint-disable-next-line eqeqeq
        const container = this.getCurrentContainer();
        const isUserSwitch = this.newStreamData.id !== container.id;
        const preUpdate = isUserSwitch ? container.hide() : Promise.resolve();

        preUpdate.then(() => {
            const { id, stream, videoType, resolve } = this.newStreamData;

            // FIXME this does not really make sense, because the videoType
            // (camera or desktop) is a completely different thing than
            // the video container type (Etherpad, SharedVideo, VideoContainer).
            const isVideoContainer = LargeVideoManager.isVideoContainer(videoType);

            this.newStreamData = null;

            logger.info(`hover in ${id}`);
            this.state = videoType;
            // eslint-disable-next-line no-shadow
            const container = this.getCurrentContainer();

            container.setStream(id, stream, videoType);

            // change the avatar url on large
            this.updateAvatar();

            const isVideoMuted = !stream || stream.isMuted();
            const state = APP.store.getState();
            const participant = getParticipantById(state, id);
            const connectionStatus = participant?.connectionStatus;

            let isVideoRenderable;

            if (getSourceNameSignalingFeatureFlag(state)) {
                const tracks = state['features/base/tracks'];
                const videoTrack = getVideoTrackByParticipant(tracks, participant);

                isVideoRenderable = !isVideoMuted && (
                    APP.conference.isLocalId(id)
                    || participant?.isLocalScreenShare
                    || isTrackStreamingStatusActive(videoTrack)
                );
            } else {
                isVideoRenderable = !isVideoMuted
                    && (APP.conference.isLocalId(id) || isParticipantConnectionStatusActive(participant));
            }

            const isAudioOnly = APP.conference.isAudioOnly();
            const showAvatar
                = isVideoContainer
                    && ((isAudioOnly && videoType !== VIDEO_TYPE.DESKTOP) || !isVideoRenderable);

            let promise;

            // do not show stream if video is muted
            // but we still should show watermark
            if (showAvatar) {
                this.showWatermark(true);

                // If the intention of this switch is to show the avatar
                // we need to make sure that the video is hidden
                promise = container.hide();

                if ((!shouldDisplayTileView(state) || participant?.pinned) // In theory the tile view may not be
                // enabled yet when we auto pin the participant.

                        && participant && !participant.local && !participant.isFakeParticipant) {
                    // remote participant only

                    const tracks = state['features/base/tracks'];
                    const track = getVideoTrackByParticipant(tracks, participant);

                    const isScreenSharing = track?.videoType === 'desktop';

                    if (isScreenSharing) {
                        // send the event
                        sendAnalytics(createScreenSharingIssueEvent({
                            source: 'large-video',
                            connectionStatus,
                            isVideoMuted,
                            isAudioOnly,
                            isVideoContainer,
                            videoType
                        }));
                    }
                }

            } else {
                promise = container.show();
            }

            // show the avatar on large if needed
            container.showAvatar(showAvatar);

            // Clean up audio level after previous speaker.
            if (showAvatar) {
                this.updateLargeVideoAudioLevel(0);
            }

            let messageKey;

            if (getSourceNameSignalingFeatureFlag(state)) {
                const tracks = state['features/base/tracks'];
                const videoTrack = getVideoTrackByParticipant(tracks, participant);

                messageKey = isTrackStreamingStatusInactive(videoTrack) ? 'connection.LOW_BANDWIDTH' : null;
            } else {
                messageKey = isParticipantConnectionStatusInactive(participant) ? 'connection.LOW_BANDWIDTH' : null;
            }

            // Do not show connection status message in the audio only mode,
            // because it's based on the video playback status.
            const overrideAndHide = APP.conference.isAudioOnly();

            this.updateParticipantConnStatusIndication(
                    id,
                    !overrideAndHide && messageKey);

            // Change the participant id the presence label is listening to.
            this.updatePresenceLabel(id);

            this.videoContainer.positionRemoteStatusMessages();

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
     * @param {string|null} messageKey the i18n key of the message which will be
     * displayed on the large video or <tt>null</tt> to hide it.
     *
     * @private
     */
    updateParticipantConnStatusIndication(id, messageKey) {
        const state = APP.store.getState();

        if (messageKey) {
            // Get user's display name
            const displayName
                = getParticipantDisplayName(state, id);

            this._setRemoteConnectionMessage(
                messageKey,
                { displayName });

            // Show it now only if the VideoContainer is on top
            this.showRemoteConnectionMessage(
                LargeVideoManager.isVideoContainer(this.state));
        } else {
            // Hide the message
            this.showRemoteConnectionMessage(false);
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
    updateLargeVideo(userID, stream, videoType) {
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
    updateContainerSize(width, height) {
        if (typeof width === 'number') {
            this.preferredWidth = width;
        }
        if (typeof height === 'number') {
            this.preferredHeight = height;
        }

        let widthToUse = this.preferredWidth || window.innerWidth;
        const state = APP.store.getState();
        const { isOpen } = state['features/chat'];
        const { width: filmstripWidth, visible } = state['features/filmstrip'];
        const isParticipantsPaneOpen = getParticipantsPaneOpen(state);
        const resizableFilmstrip = isFilmstripResizable(state);

        if (isParticipantsPaneOpen) {
            widthToUse -= theme.participantsPaneWidth;
        }

        if (isOpen && window.innerWidth > 580) {
            /**
             * If chat state is open, we re-compute the container width
             * by subtracting the default width of the chat.
             */
            widthToUse -= CHAT_SIZE;
        }

        if (resizableFilmstrip && visible && filmstripWidth.current >= FILMSTRIP_BREAKPOINT) {
            widthToUse -= getVerticalViewMaxWidth(state);
        }

        this.width = widthToUse;
        this.height = this.preferredHeight || window.innerHeight;
    }

    /**
     * Resize Large container of specified type.
     * @param {string} type type of container which should be resized.
     * @param {boolean} [animate=false] if resize process should be animated.
     */
    resizeContainer(type, animate = false) {
        const container = this.getContainer(type);

        container.resize(this.width, this.height, animate);
    }

    /**
     * Resize all Large containers.
     * @param {boolean} animate if resize process should be animated.
     */
    resize(animate) {
        // resize all containers
        Object.keys(this.containers)
            .forEach(type => this.resizeContainer(type, animate));
    }

    /**
     * Updates the src of the dominant speaker avatar
     */
    updateAvatar() {
        ReactDOM.render(
            <Provider store = { APP.store }>
                <Avatar
                    id = "dominantSpeakerAvatar"
                    participantId = { this.id }
                    size = { 200 } />
            </Provider>,
            this._dominantSpeakerAvatarContainer
        );
    }

    /**
     * Updates the audio level indicator of the large video.
     *
     * @param lvl the new audio level to set
     */
    updateLargeVideoAudioLevel(lvl) {
        AudioLevels.updateLargeVideoAudioLevel('dominantSpeaker', lvl);
    }

    /**
     * Displays a message of the passed in participant id's presence status. The
     * message will not display if the remote connection message is displayed.
     *
     * @param {string} id - The participant ID whose associated user's presence
     * status should be displayed.
     * @returns {void}
     */
    updatePresenceLabel(id) {
        const isConnectionMessageVisible
            = $('#remoteConnectionMessage').is(':visible');

        if (isConnectionMessageVisible) {
            this.removePresenceLabel();

            return;
        }

        const presenceLabelContainer = $('#remotePresenceMessage');

        if (presenceLabelContainer.length) {
            ReactDOM.render(
                <Provider store = { APP.store }>
                    <I18nextProvider i18n = { i18next }>
                        <PresenceLabel
                            participantID = { id }
                            className = 'presence-label' />
                    </I18nextProvider>
                </Provider>,
                presenceLabelContainer.get(0));
        }
    }

    /**
     * Removes the messages about the displayed participant's presence status.
     *
     * @returns {void}
     */
    removePresenceLabel() {
        const presenceLabelContainer = $('#remotePresenceMessage');

        if (presenceLabelContainer.length) {
            ReactDOM.unmountComponentAtNode(presenceLabelContainer.get(0));
        }
    }

    /**
     * Show or hide watermark.
     * @param {boolean} show
     */
    showWatermark(show) {
        $('.watermark').css('visibility', show ? 'visible' : 'hidden');
    }

    /**
     * Shows hides the "avatar" message which is to be displayed either in
     * the middle of the screen or below the avatar image.
     *
     * @param {boolean|undefined} [show=undefined] <tt>true</tt> to show
     * the avatar message or <tt>false</tt> to hide it. If not provided then
     * the connection status of the user currently on the large video will be
     * obtained form "APP.conference" and the message will be displayed if
     * the user's connection is either interrupted or inactive.
     */
    showRemoteConnectionMessage(show) {
        if (typeof show !== 'boolean') {
            const participant = getParticipantById(APP.store.getState(), this.id);
            const state = APP.store.getState();

            if (getSourceNameSignalingFeatureFlag(state)) {
                const tracks = state['features/base/tracks'];
                const videoTrack = getVideoTrackByParticipant(tracks, participant);

                // eslint-disable-next-line no-param-reassign
                show = !APP.conference.isLocalId(this.id)
                    && (isTrackStreamingStatusInterrupted(videoTrack)
                        || isTrackStreamingStatusInactive(videoTrack));
            } else {
                // eslint-disable-next-line no-param-reassign
                show = !APP.conference.isLocalId(this.id)
                    && (isParticipantConnectionStatusInterrupted(participant)
                        || isParticipantConnectionStatusInactive(participant));
            }
        }

        if (show) {
            $('#remoteConnectionMessage').css({ display: 'block' });
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
    _setRemoteConnectionMessage(msgKey, msgOptions) {
        if (msgKey) {
            $('#remoteConnectionMessage')
                .attr('data-i18n', msgKey)
                .attr('data-i18n-options', JSON.stringify(msgOptions));
            APP.translation.translateElement(
                $('#remoteConnectionMessage'), msgOptions);
        }
    }

    /**
     * Add container of specified type.
     * @param {string} type container type
     * @param {LargeContainer} container container to add.
     */
    addContainer(type, container) {
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
    getContainer(type) {
        const container = this.containers[type];

        if (!container) {
            throw new Error(`container of type ${type} doesn't exist`);
        }

        return container;
    }

    /**
     * Returns {@link LargeContainer} for the current {@link state}
     *
     * @return {LargeContainer}
     *
     * @throws an <tt>Error</tt> if there is no container for the current
     * {@link state}.
     */
    getCurrentContainer() {
        return this.getContainer(this.state);
    }

    /**
     * Returns type of the current {@link LargeContainer}
     * @return {string}
     */
    getCurrentContainerType() {
        return this.state;
    }

    /**
     * Remove Large container of specified type.
     * @param {string} type container type.
     */
    removeContainer(type) {
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
    showContainer(type) {
        if (this.state === type) {
            return Promise.resolve();
        }

        const oldContainer = this.containers[this.state];

        // FIXME when video is being replaced with other content we need to hide
        // companion icons/messages. It would be best if the container would
        // be taking care of it by itself, but that is a bigger refactoring

        if (LargeVideoManager.isVideoContainer(this.state)) {
            this.showWatermark(false);
            this.showRemoteConnectionMessage(false);
        }
        oldContainer.hide();

        this.state = type;
        const container = this.getContainer(type);

        return container.show().then(() => {
            if (LargeVideoManager.isVideoContainer(type)) {
                // FIXME when video appears on top of other content we need to
                // show companion icons/messages. It would be best if
                // the container would be taking care of it by itself, but that
                // is a bigger refactoring
                this.showWatermark(true);

                // "avatar" and "video connection" can not be displayed both
                // at the same time, but the latter is of higher priority and it
                // will hide the avatar one if will be displayed.
                this.showRemoteConnectionMessage(/* fetch the current state */);
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

    /**
     * Dispatches an action to update the known resolution state of the large video and adjusts container sizes when the
     * resolution changes.
     *
     * @private
     * @returns {void}
     */
    _onVideoResolutionUpdate() {
        const { height, width } = this.videoContainer.getStreamSize();
        const { resolution } = APP.store.getState()['features/large-video'];

        if (height !== resolution) {
            APP.store.dispatch(updateKnownLargeVideoResolution(height));
        }

        const currentAspectRatio = height === 0 ? 0 : width / height;

        if (this._videoAspectRatio !== currentAspectRatio) {
            this._videoAspectRatio = currentAspectRatio;
            this.resize();
        }
    }
}
