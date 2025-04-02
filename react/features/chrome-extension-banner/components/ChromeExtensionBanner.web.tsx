// @ts-expect-error
import { jitsiLocalStorage } from '@jitsi/js-utils';
import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { createChromeExtensionBannerEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { getCurrentConference } from '../../base/conference/functions';
import { IJitsiConference } from '../../base/conference/reducer';
import checkChromeExtensionsInstalled from '../../base/environment/checkChromeExtensionsInstalled.web';
import {
    isMobileBrowser
} from '../../base/environment/utils';
import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconCloseLarge } from '../../base/icons/svg';
import { browser } from '../../base/lib-jitsi-meet';
import { isVpaasMeeting } from '../../jaas/functions';
import logger from '../logger';

const emptyObject = {};

/**
 * Local storage key name for flag telling if user checked 'Don't show again' checkbox on the banner
 * If the user checks this before closing the banner, next time he will access a jitsi domain
 * the banner will not be shown regardless of extensions being installed or not.
 */
const DONT_SHOW_AGAIN_CHECKED = 'hide_chrome_extension_banner';

/**
 * The type of the React {@code PureComponent} props of {@link ChromeExtensionBanner}.
 */
interface IProps extends WithTranslation {

    /**
     * Contains info about installed/to be installed chrome extension(s).
     */
    bannerCfg: {
        chromeExtensionsInfo?: string[];
        edgeUrl?: string;
        url?: string;
    };

    /**
     * Conference data, if any.
     */
    conference?: IJitsiConference;

    /**
     * Whether I am the current recorder.
     */
    iAmRecorder: boolean;

    /**
     * Whether it's a vpaas meeting or not.
     */
    isVpaas: boolean;
}

/**
 * The type of the React {@link PureComponent} state of {@link ChromeExtensionBanner}.
 */
interface IState {

    /**
     * Tells whether user pressed install extension or close button.
     */
    closePressed: boolean;

    /**
     * Keeps the current value of dont show again checkbox.
     */
    dontShowAgainChecked: boolean;

    /**
     * Tells whether should show the banner or not based on extension being installed or not.
     */
    shouldShow: boolean;
}

/**
 * Implements a React {@link PureComponent} which displays a banner having a link to the chrome extension.
 *
 * @class ChromeExtensionBanner
 * @augments PureComponent
 */
class ChromeExtensionBanner extends PureComponent<IProps, IState> {
    isEdge: boolean;

    /**
     * Initializes a new {@code ChromeExtensionBanner} instance.
     *
     * @param {Object} props - The read-only React {@code PureComponent} props with
     * which the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);
        this.state = {
            dontShowAgainChecked: false,
            closePressed: false,
            shouldShow: false
        };

        this.isEdge = /Edg(e)?/.test(navigator.userAgent);
        this._onClosePressed = this._onClosePressed.bind(this);
        this._onInstallExtensionClick = this._onInstallExtensionClick.bind(this);
        this._shouldNotRender = this._shouldNotRender.bind(this);
        this._onDontShowAgainChange = this._onDontShowAgainChange.bind(this);
        this._onCloseKeyPress = this._onCloseKeyPress.bind(this);
        this._onInstallExtensionKeyPress = this._onInstallExtensionKeyPress.bind(this);
    }

    /**
     * Executed on component update.
     * Checks whether any chrome extension from the config is installed.
     *
     * @inheritdoc
     */
    override async componentDidUpdate(prevProps: IProps) {
        if (!this._isSupportedEnvironment()) {
            return;
        }

        const { bannerCfg } = this.props;
        const prevBannerCfg = prevProps.bannerCfg;

        if (bannerCfg.url && !prevBannerCfg.url) {
            logger.info('Chrome extension URL found.');
        }

        if ((bannerCfg.chromeExtensionsInfo || []).length && !(prevBannerCfg.chromeExtensionsInfo || []).length) {
            logger.info('Chrome extension(s) info found.');
        }

        const hasExtensions = await checkChromeExtensionsInstalled(this.props.bannerCfg);

        if (
            hasExtensions?.length
            && hasExtensions.every(ext => !ext)
            && !this.state.shouldShow
        ) {
            this.setState({ shouldShow: true }); // eslint-disable-line
        }
    }

    /**
     * Checks whether the feature is enabled and whether the environment(browser/os)
     * supports it.
     *
     * @returns {boolean}
     */
    _isSupportedEnvironment() {
        return interfaceConfig.SHOW_CHROME_EXTENSION_BANNER
            && browser.isChromiumBased()
            && !browser.isTwa()
            && !isMobileBrowser()
            && !this.props.isVpaas;
    }

