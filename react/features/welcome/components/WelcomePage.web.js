/* global interfaceConfig */

import React from 'react';

import { isMobileBrowser } from '../../base/environment/utils';
import { translate, translateToHTML } from '../../base/i18n';
import { Icon, IconWarning } from '../../base/icons';
import { connect } from '../../base/redux';
import { CalendarList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';
import { SettingsButton, SETTINGS_TABS } from '../../settings';

import { AbstractWelcomePage, _mapStateToProps } from './AbstractWelcomePage';
import Tabs from './Tabs';
import { isBraveBrowser } from '../../base/environment';
import { BRAVE_DOWNLOAD } from '../../unsupported-browser/components/browserLinks';

/**
 * The pattern used to validate room name.
 * @type {string}
 */
export const ROOM_NAME_VALIDATE_PATTERN_STR = '^[^?&:\u0022\u0027%#]+$';

/**
 * Maximum number of pixels corresponding to a mobile layout.
 * @type {number}
 */
const WINDOW_WIDTH_THRESHOLD = 425;

/**
 * The Web container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {
    /**
     * Default values for {@code WelcomePage} component's properties.
     *
     * @static
     */
    static defaultProps = {
        _room: ''
    };

    /**
     * Initializes a new WelcomePage instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            ...this.state,

            generateRoomnames:
                interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE,
            selectedTab: 0
        };

        /**
         * The HTML Element used as the container for additional content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentRef = null;

        this._roomInputRef = null;

        /**
         * The HTML Element used as the container for additional toolbar content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalToolbarContentRef = null;

        /**
         * The template to use as the main content for the welcome page. If
         * not found then only the welcome page head will display.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentTemplate = document.getElementById(
            'welcome-page-additional-content-template');

        /**
         * The template to use as the additional content for the welcome page header toolbar.
         * If not found then only the settings icon will be displayed.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalToolbarContentTemplate = document.getElementById(
            'settings-toolbar-additional-content-template'
        );

        // Bind event handlers so they are only bound once per instance.
        this._setAdditionalContentRef
            = this._setAdditionalContentRef.bind(this);
        this._setRoomInputRef = this._setRoomInputRef.bind(this);
        this._setAdditionalToolbarContentRef
            = this._setAdditionalToolbarContentRef.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        super.componentDidMount();

        document.body.classList.add('welcome-page');
        document.title = interfaceConfig.APP_NAME;

        if (this.state.generateRoomnames) {
            this._updateRoomname();
        }

        if (this._shouldShowAdditionalContent()) {
            this._additionalContentRef.appendChild(
                this._additionalContentTemplate.content.cloneNode(true));
        }

        if (this._shouldShowAdditionalToolbarContent()) {
            this._additionalToolbarContentRef.appendChild(
                this._additionalToolbarContentTemplate.content.cloneNode(true)
            );
        }
    }

    /**
     * Removes the classname used for custom styling of the welcome page.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        super.componentWillUnmount();

        document.body.classList.remove('welcome-page');
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const { _moderatedRoomServiceUrl, t } = this.props;
        const { APP_NAME } = interfaceConfig;
        const showAdditionalContent = this._shouldShowAdditionalContent();
        const showAdditionalToolbarContent = this._shouldShowAdditionalToolbarContent();
        const showResponsiveText = this._shouldShowResponsiveText();

        return (
            <div
                className = { `welcome ${showAdditionalContent
                    ? 'with-content' : 'without-content'}` }
                id = 'welcome_page'>
                <a
                    className = 'welcome-watermark'
                    href = { 'https://brave.com/download/' } />
                <div className = 'header'>
                    { isBraveBrowser() ? <div className = 'welcome-page-settings'>
                        <SettingsButton
                            defaultTab = { SETTINGS_TABS.CALENDAR } />
                        { showAdditionalToolbarContent
                            ? <div
                                className = 'settings-toolbar-content'
                                ref = { this._setAdditionalToolbarContentRef } />
                            : null
                        }
                    </div> : null}
                    <div className = 'header-today-logo' />
                    <div className = 'header-text'>
                        <h1 className = 'header-text-title'>
                            { t('welcomepage.title') }
                        </h1>
                        <p className = 'header-text-description'>
                            { t('welcomepage.appDescription') }
                            &nbsp;Learn about&nbsp;
                            <a href = { 'https://brave.com/privacy/#brave-together-learn' }>
                                privacy protection and data use.
                            </a>
                        </p>
                    </div>
                    <div id = 'enter_room'>
                        { isBraveBrowser() ? <div
                            className = 'welcome-page-button'
                            id = 'enter_room_button'
                            onClick = { this._onLaunchCall }>
                            {
                                showResponsiveText
                                    ? t('welcomepage.goSmall')
                                    : t('welcomepage.go')
                            }
                        </div> : <div
                            className = 'welcome-page-button-download'
                            id = 'download_button'
                            onClick = { this._onDownloadBrave }>
                            { t('welcomepage.download') }
                        </div> }
                    </div>
                    { _moderatedRoomServiceUrl && (
                        <div id = 'moderated-meetings'>
                            <p>
                                {
                                    translateToHTML(
                                        t, 'welcomepage.moderatedMessage', { url: _moderatedRoomServiceUrl })
                                }
                            </p>
                        </div>
                    ) }
                    { this._renderTabs() }
                </div>
                { showAdditionalContent
                    ? <div
                        className = 'welcome-page-content'
                        ref = { this._setAdditionalContentRef } />
                    : null }
            </div>
        );
    }

    /**
     * Renders the insecure room name warning.
     *
     * @inheritdoc
     */
    _doRenderInsecureRoomNameWarning() {
        return (
            <div className = 'insecure-room-name-warning'>
                <Icon src = { IconWarning } />
                <span>
                    { this.props.t('security.insecureRoomNameWarning') }
                </span>
            </div>
        );
    }

    /**
     * Redirects to call with new random name.
     *
     * @returns {ReactElement|null}
     */
    _onLaunchCall() {
        const windowCrypto = typeof window !== 'undefined' && (window.crypto || window.msCrypto);
        const buf = new Uint8Array(32);

        windowCrypto.getRandomValues(buf);

        const name = btoa(String.fromCharCode.apply(null, buf))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        window.open(`https://together.brave.com/${name}`, '_self');
    }

    /**
     * Redirects to Brave download page
     *
     * @returns {ReactElement|null}
     */
    _onDownloadBrave() {
        window.open(BRAVE_DOWNLOAD, '_self');
    }

    /**
     * Renders tabs to show previous meetings and upcoming calendar events. The
     * tabs are purposefully hidden on mobile browsers.
     *
     * @returns {ReactElement|null}
     */
    _renderTabs() {
        if (isMobileBrowser()) {
            return null;
        }

        const { _calendarEnabled, _recentListEnabled, t } = this.props;

        const tabs = [];

        if (_calendarEnabled) {
            tabs.push({
                label: t('welcomepage.calendar'),
                content: <CalendarList />
            });
        }

        if (_recentListEnabled) {
            tabs.push({
                label: t('welcomepage.recentList'),
                content: <RecentList />
            });
        }

        if (tabs.length === 0) {
            return null;
        }

        return (
            <Tabs
                onSelect = { this._onTabSelected }
                selected = { this.state.selectedTab }
                tabs = { tabs } />);
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * welcome page content.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the welcome page content.
     * @private
     * @returns {void}
     */
    _setAdditionalContentRef(el) {
        this._additionalContentRef = el;
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * toolbar additional content.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the additional toolbar content.
     * @private
     * @returns {void}
     */
    _setAdditionalToolbarContentRef(el) {
        this._additionalToolbarContentRef = el;
    }

    /**
     * Sets the internal reference to the HTMLInputElement used to hold the
     * welcome page input room element.
     *
     * @param {HTMLInputElement} el - The HTMLElement for the input of the room name on the welcome page.
     * @private
     * @returns {void}
     */
    _setRoomInputRef(el) {
        this._roomInputRef = el;
    }

    /**
     * Returns whether or not additional content should be displayed below
     * the welcome page's header for entering a room name.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalContent() {
        return interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT
            && this._additionalContentTemplate
            && this._additionalContentTemplate.content
            && this._additionalContentTemplate.innerHTML.trim();
    }

    /**
     * Returns whether or not additional content should be displayed inside
     * the header toolbar.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalToolbarContent() {
        return interfaceConfig.DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT
            && this._additionalToolbarContentTemplate
            && this._additionalToolbarContentTemplate.content
            && this._additionalToolbarContentTemplate.innerHTML.trim();
    }

    /**
     * Returns whether or not the screen has a size smaller than a custom margin
     * and therefore display different text in the go button.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowResponsiveText() {
        const { innerWidth } = window;

        return innerWidth <= WINDOW_WIDTH_THRESHOLD;
    }

}

export default translate(connect(_mapStateToProps)(WelcomePage));
