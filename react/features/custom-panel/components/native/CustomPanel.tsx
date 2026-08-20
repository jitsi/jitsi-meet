import React, { useCallback } from 'react';
import { View, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getCurrentConference } from '../../../base/conference/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import { buildCustomPanelUri, getCustomPanelUrl } from '../../functions.native';

import styles from './styles';

/**
 * Renders the advisor web app in a WebView, themed to the OS setting and loaded only with a JWT.
 *
 * @returns {JSX.Element | null}
 */
const CustomPanel = (): JSX.Element | null => {
    const url = useSelector(getCustomPanelUrl);
    const jwt = useSelector((state: IReduxState) => state['features/base/jwt'].jwt);
    const meetingId = useSelector((state: IReduxState) => getCurrentConference(state)?.getMeetingUniqueId());
    const theme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const uri = buildCustomPanelUri(url, jwt, meetingId, theme);
    const backgroundStyle = theme === 'dark' ? styles.darkBackground : styles.lightBackground;

    const renderLoading = useCallback(() => (
        <View style = { [ styles.loadingWrapper, backgroundStyle ] }>
            <LoadingIndicator size = 'large' />
        </View>
    ), [ backgroundStyle ]);

    if (!uri) {
        return null;
    }

    return (
        <JitsiScreen style = { [ styles.backDrop, backgroundStyle ] }>
            <WebView
                domStorageEnabled = { true }
                incognito = { false }
                renderLoading = { renderLoading }
                source = {{ uri }}
                startInLoadingState = { true }
                style = { [ styles.webView, backgroundStyle ] }
                webviewDebuggingEnabled = { true } />
        </JitsiScreen>
    );
};

export default CustomPanel;
