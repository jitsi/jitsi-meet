// NB: This import must always come first.
import './bootstrap.native';

import React, { PureComponent } from 'react';
import {AppRegistry, Platform} from 'react-native';
import notifee, { EventType } from '@notifee/react-native';

import { App } from './features/app/components/App.native';
import logger from './features/app/logger';
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

if (Platform.OS === 'android') {

    // Needs to be registered outside any React components as early as possible
    notifee.registerForegroundService(() => {
        return new Promise(() => {
            logger.warn('Foreground service running');

            notifee.onBackgroundEvent( event => {
                if (event.type === EventType.ACTION_PRESS && event.detail.pressAction.id === 'hang-up') {
                    console.log('HANG UP BUTTON PRESSED BACKGROUND');
                }
            });

            notifee.onForegroundEvent( ({ type, detail }) => {
                if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'hang-up') {
                    console.log('HANG UP BUTTON PRESSED');
                }
            });
        });
    });
}

// Register the main/root Component of JitsiMeetView.
AppRegistry.registerComponent('App', () => Root);
