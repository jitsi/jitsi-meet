import React from 'react';
import Video from 'react-native-youtube-iframe';

import { connect } from '../../../base/redux';
import { PLAYBACK_STATUSES } from '../../constants';

import AbstractVideoManager, {
    _mapStateToProps,
    Props
} from './AbstractVideoManager';

/**
 * Passed to the webviewProps in order to avoid the usage of the ios player on which we cannot hide the controls.
 *
 * @private
 */
const webviewUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36'; // eslint-disable-line max-len

/**
 * Manager of youtube shared video.
 */
class YoutubeVideoManager extends AbstractVideoManager<Props> {
    /**
     * Initializes a new VideoManager instance.
     *
     * @param {Object} props - This component's props.
     *
     * @returns {void}
     */
    constructor(props) {
        super(props);

        this.state = {
            paused: false
        };

        this.playerRef = React.createRef();
        this._onReady = this._onReady.bind(this);
        this._onChangeState = this._onChangeState.bind(this);
    }

    /**
     * Retrieves the current player ref.
     */
    get player() {
        return this.playerRef.current;
    }

    /**
     * Indicates the playback state of the video.
     *
     * @returns {string}
     */
    getPlaybackStatus() {
        let status;

        if (this.state.paused) {
            status = PLAYBACK_STATUSES.PAUSED;
        } else {
            status = PLAYBACK_STATUSES.PLAYING;
        }

        return status;
    }

    /**
     * Retrieves current time.
     *
     * @returns {number}
     */
    getTime() {
        return this.player?.getCurrentTime();
    }

    /**
     * Seeks video to provided time.
     *
     * @param {number} time - The time to seek to.
     *
     * @returns {void}
     */
    seek(time) {
        if (this.player) {
            this.player.seekTo(time);
        }
    }

    /**
     * Plays video.
     *
     * @returns {void}
     */
    play() {
        this.setState({
            paused: false
        });
    }

    /**
     * Pauses video.
     *
     * @returns {void}
     */
    pause() {
        this.setState({
            paused: true
        });
    }

    /**
     * Handles state change event.
     *
     * @param {string} event - State event.
     * @returns {void}
     */
    _onChangeState(event) {
        if (event === 'paused') {
            this.setState({
                paused: true
            }, () => {
                this.onPause();
            });
        }

        if (event === 'playing') {
            this.setState({
                paused: false
            }, () => {
                this.onPlay();
            });
        }
    }

    /**
     * Handles onReady event.
     *
     * @returns {void}
     */
    _onReady() {
        this.setState({
            paused: false
        });
    }

    /**
     * Retrieves video tag params.
     *
     * @returns {void}
     */
    getPlayerOptions() {
        const { _isOwner, videoId, width, height } = this.props;

        const options = {
            height,
            initialPlayerParams: {
                controls: _isOwner,
                modestbranding: true,
                preventFullScreen: true
            },
            play: !this.state.paused,
            ref: this.playerRef,
            videoId,
            volume: 50,
            webViewProps: {
                bounces: false,
                mediaPlaybackRequiresUserAction: false,
                scrollEnabled: false,
                userAgent: webviewUserAgent
            },
            width
        };

        if (_isOwner) {
            options.onChangeState = this._onChangeState;
            options.onReady = this._onReady;
        }

        return options;
    }

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        return (<Video
            ref = { this.playerRef }
            { ...this.getPlayerOptions() } />);
    }
}

export default connect(_mapStateToProps)(YoutubeVideoManager);
