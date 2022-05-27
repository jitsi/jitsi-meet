/* @flow */

import React, { Component } from 'react';
import { Text, TouchableOpacity } from 'react-native';

type Props = {

    /**
     * React Elements to display within the component.
     */
    children: React$Node | Object,

    /**
     * Handler called when the user presses the button.
     */
    onValueChange: Function,

    /**
     * The component's external style.
     */
    style: Object
};

/**
 * Renders a button.
 */
export default class ButtonImpl extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}, renders the button.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <TouchableOpacity
                onPress = { this.props.onValueChange } >
                <Text style = { this.props.style }>
                    { this.props.children }
                </Text>
            </TouchableOpacity>
        );
    }
}
