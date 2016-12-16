/* global APP, interfaceConfig */

import React from 'react';
import { connect } from 'react-redux';

import { Conference } from '../../conference';

import { AbstractWelcomePage, mapStateToProps } from './AbstractWelcomePage';

/**
 * The CSS style of the element with CSS class <tt>rightwatermark</tt>.
 */
const RIGHT_WATERMARK_STYLE = {
    backgroundImage: 'url(images/rightwatermark.png)'
};

/* eslint-disable require-jsdoc */

/**
 * The Web container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {

/* eslint-enable require-jsdoc */

    /**
     * Initializes a new WelcomePage instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._initState();

        // Bind event handlers so they are only bound once for every instance.
        this._onDisableWelcomeChange = this._onDisableWelcomeChange.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onRoomChange = this._onRoomChange.bind(this);
    }

    /**
     * This method is executed when comonent is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        if (this.state.generateRoomnames) {
            this._updateRoomname();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        // FIXME The rendering of Conference bellow is a very quick and dirty
        // temporary fix for the following issue: when the WelcomePage is
        // disabled, app.js expects Conference to be rendered already and only
        // then it builds a room name but the App component expects the room
        // name to be built already (by looking at the window's location) in
        // order to choose between WelcomePage and Conference.
        return (
            <div>
                <div id = 'welcome_page'>
                    {
                        this._renderHeader()
                    }
                    {
                        this._renderMain()
                    }
                </div>
                <Conference />
            </div>
        );
    }

    /**
     * Returns the domain name.
     *
     * @private
     * @returns {string} Domain name.
     */
    _getDomain() {
        return `${window.location.protocol}//${window.location.host}/`;
    }

    /**
     * Method that initializes state of the component.
     *
     * @returns {void}
     */
    _initState() {
        const showBrandWatermark = interfaceConfig.SHOW_BRAND_WATERMARK;
        const showJitsiWatermark = interfaceConfig.SHOW_JITSI_WATERMARK;

        this.state = {
            ...this.state,
            brandWatermarkLink:
                showBrandWatermark ? interfaceConfig.BRAND_WATERMARK_LINK : '',
            enableWelcomePage: true,
            generateRoomnames:
                interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE,
            jitsiWatermarkLink:
                showJitsiWatermark ? interfaceConfig.JITSI_WATERMARK_LINK : '',
            showBrandWatermark,
            showJitsiWatermark,
            showPoweredBy: interfaceConfig.SHOW_POWERED_BY
        };
    }

    /**
     * Handles <tt>change</tt> event of the checkbox which allows specifying
     * whether the WelcomePage is disabled.
     *
     * @param {Event} event - The (HTML) Event which details the change such as
     * the EventTarget.
     * @returns {void}
     */
    _onDisableWelcomeChange(event) {
        this.setState({
            enableWelcomePage: !event.target.value
        }, () => {
            APP.settings.setWelcomePageEnabled(this.state.enableWelcomePage);
        });
    }

    /**
     * Overrides the super in order to prevent the dispatching of the Redux
     * action SET_ROOM.
     *
     * @override
     * @protected
     * @returns {null}
     */
    _onJoin() {
        // Don't call the super implementation and thus prevent the dispatching
        // of the Redux action SET_ROOM.
    }

    /**
     * Handles 'keydown' event to initiate joining the room when the
     * 'Enter/Return' button is pressed.
     *
     * @param {Event} event - Key down event object.
     * @private
     * @returns {void}
     */
    _onKeyDown(event) {
        if (event.keyCode === /* Enter */ 13) {
            this._onJoin();
        }
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
     * Method that returns brand watermark element if it is enabled.
     *
     * @private
     * @returns {ReactElement|null} Watermark element or null.
     */
    _renderBrandWatermark() {
        if (this.state.showBrandWatermark) {
            return (
                <a
                    href = { this.state.brandWatermarkLink }
                    target = '_new'>
                    <div
                        className = 'watermark rightwatermark'
                        style = { RIGHT_WATERMARK_STYLE } />
                </a>
            );
        }

        return null;
    }

    /**
     * Renders a feature with a specific index.
     *
     * @param {number} index - The index of the feature to render.
     * @private
     * @returns {ReactElement}
     */
    _renderFeature(index) {
        return (
            <div className = 'feature_holder'>
                <div
                    className = 'feature_icon'
                    data-i18n = { `welcomepage.feature${index}.title` } />
                <div
                    className = 'feature_description'
                    data-i18n = { `welcomepage.feature${index}.content` }
                    data-i18n-options = { JSON.stringify({
                        postProcess: 'resolveAppName'
                    }) } />
            </div>
        );
    }

    /**
     * Renders a row of features.
     *
     * @param {number} beginIndex - The inclusive feature index to begin the row
     * with.
     * @param {number} endIndex - The exclusive feature index to end the row
     * with.
     * @private
     * @returns {ReactElement}
     */
    _renderFeatureRow(beginIndex, endIndex) {
        const features = [];

        for (let index = beginIndex; index < endIndex; ++index) {
            features.push(this._renderFeature(index));
        }

        return (
            <div className = 'feature_row'>
                {
                    features
                }
            </div>
        );
    }

/* eslint-disable require-jsdoc */

    /**
     * Renders the header part of this WelcomePage.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderHeader() {

/* eslint-enable require-jsdoc */

        return (
            <div id = 'welcome_page_header'>
                {
                    this._renderJitsiWatermark()
                }
                {
                    this._renderBrandWatermark()
                }
                {
                    this._renderPoweredBy()
                }
                <div id = 'enter_room_container'>
                    <div id = 'enter_room_form'>
                        <div className = 'domain-name'>
                            {
                                this._getDomain()
                            }
                        </div>
                        <div id = 'enter_room'>
                            <input
                                autoFocus = { true }
                                className = 'enter-room__field'
                                data-room-name
                                    = { this.state.generatedRoomname }
                                id = 'enter_room_field'
                                onChange = { this._onRoomChange }
                                onKeyDown = { this._onKeyDown }
                                placeholder = { this.state.roomPlaceholder }
                                type = 'text'
                                value = { this.state.room } />

                            { /* eslint-disable react/jsx-handler-names */ }
                            <div
                                className = 'icon-reload enter-room__reload'
                                onClick = { this._updateRoomname } />
                            { /* eslint-enable react/jsx-handler-names */ }

                            <button
                                className = 'enter-room__button'
                                data-i18n = 'welcomepage.go'
                                id = 'enter_room_button'
                                onClick = { this._onJoin }
                                type = 'button' />
                        </div>
                    </div>
                </div>
                <div id = 'brand_header' />
                <input
                    checked = { !this.state.enableWelcomePage }
                    id = 'disable_welcome'
                    name = 'checkbox'
                    onChange = { this._onDisableWelcomeChange }
                    type = 'checkbox' />
                <label
                    className = 'disable_welcome_position'
                    data-i18n = 'welcomepage.disable'
                    htmlFor = 'disable_welcome' />
                <div id = 'header_text' />
            </div>
        );
    }

    /**
     * Method that returns jitsi watermark element if it is enabled.
     *
     * @private
     * @returns {ReactElement|null} Watermark element or null.
     */
    _renderJitsiWatermark() {
        if (this.state.showJitsiWatermark) {
            return (
                <a
                    href = { this.state.jitsiWatermarkLink }
                    target = '_new'>
                    <div className = 'watermark leftwatermark' />
                </a>
            );
        }

        return null;
    }

    /**
     * Renders powered by block if it is enabled.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderPoweredBy() {
        if (this.state.showPoweredBy) {
            return (
                <a
                    className = 'poweredby'
                    href = 'http://jitsi.org'
                    target = '_new'>
                    <span data-i18n = 'poweredby' /> jitsi.org
                </a>
            );
        }

        return null;
    }

    /**
     * Renders the main part of this WelcomePage.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderMain() {
        return (
            <div id = 'welcome_page_main'>
                <div id = 'features'>
                    {
                        this._renderFeatureRow(1, 5)
                    }
                    {
                        this._renderFeatureRow(5, 9)
                    }
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps)(WelcomePage);
