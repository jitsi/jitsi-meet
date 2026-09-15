import React, { useCallback } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getCurrentConference } from '../../../base/conference/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import { buildCustomPanelUri, getCustomPanelUrl } from '../../functions.native';

import styles from './styles';

/**
 * Renders the advisor web app in a WebView, always dark themed, loaded only with a JWT.
 *
 * @returns {JSX.Element | null}
 */
const CustomPanel = (): JSX.Element | null => {
    const url = useSelector(getCustomPanelUrl);
    const jwt = useSelector((state: IReduxState) => state['features/base/jwt'].jwt);
    const meetingId = useSelector((state: IReduxState) => getCurrentConference(state)?.getMeetingUniqueId());
    const uri = buildCustomPanelUri(url, jwt, meetingId);

    const renderLoading = useCallback(() => (
        <View style = { styles.loadingWrapper }>
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
                style = { styles.webView }
                webviewDebuggingEnabled = { __DEV__ } />
        </JitsiScreen>
    );
};

export default CustomPanel;
