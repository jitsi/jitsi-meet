/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Implements a toolbar in React/Web. It is a strip that contains a set of
 * toolbar items such as buttons.
 *
 * @class StatelessToolbar
 * @extends Component
 */
export default class StatelessToolbar extends Component<*> {
    /**
     * Base toolbar component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Children of current React component.
         */
        children: PropTypes.node,

        /**
         * Toolbar's class name.
         */
        className: PropTypes.string,

        /**
         *  Handler for mouse out event.
         */
        onMouseOut: PropTypes.func,

        /**
         * Handler for mouse over event.
         */
        onMouseOver: PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render(): React$Element<*> {
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
