/* global $, config, interfaceConfig, APP */

import Logger from 'jitsi-meet-logger';
/* eslint-disable no-unused-vars */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { JitsiTrackEvents } from '../../../react/features/base/lib-jitsi-meet';
import { VideoTrack } from '../../../react/features/base/media';
import { updateSettings } from '../../../react/features/base/settings';
import { getLocalVideoTrack } from '../../../react/features/base/tracks';
import { shouldDisplayTileView } from '../../../react/features/video-layout';
/* eslint-enable no-unused-vars */
import UIEvents from '../../../service/UI/UIEvents';

import SmallVideo from './SmallVideo';

const logger = Logger.getLogger(__filename);

/**
 *
 */
export default class LocalVideo extends SmallVideo {
    /**
     *
     * @param {*} VideoLayout
     * @param {*} emitter
     * @param {*} streamEndedCallback
     */
    constructor(VideoLayout, emitter, streamEndedCallback) {
        super(VideoLayout);
        this.videoSpanId = 'localVideoContainer';
        this.streamEndedCallback = streamEndedCallback;
        this.container = this.createContainer();
        this.$container = $(this.container);
        this.isLocal = true;
        this._setThumbnailSize();
        this.updateDOMLocation();

        this.localVideoId = null;
        this.bindHoverHandler();
        if (!config.disableLocalVideoFlip) {
            this._buildContextMenu();
        }
        this.emitter = emitter;
        this.statsPopoverLocation = interfaceConfig.VERTICAL_FILMSTRIP ? 'left top' : 'top center';

        Object.defineProperty(this, 'id', {
            get() {
                return APP.conference.getMyUserId();
            }
        });
        this.initBrowserSpecificProperties();

        // Set default display name.
        this.updateDisplayName();

        // Initialize the avatar display with an avatar url selected from the redux
        // state. Redux stores the local user with a hardcoded participant id of
        // 'local' if no id has been assigned yet.
        this.initializeAvatar();

        this.addAudioLevelIndicator();
        this.updateIndicators();

        this.container.onclick = this._onContainerClick;
    }

    /**
     *
     */
    createContainer() {
        const containerSpan = document.createElement('span');

        containerSpan.classList.add('videocontainer');
        containerSpan.id = this.videoSpanId;

        containerSpan.innerHTML = `
            <div class = 'videocontainer__background'></div>
            <span id = 'localVideoWrapper'></span>
            <div class = 'videocontainer__toolbar'></div>
            <div class = 'videocontainer__toptoolbar'></div>
            <div class = 'videocontainer__hoverOverlay'></div>
            <div class = 'displayNameContainer'></div>
            <div class = 'avatar-container'></div>`;

        return containerSpan;
    }

    /**
     * Triggers re-rendering of the display name using current instance state.
     *
     * @returns {void}
     */
    updateDisplayName() {
        if (!this.container) {
            logger.warn(
                    `Unable to set displayName - ${this.videoSpanId
                    } does not exist`);

            return;
        }

        this._renderDisplayName({
            allowEditing: APP.store.getState()['features/base/jwt'].isGuest,
            displayNameSuffix: interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME,
            elementID: 'localDisplayName',
            participantID: this.id
        });
    }

    /**
     *
     * @param {*} stream
     */
    changeVideo(stream) {
        this.videoStream = stream;
        this.localVideoId = `localVideo_${stream.getId()}`;
        this._updateVideoElement();

        // eslint-disable-next-line eqeqeq
        const isVideo = stream.videoType != 'desktop';
        const settings = APP.store.getState()['features/base/settings'];

        this._enableDisableContextMenu(isVideo);
        this.setFlipX(isVideo ? settings.localFlipX : false);

        const endedHandler = () => {
            const localVideoContainer
                = document.getElementById('localVideoWrapper');

            // Only remove if there is no video and not a transition state.
            // Previous non-react logic created a new video element with each track
            // removal whereas react reuses the video component so it could be the
            // stream ended but a new one is being used.
            if (localVideoContainer && this.videoStream.isEnded()) {
                ReactDOM.unmountComponentAtNode(localVideoContainer);
            }

            this._notifyOfStreamEnded();
            stream.off(JitsiTrackEvents.LOCAL_TRACK_STOPPED, endedHandler);
        };

        stream.on(JitsiTrackEvents.LOCAL_TRACK_STOPPED, endedHandler);
    }

