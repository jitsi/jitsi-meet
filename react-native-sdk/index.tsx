/* eslint-disable lines-around-comment,  no-undef, no-unused-vars  */

import 'react-native-gesture-handler';
// Apply all necessary polyfills as early as possible
// to make sure anything imported henceforth sees them.
import 'react-native-get-random-values';
import './react/features/mobile/polyfills';

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, ViewStyle } from 'react-native';

import { appNavigate } from './react/features/app/actions.native';
import { App } from './react/features/app/components/App.native';
import { setAudioMuted, setVideoMuted } from './react/features/base/media/actions';
import JitsiThemePaperProvider from './react/features/base/ui/components/JitsiThemeProvider.native';


interface IUrl {
    domain: string;
    jwt: string;
    roomName: string;
}

interface IUserInfo {
    avatarURL: string;
    displayName: string;
    email: string;
}

interface IAppProps {
    flags: object;
    meetingOptions: {
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
        url: IUrl;
        userInfo: IUserInfo;
    };
    style?: Object;
}

/**
 * Main React Native SDK component that displays a Jitsi Meet conference and gets all required params as props
 */
export const JitsiMeeting = forwardRef(({ flags, meetingOptions, style }: IAppProps, ref) => {
    const [ appProps, setAppProps ] = useState({});
    const app = useRef(null);

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
            const urlJwt = meetingOptions.url.jwt ? `?jwt=${meetingOptions.url.jwt}` : '';
            const url = `${meetingOptions.url.domain}/${meetingOptions.url.roomName}${urlJwt}`;

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
                'flags': { ...flags },
                'userInfo': {
                    ...meetingOptions.userInfo
                }
            });
        }, []
    );

    return (
        <View style = { style as ViewStyle }>
            <JitsiThemePaperProvider>
                <App
                    { ...appProps }
                    ref = { app } />
            </JitsiThemePaperProvider>
        </View>
    );
});
