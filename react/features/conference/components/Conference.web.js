/* global APP, $ */
import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import {
    connect,
    disconnect
} from '../../base/connection';
import ConferenceUrl from '../../../../modules/URL/ConferenceUrl';
import HttpConfigFetch from '../../../../modules/config/HttpConfigFetch';
import BoshAddressChoice from '../../../../modules/config/BoshAddressChoice';

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
        /**
         * If JWT token data it will be used for local user settings.
         *
         * @returns {void}
         */
        function setTokenData() {
            const localUser = APP.tokenData.caller;

            if (localUser) {
                APP.settings.setEmail((localUser.getEmail() || '').trim(), true);
                APP.settings.setAvatarUrl((localUser.getAvatarUrl() || '').trim());
                APP.settings.setDisplayName((localUser.getName() || '').trim(), true);
            }
        }
        /**
         *  Initialization of the app.
         *
         *  @returns {void}
         */
        function init() {
            setTokenData();

            // Initialize the conference URL handler
            APP.ConferenceUrl = new ConferenceUrl(window.location);
        }
        /**
         * If we have an HTTP endpoint for getting config.json configured we're going to
         * read it and override properties from config.js and interfaceConfig.js.
         * If there is no endpoint we'll just continue with initialization.
         * Keep in mind that if the endpoint has been configured and we fail to obtain
         * the config for any reason then the conference won't start and error message
         * will be displayed to the user.
         *
         * @returns {void}
         */
        function obtainConfigAndInit() {
            const roomName = APP.conference.roomName;

            if (config.configLocation) {
                const configFetch = HttpConfigFetch;
                const location = config.configLocation;

                configFetch.obtainConfig(location, roomName, obtainConfigHandler);
            } else {
                BoshAddressChoice.chooseAddress(config, roomName);
                init();
            }
        }

        /**
         * Obtain config handler.
         *
         * @param {boolean} success - Equals to true if
         * config has been obtained w/o errors.
         * @param {Object} error - Error object if there is error occured
         * while fetching config.
         * @returns {void}
         */
        function obtainConfigHandler(success, error) {
            if (success) {
                const now = window.performance.now();

                APP.connectionTimes['configuration.fetched'] = now;
                logger.log('(TIME) configuration fetched:\t', now);
                init();
            } else {
                // Show obtain config error,
                // pass the error object for report
                APP.UI.messageHandler.openReportDialog(
                    null, 'dialog.connectError', error);
            }
        }

        obtainConfigAndInit();
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
