// @flow

import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React, { Component } from 'react';

import { AudioLevelIndicator } from '../../../audio-level-indicator';
import { Avatar } from '../../../base/avatar';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import { MEDIA_TYPE, VideoTrack } from '../../../base/media';
import AudioTrack from '../../../base/media/components/web/AudioTrack';
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
import { RemoteVideoMenuTriggerButton } from '../../../remote-video-menu';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';

const JitsiTrackEvents = JitsiMeetJS.events.track;

declare var interfaceConfig: Object;


/**
 * The type of the React {@code Component} state of {@link Thumbnail}.
 */
type State = {

    /**
     * The current audio level value for the Thumbnail.
     */
    audioLevel: number,

    /**
     * The current volume setting for the Thumbnail.
     */
    volume: ?number
};

/**
 * The type of the React {@code Component} props of {@link Thumbnail}.
 */
type Props = {

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
     * Indicates whether the profile functionality is disabled.
     */
    _disableProfile: boolean,

    /**
     * The height of the Thumbnail.
     */
    _height: number,

    /**
     * The aspect ratio of the Thumbnail in percents.
     */
    _heightToWidthPercent: number,

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
     * The number of participants in the call.
     */
    _participantCount: number,

    /**
     * Indicates whether the "start silent" mode is enabled.
     */
    _startSilent: Boolean,

     /**
     * The video track that will be displayed in the thumbnail.
     */
    _videoTrack: ?Object,

    /**
     * The width of the thumbnail.
     */
    _width: number,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * Indicates whether the thumbnail is hovered or not.
     */
    isHovered: ?boolean,

    /**
     * The ID of the participant related to the thumbnail.
     */
    participantID: ?string
};

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
            audioLevel: 0,
            volume: undefined
        };

        this._updateAudioLevel = this._updateAudioLevel.bind(this);
        this._onVolumeChange = this._onVolumeChange.bind(this);
        this._onInitialVolumeSet = this._onInitialVolumeSet.bind(this);
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
     * Returns an object with the styles for thumbnail.
     *
     * @returns {Object} - The styles for the thumbnail.
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
     * Renders a fake participant (youtube video) thumbnail.
     *
     * @param {string} id - The id of the participant.
     * @returns {ReactElement}
     */
    _renderFakeParticipant() {
        const { _participant } = this.props;
        const { id } = _participant;

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
     * Renders the top indicators of the thumbnail.
     *
     * @returns {Component}
     */
    _renderTopIndicators() {
        const {
            _connectionIndicatorAutoHideEnabled,
            _connectionIndicatorDisabled,
            _currentLayout,
            _isDominantSpeakerDisabled,
            _indicatorIconSize: iconSize,
            _participant,
            _participantCount,
            isHovered
        } = this.props;
        const showConnectionIndicator = isHovered || !_connectionIndicatorAutoHideEnabled;
        const { id, local = false, dominantSpeaker = false } = _participant;
        const showDominantSpeaker = !_isDominantSpeakerDisabled && dominantSpeaker;
        let statsPopoverPosition, tooltipPosition;

        switch (_currentLayout) {
        case LAYOUTS.TILE_VIEW:
            statsPopoverPosition = 'right-start';
            tooltipPosition = 'right';
            break;
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            statsPopoverPosition = 'left-start';
            tooltipPosition = 'left';
            break;
        default:
            statsPopoverPosition = 'auto';
            tooltipPosition = 'top';
        }

        return (
            <div>
                <AtlasKitThemeProvider mode = 'dark'>
                    { !_connectionIndicatorDisabled
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
                    { showDominantSpeaker && _participantCount > 2
                        && <DominantSpeakerIndicator
                            iconSize = { iconSize }
                            tooltipPosition = { tooltipPosition } />
                    }
                </AtlasKitThemeProvider>
            </div>);
    }

    /**
     * Renders the avatar.
     *
     * @returns {ReactElement}
     */
    _renderAvatar() {
        const { _participant } = this.props;
        const { id } = _participant;
        const styles = this._getStyles();

        return (
            <div
                className = 'avatar-container'
                style = { styles.avatarContainer }>
                <Avatar
                    className = 'userAvatar'
                    participantId = { id } />
            </div>
        );
    }

    /**
     * Renders the local participant's thumbnail.
     *
     * @returns {ReactElement}
     */
    _renderLocalParticipant() {
        const {
            _defaultLocalDisplayName,
            _disableProfile,
            _participant,
            _videoTrack
        } = this.props;
        const { id } = _participant || {};
        const { audioLevel } = this.state;


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
                    { this._renderTopIndicators() }
                </div>
                <div className = 'videocontainer__hoverOverlay' />
                <div className = 'displayNameContainer'>
                    <DisplayName
                        allowEditing = { !_disableProfile }
                        displayNameSuffix = { _defaultLocalDisplayName }
                        elementID = 'localDisplayName'
                        participantID = { id } />
                </div>
                { this._renderAvatar() }
                <span className = 'audioindicator-container'>
                    <AudioLevelIndicator audioLevel = { audioLevel } />
                </span>
            </>
        );
    }


    /**
     * Renders a remote participant's 'thumbnail.
     *
     * @returns {ReactElement}
     */
    _renderRemoteParticipant() {
        const {
            _audioTrack,
            _participant,
            _startSilent
        } = this.props;
        const { id } = _participant;
        const { audioLevel, volume } = this.state;

        // hide volume when in silent mode
        const onVolumeChange = _startSilent ? undefined : this._onVolumeChange;
        const jitsiTrack = _audioTrack?.jitsiTrack;
        const audioTrackId = jitsiTrack && jitsiTrack.getId();

        return (
            <>
                {
                    _audioTrack
                        ? <AudioTrack
                            audioTrack = { _audioTrack }
                            id = { `remoteAudio_${audioTrackId || ''}` }
                            muted = { _startSilent }
                            onInitialVolumeSet = { this._onInitialVolumeSet }
                            volume = { this.state.volume } />
                        : null

                }
                <div className = 'videocontainer__background' />
                <div className = 'videocontainer__toptoolbar'>
                    { this._renderTopIndicators() }
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
                { this._renderAvatar() }
                <div className = 'presence-label-container'>
                    <PresenceLabel
                        className = 'presence-label'
                        participantID = { id } />
                </div>
                <span className = 'remotevideomenu'>
                    <AtlasKitThemeProvider mode = 'dark'>
                        <RemoteVideoMenuTriggerButton
                            initialVolumeValue = { volume }
                            onVolumeChange = { onVolumeChange }
                            participantID = { id } />
                    </AtlasKitThemeProvider>
                </span>
                <span className = 'audioindicator-container'>
                    <AudioLevelIndicator audioLevel = { audioLevel } />
                </span>
            </>
        );
    }

    _onInitialVolumeSet: Object => void;

    /**
     * A handler for the initial volume value of the audio element.
     *
     * @param {number} volume - Properties of the audio element.
     * @returns {void}
     */
    _onInitialVolumeSet(volume) {
        if (this.state.volume !== volume) {
            this.setState({ volume });
        }
    }

    _onVolumeChange: number => void;

    /**
     * Handles volume changes.
     *
     * @param {number} value - The new value for the volume.
     * @returns {void}
     */
    _onVolumeChange(value) {
        this.setState({ volume: value });
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
    const _videoTrack = isLocal
        ? getLocalVideoTrack(state['features/base/tracks'])
        : getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, participantID);
    const _audioTrack = isLocal
        ? getLocalAudioTrack(state['features/base/tracks'])
        : getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.AUDIO, participantID);
    const _currentLayout = getCurrentLayout(state);
    let size = {};
    const { startSilent, disableProfile = false } = state['features/base/config'];
    const { NORMAL = 8 } = interfaceConfig.INDICATOR_FONT_SIZES || {};


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
        _audioTrack,
        _connectionIndicatorAutoHideEnabled: interfaceConfig.CONNECTION_INDICATOR_AUTO_HIDE_ENABLED,
        _connectionIndicatorDisabled: interfaceConfig.CONNECTION_INDICATOR_DISABLED,
        _currentLayout,
        _defaultLocalDisplayName: interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME,
        _disableProfile: disableProfile,
        _isDominantSpeakerDisabled: interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR,
        _indicatorIconSize: NORMAL,
        _participant: participant,
        _participantCount: getParticipantCount(state),
        _startSilent: Boolean(startSilent),
        _videoTrack,
        ...size
    };
}

export default connect(_mapStateToProps)(Thumbnail);
