import React, { Component } from 'react';

import UISwitch from '../../../ui/components/web/Switch';

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
     * ID of the toggle.
     */
    id: string,

    /**
     * Handler called when the user presses the switch.
     */
    onValueChange: (checked?: boolean) => void,

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
            id,
            ...props
        } = this.props;

        return (
            <div className = { className }>
                <UISwitch
                    checked = { value }
                    disabled = { disabled }
                    id = { id }
                    onChange = { onValueChange }
                    { ...props } />
            </div>
        );
    }
}
