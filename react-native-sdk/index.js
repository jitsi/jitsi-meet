import 'react-native-gesture-handler';

// Apply all necessary polyfills as early as possible to make sure anything imported henceforth
// sees them.
import 'react-native-get-random-values';
import './react/features/mobile/polyfills';
// eslint-disable-next-line no-unused-vars
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
        onConferenceJoined?: Function;
        onConferenceWillJoin?: Function;
        onConferenceLeft?: Function;
        settings?: {
            startWithAudioMuted?: boolean;
            startAudioOnly?: boolean;
            startWithVideoMuted?: boolean;
        }
    }
};

/**
 * Main React Native SDK component that displays a Jitsi Meet conference and gets all required params as props
 */
const JitsiMeeting = forwardRef((props: AppProps, ref) => {
    const [ appProps, setAppProps ] = useState({});
    const app = useRef(null);

    // eslint-disable-next-line arrow-body-style
    useImperativeHandle(ref, () => ({
        close: () => {
            const dispatch = app.current.state.store.dispatch;

            closeJitsiMeeting(dispatch);
        }
    }));

    useEffect(
        () => {
            const url = convertPropsToURL(props.meetingOptions.domain, props.meetingOptions.roomName);

            setAppProps({
                'url': {
                    url,
                    config: props.meetingOptions.settings
                },
                'rnSdkHandlers': {
                    onReadyToClose: props.meetingOptions.onReadyToClose,
                    onConferenceJoined: props.meetingOptions.onConferenceJoined,
                    onConferenceWillJoin: props.meetingOptions.onConferenceWillJoin,
                    onConferenceLeft: props.meetingOptions.onConferenceLeft
                },
                'flags': { ...props.flags }
            });
        }, []
    );


    return (
        <View style={props.style}>
            <JitsiThemePaperProvider>
                <App
                    {...appProps} ref={app} />
            </JitsiThemePaperProvider>
        </View>
    );
});

export default JitsiMeeting;
