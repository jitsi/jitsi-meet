/* global $, config, APP */

/* eslint-disable no-unused-vars */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import { i18next } from '../../../react/features/base/i18n';
import { JitsiTrackEvents } from '../../../react/features/base/lib-jitsi-meet';
import { VideoTrack } from '../../../react/features/base/media';
import { updateSettings } from '../../../react/features/base/settings';
import { getLocalVideoTrack } from '../../../react/features/base/tracks';
import Thumbnail from '../../../react/features/filmstrip/components/web/Thumbnail';
import { shouldDisplayTileView } from '../../../react/features/video-layout';
/* eslint-enable no-unused-vars */
import UIEvents from '../../../service/UI/UIEvents';

import SmallVideo from './SmallVideo';

/**
 *
 */
export default class LocalVideo extends SmallVideo {
    /**
     *
     * @param {*} emitter
     * @param {*} streamEndedCallback
     */
    constructor(emitter, streamEndedCallback) {
        super();
        this.videoSpanId = 'localVideoContainer';
        this.streamEndedCallback = streamEndedCallback;
        this.container = this.createContainer();
        this.$container = $(this.container);
        this.isLocal = true;
        this._setThumbnailSize();
        this.updateDOMLocation();
        this.renderThumbnail();

        this.localVideoId = null;
        this.bindHoverHandler();
        if (!config.disableLocalVideoFlip) {
            this._buildContextMenu();
        }
        this.emitter = emitter;

        Object.defineProperty(this, 'id', {
            get() {
                return APP.conference.getMyUserId();
            }
        });
        this.initBrowserSpecificProperties();

        this.container.onclick = this._onContainerClick;
    }

    /**
     *
     */
    createContainer() {
        const containerSpan = document.createElement('span');

        containerSpan.classList.add('videocontainer');
        containerSpan.id = this.videoSpanId;

        return containerSpan;
    }

    /**
     * Renders the thumbnail.
     */
    renderThumbnail(isHovered = false) {
        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <Thumbnail participantID = { this.id } isHovered = { isHovered } />
                </I18nextProvider>
            </Provider>, this.container);
    }

    /**
     *
     * @param {*} stream
     */
    changeVideo(stream) {
        this.localVideoId = `localVideo_${stream.getId()}`;

        // eslint-disable-next-line eqeqeq
        const isVideo = stream.videoType != 'desktop';
        const settings = APP.store.getState()['features/base/settings'];

        this._enableDisableContextMenu(isVideo);
        this.setFlipX(isVideo ? settings.localFlipX : false);

        const endedHandler = () => {
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
    }
}
