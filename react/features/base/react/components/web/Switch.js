/* @flow */

import { ToggleStateless } from '@atlaskit/toggle';
import React, { Component } from 'react';

type Props = {

    /**
     * CSS class name.
     */
    className: string,

    /**
     * Indicates whether the switch is disabled or not.
     */
    disabled: boolean,

    /**
     * Handler called when the user presses the switch.
     */
    onValueChange: Function,

    /**
     * The current value.
     */
    value: boolean
};

/**
 * Renders a boolean input.
 */
export default class Switch extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            className,
            disabled,
            onValueChange,
            value,
            ...props
        } = this.props;

        // TODO: onChange will be called with parameter Event. It will be good
        // if we translate it to calling the onValueChange with the value as a
        // parameter to match the native implementation.

        return (
            <div className = { className }>
                <ToggleStateless
                    isChecked = { value }
                    isDisabled = { disabled }
                    onChange = { onValueChange }
                    { ...props } />
            </div>
        );
    }
}
