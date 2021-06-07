// @flow

import React, { Component } from 'react';

import { AudioLevelIndicator } from '../../../audio-level-indicator';
import { Avatar } from '../../../base/avatar';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import { MEDIA_TYPE } from '../../../base/media';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantCount
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import {
    getLocalAudioTrack,
    getTrackByMediaTypeAndParticipant
} from '../../../base/tracks';
import { ConnectionIndicator } from '../../../connection-indicator';
import { DisplayName } from '../../../display-name';
import { StatusIndicators, RaisedHandIndicator, DominantSpeakerIndicator } from '../../../filmstrip';
import { PresenceLabel } from '../../../presence-status';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';
import {
    DISPLAY_AVATAR,
    DISPLAY_AVATAR_WITH_NAME,
    DISPLAY_MODE_TO_CLASS_NAME
} from '../../constants';

const JitsiTrackEvents = JitsiMeetJS.events.track;

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} state of {@link Thumbnail}.
 */
export type State = {|

    /**
     * The current audio level value for the Thumbnail.
     */
    audioLevel: number,

    /**
     * Indicates whether the thumbnail is hovered or not.
     */
    isHovered: boolean
|};

/**
 * The type of the React {@code Component} props of {@link Thumbnail}.
 */
export type Props = {|

    /**
     * The audio track related to the participant.
     */
    _audioTrack: ?Object,

    /**
     * Disable/enable the auto hide functionality for the connection indicator.
     */
    _connectionIndicatorAutoHideEnabled: boolean,

    /**
     * Disable/enable the connection indicator.
     */
    _connectionIndicatorDisabled: boolean,

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout: string,

    /**
     * The default display name for the local participant.
     */
    _defaultLocalDisplayName: string,

    /**
     * The height of the Thumbnail.
     */
    _height: number,

    /**
     * The aspect ratio of the Thumbnail in percents.
     */
    _heightToWidthPercent: number,

    /**
     * Indicates whether the thumbnail should be hidden or not.
     */
    _isHidden: boolean,

    /**
     * Indicates whether audio only mode is enabled.
     */
    _isAudioOnly: boolean,

    /**
     * Disable/enable the dominant speaker indicator.
     */
    _isDominantSpeakerDisabled: boolean,

    /**
     * The size of the icon of indicators.
     */
    _indicatorIconSize: number,

    /**
     * An object with information about the participant related to the thumbnaul.
     */
    _participant: Object,

    /**
     * True if there are more than 2 participants in the call.
     */
    _participantCountMoreThan2: boolean,

    /**
     * The width of the thumbnail.
     */
    _width: number,

    /**
     * The horizontal offset in px for the thumbnail. Used to center the thumbnails from the last row in tile view.
     */
    horizontalOffset: number,

    /**
     * The ID of the participant related to the thumbnail.
     */
    participantID: ?string,

    /**
     * Styles that will be set to the Thumbnail's main span element.
     */
    style?: ?Object
|};

/**
 * Implements a thumbnail.
 *
 * @extends Component
 */
class ScrollingThumbnail extends Component<Props, State> {
    /**
     * Initializes a new Thumbnail instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            audioLevel: 0,
            isHovered: false
        };

        // this._updateAudioLevel = this._updateAudioLevel.bind(this);
        // this._onMouseEnter = this._onMouseEnter.bind(this);
        // this._onMouseLeave = this._onMouseLeave.bind(this);
    }

    /**
     * Starts listening for audio level updates after the initial render.
     *
     * @inheritdoc
     * @returns {void}
     */
    // componentDidMount() {
    //     this._listenForAudioUpdates();
    // }

    // /**
    //  * Stops listening for audio level updates on the old track and starts
    //  * listening instead on the new track.
    //  *
    //  * @inheritdoc
    //  * @returns {void}
    //  */
    // componentDidUpdate(prevProps: Props) {
    //     if (prevProps._audioTrack !== this.props._audioTrack) {
    //         this._stopListeningForAudioUpdates(prevProps._audioTrack);
    //         this._listenForAudioUpdates();
    //         this._updateAudioLevel(0);
    //     }
    // }

