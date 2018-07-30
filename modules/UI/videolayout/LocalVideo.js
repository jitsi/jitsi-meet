/* global $, config, interfaceConfig, APP */

/* eslint-disable no-unused-vars */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { JitsiTrackEvents } from '../../../react/features/base/lib-jitsi-meet';
import { VideoTrack } from '../../../react/features/base/media';
import {
    getAvatarURLByParticipantId
} from '../../../react/features/base/participants';
import { updateSettings } from '../../../react/features/base/settings';
import { shouldDisplayTileView } from '../../../react/features/video-layout';
/* eslint-enable no-unused-vars */

const logger = require('jitsi-meet-logger').getLogger(__filename);

import UIEvents from '../../../service/UI/UIEvents';
import SmallVideo from './SmallVideo';

/**
 *
 */
function LocalVideo(VideoLayout, emitter, streamEndedCallback) {
    this.videoSpanId = 'localVideoContainer';
    this.streamEndedCallback = streamEndedCallback;
    this.container = this.createContainer();
    this.$container = $(this.container);
    this.updateDOMLocation();

    this.localVideoId = null;
    this.bindHoverHandler();
    if (config.enableLocalVideoFlip) {
        this._buildContextMenu();
    }
    this.isLocal = true;
    this.emitter = emitter;
    this.statsPopoverLocation = interfaceConfig.VERTICAL_FILMSTRIP
        ? 'left top' : 'top center';

    Object.defineProperty(this, 'id', {
        get() {
            return APP.conference.getMyUserId();
        }
    });
    this.initBrowserSpecificProperties();

    SmallVideo.call(this, VideoLayout);

    // Set default display name.
    this.setDisplayName();

    // Initialize the avatar display with an avatar url selected from the redux
    // state. Redux stores the local user with a hardcoded participant id of
    // 'local' if no id has been assigned yet.
    this.avatarChanged(
        getAvatarURLByParticipantId(APP.store.getState(), this.id));

    this.addAudioLevelIndicator();
    this.updateIndicators();

    this.container.onclick = this._onContainerClick.bind(this);
}

LocalVideo.prototype = Object.create(SmallVideo.prototype);
LocalVideo.prototype.constructor = LocalVideo;

LocalVideo.prototype.createContainer = function() {
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
};

/**
 * Sets the display name for the given video span id.
 */
LocalVideo.prototype.setDisplayName = function(displayName) {
    if (!this.container) {
        logger.warn(
                `Unable to set displayName - ${this.videoSpanId
                } does not exist`);

        return;
    }

    this.updateDisplayName({
        allowEditing: APP.store.getState()['features/base/jwt'].isGuest,
        displayName,
        displayNameSuffix: interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME,
        elementID: 'localDisplayName',
        participantID: this.id
    });
};

LocalVideo.prototype.changeVideo = function(stream) {
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
};

/**
 * Notify any subscribers of the local video stream ending.
 *
 * @private
 * @returns {void}
 */
LocalVideo.prototype._notifyOfStreamEnded = function() {
    if (this.streamEndedCallback) {
        this.streamEndedCallback(this.id);
    }
};

/**
 * Shows or hides the local video container.
 * @param {boolean} true to make the local video container visible, false
 * otherwise
 */
LocalVideo.prototype.setVisible = function(visible) {

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
};

/**
 * Sets the flipX state of the video.
 * @param val {boolean} true for flipped otherwise false;
 */
LocalVideo.prototype.setFlipX = function(val) {
    this.emitter.emit(UIEvents.LOCAL_FLIPX_CHANGED, val);
    if (!this.localVideoId) {
        return;
    }
    if (val) {
        this.selectVideoElement().addClass('flipVideoX');
    } else {
        this.selectVideoElement().removeClass('flipVideoX');
    }
};

/**
 * Builds the context menu for the local video.
 */
LocalVideo.prototype._buildContextMenu = function() {
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
};

/**
 * Enables or disables the context menu for the local video.
 * @param enable {boolean} true for enable, false for disable
 */
LocalVideo.prototype._enableDisableContextMenu = function(enable) {
    if (this.$container.contextMenu) {
        this.$container.contextMenu(enable);
    }
};

/**
 * Places the {@code LocalVideo} in the DOM based on the current video layout.
 *
 * @returns {void}
 */
LocalVideo.prototype.updateDOMLocation = function() {
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
};

/**
 * Callback invoked when the thumbnail is clicked. Will directly call
 * VideoLayout to handle thumbnail click if certain elements have not been
 * clicked.
 *
 * @param {MouseEvent} event - The click event to intercept.
 * @private
 * @returns {void}
 */
LocalVideo.prototype._onContainerClick = function(event) {
    // TODO Checking the classes is a workround to allow events to bubble into
    // the DisplayName component if it was clicked. React's synthetic events
    // will fire after jQuery handlers execute, so stop propogation at this
    // point will prevent DisplayName from getting click events. This workaround
    // should be removeable once LocalVideo is a React Component because then
    // the components share the same eventing system.
    const $source = $(event.target || event.srcElement);
    const { classList } = event.target;

    const clickedOnDisplayName
        = $source.parents('.displayNameContainer').length > 0;
    const clickedOnPopover = $source.parents('.popover').length > 0
            || classList.contains('popover');
    const ignoreClick = clickedOnDisplayName
        || clickedOnPopover
        || shouldDisplayTileView(APP.store.getState());

    if (event.stopPropagation && !ignoreClick) {
        event.stopPropagation();
    }

    if (!ignoreClick) {
        this._togglePin();
    }
};

/**
 * Renders the React Element for displaying video in {@code LocalVideo}.
 *
 */
LocalVideo.prototype._updateVideoElement = function() {
    const localVideoContainer = document.getElementById('localVideoWrapper');

    ReactDOM.render(
        <Provider store = { APP.store }>
            <VideoTrack
                id = 'localVideo_container'
                videoTrack = {{ jitsiTrack: this.videoStream }} />
        </Provider>,
        localVideoContainer
    );

    // Ensure the video gets play() called on it. This may be necessary in the
    // case where the local video container was moved and re-attached, in which
    // case video does not autoplay.
    const video = this.container.querySelector('video');

    video && video.play();
};

export default LocalVideo;
