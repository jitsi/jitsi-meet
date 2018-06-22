/* global $, APP, JitsiMeetJS, interfaceConfig */

/* eslint-disable no-unused-vars */
import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { AtlasKitThemeProvider } from '@atlaskit/theme';
import { Provider } from 'react-redux';

import { i18next } from '../../../react/features/base/i18n';
import { AudioLevelIndicator }
    from '../../../react/features/audio-level-indicator';
import {
    Avatar as AvatarDisplay,
    getAvatarURLByParticipantId,
    getPinnedParticipant,
    pinParticipant
} from '../../../react/features/base/participants';
import {
    ConnectionIndicator
} from '../../../react/features/connection-indicator';
import { DisplayName } from '../../../react/features/display-name';
import {
    AudioMutedIndicator,
    DominantSpeakerIndicator,
    ModeratorIndicator,
    RaisedHandIndicator,
    VideoMutedIndicator
} from '../../../react/features/filmstrip';
/* eslint-enable no-unused-vars */

const logger = require('jitsi-meet-logger').getLogger(__filename);

import UIUtil from '../util/UIUtil';
import UIEvents from '../../../service/UI/UIEvents';

const RTCUIHelper = JitsiMeetJS.util.RTCUIHelper;

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
 * Constructor.
 */
function SmallVideo(VideoLayout) {
    this._isModerator = false;
    this.isAudioMuted = false;
    this.hasAvatar = false;
    this.isVideoMuted = false;
    this.videoStream = null;
    this.audioStream = null;
    this.VideoLayout = VideoLayout;
    this.videoIsHovered = false;

    // we can stop updating the thumbnail
    this.disableUpdateView = false;

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
    this._showConnectionIndicator = true;

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
}

/**
 * Returns the identifier of this small video.
 *
 * @returns the identifier of this small video
 */
SmallVideo.prototype.getId = function() {
    return this.id;
};

/* Indicates if this small video is currently visible.
 *
 * @return <tt>true</tt> if this small video isn't currently visible and
 * <tt>false</tt> - otherwise.
 */
SmallVideo.prototype.isVisible = function() {
    return this.$container.is(':visible');
};

/**
 * Enables / disables the device availability icons for this small video.
 * @param {enable} set to {true} to enable and {false} to disable
 */
SmallVideo.prototype.enableDeviceAvailabilityIcons = function(enable) {
    if (typeof enable === 'undefined') {
        return;
    }

    this.deviceAvailabilityIconsEnabled = enable;
};

/**
 * Sets the device "non" availability icons.
 * @param devices the devices, which will be checked for availability
 */
SmallVideo.prototype.setDeviceAvailabilityIcons = function(devices) {
    if (!this.deviceAvailabilityIconsEnabled) {
        return;
    }

    if (!this.container) {
        return;
    }

    const noMic = this.$container.find('.noMic');
    const noVideo = this.$container.find('.noVideo');

    noMic.remove();
    noVideo.remove();
    if (!devices.audio) {
        this.container.appendChild(
            document.createElement('div')).setAttribute('class', 'noMic');
    }

    if (!devices.video) {
        this.container.appendChild(
            document.createElement('div')).setAttribute('class', 'noVideo');
    }

    if (!devices.audio && !devices.video) {
        noMic.css('background-position', '75%');
        noVideo.css('background-position', '25%');
        noVideo.css('background-color', 'transparent');
    }
};

/**
 * Sets the type of the video displayed by this instance.
 * Note that this is a string without clearly defined or checked values, and
 * it is NOT one of the strings defined in service/RTC/VideoType in
 * lib-jitsi-meet.
 * @param videoType 'camera' or 'desktop', or 'sharedvideo'.
 */
SmallVideo.prototype.setVideoType = function(videoType) {
    this.videoType = videoType;
};

/**
 * Returns the type of the video displayed by this instance.
 * Note that this is a string without clearly defined or checked values, and
 * it is NOT one of the strings defined in service/RTC/VideoType in
 * lib-jitsi-meet.
 * @returns {String} 'camera', 'screen', 'sharedvideo', or undefined.
 */
SmallVideo.prototype.getVideoType = function() {
    return this.videoType;
};

/**
 * Creates an audio or video element for a particular MediaStream.
 */