    /**
     * Unsubscribe from audio level updates.
     *
     * @inheritdoc
     * @returns {void}
     */
    // componentWillUnmount() {
    //     this._stopListeningForAudioUpdates(this.props._audioTrack);
    // }

    /**
     * Starts listening for audio level updates from the library.
     *
     * @private
     * @returns {void}
     */
    // _listenForAudioUpdates() {
    //     const { _audioTrack } = this.props;

    //     if (_audioTrack) {
    //         const { jitsiTrack } = _audioTrack;

    //         jitsiTrack && jitsiTrack.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, this._updateAudioLevel);
    //     }
    // }

    /**
     * Stops listening to further updates from the passed track.
     *
     * @param {Object} audioTrack - The track.
     * @private
     * @returns {void}
     */
    // _stopListeningForAudioUpdates(audioTrack) {
    //     if (audioTrack) {
    //         const { jitsiTrack } = audioTrack;

    //         jitsiTrack && jitsiTrack.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, this._updateAudioLevel);
    //     }
    // }

    _updateAudioLevel: (number) => void;

    /**
     * Updates the internal state of the last know audio level. The level should
     * be between 0 and 1, as the level will be used as a percentage out of 1.
     *
     * @param {number} audioLevel - The new audio level for the track.
     * @private
     * @returns {void}
     */
    // _updateAudioLevel(audioLevel) {
    //     this.setState({
    //         audioLevel
    //     });
    // }

    /**
     * Returns an object with the styles for thumbnail.
     *
     * @returns {Object} - The styles for the thumbnail.
     */
    _getStyles(): Object {
        const { _height, _isHidden, _width, style, horizontalOffset } = this.props;
        let styles: {
            thumbnail: Object,
            avatar: Object
        } = {
            thumbnail: {},
            avatar: {}
        };

        const avatarSize = _height / 2;
        let { left } = style || {};

        if (typeof left === 'number' && horizontalOffset) {
            left += horizontalOffset;
        }

        styles = {
            thumbnail: {
                ...style,
                left,
                height: `${_height}px`,
                minHeight: `${_height}px`,
                minWidth: `${_width}px`,
                width: `${_width}px`
            },
            avatar: {
                height: `${avatarSize}px`,
                width: `${avatarSize}px`
            }
        };

        if (_isHidden) {
            styles.thumbnail.display = 'none';
        }

        return styles;
    }

    _onMouseEnter: () => void;

    /**
     * Mouse enter handler.
     *
     * @returns {void}
     */
    _onMouseEnter() {
        this.setState({ isHovered: true });
    }

    _onMouseLeave: () => void;

    /**
     * Mouse leave handler.
     *
     * @returns {void}
     */
    _onMouseLeave() {
        this.setState({ isHovered: false });
    }

    /**
     * Renders a fake participant (youtube video) thumbnail.
     *
     * @param {string} id - The id of the participant.
     * @returns {ReactElement}
     */
    _renderFakeParticipant() {
        const { _participant } = this.props;
        const { id } = _participant;
        const styles = this._getStyles();
        const containerClassName = this._getContainerClassName();

        return (
            <span
                className = { containerClassName }
                id = 'sharedVideoContainer'

                // onMouseEnter = { this._onMouseEnter }
                // onMouseLeave = { this._onMouseLeave }
                style = { styles.thumbnail }>
                <img
                    className = 'sharedVideoAvatar'
                    src = { `https://img.youtube.com/vi/${id}/0.jpg` } />
                <div className = 'displayNameContainer'>
                    <DisplayName
                        elementID = 'sharedVideoContainer_name'
                        participantID = { id } />
                </div>
            </span>
        );
    }

