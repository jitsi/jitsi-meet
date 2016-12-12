/* global interfaceConfig, APP, $  */

import React from 'react';
import { connect } from 'react-redux';

import {
    AbstractWelcomePage,
    mapStateToProps
} from './AbstractWelcomePage';

const RIGHT_WATERMARK_STYLES = {
    backgroundImage: 'url(images/rightwatermark.png)'
};

/**
 * The web container rendering the welcome page.
 */
class WelcomePage extends AbstractWelcomePage {

    /**
    * Constructor function of WelcomePage.
    *
    * @param {Object} props - Props to be set.
    **/
    constructor(props) {
        super(props);
        this._initState();

        // Bind event handlers so they are only bound once for every instance.
        const onToggleDisableWelcome = this._onToggleDisableWelcomePage;

        this._onRoomChange = this._onRoomChange.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._setInput = this._setInput.bind(this);
        this._onUpdateRoomname = this._onUpdateRoomname.bind(this);
        this._onToggleDisableWelcomePage = onToggleDisableWelcome.bind(this);
    }

    /**
    * Method that initializes state of the component.
    *
    * @returns {void}
    **/
    _initState() {
        const showPoweredBy = interfaceConfig.SHOW_POWERED_BY;
        const generateRoomnames
            = interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE;
        const enableWelcomePage = true;
        const showJitsiWatermark = interfaceConfig.SHOW_JITSI_WATERMARK;
        const showBrandWatermark = interfaceConfig.SHOW_BRAND_WATERMARK;
        let jitsiWatermarkLink = '';
        let brandWatermarkLink = '';

        if (showJitsiWatermark) {
            jitsiWatermarkLink = interfaceConfig.JITSI_WATERMARK_LINK;
        }

        if (showBrandWatermark) {
            brandWatermarkLink = interfaceConfig.BRAND_WATERMARK_LINK;
        }

        this.state = Object.assign({}, this.state, {
            showPoweredBy,
            generateRoomnames,
            showJitsiWatermark,
            showBrandWatermark,
            jitsiWatermarkLink,
            brandWatermarkLink,
            enableWelcomePage
        });
    }

    /**
    * Returns the domain name.
    *
    * @private
    * @returns {string} Domain name.
    **/
    _getDomain() {
        return `${window.location.protocol}//${window.location.host}/`;
    }

    /**
    * This method is executed when comonent is mounted.
    *
    * @inheritdoc
    */
    componentDidMount() {
        if (this.state.generateRoomnames) {
            this._updateRoomname();
        }

        // XXX Temporary solution until we add React translation.
        APP.translation.translateElement($('#welcome_page'));
    }

    /**
    * Handles toggling disable welcome page checkbox
    *
    * @returns {void}
    **/
    _onToggleDisableWelcomePage() {
        const shouldEnable = this.state.enableWelcomePage;

        this.setState({
            enableWelcomePage: !shouldEnable
        }, () => {
            APP.settings.setWelcomePageEnabled(this.state.enableWelcomePage);
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
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
            </div>
        );
    }

    /**
    * Sets input element as property of class.
    *
    * @param {HTMLInputElement} input - input element to be set.
    * @returns {void}
    * @private
    **/
    _setInput(input) {
        this.roomNameInput = input;
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

    /**
     * Renders the header part of this WelcomePage.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderHeader() {
        return (
            <div id = 'welcome_page_header'>
                { this._renderJitsiWatermark() }
                { this._renderBrandWatermark() }
                { this._renderPoweredBy() }
                <div id = 'enter_room_container'>
                    <div id = 'enter_room_form'>
                        <div className = 'domain-name' >
                            { this._getDomain() }
                        </div>
                        <div id = 'enter_room'>
                            <input
                                autoFocus = { true }
                                className = 'enter-room__field'
                                data-room-name =
                                    { this.state.generatedRoomname }
                                id = 'enter_room_field'
                                onChange = { this._onRoomChange }
                                onKeyDown = { this._onKeyDown }
                                placeholder = { this.state.roomPlaceholder }
                                ref = { this._setInput }
                                type = 'text'
                                value = { this.state.room } />
                            <div
                                className = 'icon-reload enter-room__reload'
                                onClick = { this._onUpdateRoomname } />
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
                    onChange = { this._onToggleDisableWelcomePage }
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
    * Method that returns brand watermark element if it is enabled.
    *
    * @returns {ReactElement|null} Watermark element or null.
    **/
    _renderBrandWatermark() {
        if (this.state.showBrandWatermark) {
            return (
                <a
                    href = { this.state.brandWatermarkLink }
                    target = '_new'>
                    <div
                        className = 'watermark rightwatermark'
                        style = { RIGHT_WATERMARK_STYLES } />
                </a>
            );
        }

        return null;
    }

    /**
    * Method that returns jitsi watermark element if it is enabled.
    *
    * @returns {ReactElement|null} Watermark element or null.
    **/
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
    * Renders powered by block if it is enabled
    *
    * @returns {void}
    * @private
    **/
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
    * Handles updating roomname.
    *
    * @private
    * @returns {void}
    **/
    _onUpdateRoomname() {
        this._updateRoomname();
    }

    /**
    * Event handler for changing room name input from web.
    *
    * @inheritdoc
    * @override
    * @protected
    */
    _onRoomChange() {
        super._onRoomChange(this.roomNameInput.value);
    }

    /**
    * Handles 'keydown' event and initiate joining the room if 'return' button
    * was pressed.
    *
    * @param {Event} event - Key down event object.
    * @returns {void}
    * @private
    */
    _onKeyDown(event) {
        const RETURN_BUTTON_CODE = 13;

        if (event.keyCode === RETURN_BUTTON_CODE) {
            this._onJoin();
        }
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
