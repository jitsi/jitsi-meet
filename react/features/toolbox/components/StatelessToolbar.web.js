/* @flow */

import React, { Component } from 'react';

/**
 * Implements a toolbar in React/Web. It is a strip that contains a set of
 * toolbar items such as buttons.
 *
 * @class StatelessToolbar
 * @extends Component
 */
export default class StatelessToolbar extends Component {
    /**
     * Base toolbar component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Children of current React component.
         */
        children: React.PropTypes.node,

        /**
         * Toolbar's class name.
         */
        className: React.PropTypes.string,

        /**
         *  Handler for mouse out event.
         */
        onMouseOut: React.PropTypes.func,

        /**
         * Handler for mouse over event.
         */
        onMouseOver: React.PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render(): ReactElement<*> {
        const {
            className,
            onMouseOut,
            onMouseOver
        } = this.props;

        return (
            <div
                className = { `toolbar ${className}` }
                onMouseOut = { onMouseOut }
                onMouseOver = { onMouseOver }>
                {
                    this.props.children
                }
            </div>
        );
    }
}
