// @flow

// FIXME The bundler-related (and the browser-related) polyfills were born at
// the very early days of prototyping the execution of lib-jitsi-meet on
// react-native. Today, the feature base/lib-jitsi-meet should not be
// responsible for such polyfills because it is not the only feature relying on
// them. Additionally, the polyfills are usually necessary earlier than the
// execution of base/lib-jitsi-meet (which is understandable given that the
// polyfills are globals). The remaining problem to be solved here is where to
// collect the polyfills' files.
import './features/base/lib-jitsi-meet/native/polyfills-bundler';

import React, { PureComponent } from 'react';
import { AppRegistry } from 'react-native';

import { App } from './features/app';
import { IncomingCallApp } from './features/mobile/incoming-call';

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
 * @extends Component
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
            <App
                { ...this.props } />
        );
    }
}

// Register the main/root Component of JitsiMeetView.
AppRegistry.registerComponent('App', () => Root);

// Register the main/root Component of IncomingCallView.
AppRegistry.registerComponent('IncomingCallApp', () => IncomingCallApp);
