/* @flow */

import React, { Component } from 'react';

import { getFixedPlatformStyle } from '../../styles';

/**
 * {@code AbstractContainer} Component's property types.
 */
export type Props = {

    /**
     * An optional accessibility label to apply to the container root.
     */
    accessibilityLabel?: string,

    /**
     * Whether or not this element is an accessibility element.
     */
    accessible?: boolean,

    /**
     * React Elements to display within the component.
     */
    children: React$Node,

    /**
     * Class names of the component (for web).
     */
    className?: string,

    /**
     * The event handler/listener to be invoked when this
     * {@code AbstractContainer} is clicked on Web or pressed on React
     * Native. If {@code onClick} is defined and {@link touchFeedback} is
     * undefined, {@code touchFeedback} is considered defined as
     * {@code true}.
     */
    onClick?: ?Function,

    /**
     * The style (as in stylesheet) to be applied to this
     * {@code AbstractContainer}.
     */
    style?: Array<?string> | Object,

    /**
     * If this instance is to provide visual feedback when touched, then
     * {@code true}; otherwise, {@code false}. If {@code touchFeedback} is
     * undefined and {@link onClick} is defined, {@code touchFeedback} is
     * considered defined as {@code true}.
     */
    touchFeedback?: ?Function,

    /**
     * Color to display when clicked.
     */
    underlayColor?: string,

    /**
     * If this {@code AbstractContainer} is to be visible, then {@code true}
     * or {@code false} if this instance is to be hidden or not rendered at
     * all.
     */
    visible?: ?boolean
};

/**
 * Abstract (base) class for container of React {@link Component} children with
 * a style.
 *
 * @augments Component
 */
export default class AbstractContainer<P: Props> extends Component<P> {
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
    _render(type, props?: P) {
        const {
            children,
            style,

            /* eslint-disable no-unused-vars */

            // The following properties are defined for the benefit of
            // AbstractContainer and its extenders so they are to not be
            // propagated.
            touchFeedback,
            visible,

            /* eslint-enable no-unused-vars */

            ...filteredProps
        } = props || this.props;

        const _style = getFixedPlatformStyle(style);

        // $FlowFixMe
        return React.createElement(type, {
            style: _style,
            ...filteredProps
        }, children);
    }
}