    /**
     * Closes the banner for the current session.
     *
     * @returns {void}
     */
    _onClosePressed() {
        sendAnalytics(createChromeExtensionBannerEvent(false));
        this.setState({ closePressed: true });
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onCloseKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onClosePressed();
        }
    }

    /**
     * Opens the chrome extension page.
     *
     * @returns {void}
     */
    _onInstallExtensionClick() {
        const { edgeUrl, url } = this.props.bannerCfg;

        sendAnalytics(createChromeExtensionBannerEvent(true));
        window.open(this.isEdge && edgeUrl ? edgeUrl : url);
        this.setState({ closePressed: true });
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onInstallExtensionKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onClosePressed();
        }
    }

    /**
     * Checks whether the banner should not be rendered.
     *
     * @returns {boolean} Whether to show the banner or not.
     */
    _shouldNotRender() {
        if (!this._isSupportedEnvironment()) {
            return true;
        }

        const dontShowAgain = jitsiLocalStorage.getItem(DONT_SHOW_AGAIN_CHECKED) === 'true';

        return !this.props.bannerCfg.url
            || dontShowAgain
            || this.state.closePressed
            || !this.state.shouldShow
            || this.props.iAmRecorder;
    }

    /**
    * Handles the current `don't show again` checkbox state.
    *
    * @param {Object} event - Input change event.
    * @returns {void}
    */
    _onDontShowAgainChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ dontShowAgainChecked: event.target.checked });
    }

    /**
     * Implements React's {@link PureComponent#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render(): React.ReactNode {
        if (this._shouldNotRender()) {
            if (this.state.dontShowAgainChecked) {
                jitsiLocalStorage.setItem(DONT_SHOW_AGAIN_CHECKED, 'true');
            }

            return null;
        }
        const { bannerCfg, t } = this.props;
        const mainClassNames = this.props.conference
            ? 'chrome-extension-banner chrome-extension-banner__pos_in_meeting'
            : 'chrome-extension-banner';

        return (
            <div className = { mainClassNames }>
                <div
                    aria-describedby = 'chrome-extension-banner__text-container'
                    className = 'chrome-extension-banner__container'
                    role = 'banner'>
                    <div className = 'chrome-extension-banner__icon-container' />
                    <div
                        className = 'chrome-extension-banner__text-container'
                        id = 'chrome-extension-banner__text-container'>
                        { t('chromeExtensionBanner.installExtensionText') }
                    </div>
                    <div
                        aria-label = { t('chromeExtensionBanner.close') }
                        className = 'chrome-extension-banner__close-container'
                        onClick = { this._onClosePressed }
                        onKeyPress = { this._onCloseKeyPress }
                        role = 'button'
                        tabIndex = { 0 }>
                        <Icon
                            className = 'gray'
                            size = { 12 }
                            src = { IconCloseLarge } />
                    </div>
                </div>
                <div
                    className = 'chrome-extension-banner__button-container'>
                    <div
                        aria-labelledby = 'chrome-extension-banner__button-text'
                        className = 'chrome-extension-banner__button-open-url'
                        onClick = { this._onInstallExtensionClick }
                        onKeyPress = { this._onInstallExtensionKeyPress }
                        role = 'button'
                        tabIndex = { 0 }>
                        <div
                            className = 'chrome-extension-banner__button-text'
                            id = 'chrome-extension-banner__button-text'>
                            { t(this.isEdge && bannerCfg.edgeUrl
                                ? 'chromeExtensionBanner.buttonTextEdge'
                                : 'chromeExtensionBanner.buttonText')
                            }
                        </div>
                    </div>
                </div>
                <div className = 'chrome-extension-banner__checkbox-container'>
                    <label
                        className = 'chrome-extension-banner__checkbox-label'
                        htmlFor = 'chrome-extension-banner__checkbox'
                        id = 'chrome-extension-banner__checkbox-label'>
                        <input
                            aria-labelledby = 'chrome-extension-banner__checkbox-label'
                            checked = { this.state.dontShowAgainChecked }
                            id = 'chrome-extension-banner__checkbox'
                            onChange = { this._onDontShowAgainChange }
                            type = 'checkbox' />
                        &nbsp;{ t('chromeExtensionBanner.dontShowAgain') }
                    </label>
                </div>
            </div>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const _mapStateToProps = (state: IReduxState) => {
    return {
        // Using emptyObject so that we don't change the reference every time when _mapStateToProps is called.
        bannerCfg: state['features/base/config'].chromeExtensionBanner || emptyObject,
        conference: getCurrentConference(state),
        iAmRecorder: Boolean(state['features/base/config'].iAmRecorder),
        isVpaas: isVpaasMeeting(state)
    };
};

export default translate(connect(_mapStateToProps)(ChromeExtensionBanner));
