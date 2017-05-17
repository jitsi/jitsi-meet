/* @flow */

import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import { connect, disconnect } from '../../base/connection';
import { DialogContainer } from '../../base/dialog';
import { Watermarks } from '../../base/react';
import { OverlayContainer } from '../../overlay';
import { Toolbox } from '../../toolbox';
import { HideNotificationBarStyle } from '../../unsupported-browser';
import { VideoStatusLabel } from '../../video-status-label';

declare var $: Function;
declare var APP: Object;

/**
 * The conference page of the Web application.
 */
class Conference extends Component {

    /**
     * Conference component's property types.
     *
     * @static
     */
    static propTypes = {
        dispatch: React.PropTypes.func
    }

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    componentDidMount() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        this.props.dispatch(connect());
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.UI.stopDaemons();
        APP.UI.unregisterListeners();
        APP.UI.unbindEvents();

        APP.conference.isJoined() && this.props.dispatch(disconnect());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div id = 'videoconference_page'>
                <Toolbox />

                <div id = 'videospace'>
                    <div
                        className = 'videocontainer'
                        id = 'largeVideoContainer'>
                        <div id = 'sharedVideo'>
                            <div id = 'sharedVideoIFrame' />
                        </div>
                        <div id = 'etherpad' />

                        <Watermarks />

                        <div id = 'dominantSpeaker'>
                            <div className = 'dynamic-shadow' />
                            <img
                                id = 'dominantSpeakerAvatar'
                                src = '' />
                        </div>
                        <span id = 'remoteConnectionMessage' />
                        <div id = 'largeVideoWrapper'>
                            <video
                                autoPlay = { true }
                                id = 'largeVideo'
                                muted = 'true' />
                        </div>
                        <span id = 'localConnectionMessage' />
                        <VideoStatusLabel />
                        <span
                            className
                                = 'video-state-indicator centeredVideoLabel'
                            id = 'recordingLabel'>
                            <span id = 'recordingLabelText' />
                            <img
                                className = 'recordingSpinner'
                                id = 'recordingSpinner'
                                src = 'images/spin.svg' />
                        </span>
                    </div>
                    { this._renderFilmstrip() }
                </div>

                <DialogContainer />
                <OverlayContainer />
                <HideNotificationBarStyle />
            </div>
        );
    }

    /**
     * Creates a React Element for displaying filmstrip videos.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderFilmstrip() {
        return (
            <div className = 'filmstrip'>
                <div
                    className = 'filmstrip__videos'
                    id = 'remoteVideos'>
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripLocalVideo'>
                        <span
                            className = 'videocontainer'
                            id = 'localVideoContainer'>
                            <div className = 'videocontainer__background' />
                            <span id = 'localVideoWrapper' />
                            <audio
                                autoPlay = { true }
                                id = 'localAudio'
                                muted = { true } />
                            <div className = 'videocontainer__toolbar' />
                            <div className = 'videocontainer__toptoolbar' />
                            <div
                                className
                                    = 'videocontainer__hoverOverlay' />
                        </span>
                    </div>
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripRemoteVideos'>
                        {

                            /*
                                This extra video container is needed for
                                scrolling thumbnails in firefox, otherwise the
                                flex thumbnails resize instead of causing
                                overflow.
                            */
                        }
                        <div
                            className = 'remote-videos-container'
                            id = 'filmstripRemoteVideosContainer' />
                    </div>
                    <audio
                        id = 'userJoined'
                        preload = 'auto'
                        src = 'sounds/joined.wav' />
                    <audio
                        id = 'userLeft'
                        preload = 'auto'
                        src = 'sounds/left.wav' />
                </div>
            </div>
        );
    }
}

export default reactReduxConnect()(Conference);
