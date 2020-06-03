// @flow

import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_WIDE } from '../../../base/responsive-ui/constants';
import { setSharedVideoStatus, setToolboxVisible } from '../../actions';

import styles from './styles';

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
    isOwner: Boolean,

    /**
     * The width of the screen.
     *
     * @private
     */
    screenWidth: number,

    /**
     * The height of the screen.
     *
     * @private
     */
    screenHeight: number,

    /**
     * True if in landscape mode.
     *
     * @private
     */
    isWideScreen: Boolean,

    /**
     * Callback to invoke when { @code isWideScreen} changes.
     *
     * @private
     */
    onWideScreenChanged: Function
};

const YoutubeLargeVideo = (props: Props) => {
    const playerRef = useRef(null);

    useEffect(() => {
        if (!props.isOwner) {
            playerRef.current && playerRef.current.getCurrentTime().then(t => {
                if (props.seek - t > 0.5) {
                    playerRef.current && playerRef.current.seekTo(props.seek);
                }
            });
        }
    }, [ props.seek ]);

    useEffect(() => {
        props.onWideScreenChanged(props.isWideScreen);
    }, [ props.isWideScreen ]);

    const onChangeState = e => props.onVideoChangeEvent(e, playerRef.current && playerRef.current.getCurrentTime());
    const onReady = () => props.onVideoReady(playerRef.current && playerRef.current.getCurrentTime());

    let playerHeight, playerWidth;

    if (props.isWideScreen) {
        playerHeight = props.screenHeight;
        playerWidth = playerHeight * 16 / 9;
    } else {
        playerWidth = props.screenWidth;
        playerHeight = playerWidth * 9 / 16;
    }

    return (<View style = { styles.youtubeVideoContainer } >
        <YoutubePlayer
            height = { playerHeight }
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
            webViewProps = {{
                bounces: false,
                scrollEnabled: false
            }}
            width = { playerWidth } />
    </View>);
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
    const responsiveUi = state['features/base/responsive-ui'];
    const screenHeight = responsiveUi.clientHeight;
    const screenWidth = responsiveUi.clientWidth;

    return {
        isPlaying: status === 'playing',
        seek: time,
        enableControls: ownerId === localParticipant.id,
        isOwner: ownerId === localParticipant.id,
        isWideScreen: responsiveUi.aspectRatio === ASPECT_RATIO_WIDE,
        screenHeight,
        screenWidth
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
                dispatch(setSharedVideoStatus(translateStatus(status), t));
            });
        },
        onVideoReady: time => {
            time.then(t => dispatch(setSharedVideoStatus('playing', t)));
        },
        onWideScreenChanged: isWideScreen => {
            dispatch(setToolboxVisible(!isWideScreen));
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

/**
 * In case the status is 'paused', it is translated to 'pause' to match the web functionality.
 *
 * @param {string} status - The status of the shared video.
 * @private
 * @returns {string}
 */
function translateStatus(status) {
    if (status === 'paused') {
        return 'pause';
    }

    return status;
}

export default connect(_mapStateToProps, _mapDispatchToProps, _mergeProps)(YoutubeLargeVideo);