SmallVideo.createStreamElement = function(stream) {
    const isVideo = stream.isVideoTrack();

    const element = isVideo
        ? document.createElement('video')
        : document.createElement('audio');

    if (isVideo) {
        element.setAttribute('muted', 'true');
    }

    RTCUIHelper.setAutoPlay(element, true);

    element.id = SmallVideo.getStreamElementID(stream);

    return element;
};

/**
 * Returns the element id for a particular MediaStream.
 */
SmallVideo.getStreamElementID = function(stream) {
    const isVideo = stream.isVideoTrack();

    return (isVideo ? 'remoteVideo_' : 'remoteAudio_') + stream.getId();
};

/**
 * Configures hoverIn/hoverOut handlers. Depends on connection indicator.
 */
SmallVideo.prototype.bindHoverHandler = function() {
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
};

/**
 * Unmounts the ConnectionIndicator component.

 * @returns {void}
 */
SmallVideo.prototype.removeConnectionIndicator = function() {
    this._showConnectionIndicator = false;

    this.updateIndicators();
};

/**
 * Updates the connectionStatus stat which displays in the ConnectionIndicator.

 * @returns {void}
 */
SmallVideo.prototype.updateConnectionStatus = function(connectionStatus) {
    this._connectionStatus = connectionStatus;
    this.updateIndicators();
};

/**
 * Shows / hides the audio muted indicator over small videos.
 *
 * @param {boolean} isMuted indicates if the muted element should be shown
 * or hidden
 */
SmallVideo.prototype.showAudioIndicator = function(isMuted) {
    this.isAudioMuted = isMuted;
    this.updateStatusBar();
};

/**
 * Shows video muted indicator over small videos and disables/enables avatar
 * if video muted.
 *
 * @param {boolean} isMuted indicates if we should set the view to muted view
 * or not
 */
SmallVideo.prototype.setVideoMutedView = function(isMuted) {
    this.isVideoMuted = isMuted;
    this.updateView();

    this.updateStatusBar();
};

/**
 * Create or updates the ReactElement for displaying status indicators about
 * audio mute, video mute, and moderator status.
 *
 * @returns {void}
 */
SmallVideo.prototype.updateStatusBar = function() {
    const statusBarContainer
        = this.container.querySelector('.videocontainer__toolbar');
    const tooltipPosition = interfaceConfig.VERTICAL_FILMSTRIP ? 'left' : 'top';

    ReactDOM.render(
        <I18nextProvider i18n = { i18next }>
            <div>
                { this.isAudioMuted
                    ? <AudioMutedIndicator
                        tooltipPosition = { tooltipPosition } />
                    : null }
                { this.isVideoMuted
                    ? <VideoMutedIndicator
                        tooltipPosition = { tooltipPosition } />
                    : null }
                { this._isModerator && !interfaceConfig.DISABLE_FOCUS_INDICATOR
                    ? <ModeratorIndicator
                        tooltipPosition = { tooltipPosition } />
                    : null }
            </div>
        </I18nextProvider>,
        statusBarContainer);
};

/**
 * Adds the element indicating the moderator(owner) of the conference.
 */
SmallVideo.prototype.addModeratorIndicator = function() {
    this._isModerator = true;
    this.updateStatusBar();
};

/**
 * Adds the element indicating the audio level of the participant.
 *
 * @returns {void}
 */
SmallVideo.prototype.addAudioLevelIndicator = function() {
    let audioLevelContainer = this._getAudioLevelContainer();

    if (audioLevelContainer) {
        return;
    }

    audioLevelContainer = document.createElement('span');
    audioLevelContainer.className = 'audioindicator-container';
    this.container.appendChild(audioLevelContainer);

    this.updateAudioLevelIndicator();
};

/**
 * Removes the element indicating the audio level of the participant.
 *
 * @returns {void}
 */
SmallVideo.prototype.removeAudioLevelIndicator = function() {
    const audioLevelContainer = this._getAudioLevelContainer();

    if (audioLevelContainer) {
        ReactDOM.unmountComponentAtNode(audioLevelContainer);
    }
};

/**
 * Updates the audio level for this small video.
 *
 * @param lvl the new audio level to set
 * @returns {void}
 */
SmallVideo.prototype.updateAudioLevelIndicator = function(lvl = 0) {
    const audioLevelContainer = this._getAudioLevelContainer();

    if (audioLevelContainer) {
        ReactDOM.render(
            <AudioLevelIndicator
                audioLevel = { lvl }/>,
            audioLevelContainer);
    }
};

