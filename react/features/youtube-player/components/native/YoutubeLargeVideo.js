// @flow

import React, { useRef, useEffect } from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';

import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { setSharedVideoStatus } from '../../actions';

/**
 * The type of the React {@link Component} props of {@link YoutubeLargeVideo}.
 */
type Props = {

    /**
     * The ID of the participant (to be) depicted by LargeVideo.
     *
     * @private
     */
    isPlaying: string,

    /**
     * Seek time in seconds.
     *
     * @private
     */
    seek: string,

    /**
     * Display the youtube controls on the player.
     *
     * @private
     */
    enableControls: Boolean,

    /**
     * Callback to invoke when the {@code YoutLargeVideo} is ready to play.
     *
     * @private
     */
    onVideoReady: Function,

    /**
     * Callback to invoke when the {@code YoutubeLargeVideo} changes status.
     *
     * @private
     */
    onVideoChangeEvent: Function,

    /**
     * Youtube id of the video to be played.
     *
     * @private
     */
    youtubeId: string,

    /**
     * Is the video shared by the local user.
     *
     * @private
     */
    isOwner: Boolean
};

const YoutubeLargeVideo = (props: Props) => {
    const playerRef = useRef(null);

    useEffect(() => {
        if (!props.isOwner) {
            playerRef.current && playerRef.current.seekTo(props.seek);
        }
    }, [ props.seek ]);

    const onChangeState = e => props.onVideoChangeEvent(e, playerRef.current && playerRef.current.getCurrentTime());
    const onReady = () => props.onVideoReady(playerRef.current && playerRef.current.getCurrentTime());

    return (<YoutubePlayer
        height = '100%'
        initialPlayerParams = {{
            controls: props.enableControls,
            modestbranding: true
        }}
        /* eslint-disable react/jsx-no-bind */
        onChangeState = { onChangeState }
        /* eslint-disable react/jsx-no-bind */
        onReady = { onReady }
        play = { props.isPlaying }
        playbackRate = { 1 }
        ref = { playerRef }
        videoId = { props.youtubeId }
        volume = { 50 }
        width = '100%' />);
};

/**
 * Maps (parts of) the Redux state to the associated YoutubeLargeVideo's props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { ownerId, status, time } = state['features/youtube-player'];
    const localParticipant = getLocalParticipant(state);

    return {
        isPlaying: status === 'playing',
        seek: time,
        enableControls: ownerId === localParticipant.id,
        isOwner: ownerId === localParticipant.id
    };
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {{
 *     onVideoChangeEvent: Function,
 *     onVideoReady: Function
 * }}
 */
function _mapDispatchToProps(dispatch) {
    return {
        onVideoChangeEvent: (status, time) => {
            time.then(t => {
                if (![ 'playing', 'paused' ].includes(status)) {
                    return;
                }
                dispatch(setSharedVideoStatus(status, t));
            });
        },
        onVideoReady: time => {
            time.then(t => dispatch(setSharedVideoStatus('playing', t)));
        }
    };
}

/**
 * Maps (parts of) the Redux state to the associated YoutubeLargeVideo's props.
 *
 * @private
 * @returns {Props}
 */
function _mergeProps({ isOwner, ...stateProps }, { onVideoChangeEvent, onVideoReady }) {
    return Object.assign(stateProps, {
        onVideoChangeEvent: isOwner ? onVideoChangeEvent : () => { /* do nothing */ },
        onVideoReady: isOwner ? onVideoReady : () => { /* do nothing */ }
    });
}

export default connect(_mapStateToProps, _mapDispatchToProps, _mergeProps)(YoutubeLargeVideo);
