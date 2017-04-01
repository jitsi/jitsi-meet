/* @flow */

import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import { connect, disconnect } from '../../base/connection';
import { DialogContainer } from '../../base/dialog';
import { Watermarks } from '../../base/react';
import { OverlayContainer } from '../../overlay';
import { Toolbox } from '../../toolbox';
import { HideNotificationBarStyle } from '../../unsupported-browser';

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
                        <span
                            className = 'video-state-indicator moveToCorner'
                            id = 'videoResolutionLabel'>HD</span>
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
                    <div className = 'filmstrip'>
                        <div
                            className = 'filmstrip__videos'
                            id = 'remoteVideos'>
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
                </div>

                <DialogContainer />
                <OverlayContainer />
                <HideNotificationBarStyle />
            </div>
        );
    }
}

export default reactReduxConnect()(Conference);
