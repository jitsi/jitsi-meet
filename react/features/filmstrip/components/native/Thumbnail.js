// @flow

import React, { useCallback } from 'react';
import { View } from 'react-native';
import type { Dispatch } from 'redux';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { openDialog } from '../../../base/dialog';
import { MEDIA_TYPE, VIDEO_TYPE } from '../../../base/media';
import {
    PARTICIPANT_ROLE,
    ParticipantView,
    getParticipantCount,
    isEveryoneModerator,
    pinParticipant,
    getParticipantByIdOrUndefined
} from '../../../base/participants';
import { Container } from '../../../base/react';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { getTrackByMediaTypeAndParticipant } from '../../../base/tracks';
import { ConnectionIndicator } from '../../../connection-indicator';
import { DisplayNameLabel } from '../../../display-name';
import { toggleToolboxVisible } from '../../../toolbox/actions.native';
import { RemoteVideoMenu } from '../../../video-menu';
import ConnectionStatusComponent from '../../../video-menu/components/native/ConnectionStatusComponent';

import AudioMutedIndicator from './AudioMutedIndicator';
import DominantSpeakerIndicator from './DominantSpeakerIndicator';
import ModeratorIndicator from './ModeratorIndicator';
import RaisedHandIndicator from './RaisedHandIndicator';
import ScreenShareIndicator from './ScreenShareIndicator';
import VideoMutedIndicator from './VideoMutedIndicator';
import styles, { AVATAR_SIZE } from './styles';
import { PureComponent } from 'react';
import { SQUARE_TILE_ASPECT_RATIO } from '../../constants';

/**
 * Thumbnail component's property types.
 */
type Props = {

    /**
     * Whether local audio (microphone) is muted or not.
     */
    _audioMuted: boolean,

    /**
     * The Redux representation of the state "features/large-video".
     */
    _largeVideo: Object,

    /**
     * The Redux representation of the participant to display.
     */
     _participant: Object,

    /**
     * Whether to show the dominant speaker indicator or not.
     */
    _renderDominantSpeakerIndicator: boolean,

    /**
     * Whether to show the moderator indicator or not.
     */
    _renderModeratorIndicator: boolean,

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

    /**
     * The Redux representation of the participant's video track.
     */
    _videoTrack: Object,

    /**
     * If true, there will be no color overlay (tint) on the thumbnail
     * indicating the participant associated with the thumbnail is displayed on
     * large video. By default there will be a tint.
     */
    disableTint?: boolean,

    /**
     * Invoked to trigger state changes in Redux.
     */
    dispatch: Dispatch<any>,

    /**
     * The ID of the participant related to the thumbnail.
     */
    participantID: ?string,

    /**
     * Whether to display or hide the display name of the participant in the thumbnail.
     */
    renderDisplayName: ?boolean,

    /**
     * Optional styling to add or override on the Thumbnail component root.
     */
    styleOverrides?: Object,

    /**
     * If true, it tells the thumbnail that it needs to behave differently. E.g. react differently to a single tap.
     */
    tileView?: boolean
};

/**
 * React component for video thumbnail.
 *
 * @param {Props} props - Properties passed to this functional component.
 * @returns {Component} - A React component.
 */
class Thumbnail extends PureComponent<Props> {

    /**
     *
     * @param {*} props
     * @returns
     */
    constructor(props: Props) {
        super(props);

        this._onClick = this._onClick.bind(this);
        this._onThumbnailLongPress = this._onThumbnailLongPress.bind(this);
    }

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

    /**
     * Thumbnail long press handler.
     *
     * @returns {void}
     */
    _onThumbnailLongPress() {
        const { _participantId, _local, dispatch } = this.props;

        if (_local) {
            dispatch(openDialog(ConnectionStatusComponent, {
                participantID: _participantId
            }));
        } else {
            dispatch(openDialog(RemoteVideoMenu, {
                participantId: _participantId
            }));
        }
    }

