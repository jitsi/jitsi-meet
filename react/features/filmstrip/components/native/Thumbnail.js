// @flow

import React, { PureComponent } from 'react';
import { Image, View } from 'react-native';
import type { Dispatch } from 'redux';

import { JitsiTrackEvents } from '../../../base/lib-jitsi-meet';
import { MEDIA_TYPE, VIDEO_TYPE } from '../../../base/media';
import {
    PARTICIPANT_ROLE,
    getLocalParticipant,
    getParticipantByIdOrUndefined,
    getParticipantCount,
    hasRaisedHand,
    isEveryoneModerator,
    isScreenShareParticipant,
    pinParticipant
} from '../../../base/participants';
import ParticipantView from '../../../base/participants/components/ParticipantView.native';
import { FakeParticipant } from '../../../base/participants/types';
import { Container } from '../../../base/react';
import { connect } from '../../../base/redux';
import {
    getTrackByMediaTypeAndParticipant,
    getVideoTrackByParticipant,
    trackStreamingStatusChanged
} from '../../../base/tracks';
import { ConnectionIndicator } from '../../../connection-indicator';
import { DisplayNameLabel } from '../../../display-name';
import { getGifDisplayMode, getGifForParticipant } from '../../../gifs/functions';
import {
    showContextMenuDetails,
    showSharedVideoMenu
} from '../../../participants-pane/actions.native';
import { toggleToolboxVisible } from '../../../toolbox/actions.native';
import { SQUARE_TILE_ASPECT_RATIO } from '../../constants';

import AudioMutedIndicator from './AudioMutedIndicator';
import ModeratorIndicator from './ModeratorIndicator';
import PinnedIndicator from './PinnedIndicator';
import RaisedHandIndicator from './RaisedHandIndicator';
import ScreenShareIndicator from './ScreenShareIndicator';
import styles, { AVATAR_SIZE } from './styles';

/**
 * Thumbnail component's property types.
 */
type Props = {

    /**
     * Whether local audio (microphone) is muted or not.
     */
    _audioMuted: boolean,

    /**
     * URL of GIF sent by this participant, null if there's none.
     */
    _gifSrc: ?string,

    /**
     * The type of participant if the participant is fake.
     */
    _fakeParticipant?: FakeParticipant,

    /**
     * Indicates whether the participant is screen sharing.
     */
    _isScreenShare: boolean,

    /**
     * Indicates whether the thumbnail is for a virtual screenshare participant.
     */
    _isVirtualScreenshare: boolean,

    /**
     * Indicates whether the participant is local.
     */
    _local: boolean,

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean,

    /**
     * The ID of the participant obtain from the participant object in Redux.
     *
     * NOTE: Generally it should be the same as the participantID prop except the case where the passed
     * participantID doesn't correspond to any of the existing participants.
     */
    _participantId: string,

    /**
     * Indicates whether the participant is pinned or not.
     */
    _pinned: boolean,

    /**
     * Whether or not the participant has the hand raised.
     */
    _raisedHand: boolean,

    /**
     * Whether to show the dominant speaker indicator or not.
     */
    _renderDominantSpeakerIndicator: boolean,

    /**
     * Whether to show the moderator indicator or not.
     */
    _renderModeratorIndicator: boolean,

    /**
     * The video track that will be displayed in the thumbnail.
     */
    _videoTrack: ?Object,

    /**
     * Invoked to trigger state changes in Redux.
     */
    dispatch: Dispatch<any>,

    /**
     * The height of the thumnail.
     */
    height: ?number,

    /**
     * The ID of the participant related to the thumbnail.
     */
    participantID: ?string,

    /**
     * Whether to display or hide the display name of the participant in the thumbnail.
     */
    renderDisplayName: ?boolean,

    /**
     * If true, it tells the thumbnail that it needs to behave differently. E.g. React differently to a single tap.
     */
    tileView?: boolean
};

/**
 * React component for video thumbnail.
 */
class Thumbnail extends PureComponent<Props> {

