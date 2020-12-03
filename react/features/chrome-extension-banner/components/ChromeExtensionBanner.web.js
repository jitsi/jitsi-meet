// @flow

import { jitsiLocalStorage } from '@jitsi/js-utils';
import React, { PureComponent } from 'react';

import {
    createChromeExtensionBannerEvent,
    sendAnalytics
} from '../../analytics';
import { getCurrentConference } from '../../base/conference/functions';
import {
    checkChromeExtensionsInstalled,
    isMobileBrowser
} from '../../base/environment/utils';
import { translate } from '../../base/i18n';
import { Icon, IconClose } from '../../base/icons';
import { browser } from '../../base/lib-jitsi-meet';
import { connect } from '../../base/redux';
import { isVpaasMeeting } from '../../billing-counter/functions';
import logger from '../logger';


declare var interfaceConfig: Object;

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
type Props = {

    /**
     * Contains info about installed/to be installed chrome extension(s).
     */
    bannerCfg: Object,

    /**
     * Conference data, if any
     */
    conference: Object,

    /**
     * Whether I am the current recorder.
     */
    iAmRecorder: boolean,

    /**
     * Whether it's a vpaas meeting or not.
     */
    isVpaas: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,
};

/**
 * The type of the React {@link PureComponent} state of {@link ChromeExtensionBanner}.
 */
type State = {

    /**
     * Keeps the current value of dont show again checkbox
     */
    dontShowAgainChecked: boolean,

    /**
     * Tells whether user pressed install extension or close button.
     */
    closePressed: boolean,

    /**
     * Tells whether should show the banner or not based on extension being installed or not.
     */
    shouldShow: boolean,
};

/**
 * Implements a React {@link PureComponent} which displays a banner having a link to the chrome extension.
 * @class ChromeExtensionBanner
 * @extends PureComponent
 */
class ChromeExtensionBanner extends PureComponent<Props, State> {
    /**
     * Initializes a new {@code ChromeExtensionBanner} instance.
     *
     * @param {Object} props - The read-only React {@code PureComponent} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            dontShowAgainChecked: false,
            closePressed: false,
            shouldShow: false
        };

        this._onClosePressed = this._onClosePressed.bind(this);
        this._onInstallExtensionClick = this._onInstallExtensionClick.bind(this);
        this._shouldNotRender = this._shouldNotRender.bind(this);
        this._onDontShowAgainChange = this._onDontShowAgainChange.bind(this);
    }

    /**
     * Executed on component update.
     * Checks whether any chrome extension from the config is installed.
     *
     * @inheritdoc
     */
    async componentDidUpdate(prevProps) {
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
            hasExtensions
            && hasExtensions.length
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
            && browser.isChrome()
            && !browser.isTwa()
            && !isMobileBrowser()
            && !this.props.isVpaas;
    }

    _onClosePressed: () => void;

    /**
     * Closes the banner for the current session.
     *
     * @returns {void}
     */
    _onClosePressed() {
        sendAnalytics(createChromeExtensionBannerEvent(false));
        this.setState({ closePressed: true });
    }

    _onInstallExtensionClick: () => void;

    /**
     * Opens the chrome extension page.
     *
     * @returns {void}
     */
    _onInstallExtensionClick() {
        sendAnalytics(createChromeExtensionBannerEvent(true));
        window.open(this.props.bannerCfg.url);
        this.setState({ closePressed: true });
    }

    _shouldNotRender: () => boolean;

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

    _onDontShowAgainChange: (object: Object) => void;

    /**
    * Handles the current `don't show again` checkbox state.
    *
    * @param {Object} event - Input change event.
    * @returns {void}
    */
    _onDontShowAgainChange(event) {
        this.setState({ dontShowAgainChecked: event.target.checked });
    }

    /**
     * Implements React's {@link PureComponent#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this._shouldNotRender()) {
            if (this.state.dontShowAgainChecked) {
                jitsiLocalStorage.setItem(DONT_SHOW_AGAIN_CHECKED, 'true');
            }

            return null;
        }
        const { t } = this.props;
        const mainClassNames = this.props.conference
            ? 'chrome-extension-banner chrome-extension-banner__pos_in_meeting'
            : 'chrome-extension-banner';

        return (
            <div className = { mainClassNames }>
                <div className = 'chrome-extension-banner__container'>
                    <div
                        className = 'chrome-extension-banner__icon-container' />
                    <div
                        className = 'chrome-extension-banner__text-container'>
                        { t('chromeExtensionBanner.installExtensionText') }
                    </div>
                    <div
                        className = 'chrome-extension-banner__close-container'
                        onClick = { this._onClosePressed }>
                        <Icon
                            className = 'gray'
                            size = { 12 }
                            src = { IconClose } />
                    </div>
                </div>
                <div
                    className = 'chrome-extension-banner__button-container'>
                    <div
                        className = 'chrome-extension-banner__button-open-url'
                        onClick = { this._onInstallExtensionClick }>
                        <div
                            className = 'chrome-extension-banner__button-text'>
                            { t('chromeExtensionBanner.buttonText') }
                        </div>
                    </div>
                </div>
                <div className = 'chrome-extension-banner__checkbox-container'>
                    <label className = 'chrome-extension-banner__checkbox-label'>
                        <input
                            checked = { this.state.dontShowAgainChecked }
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
const _mapStateToProps = state => {
    return {
        // Using emptyObject so that we don't change the reference every time when _mapStateToProps is called.
        bannerCfg: state['features/base/config'].chromeExtensionBanner || emptyObject,
        conference: getCurrentConference(state),
        iAmRecorder: state['features/base/config'].iAmRecorder,
        isVpaas: isVpaasMeeting(state)
    };
};

export default translate(connect(_mapStateToProps)(ChromeExtensionBanner));
