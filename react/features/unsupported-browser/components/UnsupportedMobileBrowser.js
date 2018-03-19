/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate, translateToHTML } from '../../base/i18n';
import { Platform } from '../../base/react';
import { generateDeeplinkingURL } from '../../deeplinking';
import { DialInSummary } from '../../invite';

import HideNotificationBarStyle from './HideNotificationBarStyle';

declare var interfaceConfig: Object;

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
    android: interfaceConfig.MOBILE_DOWNLOAD_LINK_ANDROID
        || 'https://play.google.com/store/apps/details?id=org.jitsi.meet',
    ios: interfaceConfig.MOBILE_DOWNLOAD_LINK_IOS
        || 'https://itunes.apple.com/us/app/jitsi-meet/id1165103905'
};

/**
 * React component representing mobile browser page.
 *
 * @class UnsupportedMobileBrowser
 */
class UnsupportedMobileBrowser extends Component<*, *> {
    state: Object;

    /**
     * UnsupportedMobileBrowser component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The name of the conference attempting to being joined.
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
        this.setState({
            joinURL: generateDeeplinkingURL()
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _room, t } = this.props;

        const openAppButtonClassName
            = `${_SNS}__button ${_SNS}__button_primary`;
        const appName
            = interfaceConfig.ADD_PEOPLE_APP_NAME || interfaceConfig.APP_NAME;

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
                                { app: appName })
                        }
                    </p>
                    <a href = { this.state.joinURL }>
                        <button className = { openAppButtonClassName }>
                            { t(`${_TNS}.openApp`,
                                { app: appName }) }
                        </button>
                    </a>
                    <a href = { _URLS[Platform.OS] }>
                        <button className = { `${_SNS}__button` }>
                            { t(`${_TNS}.downloadApp`) }
                        </button>
                    </a>
                    { _room
                        ? <DialInSummary
                            className = 'unsupported-dial-in'
                            clickableNumbers = { true }
                            room = { _room } />
                        : null }
                </div>
                <HideNotificationBarStyle />
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code UnsupportedMobileBrowser} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _room: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        _room: state['features/base/conference'].room
    };
}

export default translate(connect(_mapStateToProps)(UnsupportedMobileBrowser));
