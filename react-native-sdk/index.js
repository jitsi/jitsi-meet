import 'react-native-gesture-handler';

// Apply all necessary polyfills as early as possible to make sure anything imported henceforth
// sees them.
import 'react-native-get-random-values';
import './react/features/mobile/polyfills';
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { View } from 'react-native';


// eslint-disable-next-line no-unused-vars
import { App } from './react/features/app/components/App.native';
// eslint-disable-next-line no-unused-vars
import JitsiThemePaperProvider from './react/features/base/ui/components/JitsiThemeProvider';
import { closeJitsiMeeting } from './react/features/mobile/react-native-sdk/functions';
import { convertPropsToURL } from './utils';


type AppProps = {
    flags: [];
    meetingOptions: {
        domain: string;
        roomName: string;
        onReadyToClose?: Function;
        settings?: {
            startWithAudioMuted?: boolean;
            startAudioOnly?: boolean;
            startWithVideoMuted?: boolean;
            startWithReactionsMuted?: boolean;
        }
    }
};

/**
 * Main React Native SDK component that displays a Jitsi Meet conference and gets all required params as props
 */
const JitsiMeetView = forwardRef((props: AppProps, ref) => {
    const [ appProps, setAppProps ] = useState({});
    const app = useRef(null);

    // eslint-disable-next-line arrow-body-style
    useImperativeHandle(ref, () => ({
        close: () => {
            const dispatch = app.current.state.store.dispatch;

            closeJitsiMeeting(dispatch);
        }
    }));

    /**
     * Executes the onLeave callback passed from props as well as setting the props to an empty object
     */
    function onReadyToClose() {
        setAppProps({});
        props.meetingOptions.onReadyToClose();
    }
    useEffect(
        () => {
            const url = convertPropsToURL(props.meetingOptions.domain, props.meetingOptions.roomName);

            setAppProps({ 'url': url,
                'onReadyToClose': onReadyToClose,
                'flags': props.flags,
                'settings': props.meetingOptions.settings
            });
        }, []
    );


    return (
        <View style={{ width: props.width,
            height: props.height }}>
            <JitsiThemePaperProvider>
                <App
                    {...appProps} ref={app} />
            </JitsiThemePaperProvider>
        </View>
    );
});

export default JitsiMeetView;
