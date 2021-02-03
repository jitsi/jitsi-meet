// @flow

import React from 'react';
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
    pinParticipant
} from '../../../base/participants';
import { Container } from '../../../base/react';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { getTrackByMediaTypeAndParticipant } from '../../../base/tracks';
import { ConnectionIndicator } from '../../../connection-indicator';
import { DisplayNameLabel } from '../../../display-name';
import { RemoteVideoMenu } from '../../../remote-video-menu';
import ConnectionStatusComponent from '../../../remote-video-menu/components/native/ConnectionStatusComponent';
import { toggleToolboxVisible } from '../../../toolbox/actions.native';

import AudioMutedIndicator from './AudioMutedIndicator';
import DominantSpeakerIndicator from './DominantSpeakerIndicator';
import ModeratorIndicator from './ModeratorIndicator';
import RaisedHandIndicator from './RaisedHandIndicator';
import ScreenShareIndicator from './ScreenShareIndicator';
import VideoMutedIndicator from './VideoMutedIndicator';
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
     * The Redux representation of the state "features/large-video".
     */
    _largeVideo: Object,

    /**
     * Handles click/tap event on the thumbnail.
     */
    _onClick: ?Function,

    /**
     * Handles long press on the thumbnail.
     */
    _onThumbnailLongPress: ?Function,

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
     * The Redux representation of the participant to display.
     */
    participant: Object,

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
function Thumbnail(props: Props) {
    const {
        _audioMuted: audioMuted,
        _largeVideo: largeVideo,
        _onClick,
        _onThumbnailLongPress,
        _renderDominantSpeakerIndicator: renderDominantSpeakerIndicator,
        _renderModeratorIndicator: renderModeratorIndicator,
        _styles,
        _videoTrack: videoTrack,
        disableTint,
        participant,
        renderDisplayName,
        tileView
    } = props;

    const participantId = participant.id;
    const participantInLargeVideo
        = participantId === largeVideo.participantId;
    const videoMuted = !videoTrack || videoTrack.muted;
    const isScreenShare = videoTrack && videoTrack.videoType === VIDEO_TYPE.DESKTOP;

    return (
        <Container
            onClick = { _onClick }
            onLongPress = { _onThumbnailLongPress }
            style = { [
                styles.thumbnail,
                participant.pinned && !tileView
                    ? _styles.thumbnailPinned : null,
                props.styleOverrides || null
            ] }
            touchFeedback = { false }>

            <ParticipantView
                avatarSize = { tileView ? AVATAR_SIZE * 1.5 : AVATAR_SIZE }
                disableVideo = { isScreenShare || participant.isFakeParticipant }
                participantId = { participantId }
                style = { _styles.participantViewStyle }
                tintEnabled = { participantInLargeVideo && !disableTint }
                tintStyle = { _styles.activeThumbnailTint }
                zOrder = { 1 } />

            { renderDisplayName && <Container style = { styles.displayNameContainer }>
                <DisplayNameLabel participantId = { participantId } />
            </Container> }

            { renderModeratorIndicator
                && <View style = { styles.moderatorIndicatorContainer }>
                    <ModeratorIndicator />
                </View>}

            { !participant.isFakeParticipant && <View
                style = { [
                    styles.thumbnailTopIndicatorContainer,
                    styles.thumbnailTopLeftIndicatorContainer
                ] }>
                <RaisedHandIndicator participantId = { participant.id } />
                { renderDominantSpeakerIndicator && <DominantSpeakerIndicator /> }
            </View> }

            { !participant.isFakeParticipant && <View
                style = { [
                    styles.thumbnailTopIndicatorContainer,
                    styles.thumbnailTopRightIndicatorContainer
                ] }>
                <ConnectionIndicator participantId = { participant.id } />
            </View> }

            { !participant.isFakeParticipant && <Container style = { styles.thumbnailIndicatorContainer }>
                { audioMuted
                    && <AudioMutedIndicator /> }
                { videoMuted
                    && <VideoMutedIndicator /> }
                { isScreenShare
                    && <ScreenShareIndicator /> }
            </Container> }

        </Container>
    );
}

/**
 * Maps part of redux actions to component's props.
 *
 * @param {Function} dispatch - Redux's {@code dispatch} function.
 * @param {Props} ownProps - The own props of the component.
 * @returns {{
 *     _onClick: Function,
 *     _onShowRemoteVideoMenu: Function
 * }}
 */
function _mapDispatchToProps(dispatch: Function, ownProps): Object {
    return {
        /**
         * Handles click/tap event on the thumbnail.
         *
         * @protected
         * @returns {void}
         */
        _onClick() {
            const { participant, tileView } = ownProps;

            if (tileView) {
                dispatch(toggleToolboxVisible());
            } else {
                dispatch(pinParticipant(participant.pinned ? null : participant.id));
            }
        },

        /**
         * Handles long press on the thumbnail.
         *
         * @returns {void}
         */
        _onThumbnailLongPress() {
            const { participant } = ownProps;

            if (participant.local) {
                dispatch(openDialog(ConnectionStatusComponent, {
                    participantID: participant.id
                }));
            } else {
                dispatch(openDialog(RemoteVideoMenu, {
                    participant
                }));
            }
        }
    };
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
    const { participant } = ownProps;
    const id = participant.id;
    const audioTrack
        = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id);
    const videoTrack
        = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, id);
    const participantCount = getParticipantCount(state);
    const renderDominantSpeakerIndicator = participant.dominantSpeaker && participantCount > 2;
    const _isEveryoneModerator = isEveryoneModerator(state);
    const renderModeratorIndicator = !_isEveryoneModerator && participant.role === PARTICIPANT_ROLE.MODERATOR;

    return {
        _audioMuted: audioTrack?.muted ?? true,
        _largeVideo: largeVideo,
        _renderDominantSpeakerIndicator: renderDominantSpeakerIndicator,
        _renderModeratorIndicator: renderModeratorIndicator,
        _styles: ColorSchemeRegistry.get(state, 'Thumbnail'),
        _videoTrack: videoTrack
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(Thumbnail);
