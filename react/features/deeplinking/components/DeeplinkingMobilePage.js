/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate, translateToHTML } from '../../base/i18n';
import { HideNotificationBarStyle, Platform } from '../../base/react';
import { DialInSummary } from '../../invite';

import { _TNS } from '../constants';
import { generateDeeplinkingURL } from '../functions';

declare var interfaceConfig: Object;

/**
 * The namespace of the CSS styles of DeeplinkingMobilePage.
 *
 * @private
 * @type {string}
 */
const _SNS = 'deeplinking-mobile';

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
 * @class DeeplinkingMobilePage
 */
class DeeplinkingMobilePage extends Component<*, *> {
    state: Object;

    /**
     * DeeplinkingMobilePage component's property types.
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
        const appName = interfaceConfig.NATIVE_APP_NAME;
        const downloadButtonClassName
            = `${_SNS}__button ${_SNS}__button_primary`;

        return (
            <div className = { _SNS }>
                <div className = 'header'>
                    <img
                        className = 'logo'
                        src = '../images/logo-deeplinking.png' />
                </div>
                <div className = { `${_SNS}__body` }>
                    {/* <div className = 'image' /> */}
                    <img
                        className = 'image'
                        src = '../images/deeplinking-image.png' />
                    <p className = { `${_SNS}__text` }>
                        {
                            translateToHTML(
                                t,
                                `${_TNS}.appNotInstalled`,
                                { app: appName })
                        }
                    </p>
                    <a href = { _URLS[Platform.OS] }>
                        <button className = { downloadButtonClassName }>
                            { t(`${_TNS}.downloadApp`) }
                        </button>
                    </a>
                    <a
                        className = { `${_SNS}__href` }
                        href = { this.state.joinURL }>
                        {/* <button className = { `${_SNS}__button` }> */}
                        { t(`${_TNS}.openApp`) }
                        {/* </button> */}
                    </a>
                    <DialInSummary
                        className = 'deeplinking-dial-in'
                        clickableNumbers = { true }
                        room = { _room } />
                </div>
                <HideNotificationBarStyle />
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code DeeplinkingMobilePage} component.
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

export default translate(connect(_mapStateToProps)(DeeplinkingMobilePage));
