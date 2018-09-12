/* global interfaceConfig */

import Button from '@atlaskit/button';
import { FieldTextStateless } from '@atlaskit/field-text';
import Tabs from '@atlaskit/tabs';
import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { Platform, Watermarks } from '../../base/react';
import { CalendarList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';
import { SettingsButton, SETTINGS_TABS } from '../../settings';

import { AbstractWelcomePage, _mapStateToProps } from './AbstractWelcomePage';

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
                interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE
        };

        /**
         * The HTML Element used as the container for additional content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentRef = null;

        /**
         * The template to use as the main content for the welcome page. If
         * not found then only the welcome page head will display.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentTemplate = document.getElementById(
            'welcome-page-additional-content-template');

        // Bind event handlers so they are only bound once per instance.
        this._onFormSubmit = this._onFormSubmit.bind(this);
        this._onRoomChange = this._onRoomChange.bind(this);
        this._setAdditionalContentRef
            = this._setAdditionalContentRef.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        document.body.classList.add('welcome-page');

        if (this.state.generateRoomnames) {
            this._updateRoomname();
        }

        if (this._shouldShowAdditionalContent()) {
            this._additionalContentRef.appendChild(
                this._additionalContentTemplate.content.cloneNode(true));
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
        const { t } = this.props;
        const { APP_NAME } = interfaceConfig;
        const showAdditionalContent = this._shouldShowAdditionalContent();

        return (
            <AtlasKitThemeProvider mode = 'light'>
                <div
                    className = { `welcome ${showAdditionalContent
                        ? 'with-content' : 'without-content'}` }
                    id = 'welcome_page'>
                    <div className = 'welcome-watermark'>
                        <Watermarks />
                    </div>
                    <div className = 'header'>
                        <div className = 'header-image' />
                        <div className = 'header-text'>
                            <h1 className = 'header-text-title'>
                                { t('welcomepage.title') }
                            </h1>
                            <p className = 'header-text-description'>
                                { t('welcomepage.appDescription',
                                    { app: APP_NAME }) }
                            </p>
                        </div>
                        <div id = 'enter_room'>
                            <form
                                className = 'enter-room-input'
                                onSubmit = { this._onFormSubmit }>
                                <FieldTextStateless
                                    autoFocus = { true }
                                    id = 'enter_room_field'
                                    isLabelHidden = { true }
                                    label = 'enter_room_field'
                                    onChange = { this._onRoomChange }
                                    placeholder = { this.state.roomPlaceholder }
                                    shouldFitContainer = { true }
                                    type = 'text'
                                    value = { this.state.room } />
                            </form>
                            <Button
                                appearance = 'primary'
                                className = 'welcome-page-button'
                                id = 'enter_room_button'
                                onClick = { this._onJoin }
                                type = 'button'>
                                { t('welcomepage.go') }
                            </Button>
                        </div>
                        { this._renderTabs() }
                    </div>
                    { showAdditionalContent
                        ? <div
                            className = 'welcome-page-content'
                            ref = { this._setAdditionalContentRef } />
                        : null }
                </div>
            </AtlasKitThemeProvider>
        );
    }

    /**
     * Prevents submission of the form and delegates join logic.
     *
     * @param {Event} event - The HTML Event which details the form submission.
     * @private
     * @returns {void}
     */
    _onFormSubmit(event) {
        event.preventDefault();

        this._onJoin();
    }

    /**
     * Overrides the super to account for the differences in the argument types
     * provided by HTML and React Native text inputs.
     *
     * @inheritdoc
     * @override
     * @param {Event} event - The (HTML) Event which details the change such as
     * the EventTarget.
     * @protected
     */
    _onRoomChange(event) {
        super._onRoomChange(event.target.value);
    }

    /**
     * Renders tabs to show previous meetings and upcoming calendar events. The
     * tabs are purposefully hidden on mobile browsers.
     *
     * @returns {ReactElement|null}
     */
    _renderTabs() {
        const isMobileBrowser
            = Platform.OS === 'android' || Platform.OS === 'ios';

        if (isMobileBrowser) {
            return null;
        }

        const { t } = this.props;

        const tabs = [];

        if (CalendarList) {
            tabs.push({
                label: t('welcomepage.calendar'),
                content: <CalendarList />,
                defaultSelected: true
            });
        }

        tabs.push({
            label: t('welcomepage.recentList'),
            content: <RecentList />,
            defaultSelected: !CalendarList
        });

        return (
            <div className = 'tab-container' >
                <div className = 'welcome-page-settings'>
                    <SettingsButton defaultTab = { SETTINGS_TABS.CALENDAR } />
                </div>
                <Tabs tabs = { tabs } />
            </div>);
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
}

export default translate(connect(_mapStateToProps)(WelcomePage));
