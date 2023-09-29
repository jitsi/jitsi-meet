import React from 'react';
import { connect } from 'react-redux';

import { PLAYBACK_STATUSES } from '../../constants';

import AbstractVideoManager, {
    IProps,
    _mapDispatchToProps,
    _mapStateToProps
} from './AbstractVideoManager';


/**
 * Manager of shared video.
 */
class VideoManager extends AbstractVideoManager {
    playerRef: React.RefObject<HTMLVideoElement>;

    /**
     * Initializes a new VideoManager instance.
     *
     * @param {Object} props - This component's props.
     *
     * @returns {void}
     */
    constructor(props: IProps) {
        super(props);

        this.playerRef = React.createRef();
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

        if (!this.player) {
            return;
        }

        if (this.player.paused) {
            status = PLAYBACK_STATUSES.PAUSED;
        } else {
            status = PLAYBACK_STATUSES.PLAYING;
        }

        return status;
    }

    /**
     * Indicates whether the video is muted.
     *
     * @returns {boolean}
     */
    isMuted() {
        return this.player?.muted;
    }

    /**
     * Retrieves current volume.
     *
     * @returns {number}
     */
    getVolume() {
        return Number(this.player?.volume);
    }

    /**
     * Retrieves current time.
     *
     * @returns {number}
     */
    getTime() {
        return Number(this.player?.currentTime);
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
            this.player.currentTime = time;
        }
    }

    /**
     * Plays video.
     *
     * @returns {void}
     */
    play() {
        return this.player?.play();
    }

    /**
     * Pauses video.
     *
     * @returns {void}
     */
    pause() {
        return this.player?.pause();
    }

    /**
     * Mutes video.
     *
     * @returns {void}
     */
    mute() {
        if (this.player) {
            this.player.muted = true;
        }
    }

    /**
     * Unmutes video.
     *
     * @returns {void}
     */
    unMute() {
        if (this.player) {
            this.player.muted = false;
        }
    }

    /**
     * Retrieves video tag params.
     *
     * @returns {void}
     */
    getPlayerOptions() {
        const { _isOwner, videoId } = this.props;

        let options: any = {
            autoPlay: true,
            src: videoId,
            controls: _isOwner,
            onError: () => this.onError(),
            onPlay: () => this.onPlay(),
            onVolumeChange: () => this.onVolumeChange()
        };

        if (_isOwner) {
            options = {
                ...options,
                onPause: () => this.onPause(),
                onTimeUpdate: this.throttledFireUpdateSharedVideoEvent
            };

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
            <video
                id = 'sharedVideoPlayer'
                ref = { this.playerRef }
                { ...this.getPlayerOptions() } />
        );
    }
}

export default connect(_mapStateToProps, _mapDispatchToProps)(VideoManager);
