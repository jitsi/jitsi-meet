// @flow

import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';

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
type Props = {

    /**
     * The children components of this component.
     */
    children?: React$Node,

    /**
     * Style to override the base style.
     */
    style: Object
};

/**
 * Implements a component aimed at covering another view and tinting it with
 * the given color and opacity.
 */
export default class TintedView extends Component<Props> {
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
                style = { BASE_STYLE }>
                <View
                    pointerEvents = 'none'
                    style = { [
                        BASE_STYLE,
                        TINTED_VIEW_DEFAULT,
                        style
                    ] } />
                <View
                    pointerEvents = 'box-none'
                    style = { BASE_STYLE }>
                    { children }
                </View>
            </View>
        );
    }
}