/**
 * Queries the component's DOM for the element that should be the parent to the
 * AudioLevelIndicator.
 *
 * @returns {HTMLElement} The DOM element that holds the AudioLevelIndicator.
 */
SmallVideo.prototype._getAudioLevelContainer = function() {
    return this.container.querySelector('.audioindicator-container');
};

/**
 * Removes the element indicating the moderator(owner) of the conference.
 */
SmallVideo.prototype.removeModeratorIndicator = function() {
    this._isModerator = false;
    this.updateStatusBar();
};

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
SmallVideo.prototype.selectVideoElement = function() {
    return $(RTCUIHelper.findVideoElement(this.container));
};

/**
 * Selects the HTML image element which displays user's avatar.
 *
 * @return {jQuery|HTMLElement} a jQuery selector pointing to the HTML image
 * element which displays the user's avatar.
 */
SmallVideo.prototype.$avatar = function() {
    return this.$container.find('.avatar-container');
};

/**
 * Returns the display name element, which appears on the video thumbnail.
 *
 * @return {jQuery} a jQuery selector pointing to the display name element of
 * the video thumbnail
 */
SmallVideo.prototype.$displayName = function() {
    return this.$container.find('.displayNameContainer');
};

/**
 * Creates or updates the participant's display name that is shown over the
 * video preview.
 *
 * @returns {void}
 */
SmallVideo.prototype.updateDisplayName = function(props) {
    const displayNameContainer
        = this.container.querySelector('.displayNameContainer');

    if (displayNameContainer) {
        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <DisplayName { ...props } />
                </I18nextProvider>
            </Provider>,
            displayNameContainer);
    }
};

/**
 * Removes the component responsible for showing the participant's display name,
 * if its container is present.
 *
 * @returns {void}
 */
SmallVideo.prototype.removeDisplayName = function() {
    const displayNameContainer
        = this.container.querySelector('.displayNameContainer');

    if (displayNameContainer) {
        ReactDOM.unmountComponentAtNode(displayNameContainer);
    }
};

/**
 * Enables / disables the css responsible for focusing/pinning a video
 * thumbnail.
 *
 * @param isFocused indicates if the thumbnail should be focused/pinned or not
 */
SmallVideo.prototype.focus = function(isFocused) {
    const focusedCssClass = 'videoContainerFocused';
    const isFocusClassEnabled = this.$container.hasClass(focusedCssClass);

    if (!isFocused && isFocusClassEnabled) {
        this.$container.removeClass(focusedCssClass);
    } else if (isFocused && !isFocusClassEnabled) {
        this.$container.addClass(focusedCssClass);
    }
};

SmallVideo.prototype.hasVideo = function() {
    return this.selectVideoElement().length !== 0;
};

/**
 * Checks whether the user associated with this <tt>SmallVideo</tt> is currently
 * being displayed on the "large video".
 *
 * @return {boolean} <tt>true</tt> if the user is displayed on the large video
 * or <tt>false</tt> otherwise.
 */
SmallVideo.prototype.isCurrentlyOnLargeVideo = function() {
    return this.VideoLayout.isCurrentlyOnLarge(this.id);
};

/**
 * Checks whether there is a playable video stream available for the user
 * associated with this <tt>SmallVideo</tt>.
 *
 * @return {boolean} <tt>true</tt> if there is a playable video stream available
 * or <tt>false</tt> otherwise.
 */
SmallVideo.prototype.isVideoPlayable = function() {
    return this.videoStream // Is there anything to display ?
        && !this.isVideoMuted && !this.videoStream.isMuted(); // Muted ?
};

/**
 * Determines what should be display on the thumbnail.
 *
 * @return {number} one of <tt>DISPLAY_VIDEO</tt>,<tt>DISPLAY_AVATAR</tt>
 * or <tt>DISPLAY_BLACKNESS_WITH_NAME</tt>.
 */
SmallVideo.prototype.selectDisplayMode = function() {
    // Display name is always and only displayed when user is on the stage
    if (this.isCurrentlyOnLargeVideo()) {
        return this.isVideoPlayable() && !APP.conference.isAudioOnly()
            ? DISPLAY_BLACKNESS_WITH_NAME : DISPLAY_AVATAR_WITH_NAME;
    } else if (this.isVideoPlayable()
        && this.selectVideoElement().length
        && !APP.conference.isAudioOnly()) {
        // check hovering and change state to video with name
        return this._isHovered()
            ? DISPLAY_VIDEO_WITH_NAME : DISPLAY_VIDEO;
    }

    // check hovering and change state to avatar with name
    return this._isHovered()
        ? DISPLAY_AVATAR_WITH_NAME : DISPLAY_AVATAR;

};