    /**
     * Renders the top indicators of the thumbnail.
     *
     * @returns {Component}
     */
    _renderTopIndicators() {
        // const {
        //     _connectionIndicatorAutoHideEnabled,
        //     _connectionIndicatorDisabled,
        //     _currentLayout,
        //     _isDominantSpeakerDisabled,
        //     _indicatorIconSize: iconSize,
        //     _participant,
        //     _participantCountMoreThan2
        // } = this.props;
        // const { isHovered } = this.state;
        // const showConnectionIndicator = isHovered || !_connectionIndicatorAutoHideEnabled;
        // const { id, local = false, dominantSpeaker = false } = _participant;
        // const showDominantSpeaker = !_isDominantSpeakerDisabled && dominantSpeaker;
        // let statsPopoverPosition, tooltipPosition;

        // switch (_currentLayout) {
        // case LAYOUTS.TILE_VIEW:
        //     statsPopoverPosition = 'right-start';
        //     tooltipPosition = 'right';
        //     break;
        // case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
        //     statsPopoverPosition = 'left-start';
        //     tooltipPosition = 'left';
        //     break;
        // default:
        //     statsPopoverPosition = 'auto';
        //     tooltipPosition = 'top';
        // }

        return (
            <div>
                {/* { !_connectionIndicatorDisabled
                    && <ConnectionIndicator
                        alwaysVisible = { showConnectionIndicator }
                        enableStatsDisplay = { true }
                        iconSize = { iconSize }
                        isLocalVideo = { local }
                        participantId = { id }
                        statsPopoverPosition = { statsPopoverPosition } />
                }
                <RaisedHandIndicator
                    iconSize = { iconSize }
                    participantId = { id }
                    tooltipPosition = { tooltipPosition } />
                { showDominantSpeaker && _participantCountMoreThan2
                    && <DominantSpeakerIndicator
                        iconSize = { iconSize }
                        tooltipPosition = { tooltipPosition } />
                } */}
            </div>);
    }

    /**
     * Renders the avatar.
     *
     * @param {Object} styles - The styles that will be applied to the avatar.
     * @returns {ReactElement}
     */
    _renderAvatar(styles) {
        const { _participant } = this.props;
        const { id } = _participant;

        return (
            <div
                className = 'avatar-container'
                style = { styles }>
                <Avatar
                    className = 'userAvatar'
                    participantId = { id } />
            </div>
        );
    }

    /**
     * Returns the container class name.
     *
     * @returns {string} - The class name that will be used for the container.
     */
    _getContainerClassName() {
        let className = 'videocontainer';
        const { isHovered } = this.state;
        const displayMode = isHovered ? DISPLAY_AVATAR_WITH_NAME : DISPLAY_AVATAR;
        const { _isAudioOnly, _isDominantSpeakerDisabled, _isHidden, _participant } = this.props;
        const isRemoteParticipant = !_participant?.local && !_participant?.isFakeParticipant;

        className += ` ${DISPLAY_MODE_TO_CLASS_NAME[displayMode]}`;

        if (_participant?.pinned) {
            className += ' videoContainerFocused';
        }

        if (!_isDominantSpeakerDisabled && _participant?.dominantSpeaker) {
            className += ' active-speaker';
        }

        if (_isHidden) {
            className += ' hidden';
        }

        if (isRemoteParticipant && _isAudioOnly) {
            className += ' audio-only';
        }

        return className;
    }

    /**
     * Renders the local participant's thumbnail.
     *
     * @returns {ReactElement}
     */
    _renderLocalParticipant() {
        // const {
        //     _participant
        // } = this.props;
        // const { id } = _participant || {};
        // const { audioLevel } = this.state;
        const styles = this._getStyles();
        const containerClassName = this._getContainerClassName();

        return (
            <span
                className = { containerClassName }
                id = 'localVideoContainer'
                style = { styles.thumbnail }>
                <div className = 'videocontainer__background' />
                {/* <div className = 'videocontainer__toolbar'>
                    <StatusIndicators participantID = { id } />
                </div> */}
                {/* <div className = 'videocontainer__toptoolbar'>
                    { this._renderTopIndicators() }
                </div> */}
                <div className = 'videocontainer__hoverOverlay' />
                { this._renderAvatar(styles.avatar) }
                {/* <span className = 'audioindicator-container'>
                    <AudioLevelIndicator audioLevel = { audioLevel } />
                </span> */}
            </span>
        );
    }

