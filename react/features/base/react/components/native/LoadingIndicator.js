/* @flow */

import React, { Component } from 'react';
import { ActivityIndicator } from 'react-native';

import { ColorPalette } from '../../../styles';

/**
 * An animated, large react-native {@link ActivityIndicator} which is considered
 * a suitable visualization of long-running processes with indeterminate amounts
 * of work to be done.
 */
export default class LoadingIndicator extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ActivityIndicator
                animating = { true }
                color = { ColorPalette.white }
                size = { 'large' }
                { ...this.props } />
        );
    }
}
