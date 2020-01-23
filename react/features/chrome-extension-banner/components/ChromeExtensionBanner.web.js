// @flow
import React, { PureComponent } from 'react';
import { connect } from '../../base/redux';
import { Icon, IconClose } from '../../base/icons';
import { translate } from '../../base/i18n';
import { getCurrentConference } from '../../base/conference/functions';

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
     * Conference data, if any
     */
    conference: Object,

    /**
     * The url of the chrome extension
     */
    chromeExtensionUrl: string,

    /**
     * An array containing info for identifying a chrome extension
     */
    chromeExtensionsInfo: Array<Object>,

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
        this._checkExtensionsInstalled = this._checkExtensionsInstalled.bind(this);
        this._shouldNotRender = this._shouldNotRender.bind(this);
        this._onDontShowAgainChange = this._onDontShowAgainChange.bind(this);
    }

    /**
     * Executed on component update.
     * Checks whether any chrome extension from the config is installed.
     *
     * @inheritdoc
     */
    async componentDidUpdate() {
        const hasExtensions = await this._checkExtensionsInstalled();

        if (
            hasExtensions
            && hasExtensions.length
            && hasExtensions.every(ext => !ext)
            && !this.state.shouldShow
        ) {
            this.setState({ shouldShow: true }); // eslint-disable-line
        }
    }

    _onClosePressed: () => void;

    /**
     * Closes the banner for the current session.
     *
     * @returns {void}
     */
    _onClosePressed() {
        this.setState({ closePressed: true });
    }

    _onInstallExtensionClick: () => void;

    /**
     * Opens the chrome extension page.
     *
     * @returns {void}
     */
    _onInstallExtensionClick() {
        window.open(this.props.chromeExtensionUrl);
        this.setState({ closePressed: true });
    }

    _checkExtensionsInstalled: () => Promise<*>;

    /**
     * Checks whether the chrome extensions defined in the config file are installed or not.
     *
     * @returns {Promise[]}
     */
    _checkExtensionsInstalled() {
        const isExtensionInstalled = info => new Promise(resolve => {
            const img = new Image();

            img.src = `chrome-extension://${info.id}/${info.path}`;
            img.onload = function() {
                resolve(true);
            };
            img.onerror = function() {
                resolve(false);
            };
        });
        const extensionInstalledFunction = info => isExtensionInstalled(info);

        if (!this.props.chromeExtensionsInfo.length) {
            console.warn('Further configuration needed, missing chrome extension(s) info');
        }

        return Promise.all(
            this.props.chromeExtensionsInfo.map(info => extensionInstalledFunction(info))
        );
    }

    _shouldNotRender: () => boolean;

    /**
     * Checks whether the banner should be displayed based on:
     * Whether there is a configuration issue with the chrome extensions data.
     * Whether the user checked don't show again checkbox in a previous session.
     * Whether the user closed the banner.
     * Whether the extension is already installed.
     *
     * @returns {boolean} whether to show the banner or not.
     */
    _shouldNotRender() {
        if (!this.props.chromeExtensionUrl) {
            console.warn('Further configuration needed, missing chrome extension URL');

            return true;
        }

        const dontShowAgain = localStorage.getItem(DONT_SHOW_AGAIN_CHECKED) === 'true';

        return dontShowAgain
        || this.state.closePressed
        || !this.state.shouldShow;
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
                localStorage.setItem(DONT_SHOW_AGAIN_CHECKED, 'true');
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
    const bannerCfg = state['features/base/config'].chromeExtensionBanner || {};

    return {
        chromeExtensionUrl: bannerCfg.url,
        chromeExtensionsInfo: bannerCfg.chromeExtensionsInfo || [],
        conference: getCurrentConference(state)
    };
};

export default translate(connect(_mapStateToProps)(ChromeExtensionBanner));
