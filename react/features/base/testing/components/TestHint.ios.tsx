import React, { Component } from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';

import { TestHintProps, _mapStateToProps } from './AbstractTestHint';

/**
 * This is the iOS version of the TestHint.
 *
 * Be sure to check the description in TestHint.android and AbstractTestHint
 * files to understand what a test hint is and why different iOS and Android
 * components are necessary.
 */
class TestHint extends Component<TestHintProps> {
    /**
     *  Renders the test hint on Android.
     *
     * @returns {ReactElement}
     */
    render() {
        if (!this.props._testModeEnabled) {
            return null;
        }

        return (
            <Text
                accessibilityLabel = { this.props.value }
                onPress = { this.props.onPress }
                testID = { this.props.id } />
        );
    }
}

export default connect(_mapStateToProps)(TestHint);
