import React, { Component } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { TINTED_VIEW_DEFAULT } from './styles';

/**
 * Base style for the {@code TintedView} component.
 */
const BASE_STYLE = {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center'
};

/**
 * {@code TintedView}'s React {@code Component} prop types.
 */
interface IProps {

    /**
     * The children components of this component.
     */
    children?: React.ReactNode;

    /**
     * Style to override the base style.
     */
    style?: Object;
}

/**
 * Implements a component aimed at covering another view and tinting it with
 * the given color and opacity.
 */
export default class TintedView extends Component<IProps> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { children, style } = this.props;

        // XXX Don't tint the children, tint the background only.
        return (
            <View
                pointerEvents = 'box-none'
                style = { BASE_STYLE as ViewStyle }>
                <View
                    pointerEvents = 'none'
                    style = { [
                        BASE_STYLE,
                        TINTED_VIEW_DEFAULT,
                        style
                    ] } />
                <View
                    pointerEvents = 'box-none'
                    style = { BASE_STYLE as ViewStyle }>
                    { children }
                </View>
            </View>
        );
    }
}
