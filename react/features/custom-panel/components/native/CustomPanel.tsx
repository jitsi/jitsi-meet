import React, { useCallback } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getCurrentConference } from '../../../base/conference/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import { buildCustomPanelUri, getCustomPanelUrl } from '../../functions.native';

const styles = StyleSheet.create({
    backDrop: {
        flex: 1
    },
    loadingWrapper: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
    },
    webView: {
        flex: 1
    }
});

/**
 * The Copilot screen — renders the advisor web app in a WebView.
 *
 * The WebView is created on open and destroyed on close / meeting-end, like the
 * web iframe. Persistent storage stays ON (`incognito={false}` +
 * `domStorageEnabled`) so the advisor restores from its own localStorage on
 * reopen. Closing is handled by navigation (the header close button); there is
 * no WebView↔native messaging.
 *
 * @returns {JSX.Element | null}
 */
const CustomPanel = (): JSX.Element | null => {
    const url = useSelector(getCustomPanelUrl);
    const jwt = useSelector((state: IReduxState) => state['features/base/jwt'].jwt);
    const meetingId = useSelector((state: IReduxState) => getCurrentConference(state)?.getMeetingUniqueId());
    const uri = buildCustomPanelUri(url, jwt, meetingId);

    const renderLoading = useCallback(() => (
        <View style = { styles.loadingWrapper as ViewStyle }>
            <LoadingIndicator size = 'large' />
        </View>
    ), []);

    if (!uri) {
        return null;
    }

    return (
        <JitsiScreen style = { styles.backDrop }>
            <WebView
                domStorageEnabled = { true }
                incognito = { false }
                renderLoading = { renderLoading }
                source = {{ uri }}
                startInLoadingState = { true }
                style = { styles.webView as ViewStyle }
                webviewDebuggingEnabled = { true } />
        </JitsiScreen>
    );
};

export default CustomPanel;
