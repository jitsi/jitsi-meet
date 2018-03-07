/* @flow */

import React, { Component } from 'react';
import { Text } from 'react-native';

import type { TestHintProps } from './AbstractTestHint';

/**
 * This is the iOS version of the TestHint.
 *
 * Be sure to check the description in TestHint.android and AbstractTestHint
 * files to understand what a test hint is and why different iOS and Android
 * components are necessary.
 */
export default class TestHint extends Component<TestHintProps> {
    /**
     *  Renders the test hint on Android.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <Text
                accessibilityLabel = { this.props.value }
                testID = { this.props.id } />
        );
    }
}
