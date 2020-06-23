// @flow

import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_WIDE } from '../../../base/responsive-ui/constants';
import { setToolboxVisible } from '../../../toolbox/actions';
import { setSharedVideoStatus } from '../../actions';

import styles from './styles';

/**
 * Passed to the webviewProps in order to avoid the usage of the ios player on which we cannot hide the controls.
 *
 * @private
 */
const webviewUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36'; // eslint-disable-line max-len

/**
 * The type of the React {@link Component} props of {@link YoutubeLargeVideo}.
 */
type Props = {

    /**
     * Display the youtube controls on the player.
     *
     * @private
     */
    _enableControls: boolean,

    /**
     * Is the video shared by the local user.
     *
     * @private
     */
    _isOwner: boolean,

    /**
     * The ID of the participant (to be) depicted by LargeVideo.
     *
     * @private
     */
    _isPlaying: string,

    /**
     * Set to true when the status is set to stop and the view should not react to further changes.
     *
     * @private
     */
    _isStopped: boolean,

    /**
     * True if in landscape mode.
     *
     * @private
     */
    _isWideScreen: boolean,

    /**
     * Callback to invoke when the {@code YoutLargeVideo} is ready to play.
     *
     * @private
     */
    _onVideoReady: Function,

    /**
     * Callback to invoke when the {@code YoutubeLargeVideo} changes status.
     *
     * @private
     */
    _onVideoChangeEvent: Function,

    /**
     * Callback to invoke when { @code isWideScreen} changes.
     *
     * @private
     */
    _onWideScreenChanged: Function,

    /**
     * The id of the participant sharing the video.
     *
     * @private
     */
    _ownerId: string,

    /**
     * The height of the screen.
     *
     * @private
     */
    _screenHeight: number,

    /**
     * The width of the screen.
     *
     * @private
     */
    _screenWidth: number,

    /**
     * Seek time in seconds.
     *
     * @private
     */
    _seek: number,

    /**
     * Youtube id of the video to be played.
     *
     * @private
     */
    youtubeId: string
};

const YoutubeLargeVideo = (props: Props) => {
    const playerRef = useRef(null);

    useEffect(() => {
        playerRef.current && playerRef.current.getCurrentTime().then(time => {
            const { _seek } = props;

            if (shouldSeekToPosition(_seek, time)) {
                playerRef.current && playerRef.current.seekTo(_seek);
            }
        });
    }, [ props._seek ]);

    useEffect(() => {
        props._onWideScreenChanged(props._isWideScreen);
    }, [ props._isWideScreen ]);

    const onChangeState = e =>
        playerRef.current && playerRef.current.getCurrentTime().then(time => {
            const {
                _isOwner,
                _isPlaying,
                _isStopped,
                _seek
            } = props;

            if (shouldSetNewStatus(_isStopped, _isOwner, e, _isPlaying, time, _seek)) {
                props._onVideoChangeEvent(props.youtubeId, e, time, props._ownerId);
            }
        });
    const onReady = () => {
        if (props._isOwner) {
            props._onVideoReady(
                props.youtubeId,
                playerRef.current && playerRef.current.getCurrentTime(),
                props._ownerId);
        }
    };

    let playerHeight, playerWidth;

    if (props._isWideScreen) {
        playerHeight = props._screenHeight;
        playerWidth = playerHeight * 16 / 9;
    } else {
        playerWidth = props._screenWidth;
        playerHeight = playerWidth * 9 / 16;
    }

    return (
        <View
            pointerEvents = { props._enableControls ? 'auto' : 'none' }
            style = { styles.youtubeVideoContainer } >
            <YoutubePlayer
                height = { playerHeight }
                initialPlayerParams = {{
                    controls: props._enableControls,
                    modestbranding: true,
                    preventFullScreen: true
                }}
                /* eslint-disable react/jsx-no-bind */
                onChangeState = { onChangeState }
                /* eslint-disable react/jsx-no-bind */
                onReady = { onReady }
                play = { props._isPlaying }
                playbackRate = { 1 }
                ref = { playerRef }
                videoId = { props.youtubeId }
                volume = { 50 }
                webViewProps = {{
                    bounces: false,
                    mediaPlaybackRequiresUserAction: false,
                    scrollEnabled: false,
                    userAgent: webviewUserAgent
                }}
                width = { playerWidth } />
        </View>);
};

/* eslint-disable max-params */

/**
 * Return true if the user is the owner and
 * the status has changed or the seek time difference from the previous set is larger than 5 seconds.
 *
 * @param {boolean} isStopped - Once the status was set to stop, all the other statuses should be ignored.
 * @param {boolean} isOwner - Whether the local user is sharing the video.
 * @param {string} status - The new status.
 * @param {boolean} isPlaying - Whether the component is playing at the moment.
 * @param {number} newTime - The new seek time.
 * @param {number} previousTime - The old seek time.
 * @private
 * @returns {boolean}
*/
function shouldSetNewStatus(isStopped, isOwner, status, isPlaying, newTime, previousTime) {
    if (isStopped) {
        return false;
    }

    if (!isOwner || status === 'buffering') {
        return false;
    }

    if ((isPlaying && status === 'paused') || (!isPlaying && status === 'playing')) {
        return true;
    }

    return shouldSeekToPosition(newTime, previousTime);
}

/**
 * Return true if the diffenrece between the two timees is larger than 5.
 *
 * @param {number} newTime - The current time.
 * @param {number} previousTime - The previous time.
 * @private
 * @returns {boolean}
*/
function shouldSeekToPosition(newTime, previousTime) {
    return Math.abs(newTime - previousTime) > 5;
}

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
        _enableControls: ownerId === localParticipant.id,
        _isOwner: ownerId === localParticipant.id,
        _isPlaying: status === 'playing',
        _isStopped: status === 'stop',
        _isWideScreen: responsiveUi.aspectRatio === ASPECT_RATIO_WIDE,
        _ownerId: ownerId,
        _screenHeight: screenHeight,
        _screenWidth: screenWidth,
        _seek: time
    };
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {{
 *     onVideoChangeEvent: Function,
 *     onVideoReady: Function,
 *     onWideScreenChanged: Function
 * }}
 */
function _mapDispatchToProps(dispatch) {
    return {
        _onVideoChangeEvent: (videoId, status, time, ownerId) => {
            if (![ 'playing', 'paused' ].includes(status)) {
                return;
            }
            dispatch(setSharedVideoStatus(videoId, translateStatus(status), time, ownerId));
        },
        _onVideoReady: (videoId, time, ownerId) => {
            time.then(t => dispatch(setSharedVideoStatus(videoId, 'playing', t, ownerId)));
        },
        _onWideScreenChanged: isWideScreen => {
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
function _mergeProps({ _isOwner, ...stateProps }, { _onVideoChangeEvent, _onVideoReady, _onWideScreenChanged }) {
    return Object.assign(stateProps, {
        _onVideoChangeEvent: _isOwner ? _onVideoChangeEvent : () => { /* do nothing */ },
        _onVideoReady: _isOwner ? _onVideoReady : () => { /* do nothing */ },
        _onWideScreenChanged
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
