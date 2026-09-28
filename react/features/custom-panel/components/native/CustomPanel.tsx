import React, { useCallback } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getCurrentConference } from '../../../base/conference/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import { useCustomPanelApi } from '../../api.native';
import { buildCustomPanelUrl, getCustomPanelOrigin, getCustomPanelUrl, onError } from '../../functions.native';

import styles from './styles';

/**
 * Renders the advisor web app in a WebView, loaded only with a JWT.
 *
 * @param {Object} props - Component's props.
 * @param {Object} props.navigation - Default prop for navigating between screen components (React Navigation).
 * @returns {JSX.Element | null}
 */
const CustomPanel = ({ navigation }: { navigation: { isFocused: () => boolean; }; }): JSX.Element | null => {
    const baseUrl = useSelector(getCustomPanelUrl);
    const jwt = useSelector((state: IReduxState) => state['features/base/jwt'].jwt);
    const meetingId = useSelector((state: IReduxState) => getCurrentConference(state)?.getMeetingUniqueId());
    const fullUrl = buildCustomPanelUrl(baseUrl, jwt, meetingId);
    const origin = getCustomPanelOrigin(baseUrl);
    const { onMessage, webViewRef } = useCustomPanelApi(fullUrl, navigation);

    const renderLoading = () => (
        <View style = { styles.loadingWrapper }>
            <LoadingIndicator size = 'large' />
        </View>
    );

    const onShouldStartLoadWithRequest = useCallback((request: { url: string; }) =>
        getCustomPanelOrigin(request.url) === origin
    , [ origin ]);

    if (!fullUrl) {
        return null;
    }

    return (
        <JitsiScreen style = { styles.backDrop }>
            <WebView
                // Deliberately not incognito, so the advisor restores its session
                // from storage on reopen. The token-bearing URL and its cookies/storage persist too.
                incognito = { false }
                nestedScrollEnabled = { true }
                onError = { onError }
                onMessage = { onMessage }
                onShouldStartLoadWithRequest = { onShouldStartLoadWithRequest }
                originWhitelist = { [ origin ] }
                ref = { webViewRef }
                renderLoading = { renderLoading }
                setSupportMultipleWindows = { false }
                source = {{ uri: fullUrl }}
                startInLoadingState = { true }
                style = { styles.webView }
                webviewDebuggingEnabled = { __DEV__ } />
        </JitsiScreen>
    );
};

export default CustomPanel;