    /**
     * Notify any subscribers of the local video stream ending.
     *
     * @private
     * @returns {void}
     */
    _notifyOfStreamEnded() {
        if (this.streamEndedCallback) {
            this.streamEndedCallback(this.id);
        }
    }

    /**
     * Shows or hides the local video container.
     * @param {boolean} true to make the local video container visible, false
     * otherwise
     */
    setVisible(visible) {
        // We toggle the hidden class as an indication to other interested parties
        // that this container has been hidden on purpose.
        this.$container.toggleClass('hidden');

        // We still show/hide it as we need to overwrite the style property if we
        // want our action to take effect. Toggling the display property through
        // the above css class didn't succeed in overwriting the style.
        if (visible) {
            this.$container.show();
        } else {
            this.$container.hide();
        }
    }

    /**
     * Sets the flipX state of the video.
     * @param val {boolean} true for flipped otherwise false;
     */
    setFlipX(val) {
        this.emitter.emit(UIEvents.LOCAL_FLIPX_CHANGED, val);
        if (!this.localVideoId) {
            return;
        }
        if (val) {
            this.selectVideoElement().addClass('flipVideoX');
        } else {
            this.selectVideoElement().removeClass('flipVideoX');
        }
    }

    /**
     * Builds the context menu for the local video.
     */
    _buildContextMenu() {
        $.contextMenu({
            selector: `#${this.videoSpanId}`,
            zIndex: 10000,
            items: {
                flip: {
                    name: 'Flip',
                    callback: () => {
                        const { store } = APP;
                        const val = !store.getState()['features/base/settings']
                        .localFlipX;

                        this.setFlipX(val);
                        store.dispatch(updateSettings({
                            localFlipX: val
                        }));
                    }
                }
            },
            events: {
                show(options) {
                    options.items.flip.name
                        = APP.translation.generateTranslationHTML(
                            'videothumbnail.flip');
                }
            }
        });
    }

    /**
     * Enables or disables the context menu for the local video.
     * @param enable {boolean} true for enable, false for disable
     */
    _enableDisableContextMenu(enable) {
        if (this.$container.contextMenu) {
            this.$container.contextMenu(enable);
        }
    }

    /**
     * Places the {@code LocalVideo} in the DOM based on the current video layout.
     *
     * @returns {void}
     */
    updateDOMLocation() {
        if (!this.container) {
            return;
        }
        if (this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }

        const appendTarget = shouldDisplayTileView(APP.store.getState())
            ? document.getElementById('localVideoTileViewContainer')
            : document.getElementById('filmstripLocalVideoThumbnail');

        appendTarget && appendTarget.appendChild(this.container);
        this._updateVideoElement();
    }

    /**
     * Renders the React Element for displaying video in {@code LocalVideo}.
     *
     */
    _updateVideoElement() {
        const localVideoContainer = document.getElementById('localVideoWrapper');
        const videoTrack
            = getLocalVideoTrack(APP.store.getState()['features/base/tracks']);

        ReactDOM.render(
            <Provider store = { APP.store }>
                <VideoTrack
                    id = 'localVideo_container'
                    videoTrack = { videoTrack } />
            </Provider>,
            localVideoContainer
        );

        // Ensure the video gets play() called on it. This may be necessary in the
        // case where the local video container was moved and re-attached, in which
        // case video does not autoplay.
        const video = this.container.querySelector('video');

        video && !config.testing?.noAutoPlayVideo && video.play();
    }
}
