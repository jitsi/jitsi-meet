import React, { Component } from 'react';

/**
 * Abstract (base) class for a button in Toolbar.
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
         * The name of the Icon of this AbstractToolbarButton.
         */
        iconName: React.PropTypes.string,

        /**
         * The style of the Icon of this AbstractToolbarButton.
         */
        iconStyle: React.PropTypes.object,
        onClick: React.PropTypes.func,
        style:
            React.PropTypes.oneOfType([
                React.PropTypes.array,
                React.PropTypes.object
            ]),
        underlayColor: React.PropTypes.any
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
     * Renders the icon of this Toolbar button.
     *
     * @param {string|ReactClass} type - The React Component type of the icon to
     * be rendered.
     * @protected
     * @returns {ReactElement} The icon of this Toolbar button.
     */
    _renderIcon(type) {
        const props = {};

        'iconName' in this.props && (props.name = this.props.iconName);
        'iconStyle' in this.props && (props.style = this.props.iconStyle);

        return React.createElement(type, props);
    }
}