    /**
     * Renders a remote participant's 'thumbnail.
     *
     * @returns {ReactElement}
     */
    _renderRemoteParticipant() {
        // const {
        //     _participant
        // } = this.props;
        // const { id } = _participant;
        // const { audioLevel } = this.state;
        const styles = this._getStyles();
        const containerClassName = this._getContainerClassName();

        return (
            <span
                className = { containerClassName }
                id = { `participant_${this.props.participantID || 'undefined'}` }

                // onMouseEnter = { this._onMouseEnter }
                // onMouseLeave = { this._onMouseLeave }
                style = { styles.thumbnail }>
                <div className = 'videocontainer__background' />
                <div className = 'videocontainer__toptoolbar'>
                    {/* { this._renderTopIndicators() } */}
                </div>
                <div className = 'videocontainer__toolbar'>
                    {/* <StatusIndicators participantID = { id } /> */}
                </div>
                <div className = 'videocontainer__hoverOverlay' />
                {/* <div className = 'displayNameContainer'>
                    <DisplayName
                        elementID = { `participant_${id}_name` }
                        participantID = { id } />
                </div> */}
                { this._renderAvatar(styles.avatar) }
                {/* <div className = 'presence-label-container'>
                    <PresenceLabel
                        className = 'presence-label'
                        participantID = { id } />
                </div> */}
                {/* <span className = 'audioindicator-container'>
                    <AudioLevelIndicator audioLevel = { audioLevel } />
                </span> */}
            </span>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _participant } = this.props;

        if (!_participant) {
            return null;
        }

        const { isFakeParticipant, local } = _participant;

        if (local) {
            return this._renderLocalParticipant();
        }

        if (isFakeParticipant) {
            return this._renderFakeParticipant();
        }

        return this._renderRemoteParticipant();
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { participantID } = ownProps;

    // Only the local participant won't have id for the time when the conference is not yet joined.
    const participant = participantID ? getParticipantById(state, participantID) : getLocalParticipant(state);
    const isLocal = participant?.local ?? true;

    // const tracks = state['features/base/tracks'];
    // const _audioTrack = isLocal
    //     ? getLocalAudioTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, participantID);
    const _currentLayout = getCurrentLayout(state);
    let size = {};
    const {
        iAmRecorder,
        iAmSipGateway
    } = state['features/base/config'];
    const { NORMAL = 8 } = interfaceConfig.INDICATOR_FONT_SIZES || {};

    switch (_currentLayout) {
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
    case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
        const {
            horizontalViewDimensions = {
                local: {},
                remote: {}
            },
            verticalViewDimensions = {
                local: {},
                remote: {}
            }
        } = state['features/filmstrip'];
        const { local, remote }
            = _currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW
                ? verticalViewDimensions : horizontalViewDimensions;
        const { width, height } = isLocal ? local : remote;

        size = {
            _width: width,
            _height: height
        };

        break;
    }
    case LAYOUTS.TILE_VIEW: {
        const { width, height } = state['features/filmstrip'].tileViewDimensions.thumbnailSize;

        size = {
            _width: width,
            _height: height
        };
        break;
    }
    }

    return {
        // _audioTrack,
        // _connectionIndicatorAutoHideEnabled: interfaceConfig.CONNECTION_INDICATOR_AUTO_HIDE_ENABLED,
        // _connectionIndicatorDisabled: interfaceConfig.CONNECTION_INDICATOR_DISABLED,
        _currentLayout,
        _defaultLocalDisplayName: interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME,
        _isHidden: isLocal && iAmRecorder && !iAmSipGateway,
        _isAudioOnly: Boolean(state['features/base/audio-only'].enabled),
        _isDominantSpeakerDisabled: interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR,
        _indicatorIconSize: NORMAL,
        _participant: participant,
        // _participantCountMoreThan2: getParticipantCount(state) > 2,
        ...size
    };
}

export default connect(_mapStateToProps)(ScrollingThumbnail);
