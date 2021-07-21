/* eslint-disable no-invalid-this */
import React from 'react';
import ReactPlayer from 'react-player';

import { connect } from '../../../base/redux';

import AbstractVideoManager, {
    _mapDispatchToProps,
    _mapStateToProps,
    PLAYBACK_STATES,
    Props
} from './AbstractVideoManager';

/**
 * Manager of shared media links/files.
 * Supported platforms: SoundCloud, Facebook, Vimeo, Twitch, Streamable, Wistia, DailyMotion, Mixcloud, Vidyard.
 * Supported files(urls): Mp4, webm, ogv, mp3, HLS(m3u8), DASH(mpd).
 *
 * @returns {void}
 */
class MediaPlayerManager extends AbstractVideoManager<Props> {
    /**
     * Initializes a new MediaPlayerManager instance.
     *
     * @param {Object} props - This component's props.
     *
     * @returns {void}
     */
    constructor(props) {
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
    getPlaybackState() {
        let state;

        if (!this.player) {
            return;
        }

        if (this.player.paused) {
            state = PLAYBACK_STATES.PAUSED;
        } else {
            state = PLAYBACK_STATES.PLAYING;
        }

        return state;
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
        return this.player?.volume;
    }

    /**
     * Sets player volume.
     *
     * @param {number} value - The volume.
     *
     * @returns {void}
     */
    setVolume(value) {
        if (this.player) {
            this.player.volume = value;
        }
    }

    /**
     * Retrieves current time.
     *
     * @returns {number}
     */
    getTime() {
        return this.player?.currentTime;
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
    getPlayerOptions = () => {
        const { _isOwner, videoId } = this.props;
        const showControls = _isOwner;

        let options = {
            id: 'sharedVideoPlayer',
            height: '100%',
            width: '100%',
            url: videoId,
            controls: showControls,
            playing: true,
            onError: () => this.onError(),
            onPlay: () => this.onPlay()
        };

        if (_isOwner) {
            options = {
                ...options,
                onPause: () => this.onPause(),
                onTimeUpdate: this.throttledFireUpdateSharedVideoEvent
            };

        }

        return options;
    };

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        return (<ReactPlayer
            ref = { this.playerRef }
            { ...this.getPlayerOptions() } />);
    }
}

export default connect(
    _mapStateToProps,
    _mapDispatchToProps
)(MediaPlayerManager);