    /**
     *
     * @returns
     */
    render() {
        const {
            _audioMuted: audioMuted,
            _isScreenShare: isScreenShare,
            _isFakeParticipant,
            _renderDominantSpeakerIndicator: renderDominantSpeakerIndicator,
            _renderModeratorIndicator: renderModeratorIndicator,
            _participantId: participantId,
            _participantInLargeVideo: participantInLargeVideo,
            _pinned,
            _styles,
            _videoMuted: videoMuted,
            disableTint,
            height,
            index,
            renderDisplayName,
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

        console.log(`rendering thumbnail with index ${index}`);

        return (
            <Container
                onClick = { this._onClick }
                onLongPress = { this._onThumbnailLongPress }
                style = { [
                    styles.thumbnail,
                    _pinned && !tileView ? _styles.thumbnailPinned : null,
                    styleOverrides
                ] }
                touchFeedback = { false }>
                <ParticipantView
                    avatarSize = { tileView ? AVATAR_SIZE * 1.5 : AVATAR_SIZE }
                    disableVideo = { isScreenShare || _isFakeParticipant }
                    participantId = { participantId }
                    style = { _styles.participantViewStyle }
                    tintEnabled = { participantInLargeVideo && !disableTint }
                    tintStyle = { _styles.activeThumbnailTint }
                    zOrder = { 1 } />
                {
                    renderDisplayName
                        && <Container style = { styles.displayNameContainer }>
                            <DisplayNameLabel participantId = { participantId } />
                        </Container>
                }
                { renderModeratorIndicator
                    && <View style = { styles.moderatorIndicatorContainer }>
                        <ModeratorIndicator />
                    </View>
                }
                {
                    !_isFakeParticipant
                        && <View
                            style = { [
                                styles.thumbnailTopIndicatorContainer,
                                styles.thumbnailTopLeftIndicatorContainer
                            ] }>
                            <RaisedHandIndicator participantId = { participantId } />
                            { renderDominantSpeakerIndicator && <DominantSpeakerIndicator /> }
                        </View>
                }
                {
                    !_isFakeParticipant
                        && <View
                            style = { [
                                styles.thumbnailTopIndicatorContainer,
                                styles.thumbnailTopRightIndicatorContainer
                            ] }>
                            <ConnectionIndicator participantId = { participantId } />
                        </View>
                }
                {
                    !_isFakeParticipant
                        && <Container style = { styles.thumbnailIndicatorContainer }>
                            { audioMuted && <AudioMutedIndicator /> }
                            { videoMuted && <VideoMutedIndicator /> }
                            { isScreenShare && <ScreenShareIndicator /> }
                        </Container>
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
    // We need read-only access to the state of features/large-video so that the
    // filmstrip doesn't render the video of the participant who is rendered on
    // the stage i.e. as a large video.
    const largeVideo = state['features/large-video'];
    const tracks = state['features/base/tracks'];
    const { participantID } = ownProps;
    const participant = getParticipantByIdOrUndefined(state, participantID);
    const id = participant?.id;
    const audioTrack
        = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id);
    const videoTrack
        = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, id);
    const videoMuted = !videoTrack || videoTrack.muted;
    const isScreenShare = videoTrack && videoTrack.videoType === VIDEO_TYPE.DESKTOP;
    const participantCount = getParticipantCount(state);
    const renderDominantSpeakerIndicator = participant && participant.dominantSpeaker && participantCount > 2;
    const _isEveryoneModerator = isEveryoneModerator(state);
    const renderModeratorIndicator = !_isEveryoneModerator
        && participant && participant.role === PARTICIPANT_ROLE.MODERATOR;
    const participantInLargeVideo = id === largeVideo.participantId;

    return {
        _audioMuted: audioTrack?.muted ?? true,
        _isScreenShare: isScreenShare,
        _isFakeParticipant: participant.isFakeParticipant,
        _local: participant.local,
        _participantInLargeVideo: participantInLargeVideo,
        _participantId: id,
        _pinned: participant.pinned,
        _renderDominantSpeakerIndicator: renderDominantSpeakerIndicator,
        _renderModeratorIndicator: renderModeratorIndicator,
        _styles: ColorSchemeRegistry.get(state, 'Thumbnail'),
        _videoMuted: videoMuted
    };
}

export default connect(_mapStateToProps)(Thumbnail);
