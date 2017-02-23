/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Platform } from '../../base/react';
import { translate, translateToHTML } from '../../base/translation';

import HideNotificationBarStyle from './HideNotificationBarStyle';

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
    state: Object;

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
        _room: React.PropTypes.string,
        t: React.PropTypes.func
    }

    /**
     * Initializes the text and URL of the `Start a conference` / `Join the
     * conversation` button which takes the user to the mobile app.
     *
     * @inheritdoc
     */
    componentWillMount() {
        const joinText
            = this.props._room ? 'unsupportedPage.joinConversation'
                : 'unsupportedPage.startConference';

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
        const { t } = this.props;

        return (
            <div className = { ns }>
                <div className = { `${ns}__body` }>
                    <img
                        className = { `${ns}__logo` }
                        src = 'images/logo-blue.svg' />
                    <p className = { `${ns}__text` }>
                        { translateToHTML(t,
                            'unsupportedPage.joinConversationMobile',
                            { postProcess: 'resolveAppName' }) }
                    </p>
                    <a href = { _URLS[Platform.OS] }>
                        <button className = { downloadButtonClassName }>
                            { t('unsupportedPage.downloadApp') }
                        </button>
                    </a>
                    <p className = { `${ns}__text ${ns}__text_small` }>
                        { translateToHTML(t, 'unsupportedPage.availableApp') }
                    </p>
                    <a href = { this.state.joinURL }>
                        <button className = { `${ns}__button` }>
                            { t(this.state.joinText) }
                        </button>
                    </a>
                </div>

                <HideNotificationBarStyle />
            </div>
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

export default translate(connect(_mapStateToProps)(UnsupportedMobileBrowser));
