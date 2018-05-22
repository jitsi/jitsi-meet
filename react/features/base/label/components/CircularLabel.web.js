// @flow

import React from 'react';

import AbstractCircularLabel, {
    type Props as AbstractProps
} from './AbstractCircularLabel';

type Props = AbstractProps & {

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
export default class CircularLabel extends AbstractCircularLabel<Props> {
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
            className,
            id,
            label
        } = this.props;

        return (
            <div
                className = { `circular-label ${className}` }
                id = { id }>
                { label }
            </div>
        );
    }
}
