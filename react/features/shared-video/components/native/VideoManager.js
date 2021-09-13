import Logger from 'jitsi-meet-logger';
import React from 'react';
import Video from 'react-native-video';

import { connect } from '../../../base/redux';
import { PLAYBACK_STATUSES } from '../../constants';

import AbstractVideoManager, {
    _mapStateToProps,
    Props
} from './AbstractVideoManager';

const logger = Logger.getLogger(__filename);

/**
 * Manager of shared video.
 */
class VideoManager extends AbstractVideoManager<Props> {
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
            currentTime: 0,
            paused: false
        };

        this.playerRef = React.createRef();
        this.onPlaybackRateChange = this.onPlaybackRateChange.bind(this);
        this.onProgress = this.onProgress.bind(this);
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
        return this.state.currentTime;
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
            this.player.seek(time);
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
     * Handles playback rate changed event.
     *
     * @param {Object} options.playbackRate - Playback rate: 1 - playing, 0 - paused, other - slowed down / sped up.
     * @returns {void}
     */
    onPlaybackRateChange({ playbackRate }) {
        if (playbackRate === 0) {
            this.setState({
                paused: true
            }, () => {
                this.onPause();
            });
        }

        if (playbackRate === 1) {
            this.setState({
                paused: false
            }, () => {
                this.onPlay();
            });
        }
    }

    /**
     * Handles progress updarte event.
     *
     * @param {Object} options - Progress event options.
     * @returns {void}
     */
    onProgress(options) {
        this.setState({ currentTime: options.currentTime });
        this.throttledFireUpdateSharedVideoEvent();
    }

    /**
     * Retrieves video tag params.
     *
     * @returns {void}
     */
    getPlayerOptions() {
        const { _isOwner, videoId, width, height } = this.props;
        const { paused } = this.state;

        const options = {
            paused,
            progressUpdateInterval: 5000,
            resizeMode: 'cover',
            style: {
                height,
                width
            },
            source: { uri: videoId },
            controls: _isOwner,
            pictureInPicture: false,
            onProgress: this.onProgress,
            onError: event => {
                logger.error('Error in the player:', event);
            }
        };

        if (_isOwner) {
            options.onPlaybackRateChange = this.onPlaybackRateChange;
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

export default connect(_mapStateToProps)(VideoManager);
