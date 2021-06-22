// @flow

import React, { Component, createRef } from 'react';
import { View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_WIDE } from '../../../base/responsive-ui';
import { setToolboxVisible } from '../../../toolbox/actions';
import { setSharedVideoStatus } from '../../actions.native';

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
     * The id of the participant sharing the video.
     *
     * @private
     */
    _ownerId: string,

    /**
     * The height of the player.
     *
     * @private
     */
    _playerHeight: number,

    /**
     * The width of the player.
     *
     * @private
     */
    _playerWidth: number,

    /**
     * Seek time in seconds.
     *
     * @private
     */
    _seek: number,

     /**
     * The status of the player.
     *
     * @private
     */
    _status: string,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Youtube id of the video to be played.
     *
     * @private
     */
     youtubeId: string
};

/**
 *
 * Implements a React {@code Component} for showing a youtube video.
 *
 * @extends Component
 */
class YoutubeLargeVideo extends Component<Props, *> {
    /**
     * Saves a handle to the timer for seek time updates,
     * so that it can be cancelled when the component unmounts.
     */
    intervalId: ?IntervalID;

    /**
     * A React ref to the HTML element containing the {@code YoutubePlayer} instance.
     */
    playerRef: Object;

    /**
     * Initializes a new {@code YoutubeLargeVideo} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);
        this.playerRef = createRef();

        this._onReady = this._onReady.bind(this);
        this._onChangeState = this._onChangeState.bind(this);

        this.setWideScreenMode(props._isWideScreen);
    }

    /**
     * Seeks to the new time if the difference between the new one and the current is larger than 5 seconds.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: Props) {
        const playerRef = this.playerRef.current;
        const { _isWideScreen, _seek } = this.props;

        if (_seek !== prevProps._seek) {
            playerRef && playerRef.getCurrentTime().then(time => {
                if (shouldSeekToPosition(_seek, time)) {
                    playerRef && playerRef.seekTo(_seek);
                }
            });
        }

        if (_isWideScreen !== prevProps._isWideScreen) {
            this.setWideScreenMode(_isWideScreen);
        }
    }

    /**
     * Sets the interval for saving the seek time to redux every 5 seconds.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this.intervalId = setInterval(() => {
            this.saveRefTime();
        }, 5000);
    }

    /**
     * Clears the interval.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    /**
     * Renders the YoutubeLargeVideo element.
     *
     * @override
     * @returns {ReactElement}
     */
    render() {
        const {
            _enableControls,
            _isPlaying,
            _playerHeight,
            _playerWidth,
            youtubeId
        } = this.props;

        return (
            <View
                pointerEvents = { _enableControls ? 'auto' : 'none' }
                style = { styles.youtubeVideoContainer } >
                <YoutubePlayer
                    height = { _playerHeight }
                    initialPlayerParams = {{
                        controls: _enableControls,
                        modestbranding: true,
                        preventFullScreen: true
                    }}
                    /* eslint-disable react/jsx-no-bind */
                    onChangeState = { this._onChangeState }
                    /* eslint-disable react/jsx-no-bind */
                    onReady = { this._onReady }
                    play = { _isPlaying }
                    playbackRate = { 1 }
                    ref = { this.playerRef }
                    videoId = { youtubeId }
                    volume = { 50 }
                    webViewProps = {{
                        bounces: false,
                        mediaPlaybackRequiresUserAction: false,
                        scrollEnabled: false,
                        userAgent: webviewUserAgent
                    }}
                    width = { _playerWidth } />
            </View>);
    }

    _onReady: () => void;

    /**
     * Callback invoked when the player is ready to play the video.
     *
     * @private
     * @returns {void}
     */
    _onReady() {
        if (this.props?._isOwner) {
            this.onVideoReady(
                this.props.youtubeId,
                this.playerRef.current && this.playerRef.current.getCurrentTime(),
                this.props._ownerId);
        }
    }

    _onChangeState: (status: string) => void;

    /**
     * Callback invoked when the state of the player changes.
     *
     * @param {string} status - The new status of the player.
     * @private
     * @returns {void}
     */
    _onChangeState(status) {
        this.playerRef?.current && this.playerRef.current.getCurrentTime().then(time => {
            const {
                _isOwner,
                _isPlaying,
                _isStopped,
                _ownerId,
                _seek,
                youtubeId
            } = this.props;

            if (shouldSetNewStatus(_isStopped, _isOwner, status, _isPlaying, time, _seek)) {
                this.onVideoChangeEvent(youtubeId, status, time, _ownerId);
            }
        });
    }

    /**
     * Calls onVideoChangeEvent with the refTime.
     *
     * @private
     * @returns {void}
    */
    saveRefTime() {
        const { youtubeId, _status, _ownerId } = this.props;

        this.playerRef.current && this.playerRef.current.getCurrentTime().then(time => {
            this.onVideoChangeEvent(youtubeId, _status, time, _ownerId);
        });
    }

    /**
     * Dispatches the video status, time and ownerId if the status is playing or paused.
     *
     * @param {string} videoUrl - The youtube id of the video.
     * @param {string} status - The status of the player.
     * @param {number} time - The seek time.
     * @param {string} ownerId - The id of the participant sharing the video.
     * @private
     * @returns {void}
    */
    onVideoChangeEvent(videoUrl, status, time, ownerId) {
        if (![ 'playing', 'paused' ].includes(status)) {
            return;
        }

        this.props.dispatch(setSharedVideoStatus({
            videoUrl,
            status: translateStatus(status),
            time,
            ownerId
        }));
    }

    /**
     * Dispatches the 'playing' as video status, time and ownerId.
     *
     * @param {string} videoUrl - The youtube id of the video.
     * @param {number} time - The seek time.
     * @param {string} ownerId - The id of the participant sharing the video.
     * @private
     * @returns {void}
    */
    onVideoReady(videoUrl, time, ownerId) {
        time.then(t => this.props.dispatch(setSharedVideoStatus({
            videoUrl,
            status: 'playing',
            time: t,
            ownerId
        })));
    }

    /**
     * Dispatches action to set the visibility of the toolbox, true if not widescreen, false otherwise.
     *
     * @param {isWideScreen} isWideScreen - Whether the screen is wide.
     * @private
     * @returns {void}
    */
    setWideScreenMode(isWideScreen) {
        this.props.dispatch(setToolboxVisible(!isWideScreen));
    }
}

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
    const { ownerId, status, time } = state['features/shared-video'];
    const localParticipant = getLocalParticipant(state);
    const responsiveUi = state['features/base/responsive-ui'];
    const { aspectRatio, clientHeight: screenHeight, clientWidth: screenWidth } = responsiveUi;
    const isWideScreen = aspectRatio === ASPECT_RATIO_WIDE;

    let playerHeight, playerWidth;

    if (isWideScreen) {
        playerHeight = screenHeight;
        playerWidth = playerHeight * 16 / 9;
    } else {
        playerWidth = screenWidth;
        playerHeight = playerWidth * 9 / 16;
    }

    return {
        _enableControls: ownerId === localParticipant.id,
        _isOwner: ownerId === localParticipant.id,
        _isPlaying: status === 'playing',
        _isStopped: status === 'stop',
        _isWideScreen: isWideScreen,
        _ownerId: ownerId,
        _playerHeight: playerHeight,
        _playerWidth: playerWidth,
        _seek: time,
        _status: status
    };
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

export default connect(_mapStateToProps)(YoutubeLargeVideo);