    /**
     * Creates new Thumbnail component.
     *
     * @param {Props} props - The props of the component.
     * @returns {Thumbnail}
     */
    constructor(props: Props) {
        super(props);

        this._onClick = this._onClick.bind(this);
        this._onThumbnailLongPress = this._onThumbnailLongPress.bind(this);
        this.handleTrackStreamingStatusChanged = this.handleTrackStreamingStatusChanged.bind(this);
    }

    _onClick: () => void;

    /**
     * Thumbnail click handler.
     *
     * @returns {void}
     */
    _onClick() {
        const { _participantId, _pinned, dispatch, tileView } = this.props;

        if (tileView) {
            dispatch(toggleToolboxVisible());
        } else {
            dispatch(pinParticipant(_pinned ? null : _participantId));
        }
    }

    _onThumbnailLongPress: () => void;

    /**
     * Thumbnail long press handler.
     *
     * @returns {void}
     */
    _onThumbnailLongPress() {
        const { _fakeParticipant, _participantId, _local, _localVideoOwner, dispatch } = this.props;

        if (_fakeParticipant && _localVideoOwner) {
            dispatch(showSharedVideoMenu(_participantId));
        }

        if (!_fakeParticipant) {
            dispatch(showContextMenuDetails(_participantId, _local));
        }
    }

    /**
     * Renders the indicators for the thumbnail.
     *
     * @returns {ReactElement}
     */
    _renderIndicators() {
        const {
            _audioMuted: audioMuted,
            _fakeParticipant,
            _isScreenShare: isScreenShare,
            _isVirtualScreenshare,
            _renderModeratorIndicator: renderModeratorIndicator,
            _participantId: participantId,
            _pinned,
            renderDisplayName,
            tileView
        } = this.props;
        const indicators = [];

        if (!_fakeParticipant || _isVirtualScreenshare) {
            indicators.push(<View
                key = 'top-left-indicators'
                style = { [
                    styles.thumbnailTopIndicatorContainer,
                    styles.thumbnailTopLeftIndicatorContainer
                ] }>
                { !_isVirtualScreenshare && <ConnectionIndicator participantId = { participantId } /> }
                { !_isVirtualScreenshare && <RaisedHandIndicator participantId = { participantId } /> }
                {tileView && isScreenShare && (
                    <View style = { styles.indicatorContainer }>
                        <ScreenShareIndicator />
                    </View>
                )}
            </View>);
            indicators.push(<Container
                key = 'bottom-indicators'
                style = { styles.thumbnailIndicatorContainer }>
                <Container style = { (audioMuted || renderModeratorIndicator) && styles.bottomIndicatorsContainer }>
                    { audioMuted && !_isVirtualScreenshare && <AudioMutedIndicator /> }
                    { !tileView && _pinned && <PinnedIndicator />}
                    { renderModeratorIndicator && !_isVirtualScreenshare && <ModeratorIndicator />}
                    { !tileView && (isScreenShare || _isVirtualScreenshare) && <ScreenShareIndicator /> }
                </Container>
                {
                    renderDisplayName && <DisplayNameLabel
                        contained = { true }
                        participantId = { participantId } />
                }
            </Container>);
        }

        return indicators;
    }

