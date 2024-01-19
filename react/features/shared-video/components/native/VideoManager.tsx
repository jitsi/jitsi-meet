import React, { RefObject } from 'react';
import Video from 'react-native-video';
import { connect } from 'react-redux';

import { PLAYBACK_STATUSES } from '../../constants';
import logger from '../../logger';

import AbstractVideoManager, {
    IProps,
    _mapStateToProps
} from './AbstractVideoManager';

interface IState {
    currentTime: number;
    paused: boolean;
}

/**
 * Manager of shared video.
 */
class VideoManager extends AbstractVideoManager<IState> {
    playerRef: RefObject<typeof Video>;

    /**
     * Initializes a new VideoManager instance.
     *
     * @param {Object} props - This component's props.
     *
     * @returns {void}
     */
    constructor(props: IProps) {
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
    seek(time: number) {
        if (this.player) {

            // @ts-ignore
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
    onPlaybackRateChange({ playbackRate }: { playbackRate: number; }) {
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
     * Handles progress update event.
     *
     * @param {Object} options - Progress event options.
     * @returns {void}
     */
    onProgress(options: { currentTime: number; }) {
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

        const options: any = {
            paused,
            progressUpdateInterval: 5000,
            resizeMode: 'cover' as const,
            style: {
                height,
                width
            },
            source: { uri: videoId },
            controls: _isOwner,
            pictureInPicture: false,
            onProgress: this.onProgress,
            onError: (event: Error) => {
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
        return (
            <Video
                ref = { this.playerRef }
                { ...this.getPlayerOptions() } />
        );
    }
}

export default connect(_mapStateToProps)(VideoManager);
