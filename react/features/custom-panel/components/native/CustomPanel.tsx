import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getCurrentConference } from '../../../base/conference/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import { useCustomPanelApi } from '../../api.native';
import { buildCustomPanelUri, getCustomPanelOrigin, getCustomPanelUrl } from '../../functions.native';
import logger from '../../logger';

import styles from './styles';

/**
 * Renders the advisor web app in a WebView, loaded only with a JWT.
 *
 * @param {Object} props - Component's props.
 * @param {Object} props.navigation - Default prop for navigating between screen components (React Navigation).
 * @returns {JSX.Element | null}
 */
const CustomPanel = ({ navigation }: { navigation: { isFocused: () => boolean; }; }): JSX.Element | null => {
    const url = useSelector(getCustomPanelUrl);
    const jwt = useSelector((state: IReduxState) => state['features/base/jwt'].jwt);
    const meetingId = useSelector((state: IReduxState) => getCurrentConference(state)?.getMeetingUniqueId());
    const uri = buildCustomPanelUri(url, jwt, meetingId);
    const origin = useMemo(() => getCustomPanelOrigin(url), [ url ]);
    const source = useMemo(() => ({ uri }), [ uri ]);
    const { onMessage, webViewRef } = useCustomPanelApi(uri, navigation);

    const renderLoading = useCallback(() => (
        <View style = { styles.loadingWrapper }>
            <LoadingIndicator size = 'large' />
        </View>
    ), []);

    const onError = useCallback((event: any) => {
        logger.error('Failed to load the advisor', event.nativeEvent);
    }, []);

    const onShouldStartLoadWithRequest = useCallback((request: { url: string; }) =>
        getCustomPanelOrigin(request.url) === origin
    , [ origin ]);

    if (!uri) {
        return null;
    }

    return (
        <JitsiScreen style = { styles.backDrop }>
            <WebView
                domStorageEnabled = { true }
                incognito = { false }
                javaScriptEnabled = { true }
                nestedScrollEnabled = { true }
                onError = { onError }
                onMessage = { onMessage }
                onShouldStartLoadWithRequest = { onShouldStartLoadWithRequest }
                originWhitelist = { [ origin ] }
                ref = { webViewRef }
                renderLoading = { renderLoading }
                setSupportMultipleWindows = { false }
                source = { source }
                startInLoadingState = { true }
                style = { styles.webView }
                webviewDebuggingEnabled = { __DEV__ } />
        </JitsiScreen>
    );
};

export default CustomPanel;
