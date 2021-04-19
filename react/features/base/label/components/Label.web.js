// @flow

import React from 'react';

import Icon from '../../icons/components/Icon';

import AbstractLabel, {
    type Props as AbstractProps
} from './AbstractLabel';

type Props = AbstractProps & {

    /**
     * Additional CSS class names to add to the root of {@code Label}.
     */
    className: string,

    /**
     * HTML ID attribute to add to the root of {@code Label}.
     */
    id: string

};

/**
 * React Component for showing short text in a circle.
 *
 * @extends Component
 */
export default class Label extends AbstractLabel<Props, *> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            className,
            icon,
            id,
            text
        } = this.props;

        const labelClassName = icon ? 'label-text-with-icon' : '';

        return (
            <div
                className = { `label ${className}` }
                id = { id }>
                { icon && <Icon
                    size = '16'
                    src = { icon } /> }
                { text && <span className = { labelClassName }>{text}</span> }
            </div>
        );
    }
}
