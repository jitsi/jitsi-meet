/* eslint-disable no-invalid-this */
import Logger from 'jitsi-meet-logger';
import React from 'react';
import YouTube from 'react-youtube';

import { connect } from '../../../base/redux';

import AbstractVideoManager, {
    _mapDispatchToProps,
    _mapStateToProps,
    PLAYBACK_STATES
} from './AbstractVideoManager';

const logger = Logger.getLogger(__filename);

/**
 * Manager of shared video.
 *
 * @returns {void}
 */
class YoutubeVideoManager extends AbstractVideoManager<Props> {
    /**
     * Initializes a new YoutubeVideoManager instance.
     *
     * @param {Object} props - This component's props.
     *
     * @returns {void}
     */
    constructor(props) {
        super(props);

        this.isPlayerAPILoaded = false;
    }

    /**
     * Indicates the playback state of the video.
     *
     * @returns {string}
     */
    getPlaybackState() {
        let state;

        if (!this.player) {
            return;
        }

        const playerState = this.player.getPlayerState();

        if (playerState === YouTube.PlayerState.PLAYING) {
            state = PLAYBACK_STATES.PLAYING;
        }

        if (playerState === YouTube.PlayerState.PAUSED) {
            state = PLAYBACK_STATES.PAUSED;
        }

        return state;
    }

    /**
     * Indicates whether the video is muted.
     *
     * @returns {boolean}
     */
    isMuted() {
        return this.player?.isMuted();
    }

    /**
     * Retrieves current volume.
     *
     * @returns {number}
     */
    getVolume() {
        return this.player?.getVolume();
    }

    /**
     * Sets player volume.
     *
     * @param {number} value - The volume.
     *
     * @returns {void}
     */
    setVolume(value) {
        return this.player?.setVolume(value);
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
        return this.player?.seekTo(time);
    }

    /**
     * Plays video.
     *
     * @returns {void}
     */
    play() {
        return this.player?.playVideo();
    }

    /**
     * Pauses video.
     *
     * @returns {void}
     */
    pause() {
        return this.player?.pauseVideo();
    }

    /**
     * Mutes video.
     *
     * @returns {void}
     */
    mute() {
        return this.player?.mute();
    }

    /**
     * Unmutes video.
     *
     * @returns {void}
     */
    unMute() {
        return this.player?.unMute();
    }

    /**
     * Disposes of the current video player.
     *
     * @returns {void}
     */
    dispose() {
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }

        if (this.errorInPlayer) {
            this.errorInPlayer.destroy();
            this.errorInPlayer = null;
        }
    }

    /**
     * Fired on play state toggle.
     *
     * @param {Object} event - The yt player stateChange event.
     *
     * @returns {void}
     */
    onPlayerStateChange = event => {
        if (event.data === YouTube.PlayerState.PLAYING) {
            this.onPlay();
        } else if (event.data === YouTube.PlayerState.PAUSED) {
            this.onPause();
        }
    }

    /**
     * Fired when youtube player is ready.
     *
     * @param {Object} event - The youtube player event.
     *
     * @returns {void}
     */
    onPlayerReady = event => {
        const { _isOwner } = this.props;

        this.player = event.target;

        this.player.addEventListener('onVolumeChange', () => {
            this.onVolumeChange();
        });

        if (_isOwner) {
            this.player.addEventListener('onVideoProgress', this.throttledFireUpdateSharedVideoEvent);
        }

        this.play();

        // sometimes youtube can get muted state from previous videos played in the browser
        // and as we are disabling controls we want to unmute it
        if (this.isMuted()) {
            this.unMute();
        }
    };

    /**
     * Fired when youtube player throws an error.
     *
     * @param {Object} event - Youtube player error event.
     *
     * @returns {void}
     */
    onPlayerError = event => {
        logger.error('Error in the player:', event.data);

        // store the error player, so we can remove it
        this.errorInPlayer = event.target;
    };

    getPlayerOptions = () => {
        const { _isOwner, videoId } = this.props;
        const showControls = _isOwner ? 1 : 0;

        const options = {
            id: 'sharedVideoPlayer',
            opts: {
                height: '100%',
                width: '100%',
                playerVars: {
                    'origin': location.origin,
                    'fs': '0',
                    'autoplay': 0,
                    'controls': showControls,
                    'rel': 0
                }
            },
            onError: this.onPlayerError,
            onReady: this.onPlayerReady,
            onStateChange: this.onPlayerStateChange,
            videoId
        };

        return options;
    }

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        return (<YouTube
            { ...this.getPlayerOptions() } />);
    }
}

export default connect(_mapStateToProps, _mapDispatchToProps)(YoutubeVideoManager);
