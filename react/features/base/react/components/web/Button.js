/* @flow */

import Button from '@atlaskit/button';
import React, { Component } from 'react';

type Props = {

    /**
     * React Elements to display within the component.
     */
    children: React$Node | Object,

    /**
     * Handler called when the user presses the button.
     */
    onValueChange: Function
};

/**
 * Renders a button.
 */
export default class ButtonImpl extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { onValueChange } = this.props;

        return (
            <Button
                appearance = 'primary'
                onClick = { onValueChange }
                type = 'button'>
                { this.props.children }
            </Button>
        );
    }
}
