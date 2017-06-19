import React, { Component } from 'react';

import UIUtil from '../../../../../modules/UI/util/UIUtil';

/**
 * React {@code Component} for showing an icon with a tooltip.
 *
 * @extends Component
 */
class BaseIndicator extends Component {
    /**
     * Initializes a new {@code BaseIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * The CSS classes to apply to the root HTML element of the component.
         *
         * @type {string}
         */
        this._classNames = '';

        /**
         * The CSS class which will display an icon.
         *
         * @type {string}
         */
        this._iconClass = '';

        /**
         * An internal reference to the HTML element at the top of the
         * component's DOM hierarchy. The reference is needed for attaching a
         * tooltip.
         *
         * @type {HTMLElement}
         */
        this._rootElement = null;

        /**
         * The translation key for the text to display in the tooltip.
         *
         * @type {string}
         */
        this._tooltipKey = '';

        // Bind event handler so it is only bound once for every instance.
        this._setRootElementRef = this._setRootElementRef.bind(this);
    }

    /**
     * Sets a tooltip which will display when hovering over the component.
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
            <span className = { this._classNames }>
                <i
                    className = { this._iconClass }
                    ref = { this._setRootElementRef } />
            </span>
        );
    }

    /**
     * Sets the internal reference to the root HTML element for the component.
     *
     * @param {HTMLIconElement} element - The root HTML element of the
     * component.
     * @private
     * @returns {void}
     */
    _setRootElementRef(element) {
        this._rootElement = element;
    }

    /**
     * Associate the component as a tooltip trigger so a tooltip may display on
     * hover.
     *
     * @private
     * @returns {void}
     */
    _setTooltip() {
        // TODO Replace UIUtil with an AtlasKit component when a suitable one
        // becomes available for tooltips.
        UIUtil.setTooltip(
            this._rootElement,
            this._tooltipKey,
            'top'
        );
    }
}

export default BaseIndicator;
