/* global APP, $ */
import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import {
    connect,
    disconnect
} from '../../base/connection';


/**
 * For legacy reasons, inline style for display none.
 * @type {{display: string}}
 */
const DISPLAY_NONE_STYLE = {
    display: 'none'
};

/**
 * Implements a React Component which renders initial conference layout
 */
class Conference extends Component {

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    componentDidMount() {
        APP.UI.start();

        // XXX Temporary solution until we add React translation.
        APP.translation.translateElement($('#videoconference_page'));

        this.props.dispatch(connect());
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this.props.dispatch(disconnect());
    }

    /**
     * Conference component's property types.
     *
     * @static
     */
    static propTypes = {
        dispatch: React.PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div id = 'videoconference_page'>
                <div id = 'mainToolbarContainer'>
                    <div
                        className = 'notice'
                        id = 'notice'
                        style = { DISPLAY_NONE_STYLE }>
                        <span
                            className = 'noticeText'
                            id = 'noticeText' />
                    </div>
                    <div
                        className = 'toolbar'
                        id = 'mainToolbar' />
                </div>
                <div
                    className = 'hide'
                    id = 'subject' />
                <div
                    className = 'toolbar'
                    id = 'extendedToolbar'>
                    <div id = 'extendedToolbarButtons' />
                    <a
                        className = 'button icon-feedback'
                        id = 'feedbackButton' />
                    <div id = 'sideToolbarContainer' />
                </div>
                <div id = 'videospace'>
                    <div
                        className = 'videocontainer'
                        id = 'largeVideoContainer'>
                        <div id = 'sharedVideo'>
                            <div id = 'sharedVideoIFrame' />
                        </div>
                        <div id = 'etherpad' />
                        <a target = '_new'>
                            <div className = 'watermark leftwatermark' />
                        </a>
                        <a target = '_new'>
                            <div className = 'watermark rightwatermark' />
                        </a>
                        <a
                            className = 'poweredby hide'
                            href = 'http://jitsi.org'
                            target = '_new'>
                            <span data-i18n = 'poweredby' /> jitsi.org
                        </a>
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
                                <div
                                    className = 'videocontainer__background' />
                                <span id = 'localVideoWrapper' />
                                <audio
                                    autoPlay = { true }
                                    id = 'localAudio'
                                    muted = { true } />
                                <div className = 'videocontainer__toolbar' />
                                <div
                                    className = 'videocontainer__toptoolbar' />
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
            </div>
        );
    }
}

export default reactReduxConnect()(Conference);
