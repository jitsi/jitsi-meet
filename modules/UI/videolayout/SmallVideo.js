/* global $, APP, interfaceConfig */

/* eslint-disable no-unused-vars */
import { AtlasKitThemeProvider } from '@atlaskit/theme';
import Logger from 'jitsi-meet-logger';
import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import { createScreenSharingIssueEvent, sendAnalytics } from '../../../react/features/analytics';
import { AudioLevelIndicator } from '../../../react/features/audio-level-indicator';
import { Avatar as AvatarDisplay } from '../../../react/features/base/avatar';
import { i18next } from '../../../react/features/base/i18n';
import { MEDIA_TYPE } from '../../../react/features/base/media';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantCount,
    getPinnedParticipant,
    pinParticipant
} from '../../../react/features/base/participants';
import {
    getLocalVideoTrack,
    getTrackByMediaTypeAndParticipant,
    isLocalTrackMuted,
    isRemoteTrackMuted
} from '../../../react/features/base/tracks';
import { ConnectionIndicator } from '../../../react/features/connection-indicator';
import { DisplayName } from '../../../react/features/display-name';
import {
    DominantSpeakerIndicator,
    RaisedHandIndicator,
    StatusIndicators,
    isVideoPlayable
} from '../../../react/features/filmstrip';
import {
    LAYOUTS,
    getCurrentLayout,
    setTileView,
    shouldDisplayTileView
} from '../../../react/features/video-layout';
/* eslint-enable no-unused-vars */

const logger = Logger.getLogger(__filename);

/**
 * Display mode constant used when video is being displayed on the small video.
 * @type {number}
 * @constant
 */
const DISPLAY_VIDEO = 0;

/**
 * Display mode constant used when the user's avatar is being displayed on
 * the small video.
 * @type {number}
 * @constant
 */
const DISPLAY_AVATAR = 1;

/**
 * Display mode constant used when neither video nor avatar is being displayed
 * on the small video. And we just show the display name.
 * @type {number}
 * @constant
 */
const DISPLAY_BLACKNESS_WITH_NAME = 2;

/**
 * Display mode constant used when video is displayed and display name
 * at the same time.
 * @type {number}
 * @constant
 */
const DISPLAY_VIDEO_WITH_NAME = 3;

/**
 * Display mode constant used when neither video nor avatar is being displayed
 * on the small video. And we just show the display name.
 * @type {number}
 * @constant
 */
const DISPLAY_AVATAR_WITH_NAME = 4;


/**
 *
 */
export default class SmallVideo {
    /**
     * Constructor.
     */
    constructor() {
        this.videoIsHovered = false;
        this.videoType = undefined;

        // Bind event handlers so they are only bound once for every instance.
        this.updateView = this.updateView.bind(this);

        this._onContainerClick = this._onContainerClick.bind(this);
    }

    /**
     * Returns the identifier of this small video.
     *
     * @returns the identifier of this small video
     */
    getId() {
        return this.id;
    }

    /**
     * Indicates if this small video is currently visible.
     *
     * @return <tt>true</tt> if this small video isn't currently visible and
     * <tt>false</tt> - otherwise.
     */
    isVisible() {
        return this.$container.is(':visible');
    }

    /**
     * Configures hoverIn/hoverOut handlers. Depends on connection indicator.
     */
    bindHoverHandler() {
        // Add hover handler
        this.$container.hover(
            () => {
                this.videoIsHovered = true;
                this.renderThumbnail(true);
                this.updateView();
            },
            () => {
                this.videoIsHovered = false;
                this.renderThumbnail(false);
                this.updateView();
            }
        );
    }

    /**
     * Renders the thumbnail.
     */
    renderThumbnail() {
        // Should be implemented by in subclasses.
    }

    /**
     * This is an especially interesting function. A naive reader might think that
     * it returns this SmallVideo's "video" element. But it is much more exciting.
     * It first finds this video's parent element using jquery, then uses a utility
     * from lib-jitsi-meet to extract the video element from it (with two more
     * jquery calls), and finally uses jquery again to encapsulate the video element
     * in an array. This last step allows (some might prefer "forces") users of
     * this function to access the video element via the 0th element of the returned
     * array (after checking its length of course!).
     */
    selectVideoElement() {
        return $($(this.container).find('video')[0]);
    }

    /**
     * Enables / disables the css responsible for focusing/pinning a video
     * thumbnail.
     *
     * @param isFocused indicates if the thumbnail should be focused/pinned or not
     */
    focus(isFocused) {
        const focusedCssClass = 'videoContainerFocused';
        const isFocusClassEnabled = this.$container.hasClass(focusedCssClass);

        if (!isFocused && isFocusClassEnabled) {
            this.$container.removeClass(focusedCssClass);
        } else if (isFocused && !isFocusClassEnabled) {
            this.$container.addClass(focusedCssClass);
        }
    }

    /**
     *
     */
    hasVideo() {
        return this.selectVideoElement().length !== 0;
    }

