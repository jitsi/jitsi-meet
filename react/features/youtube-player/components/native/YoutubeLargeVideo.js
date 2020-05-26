// @flow

import React, { useRef, useEffect } from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';
import { setSharedVideoStatus } from '../../actions';
import { connect } from '../../../base/redux';
import { getLocalParticipant } from '../../../base/participants';

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
     * The color-schemed stylesheet of the feature.
     */
    seek: string,

    enableControls: Boolean,

    /**
     * Callback to invoke when the {@code LargeVideo} is clicked/pressed.
     */
    onVideoReady: ?Function,

    onVideoChangeEvent: ?Function,

    youtubeId: string
};

const YoutubeLargeVideo = (props: Props) => {
    const playerRef = useRef(null);
    useEffect(() => {
        if(!props.isOwner) {
            playerRef.current.seekTo(props.seek);
        }
    }, [props.seek]);

    const onChangeState = e => props.onVideoChangeEvent(e, playerRef.current.getCurrentTime());
    const onReady = () => props.onVideoReady(playerRef.current.getCurrentTime())

    return (<YoutubePlayer
        height = '100%'
        initialPlayerParams = {{
            controls: props.enableControls,
            modestbranding: true
        }}
        onChangeState = { onChangeState }
        onReady = {  onReady }
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
            time.then( t => {
                if (!['playing', 'paused'].includes(status)) {
                    return;
                }
                dispatch(setSharedVideoStatus(status, t));
            } );
        },
        onVideoReady: (time) => { 
            time.then( t => { dispatch(setSharedVideoStatus('playing', t)) }) }
    }
}

/**
 * Maps (parts of) the Redux state to the associated YoutubeLargeVideo's props.
 *
 * @private
 * @returns {Props}
 */
function _mergeProps( { isOwner, ...stateProps }, { onVideoChangeEvent, onVideoReady }) {
    return Object.assign(stateProps, {
        onVideoChangeEvent: isOwner ? onVideoChangeEvent : () => {},
        onVideoReady: isOwner ? onVideoReady : () => {}
    });
}

export default connect(_mapStateToProps, _mapDispatchToProps, _mergeProps)(YoutubeLargeVideo);
