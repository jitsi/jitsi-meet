// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import UIUtil from '../../../../../modules/UI/util/UIUtil';
import UIEvents from '../../../../../service/UI/UIEvents';

import { AudioLevelIndicator } from '../../../audio-level-indicator';
import { VideoTrack } from '../../../base/media';
import { updateSettings } from '../../../base/settings';
import { getLocalAudioTrack, getLocalVideoTrack } from '../../../base/tracks';
import { DisplayName } from '../../../display-name';
import { ConnectionIndicator } from '../../../connection-indicator';
import {
    Avatar,
    getAvatarURLByParticipantId,
    getLocalParticipant,
    pinParticipant
} from '../../../base/participants';

import AudioMutedIndicator from './AudioMutedIndicator';
import DominantSpeakerIndicator from './DominantSpeakerIndicator';
import ModeratorIndicator from './ModeratorIndicator';
import RaisedHandIndicator from './RaisedHandIndicator';
import VideoMutedIndicator from './VideoMutedIndicator';

declare var $: Function;
declare var APP: Object;
declare var interfaceConfig: Object;

type Props = {
    _allowEditing: boolean,
    _audioTrack: Object,
    _audioOnly: boolean,
    _avatarUrl: string,
    _conference: Object,
    _enableContextMenu: boolean,
    _largeVideoId: string,
    _localFlipX: boolean,
    _localParticipant: Object,
    _videoTrack: Object,
    dispatch: Function
};

type State = {
    hovered: boolean
};

/**
 * Component to render a local thumbnail.
 */
class LocalThumbnail extends Component<Props, State> {
    _rootEl: Object;

    _waitForResolutionChange: number;

    /**
     * Initializes new {@code LocalThumbnail} component.
     *
     * @param {Object} props - Component props.
     */
    constructor(props) {
        super(props);

        this.state = {
            hovered: false
        };

        /**
         * The timestamp for when a wait for resolution change for the thumbnail
         * has been started.
         *
         * @private
         * @type {number|null}
         */
        this._waitForResolutionChange
            = props._localParticipant.id === props._largeVideoId
                ? window.performance.now() : -1;

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onResize = this._onResize.bind(this);
        this._setRootRef = this._setRootRef.bind(this);
    }

    /**
     * Builds the context menu feature if enabled.
     *
     * @inheritdoc
     */
    componentDidMount() {
        if (this.props._enableContextMenu) {
            this._buildContextMenu();
        }
    }

    /**
     * Sets the flag to wait for resolution change if now on large video.
     *
     * @inheritdoc
     */
    componentWillUpdate(prevProps) {
        const wasOnLarge = prevProps._localParticipant.id
            === prevProps._largeVideoId;
        const isNowOnLarge = prevProps._localParticipant.id
            === prevProps._largeVideoId;

        if (!wasOnLarge && isNowOnLarge) {
            this._waitForResolutionChange = window.performance.now();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _localParticipant } = this.props;

        let className = `videocontainer ${this._getDisplayMode()}`;

        if (_localParticipant.pinned) {
            className += ' videoContainerFocused';
        }

        return (
            <span
                className = { className }
                id = 'localVideoContainer'
                onClick = { this._onClick }
                onMouseOut = { this._onMouseOut }
                onMouseOver = { this._onMouseOver }
                ref = { this._setRootRef }>
                <div className = 'videocontainer__background' />
                { this._renderVideo() }
                { this._renderStatusBar() }
                { this._renderIndicators() }
                <div className = 'videocontainer__hoverOverlay' />
                { this._renderName() }
                { this._renderAvatar() }
                { this._renderAudioLevels() }
            </span>
        );
    }

    /**
     * Returns the CSS class to apply to the root to determine what elements
     * are displayed.
     *
     * @private
     * @returns {string}
     */
    _getDisplayMode() {
        const {
            _audioOnly,
            _largeVideoId,
            _localParticipant,
            _videoTrack
        } = this.props;

        const videoPlayable = _videoTrack && !_videoTrack.muted;

        // Display name is always and only displayed when user is on the stage
        if (_largeVideoId === _localParticipant.id) {
            return videoPlayable && !_audioOnly
                ? 'display-name-on-black' : 'display-avatar-with-name';
        } else if (videoPlayable && !_audioOnly) {
            // check hovering and change state to video with name
            return this.state.hovered
                ? 'display-name-on-video' : 'display-video';
        }

        // check hovering and change state to avatar with name
        return this.state.hovered
            ? 'display-avatar-with-name' : 'display-avatar-only';
    }

