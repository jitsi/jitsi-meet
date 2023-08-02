/* eslint-disable lines-around-comment,  no-undef, no-unused-vars  */

// NB: This import must always come first.
import './react/bootstrap.native';

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState
} from 'react';
import { View, ViewStyle } from 'react-native';

import { appNavigate } from './react/features/app/actions.native';
import { App } from './react/features/app/components/App.native';
import { setAudioMuted, setVideoMuted } from './react/features/base/media/actions';


interface IEventListeners {
    onConferenceBlurred?: Function;
    onConferenceFocused?: Function;
    onConferenceJoined?: Function;
    onConferenceLeft?: Function;
    onConferenceWillJoin?: Function;
    onEnterPictureInPicture?: Function;
    onParticipantJoined?: Function;
    onReadyToClose?: Function;
}

interface IUserInfo {
    avatarURL: string;
    displayName: string;
    email: string;
}

interface IAppProps {
    config: object;
    eventListeners?: IEventListeners;
    flags?: object;
    room: string;
    serverURL?: string;
    style?: Object;
    token?: string;
    userInfo?: IUserInfo;
}

/**
 * Main React Native SDK component that displays a Jitsi Meet conference and gets all required params as props
 */
export const JitsiMeeting = forwardRef((props: IAppProps, ref) => {
    const [ appProps, setAppProps ] = useState({});
    const app = useRef(null);
    const {
        config,
        eventListeners,
        flags,
        room,
        serverURL,
        style,
        token,
        userInfo
    } = props;

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
            const urlObj = {
                config,
                jwt: token
            };

            let urlProps;

            if (room.includes('://')) {
                urlProps = {
                    ...urlObj,
                    url: room
                };
            } else {
                urlProps = {
                    ...urlObj,
                    room,
                    serverURL
                };
            }

            setAppProps({
                'flags': flags,
                'rnSdkHandlers': {
                    onConferenceBlurred: eventListeners?.onConferenceBlurred,
                    onConferenceFocused: eventListeners?.onConferenceFocused,
                    onConferenceJoined: eventListeners?.onConferenceJoined,
                    onConferenceWillJoin: eventListeners?.onConferenceWillJoin,
                    onConferenceLeft: eventListeners?.onConferenceLeft,
                    onEnterPictureInPicture: eventListeners?.onEnterPictureInPicture,
                    onParticipantJoined: eventListeners?.onParticipantJoined,
                    onReadyToClose: eventListeners?.onReadyToClose
                },
                'url': urlProps,
                'userInfo': userInfo
            });
        }, []
    );

    // eslint-disable-next-line arrow-body-style
    useLayoutEffect(() => {
        /**
         * When you close the component you need to reset it.
         * In some cases it needs to be added as the parent component may have been destroyed.
         * Without this change the call remains active without having the jitsi screen.
        */
        return () => {
            const dispatch = app.current?.state?.store?.dispatch;

            dispatch && dispatch(appNavigate(undefined));
        };
    }, []);

    return (
        <View style = { style as ViewStyle }>
            <App
                { ...appProps }
                ref = { app } />
        </View>
    );
});
