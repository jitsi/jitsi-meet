// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createDeepLinkingPageEvent, sendAnalytics } from '../../analytics';
import { IDeeplinkingConfig, IDeeplinkingMobileConfig } from '../../base/config/configType';
import { isSupportedMobileBrowser } from '../../base/environment';
import { translate } from '../../base/i18n';
import { Platform } from '../../base/react';
import { connect } from '../../base/redux';
import { DialInSummary } from '../../invite';
import { openWebApp } from '../actions';
import { _TNS } from '../constants';
import { generateDeepLinkingURL } from '../functions';
import { renderPromotionalFooter } from '../renderPromotionalFooter';

/**
 * The namespace of the CSS styles of DeepLinkingMobilePage.
 *
 * @private
 * @type {string}
 */
const _SNS = 'deep-linking-mobile';

/**
 * The type of the React {@code Component} props of
 * {@link DeepLinkingMobilePage}.
 */
type Props = {

    /**
     * The deeplinking config.
     */
    _deeplinkingCfg: IDeeplinkingConfig,

    /**
     * Application mobile deeplinking config.
     */
    _mobileConfig: IDeeplinkingMobileConfig,

    /**
     * The deeplinking url.
     */
    _deepLinkingUrl: string,

    /**
     * The name of the conference attempting to being joined.
     */
    _room: string,

    /**
     * The page current url.
     */
    _url: URL,

    /**
     * Used to dispatch actions from the buttons.
     */
    dispatch: Dispatch<any>,

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
        this._onLaunchWeb = this._onLaunchWeb.bind(this);
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
        const {
            _deeplinkingCfg: { hideLogo },
            _mobileConfig: { downloadLink, appName },
            _room,
            t,
            _url,
            _deepLinkingUrl
        } = this.props;
        const downloadButtonClassName
            = `${_SNS}__button ${_SNS}__button_primary`;


        const onOpenLinkProperties = downloadLink
            ? {
                // When opening a link to the download page, we want to let the
                // OS itself handle intercepting and opening the appropriate
                // app store. This avoids potential issues with browsers, such
                // as iOS Chrome, not opening the store properly.
            }
            : {
                // When falling back to another URL (Firebase) let the page be
                // opened in a new window. This helps prevent the user getting
                // trapped in an app-open-cycle where going back to the mobile
                // browser re-triggers the app-open behavior.
                target: '_blank',
                rel: 'noopener noreferrer'
            };

        return (
            <div className = { _SNS }>
                <div className = 'header'>
                    {
                        hideLogo
                            ? null
                            : <img
                                alt = { t('welcomepage.logo.logoDeepLinking') }
                                className = 'logo'
                                src = 'images/logo-deep-linking.png' />
                    }
                </div>
                <div className = { `${_SNS}__body` }>
                    <p className = { `${_SNS}__text` }>
                        { t(`${_TNS}.appNotInstalled`, { app: appName }) }
                    </p>
                    <p className = { `${_SNS}__text` }>
                        { t(`${_TNS}.ifHaveApp`) }
                    </p>
                    <a
                        { ...onOpenLinkProperties }
                        className = { `${_SNS}__href` }
                        href = { _deepLinkingUrl }
                        onClick = { this._onOpenApp }
                        target = '_top'>
                        <button className = { `${_SNS}__button ${_SNS}__button_primary` }>
                            { t(`${_TNS}.joinInApp`) }
                        </button>
                    </a>
                    <p className = { `${_SNS}__text` }>
                        { t(`${_TNS}.ifDoNotHaveApp`) }
                    </p>
                    <a
                        { ...onOpenLinkProperties }
                        href = { this._generateDownloadURL() }
                        onClick = { this._onDownloadApp }
                        target = '_top'>
                        <button className = { downloadButtonClassName }>
                            { t(`${_TNS}.downloadApp`) }
                        </button>
                    </a>
                    {
                        isSupportedMobileBrowser()
                            ? (
                                <a
                                    onClick = { this._onLaunchWeb }
                                    target = '_top'>
                                    <button className = { downloadButtonClassName }>
                                        { t(`${_TNS}.launchWebButton`) }
                                    </button>
                                </a>
                            ) : (
                                <b>
                                    { t(`${_TNS}.unsupportedBrowser`) }
                                </b>
                            )
                    }
                    { renderPromotionalFooter() }
                    <DialInSummary
                        className = 'deep-linking-dial-in'
                        clickableNumbers = { true }
                        room = { _room }
                        url = { _url } />
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
        const { _mobileConfig: { downloadLink, dynamicLink, appScheme } } = this.props;

        if (downloadLink && typeof dynamicLink === 'undefined') {
            return downloadLink;
        }

        const {
            apn,
            appCode,
            customDomain,
            ibi,
            isi
        } = dynamicLink || {};

        const domain = customDomain ?? `https://${appCode}.app.goo.gl`;

        return `${domain}/?link=${
            encodeURIComponent(window.location.href)}&apn=${
            apn}&ibi=${
            ibi}&isi=${
            isi}&ius=${
            appScheme}&efr=1`;
    }

    _onDownloadApp: () => void;

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

    _onLaunchWeb: () => void;

    /**
     * Handles launch web button clicks.
     *
     * @returns {void}
     */
    _onLaunchWeb() {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'clicked', 'launchWebButton', { isMobileBrowser: true }));
        this.props.dispatch(openWebApp());
    }

    _onOpenApp: () => void;

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
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { locationURL = {} } = state['features/base/connection'];
    const { deeplinking } = state['features/base/config'];
    const mobileConfig = deeplinking?.[Platform.OS] || {};

    return {
        _deeplinkingCfg: deeplinking || {},
        _mobileConfig: mobileConfig,
        _room: decodeURIComponent(state['features/base/conference'].room),
        _url: locationURL,
        _deepLinkingUrl: generateDeepLinkingURL(state)
    };
}

export default translate(connect(_mapStateToProps)(DeepLinkingMobilePage));
