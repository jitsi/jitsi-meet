/* eslint-disable no-invalid-this */
import React from 'react';
import ReactPlayer from 'react-player';

import { connect } from '../../../base/redux';

import AbstractVideoManager, { _mapDispatchToProps, _mapStateToProps } from './AbstractVideoManager';

/**
 * Manager of shared media links/files.
 * Supported platforms: SoundCloud, Facebook, Vimeo, Twitch, Streamable, Wistia, DailyMotion, Mixcloud, Vidyard.
 * Supported files(urls): Mp4, webm, ogv, mp3, HLS(m3u8), DASH(mpd).
 *
 * @returns {void}
 */
class MediaPlayerManager extends AbstractVideoManager<Props> {
    getPlayerOptions = () => {
        const { _isOwner, videoId } = this.props;
        const showControls = _isOwner;

        const options = {
            id: 'sharedMediaPlayer',
            height: '100%',
            width: '100%',
            url: videoId,
            controls: showControls,
            playing: true,
            onError: () => this.onError()
        };

        return options;
    };

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        return <ReactPlayer { ...this.getPlayerOptions() } />;
    }
}

export default connect(
    _mapStateToProps,
    _mapDispatchToProps
)(MediaPlayerManager);
