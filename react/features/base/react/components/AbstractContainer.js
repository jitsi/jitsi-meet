import React, { Component } from 'react';

/**
 * Abstract (base) class for container of React Component children with a style.
 *
 * @extends Component
 */
export default class AbstractContainer extends Component {
    /**
     * AbstractContainer component's property types.
     *
     * @static
     */
    static propTypes = {
        children: React.PropTypes.node,

        /**
         * The event handler/listener to be invoked when this AbstractContainer
         * is clicked on Web or pressed on React Native. If onClick is defined
         * and touchFeedback is undefined, touchFeedback is considered defined
         * as true.
         */
        onClick: React.PropTypes.func,

        /**
         * The style (as in stylesheet) to be applied to this AbstractContainer.
         */
        style: React.PropTypes.object,

        /**
         * True if this instance is to provide visual feedback when touched;
         * otherwise, false. If touchFeedback is undefined and onClick is
         * defined, touchFeedback is considered defined as true.
         */
        touchFeedback: React.PropTypes.bool,

        /**
         * True if this AbstractContainer is to be visible or false if this
         * instance is to be hidden or not rendered at all.
         */
        visible: React.PropTypes.bool
    };

    /**
     * Renders this AbstractContainer as a React Component of a specific type.
     *
     * @param {string|ReactClass} type - The type of the React Component which
     * is to be rendered.
     * @param {Object|undefined} props - The read-only React Component
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
