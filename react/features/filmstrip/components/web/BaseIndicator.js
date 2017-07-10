import React, { Component } from 'react';

import UIUtil from '../../../../../modules/UI/util/UIUtil';

/**
 * React {@code Component} for showing an icon with a tooltip.
 *
 * @extends Component
 */
class BaseIndicator extends Component {
    static defaultProps = {
        className: '',
        iconClassName: '',
        iconSize: 'auto',
        id: ''
    };

    static propTypes = {
        /**
         * The CSS class names to set on the root element of the component.
         */
        className: React.PropTypes.string,

        /**
         * The CSS classnames to set on the icon element of the component.
         */
        iconClassName: React.PropTypes.string,

        /**
         * The front size for the icon.
         */
        iconSize: React.PropTypes.string,

        /**
         * The ID attribue to set on the root element of the component.
         */
        id: React.PropTypes.string,

        /**
         * The translation key to use for displaying a tooltip when hovering
         * over the component.
         */
        tooltipKey: React.PropTypes.string
    };

    /**
     * Initializes a new {@code BaseIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * An internal reference to the HTML element at the top of the
         * component's DOM hierarchy. The reference is needed for attaching a
         * tooltip.
         *
         * @type {HTMLElement}
         */
        this._rootElement = null;

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
            <span
                className = { this.props.className }
                id = { this.props.id }
                ref = { this._setRootElementRef }>
                <i
                    className = { this.props.iconClassName }
                    style = {{ fontSize: this.props.iconSize }} />
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
            this.props.tooltipKey,
            'top'
        );
    }
}

export default BaseIndicator;
