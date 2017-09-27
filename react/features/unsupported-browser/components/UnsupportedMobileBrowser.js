/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate, translateToHTML } from '../../base/i18n';
import { Platform } from '../../base/react';

import HideNotificationBarStyle from './HideNotificationBarStyle';

/**
 * The namespace of the CSS styles of UnsupportedMobileBrowser.
 *
 * @private
 * @type {string}
 */
const _SNS = 'unsupported-mobile-browser';

/**
 * The namespace of the i18n/translation keys of UnsupportedMobileBrowser.
 *
 * @private
 * @type {string}
 */
const _TNS = 'unsupportedBrowser';

/**
 * The map of platforms to URLs at which the mobile app for the associated
 * platform is available for download.
 *
 * @private
 * @type {Array<string>}
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
        _room: PropTypes.string,

        /**
         * The function to translate human-readable text.
         *
         * @public
         * @type {Function}
         */
        t: PropTypes.func
    };

    /**
     * Initializes the text and URL of the `Start a conference` / `Join the
     * conversation` button which takes the user to the mobile app.
     *
     * @inheritdoc
     */
    componentWillMount() {
        const joinText
            = this.props._room ? 'joinConversation' : 'startConference';

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
        const { t } = this.props;

        const downloadButtonClassName
            = `${_SNS}__button ${_SNS}__button_primary`;

        return (
            <div className = { _SNS }>
                <div className = { `${_SNS}__body` }>
                    <img
                        className = { `${_SNS}__logo` }
                        src = 'images/logo-blue.svg' />
                    <p className = { `${_SNS}__text` }>
                        {
                            translateToHTML(
                                t,
                                `${_TNS}.appNotInstalled`,
                                { postProcess: 'resolveAppName' })
                        }
                    </p>
                    <a href = { _URLS[Platform.OS] }>
                        <button className = { downloadButtonClassName }>
                            { t(`${_TNS}.downloadApp`) }
                        </button>
                    </a>
                    <p className = { `${_SNS}__text ${_SNS}__text_small` }>
                        { translateToHTML(t, `${_TNS}.appInstalled`) }
                    </p>
                    <a href = { this.state.joinURL }>
                        <button className = { `${_SNS}__button` }>
                            { t(`${_TNS}.${this.state.joinText}`) }
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
