import React, { Component } from 'react';

/**
 * The web container rendering the welcome page.
 */
export default class WelcomePage extends Component {

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
                <a target = '_new'>
                    <div className = 'watermark leftwatermark' />
                </a>
                <a target = '_new'>
                    <div className = 'watermark rightwatermark' />
                </a>
                <a
                    className = 'poweredby'
                    href = 'http://jitsi.org'
                    target = '_new'>
                    <span data-i18n = 'poweredby' /> jitsi.org
                </a>
                <div id = 'enter_room_container'>
                    <div id = 'enter_room_form'>
                        <div id = 'domain_name' />
                        <div id = 'enter_room'>
                            <input
                                autoFocus = { true }
                                id = 'enter_room_field'
                                type = 'text' />
                            <div
                                className = 'icon-reload'
                                id = 'reload_roomname' />
                            <input
                                data-i18n = '[value]welcomepage.go'
                                id = 'enter_room_button'
                                type = 'button'
                                value = 'GO' />
                        </div>
                    </div>
                </div>
                <div id = 'brand_header' />
                <input
                    id = 'disable_welcome'
                    name = 'checkbox'
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
