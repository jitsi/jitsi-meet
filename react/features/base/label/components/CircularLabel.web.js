// @flow

import React, { Component } from 'react';

type Props = {

    /**
     * The children to be displayed within {@code CircularLabel}.
     */
    children: React$Node,

    /**
     * Additional CSS class names to add to the root of {@code CircularLabel}.
     */
    className: string,

    /**
     * HTML ID attribute to add to the root of {@code CircularLabel}.
     */
    id: string

};

/**
 * React Component for showing short text in a circle.
 *
 * @extends Component
 */
export default class CircularLabel extends Component<Props> {
    /**
     * Default values for {@code CircularLabel} component's properties.
     *
     * @static
     */
    static defaultProps = {
        className: ''
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            children,
            className,
            id
        } = this.props;

        return (
            <div
                className = { `circular-label ${className}` }
                id = { id }>
                { children }
            </div>
        );
    }
}
