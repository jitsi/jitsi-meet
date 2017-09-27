/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Abstract (base) class for container of React {@link Component} children with
 * a style.
 *
 * @extends Component
 */
export default class AbstractContainer extends Component {
    /**
     * {@code AbstractContainer} component's property types.
     *
     * @static
     */
    static propTypes = {
        children: PropTypes.node,

        /**
         * The event handler/listener to be invoked when this
         * {@code AbstractContainer} is clicked on Web or pressed on React
         * Native. If {@code onClick} is defined and {@link touchFeedback} is
         * undefined, {@code touchFeedback} is considered defined as
         * {@code true}.
         */
        onClick: PropTypes.func,

        /**
         * The style (as in stylesheet) to be applied to this
         * {@code AbstractContainer}.
         */
        style: PropTypes.object,

        /**
         * If this instance is to provide visual feedback when touched, then
         * {@code true}; otherwise, {@code false}. If {@code touchFeedback} is
         * undefined and {@link onClick} is defined, {@code touchFeedback} is
         * considered defined as {@code true}.
         */
        touchFeedback: PropTypes.bool,

        /**
         * If this {@code AbstractContainer} is to be visible, then {@code true}
         * or {@code false} if this instance is to be hidden or not rendered at
         * all.
         */
        visible: PropTypes.bool
    };

    /**
     * Renders this {@code AbstractContainer} as a React {@code Component} of a
     * specific type.
     *
     * @param {string|ReactClass} type - The type of the React {@code Component}
     * which is to be rendered.
     * @param {Object|undefined} props - The read-only React {@code Component}
     * properties, if any, to render. If undefined, the props of this instance
     * will be rendered.
     * @protected
     * @returns {ReactElement}
     */
    _render(type, props) {
        const {
            children,

            /* eslint-disable no-unused-vars */

            // The following properties are defined for the benefit of
            // AbstractContainer and its extenders so they are to not be
            // propagated.
            touchFeedback,
            visible,

            /* eslint-enable no-unused-vars */

            ...filteredProps
        } = props || this.props;

        return React.createElement(type, filteredProps, children);
    }
}
