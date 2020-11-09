// @flow

import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React, { Component } from 'react';

import { AudioLevelIndicator } from '../../../audio-level-indicator';
import { Avatar } from '../../../base/avatar';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import { MEDIA_TYPE, VideoTrack } from '../../../base/media';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantCount
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { getLocalAudioTrack, getLocalVideoTrack, getTrackByMediaTypeAndParticipant } from '../../../base/tracks';
import { ConnectionIndicator } from '../../../connection-indicator';
import { DisplayName } from '../../../display-name';
import { StatusIndicators, RaisedHandIndicator, DominantSpeakerIndicator } from '../../../filmstrip';
import { PresenceLabel } from '../../../presence-status';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';

const JitsiTrackEvents = JitsiMeetJS.events.track;

declare var interfaceConfig: Object;

type State = {
    audioLevel: number
};

/**
 * The type of the React {@code Component} props of {@link Thumbnail}.
 */
type Props = {

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout: string,

    _height: number,

    _heightToWidthPercent: number,

    /**
     * The video track that will be displayed in the thumbnail.
     */
    _videoTrack: ?Object,

    /**
     * The audio track related to the participant.
     */
    _audioTrack: ?Object,

    _width: number,


    /**
     * The ID of the participant related to the thumbnaul.
     */
    _participant: Object,
    _defaultLocalDisplayName: string,
    _isGuest: boolean,
    _participantCount: number,
    _isFilmstripOnly: boolean,
    _connectionIndicatorDisabled: boolean,
    _connectionIndicatorAutoHideEnabled: boolean,
    _isDominantSpeakerDisabled: boolean,
    participantID: ?string,
    isHovered: ?boolean,

    dispatch: Function
};

/**
 * TODO.
 *
 * @returns {number}
 */
function _getIndicatorsIconSize() {
    const { NORMAL = 8 } = interfaceConfig.INDICATOR_FONT_SIZES || {};

    return NORMAL;
}

/**
 * Implements a thumbnail.
 *
 * @extends Component
 */
class Thumbnail extends Component<Props, State> {

