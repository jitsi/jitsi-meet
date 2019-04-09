/* @flow */

import React, { Component } from 'react';
import { ActivityIndicator } from 'react-native';

import { ColorPalette } from '../../../styles';

type Props = {

    /**
     * The color of the spinner.
     */
    color: ?string,

    /**
     * Prop to set the size of the indicator. This is the same as the
     * prop of the native component.
     */
    size: 'large' | 'small'
};

/**
 * An animated, large react-native {@link ActivityIndicator} which is considered
 * a suitable visualization of long-running processes with indeterminate amounts
 * of work to be done.
 */
export default class LoadingIndicator extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { color = ColorPalette.white } = this.props;
        let { size = 'large' } = this.props;

        if (size === 'medium') {
            size = 'large';
        }

        const props = {
            animating: true,
            color,
            ...this.props,
            size
        };

        return (
            <ActivityIndicator
                animating = { true }
                { ...props }
                size = { size } />
        );
    }
}
