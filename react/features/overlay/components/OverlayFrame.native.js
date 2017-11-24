// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { overlayFrame as styles } from './styles';

/**
 * The type of the React {@code Component} props of {@code OverlayFrame}.
 */
type Props = {

    /**
     * The children components to be displayed into the overlay frame.
     */
    children?: React$Node,
};

/**
 * Implements a React component to act as the frame for overlays.
 */
export default class OverlayFrame extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        return (
            <View style = { styles.container }>
                { this.props.children }
            </View>
        );
    }
}
