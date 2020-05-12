// @flow
import React, { useRef, useEffect } from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';
import { setSharedVideoStatus } from '../../actions';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { getLocalParticipant } from '../../../base/participants';

type YoutubeLargeVideoProps = {
    youtubeId: string
}

const YoutubeLargeVideo = React.forwardRef(({ isPlaying, youtubeId, enableControls }, playerRef) => {

    return (<YoutubePlayer
        height = '100%'
        initialPlayerParams = {{
            controls: enableControls,
            modestbranding: true
        }}
        onChangeState = {  e => onVideoChangeEvent(e, playerRef) }
        onReady = { onVideoReady() }
        play = { isPlaying }
        playbackRate = { 1 }
        ref = { playerRef }
        videoId = { youtubeId }
        volume = { 50 }
        width = '100%' />);
});

const ConnectedYoutubeLargeVideo = ({ youtubeId }: YoutubeLargeVideoProps) => {
    const playerRef = useRef(null);
    const isPlaying = useSelector(state => getIsPlaying(state));
    const seek = useSelector(state => getSeek(state));
    const enableControls = useSelector(state => shouldEnableControls(state));

    useEffect(() => {
        playerRef.current.seekTo(seek);
    });

    return (<YoutubeLargeVideo
        enableControls = { enableControls }
        isPlaying = { isPlaying }
        ref = { playerRef }
        youtubeId = { youtubeId } />);
};

export default ConnectedYoutubeLargeVideo;

/**
 * Dispatches video status 'playing' if the local user is the one sharing the video.
 *
 * @private
 * @param {string} dispatch - Todo add doc.
 * @param {string} store - Todo add doc.
 * @returns {void}
 */
function onVideoReady() {
    const dispatch = useDispatch();
    const state = useStore().getState();

    const { ownerId } = state['features/youtube-player'];
    const localParticipantId = getLocalParticipant(state).id;

    if (ownerId === localParticipantId) {
        dispatch(setSharedVideoStatus('playing'));
    }
}

/**
 * Dispatches video status 'playing' if the local user is the one sharing the video.
 *
 * @private
 * @param {string} event - Todo add doc.
 * @param {string} playerRef - Todo add doc.
 * @returns {void}
 */
function onVideoChangeEvent(event, playerRef) {
    const dispatch = useDispatch();
    const state = useStore().getState();
    const { ownerId } = state['features/youtube-player'];
    const localParticipantId = getLocalParticipant(state).id;

    if (ownerId === localParticipantId) {
        switch (event) {
        case 'playing':
            dispatch(setSharedVideoStatus('playing', playerRef.current.getCurrentTime()));
            break;
        case 'paused':
            dispatch(setSharedVideoStatus('paused', playerRef.current.getCurrentTime()));
            break;
        }
    }
}

/**
 * Dispatches video status 'playing' if the local user is the one sharing the video.
 *
 * @private
 * @param {string} state - Todo add doc.
 * @returns {string}
 */
function getIsPlaying(state) {
    const { status } = state['features/youtube-player'];

    return status === 'playing';
}

/**
 * Dispatches video status 'playing' if the local user is the one sharing the video.
 *
 * @private
 * @param {string} state - Todo add doc.
 * @returns {string}
 */
function getSeek(state) {

    return state['features/youtube-player'].time;
}

/**
 * Dispatches video status 'playing' if the local user is the one sharing the video.
 *
 * @private
 * @param {string} state - Todo add doc.
 * @returns {boolean}
 */
function shouldEnableControls(state) {
    const { ownerId } = state['features/youtube-player'];
    const localParticipant = getLocalParticipant(state);

    return ownerId === localParticipant.id;
}