    /**
     * Checks whether the user associated with this <tt>SmallVideo</tt> is currently
     * being displayed on the "large video".
     *
     * @return {boolean} <tt>true</tt> if the user is displayed on the large video
     * or <tt>false</tt> otherwise.
     */
    isCurrentlyOnLargeVideo() {
        return APP.store.getState()['features/large-video']?.participantId === this.id;
    }

    /**
     * Checks whether there is a playable video stream available for the user
     * associated with this <tt>SmallVideo</tt>.
     *
     * @return {boolean} <tt>true</tt> if there is a playable video stream available
     * or <tt>false</tt> otherwise.
     */
    isVideoPlayable() {
        return isVideoPlayable(APP.store.getState(), this.id);
    }

    /**
     * Determines what should be display on the thumbnail.
     *
     * @return {number} one of <tt>DISPLAY_VIDEO</tt>,<tt>DISPLAY_AVATAR</tt>
     * or <tt>DISPLAY_BLACKNESS_WITH_NAME</tt>.
     */
    selectDisplayMode(input) {
        if (!input.tileViewActive && input.isScreenSharing) {
            return input.isHovered ? DISPLAY_AVATAR_WITH_NAME : DISPLAY_AVATAR;
        } else if (input.isCurrentlyOnLargeVideo && !input.tileViewActive) {
            // Display name is always and only displayed when user is on the stage
            return input.isVideoPlayable && !input.isAudioOnly ? DISPLAY_BLACKNESS_WITH_NAME : DISPLAY_AVATAR_WITH_NAME;
        } else if (input.isVideoPlayable && input.hasVideo && !input.isAudioOnly) {
            // check hovering and change state to video with name
            return input.isHovered ? DISPLAY_VIDEO_WITH_NAME : DISPLAY_VIDEO;
        }

        // check hovering and change state to avatar with name
        return input.isHovered ? DISPLAY_AVATAR_WITH_NAME : DISPLAY_AVATAR;
    }

    /**
     * Computes information that determine the display mode.
     *
     * @returns {Object}
     */
    computeDisplayModeInput() {
        let isScreenSharing = false;
        let connectionStatus;
        const state = APP.store.getState();
        const id = this.id;
        const participant = getParticipantById(state, id);
        const isLocal = participant?.local ?? true;
        const tracks = state['features/base/tracks'];
        const videoTrack
            = isLocal ? getLocalVideoTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, id);

        if (typeof participant !== 'undefined' && !participant.isFakeParticipant && !participant.local) {
            isScreenSharing = videoTrack?.videoType === 'desktop';
            connectionStatus = participant.connectionStatus;
        }

