/* eslint-disable lines-around-comment,  no-undef, no-unused-vars  */

import 'react-native-gesture-handler';
// Apply all necessary polyfills as early as possible
// to make sure anything imported henceforth sees them.
import 'react-native-get-random-values';
import './react/features/mobile/polyfills';

// @ts-ignore
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';

import { appNavigate } from './react/features/app/actions.native';
import { App } from './react/features/app/components/App.native';
import { setAudioMuted, setVideoMuted } from './react/features/base/media/actions';
// @ts-ignore
import JitsiThemePaperProvider from './react/features/base/ui/components/JitsiThemeProvider.native';


interface IAppProps {
    flags: [];
    meetingOptions: {
        domain: string;
        roomName: string;
        onReadyToClose?: Function;
        onConferenceJoined?: Function;
        onConferenceWillJoin?: Function;
        onConferenceLeft?: Function;
        onParticipantJoined?: Function;
        settings?: {
            startWithAudioMuted?: boolean;
            startAudioOnly?: boolean;
            startWithVideoMuted?: boolean;
        }
    };
    style?: Object;
}

/**
 * Main React Native SDK component that displays a Jitsi Meet conference and gets all required params as props
 */
export const JitsiMeeting = forwardRef(({ flags, meetingOptions, style }: IAppProps, ref) => {
    const [ appProps, setAppProps ] = useState({});
    const app = useRef(null);

    // eslint-disable-next-line arrow-body-style
    useImperativeHandle(ref, () => ({
        close: () => {
            const dispatch = app.current.state.store.dispatch;

            dispatch(appNavigate(undefined));
        },
        setAudioMuted: muted => {
            const dispatch = app.current.state.store.dispatch;

            dispatch(setAudioMuted(muted));
        },
        setVideoMuted: muted => {
            const dispatch = app.current.state.store.dispatch;

            dispatch(setVideoMuted(muted));
        }
    }));

    useEffect(
        () => {
            const url = `${meetingOptions.domain}/${meetingOptions.roomName}`;

            setAppProps({
                'url': {
                    url,
                    config: meetingOptions.settings
                },
                'rnSdkHandlers': {
                    onReadyToClose: meetingOptions.onReadyToClose,
                    onConferenceJoined: meetingOptions.onConferenceJoined,
                    onConferenceWillJoin: meetingOptions.onConferenceWillJoin,
                    onConferenceLeft: meetingOptions.onConferenceLeft,
                    onParticipantJoined: meetingOptions.onParticipantJoined
                },
                'flags': { ...flags }
            });
        }, []
    );

    return (
        <View style = { style }>
            <JitsiThemePaperProvider>
                {/* @ts-ignore */}
                <App
                    { ...appProps }
                    ref = { app } />
            </JitsiThemePaperProvider>
        </View>
    );
});
