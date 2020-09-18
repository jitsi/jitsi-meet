/* global $, APP, config, interfaceConfig */

/* eslint-disable no-unused-vars */
import { AtlasKitThemeProvider } from '@atlaskit/theme';
import Logger from 'jitsi-meet-logger';
import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import { AudioLevelIndicator } from '../../../react/features/audio-level-indicator';
import { Avatar as AvatarDisplay } from '../../../react/features/base/avatar';
import { i18next } from '../../../react/features/base/i18n';
import {
    getParticipantCount,
    getPinnedParticipant,
    pinParticipant
} from '../../../react/features/base/participants';
import { ConnectionIndicator } from '../../../react/features/connection-indicator';
import { DisplayName } from '../../../react/features/display-name';
import {
    DominantSpeakerIndicator,
    RaisedHandIndicator,
    StatusIndicators
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
    constructor(VideoLayout) {
        this.isAudioMuted = false;
        this.isVideoMuted = false;
        this.isScreenSharing = false;
        this.videoStream = null;
        this.audioStream = null;
        this.VideoLayout = VideoLayout;
        this.videoIsHovered = false;
        this.videoType = undefined;

        /**
         * The current state of the user's bridge connection. The value should be
         * a string as enumerated in the library's participantConnectionStatus
         * constants.
         *
         * @private
         * @type {string|null}
         */
        this._connectionStatus = null;

        /**
         * Whether or not the ConnectionIndicator's popover is hovered. Modifies
         * how the video overlays display based on hover state.
         *
         * @private
         * @type {boolean}
         */
        this._popoverIsHovered = false;

        /**
         * Whether or not the connection indicator should be displayed.
         *
         * @private
         * @type {boolean}
         */
        this._showConnectionIndicator = !interfaceConfig.CONNECTION_INDICATOR_DISABLED;

        /**
         * Whether or not the dominant speaker indicator should be displayed.
         *
         * @private
         * @type {boolean}
         */
        this._showDominantSpeaker = false;

        /**
         * Whether or not the raised hand indicator should be displayed.
         *
         * @private
         * @type {boolean}
         */
        this._showRaisedHand = false;

        // Bind event handlers so they are only bound once for every instance.
        this._onPopoverHover = this._onPopoverHover.bind(this);
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
     * Creates an audio or video element for a particular MediaStream.
     */
    static createStreamElement(stream) {
        const isVideo = stream.isVideoTrack();
        const element = isVideo ? document.createElement('video') : document.createElement('audio');

        if (isVideo) {
            element.setAttribute('muted', 'true');
            element.setAttribute('playsInline', 'true'); /* for Safari on iOS to work */
        } else if (config.startSilent) {
            element.muted = true;
        }

        element.autoplay = !config.testing?.noAutoPlayVideo;
        element.id = SmallVideo.getStreamElementID(stream);

        return element;
    }

    /**
     * Returns the element id for a particular MediaStream.
     */
    static getStreamElementID(stream) {
        return (stream.isVideoTrack() ? 'remoteVideo_' : 'remoteAudio_') + stream.getId();
    }

    /**
     * Configures hoverIn/hoverOut handlers. Depends on connection indicator.
     */
    bindHoverHandler() {
        // Add hover handler
        this.$container.hover(
            () => {
                this.videoIsHovered = true;
                this.updateView();
                this.updateIndicators();
            },
            () => {
                this.videoIsHovered = false;
                this.updateView();
                this.updateIndicators();
            }
        );
    }

    /**
     * Unmounts the ConnectionIndicator component.

    * @returns {void}
    */
    removeConnectionIndicator() {
        this._showConnectionIndicator = false;
        this.updateIndicators();
    }

    /**
     * Updates the connectionStatus stat which displays in the ConnectionIndicator.

    * @returns {void}
    */
    updateConnectionStatus(connectionStatus) {
        this._connectionStatus = connectionStatus;
        this.updateIndicators();
    }

    /**
     * Shows / hides the audio muted indicator over small videos.
     *
     * @param {boolean} isMuted indicates if the muted element should be shown
     * or hidden
     */
    showAudioIndicator(isMuted) {
        this.isAudioMuted = isMuted;
        this.updateStatusBar();
    }

    /**
     * Shows / hides the screen-share indicator over small videos.
     *
     * @param {boolean} isScreenSharing indicates if the screen-share element should be shown
     * or hidden
     */
    setScreenSharing(isScreenSharing) {
        if (isScreenSharing === this.isScreenSharing) {
            return;
        }

        this.isScreenSharing = isScreenSharing;
        this.updateView();
        this.updateStatusBar();
    }

    /**
     * Shows video muted indicator over small videos and disables/enables avatar
     * if video muted.
     *
     * @param {boolean} isMuted indicates if we should set the view to muted view
     * or not
     */
    setVideoMutedView(isMuted) {
        this.isVideoMuted = isMuted;
        this.updateView();
        this.updateStatusBar();
    }

    /**
     * Create or updates the ReactElement for displaying status indicators about
     * audio mute, video mute, and moderator status.
     *
     * @returns {void}
     */
    updateStatusBar() {
        const statusBarContainer = this.container.querySelector('.videocontainer__toolbar');

        if (!statusBarContainer) {
            return;
        }

        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <StatusIndicators
                        showAudioMutedIndicator = { this.isAudioMuted }
                        showScreenShareIndicator = { this.isScreenSharing }
                        showVideoMutedIndicator = { this.isVideoMuted }
                        participantID = { this.id } />
                </I18nextProvider>
            </Provider>,
            statusBarContainer);
    }

    /**
     * Adds the element indicating the audio level of the participant.
     *
     * @returns {void}
     */
    addAudioLevelIndicator() {
        let audioLevelContainer = this._getAudioLevelContainer();

        if (audioLevelContainer) {
            return;
        }

        audioLevelContainer = document.createElement('span');
        audioLevelContainer.className = 'audioindicator-container';
        this.container.appendChild(audioLevelContainer);
        this.updateAudioLevelIndicator();
    }

    /**
     * Removes the element indicating the audio level of the participant.
     *
     * @returns {void}
     */
    removeAudioLevelIndicator() {
        const audioLevelContainer = this._getAudioLevelContainer();

        if (audioLevelContainer) {
            ReactDOM.unmountComponentAtNode(audioLevelContainer);
        }
    }

    /**
     * Updates the audio level for this small video.
     *
     * @param lvl the new audio level to set
     * @returns {void}
     */
    updateAudioLevelIndicator(lvl = 0) {
        const audioLevelContainer = this._getAudioLevelContainer();

        if (audioLevelContainer) {
            ReactDOM.render(<AudioLevelIndicator audioLevel = { lvl }/>, audioLevelContainer);
        }
    }

    /**
     * Queries the component's DOM for the element that should be the parent to the
     * AudioLevelIndicator.
     *
     * @returns {HTMLElement} The DOM element that holds the AudioLevelIndicator.
     */
    _getAudioLevelContainer() {
        return this.container.querySelector('.audioindicator-container');
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
     * Selects the HTML image element which displays user's avatar.
     *
     * @return {jQuery|HTMLElement} a jQuery selector pointing to the HTML image
     * element which displays the user's avatar.
     */
    $avatar() {
        return this.$container.find('.avatar-container');
    }

    /**
     * Returns the display name element, which appears on the video thumbnail.
     *
     * @return {jQuery} a jQuery selector pointing to the display name element of
     * the video thumbnail
     */
    $displayName() {
        return this.$container.find('.displayNameContainer');
    }

    /**
     * Creates or updates the participant's display name that is shown over the
     * video preview.
     *
     * @param {Object} props - The React {@code Component} props to pass into the
     * {@code DisplayName} component.
     * @returns {void}
     */
    _renderDisplayName(props) {
        const displayNameContainer = this.container.querySelector('.displayNameContainer');

        if (displayNameContainer) {
            ReactDOM.render(
                <Provider store = { APP.store }>
                    <I18nextProvider i18n = { i18next }>
                        <DisplayName { ...props } />
                    </I18nextProvider>
                </Provider>,
                displayNameContainer);
        }
    }

    /**
     * Removes the component responsible for showing the participant's display name,
     * if its container is present.
     *
     * @returns {void}
     */
    removeDisplayName() {
        const displayNameContainer = this.container.querySelector('.displayNameContainer');

        if (displayNameContainer) {
            ReactDOM.unmountComponentAtNode(displayNameContainer);
        }
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
        return this.videoStream && !this.isVideoMuted && !APP.conference.isAudioOnly();
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
        return {
            isCurrentlyOnLargeVideo: this.isCurrentlyOnLargeVideo(),
            isHovered: this._isHovered(),
            isAudioOnly: APP.conference.isAudioOnly(),
            tileViewActive: shouldDisplayTileView(APP.store.getState()),
            isVideoPlayable: this.isVideoPlayable(),
            hasVideo: Boolean(this.selectVideoElement().length),
            connectionStatus: APP.conference.getParticipantConnectionStatus(this.id),
            mutedWhileDisconnected: this.mutedWhileDisconnected,
            canPlayEventReceived: this._canPlayEventReceived,
            videoStream: Boolean(this.videoStream),
            isVideoMuted: this.isVideoMuted,
            isScreenSharing: this.isScreenSharing,
            videoStreamMuted: this.videoStream ? this.videoStream.isMuted() : 'no stream'
        };
    }

    /**
     * Checks whether current video is considered hovered. Currently it is hovered
     * if the mouse is over the video, or if the connection
     * indicator is shown(hovered).
     * @private
     */
    _isHovered() {
        return this.videoIsHovered || this._popoverIsHovered;
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
    }

    /**
     * Updates the react component displaying the avatar with the passed in avatar
     * url.
     *
     * @returns {void}
     */
    initializeAvatar() {
        const thumbnail = this.$avatar().get(0);

        if (thumbnail) {
            // Maybe add a special case for local participant, as on init of
            // LocalVideo.js the id is set to "local" but will get updated later.
            ReactDOM.render(
                <Provider store = { APP.store }>
                    <AvatarDisplay
                        className = 'userAvatar'
                        participantId = { this.id } />
                </Provider>,
                thumbnail
            );
        }
    }

    /**
     * Unmounts any attached react components (particular the avatar image) from
     * the avatar container.
     *
     * @returns {void}
     */
    removeAvatar() {
        const thumbnail = this.$avatar().get(0);

        if (thumbnail) {
            ReactDOM.unmountComponentAtNode(thumbnail);
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
        if (this._showDominantSpeaker === show) {
            return;
        }

        this._showDominantSpeaker = show;
        this.$container.toggleClass('active-speaker', this._showDominantSpeaker);
        this.updateIndicators();
        this.updateView();
    }

    /**
     * Shows or hides the raised hand indicator.
     * @param show whether to show or hide.
     */
    showRaisedHandIndicator(show) {
        if (!this.container) {
            logger.warn(`Unable to raised hand indication - ${
                this.videoSpanId} does not exist`);

            return;
        }

        this._showRaisedHand = show;
        this.updateIndicators();
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
        this.removeAudioLevelIndicator();

        const toolbarContainer
            = this.container.querySelector('.videocontainer__toolbar');

        if (toolbarContainer) {
            ReactDOM.unmountComponentAtNode(toolbarContainer);
        }

        this.removeConnectionIndicator();
        this.removeDisplayName();
        this.removeAvatar();
        this._unmountIndicators();

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
        this.updateIndicators();
        this.updateStatusBar();
        this.updateView();
    }

    /**
     * Updates the React element responsible for showing connection status, dominant
     * speaker, and raised hand icons. Uses instance variables to get the necessary
     * state to display. Will create the React element if not already created.
     *
     * @private
     * @returns {void}
     */
    updateIndicators() {
        const indicatorToolbar = this.container.querySelector('.videocontainer__toptoolbar');

        if (!indicatorToolbar) {
            return;
        }

        const { NORMAL = 8 } = interfaceConfig.INDICATOR_FONT_SIZES || {};
        const iconSize = NORMAL;
        const showConnectionIndicator = this.videoIsHovered || !interfaceConfig.CONNECTION_INDICATOR_AUTO_HIDE_ENABLED;
        const state = APP.store.getState();
        const currentLayout = getCurrentLayout(state);
        const participantCount = getParticipantCount(state);
        let statsPopoverPosition, tooltipPosition;

        if (currentLayout === LAYOUTS.TILE_VIEW) {
            statsPopoverPosition = 'right top';
            tooltipPosition = 'right';
        } else if (currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW) {
            statsPopoverPosition = this.statsPopoverLocation;
            tooltipPosition = 'left';
        } else {
            statsPopoverPosition = this.statsPopoverLocation;
            tooltipPosition = 'top';
        }

        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <div>
                        <AtlasKitThemeProvider mode = 'dark'>
                            { this._showConnectionIndicator
                                ? <ConnectionIndicator
                                    alwaysVisible = { showConnectionIndicator }
                                    connectionStatus = { this._connectionStatus }
                                    iconSize = { iconSize }
                                    isLocalVideo = { this.isLocal }
                                    enableStatsDisplay = { !interfaceConfig.filmStripOnly }
                                    participantId = { this.id }
                                    statsPopoverPosition = { statsPopoverPosition } />
                                : null }
                            <RaisedHandIndicator
                                iconSize = { iconSize }
                                participantId = { this.id }
                                tooltipPosition = { tooltipPosition } />
                            { this._showDominantSpeaker && participantCount > 2
                                ? <DominantSpeakerIndicator
                                    iconSize = { iconSize }
                                    tooltipPosition = { tooltipPosition } />
                                : null }
                        </AtlasKitThemeProvider>
                    </div>
                </I18nextProvider>
            </Provider>,
            indicatorToolbar
        );
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
     * Removes the React element responsible for showing connection status, dominant
     * speaker, and raised hand icons.
     *
     * @private
     * @returns {void}
     */
    _unmountIndicators() {
        const indicatorToolbar = this.container.querySelector('.videocontainer__toptoolbar');

        if (indicatorToolbar) {
            ReactDOM.unmountComponentAtNode(indicatorToolbar);
        }
    }

    /**
     * Updates the current state of the connection indicator popover being hovered.
     * If hovered, display the small video as if it is hovered.
     *
     * @param {boolean} popoverIsHovered - Whether or not the mouse cursor is
     * currently over the connection indicator popover.
     * @returns {void}
     */
    _onPopoverHover(popoverIsHovered) {
        this._popoverIsHovered = popoverIsHovered;
        this.updateView();
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
            this.$avatar().css({
                height: '50%',
                width: `${heightToWidthPercent / 2}%`
            });
            break;
        }
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
            const state = APP.store.getState();
            const { local, remote } = state['features/filmstrip'].horizontalViewDimensions;
            const size = this.isLocal ? local : remote;

            if (typeof size !== 'undefined') {
                const { height, width } = size;
                const avatarSize = height / 2;

                this.$container.css({
                    height: `${height}px`,
                    'min-height': `${height}px`,
                    'min-width': `${width}px`,
                    width: `${width}px`
                });
                this.$avatar().css({
                    height: `${avatarSize}px`,
                    width: `${avatarSize}px`
                });
            }
            break;
        }
        case LAYOUTS.TILE_VIEW: {
            const state = APP.store.getState();
            const { thumbnailSize } = state['features/filmstrip'].tileViewDimensions;

            if (typeof thumbnailSize !== 'undefined') {
                const { height, width } = thumbnailSize;
                const avatarSize = height / 2;

                this.$container.css({
                    height: `${height}px`,
                    'min-height': `${height}px`,
                    'min-width': `${width}px`,
                    width: `${width}px`
                });
                this.$avatar().css({
                    height: `${avatarSize}px`,
                    width: `${avatarSize}px`
                });
            }
            break;
        }
        }
    }
}
