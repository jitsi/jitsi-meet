import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Platform } from '../../base/react';

/**
 * The map of platforms to URLs at which the mobile app for the associated
 * platform is available for download.
 *
 * @private
 */
const _URLS = {
    android: 'https://play.google.com/store/apps/details?id=org.jitsi.meet',
    ios: 'https://itunes.apple.com/us/app/jitsi-meet/id1165103905'
};

/**
 * React component representing mobile browser page.
 *
 * @class UnsupportedMobileBrowser
 */
class UnsupportedMobileBrowser extends Component {
    /**
     * UnsupportedMobileBrowser component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The name of the conference room to be joined upon clicking the
         * respective button.
         *
         * @private
         * @type {string}
         */
        _room: React.PropTypes.string
    }

    /**
     * Initializes the text and URL of the `Start a conference` / `Join the
     * conversation` button which takes the user to the mobile app.
     *
     * @inheritdoc
     */
    componentWillMount() {
        const joinText
            = this.props._room ? 'Join the conversation' : 'Start a conference';

        // If the user installed the app while this Component was displayed
        // (e.g. the user clicked the Download the App button), then we would
        // like to open the current URL in the mobile app. The only way to do it
        // appears to be a link with an app-specific scheme, not a Universal
        // Link.
        const joinURL = `org.jitsi.meet:${window.location.href}`;

        this.setState({
            joinText,
            joinURL
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const ns = 'unsupported-mobile-browser';
        const downloadButtonClassName = `${ns}__button ${ns}__button_primary`;

        return (
            <div className = { ns }>
                <div className = { `${ns}__body` }>
                    <img
                        className = { `${ns}__logo` }
                        src = 'images/logo-blue.svg' />
                    <p className = { `${ns}__text` }>
                        You need <strong>Jitsi Meet</strong> to join a
                        conversation on your mobile
                    </p>
                    <a href = { _URLS[Platform.OS] }>
                        <button className = { downloadButtonClassName }>
                            Download the App
                        </button>
                    </a>
                    <p className = { `${ns}__text ${ns}__text_small` }>
                        or if you already have it
                        <br />
                        <strong>then</strong>
                    </p>
                    <a href = { this.state.joinURL }>
                        <button className = { `${ns}__button` }>
                            {
                                this.state.joinText
                            }
                        </button>
                    </a>
                </div>

                {
                    this._renderStyle()
                }
            </div>
        );
    }

    /**
     * Renders an HTML style element with CSS specific to
     * this UnsupportedMobileBrowser.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderStyle() {
        // Temasys provide lib-jitsi-meet/modules/RTC/adapter.screenshare.js
        // which detects whether the browser supports WebRTC. If the browser
        // does not support WebRTC, it displays an alert in the form of a yellow
        // bar at the top of the page. The alert notifies the user that the
        // browser does not support WebRTC and, if Temasys provide a plugin for
        // the browser, the alert contains a button to initiate installing the
        // browser. When Temasys do not provide a plugin for the browser, we do
        // not want the alert on the unsupported-browser page because the
        // notification about the lack of WebRTC support is the whole point of
        // the unsupported-browser page.
        return (
            <style type = 'text/css'>
                {
                    'iframe[name="adapterjs-alert"] { display: none; }'
                }
            </style>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated UnsupportedMobileBrowser's
 * props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {{
 *     _room: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        /**
         * The name of the conference room to be joined upon clicking the
         * respective button.
         *
         * @private
         * @type {string}
         */
        _room: state['features/base/conference'].room
    };
}

export default connect(_mapStateToProps)(UnsupportedMobileBrowser);
