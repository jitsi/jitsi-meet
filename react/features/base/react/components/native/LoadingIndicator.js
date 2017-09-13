/* @flow */

import React, { Component } from 'react';
import { ActivityIndicator } from 'react-native';

/**
 * Simple wrapper around React Native's {@code ActivityIndicator}, which
 * displays an animated (large) loading indicator.
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
                size = { 'large' } />
        );
    }
}