/**
 * Checks whether current video is considered hovered. Currently it is hovered
 * if the mouse is over the video, or if the connection
 * indicator is shown(hovered).
 * @private
 */
SmallVideo.prototype._isHovered = function() {
    return this.videoIsHovered || this._popoverIsHovered;
};

/**
 * Hides or shows the user's avatar.
 * This update assumes that large video had been updated and we will
 * reflect it on this small video.
 *
 * @param show whether we should show the avatar or not
 * video because there is no dominant speaker and no focused speaker
 */
SmallVideo.prototype.updateView = function() {
    if (this.disableUpdateView) {
        return;
    }

    if (!this.hasAvatar) {
        if (this.id) {
            // Init avatar
            this.avatarChanged(
                getAvatarURLByParticipantId(APP.store.getState(), this.id));
        } else {
            logger.error('Unable to init avatar - no id', this);

            return;
        }
    }

    this.$container.removeClass((index, classNames) =>
        classNames.split(' ').filter(name => name.startsWith('display-')));

    // Determine whether video, avatar or blackness should be displayed
    const displayMode = this.selectDisplayMode();

    switch (displayMode) {
    case DISPLAY_AVATAR_WITH_NAME:
        this.$container.addClass('display-avatar-with-name');
        break;
    case DISPLAY_BLACKNESS_WITH_NAME:
        this.$container.addClass('display-name-on-black');
        break;
    case DISPLAY_VIDEO:
        this.$container.addClass('display-video');
        break;
    case DISPLAY_VIDEO_WITH_NAME:
        this.$container.addClass('display-name-on-video');
        break;
    case DISPLAY_AVATAR:
    default:
        this.$container.addClass('display-avatar-only');
        break;
    }
};

/**
 * Updates the react component displaying the avatar with the passed in avatar
 * url.
 *
 * @param {string} avatarUrl - The uri to the avatar image.
 * @returns {void}
 */
SmallVideo.prototype.avatarChanged = function(avatarUrl) {
    const thumbnail = this.$avatar().get(0);

    this.hasAvatar = true;

    if (thumbnail) {
        ReactDOM.render(
            <AvatarDisplay
                className = 'userAvatar'
                uri = { avatarUrl } />,
            thumbnail
        );
    }
};

/**
 * Unmounts any attached react components (particular the avatar image) from
 * the avatar container.
 *
 * @returns {void}
 */
SmallVideo.prototype.removeAvatar = function() {
    const thumbnail = this.$avatar().get(0);

    if (thumbnail) {
        ReactDOM.unmountComponentAtNode(thumbnail);
    }
};

/**
 * Shows or hides the dominant speaker indicator.
 * @param show whether to show or hide.
 */
SmallVideo.prototype.showDominantSpeakerIndicator = function(show) {
    // Don't create and show dominant speaker indicator if
    // DISABLE_DOMINANT_SPEAKER_INDICATOR is true
    if (interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR) {
        return;
    }

    if (!this.container) {
        logger.warn(`Unable to set dominant speaker indicator - ${
            this.videoSpanId} does not exist`);

        return;
    }

    if (this._showDominantSpeaker === show) {
        return;
    }

    this._showDominantSpeaker = show;

    this.updateIndicators();
};

/**
 * Shows or hides the raised hand indicator.
 * @param show whether to show or hide.
 */
SmallVideo.prototype.showRaisedHandIndicator = function(show) {
    if (!this.container) {
        logger.warn(`Unable to raised hand indication - ${
            this.videoSpanId} does not exist`);

        return;
    }

    this._showRaisedHand = show;

    this.updateIndicators();
};

/**
 * Adds a listener for onresize events for this video, which will monitor for
 * resolution changes, will calculate the delay since the moment the listened
 * is added, and will fire a RESOLUTION_CHANGED event.
 */