    /**
     * Starts listening for track streaming status updates after the initial render.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        // Listen to track streaming status changed event to keep it updated.
        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (_videoTrack && !_videoTrack.local) {
            _videoTrack.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                this.handleTrackStreamingStatusChanged);
            dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                _videoTrack.jitsiTrack.getTrackStreamingStatus()));
        }
    }

    /**
     * Stops listening for track streaming status updates on the old track and starts listening instead on the new
     * track.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: Props) {
        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (prevProps._videoTrack?.jitsiTrack?.getSourceName() !== _videoTrack?.jitsiTrack?.getSourceName()) {
            if (prevProps._videoTrack && !prevProps._videoTrack.local) {
                prevProps._videoTrack.jitsiTrack.off(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    this.handleTrackStreamingStatusChanged);
                dispatch(trackStreamingStatusChanged(prevProps._videoTrack.jitsiTrack,
                    prevProps._videoTrack.jitsiTrack.getTrackStreamingStatus()));
            }
            if (_videoTrack && !_videoTrack.local) {
                _videoTrack.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    this.handleTrackStreamingStatusChanged);
                dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                    _videoTrack.jitsiTrack.getTrackStreamingStatus()));
            }
        }
    }

    /**
     * Remove listeners for track streaming status update.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (_videoTrack && !_videoTrack.local) {
            _videoTrack.jitsiTrack.off(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                this.handleTrackStreamingStatusChanged);
            dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                _videoTrack.jitsiTrack.getTrackStreamingStatus()));
        }
    }

    /**
     * Handle track streaming status change event by by dispatching an action to update track streaming status for the
     * given track in app state.
     *
     * @param {JitsiTrack} jitsiTrack - The track with streaming status updated.
     * @param {JitsiTrackStreamingStatus} streamingStatus - The updated track streaming status.
     * @returns {void}
     */
    handleTrackStreamingStatusChanged(jitsiTrack, streamingStatus) {
        this.props.dispatch(trackStreamingStatusChanged(jitsiTrack, streamingStatus));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _fakeParticipant,
            _gifSrc,
            _isScreenShare: isScreenShare,
            _isVirtualScreenshare,
            _participantId: participantId,
            _raisedHand,
            _renderDominantSpeakerIndicator,
            height,
            tileView
        } = this.props;
        const styleOverrides = tileView ? {
            aspectRatio: SQUARE_TILE_ASPECT_RATIO,
            flex: 0,
            height,
            maxHeight: null,
            maxWidth: null,
            width: null
        } : null;

        return (
            <Container
                onClick = { this._onClick }
                onLongPress = { this._onThumbnailLongPress }
                style = { [
                    styles.thumbnail,
                    styleOverrides,
                    _raisedHand && !_isVirtualScreenshare ? styles.thumbnailRaisedHand : null,
                    _renderDominantSpeakerIndicator && !_isVirtualScreenshare ? styles.thumbnailDominantSpeaker : null
                ] }
                touchFeedback = { false }>
                {_gifSrc ? <Image
                    source = {{ uri: _gifSrc }}
                    style = { styles.thumbnailGif } />
                    : <>
                        <ParticipantView
                            avatarSize = { tileView ? AVATAR_SIZE * 1.5 : AVATAR_SIZE }
                            disableVideo = { isScreenShare || _fakeParticipant }
                            participantId = { participantId }
                            zOrder = { 1 } />
                        {
                            this._renderIndicators()
                        }
                    </>
                }
            </Container>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Props} ownProps - Properties of component.
 * @returns {Object}
 */
function _mapStateToProps(state, ownProps) {
    const { ownerId } = state['features/shared-video'];
    const tracks = state['features/base/tracks'];
    const { participantID, tileView } = ownProps;
    const participant = getParticipantByIdOrUndefined(state, participantID);
    const localParticipantId = getLocalParticipant(state).id;
    const id = participant?.id;
    const audioTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id);
    const videoTrack = getVideoTrackByParticipant(state, participant);
    const isScreenShare = videoTrack?.videoType === VIDEO_TYPE.DESKTOP;
    const participantCount = getParticipantCount(state);
    const renderDominantSpeakerIndicator = participant && participant.dominantSpeaker && participantCount > 2;
    const _isEveryoneModerator = isEveryoneModerator(state);
    const renderModeratorIndicator = tileView && !_isEveryoneModerator
        && participant?.role === PARTICIPANT_ROLE.MODERATOR;
    const { gifUrl: gifSrc } = getGifForParticipant(state, id);
    const mode = getGifDisplayMode(state);

    return {
        _audioMuted: audioTrack?.muted ?? true,
        _fakeParticipant: participant?.fakeParticipant,
        _gifSrc: mode === 'chat' ? null : gifSrc,
        _isScreenShare: isScreenShare,
        _isVirtualScreenshare: isScreenShareParticipant(participant),
        _local: participant?.local,
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _participantId: id,
        _pinned: participant?.pinned,
        _raisedHand: hasRaisedHand(participant),
        _renderDominantSpeakerIndicator: renderDominantSpeakerIndicator,
        _renderModeratorIndicator: renderModeratorIndicator,
        _videoTrack: videoTrack
    };
}

export default connect(_mapStateToProps)(Thumbnail);