    /**
     * Initializes a new Thumbnail instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            audioLevel: 0
        };

        this._updateAudioLevel = this._updateAudioLevel.bind(this);
    }

    /**
     * Starts listening for audio level updates after the initial render.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._listenForAudioUpdates();
    }

    /**
     * Stops listening for audio level updates on the old track and starts
     * listening instead on the new track.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: Props) {
        if (prevProps._audioTrack !== this.props._audioTrack) {
            this._stopListeningForAudioUpdates(prevProps._audioTrack);
            this._listenForAudioUpdates();
            this._updateAudioLevel(0);
        }
    }

    /**
     * Unsubscribe from audio level updates.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._stopListeningForAudioUpdates(this.props._audioTrack);
    }

    /**
     * Starts listening for audio level updates from the library.
     *
     * @private
     * @returns {void}
     */
    _listenForAudioUpdates() {
        const { _audioTrack } = this.props;

        if (_audioTrack) {
            const { jitsiTrack } = _audioTrack;

            jitsiTrack && jitsiTrack.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, this._updateAudioLevel);
        }
    }

    /**
     * Stops listening to further updates from the passed track.
     *
     * @param {Object} audioTrack - The track.
     * @private
     * @returns {void}
     */
    _stopListeningForAudioUpdates(audioTrack) {
        if (audioTrack) {
            const { jitsiTrack } = audioTrack;

            jitsiTrack && jitsiTrack.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, this._updateAudioLevel);
        }
    }

    _updateAudioLevel: (number) => void;

    /**
     * Updates the internal state of the last know audio level. The level should
     * be between 0 and 1, as the level will be used as a percentage out of 1.
     *
     * @param {number} audioLevel - The new audio level for the track.
     * @private
     * @returns {void}
     */
    _updateAudioLevel(audioLevel) {
        this.setState({
            audioLevel
        });
    }

    /**
     * Returns an object with the styles for the video container and the avatar container.
     *
     * @returns {Object} - The styles for the video container and the avatar container.
     */
    _getStyles(): Object {
        const { _height, _heightToWidthPercent, _currentLayout } = this.props;
        let styles;

        switch (_currentLayout) {
        case LAYOUTS.TILE_VIEW:
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
            const avatarSize = _height / 2;

            styles = {
                avatarContainer: {
                    height: `${avatarSize}px`,
                    width: `${avatarSize}px`
                }
            };
            break;
        }
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW: {
            styles = {
                avatarContainer: {
                    height: '50%',
                    width: `${_heightToWidthPercent / 2}%`
                }
            };
            break;
        }
        }

        return styles;
    }

    /**
     * Renders  a fake participant (youtube video) thumbnail.
     *
     * @param {string} id - The id of the participant.
     * @returns {ReactElement}
     */
    _renderFakeParticipant(id) {
        return (
            <>
                <img
                    className = 'sharedVideoAvatar'
                    src = { `https://img.youtube.com/vi/${id}/0.jpg` } />
                <div className = 'displayNameContainer'>
                    <DisplayName
                        elementID = 'sharedVideoContainer_name'
                        participantID = { id } />
                </div>
            </>
        );
    }

    /**
     * Renders the local participant's thumbnail.
     *
     * @param {string} id - The ID of the participant.
     * @returns {ReactElement}
     */
    _renderLocalParticipant(id) {
        const styles = this._getStyles();
        const {
            _participant,
            _participantCount,
            _videoTrack,
            _defaultLocalDisplayName,
            _isGuest,
            _isFilmstripOnly,
            _isDominantSpeakerDisabled,
            _connectionIndicatorDisabled,
            _connectionIndicatorAutoHideEnabled,
            _currentLayout
        } = this.props;
        const { audioLevel = 0 } = this.state;
        const iconSize = _getIndicatorsIconSize();
        const showConnectionIndicator = this.props.isHovered || !_connectionIndicatorAutoHideEnabled;
        const { dominantSpeaker = false } = _participant;
        const showDominantSpeaker = !_isDominantSpeakerDisabled && dominantSpeaker;

        let statsPopoverPosition, tooltipPosition;

        switch (_currentLayout) {
        case LAYOUTS.TILE_VIEW:
            statsPopoverPosition = 'right top';
            tooltipPosition = 'right';
            break;
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            statsPopoverPosition = 'left top';
            tooltipPosition = 'left';
            break;
        default:
            statsPopoverPosition = 'top center';
            tooltipPosition = 'top';
        }

        return (
            <>
                <div className = 'videocontainer__background' />
                <span id = 'localVideoWrapper'>
                    <VideoTrack
                        id = 'localVideo_container'
                        videoTrack = { _videoTrack } />
                </span>
                <div className = 'videocontainer__toolbar'>
                    <StatusIndicators participantID = { id } />
                </div>
                <div className = 'videocontainer__toptoolbar'>
                    <div>
                        <AtlasKitThemeProvider mode = 'dark'>
                            { _connectionIndicatorDisabled
                                ? null
                                : <ConnectionIndicator
                                    alwaysVisible = { showConnectionIndicator }
                                    enableStatsDisplay = { !_isFilmstripOnly }
                                    iconSize = { iconSize }
                                    isLocalVideo = { true }
                                    participantId = { id }
                                    statsPopoverPosition = { statsPopoverPosition } />
                            }
                            <RaisedHandIndicator
                                iconSize = { iconSize }
                                participantId = { id }
                                tooltipPosition = { tooltipPosition } />
                            { showDominantSpeaker && _participantCount > 2
                                ? <DominantSpeakerIndicator
                                    iconSize = { iconSize }
                                    tooltipPosition = { tooltipPosition } />
                                : null }
                        </AtlasKitThemeProvider>
                    </div>
                </div>
                <div className = 'videocontainer__hoverOverlay' />
                <div className = 'displayNameContainer'>
                    <DisplayName
                        allowEditing = { _isGuest }
                        displayNameSuffix = { _defaultLocalDisplayName }
                        elementID = 'localDisplayName'
                        participantID = { _participant?.id } />
                </div>
                <div
                    className = 'avatar-container'
                    style = { styles.avatarContainer }>
                    <Avatar
                        className = 'userAvatar'
                        participantId = { id } />
                </div>
                <span className = 'audioindicator-container'>
                    <AudioLevelIndicator audioLevel = { audioLevel } />
                </span>
            </>
        );
    }


    /**
     * Renders a remote participant's 'thumbnail.
     *
     * @param {string} id - The id of the participant.
     * @returns {ReactElement}
     */
    _renderRemoteParticipant(id) {
        const styles = this._getStyles();
        const {
            _participant,
            _participantCount,
            _isFilmstripOnly,
            _currentLayout,
            _connectionIndicatorDisabled,
            _connectionIndicatorAutoHideEnabled,
            _isDominantSpeakerDisabled
        } = this.props;
        const { audioLevel = 0 } = this.state;
        const showConnectionIndicator = this.props.isHovered || !_connectionIndicatorAutoHideEnabled;
        const { dominantSpeaker = false } = _participant;
        const showDominantSpeaker = !_isDominantSpeakerDisabled && dominantSpeaker;
        const iconSize = _getIndicatorsIconSize();
        let remoteMenuPosition, statsPopoverPosition, tooltipPosition;

        switch (_currentLayout) {
        case LAYOUTS.TILE_VIEW:
            statsPopoverPosition = 'right top';
            tooltipPosition = 'right';
            remoteMenuPosition = 'left top';
            break;
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            statsPopoverPosition = 'left bottom';
            tooltipPosition = 'left';
            remoteMenuPosition = 'left bottom';
            break;
        default:
            statsPopoverPosition = 'top center';
            tooltipPosition = 'top';
            remoteMenuPosition = 'top center';
        }

        return (
            <>
                <div className = 'videocontainer__background' />
                <div className = 'videocontainer__toptoolbar'>
                    <div>
                        <AtlasKitThemeProvider mode = 'dark'>
                            { _connectionIndicatorDisabled
                                ? null
                                : <ConnectionIndicator
                                    alwaysVisible = { showConnectionIndicator }
                                    enableStatsDisplay = { !_isFilmstripOnly }
                                    iconSize = { iconSize }
                                    isLocalVideo = { false }
                                    participantId = { id }
                                    statsPopoverPosition = { statsPopoverPosition } />
                            }
                            <RaisedHandIndicator
                                iconSize = { iconSize }
                                participantId = { id }
                                tooltipPosition = { tooltipPosition } />
                            { showDominantSpeaker && _participantCount > 2
                                ? <DominantSpeakerIndicator
                                    iconSize = { iconSize }
                                    tooltipPosition = { tooltipPosition } />
                                : null }
                        </AtlasKitThemeProvider>
                    </div>
                </div>
                <div className = 'videocontainer__toolbar'>
                    <StatusIndicators participantID = { id } />
                </div>
                <div className = 'videocontainer__hoverOverlay' />
                <div className = 'displayNameContainer'>
                    <DisplayName
                        elementID = { `participant_${id}_name` }
                        participantID = { id } />
                </div>
                <div
                    className = 'avatar-container'
                    style = { styles.avatarContainer }>
                    <Avatar
                        className = 'userAvatar'
                        participantId = { id } />
                </div>
                <div className = 'presence-label-container'>
                    <PresenceLabel
                        className = 'presence-label'
                        participantID = { id } />
                </div>
                <span className = 'remotevideomenu'>
                    {/* <AtlasKitThemeProvider mode = 'dark'>
                        <RemoteVideoMenuTriggerButton
                            initialVolumeValue = { initialVolumeValue }
                            menuPosition = { remoteMenuPosition }
                            onMenuDisplay = {this._onRemoteVideoMenuDisplay.bind(this)}
                            onRemoteControlToggle = { onRemoteControlToggle }
                            onVolumeChange = { onVolumeChange }
                            participantID = { participantID }
                            remoteControlState = { remoteControlState } />
                    </AtlasKitThemeProvider> */}
                </span>
                <span className = 'audioindicator-container'>
                    <AudioLevelIndicator audioLevel = { audioLevel } />
                </span>
            </>
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

        const { id, isFakeParticipant, local = false } = _participant;

        if (local) {
            return this._renderLocalParticipant(id);
        }

        if (isFakeParticipant) {
            return this._renderFakeParticipant(id);
        }

        return this._renderRemoteParticipant(id);
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {{
 *     _videoTrack: Object
 * }}
 */
function _mapStateToProps(state, ownProps): Object {
    const { participantID } = ownProps;


    // Only the local participant won't have id for the time when the conference is not yet joined.
    const participant = participantID ? getParticipantById(state, participantID) : getLocalParticipant(state);
    const isLocal = participant?.local ?? true;
    const _videoTrack = isLocal
        ? getLocalVideoTrack(state['features/base/tracks'])
        : getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, participantID);
    const _audioTrack = isLocal
        ? getLocalAudioTrack(state['features/base/tracks'])
        : getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.AUDIO, participantID);
    const _currentLayout = getCurrentLayout(state);
    let size = {};
    const _isGuest = state['features/base/jwt'].isGuest;


    switch (_currentLayout) {
    case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
        const {
            horizontalViewDimensions = {
                local: {},
                remote: {}
            }
        } = state['features/filmstrip'];
        const { local, remote } = horizontalViewDimensions;
        const { width, height } = isLocal ? local : remote;

        size = {
            _width: width,
            _height: height
        };

        break;
    }
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
        size = {
            _heightToWidthPercent: isLocal
                ? 100 / interfaceConfig.LOCAL_THUMBNAIL_RATIO
                : 100 / interfaceConfig.REMOTE_THUMBNAIL_RATIO
        };
        break;
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
        _isGuest,
        _videoTrack,
        _audioTrack,
        _currentLayout,
        _participant: participant,
        _participantCount: getParticipantCount(state),
        _isFilmstripOnly: interfaceConfig.filmStripOnly,
        _defaultLocalDisplayName: interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME,
        _connectionIndicatorDisabled: interfaceConfig.CONNECTION_INDICATOR_DISABLED,
        _connectionIndicatorAutoHideEnabled: interfaceConfig.CONNECTION_INDICATOR_AUTO_HIDE_ENABLED,
        _isDominantSpeakerDisabled: interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR,
        ...size
    };
}

export default connect(_mapStateToProps)(Thumbnail);
