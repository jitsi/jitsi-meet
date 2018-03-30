import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Abstract (base) class for a button in {@link Toolbar}.
 *
 * @abstract
 */
export default class AbstractToolbarButton extends Component {
    /**
     * AbstractToolbarButton component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * A succinct description of what the button does. Used by accessibility
         * tools and torture tests.
         */
        accessibilityLabel: PropTypes.string,

        /**
         * The name of the Icon of this {@code AbstractToolbarButton}.
         */
        iconName: PropTypes.string,

        /**
         * The style of the Icon of this {@code AbstractToolbarButton}.
         */
        iconStyle: PropTypes.object,

        /**
         * On click handler.
         */
        onClick: PropTypes.func,

        /**
         * {@code AbstractToolbarButton} styles.
         */
        style:
            PropTypes.oneOfType([
                PropTypes.array,
                PropTypes.object
            ]),

        /**
         * The color underlaying the button.
         */
        underlayColor: PropTypes.any
    };

    /**
     * Initializes a new {@code AbstractToolbarButton} instance.
     *
     * @param {Object} props - The React {@code Component} props to initialize
     * the new {@code AbstractToolbarButton} instance with.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Handles clicking/pressing this {@code AbstractToolbarButton} by
     * forwarding the event to the {@code onClick} prop of this instance if any.
     *
     * @protected
     * @returns {*} The result returned by the invocation of the {@code onClick}
     * prop of this instance if any.
     */
    _onClick(...args) {
        const { onClick } = this.props;

        return onClick && onClick(...args);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return this._renderButton(this._renderIcon());
    }

    /**
     * Renders the icon of this {@code AbstractToolbarButton}.
     *
     * @param {string|ReactClass} type - The React Component type of the icon to
     * be rendered.
     * @protected
     * @returns {ReactElement} The icon of this {@code AbstractToolbarButton}.
     */
    _renderIcon(type) {
        const props = {};

        'iconName' in this.props && (props.name = this.props.iconName);
        'iconStyle' in this.props && (props.style = this.props.iconStyle);

        return React.createElement(type, props);
    }
}