    /**
     * Creates a context menu for flipping the y-axis of local video.
     *
     * @private
     * @returns {void}
     */
    _buildContextMenu() {
        $.contextMenu({
            selector: '#localVideoContainer',
            zIndex: 10000,
            items: {
                flip: {
                    name: 'Flip',
                    callback: () => {
                        const { store } = APP;
                        const val = !store.getState()['features/base/settings']
                        .localFlipX;

                        // this.setFlipX(val);
                        store.dispatch(updateSettings({
                            localFlipX: val
                        }));

                        APP.UI.emitEvent(UIEvents.LOCAL_FLIPX_CHANGED, val);
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

    _onClick: () => void;

    /**
     * Callback invoked when the root element is clicked. Pins or unpins the
     * local participant.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        this.props.dispatch(pinParticipant(
            this.props._localParticipant.pinned
                ? null : this.props._localParticipant.id));
    }

    _onMouseOver: () => void;

    /**
     * Callback invoked when the root element is moused over.
     *
     * @private
     * @returns {void}
     */
    _onMouseOver() {
        this.setState({ hovered: true });
    }

    _onMouseOut: () => void;

    /**
     * Callback invoked when the root element is moused out.
     *
     * @private
     * @returns {void}
     */
    _onMouseOut() {
        this.setState({ hovered: false });
    }

    _onResize: () => void;

    /**
     * Callback fired when the {@code VideoTrack} changes size.
     *
     * @param {Object} dimensions - The old height and width and new height and
     * width of the video stream.
     * @private
     * @returns {void}
     */
    _onResize(dimensions) {
        const {
            oldWidth = 0,
            oldHeight = 0,
            height,
            width
        } = dimensions;

        if (this._waitForResolutionChange >= 0) {
            APP.UI.emitEvent(
                UIEvents.RESOLUTION_CHANGED,
                this.props._localParticipant.id,
                `${oldWidth}x${oldHeight}`,
                `${width}x${height}`,
                window.performance.now() - this._waitForResolutionChange);
            this._waitForResolutionChange = -1;
        }
    }

    /**
     * Renders {@code AudioLevelIndicator}.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderAudioLevels() {
        const { _audioTrack, _localParticipant } = this.props;
        const isAudioMuted = !_audioTrack || _audioTrack.muted;

        return (
            <AudioLevelIndicator
                audioLevelOverride = { isAudioMuted ? 0 : undefined }
                userID = { _localParticipant.id } />
        );
    }

    /**
     * Renders {@code Avatar}.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderAvatar() {
        return (
            <div className = 'avatar-container'>
                <Avatar
                    className = 'userAvatar'
                    uri = { this.props._avatarUrl } />
            </div>
        );
    }

    /**
     * Renders status indicators for video mute, audio mute, and moderator.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderIndicators() {
        const iconSize = UIUtil.getIndicatorFontSize();
        const showConnectionIndicator = this.state.hovered
            || !interfaceConfig.CONNECTION_INDICATOR_AUTO_HIDE_ENABLED;
        const tooltipPosition
            = interfaceConfig.VERTICAL_FILMSTRIP ? 'left' : 'top';
        const statsPopoverLocation = interfaceConfig.VERTICAL_FILMSTRIP
            ? 'left top' : 'top center';

        return (
            <div className = 'videocontainer__toptoolbar' >
                { !interfaceConfig.CONNECTION_INDICATOR_DISABLE
                    && <ConnectionIndicator
                        alwaysVisible = { showConnectionIndicator }
                        connectionStatus
                            = { this.props._localParticipant.connectionStatus }
                        enableStatsDisplay
                            = { !interfaceConfig.filmStripOnly }
                        iconSize = { iconSize }
                        isLocalVideo = { true }
                        statsPopoverPosition
                            = { statsPopoverLocation }
                        userID = { this.props._localParticipant.id } /> }
                { this.props._localParticipant.raisedHand
                    && <RaisedHandIndicator
                        iconSize = { iconSize }
                        tooltipPosition = { tooltipPosition } /> }
                { this.props._localParticipant.dominantSpeaker
                    && <DominantSpeakerIndicator
                        iconSize = { iconSize }
                        tooltipPosition = { tooltipPosition } /> }
            </div>
        );
    }

    /**
     * Renders {@code DisplayName}.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderName() {
        return (
            <div className = 'displayNameContainer'>
                <DisplayName
                    allowEditing = { this.props._allowEditing }
                    displayName = { this.props._localParticipant.name }
                    displayNameSuffix
                        = { interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME }
                    elementID = 'localDisplayName'
                    participantID = { this.props._localParticipant.id } />
            </div>
        );
    }

    /**
     * Renders status indicators for connection, dominant speaker, and raised
     * hand.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderStatusBar() {
        const { _audioTrack, _videoTrack, _localParticipant } = this.props;
        const showAudioMute = !_audioTrack || _audioTrack.muted;
        const showVideoMute = !_videoTrack || _videoTrack.muted;
        const showModerator = _localParticipant.role === 'moderator'
            && !interfaceConfig.DISABLE_FOCUS_INDICATOR;
        const tooltipPosition
            = interfaceConfig.VERTICAL_FILMSTRIP ? 'left' : 'top';

        return (
            <div className = 'videocontainer__toolbar'>
                { showAudioMute
                    && <AudioMutedIndicator
                        tooltipPosition = { tooltipPosition } /> }
                { showVideoMute
                    && <VideoMutedIndicator
                        tooltipPosition = { tooltipPosition } /> }
                { showModerator
                    && <ModeratorIndicator
                        tooltipPosition = { tooltipPosition } /> }
            </div>
        );
    }

    /**
     * Renders {@code VideoTrack} if there is a video track to render.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderVideo() {
        if (!this.props._videoTrack) {
            return null;
        }

        const id = this.props._videoTrack.jitsiTrack.getId();

        const className = this.props._localFlipX
            && this.props._videoTrack.videoType === 'camera'
            ? 'flipVideoX' : '';

        if ($(this._rootEl).contextMenu) {
            const enableContextMenu
                = this.props._videoTrack.videoType === 'camera';

            $(this._rootEl).contextMenu(enableContextMenu);
        }

        return (
            <span
                className = { className }
                id = 'localVideoWrapper'>
                <VideoTrack
                    id = { `localVideo_${id}` }
                    onVideoResolutionChange = { this._onResize }
                    videoTrack = { this.props._videoTrack } />
            </span>
        );
    }

    _setRootRef: () => void;

    /**
     * Sets a reference to the root of the component. Necessary for building the
     * context menu.
     *
     * @param {Element} rootEl - The DOM element at the base of the component.
     * @private
     * @returns {void}
     */
    _setRootRef(rootEl) {
        this._rootEl = rootEl;
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code LocalThumbnail}'s
 * props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _allowEditing: boolean,
 *     _audioTrack: JitsiTrack,
 *     _audioOnly: boolean,
 *     _avatarUrl: string,
 *     _conference: JitsiConference,
 *     _enableContextMenu: boolean,
 *     _largeVideoId: string,
 *     _localFlipX: boolean,
 *     _localParticipant: Object,
 *     _videoTrack: JitsiTrack
 * }}
 */
function _mapStateToProps(state) {
    const { audioOnly, conference } = state['features/base/conference'];
    const tracks = state['features/base/tracks'];
    const localParticipant = getLocalParticipant(state);

    return {
        _allowEditing: state['features/base/jwt'].isGuest,
        _audioTrack: getLocalAudioTrack(tracks),
        _audioOnly: audioOnly,
        _avatarUrl: getAvatarURLByParticipantId(state, localParticipant.id),
        _conference: conference,
        _enableContextMenu: state['features/base/config'].enableLocalVideoFlip,
        _largeVideoId: state['features/large-video'].participantId,
        _localFlipX: state['features/base/settings'].localFlipX,
        _localParticipant: localParticipant,
        _videoTrack: getLocalVideoTrack(tracks)
    };
}

export default connect(_mapStateToProps)(LocalThumbnail);
