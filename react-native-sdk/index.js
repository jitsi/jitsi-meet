import 'react-native-gesture-handler';

// Apply all necessary polyfills as early as possible to make sure anything imported henceforth
// sees them.
import 'react-native-get-random-values';
import './react/features/mobile/polyfills';
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { View } from 'react-native';

// eslint-disable-next-line no-unused-vars
import { App } from './react/features/app/components/App.native';
// eslint-disable-next-line no-unused-vars
import JitsiThemePaperProvider from './react/features/base/ui/components/JitsiThemeProvider';


/**
 * Main React Native SDK component that displays a Jitsi Meet conference and gets all required params as props
 */
export default function JitsiMeetView(props) {
    const [ appProps, setAppProps ] = useState({});

    /**
     * Executes the onLeave callback passed from props as well as setting the props to an empty object
     */
    function onLeave() {
        setAppProps({});
        props.onLeave();
    }
    useEffect(
        () => {
            setAppProps({ 'url': props.url,
                'onLeave': onLeave });
        }, []
    );

    return (
        <View style={{ width: '100%',
            height: '100%' }}>
            <JitsiThemePaperProvider>
                <App
                    {...appProps} />
            </JitsiThemePaperProvider>
        </View>
    );
}
