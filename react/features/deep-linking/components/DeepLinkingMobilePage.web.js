// @flow

import React, { Component } from 'react';
import { connect } from '../../base/redux';

import { createDeepLinkingPageEvent, sendAnalytics } from '../../analytics';
import { translate, translateToHTML } from '../../base/i18n';
import { Platform } from '../../base/react';
import { DialInSummary } from '../../invite';

import { _TNS } from '../constants';
import { generateDeepLinkingURL } from '../functions';

declare var interfaceConfig: Object;

/**
 * The namespace of the CSS styles of DeepLinkingMobilePage.
 *
 * @private
 * @type {string}
 */
const _SNS = 'deep-linking-mobile';

/**
 * The map of platforms to URLs at which the mobile app for the associated
 * platform is available for download.
 *
 * @private
 * @type {Array<string>}
 */
const _URLS = {
    android: interfaceConfig.MOBILE_DOWNLOAD_LINK_ANDROID,
    ios: interfaceConfig.MOBILE_DOWNLOAD_LINK_IOS
};

/**
 * The type of the React {@code Component} props of
 * {@link DeepLinkingMobilePage}.
 */
type Props = {

    /**
     * The name of the conference attempting to being joined.
     */
    _room: string,

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

/**
 * React component representing mobile browser page.
 *
 * @class DeepLinkingMobilePage
 */
class DeepLinkingMobilePage extends Component<Props> {
    /**
     * Initializes a new {@code DeepLinkingMobilePage} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onDownloadApp = this._onDownloadApp.bind(this);
        this._onOpenApp = this._onOpenApp.bind(this);
    }

    /**
     * Implements the Component's componentDidMount method.
     *
     * @inheritdoc
     */
    componentDidMount() {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'displayed', 'DeepLinkingMobile', { isMobileBrowser: true }));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _room, t } = this.props;
        const { NATIVE_APP_NAME, SHOW_DEEP_LINKING_IMAGE } = interfaceConfig;
        const downloadButtonClassName
            = `${_SNS}__button ${_SNS}__button_primary`;

        return (
            <div className = { _SNS }>
                <div className = 'header'>
                    <img
                        className = 'logo'
                        src = 'images/logo-deep-linking.png' />
                </div>
                <div className = { `${_SNS}__body` }>
                    {
                        SHOW_DEEP_LINKING_IMAGE
                            ? <img
                                className = 'image'
                                src = 'images/deep-linking-image.png' />
                            : null
                    }
                    <p className = { `${_SNS}__text` }>
                        {
                            translateToHTML(
                                t,
                                `${_TNS}.appNotInstalled`,
                                { app: NATIVE_APP_NAME })
                        }
                    </p>
                    <a
                        href = { this._generateDownloadURL() }
                        onClick = { this._onDownloadApp }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        <button className = { downloadButtonClassName }>
                            { t(`${_TNS}.downloadApp`) }
                        </button>
                    </a>
                    <a
                        className = { `${_SNS}__href` }
                        href = { generateDeepLinkingURL() }
                        onClick = { this._onOpenApp }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        {/* <button className = { `${_SNS}__button` }> */}
                        { t(`${_TNS}.openApp`) }
                        {/* </button> */}
                    </a>
                    <DialInSummary
                        className = 'deep-linking-dial-in'
                        clickableNumbers = { true }
                        room = { _room } />
                </div>
            </div>
        );
    }

    /**
     * Generates the URL for downloading the app.
     *
     * @private
     * @returns {string} - The URL for downloading the app.
     */
    _generateDownloadURL() {
        const url = _URLS[Platform.OS];

        if (url) {
            return url;
        }

        // For information about the properties of
        // interfaceConfig.MOBILE_DYNAMIC_LINK check:
        // https://firebase.google.com/docs/dynamic-links/create-manually
        const {
            APN = 'org.jitsi.meet',
            APP_CODE = 'w2atb',
            IBI = 'com.atlassian.JitsiMeet.ios',
            ISI = '1165103905'
        } = interfaceConfig.MOBILE_DYNAMIC_LINK || {};
        const IUS = interfaceConfig.APP_SCHEME || 'org.jitsi.meet';

        return `https://${APP_CODE}.app.goo.gl/?link=${
            encodeURIComponent(window.location.href)}&apn=${
            APN}&ibi=${
            IBI}&isi=${
            ISI}&ius=${
            IUS}&efr=1`;
    }

    _onDownloadApp: () => {};

    /**
     * Handles download app button clicks.
     *
     * @private
     * @returns {void}
     */
    _onDownloadApp() {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'clicked', 'downloadAppButton', { isMobileBrowser: true }));
    }

    _onOpenApp: () => {};

    /**
     * Handles open app button clicks.
     *
     * @private
     * @returns {void}
     */
    _onOpenApp() {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'clicked', 'openAppButton', { isMobileBrowser: true }));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code DeepLinkingMobilePage} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _room: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        _room: decodeURIComponent(state['features/base/conference'].room)
    };
}

export default translate(connect(_mapStateToProps)(DeepLinkingMobilePage));
