/* global interfaceConfig, APP */
import React, { Component } from 'react';

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
export default class Conference extends Component {

    /**
     * Initializes Conference component instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        const showBrandWatermark = interfaceConfig.SHOW_BRAND_WATERMARK;
        const showJitsiWatermark = interfaceConfig.SHOW_JITSI_WATERMARK;
        const showJitsiWatermarkForGuest
            = interfaceConfig.SHOW_WATERMARK_FOR_GUESTS;

        this.state = {
            ...this.state,
            showBrandWatermark,
            showJitsiWatermark,
            showJitsiWatermarkForGuest,
            brandWatermarkLink:
                showBrandWatermark ? interfaceConfig.BRAND_WATERMARK_LINK : '',
            jitsiWatermarkLink:
                showJitsiWatermark || showJitsiWatermarkForGuest
                    ? interfaceConfig.JITSI_WATERMARK_LINK : '',
            showPoweredBy: interfaceConfig.SHOW_POWERED_BY
        };
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
                        {
                            this._renderJitsiWatermark()
                        }
                        {
                            this._renderBrandWatermark()
                        }
                        {
                            this._renderPoweredBy()
                        }
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

    /**
     * Method that returns brand watermark element if it is enabled.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderBrandWatermark() {
        if (this.state.showBrandWatermark) {
            return (
                <a
                    href = { this.state.brandWatermarkLink }
                    target = '_new'>
                    <div className = 'watermark rightwatermark' />
                </a>
            );
        }

        return null;
    }

    /**
     * Method that returns jitsi watermark element if it is enabled.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderJitsiWatermark() {
        if (this.state.showJitsiWatermark
            || (APP.tokenData.isGuest
                    && this.state.showJitsiWatermarkForGuest)) {
            return (
                <a
                    href = { this.state.jitsiWatermarkLink }
                    target = '_new'>
                    <div className = 'watermark leftwatermark' />
                </a>
            );
        }

        return null;
    }

    /**
     * Renders powered by block if it is enabled.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderPoweredBy() {
        if (this.state.showPoweredBy) {
            return (
                <a
                    className = 'poweredby hide'
                    href = 'http://jitsi.org'
                    target = '_new'>
                    <span data-i18n = 'poweredby' /> jitsi.org
                </a>
            );
        }

        return null;
    }
}
