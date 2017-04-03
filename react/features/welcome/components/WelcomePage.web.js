/* global APP, interfaceConfig */

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { Watermarks } from '../../base/react';

import { AbstractWelcomePage, _mapStateToProps } from './AbstractWelcomePage';

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

        this.state = {
            ...this.state,

            enableWelcomePage: true,
            generateRoomnames:
                interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE
        };

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
        return (
            <div id = 'welcome_page'>
                {
                    this._renderHeader()
                }
                {
                    this._renderMain()
                }
            </div>
        );
    }

    /**
     * Returns the URL of this WelcomePage for display purposes. For
     * historic/legacy reasons, the return value is referred to as domain.
     *
     * @private
     * @returns {string} The URL of this WelcomePage for display purposes.
     */
    _getDomain() {
        // As the returned URL is for display purposes, do not return the
        // userinfo, query and fragment URI parts.
        const wl = window.location;

        return `${wl.protocol}//${wl.host}${wl.pathname}`;
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
            enableWelcomePage: !event.target.checked
        }, () => {
            APP.settings.setWelcomePageEnabled(this.state.enableWelcomePage);
        });
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
     * Renders a feature with a specific index.
     *
     * @param {number} index - The index of the feature to render.
     * @private
     * @returns {ReactElement}
     */
    _renderFeature(index) {
        const { t } = this.props;
        const tns = `welcomepage.feature${index}`;

        return (
            <div
                className = 'feature_holder'
                key = { index } >
                <div className = 'feature_icon'>
                    { t(`${tns}.title`) }
                </div>
                <div className = 'feature_description'>
                    { t(`${tns}.content`, { postProcess: 'resolveAppName' }) }
                </div>
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
        const { t } = this.props;

        return (
            <div id = 'welcome_page_header'>
                <Watermarks />

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
                                id = 'enter_room_button'
                                onClick = { this._onJoin }
                                type = 'button'>
                                { t('welcomepage.go') }
                            </button>
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
                    htmlFor = 'disable_welcome'>
                    { t('welcomepage.disable') }
                </label>
                <div id = 'header_text' />
            </div>
        );
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

export default translate(connect(_mapStateToProps)(WelcomePage));