SmallVideo.prototype.waitForResolutionChange = function() {
    const beforeChange = window.performance.now();
    const videos = this.selectVideoElement();

    if (!videos || !videos.length || videos.length <= 0) {
        return;
    }
    const video = videos[0];
    const oldWidth = video.videoWidth;
    const oldHeight = video.videoHeight;

    video.onresize = () => {
        // eslint-disable-next-line eqeqeq
        if (video.videoWidth != oldWidth || video.videoHeight != oldHeight) {
            // Only run once.
            video.onresize = null;

            const delay = window.performance.now() - beforeChange;
            const emitter = this.VideoLayout.getEventEmitter();

            if (emitter) {
                emitter.emit(
                        UIEvents.RESOLUTION_CHANGED,
                        this.getId(),
                        `${oldWidth}x${oldHeight}`,
                        `${video.videoWidth}x${video.videoHeight}`,
                        delay);
            }
        }
    };
};

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
SmallVideo.prototype.initBrowserSpecificProperties = function() {

    const userAgent = window.navigator.userAgent;

    if (userAgent.indexOf('QtWebEngine') > -1
        && (userAgent.indexOf('Windows') > -1
            || userAgent.indexOf('Linux') > -1)) {
        this.$container.css('overflow', 'hidden');
    }
};

/**
 * Updates the React element responsible for showing connection status, dominant
 * speaker, and raised hand icons. Uses instance variables to get the necessary
 * state to display. Will create the React element if not already created.
 *
 * @private
 * @returns {void}
 */
SmallVideo.prototype.updateIndicators = function() {
    const indicatorToolbar
        = this.container.querySelector('.videocontainer__toptoolbar');

    if (!indicatorToolbar) {
        return;
    }

    const iconSize = UIUtil.getIndicatorFontSize();
    const showConnectionIndicator = this.videoIsHovered
        || !interfaceConfig.CONNECTION_INDICATOR_AUTO_HIDE_ENABLED;
    const tooltipPosition = interfaceConfig.VERTICAL_FILMSTRIP ? 'left' : 'top';

    ReactDOM.render(
            <I18nextProvider i18n = { i18next }>
                <div>
                    <AtlasKitThemeProvider mode = 'dark'>
                        { this._showConnectionIndicator
                            ? <ConnectionIndicator
                                alwaysVisible = { showConnectionIndicator }
                                connectionStatus = { this._connectionStatus }
                                iconSize = { iconSize }
                                isLocalVideo = { this.isLocal }
                                enableStatsDisplay
                                    = { !interfaceConfig.filmStripOnly }
                                statsPopoverPosition
                                    = { this.statsPopoverLocation }
                                userID = { this.id } />
                            : null }
                        { this._showRaisedHand
                            ? <RaisedHandIndicator
                                iconSize = { iconSize }
                                tooltipPosition = { tooltipPosition } />
                            : null }
                        { this._showDominantSpeaker
                            ? <DominantSpeakerIndicator
                                iconSize = { iconSize }
                                tooltipPosition = { tooltipPosition } />
                            : null }
                    </AtlasKitThemeProvider>
                </div>
            </I18nextProvider>,
        indicatorToolbar
    );
};

/**
 * Pins the participant displayed by this thumbnail or unpins if already pinned.
 *
 * @private
 * @returns {void}
 */
SmallVideo.prototype._togglePin = function() {
    const pinnedParticipant
        = getPinnedParticipant(APP.store.getState()) || {};
    const participantIdToPin
        = pinnedParticipant && pinnedParticipant.id === this.id
            ? null : this.id;

    APP.store.dispatch(pinParticipant(participantIdToPin));
};

/**
 * Removes the React element responsible for showing connection status, dominant
 * speaker, and raised hand icons.
 *
 * @private
 * @returns {void}
 */
SmallVideo.prototype._unmountIndicators = function() {
    const indicatorToolbar
        = this.container.querySelector('.videocontainer__toptoolbar');

    if (indicatorToolbar) {
        ReactDOM.unmountComponentAtNode(indicatorToolbar);
    }
};

/**
 * Updates the current state of the connection indicator popover being hovered.
 * If hovered, display the small video as if it is hovered.
 *
 * @param {boolean} popoverIsHovered - Whether or not the mouse cursor is
 * currently over the connection indicator popover.
 * @returns {void}
 */
SmallVideo.prototype._onPopoverHover = function(popoverIsHovered) {
    this._popoverIsHovered = popoverIsHovered;
    this.updateView();
};

export default SmallVideo;
