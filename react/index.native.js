// @flow

// https://github.com/software-mansion/react-native-gesture-handler/issues/320#issuecomment-443815828
import 'react-native-gesture-handler';

// Apply all necessary polyfills as early as possible to make sure anything imported henceforth
// sees them.
import 'react-native-get-random-values';
import './features/mobile/polyfills';

import React, { PureComponent } from 'react';
import { AppRegistry } from 'react-native';

import { App } from './features/app/components';
import { _initLogging } from './features/base/logging/functions';
import JitsiThemePaperProvider from './features/base/ui/components/JitsiThemeProvider';

/**
 * The type of the React {@code Component} props of {@link Root}.
 */
type Props = {

    /**
     * The URL, if any, with which the app was launched.
     */
    url: Object | string
};

/**
 * React Native doesn't support specifying props to the main/root component (in
 * the JS/JSX source code). So create a wrapper React Component (class) around
 * features/app's App instead.
 *
 * @augments Component
 */
class Root extends PureComponent<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <JitsiThemePaperProvider>
                <App
                    { ...this.props } />
            </JitsiThemePaperProvider>
        );
    }
}

// Initialize logging.
_initLogging();

// Register the main/root Component of JitsiMeetView.
AppRegistry.registerComponent('App', () => Root);
