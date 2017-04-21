import React, { Component } from 'react';

import UIUtil from '../../../../modules/UI/util/UIUtil';

import { translate } from '../../base/i18n';

/**
 * React {@code Component} for displaying a message to indicate audio only mode
 * is active and for triggering a tooltip to provide more information about
 * audio only mode.
 *
 * @extends Component
 */
export class AudioOnlyLabel extends Component {
    /**
     * {@code AudioOnlyLabel}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    }

    /**
     * Initializes a new {@code AudioOnlyLabel} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * The internal reference to the DOM/HTML element at the top of the
         * React {@code Component}'s DOM/HTML hierarchy. It is necessary for
         * setting a tooltip to display when hovering over the component.
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._rootElement = null;

        // Bind event handlers so they are only bound once for every instance.
        this._setRootElement = this._setRootElement.bind(this);
    }

    /**
     * Sets a tooltip on the component to display on hover.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._setTooltip();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = 'audio-only-label moveToCorner'
                ref = { this._setRootElement }>
                <i className = 'icon-visibility-off' />
            </div>
        );
    }

    /**
     * Sets the instance variable for the component's root element so it can be
     * accessed directly.
     *
     * @param {HTMLDivElement} element - The topmost DOM element of the
     * component's DOM/HTML hierarchy.
     * @private
     * @returns {void}
     */
    _setRootElement(element) {
        this._rootElement = element;
    }

    /**
     * Sets the tooltip on the component's root element.
     *
     * @private
     * @returns {void}
     */
    _setTooltip() {
        UIUtil.setTooltip(
            this._rootElement,
            'audioOnly.howToDisable',
            'left'
        );
    }
}

export default translate(AudioOnlyLabel);
