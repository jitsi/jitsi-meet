/* eslint-disable react/jsx-no-bind */
import { Route } from '@react-navigation/native';
import React, {useCallback} from 'react';
import { WithTranslation } from 'react-i18next';
import { Linking, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { useStore } from 'react-redux';

import { appNavigate } from '../../../app/actions.native';
import { getCurrentConferenceUrl } from '../../../base/connection/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';

import styles, { INDICATOR_COLOR } from './styles';


interface IProps extends WithTranslation {

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    route: Route<'', { tokenAuthServiceUrl: string; }>;
}

const AuthenticationPage: React.FunctionComponent<IProps> = ({ route }: IProps) => {

    const { dispatch, getState } = useStore();
    const tokenAuthServiceUrl = route.params?.tokenAuthServiceUrl;
    const renderLoading = () => (
        <View style = { styles.indicatorWrapper as ViewStyle }>
            <LoadingIndicator
                color = { INDICATOR_COLOR }
                size = 'large' />
        </View>
    );

    const onNavigationStateChange = useCallback((webViewState: any) => {
        const state = getState();

        if (webViewState.url.includes('google')) {
            Linking.openURL(webViewState.url);
        } else if (webViewState.url.includes('facebook')) {
            Linking.openURL(webViewState.url);
        } else if (webViewState.url.includes('github')) {
            Linking.openURL(webViewState.url)
        } else if (webViewState.url.includes('jwt')) {
            dispatch(appNavigate(getCurrentConferenceUrl(state)))
        }
    }, [])

    return (
        <JitsiScreen
            style = { styles.backDrop }>
            <WebView
                onNavigationStateChange = { onNavigationStateChange }
                renderLoading = { renderLoading }
                setSupportMultipleWindows = { false }
                source = {{ uri: tokenAuthServiceUrl }}
                startInLoadingState = { true }
                style = { styles.webView } />
        </JitsiScreen>
    );
};

export default AuthenticationPage;
