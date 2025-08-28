// NB: This import must always come first.
import './bootstrap.native';

import React, { PureComponent } from 'react';
import { AppRegistry } from 'react-native';

import { App } from './features/app/components/App.native';
import { _initLogging } from './features/base/logging/functions';

/**
 * React Native doesn't support specifying props to the main/root component (in
 * the JS/JSX source code). So create a wrapper React Component (class) around
 * features/app's App instead.
 *
 * @augments Component
 */
class Root extends PureComponent {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <App { ...this.props } />
        );
    }
}

// Initialize logging.
_initLogging();

// Register the main/root Component of JitsiMeetView.
AppRegistry.registerComponent('App', () => Root);