        return {
            isCurrentlyOnLargeVideo: this.isCurrentlyOnLargeVideo(),
            isHovered: this._isHovered(),
            isAudioOnly: APP.conference.isAudioOnly(),
            tileViewActive: shouldDisplayTileView(state),
            isVideoPlayable: this.isVideoPlayable(),
            hasVideo: Boolean(this.selectVideoElement().length),
            connectionStatus,
            canPlayEventReceived: this._canPlayEventReceived,
            videoStream: Boolean(videoTrack),
            isScreenSharing,
            videoStreamMuted: videoTrack ? videoTrack.muted : 'no stream'
        };
    }

    /**
     * Checks whether current video is considered hovered. Currently it is hovered
     * if the mouse is over the video, or if the connection
     * indicator is shown(hovered).
     * @private
     */
    _isHovered() {
        return this.videoIsHovered;
    }

    /**
     * Updates the css classes of the thumbnail based on the current state.
     */
    updateView() {
        this.$container.removeClass((index, classNames) =>
            classNames.split(' ').filter(name => name.startsWith('display-')));

        const oldDisplayMode = this.displayMode;
        let displayModeString = '';

        const displayModeInput = this.computeDisplayModeInput();

        // Determine whether video, avatar or blackness should be displayed
        this.displayMode = this.selectDisplayMode(displayModeInput);

        switch (this.displayMode) {
        case DISPLAY_AVATAR_WITH_NAME:
            displayModeString = 'avatar-with-name';
            this.$container.addClass('display-avatar-with-name');
            break;
        case DISPLAY_BLACKNESS_WITH_NAME:
            displayModeString = 'blackness-with-name';
            this.$container.addClass('display-name-on-black');
            break;
        case DISPLAY_VIDEO:
            displayModeString = 'video';
            this.$container.addClass('display-video');
            break;
        case DISPLAY_VIDEO_WITH_NAME:
            displayModeString = 'video-with-name';
            this.$container.addClass('display-name-on-video');
            break;
        case DISPLAY_AVATAR:
        default:
            displayModeString = 'avatar';
            this.$container.addClass('display-avatar-only');
            break;
        }

        if (this.displayMode !== oldDisplayMode) {
            logger.debug(`Displaying ${displayModeString} for ${this.id}, data: [${JSON.stringify(displayModeInput)}]`);
        }

        if (this.displayMode !== DISPLAY_VIDEO
            && this.displayMode !== DISPLAY_VIDEO_WITH_NAME
            && displayModeInput.tileViewActive
            && displayModeInput.isScreenSharing
            && !displayModeInput.isAudioOnly) {
            // send the event
            sendAnalytics(createScreenSharingIssueEvent({
                source: 'thumbnail',
                ...displayModeInput
            }));
        }
    }

    /**
     * Shows or hides the dominant speaker indicator.
     * @param show whether to show or hide.
     */
    showDominantSpeakerIndicator(show) {
        // Don't create and show dominant speaker indicator if
        // DISABLE_DOMINANT_SPEAKER_INDICATOR is true
        if (interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR) {
            return;
        }

        if (!this.container) {
            logger.warn(`Unable to set dominant speaker indicator - ${this.videoSpanId} does not exist`);

            return;
        }

        this.$container.toggleClass('active-speaker', show);
    }

    /**
     * Initalizes any browser specific properties. Currently sets the overflow
     * property for Qt browsers on Windows to hidden, thus fixing the following
     * problem:
     * Some browsers don't have full support of the object-fit property for the
     * video element and when we set video object-fit to "cover" the video
     * actually overflows the boundaries of its container, so it's important
     * to indicate that the "overflow" should be hidden.
     *
     * Setting this property for all browsers will result in broken audio levels,
     * which makes this a temporary solution, before reworking audio levels.
     */
    initBrowserSpecificProperties() {
        const userAgent = window.navigator.userAgent;

        if (userAgent.indexOf('QtWebEngine') > -1
                && (userAgent.indexOf('Windows') > -1 || userAgent.indexOf('Linux') > -1)) {
            this.$container.css('overflow', 'hidden');
        }
    }

    /**
     * Cleans up components on {@code SmallVideo} and removes itself from the DOM.
     *
     * @returns {void}
     */
    remove() {
        logger.log('Remove thumbnail', this.id);
        this._unmountThumbnail();

        // Remove whole container
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }

    /**
     * Helper function for re-rendering multiple react components of the small
     * video.
     *
     * @returns {void}
     */
    rerender() {
        this.updateView();
    }

    /**
     * Callback invoked when the thumbnail is clicked and potentially trigger
     * pinning of the participant.
     *
     * @param {MouseEvent} event - The click event to intercept.
     * @private
     * @returns {void}
     */
    _onContainerClick(event) {
        const triggerPin = this._shouldTriggerPin(event);

        if (event.stopPropagation && triggerPin) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (triggerPin) {
            this.togglePin();
        }

        return false;
    }

    /**
     * Returns whether or not a click event is targeted at certain elements which
     * should not trigger a pin.
     *
     * @param {MouseEvent} event - The click event to intercept.
     * @private
     * @returns {boolean}
     */
    _shouldTriggerPin(event) {
        // TODO Checking the classes is a workround to allow events to bubble into
        // the DisplayName component if it was clicked. React's synthetic events
        // will fire after jQuery handlers execute, so stop propogation at this
        // point will prevent DisplayName from getting click events. This workaround
        // should be removeable once LocalVideo is a React Component because then
        // the components share the same eventing system.
        const $source = $(event.target || event.srcElement);

        return $source.parents('.displayNameContainer').length === 0
            && $source.parents('.popover').length === 0
            && !event.target.classList.contains('popover');
    }

    /**
     * Pins the participant displayed by this thumbnail or unpins if already pinned.
     *
     * @returns {void}
     */
    togglePin() {
        const pinnedParticipant = getPinnedParticipant(APP.store.getState()) || {};
        const participantIdToPin = pinnedParticipant && pinnedParticipant.id === this.id ? null : this.id;

        APP.store.dispatch(pinParticipant(participantIdToPin));
    }

    /**
     * Unmounts the thumbnail.
     */
    _unmountThumbnail() {
        ReactDOM.unmountComponentAtNode(this.container);
    }

    /**
     * Sets the size of the thumbnail.
     */
    _setThumbnailSize() {
        const layout = getCurrentLayout(APP.store.getState());
        const heightToWidthPercent = 100
                / (this.isLocal ? interfaceConfig.LOCAL_THUMBNAIL_RATIO : interfaceConfig.REMOTE_THUMBNAIL_RATIO);

        switch (layout) {
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW: {
            this.$container.css('padding-top', `${heightToWidthPercent}%`);
            break;
        }
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
            const state = APP.store.getState();
            const { local, remote } = state['features/filmstrip'].horizontalViewDimensions;
            const size = this.isLocal ? local : remote;

            if (typeof size !== 'undefined') {
                const { height, width } = size;

                this.$container.css({
                    height: `${height}px`,
                    'min-height': `${height}px`,
                    'min-width': `${width}px`,
                    width: `${width}px`
                });
            }
            break;
        }
        case LAYOUTS.TILE_VIEW: {
            const state = APP.store.getState();
            const { thumbnailSize } = state['features/filmstrip'].tileViewDimensions;

            if (typeof thumbnailSize !== 'undefined') {
                const { height, width } = thumbnailSize;

                this.$container.css({
                    height: `${height}px`,
                    'min-height': `${height}px`,
                    'min-width': `${width}px`,
                    width: `${width}px`
                });
            }
            break;
        }
        }
    }
}
